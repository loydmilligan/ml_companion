import { Fragment, useCallback, useEffect, useRef, useState, type TouchEvent } from "react";
import Button from "../components/Button";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useRound } from "../contexts/RoundContext";
import { usePeekPanel, PeekButton } from "../components/pinned-peek";

// AI mention detection pattern
const AI_MENTION_PATTERN = /@AI\b/i;

// Pull-to-refresh constants
const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

type ChatMessage = {
  id: string;
  body: string;
  author_id: string | null;
  created_at: string;
  reply_to_id: string | null;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  // Nested reply-to message (fetched separately)
  reply_to?: {
    id: string;
    body: string;
    author_id: string | null;
    profiles?: {
      display_name: string | null;
    } | null;
  } | null;
};

type MessageReaction = {
  id: string;
  message_id: string;
  reactor_id: string;
  emoji: string;
};

type ReactionCount = {
  emoji: string;
  count: number;
  reactorIds: string[];
};

type NotifyProfile = {
  email: string | null;
  chat_notify_enabled: boolean | null;
  email_notify_enabled: boolean | null;
};

function extractYouTubeId(text: string) {
  // Find all URLs in the text
  const urls = text.match(/https?:\/\/[^\s)]+/g) ?? [];

  // Look for a YouTube URL specifically
  for (const url of urls) {
    if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1]?.split(/[?&#]/)[0];
      if (id) return id;
    }
    if (url.includes("youtube.com") || url.includes("music.youtube.com")) {
      const match = url.match(/[?&]v=([^&]+)/);
      if (match?.[1]) return match[1];
    }
  }
  return null;
}

function renderMessageBody(text: string, onPeekClick?: () => void) {
  const parts: Array<{ text: string; href?: string; isPeekBtn?: boolean }> = [];
  // Match both @[label](url) links and <peek_btn> tags
  const regex = /(@\[(.+?)\]\((https?:\/\/[^)]+)\)|<peek_btn>)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const fullMatch = match[0];
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index) });
    }
    if (fullMatch === "<peek_btn>") {
      parts.push({ text: "", isPeekBtn: true });
    } else {
      // It's a link match: @[label](url)
      const label = match[2];
      const href = match[3];
      parts.push({ text: label, href });
    }
    lastIndex = match.index + fullMatch.length;
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex) });
  }
  return parts.map((part, index) => {
    if (part.isPeekBtn) {
      return (
        <button
          key={`peek-btn-${index}`}
          type="button"
          className="inline-peek-btn"
          onClick={(e) => {
            e.stopPropagation();
            onPeekClick?.();
          }}
          title="Open round details"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 9h6M9 12h6M9 15h4" />
          </svg>
        </button>
      );
    }
    if (part.href) {
      return (
        <a key={`${part.href}-${index}`} className="mention-link" href={part.href} target="_blank" rel="noreferrer">
          {part.text}
        </a>
      );
    }
    return <Fragment key={`text-${index}`}>{part.text}</Fragment>;
  });
}

const allEmojis = [
  // Reactions
  "👍", "❤️", "😂", "😮", "😢", "😡",
  // Music
  "🎧", "🎵", "🎶", "🎤", "🎸", "🥁", "🎹", "🎺", "🎷", "🎻",
  // Expressions
  "🔥", "👏", "😍", "🤔", "💜", "💙",
  "💃", "🕺", "🙌", "✨", "💯", "🤘",
  "👀", "🤩", "😭", "💀", "🫡", "🙏",
];

export default function ChatPage() {
  const { group, profile } = useAuth();
  const { round } = useRound(); // Get round for AI context
  const { quotedSong, clearQuotedSong, openPanel } = usePeekPanel();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<Map<string, ReactionCount[]>>(new Map());
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const [aiChatEnabled, setAiChatEnabled] = useState(true);
  const [emojiDrawerOpen, setEmojiDrawerOpen] = useState(false);
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null);
  const [defaultEmoji, setDefaultEmoji] = useState(() => localStorage.getItem("tml_default_emoji") ?? "👍");
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const composeRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);

  // Pagination state
  const PAGE_SIZE = 50;
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const isInitialLoad = useRef(true);

  // Listen for localStorage changes (when settings change)
  useEffect(() => {
    const handleStorage = () => {
      setDefaultEmoji(localStorage.getItem("tml_default_emoji") ?? "👍");
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Helper to group reactions by message
  const groupReactionsByMessage = useCallback((reactionData: MessageReaction[]): Map<string, ReactionCount[]> => {
    const grouped = new Map<string, Map<string, { count: number; reactorIds: string[] }>>();

    for (const r of reactionData) {
      if (!grouped.has(r.message_id)) {
        grouped.set(r.message_id, new Map());
      }
      const msgReactions = grouped.get(r.message_id)!;
      if (!msgReactions.has(r.emoji)) {
        msgReactions.set(r.emoji, { count: 0, reactorIds: [] });
      }
      const emojiData = msgReactions.get(r.emoji)!;
      emojiData.count++;
      emojiData.reactorIds.push(r.reactor_id);
    }

    const result = new Map<string, ReactionCount[]>();
    for (const [msgId, emojiMap] of grouped) {
      const counts: ReactionCount[] = [];
      for (const [emoji, data] of emojiMap) {
        counts.push({ emoji, count: data.count, reactorIds: data.reactorIds });
      }
      result.set(msgId, counts);
    }
    return result;
  }, []);

  // Initial load - shows loading state, loads most recent messages
  const loadMessages = useCallback(async () => {
    if (!group) return;
    setLoading(true);
    isInitialLoad.current = true;

    // First get total count to know if there are more messages
    const { count: totalCount } = await supabase
      .from("group_messages")
      .select("*", { count: "exact", head: true })
      .eq("group_id", group.id);

    // Fetch most recent PAGE_SIZE messages (descending, then reverse for display)
    const { data } = await supabase
      .from("group_messages")
      .select("id,body,author_id,created_at,reply_to_id, profiles(display_name,avatar_url)")
      .eq("group_id", group.id)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    // Reverse to get chronological order for display
    let msgs = ((data as unknown as ChatMessage[]) ?? []).reverse();

    // Fetch reply_to messages if any
    const replyToIds = msgs.filter(m => m.reply_to_id).map(m => m.reply_to_id) as string[];
    if (replyToIds.length > 0) {
      const { data: replyData } = await supabase
        .from("group_messages")
        .select("id,body,author_id,profiles(display_name)")
        .in("id", replyToIds);

      const replyMap = new Map((replyData ?? []).map((r: any) => [r.id, r]));
      msgs = msgs.map(m => m.reply_to_id ? { ...m, reply_to: replyMap.get(m.reply_to_id) } : m);
    }

    setMessages(msgs);
    setHasMoreMessages((totalCount ?? 0) > PAGE_SIZE);

    // Fetch reactions for all messages in one query
    if (msgs.length > 0) {
      const msgIds = msgs.map(m => m.id);
      const { data: reactionData } = await supabase
        .from("message_reactions")
        .select("id,message_id,reactor_id,emoji")
        .in("message_id", msgIds);

      setReactions(groupReactionsByMessage((reactionData as MessageReaction[]) ?? []));
    }

    // Fetch AI chat enabled setting
    const { data: settingsData } = await supabase
      .from("group_settings")
      .select("ai_chat_enabled")
      .eq("group_id", group.id)
      .maybeSingle();
    setAiChatEnabled(settingsData?.ai_chat_enabled ?? true);

    setLoading(false);
  }, [group, groupReactionsByMessage]);

  // Load earlier messages (pagination)
  const loadEarlierMessages = useCallback(async () => {
    if (!group || loadingMore || messages.length === 0) return;

    const oldestMessage = messages[0];
    if (!oldestMessage) return;

    setLoadingMore(true);

    // Get scroll position before adding messages
    const thread = threadRef.current;
    const previousScrollHeight = thread?.scrollHeight ?? 0;

    // Fetch messages older than the oldest current message
    const { data } = await supabase
      .from("group_messages")
      .select("id,body,author_id,created_at,reply_to_id, profiles(display_name,avatar_url)")
      .eq("group_id", group.id)
      .lt("created_at", oldestMessage.created_at)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    let olderMsgs = ((data as unknown as ChatMessage[]) ?? []).reverse();

    // Fetch reply_to messages if any
    const replyToIds = olderMsgs.filter(m => m.reply_to_id).map(m => m.reply_to_id) as string[];
    if (replyToIds.length > 0) {
      const { data: replyData } = await supabase
        .from("group_messages")
        .select("id,body,author_id,profiles(display_name)")
        .in("id", replyToIds);

      const replyMap = new Map((replyData ?? []).map((r: any) => [r.id, r]));
      olderMsgs = olderMsgs.map(m => m.reply_to_id ? { ...m, reply_to: replyMap.get(m.reply_to_id) } : m);
    }

    if (olderMsgs.length > 0) {
      // Fetch reactions for these messages
      const msgIds = olderMsgs.map(m => m.id);
      const { data: reactionData } = await supabase
        .from("message_reactions")
        .select("id,message_id,reactor_id,emoji")
        .in("message_id", msgIds);

      // Merge new reactions with existing
      const newReactions = groupReactionsByMessage((reactionData as MessageReaction[]) ?? []);
      setReactions(prev => {
        const merged = new Map(prev);
        for (const [msgId, counts] of newReactions) {
          merged.set(msgId, counts);
        }
        return merged;
      });

      // Prepend older messages
      setMessages(prev => [...olderMsgs, ...prev]);

      // Check if there are even more messages
      setHasMoreMessages(olderMsgs.length === PAGE_SIZE);

      // Restore scroll position after DOM update
      requestAnimationFrame(() => {
        if (thread) {
          const newScrollHeight = thread.scrollHeight;
          thread.scrollTop = newScrollHeight - previousScrollHeight;
        }
      });
    } else {
      setHasMoreMessages(false);
    }

    setLoadingMore(false);
  }, [group, loadingMore, messages, groupReactionsByMessage]);

  // Use refs to track current state for silent refresh (avoids dependency issues)
  const messagesRef = useRef(messages);
  const reactionsRef = useRef(reactions);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { reactionsRef.current = reactions; }, [reactions]);

  // Silent refresh - only updates if there are new messages or reactions
  const silentRefresh = useCallback(async () => {
    if (!group) return;

    const currentMessages = messagesRef.current;
    const currentReactions = reactionsRef.current;

    // Check message count
    const { count: msgCount } = await supabase
      .from("group_messages")
      .select("*", { count: "exact", head: true })
      .eq("group_id", group.id);

    // Only check reactions if we have messages
    let reactionCount = 0;
    if (currentMessages.length > 0) {
      const { count } = await supabase
        .from("message_reactions")
        .select("*", { count: "exact", head: true })
        .in("message_id", currentMessages.map(m => m.id));
      reactionCount = count ?? 0;
    }

    const currentReactionCount = Array.from(currentReactions.values()).reduce(
      (sum, counts) => sum + counts.reduce((s, c) => s + c.count, 0), 0
    );

    // Refresh if message count or reaction count changed
    if (msgCount !== currentMessages.length || reactionCount !== currentReactionCount) {
      const { data } = await supabase
        .from("group_messages")
        .select("id,body,author_id,created_at,reply_to_id, profiles(display_name,avatar_url)")
        .eq("group_id", group.id)
        .order("created_at", { ascending: true });

      let msgs = (data as unknown as ChatMessage[]) ?? [];

      // Fetch reply_to messages if any
      const replyToIds = msgs.filter(m => m.reply_to_id).map(m => m.reply_to_id) as string[];
      if (replyToIds.length > 0) {
        const { data: replyData } = await supabase
          .from("group_messages")
          .select("id,body,author_id,profiles(display_name)")
          .in("id", replyToIds);

        const replyMap = new Map((replyData ?? []).map((r: any) => [r.id, r]));
        msgs = msgs.map(m => m.reply_to_id ? { ...m, reply_to: replyMap.get(m.reply_to_id) } : m);
      }

      setMessages(msgs);

      if (msgs.length > 0) {
        const msgIds = msgs.map(m => m.id);
        const { data: reactionData } = await supabase
          .from("message_reactions")
          .select("id,message_id,reactor_id,emoji")
          .in("message_id", msgIds);
        setReactions(groupReactionsByMessage((reactionData as MessageReaction[]) ?? []));
      }
    }
  }, [group, groupReactionsByMessage]);

  // Initial load
  useEffect(() => {
    if (!group) return;
    loadMessages();
  }, [group, loadMessages]);

  // Polling interval (separate from initial load to avoid re-triggering)
  useEffect(() => {
    if (!group) return;

    const interval = window.setInterval(silentRefresh, 30000);

    return () => {
      window.clearInterval(interval);
    };
  }, [group, silentRefresh]);

  // Pull-to-refresh handlers
  const handleTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    const thread = threadRef.current;
    if (!thread || thread.scrollTop > 0 || isRefreshing) return;

    touchStartY.current = e.touches[0].clientY;
    isPulling.current = true;
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (!isPulling.current || isRefreshing) return;

    const thread = threadRef.current;
    if (!thread || thread.scrollTop > 0) {
      isPulling.current = false;
      setPullDistance(0);
      return;
    }

    const deltaY = e.touches[0].clientY - touchStartY.current;
    if (deltaY > 0) {
      // Apply resistance to pull
      const distance = Math.min(deltaY * 0.5, MAX_PULL);
      setPullDistance(distance);
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      await loadMessages();
      setIsRefreshing(false);
    }
    setPullDistance(0);
  }, [pullDistance, isRefreshing, loadMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length === 0) return;

    // Use instant scroll on initial load, smooth scroll for new messages
    const behavior = isInitialLoad.current ? "instant" : "smooth";
    chatEndRef.current?.scrollIntoView({ behavior });

    // Reset initial load flag after first scroll
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
    }
  }, [messages]);

  // Handle quoted song from peek panel
  useEffect(() => {
    if (quotedSong) {
      const label = quotedSong.artist
        ? `${quotedSong.title} — ${quotedSong.artist}`
        : quotedSong.title;
      const mention = quotedSong.link ? `@[${label}](${quotedSong.link})` : `@${label}`;
      setMessage((prev) => {
        const needsSpace = prev && !prev.endsWith(" ");
        return `${prev}${needsSpace ? " " : ""}${mention}`;
      });
      clearQuotedSong();
    }
  }, [quotedSong, clearQuotedSong]);

  const sendQuickEmoji = async (emoji: string) => {
    if (!group || !profile) return;
    setSending(true);
    const { error } = await supabase.from("group_messages").insert({
      group_id: group.id,
      author_id: profile.id,
      body: emoji,
    });
    if (!error) {
      const { data } = await supabase
        .from("group_messages")
        .select("id,body,author_id,created_at,reply_to_id, profiles(display_name,avatar_url)")
        .eq("group_id", group.id)
        .order("created_at", { ascending: true });

      let msgs = (data as unknown as ChatMessage[]) ?? [];
      const replyToIds = msgs.filter(m => m.reply_to_id).map(m => m.reply_to_id) as string[];
      if (replyToIds.length > 0) {
        const { data: replyData } = await supabase
          .from("group_messages")
          .select("id,body,author_id,profiles(display_name)")
          .in("id", replyToIds);
        const replyMap = new Map((replyData ?? []).map((r: any) => [r.id, r]));
        msgs = msgs.map(m => m.reply_to_id ? { ...m, reply_to: replyMap.get(m.reply_to_id) } : m);
      }
      setMessages(msgs);
    }
    setSending(false);
  };

  // Toggle reaction on a message (add if not exists, remove if exists)
  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!profile) return;

    const msgReactions = reactions.get(messageId) ?? [];
    const existingReaction = msgReactions.find(
      r => r.emoji === emoji && r.reactorIds.includes(profile.id)
    );

    if (existingReaction) {
      // Remove reaction
      await supabase
        .from("message_reactions")
        .delete()
        .eq("message_id", messageId)
        .eq("reactor_id", profile.id)
        .eq("emoji", emoji);
    } else {
      // Add reaction
      await supabase
        .from("message_reactions")
        .insert({ message_id: messageId, reactor_id: profile.id, emoji });

      // Send notification to message author (if enabled)
      const msg = messages.find(m => m.id === messageId);
      if (msg && msg.author_id && msg.author_id !== profile.id) {
        const { data: authorProfile } = await supabase
          .from("profiles")
          .select("email,reaction_notify_enabled")
          .eq("id", msg.author_id)
          .maybeSingle();

        if (authorProfile?.reaction_notify_enabled && authorProfile?.email) {
          await supabase.functions.invoke("notify", {
            body: {
              title: "New reaction",
              message: `${profile.display_name ?? "Someone"} reacted ${emoji} to your message`,
              recipients: [authorProfile.email],
            },
          });
        }
      }
    }

    // Refresh reactions
    const msgIds = messages.map(m => m.id);
    const { data: reactionData } = await supabase
      .from("message_reactions")
      .select("id,message_id,reactor_id,emoji")
      .in("message_id", msgIds);
    setReactions(groupReactionsByMessage((reactionData as MessageReaction[]) ?? []));

    setReactionPickerFor(null);
  };

  // Call AI assistant for @AI mentions
  const callAIAssistant = useCallback(async (userQuery: string) => {
    if (!round) return null;

    try {
      const recentMsgs = messages.slice(-10).map((m) => ({
        body: m.body,
        author: m.profiles?.display_name ?? "Unknown",
      }));

      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          mode: "chat_response",
          round: {
            theme: round.theme,
            theme_description: round.theme_description,
            theme_author: round.theme_author,
          },
          user_query: userQuery,
          recent_messages: recentMsgs,
        },
      });

      if (error) throw error;
      return data?.response ?? null;
    } catch (err) {
      console.error("Error calling AI assistant:", err);
      return "Sorry, I'm having trouble responding right now. Please try again.";
    }
  }, [round, messages]);

  const sendMessage = async () => {
    if (!group || !profile || !message.trim()) return;
    setSending(true);

    const trimmedMessage = message.trim();
    const hasAIMention = AI_MENTION_PATTERN.test(trimmedMessage);

    const { error } = await supabase.from("group_messages").insert({
      group_id: group.id,
      author_id: profile.id,
      body: trimmedMessage,
      reply_to_id: replyingTo?.id ?? null,
    });

    if (!error) {
      setMessage("");
      setReplyingTo(null);
      const { data } = await supabase
        .from("group_messages")
        .select("id,body,author_id,created_at,reply_to_id, profiles(display_name,avatar_url)")
        .eq("group_id", group.id)
        .order("created_at", { ascending: true });

      let msgs = (data as unknown as ChatMessage[]) ?? [];
      const replyToIds = msgs.filter(m => m.reply_to_id).map(m => m.reply_to_id) as string[];
      if (replyToIds.length > 0) {
        const { data: replyData } = await supabase
          .from("group_messages")
          .select("id,body,author_id,profiles(display_name)")
          .in("id", replyToIds);
        const replyMap = new Map((replyData ?? []).map((r: any) => [r.id, r]));
        msgs = msgs.map(m => m.reply_to_id ? { ...m, reply_to: replyMap.get(m.reply_to_id) } : m);
      }
      setMessages(msgs);

      // Handle @AI mention
      if (hasAIMention && round) {
        let aiResponse: string | null = null;

        if (!aiChatEnabled) {
          // AI is disabled - show away message
          aiResponse = "Hey there! I'm taking a quick break right now, but I'll be back soon. In the meantime, the group has all the answers! 🎵";
        } else {
          // AI is enabled - call the assistant
          setAiTyping(true);
          const query = trimmedMessage.replace(AI_MENTION_PATTERN, "").trim();
          aiResponse = await callAIAssistant(query);
        }

        if (aiResponse) {
          // Insert AI response as a system message
          await supabase.from("group_messages").insert({
            group_id: group.id,
            author_id: null, // System/AI message
            body: `🤖 League Bot: ${aiResponse}`,
          });

          // Refresh messages to show AI response
          const { data: updatedData } = await supabase
            .from("group_messages")
            .select("id,body,author_id,created_at,reply_to_id, profiles(display_name,avatar_url)")
            .eq("group_id", group.id)
            .order("created_at", { ascending: true });

          let aiMsgs = (updatedData as unknown as ChatMessage[]) ?? [];
          const aiReplyIds = aiMsgs.filter(m => m.reply_to_id).map(m => m.reply_to_id) as string[];
          if (aiReplyIds.length > 0) {
            const { data: aiReplyData } = await supabase
              .from("group_messages")
              .select("id,body,author_id,profiles(display_name)")
              .in("id", aiReplyIds);
            const aiReplyMap = new Map((aiReplyData ?? []).map((r: any) => [r.id, r]));
            aiMsgs = aiMsgs.map(m => m.reply_to_id ? { ...m, reply_to: aiReplyMap.get(m.reply_to_id) } : m);
          }
          setMessages(aiMsgs);
        }
        setAiTyping(false);
      }

      const { data: memberData } = await supabase
        .from("group_members")
        .select("profiles(email,chat_notify_enabled,email_notify_enabled)")
        .eq("group_id", group.id);

      const emails = (memberData ?? [])
        .map((row) => row.profiles as unknown as NotifyProfile)
        .filter((member) => member?.chat_notify_enabled !== false && member?.email_notify_enabled !== false)
        .map((member) => member?.email)
        .filter(Boolean) as string[];

      await supabase.functions.invoke("notify", {
        body: {
          title: "Group chat message",
          message: `${profile.display_name ?? "Someone"}: ${trimmedMessage}`,
          recipients: emails,
        },
      });
    }
    setSending(false);
  };

  return (
    <div className="chat-page">
      {/* Peek button inside chat area - always visible */}
      <PeekButton onClick={openPanel} variant="chat" />

      <div
        className="chat-thread"
        ref={threadRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        {/* Pull-to-refresh indicator */}
        {(pullDistance > 0 || isRefreshing) && (
          <div
            className="pull-to-refresh-indicator"
            style={{
              opacity: Math.min(pullDistance / PULL_THRESHOLD, 1),
              transform: `rotate(${pullDistance * 3}deg)`,
            }}
          >
            {isRefreshing ? "Refreshing..." : pullDistance >= PULL_THRESHOLD ? "Release to refresh" : "Pull to refresh"}
          </div>
        )}
        {loading ? <p className="muted">Loading messages...</p> : null}
        {!loading && !messages.length ? (
          <p className="muted">No messages yet. Start the conversation.</p>
        ) : null}
        {/* Load earlier messages button */}
        {!loading && hasMoreMessages && (
          <button
            type="button"
            className="load-earlier-btn"
            onClick={loadEarlierMessages}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading..." : "Load earlier messages"}
          </button>
        )}
        {/* AI typing indicator */}
        {aiTyping && (
          <div className="chat-bubble ai-typing">
            <div className="chat-meta">
              <div className="chat-avatar ai">
                <span>🤖</span>
              </div>
              <span className="chat-author">League Bot</span>
            </div>
            <p className="typing-indicator">
              <span></span><span></span><span></span>
            </p>
          </div>
        )}
        {messages.map((item, index) => {
          // Calculate shadow intensity based on recency (newer = more shadow)
          // Last message gets max shadow, older messages fade to minimal shadow
          const totalMessages = messages.length;
          const recency = totalMessages > 1 ? (index + 1) / totalMessages : 1;
          const shadowIntensity = 0.05 + recency * 0.2; // Range: 0.05 to 0.25
          const shadowBlur = 2 + recency * 10; // Range: 2px to 12px
          const shadowY = 1 + recency * 3; // Range: 1px to 4px
          const bubbleStyle = {
            boxShadow: `0 ${shadowY}px ${shadowBlur}px rgba(0, 0, 0, ${shadowIntensity})`,
          };

          return (
          <div
            key={item.id}
            className={item.author_id === profile?.id ? "chat-bubble own" : "chat-bubble"}
            style={bubbleStyle}
            onClick={() => setReactionPickerFor(reactionPickerFor === item.id ? null : item.id)}
          >
            <div className="chat-meta">
              <div className="chat-avatar">
                {item.profiles?.avatar_url ? (
                  <img src={item.profiles.avatar_url} alt={item.profiles.display_name ?? "Avatar"} />
                ) : (
                  <span>{(item.profiles?.display_name ?? "TM")[0]}</span>
                )}
              </div>
              <span className="chat-author">{item.profiles?.display_name ?? "Family"}</span>
            </div>
            {/* Quoted message (reply) */}
            {item.reply_to && (
              <div className="chat-reply-quote" onClick={(e) => e.stopPropagation()}>
                <span className="reply-author">{item.reply_to.profiles?.display_name ?? "Family"}</span>
                <span className="reply-text">{item.reply_to.body.length > 80 ? item.reply_to.body.slice(0, 80) + "..." : item.reply_to.body}</span>
              </div>
            )}
            <p>{renderMessageBody(item.body, openPanel)}</p>
            {(() => {
              const videoId = extractYouTubeId(item.body);
              if (!videoId) return null;
              return (
                <div className="chat-embed" onClick={(e) => e.stopPropagation()}>
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title="YouTube playback"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              );
            })()}
            <span className="chat-time">{new Date(item.created_at).toLocaleString()}</span>
            {/* Display existing reactions */}
            {reactions.get(item.id)?.length ? (
              <div className="chat-reactions-display" onClick={(e) => e.stopPropagation()}>
                {reactions.get(item.id)!.map((r) => (
                  <button
                    key={r.emoji}
                    type="button"
                    className={`chat-reaction-badge ${r.reactorIds.includes(profile?.id ?? "") ? "own" : ""}`}
                    onClick={() => toggleReaction(item.id, r.emoji)}
                    title={`${r.count} reaction${r.count > 1 ? "s" : ""}`}
                  >
                    {r.emoji} {r.count > 1 && <span className="reaction-count">{r.count}</span>}
                  </button>
                ))}
              </div>
            ) : null}
            {/* Reaction picker for this message */}
            {reactionPickerFor === item.id && (
              <div className="chat-bubble-reactions" onClick={(e) => e.stopPropagation()}>
                {["👍", "❤️", "😂", "🔥", "😮", "😢"].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={`chat-bubble-reaction ${reactions.get(item.id)?.some(r => r.emoji === emoji && r.reactorIds.includes(profile?.id ?? "")) ? "active" : ""}`}
                    onClick={() => toggleReaction(item.id, emoji)}
                  >
                    {emoji}
                  </button>
                ))}
                <button
                  type="button"
                  className="chat-bubble-reaction reply-btn"
                  onClick={() => {
                    setReplyingTo(item);
                    setReactionPickerFor(null);
                  }}
                  title="Reply"
                >
                  ↩️
                </button>
              </div>
            )}
          </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>
      <div className="chat-compose" ref={composeRef}>
        {/* Reply preview bar */}
        {replyingTo && (
          <div className="chat-reply-preview">
            <div className="reply-preview-content">
              <span className="reply-preview-label">Replying to {replyingTo.profiles?.display_name ?? "Family"}</span>
              <span className="reply-preview-text">{replyingTo.body.length > 50 ? replyingTo.body.slice(0, 50) + "..." : replyingTo.body}</span>
            </div>
            <button
              type="button"
              className="reply-preview-close"
              onClick={() => setReplyingTo(null)}
              aria-label="Cancel reply"
            >
              ✕
            </button>
          </div>
        )}
        {/* Emoji drawer */}
        <div className={`chat-emoji-drawer ${emojiDrawerOpen ? "open" : ""}`}>
          {allEmojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="emoji-button"
              onClick={() => {
                setMessage((prev) => `${prev}${emoji}`);
                setEmojiDrawerOpen(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
        {/* Quick emoji button + arrow */}
        <div className="chat-emoji-group">
          <button
            type="button"
            className="chat-emoji-quick-btn"
            onClick={() => sendQuickEmoji(defaultEmoji)}
            disabled={sending}
            aria-label={`Send ${defaultEmoji}`}
          >
            {defaultEmoji}
          </button>
          <button
            type="button"
            className="chat-emoji-arrow"
            onClick={() => setEmojiDrawerOpen((prev) => !prev)}
            aria-label={emojiDrawerOpen ? "Close emoji picker" : "Open emoji picker"}
          >
            {emojiDrawerOpen ? "▼" : "▲"}
          </button>
        </div>
        <input
          className="field-input"
          placeholder="Type a message..."
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              sendMessage();
            }
          }}
        />
        <Button type="button" onClick={sendMessage} disabled={sending || !message.trim()}>
          {sending ? "..." : "Send"}
        </Button>
      </div>
    </div>
  );
}
