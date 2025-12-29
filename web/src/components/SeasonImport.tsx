import { useState } from "react";
import Papa from "papaparse";
import Button from "./Button";
import Card from "./Card";
import { supabase } from "../lib/supabase";

type Props = {
  leagueId: string | null;
  groupId: string | null;
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

type CompetitorRow = {
  ID: string;
  Name: string;
};

async function parseCsv<T>(file: File) {
  const text = await file.text();
  const parsed = Papa.parse<T>(text, { header: true, skipEmptyLines: true });
  return parsed.data;
}

function toSpotifyLink(uri: string) {
  if (!uri) return null;
  const trackId = uri.split(":").pop();
  return trackId ? `https://open.spotify.com/track/${trackId}` : null;
}

async function insertInChunks(table: string, rows: Record<string, unknown>[]) {
  const chunkSize = 200;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from(table).insert(chunk);
    if (error) throw error;
  }
}

export default function SeasonImport({ leagueId, groupId }: Props) {
  const [roundsFile, setRoundsFile] = useState<File | null>(null);
  const [submissionsFile, setSubmissionsFile] = useState<File | null>(null);
  const [votesFile, setVotesFile] = useState<File | null>(null);
  const [competitorsFile, setCompetitorsFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    if (!leagueId || !groupId) return;
    if (!roundsFile || !submissionsFile || !competitorsFile || !votesFile) {
      setError("Please upload all four CSV files.");
      return;
    }

    setLoading(true);
    setError(null);
    setStatus("Parsing CSVs...");

    try {
      const [rounds, submissions, votes, competitors] = await Promise.all([
        parseCsv<RoundRow>(roundsFile),
        parseCsv<SubmissionRow>(submissionsFile),
        parseCsv<VoteRow>(votesFile),
        parseCsv<CompetitorRow>(competitorsFile),
      ]);

      const competitorMap = new Map(competitors.map((c) => [c.ID, c.Name]));

      setStatus("Importing competitors...");
      const competitorRows = competitors.map((c) => ({
        group_id: groupId,
        external_id: c.ID,
        name: c.Name,
      }));

      await insertInChunks("season_competitors", competitorRows);

      setStatus("Importing rounds...");
      const roundRows = rounds.map((round) => ({
        league_id: leagueId,
        theme: round.Name,
        status: "archived",
        submission_deadline: null,
        voting_deadline: null,
      }));

      const { data: insertedRounds, error: roundError } = await supabase
        .from("rounds")
        .insert(roundRows)
        .select("id,theme");

      if (roundError) throw roundError;

      const roundIdMap = new Map<string, string>();
      rounds.forEach((round, idx) => {
        const inserted = insertedRounds?.[idx];
        if (inserted?.id) roundIdMap.set(round.ID, inserted.id);
      });

      setStatus("Importing submissions...");
      const submissionRows = submissions.map((submission) => ({
        round_id: roundIdMap.get(submission["Round ID"]) ?? null,
        title: submission.Title,
        artist: submission["Artist(s)"],
        link: toSpotifyLink(submission["Spotify URI"]),
        submitter_name: competitorMap.get(submission["Submitter ID"]) ?? null,
        source_uri: submission["Spotify URI"],
      })).filter((row) => row.round_id);

      await insertInChunks("submissions", submissionRows as Record<string, unknown>[]);

      setStatus("Importing votes...");
      const { data: dbSubmissions } = await supabase
        .from("submissions")
        .select("id,round_id,source_uri")
        .in(
          "round_id",
          Array.from(roundIdMap.values())
        );

      const submissionMap = new Map<string, string>();
      (dbSubmissions ?? []).forEach((row) => {
        submissionMap.set(`${row.round_id}::${row.source_uri}`, row.id);
      });

      const voteRows = votes.map((vote) => ({
        submission_id: submissionMap.get(`${roundIdMap.get(vote["Round ID"]) ?? ""}::${vote["Spotify URI"]}`),
        voter_name: competitorMap.get(vote["Voter ID"]) ?? null,
        points: Number(vote["Points Assigned"]) || 0,
        comment: vote.Comment,
      })).filter((row) => row.submission_id);

      await insertInChunks("votes", voteRows as Record<string, unknown>[]);

      setStatus("Import complete.");
    } catch (err) {
      const message = typeof err === "object" && err !== null && "message" in err
        ? String((err as { message: string }).message)
        : "Import failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="dashboard-card">
      <h2>Import Current Season</h2>
      <p className="muted">Upload the same CSV export format as Season 1.</p>
      <div className="import-grid">
        <label className="file-input">
          <input type="file" accept=".csv" onChange={(event) => setRoundsFile(event.target.files?.[0] ?? null)} />
          {roundsFile ? roundsFile.name : "Rounds CSV"}
        </label>
        <label className="file-input">
          <input type="file" accept=".csv" onChange={(event) => setSubmissionsFile(event.target.files?.[0] ?? null)} />
          {submissionsFile ? submissionsFile.name : "Submissions CSV"}
        </label>
        <label className="file-input">
          <input type="file" accept=".csv" onChange={(event) => setVotesFile(event.target.files?.[0] ?? null)} />
          {votesFile ? votesFile.name : "Votes CSV"}
        </label>
        <label className="file-input">
          <input type="file" accept=".csv" onChange={(event) => setCompetitorsFile(event.target.files?.[0] ?? null)} />
          {competitorsFile ? competitorsFile.name : "Competitors CSV"}
        </label>
      </div>
      <Button type="button" onClick={handleImport} disabled={loading}>
        {loading ? "Importing..." : "Run Import"}
      </Button>
      {status ? <p className="muted">{status}</p> : null}
      {error ? <div className="auth-error">{error}</div> : null}
    </Card>
  );
}
