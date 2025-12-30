import { useEffect, useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import Avatar from "../components/Avatar";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export default function SettingsPage() {
  const { profile, refresh } = useAuth();
  const [message, setMessage] = useState("Test notification from Talking Music League.");
  const [status, setStatus] = useState<string | null>(null);
  const [chatNotifyEnabled, setChatNotifyEnabled] = useState(profile?.chat_notify_enabled ?? true);
  const [emailNotifyEnabled, setEmailNotifyEnabled] = useState(profile?.email_notify_enabled ?? true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("tml_theme") ?? "ocean");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("tml_mode") === "dark");

  useEffect(() => {
    setChatNotifyEnabled(profile?.chat_notify_enabled ?? true);
    setEmailNotifyEnabled(profile?.email_notify_enabled ?? true);
  }, [profile]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.mode = darkMode ? "dark" : "light";
    localStorage.setItem("tml_theme", theme);
    localStorage.setItem("tml_mode", darkMode ? "dark" : "light");
  }, [theme, darkMode]);

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

  const saveChatToggle = async (enabled: boolean) => {
    if (!profile) return;
    setChatNotifyEnabled(enabled);
    await supabase.from("profiles").update({ chat_notify_enabled: enabled }).eq("id", profile.id);
  };

  const saveEmailToggle = async (enabled: boolean) => {
    if (!profile) return;
    setEmailNotifyEnabled(enabled);
    await supabase.from("profiles").update({ email_notify_enabled: enabled }).eq("id", profile.id);
  };

  const sendTest = async () => {
    setStatus("Sending...");
    const { data, error } = await supabase.functions.invoke("notify", {
      body: {
        title: "Talking Music League",
        message,
        recipients: profile?.email ? [profile.email] : [],
      },
    });
    if (error) {
      setStatus(error.message);
      return;
    }
    setStatus(data?.results ? JSON.stringify(data.results) : "Sent");
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Account & Settings</h1>
        <p>Profile details, appearance preferences, and notifications.</p>
      </div>
      <Card>
        <h2>Profile</h2>
        <p className="muted">Keep your avatar and name in sync for chat and invites.</p>
        <div className="profile-card">
          <Avatar src={profile?.avatar_url} name={profile?.display_name ?? "Family Lead"} size="md" />
          <div>
            <h3>{profile?.display_name ?? "Family Lead"}</h3>
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
      </Card>
      <Card>
        <h2>Appearance</h2>
        <p className="muted">Switch themes and toggle dark mode.</p>
        <label className="field">
          <span className="field-label">Theme</span>
          <select className="field-input" value={theme} onChange={(event) => setTheme(event.target.value)}>
            <option value="ocean">Ocean</option>
            <option value="sunset">Sunset</option>
            <option value="evergreen">Evergreen</option>
          </select>
        </label>
        <label className="checkbox-row">
          <input type="checkbox" checked={darkMode} onChange={(event) => setDarkMode(event.target.checked)} />
          <span>Dark mode</span>
        </label>
      </Card>
      <Card>
        <h2>Notification preferences</h2>
        <p className="muted">These settings control chat and email alerts.</p>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={chatNotifyEnabled}
            onChange={(event) => saveChatToggle(event.target.checked)}
            disabled={profile?.can_toggle_chat_notify === false}
          />
          <span>Enable chat notifications</span>
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={emailNotifyEnabled}
            onChange={(event) => saveEmailToggle(event.target.checked)}
            disabled={profile?.can_toggle_email_notify === false}
          />
          <span>Enable email notifications</span>
        </label>
        {(profile?.can_toggle_chat_notify === false || profile?.can_toggle_email_notify === false) ? (
          <span className="field-helper">An admin must enable notification controls for your account.</span>
        ) : null}
        <div className="notification-test">
          <input
            className="field-input"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          <Button type="button" variant="secondary" onClick={sendTest}>
            Send Test Notification
          </Button>
          {status ? <p className="muted">{status}</p> : null}
        </div>
      </Card>
    </div>
  );
}
