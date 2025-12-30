import { useEffect, useState } from "react";
import Card from "../components/Card";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import Avatar from "../components/Avatar";

export default function ProfilePage() {
  const { profile, refresh } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatNotifyEnabled, setChatNotifyEnabled] = useState(profile?.chat_notify_enabled ?? true);
  const [emailNotifyEnabled, setEmailNotifyEnabled] = useState(profile?.email_notify_enabled ?? true);

  useEffect(() => {
    setChatNotifyEnabled(profile?.chat_notify_enabled ?? true);
    setEmailNotifyEnabled(profile?.email_notify_enabled ?? true);
  }, [profile]);

  const handleAvatarUpload = async (file: File) => {
    if (!profile) return;
    setUploading(true);
    setError(null);
    const fileExt = file.name.split(".").pop() ?? "png";
    const filePath = `${profile.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, {
      upsert: true,
    });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: data.publicUrl })
      .eq("id", profile.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      await refresh();
    }
    setUploading(false);
  };

  const handleNotifySave = async () => {
    if (!profile) return;
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        chat_notify_enabled: chatNotifyEnabled,
        email_notify_enabled: emailNotifyEnabled,
      })
      .eq("id", profile.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      await refresh();
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Profile</h1>
        <p>Manage your display name and profile details.</p>
      </div>
      <Card>
        <div className="profile-card">
          <Avatar src={profile?.avatar_url} name={profile?.display_name ?? "Family Lead"} size="md" />
          <div>
            <h2>{profile?.display_name ?? "Family Lead"}</h2>
            <p className="muted">{profile?.email}</p>
          </div>
        </div>
        <div className="profile-actions">
          <label className="file-input">
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleAvatarUpload(file);
              }}
            />
            {uploading ? "Uploading..." : "Upload avatar"}
          </label>
          {error ? <div className="auth-error">{error}</div> : null}
        </div>
        <div className="profile-notify">
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={chatNotifyEnabled}
              onChange={(event) => setChatNotifyEnabled(event.target.checked)}
              disabled={profile?.can_toggle_chat_notify === false}
            />
            <span>Enable chat notifications</span>
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={emailNotifyEnabled}
              onChange={(event) => setEmailNotifyEnabled(event.target.checked)}
              disabled={profile?.can_toggle_email_notify === false}
            />
            <span>Enable email notifications</span>
          </label>
          {(profile?.can_toggle_chat_notify === false || profile?.can_toggle_email_notify === false) ? (
            <span className="field-helper">
              An admin must enable notification controls for your account.
            </span>
          ) : null}
          <button className="button button-secondary" type="button" onClick={handleNotifySave}>
            Save notification settings
          </button>
        </div>
      </Card>
    </div>
  );
}
