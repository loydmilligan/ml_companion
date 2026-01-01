import { useEffect, useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

const defaultEmojiOptions = ["👍", "❤️", "🔥", "😂", "👏", "🎵", "✨", "🙌"];

export default function SettingsPage() {
  const { profile } = useAuth();
  const [message, setMessage] = useState("Test notification from Talking Music League.");
  const [status, setStatus] = useState<string | null>(null);
  const [chatNotifyEnabled, setChatNotifyEnabled] = useState(profile?.chat_notify_enabled ?? true);
  const [emailNotifyEnabled, setEmailNotifyEnabled] = useState(profile?.email_notify_enabled ?? true);
  const [reactionNotifyEnabled, setReactionNotifyEnabled] = useState(profile?.reaction_notify_enabled ?? true);
  const [theme, setTheme] = useState(() => localStorage.getItem("tml_theme") ?? "ocean");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("tml_mode") === "dark");
  const [defaultEmoji, setDefaultEmoji] = useState(() => localStorage.getItem("tml_default_emoji") ?? "👍");

  useEffect(() => {
    setChatNotifyEnabled(profile?.chat_notify_enabled ?? true);
    setEmailNotifyEnabled(profile?.email_notify_enabled ?? true);
    setReactionNotifyEnabled(profile?.reaction_notify_enabled ?? true);
  }, [profile]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.mode = darkMode ? "dark" : "light";
    localStorage.setItem("tml_theme", theme);
    localStorage.setItem("tml_mode", darkMode ? "dark" : "light");
  }, [theme, darkMode]);

  useEffect(() => {
    localStorage.setItem("tml_default_emoji", defaultEmoji);
    // Dispatch storage event so other components (ChatPage) pick up the change
    window.dispatchEvent(new Event("storage"));
  }, [defaultEmoji]);

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

  const saveReactionToggle = async (enabled: boolean) => {
    if (!profile) return;
    setReactionNotifyEnabled(enabled);
    await supabase.from("profiles").update({ reaction_notify_enabled: enabled }).eq("id", profile.id);
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
        <h1>Settings</h1>
        <p>Appearance preferences and notification controls.</p>
      </div>
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
        <div className="field" style={{ marginTop: "16px" }}>
          <span className="field-label">Quick reaction emoji</span>
          <p className="muted" style={{ marginBottom: "8px", fontSize: "0.85rem" }}>
            This emoji appears next to the chat input for quick reactions.
          </p>
          <div className="emoji-selector">
            {defaultEmojiOptions.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={`emoji-option ${defaultEmoji === emoji ? "selected" : ""}`}
                onClick={() => setDefaultEmoji(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
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
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={reactionNotifyEnabled}
            onChange={(event) => saveReactionToggle(event.target.checked)}
            disabled={profile?.can_toggle_reaction_notify === false}
          />
          <span>Enable reaction notifications</span>
        </label>
        {(profile?.can_toggle_chat_notify === false || profile?.can_toggle_email_notify === false || profile?.can_toggle_reaction_notify === false) ? (
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
