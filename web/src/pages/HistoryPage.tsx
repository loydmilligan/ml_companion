import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import RoundChat from "../components/RoundChat";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

type LeagueRow = {
  id: string;
  name: string;
  season_number: number | null;
};

type RoundRow = {
  id: string;
  theme: string;
  theme_description: string | null;
  theme_author: string | null;
  season_number: number | null;
  round_number: number | null;
  status: string;
  created_at: string;
  submission_deadline: string | null;
  voting_deadline: string | null;
};

type SubmissionRow = {
  id: string;
  title: string;
  artist: string | null;
  link: string | null;
  submitter_name: string | null;
  artwork_url: string | null;
  release_year: number | null;
  genres: string | null;
};

type VoteRow = {
  submission_id: string;
  voter_name: string | null;
  points: number | null;
  comment: string | null;
};

export default function HistoryPage() {
  const { group } = useAuth();
  const [leagues, setLeagues] = useState<LeagueRow[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [completedRounds, setCompletedRounds] = useState<RoundRow[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [votes, setVotes] = useState<VoteRow[]>([]);
  const [seasonStats, setSeasonStats] = useState<{
    totalRounds: number;
    totalSubmissions: number;
    totalVotes: number;
    topTracks: { title: string; artist: string | null; points: number }[];
  } | null>(null);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState<string | null>(null);
  const [storyLoading, setStoryLoading] = useState(false);
  const [showAiJson, setShowAiJson] = useState(false);

  useEffect(() => {
    if (!group) return;
    const load = async () => {
      const { data: leagueData } = await supabase
        .from("leagues")
        .select("id,name,season_number")
        .eq("group_id", group.id)
        .order("season_number", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      const list = (leagueData as LeagueRow[]) ?? [];
      setLeagues(list);
      setSelectedLeagueId((prev) => prev ?? list[0]?.id ?? null);
    };
    load();
  }, [group]);

  useEffect(() => {
    if (!selectedLeagueId) return;
    const loadRounds = async () => {
      const { data } = await supabase
        .from("rounds")
        .select(
          "id,theme,theme_description,theme_author,season_number,round_number,status,created_at,submission_deadline,voting_deadline"
        )
        .eq("league_id", selectedLeagueId)
        .in("status", ["revealed", "archived"])
        .order("round_number", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      const rounds = (data as RoundRow[]) ?? [];
      setCompletedRounds(rounds);
      setSelectedRoundId((prev) => prev ?? rounds[0]?.id ?? null);
    };
    loadRounds();
  }, [selectedLeagueId]);

  useEffect(() => {
    if (!selectedRoundId || !group) return;
    const seedRoundChat = async () => {
      const { count } = await supabase
        .from("round_chats")
        .select("id", { count: "exact", head: true })
        .eq("round_id", selectedRoundId);

      if (count && count > 0) return;
      const round = completedRounds.find((item) => item.id === selectedRoundId);
      if (!round) return;

      const start = round.created_at;
      const end = round.voting_deadline ?? round.submission_deadline ?? round.created_at;

      const { data: groupMessages } = await supabase
        .from("group_messages")
        .select("id,body,author_id,created_at")
        .eq("group_id", group.id)
        .gte("created_at", start)
        .lte("created_at", end)
        .order("created_at", { ascending: true });

      if (!groupMessages?.length) return;
      await supabase.from("round_chats").insert(
        groupMessages.map((message) => ({
          round_id: selectedRoundId,
          body: message.body,
          author_id: message.author_id,
          created_at: message.created_at,
        }))
      );
    };
    seedRoundChat();
  }, [selectedRoundId, completedRounds, group]);

  useEffect(() => {
    if (!selectedRoundId) {
      setSubmissions([]);
      setVotes([]);
      return;
    }
    const loadRoundData = async () => {
      const { data: submissionData } = await supabase
        .from("submissions")
        .select("id,title,artist,link,submitter_name,artwork_url,release_year,genres")
        .eq("round_id", selectedRoundId)
        .order("created_at", { ascending: true });
      const submissionRows = (submissionData as SubmissionRow[]) ?? [];
      setSubmissions(submissionRows);

      if (submissionRows.length) {
        const submissionIds = submissionRows.map((row) => row.id);
        const { data: voteData } = await supabase
          .from("votes")
          .select("submission_id,voter_name,points,comment")
          .in("submission_id", submissionIds);
        setVotes((voteData as VoteRow[]) ?? []);
      } else {
        setVotes([]);
      }
    };
    loadRoundData();
  }, [selectedRoundId]);

  useEffect(() => {
    if (!selectedLeagueId) return;
    const loadStats = async () => {
      const { data: roundData } = await supabase
        .from("rounds")
        .select("id")
        .eq("league_id", selectedLeagueId);
      const roundIds = (roundData ?? []).map((row) => row.id);
      if (!roundIds.length) {
        setSeasonStats(null);
        return;
      }

      const { data: submissionsData } = await supabase
        .from("submissions")
        .select("id,title,artist")
        .in("round_id", roundIds);
      const submissionIds = (submissionsData ?? []).map((row) => row.id);

      let voteRows: VoteRow[] = [];
      if (submissionIds.length) {
        const { data: voteData } = await supabase
          .from("votes")
          .select("submission_id,points")
          .in("submission_id", submissionIds);
        voteRows = (voteData as VoteRow[]) ?? [];
      }

      const voteTotals = new Map<string, number>();
      voteRows.forEach((vote) => {
        if (!vote.submission_id) return;
        voteTotals.set(vote.submission_id, (voteTotals.get(vote.submission_id) ?? 0) + (vote.points ?? 0));
      });

      const topTracks = (submissionsData ?? [])
        .map((submission) => ({
          title: submission.title,
          artist: submission.artist ?? null,
          points: voteTotals.get(submission.id) ?? 0,
        }))
        .sort((a, b) => b.points - a.points)
        .slice(0, 5);

      setSeasonStats({
        totalRounds: roundIds.length,
        totalSubmissions: submissionsData?.length ?? 0,
        totalVotes: voteRows.reduce((sum, row) => sum + (row.points ?? 0), 0),
        topTracks,
      });
    };
    loadStats();
  }, [selectedLeagueId]);

  const roundSummary = useMemo(() => {
    if (!selectedRoundId) return null;
    const submissionVotes = new Map<string, number>();
    votes.forEach((vote) => {
      if (!vote.submission_id) return;
      submissionVotes.set(vote.submission_id, (submissionVotes.get(vote.submission_id) ?? 0) + (vote.points ?? 0));
    });

    const genreCounts = new Map<string, number>();
    const yearCounts = new Map<string, number>();
    const songs = submissions.map((song) => {
      const genre = song.genres ? song.genres.split(",")[0]?.trim() : "Unknown";
      const year = song.release_year ? String(song.release_year) : "Unknown";
      genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
      yearCounts.set(year, (yearCounts.get(year) ?? 0) + 1);
      return {
        ...song,
        points: submissionVotes.get(song.id) ?? 0,
        primaryGenre: genre,
        releaseYear: year,
      };
    });

    const genreScatter = Array.from(genreCounts.entries())
      .filter(([genre]) => genre !== "Unknown")
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    const yearChart = Array.from(yearCounts.entries())
      .filter(([year]) => year !== "Unknown")
      .sort((a, b) => Number(a[0]) - Number(b[0]));

    return { songs, genreScatter, yearChart };
  }, [selectedRoundId, submissions, votes]);

  const generateNarrative = async () => {
    if (!selectedRoundId || !roundSummary) return;
    setStoryLoading(true);
    const round = completedRounds.find((r) => r.id === selectedRoundId);
    const { data, error } = await supabase.functions.invoke("openrouter-round-story", {
      body: {
        round: {
          title: round?.theme,
          description: round?.theme_description,
          author: round?.theme_author,
        },
        songs: roundSummary.songs,
        votes,
      },
    });
    if (!error) {
      setNarrative(data?.narrative ?? null);
      setImagePrompt(data?.image_prompt ?? null);
    }
    setStoryLoading(false);
  };

  const selectedRound = completedRounds.find((round) => round.id === selectedRoundId) ?? null;

  return (
    <div className="page">
      <div className="page-header">
        <h1>History</h1>
        <p>Explore completed rounds and season highlights.</p>
      </div>

      <div className="history-nav">
        <a href="#round-review">Round review</a>
        <a href="#season-snapshot">Season snapshot</a>
      </div>

      <section id="round-review" className="history-section">
        <div className="section-header">
          <div>
            <h2>Round Review</h2>
            <p className="muted">Pick a season and completed round to dive into the recap.</p>
          </div>
        </div>

        <div className="history-dashboard">
          <Card className="dashboard-card compact">
            <h3>Season</h3>
            <select
              className="field-input"
              value={selectedLeagueId ?? ""}
              onChange={(event) => {
                setSelectedLeagueId(event.target.value || null);
                setSelectedRoundId(null);
              }}
            >
              <option value="">Select season</option>
              {leagues.map((league) => (
                <option key={league.id} value={league.id}>
                  Season {league.season_number ?? "—"} · {league.name}
                </option>
              ))}
            </select>
            <h3>Round</h3>
            <select
              className="field-input"
              value={selectedRoundId ?? ""}
              onChange={(event) => setSelectedRoundId(event.target.value || null)}
            >
              <option value="">Select round</option>
              {completedRounds.map((round) => (
                <option key={round.id} value={round.id}>
                  {round.round_number ?? "Round"} · {round.theme}
                </option>
              ))}
            </select>
            <button
              className="pill-button"
              type="button"
              onClick={() => {
                if (!completedRounds.length) return;
                const random = completedRounds[Math.floor(Math.random() * completedRounds.length)];
                setSelectedRoundId(random.id);
              }}
            >
              Random round
            </button>
          </Card>

          <Card className="dashboard-card compact">
            <h3>{selectedRound?.theme ?? "Pick a round"}</h3>
            <p className="muted">{selectedRound?.theme_description ?? "Select a round to see details."}</p>
            {selectedRound?.theme_author ? <p className="muted">Theme by {selectedRound.theme_author}</p> : null}
            {selectedRound ? (
              <div className="pill-row">
                <span className="pill">Round {selectedRound.round_number ?? "—"}</span>
                <span className="pill mint">{selectedRound.status.toUpperCase()}</span>
              </div>
            ) : null}
          </Card>

          <Card className="dashboard-card compact">
            <h3>Round listening</h3>
            <div className="round-track-grid">
              {roundSummary?.songs?.length ? (
                roundSummary.songs.slice(0, 6).map((song) => (
                  <div key={song.id} className="round-track-card">
                    {song.artwork_url ? (
                      <img src={song.artwork_url} alt={song.title} />
                    ) : (
                      <div className="art-placeholder" />
                    )}
                    <div>
                      <strong>{song.title}</strong>
                      <span className="muted">{song.artist ?? "Unknown artist"}</span>
                      <span className="muted">{song.releaseYear} · {song.primaryGenre}</span>
                      {song.link ? (
                        <a className="text-link" href={song.link} target="_blank" rel="noreferrer">
                          Listen
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <p className="muted">No submissions yet for this round.</p>
              )}
            </div>
          </Card>

          <Card className="dashboard-card compact">
            <h3>Release year mix</h3>
            {roundSummary?.yearChart?.length ? (
              <div className="year-chart">
                {roundSummary.yearChart.map(([year, count]) => (
                  <div key={year} className="year-bar">
                    <span>{year}</span>
                    <div className="bar">
                      <div className="bar-fill" style={{ width: `${count * 18}px` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">No release year data for this round yet.</p>
            )}
            <div className="genre-cloud">
              {roundSummary?.genreScatter?.length ? (
                roundSummary.genreScatter.map(([genre, count]) => (
                  <span key={genre} className={`pill ${count > 2 ? "mint" : ""}`}>
                    {genre}
                  </span>
                ))
              ) : (
                <span className="muted">No genre data yet.</span>
              )}
            </div>
          </Card>

          <Card className="dashboard-card compact">
            <h3>AI narrative</h3>
            <button className="button" type="button" onClick={generateNarrative} disabled={storyLoading}>
              {storyLoading ? "Generating..." : "Generate round story + art prompt"}
            </button>
            {narrative ? (
              <div className="narrative-block">
                <h4>Round narrative</h4>
                <p>{narrative}</p>
              </div>
            ) : null}
            {imagePrompt ? (
              <div className="narrative-block">
                <h4>Hero image prompt</h4>
                <p>{imagePrompt}</p>
              </div>
            ) : null}
            <div className="round-track-footer">
              <button className="pill-button" type="button" onClick={() => setShowAiJson((prev) => !prev)}>
                {showAiJson ? "Hide JSON" : "Show JSON payload"}
              </button>
            </div>
            {showAiJson ? (
              <pre className="code-block">
                {JSON.stringify({ round: selectedRound, songs: roundSummary?.songs ?? [], votes }, null, 2)}
              </pre>
            ) : null}
          </Card>
        </div>
        {selectedRoundId ? (
          <div className="history-chat">
            <Card className="dashboard-card compact">
              <h3>Round chat</h3>
              <p className="muted">
                This conversation starts with the group chat highlights from the round and continues here.
              </p>
              <RoundChat roundId={selectedRoundId} />
            </Card>
          </div>
        ) : null}
      </section>

      <section id="season-snapshot" className="history-section">
        <div className="section-header">
          <div>
            <h2>Season Snapshot</h2>
            <p className="muted">Quick stats for the selected season.</p>
          </div>
        </div>
        <div className="history-dashboard">
          <Card className="dashboard-card compact">
            <h3>Season totals</h3>
            <div className="stat-highlight">
              <strong>{seasonStats?.totalRounds ?? 0}</strong>
              <span className="muted">Rounds</span>
            </div>
            <div className="stat-highlight">
              <strong>{seasonStats?.totalSubmissions ?? 0}</strong>
              <span className="muted">Submissions</span>
            </div>
            <div className="stat-highlight">
              <strong>{seasonStats?.totalVotes ?? 0}</strong>
              <span className="muted">Votes cast</span>
            </div>
          </Card>

          <Card className="dashboard-card compact">
            <h3>Top tracks</h3>
            <ul className="highlight-list">
              {seasonStats?.topTracks?.map((track) => (
                <li key={`${track.title}-${track.artist}`}>
                  <div>
                    <strong>{track.title}</strong>
                    <span className="muted">{track.artist ?? "Unknown artist"}</span>
                  </div>
                  <span className="pill">{track.points} pts</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="dashboard-card compact">
            <h3>Completed rounds</h3>
            <div className="history-list compact">
              {completedRounds.map((round) => (
                <div key={round.id} className="history-item">
                  <div>
                    <strong>{round.theme}</strong>
                    <span className="muted">Round {round.round_number ?? "—"}</span>
                  </div>
                  <button className="pill-button" type="button" onClick={() => setSelectedRoundId(round.id)}>
                    Review
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
