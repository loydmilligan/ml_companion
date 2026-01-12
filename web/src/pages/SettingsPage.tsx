import React, { useEffect, useState, useRef } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import PushNotificationToggle from "../components/PushNotificationToggle";
import NtfyHelpModal from "../components/NtfyHelpModal";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { usePushNotifications } from "../hooks/usePushNotifications";

// Music provider icons
const SpotifyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

const AppleMusicIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.8.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03a12.5 12.5 0 001.57-.1c.822-.106 1.596-.35 2.296-.81a5.046 5.046 0 001.88-2.207c.186-.42.293-.87.37-1.324.113-.675.138-1.358.137-2.04-.002-3.8 0-7.595-.003-11.393zm-6.423 3.99v5.712c0 .417-.058.827-.244 1.206-.29.59-.76.962-1.388 1.14-.35.1-.706.157-1.07.173-.95.042-1.8-.6-1.965-1.483-.18-.965.39-1.922 1.343-2.196.334-.096.676-.17 1.016-.246.378-.085.757-.16 1.123-.28.252-.083.39-.256.425-.518.01-.078.015-.158.015-.237V9.456c0-.09-.012-.18-.04-.265-.04-.126-.14-.2-.27-.18-.097.016-.195.04-.29.063L11.3 10.2c-.015.004-.03.01-.046.014-.147.044-.218.136-.23.29-.003.034-.005.07-.005.104v7.57c0 .2-.015.4-.054.594-.078.39-.237.743-.516 1.028-.42.43-.934.663-1.528.752-.404.06-.81.06-1.206-.032-.93-.215-1.57-1.044-1.526-1.975.037-.78.496-1.46 1.318-1.747.36-.125.73-.21 1.1-.304.296-.075.594-.14.88-.238.303-.104.453-.3.477-.622.005-.06.007-.12.007-.18V7.51c0-.197.033-.39.1-.578.083-.228.232-.392.46-.468.12-.04.243-.07.368-.093l7.453-1.63c.096-.02.193-.035.29-.04.25-.012.426.134.47.383.016.09.022.18.022.27v4.76z"/>
  </svg>
);

const YoutubeMusicIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm0 19.104c-3.924 0-7.104-3.18-7.104-7.104S8.076 4.896 12 4.896s7.104 3.18 7.104 7.104-3.18 7.104-7.104 7.104zm0-13.332c-3.432 0-6.228 2.796-6.228 6.228S8.568 18.228 12 18.228s6.228-2.796 6.228-6.228S15.432 5.772 12 5.772zM9.684 15.54V8.46L15.816 12l-6.132 3.54z"/>
  </svg>
);

type MusicProvider = "spotify" | "apple_music" | "youtube_music";

const musicProviderOptions: { value: MusicProvider; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "spotify", label: "Spotify", icon: <SpotifyIcon />, color: "#1DB954" },
  { value: "apple_music", label: "Apple Music", icon: <AppleMusicIcon />, color: "#fa2d48" },
  { value: "youtube_music", label: "YouTube Music", icon: <YoutubeMusicIcon />, color: "#ff0000" },
];

export default function SettingsPage() {
  const { profile, group } = useAuth();
  const isLead = group?.role === "lead";
  const { isEnabled: pushEnabled } = usePushNotifications();

  // Theme settings
  const [theme, setTheme] = useState(() => localStorage.getItem("tml_theme") ?? "ocean");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("tml_mode") === "dark");

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
  const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);
  const providerDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (providerDropdownRef.current && !providerDropdownRef.current.contains(event.target as Node)) {
        setProviderDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        <p>UI preferences and notification controls.</p>
      </div>

      {/* UI Card */}
      <Card>
        <h2>UI</h2>
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
      </Card>

      {/* Music Links Card */}
      <Card>
        <h2>Music Links</h2>
        <p className="muted">Choose your preferred music service and YouTube options.</p>

        <div className="field">
          <span className="field-label">Preferred music service</span>
          <div className="custom-dropdown" ref={providerDropdownRef}>
            <button
              type="button"
              className="custom-dropdown-trigger"
              onClick={() => setProviderDropdownOpen(!providerDropdownOpen)}
            >
              {(() => {
                const selected = musicProviderOptions.find(opt => opt.value === preferredMusicProvider);
                return (
                  <>
                    <span className="dropdown-icon" style={{ color: selected?.color }}>{selected?.icon}</span>
                    <span>{selected?.label}</span>
                    <span className="dropdown-arrow">{providerDropdownOpen ? "▲" : "▼"}</span>
                  </>
                );
              })()}
            </button>
            {providerDropdownOpen && (
              <div className="custom-dropdown-menu">
                {musicProviderOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`custom-dropdown-option ${preferredMusicProvider === option.value ? "selected" : ""}`}
                    onClick={() => {
                      saveMusicProvider(option.value);
                      setProviderDropdownOpen(false);
                    }}
                  >
                    <span className="dropdown-icon" style={{ color: option.color }}>{option.icon}</span>
                    <span>{option.label}</span>
                    {preferredMusicProvider === option.value && <span className="check-mark">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="field-helper" style={{ marginTop: "8px", display: "block" }}>
            Song links will open in your preferred music app.
          </span>
        </div>

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
