import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import Card from "./Card";
import { useAuth } from "../contexts/AuthContext";

type CompetitorRow = {
  ID: string;
  Name: string;
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

async function fetchCsv<T>(path: string) {
  const response = await fetch(path);
  const text = await response.text();
  const parsed = Papa.parse<T>(text, { header: true, skipEmptyLines: true });
  return parsed.data;
}

export default function SeasonPersonalStats() {
  const { profile } = useAuth();
  const [competitors, setCompetitors] = useState<CompetitorRow[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [votes, setVotes] = useState<VoteRow[]>([]);

  useEffect(() => {
    const load = async () => {
      const [competitorsData, submissionsData, votesData] = await Promise.all([
        fetchCsv<CompetitorRow>("/data/competitors.csv"),
        fetchCsv<SubmissionRow>("/data/submissions.csv"),
        fetchCsv<VoteRow>("/data/votes.csv"),
      ]);
      setCompetitors(competitorsData);
      setSubmissions(submissionsData);
      setVotes(votesData);
    };

    load().catch(() => undefined);
  }, []);

  const stats = useMemo(() => {
    if (!profile?.season1_competitor_id) return null;

    const competitorMap = new Map(competitors.map((c) => [c.ID, c.Name]));
    const myId = profile.season1_competitor_id;

    const mySubmissions = submissions.filter((row) => row["Submitter ID"] === myId);

    const submissionKey = (row: SubmissionRow) => `${row["Round ID"]}::${row["Spotify URI"]}`;
    const submissionsByKey = new Map<string, SubmissionRow>();
    submissions.forEach((row) => submissionsByKey.set(submissionKey(row), row));

    const votesToMySongs = new Map<string, number>();
    votes.forEach((vote) => {
      const key = `${vote["Round ID"]}::${vote["Spotify URI"]}`;
      const submission = submissionsByKey.get(key);
      if (!submission || submission["Submitter ID"] !== myId) return;
      const voterId = vote["Voter ID"];
      const points = Number(vote["Points Assigned"]) || 0;
      votesToMySongs.set(voterId, (votesToMySongs.get(voterId) ?? 0) + points);
    });

    const votesGiven = new Map<string, number>();
    votes.forEach((vote) => {
      if (vote["Voter ID"] !== myId) return;
      const key = `${vote["Round ID"]}::${vote["Spotify URI"]}`;
      const submission = submissionsByKey.get(key);
      if (!submission) return;
      const submitterId = submission["Submitter ID"];
      const points = Number(vote["Points Assigned"]) || 0;
      votesGiven.set(submitterId, (votesGiven.get(submitterId) ?? 0) + points);
    });

    const topReceiver = Array.from(votesToMySongs.entries()).sort((a, b) => b[1] - a[1])[0];
    const topGiven = Array.from(votesGiven.entries()).sort((a, b) => b[1] - a[1])[0];
    const leastGiven = Array.from(votesGiven.entries()).sort((a, b) => a[1] - b[1])[0];

    return {
      myName: competitorMap.get(myId) ?? "You",
      mySubmissions,
      topReceiver: topReceiver
        ? { name: competitorMap.get(topReceiver[0]) ?? topReceiver[0], points: topReceiver[1] }
        : null,
      topGiven: topGiven
        ? { name: competitorMap.get(topGiven[0]) ?? topGiven[0], points: topGiven[1] }
        : null,
      leastGiven: leastGiven
        ? { name: competitorMap.get(leastGiven[0]) ?? leastGiven[0], points: leastGiven[1] }
        : null,
    };
  }, [profile, competitors, submissions, votes]);

  if (!stats) return null;

  return (
    <Card className="dashboard-card highlight">
      <h2>Your Season 1 Picks</h2>
      <p className="muted">Highlights from your Season 1 submissions.</p>
      <ul className="submission-list">
        {stats.mySubmissions.map((song) => (
          <li key={`${song["Round ID"]}-${song["Spotify URI"]}`}>
            <strong>{song.Title}</strong>
            <span className="muted">{song["Artist(s)"]}</span>
            {song["Spotify URI"] ? (
              <a
                className="text-link"
                href={`https://open.spotify.com/track/${song["Spotify URI"].split(":").pop()}`}
                target="_blank"
                rel="noreferrer"
              >
                Open in Spotify
              </a>
            ) : null}
          </li>
        ))}
      </ul>
      <div className="personal-stats">
        <div>
          <span className="stat-label">Most votes from</span>
          <strong>{stats.topReceiver?.name ?? "—"}</strong>
        </div>
        <div>
          <span className="stat-label">You gave most to</span>
          <strong>{stats.topGiven?.name ?? "—"}</strong>
        </div>
        <div>
          <span className="stat-label">You gave least to</span>
          <strong>{stats.leastGiven?.name ?? "—"}</strong>
        </div>
      </div>
    </Card>
  );
}
