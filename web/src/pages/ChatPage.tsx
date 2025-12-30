import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
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
  chat_notify_enabled: boolean | null;
  email_notify_enabled: boolean | null;
};

type RoundSummary = {
  id: string;
  theme: string;
  theme_description: string | null;
  theme_author: string | null;
  status: "open" | "voting" | "revealed" | "archived";
  season_number: number | null;
  round_number: number | null;
  submission_deadline: string | null;
  voting_deadline: string | null;
  playlist_url: string | null;
  external_playlist_url: string | null;
};

type SubmissionRow = {
  id: string;
  title: string;
  artist: string | null;
  link: string | null;
  artwork_url: string | null;
  release_year: number | null;
  genres: string | null;
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

function buildPlaylistEmbed(url: string) {
  if (url.includes("open.spotify.com/playlist/")) {
    const id = url.split("open.spotify.com/playlist/")[1]?.split(/[?&]/)[0];
    return id ? `https://open.spotify.com/embed/playlist/${id}` : null;
  }
  if (url.includes("youtube.com/playlist") || url.includes("list=")) {
    const match = url.match(/[?&]list=([^&]+)/);
    const listId = match?.[1];
    return listId ? `https://www.youtube.com/embed/videoseries?list=${listId}` : null;
  }
  return null;
}

export default function ChatPage() {
  const { group, profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [round, setRound] = useState<RoundSummary | null>(null);
  const [roundLoading, setRoundLoading] = useState(true);
  const [roundSubmissions, setRoundSubmissions] = useState<SubmissionRow[]>([]);
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

  useEffect(() => {
    if (!group) return;
    const loadRound = async () => {
      setRoundLoading(true);
      const { data: leagueData } = await supabase
        .from("leagues")
        .select("id")
        .eq("group_id", group.id)
        .order("season_number", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (leagueData) {
        const { data: roundData } = await supabase
          .from("rounds")
          .select(
            "id,theme,theme_description,theme_author,status,season_number,round_number,submission_deadline,voting_deadline,playlist_url,external_playlist_url"
          )
          .eq("league_id", leagueData.id)
          .in("status", ["open", "voting"])
          .order("round_number", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        setRound((roundData as RoundSummary) ?? null);

        if (roundData) {
          const { data: submissionData } = await supabase
            .from("submissions")
            .select("id,title,artist,link,artwork_url,release_year,genres")
            .eq("round_id", roundData.id)
            .order("created_at", { ascending: true });
          setRoundSubmissions((submissionData as SubmissionRow[]) ?? []);
        } else {
          setRoundSubmissions([]);
        }
      } else {
        setRound(null);
        setRoundSubmissions([]);
      }
      setRoundLoading(false);
    };
    loadRound();
  }, [group]);

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
        .select("profiles(email,chat_notify_enabled,email_notify_enabled)")
        .eq("group_id", group.id);

      const emails = (memberData ?? [])
        .map((row) => row.profiles as NotifyProfile)
        .filter((member) => member?.chat_notify_enabled !== false && member?.email_notify_enabled !== false)
        .map((member) => member.email)
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

  const now = Date.now();
  const submissionMs = round?.submission_deadline ? new Date(round.submission_deadline).getTime() : null;
  const votingMs = round?.voting_deadline ? new Date(round.voting_deadline).getTime() : null;

  const computeUrgency = (deadlineMs: number | null) => {
    if (!deadlineMs) return { pct: 0, level: "neutral" };
    const remaining = deadlineMs - now;
    if (remaining <= 0) return { pct: 100, level: "overdue" };
    const totalWindow = 1000 * 60 * 60 * 72;
    const pct = Math.min(100, Math.max(10, (1 - remaining / totalWindow) * 100));
    if (remaining <= 1000 * 60 * 60 * 6) return { pct, level: "urgent" };
    if (remaining <= 1000 * 60 * 60 * 24) return { pct, level: "warning" };
    return { pct, level: "safe" };
  };

  const submissionUrgency = computeUrgency(submissionMs);
  const votingUrgency = computeUrgency(votingMs);

  const playlistEmbedUrl = useMemo(() => {
    const url = round?.playlist_url ?? round?.external_playlist_url ?? null;
    return url ? buildPlaylistEmbed(url) : null;
  }, [round]);

  const handleQuote = (submission: SubmissionRow) => {
    const label = submission.artist ? `${submission.title} — ${submission.artist}` : submission.title;
    const mention = submission.link ? `@[${label}](${submission.link})` : `@${label}`;
    setMessage((prev) => {
      const needsSpace = prev && !prev.endsWith(" ");
      return `${prev}${needsSpace ? " " : ""}${mention}`;
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Group Chat</h1>
        <p>Keep the conversation going between rounds.</p>
      </div>
      <Card className="current-round-card">
        <div className="current-round-header">
          <div>
            <p className="eyebrow">Current round</p>
            <h2>{round?.theme ?? "No active round yet"}</h2>
            {round?.theme_description ? <p className="muted">{round.theme_description}</p> : null}
            {round?.theme_author ? <p className="muted">Theme by {round.theme_author}</p> : null}
          </div>
          <div className="current-round-meta">
            {round?.season_number || round?.round_number ? (
              <span className="pill">
                Season {round?.season_number ?? "—"} · Round {round?.round_number ?? "—"}
              </span>
            ) : null}
            {round?.status ? <span className="pill mint">{round.status.toUpperCase()}</span> : null}
          </div>
        </div>
        {roundLoading ? (
          <p className="muted">Loading current round...</p>
        ) : round ? (
          <div className="current-round-body">
            <div className="current-round-main">
              <div className="deadline-grid">
                <div className="deadline-card">
                  <div className="deadline-header">
                    <span>Submission deadline</span>
                    <strong>
                      {round.submission_deadline
                        ? new Date(round.submission_deadline).toLocaleString()
                        : "Set a deadline"}
                    </strong>
                  </div>
                  <div className="deadline-bar">
                    <span
                      className={`deadline-fill ${submissionUrgency.level}`}
                      style={{ width: `${submissionUrgency.pct}%` }}
                    />
                  </div>
                </div>
                <div className="deadline-card">
                  <div className="deadline-header">
                    <span>Voting deadline</span>
                    <strong>
                      {round.voting_deadline ? new Date(round.voting_deadline).toLocaleString() : "Set a deadline"}
                    </strong>
                  </div>
                  <div className="deadline-bar">
                    <span
                      className={`deadline-fill ${votingUrgency.level}`}
                      style={{ width: `${votingUrgency.pct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="current-round-side">
              {playlistEmbedUrl ? (
                <div className="playlist-embed">
                  <iframe
                    src={playlistEmbedUrl}
                    title="Round playlist"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="playlist-placeholder">
                  <p className="muted">Add a playlist URL to embed listening here.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="muted">No active round yet. Ask an admin to add one.</p>
        )}
        {round && roundSubmissions.length ? (
          <div className="current-round-tracks">
            <h3>Current round songs</h3>
            <div className="round-track-grid">
              {roundSubmissions.map((song) => (
                <div key={song.id} className="round-track-card">
                  {song.artwork_url ? (
                    <img src={song.artwork_url} alt={song.title} />
                  ) : (
                    <div className="art-placeholder" />
                  )}
                  <div>
                    <strong>{song.title}</strong>
                    <span className="muted">{song.artist ?? "Unknown artist"}</span>
                    <span className="muted">
                      {song.release_year ?? "Year n/a"} · {song.genres?.split(",")[0]?.trim() ?? "Genre n/a"}
                    </span>
                    <div className="track-actions">
                      {song.link ? (
                        <a className="text-link" href={song.link} target="_blank" rel="noreferrer">
                          Listen
                        </a>
                      ) : null}
                      <button type="button" className="pill-button" onClick={() => handleQuote(song)}>
                        Quote in chat
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Card>
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
              <p>{renderMessageBody(item.body)}</p>
              {(() => {
                const videoId = extractYouTubeId(item.body);
                if (!videoId) return null;
                return (
                  <div className="chat-embed">
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
