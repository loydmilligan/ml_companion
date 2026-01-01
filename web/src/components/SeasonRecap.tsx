import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import Card from "./Card";

type CompetitorRow = {
  ID: string;
  Name: string;
};

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

type VoteRow = {
  "Spotify URI": string;
  "Voter ID": string;
  Created: string;
  "Points Assigned": string;
  Comment: string;
  "Round ID": string;
};

type TrackMetaRow = {
  "Spotify URI": string;
  "Release Year": string;
  Genres: string;
};

type DataState = {
  competitors: CompetitorRow[];
  rounds: RoundRow[];
  submissions: SubmissionRow[];
  votes: VoteRow[];
  trackMeta: TrackMetaRow[];
};

const emptyData: DataState = {
  competitors: [],
  rounds: [],
  submissions: [],
  votes: [],
  trackMeta: [],
};

async function fetchCsv<T>(path: string) {
  const response = await fetch(path);
  const text = await response.text();
  const parsed = Papa.parse<T>(text, { header: true, skipEmptyLines: true });
  return parsed.data;
}

async function fetchCsvMaybe<T>(path: string) {
  const response = await fetch(path);
  if (!response.ok) return [];
  const text = await response.text();
  const parsed = Papa.parse<T>(text, { header: true, skipEmptyLines: true });
  return parsed.data;
}

function extractYear(row: SubmissionRow) {
  const blob = `${row.Title} ${row.Album}`.toLowerCase();
  const match = blob.match(/(19|20)\\d{2}/);
  return match ? Number(match[0]) : null;
}

function decadeFromYear(year: number | null) {
  if (!year) return "Unknown";
  const decade = Math.floor(year / 10) * 10;
  return `${decade}s`;
}

function parseGenres(raw: string | null | undefined) {
  if (!raw) return [];
  return raw
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function SeasonRecap() {
  const [data, setData] = useState<DataState>(emptyData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [competitors, rounds, submissions, votes, trackMeta] = await Promise.all([
        fetchCsv<CompetitorRow>("/data/competitors.csv"),
        fetchCsv<RoundRow>("/data/rounds.csv"),
        fetchCsv<SubmissionRow>("/data/submissions.csv"),
        fetchCsv<VoteRow>("/data/votes.csv"),
        fetchCsvMaybe<TrackMetaRow>("/data/track_metadata.csv"),
      ]);

      setData({
        competitors,
        rounds,
        submissions,
        votes,
        trackMeta,
      });
      setLoading(false);
    };

    load().catch((error) => {
      console.error("Failed to load season recap", error);
      setLoading(false);
    });
  }, []);

  const recap = useMemo(() => {
    const competitorMap = new Map(data.competitors.map((c) => [c.ID, c.Name]));
    const roundMap = new Map(data.rounds.map((r) => [r.ID, r]));
    const metaMap = new Map(
      data.trackMeta.map((row) => [
        row["Spotify URI"],
        {
          year: Number(row["Release Year"]) || null,
          genres: parseGenres(row.Genres),
        },
      ])
    );

    const submissionKey = (row: SubmissionRow) => `${row["Round ID"]}::${row["Spotify URI"]}`;
    const submissionsByKey = new Map<string, SubmissionRow>();
    data.submissions.forEach((row) => {
      submissionsByKey.set(submissionKey(row), row);
    });

    const submissionCounts = new Map<string, number>();
    data.submissions.forEach((row) => {
      const submitter = row["Submitter ID"];
      submissionCounts.set(submitter, (submissionCounts.get(submitter) ?? 0) + 1);
    });

    const voteTotals = new Map<string, number>();
    data.votes.forEach((row) => {
      const key = `${row["Round ID"]}::${row["Spotify URI"]}`;
      const points = Number(row["Points Assigned"]) || 0;
      voteTotals.set(key, (voteTotals.get(key) ?? 0) + points);
    });

    const voterTally = new Map<string, Map<string, number>>();
    data.votes.forEach((row) => {
      const key = `${row["Round ID"]}::${row["Spotify URI"]}`;
      const submission = submissionsByKey.get(key);
      if (!submission) return;
      const voterId = row["Voter ID"];
      const submitterId = submission["Submitter ID"];
      if (voterId === submitterId) return;
      const points = Number(row["Points Assigned"]) || 0;
      const perVoter = voterTally.get(voterId) ?? new Map<string, number>();
      perVoter.set(submitterId, (perVoter.get(submitterId) ?? 0) + points);
      voterTally.set(voterId, perVoter);
    });

    const voteTendencies = Array.from(voterTally.entries()).map(([voterId, tally]) => {
      const entries = Array.from(tally.entries()).sort((a, b) => b[1] - a[1]);
      const most = entries[0];
      const least = entries[entries.length - 1];
      return {
        voterId,
        voterName: competitorMap.get(voterId) ?? voterId,
        most: most ? { id: most[0], name: competitorMap.get(most[0]) ?? most[0], points: most[1] } : null,
        least: least ? { id: least[0], name: competitorMap.get(least[0]) ?? least[0], points: least[1] } : null,
      };
    });

    const decadeBySubmitter = new Map<string, Map<string, number>>();
    data.submissions.forEach((row) => {
      const meta = metaMap.get(row["Spotify URI"]);
      const year = meta?.year ?? extractYear(row);
      const decade = decadeFromYear(year);
      const submitter = row["Submitter ID"];
      const map = decadeBySubmitter.get(submitter) ?? new Map<string, number>();
      map.set(decade, (map.get(decade) ?? 0) + 1);
      decadeBySubmitter.set(submitter, map);
    });

    const decadeTrends = Array.from(decadeBySubmitter.entries()).map(([submitterId, counts]) => {
      const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
      const top = sorted[0];
      return {
        submitterId,
        submitterName: competitorMap.get(submitterId) ?? submitterId,
        decade: top ? top[0] : "Unknown",
        count: top ? top[1] : 0,
      };
    });

    const decadeVoteTotals = new Map<string, number>();
    data.votes.forEach((row) => {
      const key = `${row["Round ID"]}::${row["Spotify URI"]}`;
      const submission = submissionsByKey.get(key);
      if (!submission) return;
      const meta = metaMap.get(submission["Spotify URI"]);
      const year = meta?.year ?? extractYear(submission);
      const decade = decadeFromYear(year);
      if (decade === "Unknown") return;
      const points = Number(row["Points Assigned"]) || 0;
      decadeVoteTotals.set(decade, (decadeVoteTotals.get(decade) ?? 0) + points);
    });
    const topDecadeByVotes = Array.from(decadeVoteTotals.entries()).sort((a, b) => b[1] - a[1])[0];

    const genreBySubmitter = new Map<string, Map<string, number>>();
    data.submissions.forEach((row) => {
      const meta = metaMap.get(row["Spotify URI"]);
      const genres = meta?.genres ?? [];
      const primaryGenre = genres[0] ?? "Unknown";
      const submitter = row["Submitter ID"];
      const map = genreBySubmitter.get(submitter) ?? new Map<string, number>();
      map.set(primaryGenre, (map.get(primaryGenre) ?? 0) + 1);
      genreBySubmitter.set(submitter, map);
    });

    const genreTrends = Array.from(genreBySubmitter.entries()).map(([submitterId, counts]) => {
      const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
      const top = sorted[0];
      return {
        submitterId,
        submitterName: competitorMap.get(submitterId) ?? submitterId,
        genre: top ? top[0] : "Unknown",
        count: top ? top[1] : 0,
      };
    });

    const genreVoteTotals = new Map<string, number>();
    data.votes.forEach((row) => {
      const key = `${row["Round ID"]}::${row["Spotify URI"]}`;
      const submission = submissionsByKey.get(key);
      if (!submission) return;
      const meta = metaMap.get(submission["Spotify URI"]);
      const primaryGenre = meta?.genres?.[0] ?? "Unknown";
      if (primaryGenre === "Unknown") return;
      const points = Number(row["Points Assigned"]) || 0;
      genreVoteTotals.set(primaryGenre, (genreVoteTotals.get(primaryGenre) ?? 0) + points);
    });
    const topGenreByVotes = Array.from(genreVoteTotals.entries()).sort((a, b) => b[1] - a[1])[0];

    const topSubmitters = Array.from(submissionCounts.entries())
      .map(([id, count]) => ({
        id,
        name: competitorMap.get(id) ?? id,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topTracks = Array.from(voteTotals.entries())
      .map(([key, points]) => {
        const submission = submissionsByKey.get(key);
        return {
          key,
          points,
          title: submission?.Title ?? "Unknown",
          artist: submission?.["Artist(s)"] ?? "",
          roundId: submission?.["Round ID"] ?? key.split("::")[0],
        };
      })
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);

    const roundHighlights = data.rounds.map((round) => {
      let best: { title: string; artist: string; points: number } | null = null;
      const roundSubmissions = data.submissions.filter((row) => row["Round ID"] === round.ID);
      for (const row of roundSubmissions) {
        const key = `${round.ID}::${row["Spotify URI"]}`;
        const points = voteTotals.get(key) ?? 0;
        if (!best || points > best.points) {
          best = { title: row.Title, artist: row["Artist(s)"], points };
        }
      }

      return {
        id: round.ID,
        name: round.Name,
        description: round.Description,
        winner: best,
      };
    });

    return {
      competitorMap,
      roundMap,
      submissionCounts,
      voteTotals,
      topSubmitters,
      topTracks,
      roundHighlights,
      voteTendencies,
      decadeTrends,
      genreTrends,
      topDecadeByVotes: topDecadeByVotes
        ? { decade: topDecadeByVotes[0], points: topDecadeByVotes[1] }
        : null,
      topGenreByVotes: topGenreByVotes ? { genre: topGenreByVotes[0], points: topGenreByVotes[1] } : null,
      hasMetadata: data.trackMeta.length > 0,
      totalRounds: data.rounds.length,
      totalSubmissions: data.submissions.length,
      totalVotes: data.votes.length,
    };
  }, [data]);

  if (loading) {
    return (
      <Card className="season-recap">
        <h2>Season 1 Recap</h2>
        <p className="muted">Loading the first season highlights...</p>
      </Card>
    );
  }

  if (!data.rounds.length) {
    return null;
  }

  return (
    <section className="season-recap">
      <div className="season-header">
        <div>
          <h2>Season 1 Recap</h2>
          <p className="muted">Snapshot of the moments that defined last season.</p>
        </div>
        <div className="season-stats">
          <div>
            <span className="stat-label">Rounds</span>
            <strong>{recap.totalRounds}</strong>
          </div>
          <div>
            <span className="stat-label">Submissions</span>
            <strong>{recap.totalSubmissions}</strong>
          </div>
          <div>
            <span className="stat-label">Votes</span>
            <strong>{recap.totalVotes}</strong>
          </div>
        </div>
      </div>

      <div className="season-grid">
        <Card className="season-card">
          <h3>Top Submitters</h3>
          <ul className="bar-list">
            {recap.topSubmitters.map((item) => (
              <li key={item.id}>
                <span>{item.name}</span>
                <div className="bar">
                  <div className="bar-fill" style={{ width: `${item.count * 12}px` }} />
                </div>
                <strong>{item.count}</strong>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="season-card">
          <h3>Top Tracks</h3>
          <ul className="highlight-list">
            {recap.topTracks.map((track) => (
              <li key={track.key}>
                <div>
                  <strong>{track.title}</strong>
                  <span className="muted">{track.artist}</span>
                </div>
                <span className="pill">{track.points} pts</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="season-card">
          <h3>Vote Tendencies</h3>
          <ul className="highlight-list">
            {recap.voteTendencies.map((item) => (
              <li key={item.voterId}>
                <div>
                  <strong>{item.voterName}</strong>
                  <span className="muted">
                    Most to {item.most?.name ?? "—"} • Least to {item.least?.name ?? "—"}
                  </span>
                </div>
                <span className="pill">{item.most?.points ?? 0} pts</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="season-card">
          <h3>Decade Trends</h3>
          <ul className="highlight-list">
            {recap.decadeTrends.map((item) => (
              <li key={item.submitterId}>
                <div>
                  <strong>{item.submitterName}</strong>
                  <span className="muted">Most common: {item.decade}</span>
                </div>
                <span className="pill mint">{item.count}</span>
              </li>
            ))}
          </ul>
          <p className="muted">
            {recap.hasMetadata
              ? "Decades are pulled from track metadata."
              : "Add /data/track_metadata.csv to improve decade accuracy."}
          </p>
        </Card>

        <Card className="season-card">
          <h3>Decade Votes</h3>
          <p className="muted">Which decade attracted the most points.</p>
          <div className="stat-highlight">
            <strong>{recap.topDecadeByVotes?.decade ?? "Unknown"}</strong>
            <span className="pill">{recap.topDecadeByVotes?.points ?? 0} pts</span>
          </div>
        </Card>

        <Card className="season-card">
          <h3>Genre Trends</h3>
          <ul className="highlight-list">
            {recap.genreTrends.map((item) => (
              <li key={item.submitterId}>
                <div>
                  <strong>{item.submitterName}</strong>
                  <span className="muted">Most common: {item.genre}</span>
                </div>
                <span className="pill mint">{item.count}</span>
              </li>
            ))}
          </ul>
          <p className="muted">
            {recap.hasMetadata ? "Genres use the first tag in metadata." : "Add track metadata to enable genres."}
          </p>
        </Card>

        <Card className="season-card">
          <h3>Top Voted Genre</h3>
          <p className="muted">Genre that collected the most points.</p>
          <div className="stat-highlight">
            <strong>{recap.topGenreByVotes?.genre ?? "Unknown"}</strong>
            <span className="pill">{recap.topGenreByVotes?.points ?? 0} pts</span>
          </div>
        </Card>

        <Card className="season-card season-rounds">
          <h3>Round Winners</h3>
          <div className="round-list">
            {recap.roundHighlights.map((round) => (
              <div key={round.id} className="round-card">
                <div>
                  <strong>{round.name}</strong>
                  <p className="muted">{round.description}</p>
                </div>
                {round.winner ? (
                  <div className="round-winner">
                    <span>Top pick</span>
                    <strong>{round.winner.title}</strong>
                    <span className="muted">{round.winner.artist}</span>
                    <span className="pill mint">{round.winner.points} pts</span>
                  </div>
                ) : (
                  <span className="muted">No votes yet.</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}
