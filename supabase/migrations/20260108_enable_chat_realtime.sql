-- Enable Supabase Realtime for chat tables
-- This allows instant message delivery via websocket subscriptions

-- Enable realtime for group_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;

-- Enable realtime for message_reactions table
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;

-- Set Replica Identity FULL to get old values on UPDATE/DELETE events
-- This is needed for reaction deletion events to include the full payload
ALTER TABLE group_messages REPLICA IDENTITY FULL;
ALTER TABLE message_reactions REPLICA IDENTITY FULL;
