import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import Card from "./Card";
import Button from "./Button";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

type RoundRow = {
  ID: string;
  Created: string;
  Name: string;
  Description: string;
  "Playlist URL": string;
};

type SubmissionRow = {
  "Spotify URI": string;
  Title: string;
  Album: string;
  "Artist(s)": string;
  "Submitter ID": string;
  Created: string;
  Comment: string;
  "Round ID": string;
  "Visible To Voters": string;
};

type CommentRow = {
  id: string;
  round_external_id: string;
  body: string;
  created_at: string;
  profiles?: { display_name: string | null } | null;
};

type NotifyProfile = {
  email: string | null;
  ntfy_topic: string | null;
  chat_notify_enabled: boolean | null;
  music_league_username: string | null;
};

async function fetchCsv<T>(path: string) {
  const response = await fetch(path);
  const text = await response.text();
  const parsed = Papa.parse<T>(text, { header: true, skipEmptyLines: true });
  return parsed.data;
}

export default function SeasonRounds() {
  const { group, profile } = useAuth();
  const [rounds, setRounds] = useState<RoundRow[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      const [roundData, submissionData] = await Promise.all([
        fetchCsv<RoundRow>("/data/rounds.csv"),
        fetchCsv<SubmissionRow>("/data/submissions.csv"),
      ]);
      setRounds(roundData);
      setSubmissions(submissionData);
    };

    load().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!group) return;
    const loadComments = async () => {
      const { data } = await supabase
        .from("season_round_comments")
        .select("id,round_external_id,body,created_at, profiles(display_name)")
        .eq("group_id", group.id)
        .order("created_at", { ascending: true });
      setComments((data as CommentRow[]) ?? []);
    };
    loadComments();
  }, [group]);

  const submissionsByRound = useMemo(() => {
    const map = new Map<string, SubmissionRow[]>();
    submissions.forEach((row) => {
      const list = map.get(row["Round ID"]) ?? [];
      list.push(row);
      map.set(row["Round ID"], list);
    });
    return map;
  }, [submissions]);

  const commentsByRound = useMemo(() => {
    const map = new Map<string, CommentRow[]>();
    comments.forEach((row) => {
      const list = map.get(row.round_external_id) ?? [];
      list.push(row);
      map.set(row.round_external_id, list);
    });
    return map;
  }, [comments]);

  const submitComment = async (roundId: string) => {
    if (!group || !profile) return;
    const body = drafts[roundId];
    if (!body?.trim()) return;
    const { error } = await supabase.from("season_round_comments").insert({
      group_id: group.id,
      round_external_id: roundId,
      author_id: profile.id,
      body: body.trim(),
    });

    if (!error) {
      setDrafts((prev) => ({ ...prev, [roundId]: "" }));
      const { data } = await supabase
        .from("season_round_comments")
        .select("id,round_external_id,body,created_at, profiles(display_name)")
        .eq("group_id", group.id)
        .order("created_at", { ascending: true });
      setComments((data as CommentRow[]) ?? []);

      const { data: memberData } = await supabase
        .from("group_members")
        .select("profiles(email,ntfy_topic,chat_notify_enabled,music_league_username)")
        .eq("group_id", group.id)
        .limit(50);

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

      const roundName = rounds.find((round) => round.ID === roundId)?.Name ?? "Season 1 Round";

      await supabase.functions.invoke("notify", {
        body: {
          title: "Season round chat",
          message: `${roundName} — ${profile.display_name ?? "Someone"}: ${body.trim()}`,
          ntfyTopics: topics,
          recipients: emails,
        },
      });
    }
  };

  if (!rounds.length) return null;

  return (
    <section className="season-rounds-section">
      <h2>Season 1 Rounds</h2>
      <div className="round-list">
        {rounds.map((round) => (
          <Card key={round.ID} className="round-card full">
            <div>
              <strong>{round.Name}</strong>
              <p className="muted">{round.Description}</p>
              {round["Playlist URL"] ? (
                <a className="text-link" href={round["Playlist URL"]} target="_blank" rel="noreferrer">
                  Open playlist
                </a>
              ) : null}
            </div>
            <div className="round-submissions">
              {(submissionsByRound.get(round.ID) ?? []).slice(0, 6).map((submission) => (
                <div key={submission["Spotify URI"]} className="round-submission">
                  <strong>{submission.Title}</strong>
                  <span className="muted">{submission["Artist(s)"]}</span>
                </div>
              ))}
            </div>
            <div className="round-chat">
              <h4>Round Chat</h4>
              <div className="round-chat-thread">
                {(commentsByRound.get(round.ID) ?? []).map((comment) => (
                  <div key={comment.id} className="round-comment">
                    <strong>{comment.profiles?.display_name ?? "Family"}</strong>
                    <p>{comment.body}</p>
                  </div>
                ))}
              </div>
              <div className="round-comment-compose">
                <input
                  className="field-input"
                  placeholder="Add a note about this round..."
                  value={drafts[round.ID] ?? ""}
                  onChange={(event) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [round.ID]: event.target.value,
                    }))
                  }
                />
                <Button type="button" variant="secondary" onClick={() => submitComment(round.ID)}>
                  Send
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
