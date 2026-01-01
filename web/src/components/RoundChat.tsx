import { useCallback, useEffect, useState } from "react";
import Button from "./Button";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

type RoundChatMessage = {
  id: string;
  body: string;
  author_id: string | null;
  created_at: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

export default function RoundChat({ roundId }: { roundId: string }) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<RoundChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadMessages = useCallback(async () => {
    if (!roundId) return;
    setLoading(true);
    const { data } = await supabase
      .from("round_chats")
      .select("id,body,author_id,created_at, profiles(display_name,avatar_url)")
      .eq("round_id", roundId)
      .order("created_at", { ascending: true });
    setMessages((data as unknown as RoundChatMessage[]) ?? []);
    setLoading(false);
  }, [roundId]);

  useEffect(() => {
    if (!roundId) return;
    loadMessages();
    const interval = window.setInterval(loadMessages, 8000);
    return () => window.clearInterval(interval);
  }, [roundId, loadMessages]);

  const sendMessage = async () => {
    if (!roundId || !profile || !message.trim()) return;
    setSending(true);
    const { error } = await supabase.from("round_chats").insert({
      round_id: roundId,
      author_id: profile.id,
      body: message.trim(),
    });
    if (!error) {
      setMessage("");
      loadMessages();
    }
    setSending(false);
  };

  return (
    <div className="round-chat-widget">
      <div className="chat-thread">
        {loading ? <p className="muted">Loading chat...</p> : null}
        {!loading && !messages.length ? <p className="muted">No messages yet.</p> : null}
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
          placeholder="Talk about the theme, submissions, or surprises..."
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        <Button type="button" onClick={sendMessage} disabled={sending || !message.trim()}>
          {sending ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  );
}
