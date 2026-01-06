import { useEffect, useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import PushNotificationToggle from "../components/PushNotificationToggle";
import NtfyHelpModal from "../components/NtfyHelpModal";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { usePushNotifications } from "../hooks/usePushNotifications";

const defaultEmojiOptions = ["👍", "❤️", "🔥", "😂", "👏", "🎵", "✨", "🙌"];

export default function SettingsPage() {
  const { profile, group } = useAuth();
  const isLead = group?.role === "lead";
  const { isEnabled: pushEnabled } = usePushNotifications();

  // Theme settings
  const [theme, setTheme] = useState(() => localStorage.getItem("tml_theme") ?? "ocean");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("tml_mode") === "dark");
  const [defaultEmoji, setDefaultEmoji] = useState(() => localStorage.getItem("tml_default_emoji") ?? "👍");

  // Notification type settings
  const [emailNotifyEnabled, setEmailNotifyEnabled] = useState(profile?.email_notify_enabled ?? true);
  const [ntfyNotifyEnabled, setNtfyNotifyEnabled] = useState(profile?.ntfy_notify_enabled ?? false);
  const [ntfyTopic, setNtfyTopic] = useState(profile?.ntfy_topic ?? "");
  const [showNtfyHelp, setShowNtfyHelp] = useState(false);

  // Notification item settings
  const [chatNotifyEnabled, setChatNotifyEnabled] = useState(profile?.chat_notify_enabled ?? true);
  const [reactionNotifyEnabled, setReactionNotifyEnabled] = useState(profile?.reaction_notify_enabled ?? true);

  // Music link preferences
  const [preferredMusicProvider, setPreferredMusicProvider] = useState<"spotify" | "apple_music" | "youtube_music">(
    profile?.preferred_music_provider ?? "spotify"
  );
  const [showYoutubeVideo, setShowYoutubeVideo] = useState(profile?.show_youtube_video ?? true);

  // Test notification
  const [message, setMessage] = useState("Test notification from Talking Music League.");
  const [status, setStatus] = useState<string | null>(null);
  const [adminStatus, setAdminStatus] = useState<string | null>(null);

  // Sync state with profile
  useEffect(() => {
    setEmailNotifyEnabled(profile?.email_notify_enabled ?? true);
    setNtfyNotifyEnabled(profile?.ntfy_notify_enabled ?? false);
    setNtfyTopic(profile?.ntfy_topic ?? "");
    setChatNotifyEnabled(profile?.chat_notify_enabled ?? true);
    setReactionNotifyEnabled(profile?.reaction_notify_enabled ?? true);
    setPreferredMusicProvider(profile?.preferred_music_provider ?? "spotify");
    setShowYoutubeVideo(profile?.show_youtube_video ?? true);
  }, [profile]);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.mode = darkMode ? "dark" : "light";
    localStorage.setItem("tml_theme", theme);
    localStorage.setItem("tml_mode", darkMode ? "dark" : "light");
  }, [theme, darkMode]);

  // Apply default emoji
  useEffect(() => {
    localStorage.setItem("tml_default_emoji", defaultEmoji);
    window.dispatchEvent(new Event("storage"));
  }, [defaultEmoji]);

  // Save notification type toggles
  const saveEmailToggle = async (enabled: boolean) => {
    if (!profile) return;
    setEmailNotifyEnabled(enabled);
    await supabase.from("profiles").update({ email_notify_enabled: enabled }).eq("id", profile.id);
  };

  const saveNtfyToggle = async (enabled: boolean) => {
    if (!profile) return;
    setNtfyNotifyEnabled(enabled);
    await supabase.from("profiles").update({ ntfy_notify_enabled: enabled }).eq("id", profile.id);
  };

  const saveNtfyTopic = async () => {
    if (!profile) return;
    await supabase.from("profiles").update({ ntfy_topic: ntfyTopic }).eq("id", profile.id);
  };

  // Save notification item toggles
  const saveChatToggle = async (enabled: boolean) => {
    if (!profile) return;
    setChatNotifyEnabled(enabled);
    await supabase.from("profiles").update({ chat_notify_enabled: enabled }).eq("id", profile.id);
  };

  const saveReactionToggle = async (enabled: boolean) => {
    if (!profile) return;
    setReactionNotifyEnabled(enabled);
    await supabase.from("profiles").update({ reaction_notify_enabled: enabled }).eq("id", profile.id);
  };

  // Save music link preferences
  const saveMusicProvider = async (provider: "spotify" | "apple_music" | "youtube_music") => {
    if (!profile) return;
    setPreferredMusicProvider(provider);
    await supabase.from("profiles").update({ preferred_music_provider: provider }).eq("id", profile.id);
  };

  const saveYoutubeToggle = async (enabled: boolean) => {
    if (!profile) return;
    setShowYoutubeVideo(enabled);
    await supabase.from("profiles").update({ show_youtube_video: enabled }).eq("id", profile.id);
  };

  // Test notifications
  const sendTest = async () => {
    setStatus("Sending...");
    const results: string[] = [];

    // Send email/ntfy notification
    const { data, error } = await supabase.functions.invoke("notify", {
      body: {
        title: "Talking Music League",
        message,
        recipients: profile?.email ? [profile.email] : [],
      },
    });
    if (error) {
      results.push(`Email: ${error.message}`);
    } else {
      results.push(`Email: ${data?.results?.email ?? "sent"}`);
    }

    // Send push notification if enabled
    if (pushEnabled) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: pushData, error: pushError } = await supabase.functions.invoke("send-push-notification", {
          body: {
            notification_type: "chat_message",
            title: "Test Push Notification",
            body: message,
            user_ids: [user.id],
          },
        });
        if (pushError) {
          results.push(`Push: ${pushError.message}`);
        } else {
          results.push(`Push: sent ${pushData?.sent ?? 0}`);
        }
      }
    } else {
      results.push("Push: disabled");
    }

    setStatus(results.join(" | "));
  };

  const sendAdminTest = async () => {
    if (!isLead) return;
    setAdminStatus("Sending to admin only...");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setAdminStatus("Not authenticated");
      return;
    }

    const results: string[] = [];

    // Send email only to admin
    const { data, error } = await supabase.functions.invoke("notify", {
      body: {
        title: "Admin Test - Talking Music League",
        message: `[Admin Only] ${message}`,
        recipients: profile?.email ? [profile.email] : [],
      },
    });
    if (error) {
      results.push(`Email: ${error.message}`);
    } else {
      results.push(`Email: ${data?.results?.email ?? "sent"}`);
    }

    // Send push to admin only
    if (pushEnabled) {
      const { data: pushData, error: pushError } = await supabase.functions.invoke("send-push-notification", {
        body: {
          notification_type: "chat_message",
          title: "Admin Test Push",
          body: `[Admin Only] ${message}`,
          user_ids: [user.id],
        },
      });
      if (pushError) {
        results.push(`Push: ${pushError.message}`);
      } else {
        results.push(`Push: sent ${pushData?.sent ?? 0}`);
      }
    } else {
      results.push("Push: disabled");
    }

    setAdminStatus(results.join(" | "));
  };

  // Check if user can see ntfy settings (admin enabled it for them)
  const canSeeNtfy = profile?.can_toggle_ntfy_notify === true;
  // Check if user can see push settings (admin only for now)
  const canSeePush = isLead;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Appearance preferences and notification controls.</p>
      </div>

      {/* Appearance Card */}
      <Card>
        <h2>Appearance</h2>
        <p className="muted">Switch themes and toggle dark mode.</p>
        <label className="field">
          <span className="field-label">Theme</span>
          <select className="field-input" value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="ocean">Ocean</option>
            <option value="sunset">Sunset</option>
            <option value="evergreen">Evergreen</option>
          </select>
        </label>
        <label className="checkbox-row">
          <input type="checkbox" checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />
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

      {/* Music Links Card */}
      <Card>
        <h2>Music Links</h2>
        <p className="muted">Choose your preferred music service and YouTube options.</p>

        <label className="field">
          <span className="field-label">Preferred music service</span>
          <select
            className="field-input"
            value={preferredMusicProvider}
            onChange={(e) => saveMusicProvider(e.target.value as "spotify" | "apple_music" | "youtube_music")}
          >
            <option value="spotify">Spotify</option>
            <option value="apple_music">Apple Music</option>
            <option value="youtube_music">YouTube Music</option>
          </select>
        </label>
        <span className="field-helper" style={{ marginTop: "-8px", marginBottom: "16px", display: "block" }}>
          Song links will open in your preferred music app.
        </span>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={showYoutubeVideo}
            onChange={(e) => saveYoutubeToggle(e.target.checked)}
          />
          <span>Show YouTube video link</span>
        </label>
        <span className="field-helper">
          When enabled, a separate YouTube video button will appear alongside your music service link.
        </span>
      </Card>

      {/* Notification Types Card */}
      <Card>
        <h2>Notification Types</h2>
        <p className="muted">Choose how you want to receive notifications.</p>

        {/* Email notifications */}
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={emailNotifyEnabled}
            onChange={(e) => saveEmailToggle(e.target.checked)}
            disabled={profile?.can_toggle_email_notify === false}
          />
          <span>Email notifications</span>
        </label>

        {/* Push notifications - admin only */}
        {canSeePush && (
          <>
            <div className="notification-divider" />
            <div className="notification-type-section">
              <span className="notification-type-label">Push notifications (Admin testing)</span>
              <PushNotificationToggle />
            </div>
          </>
        )}

        {/* ntfy notifications - if enabled by admin */}
        {canSeeNtfy && (
          <>
            <div className="notification-divider" />
            <div className="notification-type-section">
              <div className="notification-type-header">
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={ntfyNotifyEnabled}
                    onChange={(e) => saveNtfyToggle(e.target.checked)}
                  />
                  <span>ntfy push notifications</span>
                </label>
                <button
                  type="button"
                  className="ntfy-help-button"
                  onClick={() => setShowNtfyHelp(true)}
                  title="How to set up ntfy"
                >
                  ?
                </button>
              </div>
              {ntfyNotifyEnabled && (
                <div className="ntfy-topic-field">
                  <label className="field">
                    <span className="field-label">ntfy topic (optional override)</span>
                    <input
                      type="text"
                      className="field-input"
                      value={ntfyTopic}
                      onChange={(e) => setNtfyTopic(e.target.value)}
                      onBlur={saveNtfyTopic}
                      placeholder="mariani_music_league"
                    />
                  </label>
                  <span className="field-helper">
                    Leave blank to use the default topic: mariani_music_league
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        {profile?.can_toggle_email_notify === false && (
          <span className="field-helper">An admin must enable notification controls for your account.</span>
        )}
      </Card>

      {/* Notification Items Card */}
      <Card>
        <h2>What to notify</h2>
        <p className="muted">Choose which events trigger notifications.</p>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={chatNotifyEnabled}
            onChange={(e) => saveChatToggle(e.target.checked)}
            disabled={profile?.can_toggle_chat_notify === false}
          />
          <span>Chat messages</span>
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={reactionNotifyEnabled}
            onChange={(e) => saveReactionToggle(e.target.checked)}
            disabled={profile?.can_toggle_reaction_notify === false}
          />
          <span>Reactions to your messages</span>
        </label>

        {(profile?.can_toggle_chat_notify === false || profile?.can_toggle_reaction_notify === false) && (
          <span className="field-helper">An admin must enable some notification controls for your account.</span>
        )}
      </Card>

      {/* Test Notifications Card */}
      <Card>
        <h2>Test notifications</h2>
        <p className="muted">Send a test notification to verify your setup.</p>
        <div className="notification-test">
          <input
            className="field-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Test notification message..."
          />
          <div className="notification-test-buttons">
            <Button type="button" variant="secondary" onClick={sendTest}>
              Test All
            </Button>
            {isLead && (
              <Button type="button" variant="secondary" onClick={sendAdminTest}>
                Admin Only
              </Button>
            )}
          </div>
          {status && <p className="muted">{status}</p>}
          {adminStatus && <p className="muted">{adminStatus}</p>}
        </div>
      </Card>

      {/* ntfy Help Modal */}
      <NtfyHelpModal isOpen={showNtfyHelp} onClose={() => setShowNtfyHelp(false)} />
    </div>
  );
}
