import { useEffect, useMemo, useState } from "react";
import Card from "./Card";
import Button from "./Button";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

type Submission = {
  id: string;
  title: string;
  artist: string | null;
  link: string | null;
  submitter_id: string | null;
};

type Comment = {
  id: string;
  submission_id: string;
  body: string;
  author_id: string | null;
  created_at: string;
  profiles?: {
    display_name: string | null;
  } | null;
};

type NotifyProfile = {
  email: string | null;
  chat_notify_enabled: boolean | null;
  email_notify_enabled: boolean | null;
};

export default function RoundComments({ roundId }: { roundId: string }) {
  const { profile, group } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: submissionData } = await supabase
        .from("submissions")
        .select("id,title,artist,link,submitter_id")
        .eq("round_id", roundId)
        .order("created_at", { ascending: true });

      const { data: commentData } = await supabase
        .from("comments")
        .select("id,submission_id,body,author_id,created_at, profiles(display_name)")
        .in(
          "submission_id",
          (submissionData ?? []).map((row) => row.id)
        )
        .order("created_at", { ascending: true });

      setSubmissions((submissionData as Submission[]) ?? []);
      setComments((commentData as unknown as Comment[]) ?? []);
      setLoading(false);
    };

    load();
  }, [roundId]);

  const groupedComments = useMemo(() => {
    const map = new Map<string, Comment[]>();
    comments.forEach((comment) => {
      const list = map.get(comment.submission_id) ?? [];
      list.push(comment);
      map.set(comment.submission_id, list);
    });
    return map;
  }, [comments]);

  const submitComment = async (submissionId: string) => {
    if (!profile || !group) return;
    const body = drafts[submissionId];
    if (!body?.trim()) return;

    const { error } = await supabase.from("comments").insert({
      submission_id: submissionId,
      author_id: profile.id,
      body: body.trim(),
      is_anonymous: false,
    });

    if (!error) {
      setDrafts((prev) => ({ ...prev, [submissionId]: "" }));
      const { data: commentData } = await supabase
        .from("comments")
        .select("id,submission_id,body,author_id,created_at, profiles(display_name)")
        .eq("submission_id", submissionId)
        .order("created_at", { ascending: true });
      setComments((prev) => [
        ...prev.filter((comment) => comment.submission_id !== submissionId),
        ...((commentData as unknown as Comment[]) ?? []),
      ]);

      const { data: memberData } = await supabase
        .from("group_members")
        .select("profiles(email,chat_notify_enabled,email_notify_enabled)")
        .eq("group_id", group?.id ?? "")
        .limit(50);

      const emails = (memberData ?? [])
        .map((row) => row.profiles as unknown as NotifyProfile)
        .filter((member) => member?.chat_notify_enabled !== false && member?.email_notify_enabled !== false)
        .map((member) => member.email)
        .filter(Boolean) as string[];

      await supabase.functions.invoke("notify", {
        body: {
          title: "Round chat message",
          message: `${profile.display_name ?? "Someone"}: ${body.trim()}`,
          recipients: emails,
        },
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <h2>Round Discussion</h2>
        <p className="muted">Loading submissions...</p>
      </Card>
    );
  }

  if (!submissions.length) {
    return (
      <Card>
        <h2>Round Discussion</h2>
        <p className="muted">No submissions yet for this round.</p>
      </Card>
    );
  }

  return (
    <div className="round-comments">
      {submissions.map((submission) => (
        <Card key={submission.id} className="round-comment-card">
          <div className="round-comment-header">
            <div>
              <h3>{submission.title}</h3>
              <p className="muted">{submission.artist}</p>
            </div>
            {submission.link ? (
              <a className="text-link" href={submission.link} target="_blank" rel="noreferrer">
                Open track
              </a>
            ) : null}
          </div>
          <div className="round-comment-thread">
            {(groupedComments.get(submission.id) ?? []).map((comment) => (
              <div key={comment.id} className="round-comment">
                <strong>{comment.profiles?.display_name ?? "Family"}</strong>
                <p>{comment.body}</p>
                <span className="chat-time">{new Date(comment.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="round-comment-compose">
            <input
              className="field-input"
              placeholder="Add a comment..."
              value={drafts[submission.id] ?? ""}
              onChange={(event) =>
                setDrafts((prev) => ({
                  ...prev,
                  [submission.id]: event.target.value,
                }))
              }
            />
            <Button type="button" variant="secondary" onClick={() => submitComment(submission.id)}>
              Send
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
