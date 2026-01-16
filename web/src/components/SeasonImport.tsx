import { useState } from "react";
import Papa from "papaparse";
import Button from "./Button";
import Card from "./Card";
import { supabase } from "../lib/supabase";

type Props = {
  leagueId: string | null;
  groupId: string | null;
  onImportComplete?: () => void;
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

type TrackMetaRow = {
  "Spotify URI": string;
  "Release Year": string;
  Genres: string;
};

async function parseCsv<T>(file: File) {
  const text = await file.text();
  const parsed = Papa.parse<T>(text, { header: true, skipEmptyLines: true });
  return parsed.data;
}

async function loadTrackMetadata() {
  const response = await fetch("/data/track_metadata.csv");
  if (!response.ok) return new Map<string, TrackMetaRow>();
  const text = await response.text();
  const parsed = Papa.parse<TrackMetaRow>(text, { header: true, skipEmptyLines: true });
  const map = new Map<string, TrackMetaRow>();
  (parsed.data ?? []).forEach((row) => {
    if (row["Spotify URI"]) {
      map.set(row["Spotify URI"], row);
    }
  });
  return map;
}

function toSpotifyLink(uri: string) {
  if (!uri) return null;
  const trackId = uri.split(":").pop();
  return trackId ? `https://open.spotify.com/track/${trackId}` : null;
}

// Reserved for future use - upsertInChunks is currently preferred
void (async function insertInChunks(table: string, rows: Record<string, unknown>[]) {
  const chunkSize = 200;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from(table).insert(chunk);
    if (error) throw error;
  }
});

async function upsertInChunks(table: string, rows: Record<string, unknown>[], onConflict: string) {
  const chunkSize = 200;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict });
    if (error) throw error;
  }
}

export default function SeasonImport({ leagueId, groupId, onImportComplete }: Props) {
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
      const [rounds, submissions, votes, competitors, trackMeta] = await Promise.all([
        parseCsv<RoundRow>(roundsFile),
        parseCsv<SubmissionRow>(submissionsFile),
        parseCsv<VoteRow>(votesFile),
        parseCsv<CompetitorRow>(competitorsFile),
        loadTrackMetadata(),
      ]);

      const competitorMap = new Map(competitors.map((c) => [c.ID, c.Name]));

      setStatus("Importing competitors...");
      const competitorRows = competitors
        .filter((c) => c.ID && c.Name)
        .map((c) => ({
          group_id: groupId,
          external_id: c.ID,
          name: c.Name,
        }));

      await upsertInChunks("season_competitors", competitorRows, "group_id,external_id");

      setStatus("Staging rounds...");
      const roundImportRows = rounds.map((round) => ({
        group_id: groupId,
        league_id: leagueId,
        external_round_id: round.ID,
        name: round.Name,
        description: round.Description || null,
        playlist_url: round["Playlist URL"] || null,
        external_created_at: round.Created || null,
      }));

      await upsertInChunks("round_imports", roundImportRows, "league_id,external_round_id");

      const { data: roundImportData } = await supabase
        .from("round_imports")
        .select("external_round_id,round_id")
        .eq("league_id", leagueId);

      const roundIdMap = new Map<string, string>();
      (roundImportData ?? []).forEach((row) => {
        if (row.round_id) roundIdMap.set(row.external_round_id, row.round_id);
      });

      setStatus("Importing submissions...");
      const submissionRows = submissions
        .map((submission) => ({
          round_id: roundIdMap.get(submission["Round ID"]) ?? null,
          title: submission.Title,
          album: submission.Album || null,
          artist: submission["Artist(s)"],
          link: toSpotifyLink(submission["Spotify URI"]),
          submitter_name: competitorMap.get(submission["Submitter ID"]) ?? null,
          source_uri: submission["Spotify URI"],
          external_round_id: submission["Round ID"],
          external_submitter_id: submission["Submitter ID"],
          external_created_at: submission.Created || null,
          external_comment: submission.Comment || null,
          external_visible_to_voters: submission["Visible To Voters"]?.toLowerCase() === "yes",
          release_year: trackMeta.get(submission["Spotify URI"])?.["Release Year"]
            ? Number(trackMeta.get(submission["Spotify URI"])?.["Release Year"])
            : null,
          genres: trackMeta.get(submission["Spotify URI"])?.Genres || null,
        }))
        .filter((row) => row.round_id);

      await upsertInChunks("submissions", submissionRows as Record<string, unknown>[], "round_id,source_uri");

      setStatus("Importing votes...");
      const { data: dbSubmissions } = await supabase
        .from("submissions")
        .select("id,round_id,source_uri")
        .in("round_id", Array.from(roundIdMap.values()));

      const submissionMap = new Map<string, string>();
      (dbSubmissions ?? []).forEach((row) => {
        submissionMap.set(`${row.round_id}::${row.source_uri}`, row.id);
      });

      const voteRows = votes
        .map((vote) => ({
          submission_id: submissionMap.get(`${roundIdMap.get(vote["Round ID"]) ?? ""}::${vote["Spotify URI"]}`),
          voter_name: competitorMap.get(vote["Voter ID"]) ?? null,
          voter_external_id: vote["Voter ID"],
          points: Number(vote["Points Assigned"]) || 0,
          comment: vote.Comment,
          external_round_id: vote["Round ID"],
          external_spotify_uri: vote["Spotify URI"],
          external_created_at: vote.Created || null,
        }))
        .filter((row) => row.submission_id);

      await upsertInChunks("votes", voteRows as Record<string, unknown>[], "submission_id,voter_external_id");

      // Recalculate guess correctness for all imported rounds
      // This ensures submitter guesses are evaluated now that submitter_name is populated
      const importedRoundIds = Array.from(roundIdMap.values());
      if (importedRoundIds.length > 0) {
        setStatus("Recalculating guess correctness...");
        for (const roundId of importedRoundIds) {
          await supabase.rpc("recalculate_guess_correctness", { target_round_id: roundId });
        }
      }

      setStatus("Import complete.");
      onImportComplete?.();
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
