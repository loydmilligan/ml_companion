import { useState } from "react";
import AdminToggle from "./AdminToggle";

/**
 * Example usage of AdminToggle component
 * This demonstrates all the component's features:
 * - Icon display (emoji)
 * - Label and helper text
 * - Controlled checkbox state
 * - onChange callback
 * - Disabled state
 * - 44px minimum touch target height
 */
export default function AdminToggleExample() {
  const [aiEnabled, setAiEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [themeEnabled, setThemeEnabled] = useState(true);

  return (
    <div style={{ padding: 20, maxWidth: 600 }}>
      <h2>AdminToggle Examples</h2>

      {/* Example 1: With helper text */}
      <AdminToggle
        icon="🤖"
        label="AI Assistant (master toggle)"
        helper="Disable to hide all AI features in the peek panel"
        checked={aiEnabled}
        onChange={setAiEnabled}
      />

      {/* Example 2: Without helper text */}
      <AdminToggle
        icon="🔔"
        label="Notifications"
        checked={notificationsEnabled}
        onChange={setNotificationsEnabled}
      />

      {/* Example 3: Disabled state */}
      <AdminToggle
        icon="🎨"
        label="Dark Theme"
        helper="This setting is currently disabled"
        checked={themeEnabled}
        onChange={setThemeEnabled}
        disabled={true}
      />

      {/* State display */}
      <div style={{ marginTop: 20, padding: 10, background: "#f0f0f0" }}>
        <h3>Current State:</h3>
        <pre>{JSON.stringify({ aiEnabled, notificationsEnabled, themeEnabled }, null, 2)}</pre>
      </div>
    </div>
  );
}
