import { useState, useEffect } from "react";
import { useAdmin } from "../AdminContext";
import { AdminCard, AdminSection, AdminSelect } from "../components";
import { supabase } from "../../../lib/supabase";
import SeasonImport from "../../../components/SeasonImport";

type LeagueSummary = {
  id: string;
  name: string;
  season_number: number | null;
  created_at: string;
  narrative: string | null;
};

type RoundSummary = {
  id: string;
  league_id: string | null;
  theme: string;
  theme_description: string | null;
  theme_author: string | null;
  season_number: number | null;
  round_number: number | null;
  external_round_id: string | null;
  playlist_url: string | null;
  youtube_playlist_url: string | null;
  comment_required: boolean;
  status: "open" | "voting" | "revealed" | "archived";
  submission_deadline: string | null;
  voting_deadline: string | null;
  theme_image_url: string | null;
  winners_image_url: string | null;
  narrative: string | null;
  created_at: string;
};

export default function ContentTab() {
  const { group } = useAdmin();
  const [leagues, setLeagues] = useState<LeagueSummary[]>([]);
  const [expandedLeagueId, setExpandedLeagueId] = useState<string | null>(null);
  const [narrativeDraft, setNarrativeDraft] = useState("");
  const [selectedImportLeagueId, setSelectedImportLeagueId] = useState<string | null>(null);
  const [processEmailsLoading, setProcessEmailsLoading] = useState(false);
  const [processEmailsStatus, setProcessEmailsStatus] = useState<string | null>(null);

  // Rounds state
  const [rounds, setRounds] = useState<RoundSummary[]>([]);
  const [expandedRoundId, setExpandedRoundId] = useState<string | null>(null);

  useEffect(() => {
    if (!group?.id) return;
    const fetchLeagues = async () => {
      const { data } = await supabase
        .from("leagues")
        .select("id, name, season_number, created_at, narrative")
        .eq("group_id", group.id)
        .order("season_number", { ascending: false });
      if (data) setLeagues(data);
    };
    fetchLeagues();
  }, [group?.id]);

  // Fetch rounds
  useEffect(() => {
    if (!group?.id) return;
    const fetchRounds = async () => {
      const { data } = await supabase
        .from("rounds")
        .select("*")
        .eq("group_id", group.id)
        .order("season_number", { ascending: false })
        .order("round_number", { ascending: false });
      if (data) setRounds(data);
    };
    fetchRounds();
  }, [group?.id]);

  const toggleExpand = (league: LeagueSummary) => {
    if (expandedLeagueId === league.id) {
      setExpandedLeagueId(null);
    } else {
      setExpandedLeagueId(league.id);
      setNarrativeDraft(league.narrative ?? "");
    }
  };

  const saveNarrative = async (leagueId: string) => {
    await supabase
      .from("leagues")
      .update({ narrative: narrativeDraft })
      .eq("id", leagueId);
    setLeagues((prev) =>
      prev.map((l) =>
        l.id === leagueId ? { ...l, narrative: narrativeDraft } : l
      )
    );
    setExpandedLeagueId(null);
  };

  const handleProcessEmails = async () => {
    setProcessEmailsLoading(true);
    setProcessEmailsStatus("Processing...");
    try {
      const { data, error } = await supabase.functions.invoke("process-email-events");
      if (error) {
        setProcessEmailsStatus(`Error: ${error.message}`);
      } else {
        setProcessEmailsStatus(`Processed ${data?.processed ?? 0} emails`);
      }
    } catch (err) {
      setProcessEmailsStatus("Failed to process emails");
    } finally {
      setProcessEmailsLoading(false);
    }
  };

  // Update round status
  const updateRoundStatus = async (roundId: string, status: RoundSummary["status"]) => {
    await supabase.from("rounds").update({ status }).eq("id", roundId);
    setRounds((prev) =>
      prev.map((r) => (r.id === roundId ? { ...r, status } : r))
    );
  };

  // Update round playlist URLs
  const updateRoundPlaylistUrl = async (roundId: string, field: "playlist_url" | "youtube_playlist_url", value: string) => {
    await supabase.from("rounds").update({ [field]: value }).eq("id", roundId);
    setRounds((prev) =>
      prev.map((r) => (r.id === roundId ? { ...r, [field]: value } : r))
    );
  };

  // Update round narrative
  const updateRoundNarrative = async (roundId: string, narrative: string) => {
    await supabase.from("rounds").update({ narrative }).eq("id", roundId);
    setRounds((prev) =>
      prev.map((r) => (r.id === roundId ? { ...r, narrative } : r))
    );
  };

  return (
    <div className="content-tab">
      <AdminSection icon="🏆" title="Leagues" color="green" defaultOpen>
        <div className="league-list">
          {leagues.map((league) => (
            <AdminCard key={league.id} className="league-card">
              <div
                className="league-header"
                onClick={() => toggleExpand(league)}
              >
                <div className="league-info">
                  <strong>{league.name}</strong>
                  <span className="muted">
                    Season {league.season_number ?? "—"}
                  </span>
                </div>
                <span className="league-expand-icon">
                  {expandedLeagueId === league.id ? "▼" : "▶"}
                </span>
              </div>

              {expandedLeagueId === league.id && (
                <div className="league-edit">
                  <label className="field">
                    <span className="field-label">Narrative</span>
                    <textarea
                      className="field-input"
                      rows={3}
                      value={narrativeDraft}
                      onChange={(e) => setNarrativeDraft(e.target.value)}
                      placeholder="Describe this league/season..."
                    />
                  </label>
                  <div className="league-edit-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setExpandedLeagueId(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => saveNarrative(league.id)}
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </AdminCard>
          ))}
        </div>
      </AdminSection>

      <AdminSection icon="🎵" title="Rounds" color="green">
        <div className="round-list">
          {rounds.map((round) => (
            <AdminCard key={round.id} className="round-card">
              <div className="round-header">
                <div className="round-info">
                  <span className="round-label">
                    S{round.season_number ?? "?"} R{round.round_number ?? "?"}
                  </span>
                  <strong className="round-theme">{round.theme}</strong>
                </div>
                <AdminSelect
                  label=""
                  value={round.status}
                  onChange={(val) => updateRoundStatus(round.id, val as RoundSummary["status"])}
                  options={[
                    { value: "open", label: "Open" },
                    { value: "voting", label: "Voting" },
                    { value: "revealed", label: "Revealed" },
                    { value: "archived", label: "Archived" },
                  ]}
                />
                <button
                  type="button"
                  className="round-expand-btn"
                  onClick={() =>
                    setExpandedRoundId(expandedRoundId === round.id ? null : round.id)
                  }
                  aria-label={expandedRoundId === round.id ? "Collapse round details" : "Expand round details"}
                >
                  {expandedRoundId === round.id ? "▼" : "▶"}
                </button>
              </div>

              {expandedRoundId === round.id && (
                <div className="round-edit">
                  {/* Playlist URLs */}
                  <label className="field">
                    <span className="field-label">Spotify Playlist URL</span>
                    <input
                      type="url"
                      className="field-input"
                      value={round.playlist_url ?? ""}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setRounds((prev) =>
                          prev.map((r) => (r.id === round.id ? { ...r, playlist_url: newValue } : r))
                        );
                      }}
                      onBlur={(e) => updateRoundPlaylistUrl(round.id, "playlist_url", e.target.value)}
                      placeholder="https://open.spotify.com/playlist/..."
                    />
                  </label>

                  <label className="field">
                    <span className="field-label">YouTube Playlist URL</span>
                    <input
                      type="url"
                      className="field-input"
                      value={round.youtube_playlist_url ?? ""}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setRounds((prev) =>
                          prev.map((r) => (r.id === round.id ? { ...r, youtube_playlist_url: newValue } : r))
                        );
                      }}
                      onBlur={(e) => updateRoundPlaylistUrl(round.id, "youtube_playlist_url", e.target.value)}
                      placeholder="https://www.youtube.com/playlist?list=..."
                    />
                  </label>

                  {/* Theme Image */}
                  <div className="field">
                    <span className="field-label">Theme Image</span>
                    {round.theme_image_url ? (
                      <img
                        src={round.theme_image_url}
                        alt="Theme"
                        className="round-image-preview"
                      />
                    ) : (
                      <p className="muted">No theme image</p>
                    )}
                    <input type="file" accept="image/*" />
                  </div>

                  {/* Winners Image */}
                  <div className="field">
                    <span className="field-label">Winners Image</span>
                    {round.winners_image_url ? (
                      <img
                        src={round.winners_image_url}
                        alt="Winners"
                        className="round-image-preview"
                      />
                    ) : (
                      <p className="muted">No winners image</p>
                    )}
                    <input type="file" accept="image/*" />
                  </div>

                  {/* Narrative */}
                  <label className="field">
                    <span className="field-label">Narrative</span>
                    <textarea
                      className="field-input"
                      rows={3}
                      value={round.narrative ?? ""}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setRounds((prev) =>
                          prev.map((r) => (r.id === round.id ? { ...r, narrative: newValue } : r))
                        );
                      }}
                      onBlur={(e) => updateRoundNarrative(round.id, e.target.value)}
                      placeholder="Round story/summary..."
                    />
                  </label>
                </div>
              )}
            </AdminCard>
          ))}
        </div>
      </AdminSection>

      <AdminSection icon="📥" title="Import Data" color="green">
        {/* Target League Selection */}
        <AdminCard title="Import Target">
          <p className="muted">Select which league/season to import data into.</p>
          <AdminSelect
            icon="🎯"
            label="Target League"
            value={selectedImportLeagueId ?? ""}
            onChange={(val) => setSelectedImportLeagueId(val || null)}
            options={[
              { value: "", label: "Select a league..." },
              ...leagues.map((l) => ({
                value: l.id,
                label: `Season ${l.season_number ?? "?"} · ${l.name}`,
              })),
            ]}
          />
        </AdminCard>

        {/* CSV Import - uses existing component */}
        {selectedImportLeagueId && (
          <AdminCard title="CSV Import">
            <SeasonImport
              leagueId={selectedImportLeagueId}
              groupId={group?.id ?? null}
              onImportComplete={() => {
                // Refetch rounds, competitors, etc.
              }}
            />
          </AdminCard>
        )}

        {/* Process Emails */}
        <AdminCard title="Process Emails" icon="📧">
          <p className="muted">
            Manually trigger email processing to sync votes and submissions.
          </p>
          <button
            type="button"
            className="btn"
            onClick={handleProcessEmails}
            disabled={processEmailsLoading}
          >
            {processEmailsLoading ? "Processing..." : "Process Emails"}
          </button>
          {processEmailsStatus && (
            <p className={`import-status ${processEmailsStatus.includes("Error") ? "import-status--error" : ""}`}>
              {processEmailsStatus}
            </p>
          )}
        </AdminCard>
      </AdminSection>
    </div>
  );
}
