import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";
import RoundComments from "../components/RoundComments";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

type RoundInfo = {
  id: string;
  theme: string;
  status: string;
  submission_deadline: string | null;
  voting_deadline: string | null;
};

type Submission = {
  id: string;
  title: string;
  artist: string | null;
  link: string | null;
  submitter_name: string | null;
  artwork_url: string | null;
};

type SeasonCompetitor = {
  id: string;
  name: string;
};

export default function RoundDetailPage() {
  const { id } = useParams();
  const { group } = useAuth();
  const isLead = group?.role === "lead";
  const [round, setRound] = useState<RoundInfo | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [link, setLink] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null);
  const [seasonCompetitors, setSeasonCompetitors] = useState<SeasonCompetitor[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      const { data: roundData } = await supabase
        .from("rounds")
        .select("id,theme,status,submission_deadline,voting_deadline")
        .eq("id", id)
        .maybeSingle();
      const { data: submissionData } = await supabase
        .from("submissions")
        .select("id,title,artist,link,submitter_name,artwork_url")
        .eq("round_id", id)
        .order("created_at", { ascending: true });

      setRound(roundData ?? null);
      setSubmissions((submissionData as Submission[]) ?? []);
      setLoading(false);
    };

    load();
  }, [id, refreshKey]);

  const handleAddSubmission = async () => {
    if (!id || !title.trim()) return;
    const { error } = await supabase.from("submissions").insert({
      round_id: id,
      title: title.trim(),
      artist: artist.trim() || null,
      link: link.trim() || null,
      submitter_name: submitterName.trim() || null,
      artwork_url: artworkUrl,
    });

    if (!error) {
      setTitle("");
      setArtist("");
      setLink("");
      setSubmitterName("");
      setArtworkUrl(null);
      setRefreshKey((prev) => prev + 1);
    }
  };

  useEffect(() => {
    if (!group) return;
    const loadCompetitors = async () => {
      const { data } = await supabase
        .from("season_competitors")
        .select("id,name")
        .eq("group_id", group.id)
        .order("name");
      setSeasonCompetitors((data as SeasonCompetitor[]) ?? []);
    };
    loadCompetitors();
  }, [group]);

  const fetchArtwork = async () => {
    if (!link.trim()) return;
    const url = link.trim();
    if (url.includes("youtube.com") || url.includes("youtu.be") || url.includes("music.youtube.com")) {
      const match = url.match(/[?&]v=([^&]+)/) ?? url.match(/youtu\.be\/([^?]+)/);
      const videoId = match?.[1];
      if (videoId) {
        setArtworkUrl(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
        return;
      }
    }

    if (url.includes("open.spotify.com")) {
      const response = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`);
      if (response.ok) {
        const data = await response.json();
        if (data?.thumbnail_url) setArtworkUrl(data.thumbnail_url);
      }
      return;
    }

    if (url.includes("music.apple.com")) {
      const response = await fetch(`https://tools.applemusic.com/oembed?url=${encodeURIComponent(url)}`);
      if (response.ok) {
        const data = await response.json();
        if (data?.thumbnail_url) setArtworkUrl(data.thumbnail_url);
      }
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>{round?.theme ?? "Round Detail"}</h1>
        <p className="muted">{round?.status ? round.status.toUpperCase() : "Round status"}</p>
      </div>
      <Card>
        <h2>Submissions</h2>
        {loading ? <p className="muted">Loading submissions...</p> : null}
        {!loading && !submissions.length ? (
          <p className="muted">No submissions yet. Add the first track below.</p>
        ) : (
          <ul className="submission-list">
            {submissions.map((submission) => (
              <li key={submission.id}>
                <div className="submission-meta">
                  {submission.artwork_url ? (
                    <img className="submission-art" src={submission.artwork_url} alt={submission.title} />
                  ) : null}
                  <div>
                    <strong>{submission.title}</strong>
                    <span className="muted">{submission.artist}</span>
                    {submission.submitter_name ? (
                      <span className="muted">Submitted by {submission.submitter_name}</span>
                    ) : null}
                  </div>
                </div>
                {submission.link ? (
                  <a className="text-link" href={submission.link} target="_blank" rel="noreferrer">
                    Open link
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {isLead ? (
          <div className="submission-form">
          <label className="field">
            <span className="field-label">Submitted by</span>
            <select
              className="field-input"
              value={submitterName}
              onChange={(event) => setSubmitterName(event.target.value)}
            >
              <option value="">Select or type below</option>
              {seasonCompetitors.map((competitor) => (
                <option key={competitor.id} value={competitor.name}>
                  {competitor.name}
                </option>
              ))}
            </select>
          </label>
          <input
            className="field-input"
            placeholder="Or type a submitter name"
            value={submitterName}
            onChange={(event) => setSubmitterName(event.target.value)}
          />
          <input
            className="field-input"
            placeholder="Song title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <input
            className="field-input"
            placeholder="Artist"
            value={artist}
            onChange={(event) => setArtist(event.target.value)}
          />
          <input
            className="field-input"
            placeholder="Spotify, Apple Music, or YouTube link"
            value={link}
            onChange={(event) => setLink(event.target.value)}
          />
          <Button type="button" variant="secondary" onClick={fetchArtwork} disabled={!link.trim()}>
            Fetch Album Art
          </Button>
          {artworkUrl ? <img className="submission-art-preview" src={artworkUrl} alt="Album art" /> : null}
          <Button type="button" onClick={handleAddSubmission} disabled={!title.trim()}>
            Add Submission
          </Button>
          </div>
        ) : (
          <p className="muted">Only admins can add submissions.</p>
        )}
      </Card>
      {id ? <RoundComments roundId={id} key={refreshKey} /> : null}
    </div>
  );
}
