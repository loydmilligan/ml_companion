import { Fragment, useCallback, useEffect, useRef, useState, type TouchEvent } from "react";
import Button from "../components/Button";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useRound } from "../contexts/RoundContext";
import { usePeekPanel, PeekButton } from "../components/pinned-peek";

// Pull-to-refresh constants
const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

type ChatMessage = {
  id: string;
  body: string;
  author_id: string | null;
  created_at: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
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
  const urlMatch = text.match(/https?:\/\/[^\s]+/g)?.[0];
  if (!urlMatch) return null;
  if (urlMatch.includes("youtu.be/")) {
    const id = urlMatch.split("youtu.be/")[1]?.split(/[?&#]/)[0];
    return id ?? null;
  }
  if (urlMatch.includes("youtube.com") || urlMatch.includes("music.youtube.com")) {
    const match = urlMatch.match(/[?&]v=([^&]+)/);
    return match?.[1] ?? null;
  }
  return null;
}

function renderMessageBody(text: string) {
  const parts: Array<{ text: string; href?: string }> = [];
  const regex = /@\[(.+?)\]\((https?:\/\/[^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const [full, label, href] = match;
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index) });
    }
    parts.push({ text: label, href });
    lastIndex = match.index + full.length;
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex) });
  }
  return parts.map((part, index) =>
    part.href ? (
      <a key={`${part.href}-${index}`} className="mention-link" href={part.href} target="_blank" rel="noreferrer">
        {part.text}
      </a>
    ) : (
      <Fragment key={`text-${index}`}>{part.text}</Fragment>
    )
  );
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
  const { round } = useRound();
  const { quotedSong, clearQuotedSong, openPanel } = usePeekPanel();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<Map<string, ReactionCount[]>>(new Map());
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [emojiDrawerOpen, setEmojiDrawerOpen] = useState(false);
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null);
  const [defaultEmoji, setDefaultEmoji] = useState(() => localStorage.getItem("tml_default_emoji") ?? "👍");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const composeRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);

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

  // Initial load - shows loading state
  const loadMessages = useCallback(async () => {
    if (!group) return;
    setLoading(true);
    const { data } = await supabase
      .from("group_messages")
      .select("id,body,author_id,created_at, profiles(display_name,avatar_url)")
      .eq("group_id", group.id)
      .order("created_at", { ascending: true });

    const msgs = (data as unknown as ChatMessage[]) ?? [];
    setMessages(msgs);

    // Fetch reactions for all messages in one query
    if (msgs.length > 0) {
      const msgIds = msgs.map(m => m.id);
      const { data: reactionData } = await supabase
        .from("message_reactions")
        .select("id,message_id,reactor_id,emoji")
        .in("message_id", msgIds);

      setReactions(groupReactionsByMessage((reactionData as MessageReaction[]) ?? []));
    }

    setLoading(false);
  }, [group, groupReactionsByMessage]);

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
        .select("id,body,author_id,created_at, profiles(display_name,avatar_url)")
        .eq("group_id", group.id)
        .order("created_at", { ascending: true });

      const msgs = (data as unknown as ChatMessage[]) ?? [];
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
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
        .select("id,body,author_id,created_at, profiles(display_name,avatar_url)")
        .eq("group_id", group.id)
        .order("created_at", { ascending: true });
      setMessages((data as unknown as ChatMessage[]) ?? []);
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

  const sendMessage = async () => {
    if (!group || !profile || !message.trim()) return;
    setSending(true);
    const { error } = await supabase.from("group_messages").insert({
      group_id: group.id,
      author_id: profile.id,
      body: message.trim(),
    });

    if (!error) {
      setMessage("");
      const { data } = await supabase
        .from("group_messages")
        .select("id,body,author_id,created_at, profiles(display_name,avatar_url)")
        .eq("group_id", group.id)
        .order("created_at", { ascending: true });
      setMessages((data as unknown as ChatMessage[]) ?? []);

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
          message: `${profile.display_name ?? "Someone"}: ${message.trim()}`,
          recipients: emails,
        },
      });
    }
    setSending(false);
  };

  return (
    <div className="chat-page">
      {/* Peek button inside chat area */}
      {round && <PeekButton onClick={openPanel} variant="chat" />}

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
            <p>{renderMessageBody(item.body)}</p>
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
              </div>
            )}
          </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>
      <div className="chat-compose" ref={composeRef}>
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
