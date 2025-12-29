import { useEffect, useState } from "react";
import Papa from "papaparse";
import Card from "./Card";
import { supabase } from "../lib/supabase";
import Button from "./Button";
import { useAuth } from "../contexts/AuthContext";

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

type RoundRow = {
  ID: string;
  Created: string;
  Name: string;
  Description: string;
  "Playlist URL": string;
};

async function fetchCsv<T>(path: string) {
  const response = await fetch(path);
  const text = await response.text();
  const parsed = Papa.parse<T>(text, { header: true, skipEmptyLines: true });
  return parsed.data;
}

export default function SongConnectionWidget() {
  const { group } = useAuth();
  const isLead = group?.role === "lead";
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pair, setPair] = useState<{ a: SubmissionRow; b: SubmissionRow; round: RoundRow } | null>(null);

  const fetchConnection = async (force = false) => {
    const hourKey = new Date().toISOString().slice(0, 13);
    const cacheKey = `tml_connection_${hourKey}`;
    const throttleKey = "tml_connection_last_attempt";
    const lastAttempt = Number(localStorage.getItem(throttleKey) ?? "0");
    const oneHourMs = 60 * 60 * 1000;

    if (!force && Date.now() - lastAttempt < oneHourMs) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        setPair(parsed.pair);
        setContent(parsed.content);
      }
      setLoading(false);
      return;
    }

    if (!force) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        setPair(parsed.pair);
        setContent(parsed.content);
        setLoading(false);
        return;
      }
    }

    setError(null);
    localStorage.setItem(throttleKey, String(Date.now()));
    const [rounds, submissions] = await Promise.all([
      fetchCsv<RoundRow>("/data/rounds.csv"),
      fetchCsv<SubmissionRow>("/data/submissions.csv"),
    ]);

    const roundMap = new Map(rounds.map((round) => [round.ID, round]));
    const grouped = new Map<string, SubmissionRow[]>();
    submissions.forEach((row) => {
      const list = grouped.get(row["Round ID"]) ?? [];
      list.push(row);
      grouped.set(row["Round ID"], list);
    });

    const roundIds = Array.from(grouped.keys()).filter((id) => (grouped.get(id)?.length ?? 0) >= 2);
    const pickRoundId = roundIds[Math.floor(Math.random() * roundIds.length)];
    const candidates = grouped.get(pickRoundId) ?? [];
    const [a, b] = candidates.sort(() => 0.5 - Math.random()).slice(0, 2);
    const round = roundMap.get(pickRoundId) ?? rounds[0];

    const songA = `${a.Title} by ${a["Artist(s)"]}`;
    const songB = `${b.Title} by ${b["Artist(s)"]}`;

    const { data, error } = await supabase.functions.invoke("openrouter-compare", {
      body: { songA, songB },
    });

    const responseText = error ? null : data?.content;
    const pairPayload = { a, b, round };
    setPair(pairPayload);
    if (responseText) {
      setContent(responseText);
      localStorage.setItem(cacheKey, JSON.stringify({ pair: pairPayload, content: responseText }));
    } else {
      setContent(null);
      setError(error?.message ?? data?.detail ?? data?.error ?? "OpenRouter connection failed.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConnection().catch((err) => {
      setError(String(err));
      setLoading(false);
    });
  }, []);

  const handleRegenerate = async () => {
    setLoading(true);
    setContent(null);
    const hourKey = new Date().toISOString().slice(0, 13);
    localStorage.removeItem(`tml_connection_${hourKey}`);
    localStorage.removeItem("tml_connection_last_attempt");
    fetchConnection(true).catch((err) => {
      setError(String(err));
      setLoading(false);
    });
  };

  return (
    <Card className="dashboard-card highlight">
      <div className="connection-header">
        <h2>Song Connection</h2>
        {isLead ? (
          <Button type="button" variant="secondary" onClick={handleRegenerate} disabled={loading}>
            Regenerate
          </Button>
        ) : null}
      </div>
      {loading ? <p className="muted">Finding the connection...</p> : null}
      {error ? <p className="muted">{error}</p> : null}
      {!loading && pair ? (
        <div className="connection-body">
          <p className="muted">From round: {pair.round?.Name}</p>
          <div className="connection-songs">
            <div>
              <strong>{pair.a.Title}</strong>
              <span className="muted">{pair.a["Artist(s)"]}</span>
            </div>
            <div>
              <strong>{pair.b.Title}</strong>
              <span className="muted">{pair.b["Artist(s)"]}</span>
            </div>
          </div>
          <p>{content}</p>
        </div>
      ) : null}
    </Card>
  );
}
