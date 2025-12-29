import { useEffect, useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export default function SettingsPage() {
  const { profile } = useAuth();
  const [message, setMessage] = useState("Test notification from Talking Music League.");
  const [status, setStatus] = useState<string | null>(null);
  const [chatNotifyEnabled, setChatNotifyEnabled] = useState(profile?.chat_notify_enabled ?? true);

  useEffect(() => {
    setChatNotifyEnabled(profile?.chat_notify_enabled ?? true);
  }, [profile]);

  const saveChatToggle = async (enabled: boolean) => {
    if (!profile) return;
    setChatNotifyEnabled(enabled);
    await supabase.from("profiles").update({ chat_notify_enabled: enabled }).eq("id", profile.id);
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
        <p>Notifications, integrations, and privacy controls.</p>
      </div>
      <Card>
        <h2>Notification preferences</h2>
        <p className="muted">These settings will control in-app and push alerts.</p>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={chatNotifyEnabled}
            onChange={(event) => saveChatToggle(event.target.checked)}
          />
          <span>Enable chat notifications</span>
        </label>
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
