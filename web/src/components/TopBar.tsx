import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useRound } from "../contexts/RoundContext";
import Avatar from "./Avatar";
import DMIcon from "./DMIcon";
import DMDrawer from "./DMDrawer";
import SettingsGear from "./SettingsGear";
import ProfileDrawer from "./ProfileDrawer";
import SettingsDrawer from "./SettingsDrawer";
import { DualNeedleGauge, PinnedBar, PeekPanel, usePeekPanel } from "./pinned-peek";

export default function TopBar() {
  const { profile, group, refresh } = useAuth();
  const {
    round,
    submissions,
    votes,
    awards,
    activity,
    competitors,
    submittedCount,
    votedCount,
    totalMembers,
    submissionUrgency,
    votingUrgency,
    isVotingComplete,
  } = useRound();
  const { isOpen: isPeekOpen, openPanel: _openPanel, closePanel, setQuotedSong } = usePeekPanel();
  void _openPanel; // Used in PeekButton

  const isLead = group?.role === "lead";
  const [pinnedBarOpen, setPinnedBarOpen] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [dmDrawerOpen, setDmDrawerOpen] = useState(false);
  const [logoPalette, setLogoPalette] = useState("ocean-coral");
  const [roundChallengeEnabled, setRoundChallengeEnabled] = useState(true);
  const [submitterGuessEnabled, setSubmitterGuessEnabled] = useState(true);
  const [timelineGameEnabled, setTimelineGameEnabled] = useState(false);
  const [timelineGamePhase, setTimelineGamePhase] = useState<"voting" | "revealed" | "both">("voting");
  const [roundChallengePhase, setRoundChallengePhase] = useState<"open" | "voting" | "both">("open");
  const [isTimelineTester, setIsTimelineTester] = useState(false);
  const [dmUnreadCount, setDmUnreadCount] = useState(0);

  const displayName = profile?.display_name ?? "Family Lead";

  const handleQuoteSong = (song: { id: string; title: string; artist: string | null; link: string | null; artwork_url: string | null }) => {
    setQuotedSong(song);
    closePanel();
  };

  // Close other drawers when one opens
  const openPinnedBar = () => {
    setProfileDrawerOpen(false);
    setSettingsDrawerOpen(false);
    setDmDrawerOpen(false);
    setPinnedBarOpen((prev) => !prev);
  };

  const openProfileDrawer = () => {
    setPinnedBarOpen(false);
    setSettingsDrawerOpen(false);
    setDmDrawerOpen(false);
    setProfileDrawerOpen((prev) => !prev);
  };

  const openDMDrawer = () => {
    setPinnedBarOpen(false);
    setProfileDrawerOpen(false);
    setSettingsDrawerOpen(false);
    setDmDrawerOpen((prev) => !prev);
  };

  const openSettingsDrawer = () => {
    setPinnedBarOpen(false);
    setProfileDrawerOpen(false);
    setDmDrawerOpen(false);
    setSettingsDrawerOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!group?.id) return;
    let active = true;
    supabase
      .from("group_settings")
      .select("logo_palette,round_challenge_enabled,submitter_guess_enabled,timeline_game_enabled,timeline_game_phase,round_challenge_phase")
      .eq("group_id", group.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error("Failed to load group settings", error);
          return;
        }
        setLogoPalette(data?.logo_palette ?? "ocean-coral");
        setRoundChallengeEnabled(data?.round_challenge_enabled ?? true);
        setSubmitterGuessEnabled(data?.submitter_guess_enabled ?? true);
        setTimelineGameEnabled(data?.timeline_game_enabled ?? false);
        setTimelineGamePhase(data?.timeline_game_phase ?? "voting");
        setRoundChallengePhase(data?.round_challenge_phase ?? "open");
      });
    return () => {
      active = false;
    };
  }, [group?.id]);

  // Check if current user is a timeline tester
  useEffect(() => {
    if (!profile?.id) return;
    let active = true;
    supabase
      .from("profiles")
      .select("timeline_game_tester")
      .eq("id", profile.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setIsTimelineTester(data?.timeline_game_tester ?? false);
      });
    return () => {
      active = false;
    };
  }, [profile?.id]);

  // Fetch DM unread counts
  useEffect(() => {
    if (!profile?.id) return;
    let active = true;

    const fetchUnreadCount = async () => {
      const { data, error } = await supabase.rpc("get_dm_unread_counts", {
        p_user_id: profile.id,
      });
      if (!active) return;
      if (error) {
        console.error("Failed to fetch DM unread counts:", error);
        return;
      }
      // Sum all unread counts
      const total = (data ?? []).reduce(
        (sum: number, item: { unread_count: number }) => sum + (item.unread_count || 0),
        0
      );
      setDmUnreadCount(total);
    };

    fetchUnreadCount();

    // Refresh every 30 seconds
    const interval = window.setInterval(fetchUnreadCount, 30000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [profile?.id]);

  useEffect(() => {
    document.documentElement.dataset.logoPalette = logoPalette;
    return () => {
      if (document.documentElement.dataset.logoPalette === logoPalette) {
        delete document.documentElement.dataset.logoPalette;
      }
    };
  }, [logoPalette]);

  return (
    <>
      <header className="top-bar">
        <div className="top-bar-brand">
          <div className="brand-mark" aria-hidden="true">
            <img className="brand-mark-img" src="/brand-logo.png" alt="Talking Music League logo" />
          </div>
          <div>
            <div className="brand-title">Talking Music League</div>
            <div className="brand-subtitle">Your family's league, connected.</div>
          </div>
        </div>
        <nav className="top-bar-actions">
          {/* Avatar - opens profile drawer */}
          <button
            type="button"
            className="top-bar-avatar-btn"
            onClick={openProfileDrawer}
            title={displayName}
          >
            <Avatar src={profile?.avatar_url} name={displayName} size="md" framed />
          </button>

          {/* Gauge - only show if there's an active round */}
          {round && (
            <DualNeedleGauge
              submissionPct={submissionUrgency.pct}
              votingPct={votingUrgency.pct}
              submissionLevel={submissionUrgency.level}
              votingLevel={votingUrgency.level}
              size="md"
              onClick={openPinnedBar}
              showExpandIndicator
              roundStatus={round.status}
            />
          )}

          {/* DM Icon - opens DM drawer (second from right) */}
          <DMIcon
            onClick={openDMDrawer}
            badgeCount={dmUnreadCount}
          />

          {/* Gear - opens settings drawer (far right) */}
          <SettingsGear onClick={openSettingsDrawer} />
        </nav>
      </header>

      {/* Pinned Bar Dropdown (Gauge drawer) */}
      <PinnedBar
        round={round}
        isOpen={pinnedBarOpen}
        onClose={() => setPinnedBarOpen(false)}
        submittedCount={submittedCount}
        votedCount={votedCount}
        totalMembers={totalMembers}
      />

      {/* Profile Drawer (Avatar drawer) */}
      <ProfileDrawer
        isOpen={profileDrawerOpen}
        onClose={() => setProfileDrawerOpen(false)}
        profile={profile}
        onProfileUpdate={refresh}
      />

      {/* Settings Drawer (Gear drawer) */}
      <SettingsDrawer
        isOpen={settingsDrawerOpen}
        onClose={() => setSettingsDrawerOpen(false)}
        isLead={isLead}
      />

      {/* DM Drawer */}
      <DMDrawer
        isOpen={dmDrawerOpen}
        onClose={() => setDmDrawerOpen(false)}
      />

      {/* Peek Panel (slide-out from right) */}
      <PeekPanel
        isOpen={isPeekOpen}
        onClose={closePanel}
        round={round}
        groupId={group?.id ?? null}
        submissions={submissions}
        votes={votes}
        awards={awards}
        activity={activity}
        competitors={competitors}
        isVotingComplete={isVotingComplete}
        onQuoteSong={handleQuoteSong}
        roundChallengeEnabled={roundChallengeEnabled}
        roundChallengePhase={roundChallengePhase}
        submitterGuessEnabled={submitterGuessEnabled}
        timelineGameEnabled={timelineGameEnabled}
        timelineGamePhase={timelineGamePhase}
        isTimelineTester={isTimelineTester}
      />
    </>
  );
}
