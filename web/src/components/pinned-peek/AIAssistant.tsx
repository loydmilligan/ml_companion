import { useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";

type RoundInfo = {
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

type AIAssistantProps = {
  round: RoundInfo | null;
};

export default function AIAssistant({ round }: AIAssistantProps) {
  const [activeTab, setActiveTab] = useState<TabType | null>(null);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [songTitle, setSongTitle] = useState("");
  const [songArtist, setSongArtist] = useState("");

  const handleExplainTheme = useCallback(async () => {
    if (!round) return;

    // Check if we already have an explanation cached
    if (explanation && activeTab === "explain") return;

    setActiveTab("explain");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          mode: "explain_theme",
          round: {
            theme: round.theme,
            theme_description: round.theme_description,
            theme_author: round.theme_author,
          },
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
  }, [round, explanation, activeTab]);

  const handleGetHint = useCallback(async () => {
    if (!round) return;

    setActiveTab("hint");
    setLoading(true);
    setHint(null); // Always get a fresh hint

    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          mode: "generate_hint",
          round: {
            theme: round.theme,
            theme_description: round.theme_description,
            theme_author: round.theme_author,
          },
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
  }, [round]);

  const handleValidateSong = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!round || !songTitle.trim()) return;

    setLoading(true);
    setValidationResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          mode: "validate_song",
          round: {
            theme: round.theme,
            theme_description: round.theme_description,
            theme_author: round.theme_author,
          },
          song_info: {
            title: songTitle.trim(),
            artist: songArtist.trim() || null,
          },
        },
      });

      if (error) throw error;
      setValidationResult(data?.validation || { valid: null, confidence: "low", reason: "Unable to validate." });
    } catch (err) {
      console.error("Error validating song:", err);
      setValidationResult({ valid: null, confidence: "low", reason: "Sorry, I couldn't validate this song right now." });
    } finally {
      setLoading(false);
    }
  }, [round, songTitle, songArtist]);

  const openValidateTab = useCallback(() => {
    setActiveTab("validate");
    setValidationResult(null);
  }, []);

  if (!round) return null;

  return (
    <div className="ai-assistant-section">
      <h3>AI Assistant</h3>

      {/* Tab buttons */}
      <div className="ai-assistant-tabs">
        <button
          type="button"
          className={`ai-assistant-tab ${activeTab === "explain" ? "active" : ""}`}
          onClick={handleExplainTheme}
        >
          Explain Theme
        </button>
        <button
          type="button"
          className={`ai-assistant-tab ${activeTab === "validate" ? "active" : ""}`}
          onClick={openValidateTab}
        >
          Check Song
        </button>
        <button
          type="button"
          className={`ai-assistant-tab ${activeTab === "hint" ? "active" : ""}`}
          onClick={handleGetHint}
        >
          Get Hint
        </button>
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
                  <form className="ai-validate-form" onSubmit={handleValidateSong}>
                    <input
                      type="text"
                      placeholder="Song title"
                      value={songTitle}
                      onChange={(e) => setSongTitle(e.target.value)}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Artist (optional)"
                      value={songArtist}
                      onChange={(e) => setSongArtist(e.target.value)}
                    />
                    <button type="submit" disabled={!songTitle.trim() || loading}>
                      Check Song
                    </button>
                  </form>

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
        </div>
      )}
    </div>
  );
}
