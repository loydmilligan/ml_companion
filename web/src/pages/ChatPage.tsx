import { useCallback, useEffect, useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

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

type NotifyProfile = {
  email: string | null;
  ntfy_topic: string | null;
  chat_notify_enabled: boolean | null;
  music_league_username: string | null;
};

export default function ChatPage() {
  const { group, profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const emojis = ["🎧", "🔥", "😂", "👏", "😍", "🤔"];

  const loadMessages = useCallback(async () => {
    if (!group) return;
    setLoading(true);
    const { data } = await supabase
      .from("group_messages")
      .select("id,body,author_id,created_at, profiles(display_name,avatar_url)")
      .eq("group_id", group.id)
      .order("created_at", { ascending: true });

    setMessages((data as ChatMessage[]) ?? []);
    setLoading(false);
  }, [group]);

  useEffect(() => {
    if (!group) return;
    loadMessages();

    const interval = window.setInterval(() => {
      loadMessages();
    }, 8000);

    return () => {
      window.clearInterval(interval);
    };
  }, [group, loadMessages]);

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
      setMessages((data as ChatMessage[]) ?? []);

      const { data: memberData } = await supabase
        .from("group_members")
        .select("profiles(email,ntfy_topic,chat_notify_enabled,music_league_username)")
        .eq("group_id", group.id);

      const topics = (memberData ?? [])
        .map((row) => row.profiles as NotifyProfile)
        .filter((member) => member?.chat_notify_enabled !== false)
        .map((member) => {
          if (member.ntfy_topic) return member.ntfy_topic;
          if (member.music_league_username) {
            return `musicleague_${member.music_league_username.toLowerCase().replace(/\\s+/g, "_")}`;
          }
          return null;
        })
        .filter(Boolean) as string[];

      const emails = (memberData ?? [])
        .map((row) => row.profiles as NotifyProfile)
        .filter((member) => member?.chat_notify_enabled !== false)
        .map((member) => member.email)
        .filter(Boolean) as string[];

      await supabase.functions.invoke("notify", {
        body: {
          title: "Group chat message",
          message: `${profile.display_name ?? "Someone"}: ${message.trim()}`,
          ntfyTopics: topics,
          recipients: emails,
        },
      });
    }
    setSending(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Group Chat</h1>
        <p>Keep the conversation going between rounds.</p>
      </div>
      <Card className="chat-card">
        <div className="chat-thread">
          {loading ? <p className="muted">Loading messages...</p> : null}
          {!loading && !messages.length ? (
            <p className="muted">No messages yet. Start the conversation.</p>
          ) : null}
          {messages.map((item) => (
            <div key={item.id} className={item.author_id === profile?.id ? "chat-bubble own" : "chat-bubble"}>
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
              <p>{item.body}</p>
              <span className="chat-time">{new Date(item.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="chat-compose">
          <input
            className="field-input"
            placeholder="Send a quick update or ask a question..."
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          <Button type="button" onClick={sendMessage} disabled={sending || !message.trim()}>
            {sending ? "Sending..." : "Send"}
          </Button>
        </div>
        <div className="chat-emoji">
          {emojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="emoji-button"
              onClick={() => setMessage((prev) => `${prev}${emoji}`)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
