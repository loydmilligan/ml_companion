/**
 * TEST-001: Chat & DM Simulator
 *
 * Simulates chat messages, DMs, reactions, and social interactions
 * for comprehensive test coverage of the chat features.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// Test user IDs (must match seed-test-data)
const TEST_USER_IDS = [
  "00000000-0000-0000-0000-000000000001", // Test Admin
  "00000000-0000-0000-0000-000000000002", // Alice
  "00000000-0000-0000-0000-000000000003", // Bob
  "00000000-0000-0000-0000-000000000004", // Carol
  "00000000-0000-0000-0000-000000000005", // Uncle Dave
];

const TEST_GROUP_ID = "00000000-0000-0000-0001-000000000001";

// ============================================================================
// Message Templates
// ============================================================================

const NORMAL_MESSAGES = [
  "This round is going to be great!",
  "Who's ready to submit some bangers?",
  "I've been thinking about this theme all week",
  "Anyone else struggling to pick just one song?",
  "My submission this week is chef's kiss 👨‍🍳",
  "Can't wait to hear what everyone picked",
  "This theme is right up my alley",
  "I have too many good options for this one",
  "The playlist is going to be fire 🔥",
  "Ready to vote! Let's see what we got",
  "Some great picks this round",
  "That was a tough one to vote on",
  "Congrats to the winner!",
  "Great round everyone",
  "When's the next theme dropping?",
  "LOL at some of these picks",
  "I love this song so much",
  "This brings back memories",
  "Never heard this one before, adding to my playlist",
  "Classic choice!",
];

const SONG_MENTION_MESSAGES = [
  "Has anyone heard this? https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC",
  "This would've been perfect: https://open.spotify.com/track/7qiZfU4dY1lWllzX7mPBI3",
  "Check this out https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp",
  "Reminds me of this gem https://open.spotify.com/track/1BxfuPKGuaTgP7aM0Bbdwr",
];

const YOUTUBE_MESSAGES = [
  "Watch this live version: https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "The music video is so good https://youtu.be/kJQP7kiw5Fk",
  "Found this on YouTube https://www.youtube.com/watch?v=JGwWNGJdvx8",
  "This performance is amazing https://youtu.be/hTWKbfoikeg",
];

const QUOTE_REPLY_STARTERS = [
  "Totally agree!",
  "Haha yes exactly",
  "Wait what? 😂",
  "That's what I was thinking",
  "No way!",
  "Same here",
  "Couldn't have said it better",
  "This is so true",
];

const EMOJIS = ["❤️", "😂", "🔥", "👏", "🎵", "🎉", "👀", "💯", "🙌", "😍"];

// ============================================================================
// Helper Functions
// ============================================================================

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomUserId(excludeId?: string): string {
  const available = excludeId
    ? TEST_USER_IDS.filter((id) => id !== excludeId)
    : TEST_USER_IDS;
  return randomPick(available);
}

function log(message: string, data?: unknown) {
  console.log(`[ChatSimulator] ${message}`, data ? JSON.stringify(data) : "");
}

// ============================================================================
// Chat Message Simulation
// ============================================================================

export interface ChatSimulationOptions {
  messageType?: "normal" | "song_mention" | "youtube_link" | "quote_reply";
  authorId?: string;
  replyToMessageId?: string;
}

export interface ChatSimulationResult {
  success: boolean;
  action: string;
  messageId?: string;
  error?: string;
  timestamp: string;
}

/**
 * Simulate a chat message in the group chat.
 */
export async function simulateChatMessage(
  supabase: SupabaseClient,
  groupId: string,
  options: ChatSimulationOptions = {}
): Promise<ChatSimulationResult> {
  const authorId = options.authorId || randomUserId();
  const messageType = options.messageType || "normal";

  let body: string;
  let replyToId: string | null = null;

  switch (messageType) {
    case "song_mention":
      body = randomPick(SONG_MENTION_MESSAGES);
      break;
    case "youtube_link":
      body = randomPick(YOUTUBE_MESSAGES);
      break;
    case "quote_reply":
      // Need to find an existing message to reply to
      if (options.replyToMessageId) {
        replyToId = options.replyToMessageId;
      } else {
        const { data: recentMessages } = await supabase
          .from("group_messages")
          .select("id, body, author_id")
          .eq("group_id", groupId)
          .order("created_at", { ascending: false })
          .limit(10);

        if (recentMessages && recentMessages.length > 0) {
          // Pick a random message to reply to (not our own)
          const eligibleMessages = recentMessages.filter(
            (m) => m.author_id !== authorId
          );
          if (eligibleMessages.length > 0) {
            const targetMessage = randomPick(eligibleMessages);
            replyToId = targetMessage.id;
          }
        }
      }
      body = randomPick(QUOTE_REPLY_STARTERS);
      break;
    default:
      body = randomPick(NORMAL_MESSAGES);
  }

  log("Simulating chat message", { groupId, authorId, messageType });

  const { data, error } = await supabase
    .from("group_messages")
    .insert({
      group_id: groupId,
      author_id: authorId,
      body,
      reply_to_id: replyToId,
    })
    .select()
    .single();

  if (error) {
    return {
      success: false,
      action: "create_chat_message_failed",
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }

  return {
    success: true,
    action: "created_chat_message",
    messageId: data.id,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate multiple chat messages to simulate activity.
 */
export async function simulateChatBurst(
  supabase: SupabaseClient,
  groupId: string,
  count: number = 5
): Promise<ChatSimulationResult[]> {
  const results: ChatSimulationResult[] = [];

  for (let i = 0; i < count; i++) {
    // Vary the message types
    const types: ChatSimulationOptions["messageType"][] = [
      "normal",
      "normal",
      "normal",
      "song_mention",
      "youtube_link",
      "quote_reply",
    ];
    const messageType = randomPick(types);

    const result = await simulateChatMessage(supabase, groupId, { messageType });
    results.push(result);

    // Small delay between messages for realistic timestamps
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

// ============================================================================
// Reaction Simulation
// ============================================================================

export interface ReactionSimulationOptions {
  reactorId?: string;
  emoji?: string;
}

export interface ReactionSimulationResult {
  success: boolean;
  action: string;
  reactionId?: string;
  error?: string;
  timestamp: string;
}

/**
 * Add a reaction to a chat message.
 */
export async function simulateChatReaction(
  supabase: SupabaseClient,
  messageId: string,
  options: ReactionSimulationOptions = {}
): Promise<ReactionSimulationResult> {
  const reactorId = options.reactorId || randomUserId();
  const emoji = options.emoji || randomPick(EMOJIS);

  log("Simulating chat reaction", { messageId, reactorId, emoji });

  // Check if this reactor already reacted with this emoji
  const { data: existing } = await supabase
    .from("message_reactions")
    .select("id")
    .eq("message_id", messageId)
    .eq("reactor_id", reactorId)
    .eq("emoji", emoji)
    .single();

  if (existing) {
    return {
      success: true,
      action: "reaction_already_exists",
      reactionId: existing.id,
      timestamp: new Date().toISOString(),
    };
  }

  const { data, error } = await supabase
    .from("message_reactions")
    .insert({
      message_id: messageId,
      reactor_id: reactorId,
      emoji,
    })
    .select()
    .single();

  if (error) {
    return {
      success: false,
      action: "create_reaction_failed",
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }

  return {
    success: true,
    action: "created_reaction",
    reactionId: data.id,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Add multiple reactions to recent messages.
 */
export async function simulateReactionBurst(
  supabase: SupabaseClient,
  groupId: string,
  count: number = 10
): Promise<ReactionSimulationResult[]> {
  // Get recent messages to react to
  const { data: messages } = await supabase
    .from("group_messages")
    .select("id, author_id")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (!messages || messages.length === 0) {
    return [
      {
        success: false,
        action: "no_messages_to_react",
        error: "No messages found in group",
        timestamp: new Date().toISOString(),
      },
    ];
  }

  const results: ReactionSimulationResult[] = [];

  for (let i = 0; i < count; i++) {
    const message = randomPick(messages);
    // React with someone other than the author
    const reactorId = randomUserId(message.author_id);

    const result = await simulateChatReaction(supabase, message.id, {
      reactorId,
    });
    results.push(result);
  }

  return results;
}

// ============================================================================
// DM Simulation
// ============================================================================

export interface DMSimulationOptions {
  fromUserId?: string;
  toUserId?: string;
  messageCount?: number;
  includeReactions?: boolean;
}

export interface DMSimulationResult {
  success: boolean;
  action: string;
  conversationId?: string;
  messageCount?: number;
  error?: string;
  timestamp: string;
}

/**
 * Create or get a DM conversation between two users.
 */
async function getOrCreateConversation(
  supabase: SupabaseClient,
  userId1: string,
  userId2: string,
  groupId: string
): Promise<string | null> {
  // Check for existing conversation between these users
  const { data: existingParticipations } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("participant_id", userId1);

  if (existingParticipations && existingParticipations.length > 0) {
    const conversationIds = existingParticipations.map((p) => p.conversation_id);

    const { data: otherParticipant } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("participant_id", userId2)
      .in("conversation_id", conversationIds)
      .limit(1)
      .single();

    if (otherParticipant) {
      return otherParticipant.conversation_id;
    }
  }

  // Create new conversation
  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .insert({
      group_id: groupId,
      created_by: userId1,
    })
    .select()
    .single();

  if (convError || !conversation) {
    log("Failed to create conversation", { error: convError?.message });
    return null;
  }

  // Add participants
  const { error: partError } = await supabase
    .from("conversation_participants")
    .insert([
      { conversation_id: conversation.id, participant_id: userId1 },
      { conversation_id: conversation.id, participant_id: userId2 },
    ]);

  if (partError) {
    log("Failed to add participants", { error: partError.message });
    return null;
  }

  return conversation.id;
}

const DM_MESSAGES = [
  "Hey! What did you think of my pick this round?",
  "That was a great submission!",
  "I totally knew that was you 😂",
  "We should submit something similar next time",
  "Did you hear that song I mentioned?",
  "Your music taste is always on point",
  "Can't believe that won!",
  "I voted for yours btw",
  "What are you thinking for next round?",
  "That theme was made for you",
  "Haha that was unexpected",
  "Thanks for the kind words!",
  "See you next round!",
];

/**
 * Simulate a DM thread between two users.
 */
export async function simulateDMThread(
  supabase: SupabaseClient,
  groupId: string,
  options: DMSimulationOptions = {}
): Promise<DMSimulationResult> {
  const fromUserId = options.fromUserId || randomUserId();
  const toUserId = options.toUserId || randomUserId(fromUserId);
  const messageCount = options.messageCount || 3;

  log("Simulating DM thread", { fromUserId, toUserId, messageCount });

  const conversationId = await getOrCreateConversation(
    supabase,
    fromUserId,
    toUserId,
    groupId
  );

  if (!conversationId) {
    return {
      success: false,
      action: "create_conversation_failed",
      error: "Could not create or find conversation",
      timestamp: new Date().toISOString(),
    };
  }

  // Generate messages alternating between users
  let messagesCreated = 0;
  const users = [fromUserId, toUserId];

  for (let i = 0; i < messageCount; i++) {
    const authorId = users[i % 2];
    const body = randomPick(DM_MESSAGES);

    const { error } = await supabase.from("direct_messages").insert({
      conversation_id: conversationId,
      author_id: authorId,
      body,
    });

    if (!error) {
      messagesCreated++;
    }

    // Small delay
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  // Optionally add reactions to some DMs
  if (options.includeReactions) {
    const { data: dmMessages } = await supabase
      .from("direct_messages")
      .select("id, author_id")
      .eq("conversation_id", conversationId)
      .limit(5);

    if (dmMessages) {
      for (const dm of dmMessages) {
        // 50% chance of reaction
        if (Math.random() > 0.5) {
          const reactorId = dm.author_id === fromUserId ? toUserId : fromUserId;
          await supabase.from("dm_reactions").insert({
            message_id: dm.id,
            reactor_id: reactorId,
            emoji: randomPick(EMOJIS),
          });
        }
      }
    }
  }

  return {
    success: true,
    action: "created_dm_thread",
    conversationId,
    messageCount: messagesCreated,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Simulate multiple DM threads between random user pairs.
 */
export async function simulateMultipleDMThreads(
  supabase: SupabaseClient,
  groupId: string,
  threadCount: number = 3
): Promise<DMSimulationResult[]> {
  const results: DMSimulationResult[] = [];
  const usedPairs = new Set<string>();

  for (let i = 0; i < threadCount; i++) {
    // Pick a unique pair
    let fromUserId: string;
    let toUserId: string;
    let pairKey: string;
    let attempts = 0;

    do {
      fromUserId = randomUserId();
      toUserId = randomUserId(fromUserId);
      pairKey = [fromUserId, toUserId].sort().join("-");
      attempts++;
    } while (usedPairs.has(pairKey) && attempts < 20);

    if (attempts >= 20) break;

    usedPairs.add(pairKey);

    const result = await simulateDMThread(supabase, groupId, {
      fromUserId,
      toUserId,
      messageCount: Math.floor(Math.random() * 5) + 2,
      includeReactions: Math.random() > 0.3,
    });
    results.push(result);
  }

  return results;
}

// ============================================================================
// Vote Data Generation
// ============================================================================

export interface VoteGenerationOptions {
  /** Generate realistic point distributions */
  realistic?: boolean;
}

export interface VoteGenerationResult {
  success: boolean;
  action: string;
  votesCreated?: number;
  error?: string;
  timestamp: string;
}

/**
 * Generate actual vote records for a round's submissions.
 * This creates realistic point distributions.
 */
export async function generateVoteData(
  supabase: SupabaseClient,
  roundId: string,
  options: VoteGenerationOptions = {}
): Promise<VoteGenerationResult> {
  log("Generating vote data", { roundId });

  // Get submissions for the round
  const { data: submissions, error: subError } = await supabase
    .from("submissions")
    .select("id, submitter_name, profile_id")
    .eq("round_id", roundId);

  if (subError || !submissions || submissions.length === 0) {
    return {
      success: false,
      action: "no_submissions_found",
      error: subError?.message || "No submissions in round",
      timestamp: new Date().toISOString(),
    };
  }

  // Get voters (all users except we can't vote for ourselves)
  const { data: competitors } = await supabase
    .from("season_competitors")
    .select("id, name, profile_id")
    .eq("group_id", TEST_GROUP_ID);

  if (!competitors || competitors.length === 0) {
    return {
      success: false,
      action: "no_competitors_found",
      error: "No competitors in group",
      timestamp: new Date().toISOString(),
    };
  }

  let votesCreated = 0;

  // For each voter
  for (const voter of competitors) {
    // Get submissions this voter can vote on (not their own)
    const eligibleSubmissions = submissions.filter(
      (s) => s.profile_id !== voter.profile_id
    );

    if (eligibleSubmissions.length === 0) continue;

    // Generate point distribution
    // Total points per voter = (n-1)/2 * (n-1) where n = number of songs they can vote on
    // Simplified: give random points between 0-5 to each song, more realistic would be Music League rules
    const pointsPool = eligibleSubmissions.length * 3; // Rough average points per song
    let remainingPoints = pointsPool;

    const voteData: Array<{ submission_id: string; points: number }> = [];

    // Distribute points
    for (let i = 0; i < eligibleSubmissions.length; i++) {
      const submission = eligibleSubmissions[i];
      const isLast = i === eligibleSubmissions.length - 1;

      let points: number;
      if (isLast) {
        points = remainingPoints;
      } else {
        // Random points, but save some for others
        const maxPoints = Math.min(
          5,
          Math.floor(remainingPoints / (eligibleSubmissions.length - i))
        );
        points = Math.floor(Math.random() * (maxPoints + 1));
      }

      remainingPoints -= points;
      voteData.push({ submission_id: submission.id, points });
    }

    // Insert votes
    for (const vote of voteData) {
      const { error } = await supabase.from("votes").upsert(
        {
          submission_id: vote.submission_id,
          voter_id: voter.profile_id,
          voter_name: voter.name,
          points: vote.points,
        },
        {
          onConflict: "submission_id,voter_id",
        }
      );

      if (!error) {
        votesCreated++;
      }
    }
  }

  return {
    success: true,
    action: "generated_votes",
    votesCreated,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// Data Validation
// ============================================================================

export interface ValidationResult {
  success: boolean;
  action: string;
  issues: string[];
  stats: {
    submissions: number;
    votes: number;
    chatMessages: number;
    dmConversations: number;
    reactions: number;
  };
  timestamp: string;
}

/**
 * Validate test data integrity for a round.
 */
export async function validateRoundData(
  supabase: SupabaseClient,
  roundId: string,
  groupId: string
): Promise<ValidationResult> {
  const issues: string[] = [];

  // Check submissions
  const { data: submissions, count: subCount } = await supabase
    .from("submissions")
    .select("id, title, artist, submitter_name", { count: "exact" })
    .eq("round_id", roundId);

  if (!submissions || submissions.length === 0) {
    issues.push("No submissions found for round");
  } else {
    for (const sub of submissions) {
      if (!sub.title) issues.push(`Submission ${sub.id} missing title`);
      if (!sub.artist) issues.push(`Submission ${sub.id} missing artist`);
      if (!sub.submitter_name)
        issues.push(`Submission ${sub.id} missing submitter_name`);
    }
  }

  // Check votes
  const { count: voteCount } = await supabase
    .from("votes")
    .select("id", { count: "exact" })
    .in(
      "submission_id",
      submissions?.map((s) => s.id) || []
    );

  // Check chat messages
  const { count: chatCount } = await supabase
    .from("group_messages")
    .select("id", { count: "exact" })
    .eq("group_id", groupId);

  // Check DM conversations
  const { count: dmCount } = await supabase
    .from("conversations")
    .select("id", { count: "exact" })
    .eq("group_id", groupId);

  // Check reactions
  const { count: reactionCount } = await supabase
    .from("message_reactions")
    .select("id", { count: "exact" });

  return {
    success: issues.length === 0,
    action: "validated_round_data",
    issues,
    stats: {
      submissions: subCount || 0,
      votes: voteCount || 0,
      chatMessages: chatCount || 0,
      dmConversations: dmCount || 0,
      reactions: reactionCount || 0,
    },
    timestamp: new Date().toISOString(),
  };
}
