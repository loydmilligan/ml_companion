/**
 * Usage Example for useGroupSettings Hook
 *
 * This file demonstrates how to use the useGroupSettings hook
 * in various scenarios within the admin interface.
 */

import { useGroupSettings } from "./useGroupSettings";
import { useAuth } from "../../../hooks/useAuth";

/**
 * Example 1: Basic usage in a component
 */
function GamesSettingsTab() {
  const { group } = useAuth();
  const { settings, loading, error, updateSetting } = useGroupSettings(group?.id);

  if (loading) {
    return <div>Loading settings...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!settings) {
    return <div>No settings found</div>;
  }

  return (
    <div>
      <h2>Games Settings</h2>

      {/* Toggle round challenge */}
      <label>
        <input
          type="checkbox"
          checked={settings.round_challenge_enabled}
          onChange={(e) => updateSetting("round_challenge_enabled", e.target.checked)}
        />
        Round Challenge Enabled
      </label>

      {/* Select round challenge phase */}
      <select
        value={settings.round_challenge_phase}
        onChange={(e) => updateSetting("round_challenge_phase", e.target.value as "open" | "voting" | "both")}
      >
        <option value="open">Open Phase Only</option>
        <option value="voting">Voting Phase Only</option>
        <option value="both">Both Phases</option>
      </select>

      {/* Toggle submitter guess */}
      <label>
        <input
          type="checkbox"
          checked={settings.submitter_guess_enabled}
          onChange={(e) => updateSetting("submitter_guess_enabled", e.target.checked)}
        />
        Submitter Guess Game Enabled
      </label>

      {/* Toggle timeline game */}
      <label>
        <input
          type="checkbox"
          checked={settings.timeline_game_enabled}
          onChange={(e) => updateSetting("timeline_game_enabled", e.target.checked)}
        />
        Timeline Game Enabled
      </label>
    </div>
  );
}

/**
 * Example 2: Using with AdminToggle component
 */
function AISettingsTab() {
  const { group } = useAuth();
  const { settings, loading, updateSetting } = useGroupSettings(group?.id);

  if (loading || !settings) return null;

  return (
    <div>
      <h2>AI Settings</h2>

      {/* Using with custom AdminToggle component */}
      <AdminToggle
        icon="🤖"
        label="AI Assistant"
        helper="Enable AI-powered features"
        checked={settings.ai_assistant_enabled}
        onChange={(checked) => updateSetting("ai_assistant_enabled", checked)}
      />

      <AdminToggle
        icon="💬"
        label="AI Chat"
        helper="Enable AI chat functionality"
        checked={settings.ai_chat_enabled}
        onChange={(checked) => updateSetting("ai_chat_enabled", checked)}
      />

      {/* Number input for daily limit */}
      <div>
        <label>Daily AI Validation Limit</label>
        <input
          type="number"
          value={settings.ai_validate_daily_limit}
          onChange={(e) => updateSetting("ai_validate_daily_limit", parseInt(e.target.value))}
          min={1}
          max={20}
        />
      </div>
    </div>
  );
}

/**
 * Example 3: Using settings in read-only mode
 */
function SettingsSummary() {
  const { group } = useAuth();
  const { settings, loading } = useGroupSettings(group?.id);

  if (loading) return <div>Loading...</div>;
  if (!settings) return null;

  return (
    <div>
      <h3>Current Configuration</h3>
      <ul>
        <li>Round Challenge: {settings.round_challenge_enabled ? "Enabled" : "Disabled"}</li>
        <li>Timeline Game: {settings.timeline_game_enabled ? "Enabled" : "Disabled"}</li>
        <li>Submitter Guess: {settings.submitter_guess_enabled ? "Enabled" : "Disabled"}</li>
        <li>AI Features: {settings.ai_assistant_enabled ? "Enabled" : "Disabled"}</li>
        <li>Reveal Timer: {settings.reveal_timer_hours} hours</li>
      </ul>
    </div>
  );
}

/**
 * Example 4: Conditional rendering based on settings
 */
function ConditionalFeature() {
  const { group } = useAuth();
  const { settings } = useGroupSettings(group?.id);

  // Don't render if timeline game is disabled
  if (!settings?.timeline_game_enabled) {
    return null;
  }

  return (
    <div>
      <h2>Timeline Game</h2>
      <p>This feature is enabled for this group</p>
    </div>
  );
}

// Dummy component for example
function AdminToggle({ icon, label, helper, checked, onChange }: any) {
  return (
    <label>
      <span>{icon} {label}</span>
      {helper && <small>{helper}</small>}
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export { GamesSettingsTab, AISettingsTab, SettingsSummary, ConditionalFeature };
