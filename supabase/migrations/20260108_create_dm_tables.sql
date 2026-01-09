-- Direct Messages Schema for LOYD-157
-- Enables 1:1 DMs between family group members with realtime support

-- ============================================================================
-- TABLES
-- ============================================================================

-- 1. Conversations container (scoped to family group)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Conversation participants with read tracking
CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (conversation_id, participant_id)
);

-- 3. Direct messages
CREATE TABLE direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  body TEXT NOT NULL,
  reply_to_id UUID REFERENCES direct_messages(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. DM reactions
CREATE TABLE dm_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES direct_messages(id) ON DELETE CASCADE,
  reactor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (message_id, reactor_id, emoji)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_conversations_group_id ON conversations(group_id);
CREATE INDEX idx_conv_participants_participant ON conversation_participants(participant_id);
CREATE INDEX idx_conv_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX idx_direct_messages_conversation ON direct_messages(conversation_id);
CREATE INDEX idx_direct_messages_created_at ON direct_messages(created_at DESC);
CREATE INDEX idx_dm_reactions_message ON dm_reactions(message_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_reactions ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view conversations they participate in"
  ON conversations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = conversations.id AND participant_id = auth.uid()
  ));

CREATE POLICY "Users can create conversations in their group"
  ON conversations FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = conversations.group_id AND member_id = auth.uid()
  ));

-- Conversation participants policies
CREATE POLICY "Users can view participants of their conversations"
  ON conversation_participants FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
    AND cp.participant_id = auth.uid()
  ));

CREATE POLICY "Users can add participants to conversations they created"
  ON conversation_participants FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id AND c.created_by = auth.uid()
  ) OR participant_id = auth.uid());

CREATE POLICY "Users can update their own participation"
  ON conversation_participants FOR UPDATE
  USING (participant_id = auth.uid());

-- Direct messages policies
CREATE POLICY "Users can view messages in their conversations"
  ON direct_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = direct_messages.conversation_id
    AND participant_id = auth.uid()
  ));

CREATE POLICY "Users can send messages to their conversations"
  ON direct_messages FOR INSERT
  WITH CHECK (author_id = auth.uid() AND EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = direct_messages.conversation_id
    AND participant_id = auth.uid()
  ));

-- DM reactions policies
CREATE POLICY "Users can view reactions in their conversations"
  ON dm_reactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM direct_messages dm
    JOIN conversation_participants cp ON cp.conversation_id = dm.conversation_id
    WHERE dm.id = dm_reactions.message_id AND cp.participant_id = auth.uid()
  ));

CREATE POLICY "Users can add reactions to messages in their conversations"
  ON dm_reactions FOR INSERT
  WITH CHECK (reactor_id = auth.uid() AND EXISTS (
    SELECT 1 FROM direct_messages dm
    JOIN conversation_participants cp ON cp.conversation_id = dm.conversation_id
    WHERE dm.id = dm_reactions.message_id AND cp.participant_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own reactions"
  ON dm_reactions FOR DELETE
  USING (reactor_id = auth.uid());

-- ============================================================================
-- REALTIME
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE dm_reactions;

-- Set Replica Identity FULL for DELETE payloads
ALTER TABLE direct_messages REPLICA IDENTITY FULL;
ALTER TABLE dm_reactions REPLICA IDENTITY FULL;

-- ============================================================================
-- PROFILE UPDATE (DM notification preference)
-- ============================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dm_notify_enabled BOOLEAN DEFAULT true;

-- ============================================================================
-- HELPER FUNCTION: Find existing conversation between two users
-- ============================================================================

CREATE OR REPLACE FUNCTION find_dm_conversation(
  user1_id UUID,
  user2_id UUID,
  p_group_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conversation_id UUID;
BEGIN
  SELECT c.id INTO conversation_id
  FROM conversations c
  JOIN conversation_participants cp1 ON cp1.conversation_id = c.id AND cp1.participant_id = user1_id
  JOIN conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.participant_id = user2_id
  WHERE c.group_id = p_group_id
  -- Ensure it's a 1:1 conversation (exactly 2 participants)
  AND (SELECT COUNT(*) FROM conversation_participants WHERE conversation_id = c.id) = 2
  LIMIT 1;

  RETURN conversation_id;
END;
$$;

-- ============================================================================
-- HELPER FUNCTION: Get unread counts for all conversations
-- ============================================================================

CREATE OR REPLACE FUNCTION get_dm_unread_counts(p_user_id UUID)
RETURNS TABLE (
  conversation_id UUID,
  unread_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cp.conversation_id,
    COUNT(dm.id)::BIGINT as unread_count
  FROM conversation_participants cp
  LEFT JOIN direct_messages dm ON dm.conversation_id = cp.conversation_id
    AND dm.created_at > cp.last_read_at
    AND dm.author_id != cp.participant_id
  WHERE cp.participant_id = p_user_id
  GROUP BY cp.conversation_id;
END;
$$;
