import { useEffect, useState } from "react";
import Card from "../components/Card";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import Avatar from "../components/Avatar";

export default function ProfilePage() {
  const { profile, refresh } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [musicLeagueUsername, setMusicLeagueUsername] = useState(profile?.music_league_username ?? "");
  const [ntfyTopic, setNtfyTopic] = useState(profile?.ntfy_topic ?? "");
  const [chatNotifyEnabled, setChatNotifyEnabled] = useState(profile?.chat_notify_enabled ?? true);

  useEffect(() => {
    setMusicLeagueUsername(profile?.music_league_username ?? "");
    setNtfyTopic(profile?.ntfy_topic ?? "");
    setChatNotifyEnabled(profile?.chat_notify_enabled ?? true);
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
    const fallbackTopic = musicLeagueUsername
      ? `musicleague_${musicLeagueUsername.toLowerCase().replace(/\\s+/g, "_")}`
      : null;
    const topic = ntfyTopic.trim() || fallbackTopic;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        music_league_username: musicLeagueUsername.trim() || null,
        ntfy_topic: topic,
        chat_notify_enabled: chatNotifyEnabled,
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
          <label className="field">
            <span className="field-label">Music League username</span>
            <input
              className="field-input"
              value={musicLeagueUsername}
              onChange={(event) => setMusicLeagueUsername(event.target.value)}
              placeholder="your_music_league_name"
            />
          </label>
          <label className="field">
            <span className="field-label">ntfy topic (optional)</span>
            <input
              className="field-input"
              value={ntfyTopic}
              onChange={(event) => setNtfyTopic(event.target.value)}
              placeholder="musicleague_yourname"
            />
            <span className="field-helper">
              Defaults to musicleague_&lt;your username&gt; if blank.
            </span>
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={chatNotifyEnabled}
              onChange={(event) => setChatNotifyEnabled(event.target.checked)}
            />
            <span>Enable chat notifications</span>
          </label>
          <button className="button button-secondary" type="button" onClick={handleNotifySave}>
            Save notification settings
          </button>
        </div>
      </Card>
    </div>
  );
}
