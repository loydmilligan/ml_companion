import { useState, useCallback, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

type RoundInfo = {
  id?: string;
  theme: string;
  theme_description?: string | null;
  theme_author?: string | null;
};

type TabType = "explain" | "validate" | "hint";

type ValidationResult = {
  valid: boolean | null;
  confidence: "high" | "medium" | "low";
  reason: string;
};

type AISettings = {
  ai_assistant_enabled: boolean;
  ai_explain_enabled: boolean;
  ai_validate_enabled: boolean;
  ai_hint_enabled: boolean;
  ai_validate_daily_limit: number;
};

type AIUsage = {
  validate_today: number;
};

type AIAssistantProps = {
  round: RoundInfo | null;
};

export default function AIAssistant({ round }: AIAssistantProps) {
  const { profile, group } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType | null>(null);
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [songTitle, setSongTitle] = useState("");
  const [songArtist, setSongArtist] = useState("");
  const [limitError, setLimitError] = useState<string | null>(null);

  // Settings state
  const [settings, setSettings] = useState<AISettings>({
    ai_assistant_enabled: true,
    ai_explain_enabled: true,
    ai_validate_enabled: true,
    ai_hint_enabled: true,
    ai_validate_daily_limit: 5,
  });
  const [usage, setUsage] = useState<AIUsage>({ validate_today: 0 });

  // Fetch settings on mount
  useEffect(() => {
    async function fetchSettings() {
      if (!group?.id) {
        setSettingsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("ai-assistant", {
          body: {
            mode: "get_settings",
            group_id: group.id,
            user_id: profile?.id,
          },
        });

        if (error) throw error;

        if (data?.settings) {
          setSettings(data.settings);
        }
        if (data?.usage) {
          setUsage(data.usage);
        }
      } catch (err) {
        console.error("Error fetching AI settings:", err);
      } finally {
        setSettingsLoading(false);
      }
    }

    fetchSettings();
  }, [group?.id, profile?.id]);

  const handleExplainTheme = useCallback(async () => {
    if (!round) return;

    // Check if we already have an explanation cached in local state
    if (explanation && activeTab === "explain") return;

    setActiveTab("explain");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          mode: "explain_theme",
          round: {
            id: round.id,
            theme: round.theme,
            theme_description: round.theme_description,
            theme_author: round.theme_author,
          },
          group_id: group?.id,
          user_id: profile?.id,
        },
      });

      if (error) throw error;
      setExplanation(data?.explanation || "Unable to generate explanation.");
    } catch (err) {
      console.error("Error explaining theme:", err);
      setExplanation("Sorry, I couldn't explain this theme right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [round, explanation, activeTab, group?.id, profile?.id]);

  const handleGetHint = useCallback(async () => {
    if (!round) return;

    // Check if we already have a hint cached in local state
    if (hint && activeTab === "hint") return;

    setActiveTab("hint");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          mode: "generate_hint",
          round: {
            id: round.id,
            theme: round.theme,
            theme_description: round.theme_description,
            theme_author: round.theme_author,
          },
          group_id: group?.id,
          user_id: profile?.id,
        },
      });

      if (error) throw error;
      setHint(data?.hint || "Unable to generate hint.");
    } catch (err) {
      console.error("Error generating hint:", err);
      setHint("Sorry, I couldn't generate a hint right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [round, hint, activeTab, group?.id, profile?.id]);

  const handleValidateSong = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!round || !songTitle.trim()) return;

    setLoading(true);
    setValidationResult(null);
    setLimitError(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          mode: "validate_song",
          round: {
            id: round.id,
            theme: round.theme,
            theme_description: round.theme_description,
            theme_author: round.theme_author,
          },
          song_info: {
            title: songTitle.trim(),
            artist: songArtist.trim() || null,
          },
          group_id: group?.id,
          user_id: profile?.id,
        },
      });

      if (error) {
        // Check if it's a 429 (daily limit) error
        if (error.message?.includes("Daily limit")) {
          setLimitError(data?.message || "You've reached your daily limit for song checks. Try again tomorrow!");
          return;
        }
        throw error;
      }

      // Check for limit error in response
      if (data?.error === "Daily limit reached") {
        setLimitError(data.message || "You've reached your daily limit for song checks. Try again tomorrow!");
        return;
      }

      setValidationResult(data?.validation || { valid: null, confidence: "low", reason: "Unable to validate." });
      // Update usage count
      setUsage((prev) => ({ ...prev, validate_today: prev.validate_today + 1 }));
    } catch (err) {
      console.error("Error validating song:", err);
      setValidationResult({ valid: null, confidence: "low", reason: "Sorry, I couldn't validate this song right now." });
    } finally {
      setLoading(false);
    }
  }, [round, songTitle, songArtist, group?.id, profile?.id]);

  const openValidateTab = useCallback(() => {
    setActiveTab("validate");
    setValidationResult(null);
    setLimitError(null);
  }, []);

  // Don't render if no round or still loading settings
  if (!round || settingsLoading) return null;

  // Don't render if AI Assistant is disabled for this group
  if (!settings.ai_assistant_enabled) return null;

  // Check which tabs should be shown
  const showExplain = settings.ai_explain_enabled;
  const showValidate = settings.ai_validate_enabled;
  const showHint = settings.ai_hint_enabled;

  // Don't render if all features are disabled
  if (!showExplain && !showValidate && !showHint) return null;

  const remainingChecks = settings.ai_validate_daily_limit - usage.validate_today;
  const isOverLimit = remainingChecks <= 0;

  return (
    <div className="ai-assistant-section">
      <h3>AI Assistant</h3>

      {/* Tab buttons */}
      <div className="ai-assistant-tabs">
        {showExplain && (
          <button
            type="button"
            className={`ai-assistant-tab ${activeTab === "explain" ? "active" : ""}`}
            onClick={handleExplainTheme}
          >
            Explain Theme
          </button>
        )}
        {showValidate && (
          <button
            type="button"
            className={`ai-assistant-tab ${activeTab === "validate" ? "active" : ""}`}
            onClick={openValidateTab}
          >
            Check Song
            {remainingChecks > 0 && remainingChecks < settings.ai_validate_daily_limit && (
              <span className="ai-usage-badge">{remainingChecks}</span>
            )}
          </button>
        )}
        {showHint && (
          <button
            type="button"
            className={`ai-assistant-tab ${activeTab === "hint" ? "active" : ""}`}
            onClick={handleGetHint}
          >
            Get Hint
          </button>
        )}
      </div>

      {/* Content area */}
      {activeTab && (
        <div className="ai-assistant-content">
          {loading ? (
            <div className="ai-assistant-loading">
              <div className="spinner" />
              <span>Thinking...</span>
            </div>
          ) : (
            <>
              {/* Explanation content */}
              {activeTab === "explain" && explanation && (
                <div className="ai-assistant-response">
                  {explanation.split("\n").map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              )}

              {/* Hint content */}
              {activeTab === "hint" && hint && (
                <div className="ai-assistant-response">
                  {hint.split("\n").map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              )}

              {/* Validate content */}
              {activeTab === "validate" && (
                <>
                  {limitError ? (
                    <div className="ai-limit-error">
                      <span className="ai-limit-icon">⏰</span>
                      <p>{limitError}</p>
                    </div>
                  ) : (
                    <>
                      <form className="ai-validate-form" onSubmit={handleValidateSong}>
                        <input
                          type="text"
                          placeholder="Song title"
                          value={songTitle}
                          onChange={(e) => setSongTitle(e.target.value)}
                          required
                          disabled={isOverLimit}
                        />
                        <input
                          type="text"
                          placeholder="Artist (optional)"
                          value={songArtist}
                          onChange={(e) => setSongArtist(e.target.value)}
                          disabled={isOverLimit}
                        />
                        <button type="submit" disabled={!songTitle.trim() || loading || isOverLimit}>
                          {isOverLimit ? "Limit Reached" : "Check Song"}
                        </button>
                      </form>

                      {remainingChecks > 0 && (
                        <p className="ai-usage-hint">
                          {remainingChecks} of {settings.ai_validate_daily_limit} checks remaining today
                        </p>
                      )}

                      {validationResult && (
                        <div
                          className={`ai-validation-result ${
                            validationResult.valid === true
                              ? "valid"
                              : validationResult.valid === false
                              ? "invalid"
                              : "uncertain"
                          }`}
                        >
                          <strong>
                            {validationResult.valid === true
                              ? "Looks good!"
                              : validationResult.valid === false
                              ? "Might not fit"
                              : "Uncertain"}
                          </strong>
                          {" "}
                          <span style={{ opacity: 0.8 }}>
                            ({validationResult.confidence} confidence)
                          </span>
                          <p style={{ margin: "8px 0 0 0" }}>{validationResult.reason}</p>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
