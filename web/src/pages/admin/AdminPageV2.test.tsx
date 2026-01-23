/**
 * AdminPageV2 Unit Tests
 *
 * Test coverage for navigation, tab rendering, and tab switching
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminPageV2 from "./AdminPageV2";
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

describe("AdminPageV2", () => {
  const mockLeadGroup = { id: "test-group-123", role: "lead" };
  const mockMemberGroup = { id: "test-group-456", role: "member" };
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
  });

  const setupMocks = (group: typeof mockLeadGroup | typeof mockMemberGroup | null, loading = false) => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      group,
      profile: null,
      loading,
      error: null,
      session: null,
      signOut: vi.fn(),
    } as any);

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === "group_settings") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockSettings }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: mockSettings }),
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
      if (table === "invite_codes") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [] }),
            }),
          }),
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any;
      }
      if (table === "profiles") {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null }),
          }),
        } as any;
      }
      if (table === "season_competitors") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [] }),
            }),
          }),
        } as any;
      }
      if (table === "leagues") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [] }),
            }),
          }),
        } as any;
      }
      if (table === "rounds") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [] }),
              }),
            }),
          }),
        } as any;
      }
      if (table === "bonus_awards") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [] }),
              }),
            }),
          }),
          insert: vi.fn().mockResolvedValue({ data: null }),
        } as any;
      }
      if (table === "challenge_bonus_points") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [] }),
            }),
          }),
          insert: vi.fn().mockResolvedValue({ data: null }),
        } as any;
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [] }),
        }),
      } as any;
    });
  };

  describe("Loading State", () => {
    it("shows loading message while data is being fetched", () => {
      setupMocks(mockLeadGroup, true);

      render(<AdminPageV2 />);

      expect(screen.getByText("Loading admin settings...")).toBeInTheDocument();
    });
  });

  describe("Authorization", () => {
    it("shows unauthorized message for non-lead users", async () => {
      setupMocks(mockMemberGroup);

      render(<AdminPageV2 />);

      await waitFor(() => {
        expect(
          screen.getByText("You need lead permissions to access admin settings.")
        ).toBeInTheDocument();
      });
    });

    it("allows access for lead users", async () => {
      setupMocks(mockLeadGroup);

      render(<AdminPageV2 />);

      await waitFor(() => {
        expect(screen.getByText("Admin Panel")).toBeInTheDocument();
      });
    });
  });

  describe("Tab Bar Rendering", () => {
    it("renders all 4 tabs", async () => {
      setupMocks(mockLeadGroup);

      render(<AdminPageV2 />);

      await waitFor(() => {
        expect(screen.getByText("Admin Panel")).toBeInTheDocument();
      });

      const tabs = screen.getAllByRole("tab");
      expect(tabs).toHaveLength(4);

      // Verify all tab labels are present
      expect(screen.getAllByText("People").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Content").length).toBeGreaterThan(0);
      expect(screen.getByText("Games & AI")).toBeInTheDocument();
      expect(screen.getAllByText("System").length).toBeGreaterThan(0);
    });

    it("renders tab icons", async () => {
      setupMocks(mockLeadGroup);

      render(<AdminPageV2 />);

      await waitFor(() => {
        expect(screen.getByText("Admin Panel")).toBeInTheDocument();
      });

      // Get all tabs and verify they each have icons
      const tabs = screen.getAllByRole("tab");
      expect(tabs).toHaveLength(4);

      // Each tab should have an icon element
      tabs.forEach((tab) => {
        const iconSpan = tab.querySelector(".admin-tab__icon");
        expect(iconSpan).toBeInTheDocument();
      });
    });
  });

  describe("Tab Switching", () => {
    it("shows People tab content by default", async () => {
      setupMocks(mockLeadGroup);

      render(<AdminPageV2 />);

      await waitFor(() => {
        expect(screen.getByText("Admin Panel")).toBeInTheDocument();
      });

      // PeopleTab renders Members section header
      await waitFor(() => {
        expect(screen.getByText("Members")).toBeInTheDocument();
      });
    });

    it("switches to Content tab when clicked", async () => {
      setupMocks(mockLeadGroup);
      const user = userEvent.setup();

      render(<AdminPageV2 />);

      await waitFor(() => {
        expect(screen.getByText("Admin Panel")).toBeInTheDocument();
      });

      const tabs = screen.getAllByRole("tab");
      const contentTab = tabs[1]; // Second tab is Content

      await user.click(contentTab);

      // ContentTab renders Leagues section header
      await waitFor(() => {
        expect(screen.getByText("Leagues")).toBeInTheDocument();
      });
    });

    it("switches to Games tab when clicked", async () => {
      setupMocks(mockLeadGroup);
      const user = userEvent.setup();

      render(<AdminPageV2 />);

      await waitFor(() => {
        expect(screen.getByText("Admin Panel")).toBeInTheDocument();
      });

      const tabs = screen.getAllByRole("tab");
      const gamesTab = tabs[2]; // Third tab is Games

      await user.click(gamesTab);

      // GamesTab renders Guess the Submitter section header
      await waitFor(() => {
        expect(screen.getByText("Guess the Submitter")).toBeInTheDocument();
      });
    });

    it("switches to System tab when clicked", async () => {
      setupMocks(mockLeadGroup);
      const user = userEvent.setup();

      render(<AdminPageV2 />);

      await waitFor(() => {
        expect(screen.getByText("Admin Panel")).toBeInTheDocument();
      });

      const tabs = screen.getAllByRole("tab");
      const systemTab = tabs[3]; // Fourth tab is System

      await user.click(systemTab);

      // SystemTab renders Testing section header
      await waitFor(() => {
        expect(screen.getByText("Testing")).toBeInTheDocument();
      });
    });

    it("shows only one tab content at a time", async () => {
      setupMocks(mockLeadGroup);
      const user = userEvent.setup();

      render(<AdminPageV2 />);

      await waitFor(() => {
        expect(screen.getByText("Admin Panel")).toBeInTheDocument();
      });

      const tabs = screen.getAllByRole("tab");

      // Initially on People tab - check for Members section
      await waitFor(() => {
        expect(screen.getByText("Members")).toBeInTheDocument();
      });

      // Switch to Content tab - Leagues section should appear
      await user.click(tabs[1]);
      await waitFor(() => {
        expect(screen.getByText("Leagues")).toBeInTheDocument();
      });

      // Switch to Games tab - Guess the Submitter section should appear
      await user.click(tabs[2]);
      await waitFor(() => {
        expect(screen.getByText("Guess the Submitter")).toBeInTheDocument();
      });
    });
  });

  describe("Active Tab State", () => {
    it("marks the active tab with aria-selected=true", async () => {
      setupMocks(mockLeadGroup);
      const user = userEvent.setup();

      render(<AdminPageV2 />);

      await waitFor(() => {
        expect(screen.getByText("Admin Panel")).toBeInTheDocument();
      });

      const tabs = screen.getAllByRole("tab");

      // People tab should be active initially
      expect(tabs[0]).toHaveAttribute("aria-selected", "true");
      expect(tabs[1]).toHaveAttribute("aria-selected", "false");

      // Click Content tab
      await user.click(tabs[1]);

      // Content tab should now be active
      expect(tabs[0]).toHaveAttribute("aria-selected", "false");
      expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    });

    it("applies active class to the current tab", async () => {
      setupMocks(mockLeadGroup);
      const user = userEvent.setup();

      render(<AdminPageV2 />);

      await waitFor(() => {
        expect(screen.getByText("Admin Panel")).toBeInTheDocument();
      });

      const tabs = screen.getAllByRole("tab");

      // People tab should have active class initially
      expect(tabs[0]).toHaveClass("admin-tab--active");

      // Click Content tab
      await user.click(tabs[1]);

      // Content tab should now have active class
      expect(tabs[0]).not.toHaveClass("admin-tab--active");
      expect(tabs[1]).toHaveClass("admin-tab--active");
    });
  });
});
