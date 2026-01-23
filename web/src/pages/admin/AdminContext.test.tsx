/**
 * AdminContext Unit Tests
 *
 * Test coverage for context provider, state management, and data fetching
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AdminProvider, useAdmin } from "./AdminContext";
import * as AuthContext from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

// Mock dependencies
vi.mock("../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Test component to consume context
function TestConsumer() {
  const { group, settings, users, loading, refreshUsers, updateSetting } = useAdmin();

  return (
    <div>
      <div data-testid="group">{group?.id || "no-group"}</div>
      <div data-testid="settings">{settings?.id || "no-settings"}</div>
      <div data-testid="users-count">{users.length}</div>
      <div data-testid="loading">{loading ? "loading" : "loaded"}</div>
      <button onClick={refreshUsers}>Refresh Users</button>
      <button onClick={() => updateSetting("ai_chat_enabled", true)}>Update Setting</button>
    </div>
  );
}

describe("AdminContext", () => {
  const mockGroup = { id: "test-group-123", role: "admin" };
  const mockSettings = {
    id: "settings-456",
    group_id: "test-group-123",
    round_summary_model_key: "gpt-4",
    round_story_image_model_key: null,
    round_theme_image_model_key: null,
    awards_model_key: null,
    trophy_image_model_key: null,
    logo_palette: null,
    ai_assistant_enabled: true,
    ai_explain_enabled: true,
    ai_validate_enabled: true,
    ai_hint_enabled: true,
    ai_validate_daily_limit: 10,
    ai_chat_enabled: false,
    round_challenge_enabled: true,
    round_challenge_phase: "both" as const,
    submitter_guess_enabled: true,
    timeline_game_enabled: true,
    timeline_game_phase: "voting" as const,
    reveal_timer_hours: 24,
    playlist_tab_respect_timer: true,
    progress_tab_respect_timer: true,
    games_tab_respect_timer: true,
  };

  const mockUsers = [
    {
      member_id: "user-1",
      role: "admin",
      profiles: {
        id: "profile-1",
        display_name: "Test User",
        email: "test@example.com",
        chat_notify_enabled: true,
        email_notify_enabled: true,
        can_toggle_chat_notify: true,
        can_toggle_email_notify: true,
        reaction_notify_enabled: true,
        can_toggle_reaction_notify: true,
        can_toggle_ntfy_notify: true,
        can_toggle_push_notify: true,
        ntfy_topic: "test-topic",
        timeline_game_tester: false,
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useAuth to return test group
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      group: mockGroup,
      profile: null,
      loading: false,
      error: null,
      session: null,
      signOut: vi.fn(),
    } as any);
  });

  describe("Provider Setup", () => {
    it("provides group from AuthContext", async () => {
      // Mock Supabase responses
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "group_settings") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockSettings }),
              }),
            }),
          } as any;
        }
        if (table === "group_members") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockUsers }),
            }),
          } as any;
        }
        return {} as any;
      });

      render(
        <AdminProvider>
          <TestConsumer />
        </AdminProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("group")).toHaveTextContent("test-group-123");
      });
    });

    it("fetches and provides groupSettings", async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "group_settings") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockSettings }),
              }),
            }),
          } as any;
        }
        if (table === "group_members") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockUsers }),
            }),
          } as any;
        }
        return {} as any;
      });

      render(
        <AdminProvider>
          <TestConsumer />
        </AdminProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("settings")).toHaveTextContent("settings-456");
      });
    });

    it("provides users list", async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "group_settings") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockSettings }),
              }),
            }),
          } as any;
        }
        if (table === "group_members") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockUsers }),
            }),
          } as any;
        }
        return {} as any;
      });

      render(
        <AdminProvider>
          <TestConsumer />
        </AdminProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("users-count")).toHaveTextContent("1");
      });
    });

    it("sets loading state correctly", async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "group_settings") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockSettings }),
              }),
            }),
          } as any;
        }
        if (table === "group_members") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockUsers }),
            }),
          } as any;
        }
        return {} as any;
      });

      render(
        <AdminProvider>
          <TestConsumer />
        </AdminProvider>
      );

      // Initially loading
      expect(screen.getByTestId("loading")).toHaveTextContent("loading");

      // Eventually loaded
      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("loaded");
      });
    });
  });

  describe("updateSetting Method", () => {
    it("updates state optimistically and persists to database", async () => {
      const mockUpdate = vi.fn().mockResolvedValue({ data: null, error: null });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "group_settings") {
          const selectMock = {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockSettings }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: mockUpdate,
            }),
          };
          return selectMock as any;
        }
        if (table === "group_members") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockUsers }),
            }),
          } as any;
        }
        return {} as any;
      });

      render(
        <AdminProvider>
          <TestConsumer />
        </AdminProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("loaded");
      });

      // Click update button
      const updateButton = screen.getByText("Update Setting");
      updateButton.click();

      // Verify database update was called
      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith("id", "settings-456");
      });
    });
  });

  describe("refreshUsers Method", () => {
    it("refetches users when called", async () => {
      let fetchCount = 0;

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "group_settings") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockSettings }),
              }),
            }),
          } as any;
        }
        if (table === "group_members") {
          fetchCount++;
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockUsers }),
            }),
          } as any;
        }
        return {} as any;
      });

      render(
        <AdminProvider>
          <TestConsumer />
        </AdminProvider>
      );

      // Wait for initial load (first fetch)
      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("loaded");
      });

      expect(fetchCount).toBe(1);

      // Click refresh button (second fetch)
      const refreshButton = screen.getByText("Refresh Users");
      refreshButton.click();

      await waitFor(() => {
        expect(fetchCount).toBe(2);
      });
    });
  });

  describe("Error Handling", () => {
    it("throws error when useAdmin is used outside provider", () => {
      // Suppress console.error for this test
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow("useAdmin must be used within AdminProvider");

      consoleError.mockRestore();
    });

    it("handles missing group gracefully", async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        group: null,
        profile: null,
        loading: false,
        error: null,
        session: null,
        signOut: vi.fn(),
      } as any);

      render(
        <AdminProvider>
          <TestConsumer />
        </AdminProvider>
      );

      expect(screen.getByTestId("group")).toHaveTextContent("no-group");
    });
  });
});
