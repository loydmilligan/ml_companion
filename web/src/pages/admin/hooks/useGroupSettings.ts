import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";

type GroupSettings = {
  id: string;
  group_id: string;
  round_summary_model_key: string | null;
  round_story_image_model_key: string | null;
  round_theme_image_model_key: string | null;
  awards_model_key: string | null;
  trophy_image_model_key: string | null;
  logo_palette: string | null;
  ai_assistant_enabled: boolean;
  ai_explain_enabled: boolean;
  ai_validate_enabled: boolean;
  ai_hint_enabled: boolean;
  ai_validate_daily_limit: number;
  ai_chat_enabled: boolean;
  round_challenge_enabled: boolean;
  round_challenge_phase: "open" | "voting" | "both";
  submitter_guess_enabled: boolean;
  timeline_game_enabled: boolean;
  timeline_game_phase: "voting" | "revealed" | "both";
  reveal_timer_hours: number;
  playlist_tab_respect_timer: boolean;
  progress_tab_respect_timer: boolean;
  games_tab_respect_timer: boolean;
  admin_v2_enabled: boolean;
};

const DEFAULT_SETTINGS: Omit<GroupSettings, "id" | "group_id"> = {
  round_summary_model_key: null,
  round_story_image_model_key: null,
  round_theme_image_model_key: null,
  awards_model_key: null,
  trophy_image_model_key: null,
  logo_palette: null,
  ai_assistant_enabled: true,
  ai_explain_enabled: true,
  ai_validate_enabled: true,
  ai_hint_enabled: true,
  ai_validate_daily_limit: 5,
  ai_chat_enabled: true,
  round_challenge_enabled: true,
  round_challenge_phase: "both",
  submitter_guess_enabled: true,
  timeline_game_enabled: false,
  timeline_game_phase: "voting",
  reveal_timer_hours: 8,
  playlist_tab_respect_timer: true,
  progress_tab_respect_timer: true,
  games_tab_respect_timer: true,
  admin_v2_enabled: false,
};

export function useGroupSettings(groupId: string | null | undefined) {
  const [settings, setSettings] = useState<GroupSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    const fetchSettings = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("group_settings")
        .select("*")
        .eq("group_id", groupId)
        .single();

      if (fetchError || !data) {
        // Use defaults if no settings exist
        setSettings({
          id: "",
          group_id: groupId,
          ...DEFAULT_SETTINGS,
        });
      } else {
        setSettings(data as GroupSettings);
      }
      setLoading(false);
    };

    fetchSettings();
  }, [groupId]);

  const updateSetting = useCallback(
    async <K extends keyof GroupSettings>(key: K, value: GroupSettings[K]) => {
      if (!settings?.id || !settings.id) {
        setError("Cannot update: settings not loaded");
        return;
      }

      // Optimistic update
      setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));

      const { error: updateError } = await supabase
        .from("group_settings")
        .update({ [key]: value })
        .eq("id", settings.id);

      if (updateError) {
        setError(updateError.message);
        // Revert optimistic update on error - would need to store previous value
      }
    },
    [settings?.id]
  );

  return { settings, loading, error, updateSetting };
}
