import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useGroupSettings } from "./useGroupSettings";
import { supabase } from "../../../lib/supabase";

// Mock supabase
vi.mock("../../../lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe("useGroupSettings", () => {
  const mockGroupId = "test-group-123";
  let fromMock: any;
  let selectMock: any;
  let eqMock: any;
  let singleMock: any;
  let updateMock: any;

  beforeEach(() => {
    // Setup mock chain
    singleMock = vi.fn();
    eqMock = vi.fn(() => ({ single: singleMock }));
    selectMock = vi.fn(() => ({ eq: eqMock }));
    updateMock = vi.fn(() => ({ eq: eqMock }));
    fromMock = vi.fn((table: string) => {
      if (table === "group_settings") {
        return {
          select: selectMock,
          update: updateMock,
        };
      }
      return {};
    });
    (supabase.from as any) = fromMock;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("fetches settings on mount", async () => {
    const mockSettings = {
      id: "settings-1",
      group_id: mockGroupId,
      round_summary_model_key: "gpt-4",
      ai_assistant_enabled: true,
      ai_validate_daily_limit: 5,
      round_challenge_enabled: true,
      round_challenge_phase: "both" as const,
      submitter_guess_enabled: true,
      timeline_game_enabled: false,
      timeline_game_phase: "voting" as const,
      reveal_timer_hours: 8,
      playlist_tab_respect_timer: true,
      progress_tab_respect_timer: true,
      games_tab_respect_timer: true,
      round_story_image_model_key: null,
      round_theme_image_model_key: null,
      awards_model_key: null,
      trophy_image_model_key: null,
      logo_palette: null,
      ai_explain_enabled: true,
      ai_validate_enabled: true,
      ai_hint_enabled: true,
      ai_chat_enabled: true,
    };

    singleMock.mockResolvedValueOnce({ data: mockSettings, error: null });

    const { result } = renderHook(() => useGroupSettings(mockGroupId));

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.settings).toBe(null);

    // Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.settings).toEqual(mockSettings);
    expect(result.current.error).toBe(null);
    expect(fromMock).toHaveBeenCalledWith("group_settings");
    expect(selectMock).toHaveBeenCalledWith("*");
    expect(eqMock).toHaveBeenCalledWith("group_id", mockGroupId);
    expect(singleMock).toHaveBeenCalled();
  });

  it("returns loading state while fetching", async () => {
    // Create a promise that we can control
    let resolvePromise: any;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    singleMock.mockReturnValueOnce(promise);

    const { result } = renderHook(() => useGroupSettings(mockGroupId));

    // Should be loading
    expect(result.current.loading).toBe(true);
    expect(result.current.settings).toBe(null);

    // Resolve the promise
    resolvePromise({ data: null, error: { message: "Not found" } });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it("returns default settings if no settings exist", async () => {
    singleMock.mockResolvedValueOnce({ data: null, error: { message: "Not found" } });

    const { result } = renderHook(() => useGroupSettings(mockGroupId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.settings).toEqual({
      id: "",
      group_id: mockGroupId,
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
    });
  });

  it("handles null or undefined groupId", () => {
    const { result: resultNull } = renderHook(() => useGroupSettings(null));
    expect(resultNull.current.loading).toBe(false);
    expect(resultNull.current.settings).toBe(null);

    const { result: resultUndefined } = renderHook(() => useGroupSettings(undefined));
    expect(resultUndefined.current.loading).toBe(false);
    expect(resultUndefined.current.settings).toBe(null);
  });

  it("updateSetting updates local state optimistically", async () => {
    const mockSettings = {
      id: "settings-1",
      group_id: mockGroupId,
      round_summary_model_key: null,
      ai_assistant_enabled: true,
      ai_validate_daily_limit: 5,
      round_challenge_enabled: false,
      round_challenge_phase: "both" as const,
      submitter_guess_enabled: true,
      timeline_game_enabled: false,
      timeline_game_phase: "voting" as const,
      reveal_timer_hours: 8,
      playlist_tab_respect_timer: true,
      progress_tab_respect_timer: true,
      games_tab_respect_timer: true,
      round_story_image_model_key: null,
      round_theme_image_model_key: null,
      awards_model_key: null,
      trophy_image_model_key: null,
      logo_palette: null,
      ai_explain_enabled: true,
      ai_validate_enabled: true,
      ai_hint_enabled: true,
      ai_chat_enabled: true,
    };

    singleMock.mockResolvedValueOnce({ data: mockSettings, error: null });

    const { result } = renderHook(() => useGroupSettings(mockGroupId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Mock successful update
    eqMock.mockResolvedValueOnce({ error: null });

    // Call updateSetting
    await result.current.updateSetting("round_challenge_enabled", true);

    // State should be updated optimistically
    expect(result.current.settings?.round_challenge_enabled).toBe(true);
  });

  it("updateSetting calls supabase update", async () => {
    const mockSettings = {
      id: "settings-1",
      group_id: mockGroupId,
      round_summary_model_key: null,
      ai_assistant_enabled: true,
      ai_validate_daily_limit: 5,
      round_challenge_enabled: false,
      round_challenge_phase: "both" as const,
      submitter_guess_enabled: true,
      timeline_game_enabled: false,
      timeline_game_phase: "voting" as const,
      reveal_timer_hours: 8,
      playlist_tab_respect_timer: true,
      progress_tab_respect_timer: true,
      games_tab_respect_timer: true,
      round_story_image_model_key: null,
      round_theme_image_model_key: null,
      awards_model_key: null,
      trophy_image_model_key: null,
      logo_palette: null,
      ai_explain_enabled: true,
      ai_validate_enabled: true,
      ai_hint_enabled: true,
      ai_chat_enabled: true,
    };

    singleMock.mockResolvedValueOnce({ data: mockSettings, error: null });

    const { result } = renderHook(() => useGroupSettings(mockGroupId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Mock successful update
    eqMock.mockResolvedValueOnce({ error: null });

    // Call updateSetting
    await result.current.updateSetting("ai_validate_daily_limit", 10);

    // Verify supabase was called correctly
    expect(updateMock).toHaveBeenCalledWith({ ai_validate_daily_limit: 10 });
    expect(eqMock).toHaveBeenCalledWith("id", "settings-1");
  });

  it("sets error when update fails", async () => {
    const mockSettings = {
      id: "settings-1",
      group_id: mockGroupId,
      round_summary_model_key: null,
      ai_assistant_enabled: true,
      ai_validate_daily_limit: 5,
      round_challenge_enabled: false,
      round_challenge_phase: "both" as const,
      submitter_guess_enabled: true,
      timeline_game_enabled: false,
      timeline_game_phase: "voting" as const,
      reveal_timer_hours: 8,
      playlist_tab_respect_timer: true,
      progress_tab_respect_timer: true,
      games_tab_respect_timer: true,
      round_story_image_model_key: null,
      round_theme_image_model_key: null,
      awards_model_key: null,
      trophy_image_model_key: null,
      logo_palette: null,
      ai_explain_enabled: true,
      ai_validate_enabled: true,
      ai_hint_enabled: true,
      ai_chat_enabled: true,
    };

    singleMock.mockResolvedValueOnce({ data: mockSettings, error: null });

    const { result } = renderHook(() => useGroupSettings(mockGroupId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Mock failed update
    eqMock.mockResolvedValueOnce({ error: { message: "Update failed" } });

    // Call updateSetting
    await result.current.updateSetting("ai_validate_daily_limit", 10);

    // Error should be set
    await waitFor(() => {
      expect(result.current.error).toBe("Update failed");
    });
  });

  it("handles updateSetting when settings not loaded", async () => {
    singleMock.mockResolvedValueOnce({ data: null, error: { message: "Not found" } });

    const { result } = renderHook(() => useGroupSettings(mockGroupId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Settings loaded with defaults (id is empty string)
    await result.current.updateSetting("round_challenge_enabled", true);

    // Should set error
    expect(result.current.error).toBe("Cannot update: settings not loaded");
  });
});
