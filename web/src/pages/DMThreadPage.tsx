import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useRealtimeDM, type DMMessage, type DMReaction } from "../hooks/useRealtimeDM";

type ReactionCount = {
  emoji: string;
  count: number;
  reactorIds: string[];
};

function extractYouTubeInfo(text: string): { videoId: string; startTime: number | null } | null {
  const urls = text.match(/https?:\/\/[^\s)]+/g) ?? [];
  for (const url of urls) {
    if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1]?.split(/[?&#]/)[0];
      if (id) {
        const timeMatch = url.match(/[?&]t=(\d+)/);
        return { videoId: id, startTime: timeMatch ? parseInt(timeMatch[1], 10) : null };
      }
    }
    if (url.includes("youtube.com") || url.includes("music.youtube.com")) {
      const match = url.match(/[?&]v=([^&]+)/);
      if (match?.[1]) {
        const timeMatch = url.match(/[?&]t=(\d+)/);
        return { videoId: match[1], startTime: timeMatch ? parseInt(timeMatch[1], 10) : null };
      }
    }
  }
  return null;
}

function renderMessageBody(text: string) {
  // Simple URL linkification
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a key={index} href={part} target="_blank" rel="noreferrer" className="dm-link">
          {part}
        </a>
      );
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}

const quickEmojis = ["👍", "❤️", "😂", "🔥", "😮", "😢"];
const allEmojis = [
  "👍", "❤️", "😂", "😮", "😢", "😡",
  "🎧", "🎵", "🎶", "🎤", "🎸", "🥁", "🎹", "🎺", "🎷", "🎻",
  "🔥", "👏", "😍", "🤔", "💜", "💙",
  "💃", "🕺", "🙌", "✨", "💯", "🤘",
  "👀", "🤩", "😭", "💀", "🫡", "🙏",
];

export default function DMThreadPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [reactions, setReactions] = useState<Map<string, ReactionCount[]>>(new Map());
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherParticipant, setOtherParticipant] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);
  const [emojiDrawerOpen, setEmojiDrawerOpen] = useState(false);
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<DMMessage | null>(null);
  const [defaultEmoji] = useState(() => localStorage.getItem("tml_default_emoji") ?? "👍");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const composeRef = useRef<HTMLDivElement>(null);

  // Profile cache for realtime messages
  const profileCacheRef = useRef<Map<string, { display_name: string | null; avatar_url: string | null }>>(new Map());

  // Realtime callbacks
  const handleNewMessage = useCallback(async (newMessage: DMMessage) => {
    // Fetch profile if not cached
    let msgProfile = profileCacheRef.current.get(newMessage.author_id);
    if (!msgProfile) {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", newMessage.author_id)
        .single();
      if (data) {
        msgProfile = data;
        profileCacheRef.current.set(newMessage.author_id, data);
      }
    }

    // Fetch reply_to if needed
    let replyTo = null;
    if (newMessage.reply_to_id) {
      const existing = messages.find(m => m.id === newMessage.reply_to_id);
      if (existing) {
        replyTo = {
          id: existing.id,
          body: existing.body,
          author_id: existing.author_id,
          profiles: existing.profiles,
        };
      } else {
        const { data } = await supabase
          .from("direct_messages")
          .select("id, body, author_id")
          .eq("id", newMessage.reply_to_id)
          .single();
        if (data) {
          replyTo = data;
        }
      }
    }

    setMessages(prev => [...prev, { ...newMessage, profiles: msgProfile, reply_to: replyTo }]);
  }, [messages]);

  const handleNewReaction = useCallback((reaction: DMReaction) => {
    setReactions(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(reaction.message_id) ?? [];
      const emojiEntry = existing.find(e => e.emoji === reaction.emoji);
      if (emojiEntry) {
        if (!emojiEntry.reactorIds.includes(reaction.reactor_id)) {
          emojiEntry.reactorIds.push(reaction.reactor_id);
          emojiEntry.count++;
        }
      } else {
        existing.push({ emoji: reaction.emoji, count: 1, reactorIds: [reaction.reactor_id] });
      }
      newMap.set(reaction.message_id, existing);
      return newMap;
    });
  }, []);

  const handleDeleteReaction = useCallback((reaction: DMReaction) => {
    setReactions(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(reaction.message_id) ?? [];
      const emojiEntry = existing.find(e => e.emoji === reaction.emoji);
      if (emojiEntry) {
        emojiEntry.reactorIds = emojiEntry.reactorIds.filter(id => id !== reaction.reactor_id);
        emojiEntry.count = emojiEntry.reactorIds.length;
        if (emojiEntry.count === 0) {
          newMap.set(reaction.message_id, existing.filter(e => e.emoji !== reaction.emoji));
        }
      }
      return newMap;
    });
  }, []);

  // Setup realtime subscription
  const { isConnected } = useRealtimeDM(
    conversationId ?? null,
    profile?.id ?? null,
    {
      onNewMessage: handleNewMessage,
      onNewReaction: handleNewReaction,
      onDeleteReaction: handleDeleteReaction,
    }
  );

  // Load conversation data
  const loadConversation = useCallback(async () => {
    if (!conversationId || !profile?.id) return;

    try {
      // Get other participant
      const { data: participants } = await supabase
        .from("conversation_participants")
        .select(`
          participant_id,
          profiles:participant_id (
            display_name,
            avatar_url
          )
        `)
        .eq("conversation_id", conversationId)
        .neq("participant_id", profile.id);

      if (participants?.[0]) {
        const other = participants[0].profiles as unknown as { display_name: string | null; avatar_url: string | null };
        setOtherParticipant(other);
      }

      // Load messages
      const { data: msgs, error: msgsError } = await supabase
        .from("direct_messages")
        .select(`
          id,
          conversation_id,
          author_id,
          body,
          reply_to_id,
          created_at,
          profiles:author_id (
            display_name,
            avatar_url
          )
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (msgsError) throw msgsError;

      // Fetch reply_to data for messages with replies
      const messagesWithReplies = msgs?.filter(m => m.reply_to_id) ?? [];
      const replyIds = [...new Set(messagesWithReplies.map(m => m.reply_to_id))];

      let replyMap = new Map<string, { id: string; body: string; author_id: string; profiles?: { display_name: string | null } | null }>();
      if (replyIds.length > 0) {
        const { data: replies } = await supabase
          .from("direct_messages")
          .select("id, body, author_id, profiles:author_id (display_name)")
          .in("id", replyIds);

        replies?.forEach(r => {
          const profileData = r.profiles as unknown as { display_name: string | null } | null;
          replyMap.set(r.id, { id: r.id, body: r.body, author_id: r.author_id, profiles: profileData });
        });
      }

      const formattedMsgs: DMMessage[] = (msgs ?? []).map(m => ({
        id: m.id,
        conversation_id: m.conversation_id,
        author_id: m.author_id,
        body: m.body,
        reply_to_id: m.reply_to_id,
        created_at: m.created_at,
        profiles: m.profiles as unknown as { display_name: string | null; avatar_url: string | null } | null,
        reply_to: m.reply_to_id ? replyMap.get(m.reply_to_id) : null,
      }));

      // Cache profiles
      formattedMsgs.forEach(m => {
        if (m.profiles && m.author_id) {
          profileCacheRef.current.set(m.author_id, m.profiles);
        }
      });

      setMessages(formattedMsgs);

      // Load reactions
      const messageIds = formattedMsgs.map(m => m.id);
      if (messageIds.length > 0) {
        const { data: reactionData } = await supabase
          .from("dm_reactions")
          .select("id, message_id, reactor_id, emoji")
          .in("message_id", messageIds);

        const reactionMap = new Map<string, ReactionCount[]>();
        reactionData?.forEach(r => {
          const existing = reactionMap.get(r.message_id) ?? [];
          const emojiEntry = existing.find(e => e.emoji === r.emoji);
          if (emojiEntry) {
            emojiEntry.reactorIds.push(r.reactor_id);
            emojiEntry.count++;
          } else {
            existing.push({ emoji: r.emoji, count: 1, reactorIds: [r.reactor_id] });
          }
          reactionMap.set(r.message_id, existing);
        });
        setReactions(reactionMap);
      }

      // Mark as read
      await supabase
        .from("conversation_participants")
        .update({ last_read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("participant_id", profile.id);

    } catch (err) {
      console.error("Error loading conversation:", err);
    } finally {
      setLoading(false);
    }
  }, [conversationId, profile?.id]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    if (!message.trim() || !conversationId || !profile?.id) return;

    const messageText = message.trim();
    setSending(true);

    // Optimistic update
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMsg: DMMessage = {
      id: optimisticId,
      conversation_id: conversationId,
      author_id: profile.id,
      body: messageText,
      reply_to_id: replyingTo?.id ?? null,
      created_at: new Date().toISOString(),
      profiles: { display_name: profile.display_name, avatar_url: profile.avatar_url },
      reply_to: replyingTo ? {
        id: replyingTo.id,
        body: replyingTo.body,
        author_id: replyingTo.author_id,
        profiles: replyingTo.profiles,
      } : null,
      _optimistic: true,
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setMessage("");
    setReplyingTo(null);

    try {
      const { data, error } = await supabase
        .from("direct_messages")
        .insert({
          conversation_id: conversationId,
          author_id: profile.id,
          body: messageText,
          reply_to_id: replyingTo?.id ?? null,
        })
        .select()
        .single();

      if (error) throw error;

      // Replace optimistic message with real one
      setMessages(prev => prev.map(m =>
        m.id === optimisticId
          ? { ...data, profiles: optimisticMsg.profiles, reply_to: optimisticMsg.reply_to }
          : m
      ));
    } catch (err) {
      console.error("Error sending message:", err);
      // Revert optimistic update
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
    } finally {
      setSending(false);
    }
  };

  // Toggle reaction
  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!profile?.id) return;

    const existing = reactions.get(messageId)?.find(r => r.emoji === emoji);
    const hasReacted = existing?.reactorIds.includes(profile.id);

    if (hasReacted) {
      // Remove reaction
      const { error } = await supabase
        .from("dm_reactions")
        .delete()
        .eq("message_id", messageId)
        .eq("reactor_id", profile.id)
        .eq("emoji", emoji);

      if (!error) {
        handleDeleteReaction({ id: "", message_id: messageId, reactor_id: profile.id, emoji });
      }
    } else {
      // Add reaction
      const { error } = await supabase
        .from("dm_reactions")
        .insert({ message_id: messageId, reactor_id: profile.id, emoji });

      if (!error) {
        handleNewReaction({ id: "", message_id: messageId, reactor_id: profile.id, emoji });
      }
    }

    setReactionPickerFor(null);
  };

  // Send quick emoji as message
  const sendQuickEmoji = async (emoji: string) => {
    if (!conversationId || !profile?.id) return;
    setMessage(emoji);
    setTimeout(() => {
      sendMessage();
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="dm-thread">
      {/* Header */}
      <div className="dm-thread-header">
        <button
          type="button"
          className="dm-back-btn"
          onClick={() => navigate("/app/dm")}
          aria-label="Back to inbox"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="dm-header-avatar">
          {otherParticipant?.avatar_url ? (
            <img src={otherParticipant.avatar_url} alt={otherParticipant.display_name ?? "Avatar"} />
          ) : (
            <span>{(otherParticipant?.display_name ?? "?")[0]}</span>
          )}
        </div>
        <div className="dm-header-info">
          <span className="dm-header-name">{otherParticipant?.display_name ?? "Loading..."}</span>
          {!isConnected && <span className="dm-header-status">Reconnecting...</span>}
        </div>
      </div>

      {/* Messages */}
      <div className="dm-messages">
        {loading ? (
          <p className="muted">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="muted dm-empty-msg">No messages yet. Say hello!</p>
        ) : (
          messages.map((item, index) => {
            const isOwn = item.author_id === profile?.id;
            const totalMessages = messages.length;
            const recency = totalMessages > 1 ? (index + 1) / totalMessages : 1;
            const shadowIntensity = 0.05 + recency * 0.2;
            const shadowBlur = 2 + recency * 10;
            const shadowY = 1 + recency * 3;

            return (
              <div
                key={item.id}
                className={`dm-bubble ${isOwn ? "own" : ""}`}
                style={{ boxShadow: `0 ${shadowY}px ${shadowBlur}px rgba(0, 0, 0, ${shadowIntensity})` }}
                onClick={() => setReactionPickerFor(reactionPickerFor === item.id ? null : item.id)}
              >
                {!isOwn && (
                  <div className="dm-bubble-avatar">
                    {item.profiles?.avatar_url ? (
                      <img src={item.profiles.avatar_url} alt={item.profiles.display_name ?? "Avatar"} />
                    ) : (
                      <span>{(item.profiles?.display_name ?? "?")[0]}</span>
                    )}
                  </div>
                )}
                <div className="dm-bubble-content">
                  {/* Reply quote */}
                  {item.reply_to && (
                    <div className="dm-reply-quote" onClick={e => e.stopPropagation()}>
                      <span className="dm-reply-author">{item.reply_to.profiles?.display_name ?? "User"}</span>
                      <span className="dm-reply-text">
                        {item.reply_to.body.length > 60 ? item.reply_to.body.slice(0, 60) + "..." : item.reply_to.body}
                      </span>
                    </div>
                  )}
                  <p>{renderMessageBody(item.body)}</p>
                  {/* YouTube embed */}
                  {(() => {
                    const ytInfo = extractYouTubeInfo(item.body);
                    if (!ytInfo) return null;
                    const embedUrl = ytInfo.startTime
                      ? `https://www.youtube.com/embed/${ytInfo.videoId}?start=${ytInfo.startTime}`
                      : `https://www.youtube.com/embed/${ytInfo.videoId}`;
                    return (
                      <div className="dm-embed" onClick={e => e.stopPropagation()}>
                        <iframe
                          src={embedUrl}
                          title="YouTube playback"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    );
                  })()}
                  <span className="dm-time">{new Date(item.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                  {/* Reactions display */}
                  {reactions.get(item.id)?.length ? (
                    <div className="dm-reactions-display" onClick={e => e.stopPropagation()}>
                      {reactions.get(item.id)!.map(r => (
                        <button
                          key={r.emoji}
                          type="button"
                          className={`dm-reaction-badge ${r.reactorIds.includes(profile?.id ?? "") ? "own" : ""}`}
                          onClick={() => toggleReaction(item.id, r.emoji)}
                        >
                          {r.emoji} {r.count > 1 && <span>{r.count}</span>}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {/* Reaction picker */}
                  {reactionPickerFor === item.id && (
                    <div className="dm-reaction-picker" onClick={e => e.stopPropagation()}>
                      {quickEmojis.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          className={`dm-reaction-btn ${reactions.get(item.id)?.some(r => r.emoji === emoji && r.reactorIds.includes(profile?.id ?? "")) ? "active" : ""}`}
                          onClick={() => toggleReaction(item.id, emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="dm-reaction-btn reply-btn"
                        onClick={() => {
                          setReplyingTo(item);
                          setReactionPickerFor(null);
                        }}
                      >
                        ↩️
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Compose */}
      <div className="dm-compose" ref={composeRef}>
        {/* Reply preview */}
        {replyingTo && (
          <div className="dm-reply-preview">
            <div className="dm-reply-preview-content">
              <span className="dm-reply-preview-label">Replying to {replyingTo.profiles?.display_name ?? "User"}</span>
              <span className="dm-reply-preview-text">
                {replyingTo.body.length > 50 ? replyingTo.body.slice(0, 50) + "..." : replyingTo.body}
              </span>
            </div>
            <button
              type="button"
              className="dm-reply-preview-close"
              onClick={() => setReplyingTo(null)}
            >
              ✕
            </button>
          </div>
        )}
        {/* Emoji drawer */}
        <div className={`dm-emoji-drawer ${emojiDrawerOpen ? "open" : ""}`}>
          {allEmojis.map(emoji => (
            <button
              key={emoji}
              type="button"
              className="dm-emoji-btn"
              onClick={() => {
                setMessage(prev => `${prev}${emoji}`);
                setEmojiDrawerOpen(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
        {/* Input row */}
        <div className="dm-compose-row">
          <div className="dm-emoji-group">
            <button
              type="button"
              className="dm-quick-emoji"
              onClick={() => sendQuickEmoji(defaultEmoji)}
              disabled={sending}
            >
              {defaultEmoji}
            </button>
            <button
              type="button"
              className="dm-emoji-toggle"
              onClick={() => setEmojiDrawerOpen(!emojiDrawerOpen)}
            >
              {emojiDrawerOpen ? "▼" : "▲"}
            </button>
          </div>
          <input
            type="text"
            className="dm-input"
            placeholder="Message..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
          />
          <button
            type="button"
            className="dm-send-btn"
            onClick={sendMessage}
            disabled={!message.trim() || sending}
          >
            {sending ? "..." : "Send"}
          </button>
        </div>
      </div>

      <style>{`
        .dm-thread {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 140px);
          max-width: 600px;
          margin: 0 auto;
        }

        .dm-thread-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: var(--surface);
          border-radius: 12px;
          margin-bottom: 12px;
        }

        .dm-back-btn {
          background: none;
          border: none;
          padding: 8px;
          cursor: pointer;
          color: var(--text);
        }

        .dm-back-btn svg {
          width: 24px;
          height: 24px;
        }

        .dm-header-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          overflow: hidden;
          background: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .dm-header-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .dm-header-avatar span {
          color: white;
          font-weight: 600;
        }

        .dm-header-info {
          flex: 1;
        }

        .dm-header-name {
          font-weight: 600;
          display: block;
        }

        .dm-header-status {
          font-size: 0.75rem;
          color: var(--warning, #f59e0b);
        }

        .dm-messages {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .dm-empty-msg {
          text-align: center;
          margin-top: 24px;
        }

        .dm-bubble {
          display: flex;
          gap: 8px;
          max-width: 85%;
          align-self: flex-start;
        }

        .dm-bubble.own {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .dm-bubble-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          overflow: hidden;
          background: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .dm-bubble-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .dm-bubble-avatar span {
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .dm-bubble-content {
          background: var(--surface);
          padding: 10px 14px;
          border-radius: 16px;
          position: relative;
        }

        .dm-bubble.own .dm-bubble-content {
          background: var(--primary);
          color: white;
        }

        .dm-bubble-content p {
          margin: 0;
          word-break: break-word;
        }

        .dm-link {
          color: var(--primary);
          text-decoration: underline;
        }

        .dm-bubble.own .dm-link {
          color: rgba(255, 255, 255, 0.9);
        }

        .dm-reply-quote {
          background: rgba(0, 0, 0, 0.08);
          padding: 6px 10px;
          border-radius: 8px;
          margin-bottom: 6px;
          border-left: 3px solid var(--primary);
          font-size: 0.8rem;
          max-width: 100%;
          overflow: hidden;
        }

        .dm-bubble.own .dm-reply-quote {
          background: rgba(255, 255, 255, 0.15);
          border-left-color: rgba(255, 255, 255, 0.5);
        }

        .dm-reply-author {
          display: block;
          font-weight: 600;
          margin-bottom: 2px;
        }

        .dm-reply-text {
          display: block;
          opacity: 0.8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dm-time {
          display: block;
          font-size: 0.7rem;
          opacity: 0.6;
          margin-top: 4px;
        }

        .dm-embed {
          margin-top: 8px;
          border-radius: 8px;
          overflow: hidden;
        }

        .dm-embed iframe {
          width: 100%;
          aspect-ratio: 16/9;
          border: none;
        }

        .dm-reactions-display {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          margin-top: 6px;
        }

        .dm-reaction-badge {
          background: rgba(0, 0, 0, 0.08);
          border: none;
          border-radius: 12px;
          padding: 2px 8px;
          font-size: 0.85rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .dm-reaction-badge.own {
          background: rgba(var(--primary-rgb, 79, 70, 229), 0.2);
        }

        .dm-bubble.own .dm-reaction-badge {
          background: rgba(255, 255, 255, 0.2);
        }

        .dm-reaction-picker {
          display: flex;
          gap: 4px;
          margin-top: 8px;
          padding: 6px;
          background: var(--surface);
          border-radius: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .dm-reaction-btn {
          background: none;
          border: none;
          font-size: 1.2rem;
          padding: 4px 8px;
          cursor: pointer;
          border-radius: 8px;
        }

        .dm-reaction-btn:hover {
          background: rgba(0, 0, 0, 0.08);
        }

        .dm-reaction-btn.active {
          background: rgba(var(--primary-rgb, 79, 70, 229), 0.2);
        }

        .dm-compose {
          padding: 12px;
          background: var(--surface);
          border-radius: 12px;
        }

        .dm-reply-preview {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.04);
          border-radius: 8px;
          margin-bottom: 8px;
        }

        .dm-reply-preview-content {
          flex: 1;
          min-width: 0;
        }

        .dm-reply-preview-label {
          display: block;
          font-size: 0.75rem;
          color: var(--primary);
          font-weight: 600;
        }

        .dm-reply-preview-text {
          display: block;
          font-size: 0.85rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dm-reply-preview-close {
          background: none;
          border: none;
          font-size: 1rem;
          cursor: pointer;
          color: var(--text-muted);
          padding: 4px;
        }

        .dm-emoji-drawer {
          display: none;
          flex-wrap: wrap;
          gap: 4px;
          padding: 8px;
          margin-bottom: 8px;
          background: rgba(0, 0, 0, 0.04);
          border-radius: 8px;
        }

        .dm-emoji-drawer.open {
          display: flex;
        }

        .dm-emoji-btn {
          background: none;
          border: none;
          font-size: 1.25rem;
          padding: 4px;
          cursor: pointer;
          border-radius: 4px;
        }

        .dm-emoji-btn:hover {
          background: rgba(0, 0, 0, 0.08);
        }

        .dm-compose-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .dm-emoji-group {
          display: flex;
        }

        .dm-quick-emoji {
          background: none;
          border: none;
          font-size: 1.5rem;
          padding: 4px 8px;
          cursor: pointer;
        }

        .dm-emoji-toggle {
          background: none;
          border: none;
          font-size: 0.75rem;
          padding: 4px;
          cursor: pointer;
          color: var(--text-muted);
        }

        .dm-input {
          flex: 1;
          padding: 10px 14px;
          border: 1px solid var(--border);
          border-radius: 20px;
          font-size: 1rem;
          background: var(--background);
        }

        .dm-input:focus {
          outline: none;
          border-color: var(--primary);
        }

        .dm-send-btn {
          background: var(--primary);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 20px;
          font-weight: 600;
          cursor: pointer;
        }

        .dm-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
