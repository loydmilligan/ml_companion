import { useEffect, useState } from "react";
import { useAdmin } from "../AdminContext";
import { AdminCard, AdminSection, AdminToggle, AdminSelect } from "../components";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../contexts/AuthContext";

type SeasonCompetitor = {
  id: string;
  name: string;
  profile_id: string | null;
  external_id: string | null;
  ai_image_traits: string | null;
};

type InviteRow = {
  id: string;
  code: string;
  created_at: string;
  expires_at: string | null;
  used_at: string | null;
  used_by: string | null;
  invite_email: string | null;
  email_sent_at: string | null;
};

export default function PeopleTab() {
  const { users, refreshUsers } = useAdmin();
  const { group } = useAuth();
  const [seasonCompetitors, setSeasonCompetitors] = useState<SeasonCompetitor[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const updateUserRole = async (memberId: string, role: string) => {
    await supabase
      .from("group_members")
      .update({ role })
      .eq("member_id", memberId);
    refreshUsers();
  };

  const updateUserPermission = async (
    profileId: string,
    field: string,
    value: boolean
  ) => {
    await supabase
      .from("profiles")
      .update({ [field]: value })
      .eq("id", profileId);
    refreshUsers();
  };

  // Fetch invites
  useEffect(() => {
    if (!group?.id) return;
    const fetchInvites = async () => {
      const { data } = await supabase
        .from("invite_codes")
        .select("*")
        .eq("group_id", group.id)
        .order("created_at", { ascending: false });
      if (data) setInvites(data);
    };
    fetchInvites();
  }, [group?.id]);

  // Fetch competitors
  useEffect(() => {
    if (!group?.id) return;
    const fetchCompetitors = async () => {
      const { data } = await supabase
        .from("season_competitors")
        .select("*")
        .eq("group_id", group.id)
        .order("name");
      if (data) setSeasonCompetitors(data);
    };
    fetchCompetitors();
  }, [group?.id]);

  // Generate invite
  const generateInvite = async () => {
    if (!group?.id) return;
    const code = crypto.randomUUID().slice(0, 8);
    const { error } = await supabase.from("invite_codes").insert({
      code,
      group_id: group.id,
      invite_email: inviteEmail || null,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    if (!error) {
      setInviteLink(`${window.location.origin}/invite?code=${code}`);
      // Refetch invites
      const { data } = await supabase
        .from("invite_codes")
        .select("*")
        .eq("group_id", group.id)
        .order("created_at", { ascending: false });
      if (data) setInvites(data);
      setInviteEmail("");
    }
  };

  // Link competitor to profile
  const linkCompetitor = async (competitorId: string, profileId: string | null) => {
    await supabase
      .from("season_competitors")
      .update({ profile_id: profileId })
      .eq("id", competitorId);
    // Refetch competitors
    const { data } = await supabase
      .from("season_competitors")
      .select("*")
      .eq("group_id", group?.id || "")
      .order("name");
    if (data) setSeasonCompetitors(data);
  };

  return (
    <div className="people-tab">
      <AdminSection icon="👥" title="Members" color="blue" defaultOpen>
        <div className="member-list">
          {users.map((user) => (
            <AdminCard key={user.member_id} className="member-card">
              <div className="member-header">
                <div className="member-avatar">
                  <span>{user.profiles?.display_name?.[0]?.toUpperCase() ?? "?"}</span>
                </div>
                <div className="member-info">
                  <strong>{user.profiles?.display_name ?? "Unknown"}</strong>
                  <span className="muted">{user.profiles?.email ?? "—"}</span>
                </div>
                <AdminSelect
                  label="Role"
                  value={user.role ?? "member"}
                  onChange={(val) => updateUserRole(user.member_id, val)}
                  options={[
                    { value: "member", label: "Member" },
                    { value: "lead", label: "Lead" },
                  ]}
                />
              </div>

              <div className="member-permissions">
                {user.profiles?.can_toggle_chat_notify && (
                  <AdminToggle
                    icon="💬"
                    label="Chat notify"
                    checked={user.profiles.chat_notify_enabled ?? false}
                    onChange={(checked) =>
                      updateUserPermission(user.profiles!.id, "chat_notify_enabled", checked)
                    }
                  />
                )}
                {user.profiles?.can_toggle_email_notify && (
                  <AdminToggle
                    icon="📧"
                    label="Email notify"
                    checked={user.profiles.email_notify_enabled ?? false}
                    onChange={(checked) =>
                      updateUserPermission(user.profiles!.id, "email_notify_enabled", checked)
                    }
                  />
                )}
                {user.profiles?.can_toggle_reaction_notify && (
                  <AdminToggle
                    icon="👍"
                    label="Reaction notify"
                    checked={user.profiles.reaction_notify_enabled ?? false}
                    onChange={(checked) =>
                      updateUserPermission(user.profiles!.id, "reaction_notify_enabled", checked)
                    }
                  />
                )}
              </div>
            </AdminCard>
          ))}
        </div>
      </AdminSection>

      <AdminSection icon="✉️" title="Invitations" color="blue">
        <div className="invite-list">
          {invites.map((inv) => {
            const status = inv.used_at
              ? "used"
              : inv.expires_at && new Date(inv.expires_at) < new Date()
              ? "expired"
              : "active";

            return (
              <div key={inv.id} className="invite-row">
                <div className="invite-info">
                  <code className="invite-code">{inv.code}</code>
                  {inv.invite_email && (
                    <span className="invite-email muted">{inv.invite_email}</span>
                  )}
                </div>
                <span className={`invite-status invite-status--${status}`}>
                  {status}
                </span>
                <button
                  type="button"
                  className="invite-copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/invite?code=${inv.code}`);
                  }}
                >
                  Copy
                </button>
              </div>
            );
          })}
        </div>

        <div className="invite-form">
          <input
            type="email"
            className="field-input"
            placeholder="Email (optional)"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <button type="button" className="btn" onClick={generateInvite}>
            Generate Invite
          </button>
        </div>

        {inviteLink && (
          <div className="invite-link-display">
            <p>Share this link:</p>
            <code>{inviteLink}</code>
          </div>
        )}
      </AdminSection>

      <AdminSection icon="🎤" title="Competitors" color="blue">
        <p className="muted" style={{ marginBottom: 12 }}>
          Link external competitor names to member profiles for correct attribution.
        </p>
        <div className="competitor-list">
          {seasonCompetitors.map((competitor) => (
            <div key={competitor.id} className="competitor-row">
              <div className="competitor-name">
                <strong>{competitor.name}</strong>
                {competitor.profile_id && (
                  <span className="competitor-linked">
                    → {users.find(u => u.profiles?.id === competitor.profile_id)?.profiles?.display_name ?? "Linked"}
                  </span>
                )}
              </div>
              <select
                className="field-input competitor-link-select"
                value={competitor.profile_id ?? ""}
                onChange={(e) => linkCompetitor(competitor.id, e.target.value || null)}
              >
                <option value="">Unlinked</option>
                {users.map((user) =>
                  user.profiles?.id ? (
                    <option key={user.profiles.id} value={user.profiles.id}>
                      {user.profiles.display_name ?? user.profiles.email ?? "Member"}
                    </option>
                  ) : null
                )}
              </select>
            </div>
          ))}
        </div>
      </AdminSection>
    </div>
  );
}
