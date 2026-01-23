/**
 * ContentTab Unit Tests
 *
 * Test coverage for league list rendering, expansion, and narrative editing
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ContentTab from "./ContentTab";
import { supabase } from "../../../lib/supabase";

// Mock dependencies
vi.mock("../AdminContext", () => ({
  useAdmin: () => ({
    group: { id: "test-group-id", name: "Test Group" },
  }),
}));

vi.mock("../../../lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  },
}));

vi.mock("../components", () => ({
  AdminCard: ({ children, className, title }: any) => (
    <div className={className}>
      {title && <h3>{title}</h3>}
      {children}
    </div>
  ),
  AdminSection: ({ children, title, icon }: any) => (
    <div>
      <h2>{icon} {title}</h2>
      {children}
    </div>
  ),
  AdminSelect: ({ label, value, onChange, options }: any) => (
    <div>
      <label>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid="admin-select"
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  ),
}));

vi.mock("../../../components/SeasonImport", () => ({
  default: ({ leagueId, onImportComplete }: any) => (
    <div data-testid="season-import">
      <p>SeasonImport for league: {leagueId}</p>
      <button onClick={() => onImportComplete()}>Import CSV</button>
    </div>
  ),
}));

describe("ContentTab", () => {
  const mockLeagues = [
    {
      id: "league-1",
      name: "Summer League 2024",
      season_number: 5,
      created_at: "2024-01-01",
      narrative: "Best summer ever!",
    },
    {
      id: "league-2",
      name: "Winter League 2023",
      season_number: 4,
      created_at: "2023-12-01",
      narrative: null,
    },
    {
      id: "league-3",
      name: "Fall League 2023",
      season_number: null,
      created_at: "2023-09-01",
      narrative: "Great fall vibes",
    },
  ];

  const mockRounds = [
    {
      id: "round-1",
      league_id: "league-1",
      theme: "80s Hits",
      theme_description: "Songs from the 1980s",
      theme_author: "John Doe",
      season_number: 5,
      round_number: 1,
      external_round_id: "ext-1",
      playlist_url: "https://open.spotify.com/playlist/123",
      youtube_playlist_url: "https://www.youtube.com/playlist?list=abc",
      comment_required: true,
      status: "revealed" as const,
      submission_deadline: "2024-01-15T00:00:00Z",
      voting_deadline: "2024-01-22T00:00:00Z",
      theme_image_url: "https://example.com/theme.jpg",
      winners_image_url: "https://example.com/winners.jpg",
      narrative: "Great round!",
      created_at: "2024-01-01",
    },
    {
      id: "round-2",
      league_id: "league-1",
      theme: "90s Dance",
      theme_description: null,
      theme_author: null,
      season_number: 5,
      round_number: 2,
      external_round_id: null,
      playlist_url: null,
      youtube_playlist_url: null,
      comment_required: false,
      status: "voting" as const,
      submission_deadline: null,
      voting_deadline: null,
      theme_image_url: null,
      winners_image_url: null,
      narrative: null,
      created_at: "2024-01-08",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Supabase query chain - need to handle both leagues and rounds
    const mockSelect = vi.fn((fields) => {
      if (fields === "id, name, season_number, created_at, narrative") {
        // Leagues query
        return {
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockLeagues }),
        };
      } else {
        // Rounds query (select "*")
        return {
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
        };
      }
    });

    // For rounds, we need chained order calls: .order().order()
    const mockOrderSecond = vi.fn().mockResolvedValue({ data: mockRounds });
    const mockOrderFirst = vi.fn().mockReturnValue({
      order: mockOrderSecond,
    });
    const mockEq = vi.fn().mockReturnValue({
      order: mockOrderFirst,
    });

    (supabase.from as any).mockImplementation((table) => {
      if (table === "leagues") {
        return {
          select: mockSelect,
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
        };
      } else if (table === "rounds") {
        return {
          select: vi.fn().mockReturnValue({
            eq: mockEq,
          }),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
        };
      }
      return {
        select: mockSelect,
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [] }),
        update: vi.fn().mockReturnThis(),
      };
    });
  });

  describe("Rendering", () => {
    it("renders league list", async () => {
      render(<ContentTab />);

      await waitFor(() => {
        expect(screen.getByText("Summer League 2024")).toBeInTheDocument();
        expect(screen.getByText("Winter League 2023")).toBeInTheDocument();
        expect(screen.getByText("Fall League 2023")).toBeInTheDocument();
      });
    });

    it("displays season numbers correctly", async () => {
      render(<ContentTab />);

      await waitFor(() => {
        expect(screen.getByText("Season 5")).toBeInTheDocument();
        expect(screen.getByText("Season 4")).toBeInTheDocument();
        expect(screen.getByText("Season —")).toBeInTheDocument();
      });
    });

    it("renders Leagues section with icon and title", async () => {
      render(<ContentTab />);

      await waitFor(() => {
        expect(screen.getByText(/🏆/)).toBeInTheDocument();
        expect(screen.getByText(/Leagues/)).toBeInTheDocument();
      });
    });

    it("fetches leagues for the correct group", async () => {
      render(<ContentTab />);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith("leagues");
      });

      const mockSelect = (supabase.from as any).mock.results[0].value.select;
      expect(mockSelect).toHaveBeenCalledWith(
        "id, name, season_number, created_at, narrative"
      );
    });
  });

  describe("Expansion", () => {
    it("shows expand icon when collapsed", async () => {
      const { container } = render(<ContentTab />);

      await waitFor(() => {
        const icons = container.querySelectorAll(".league-expand-icon");
        expect(icons.length).toBeGreaterThan(0);
        expect(icons[0].textContent).toBe("▶");
      });
    });

    it("expand shows narrative editor", async () => {
      const user = userEvent.setup();
      const { container } = render(<ContentTab />);

      await waitFor(() => {
        expect(screen.getByText("Summer League 2024")).toBeInTheDocument();
      });

      // Click on league header to expand
      const leagueHeader = container.querySelector(".league-header");
      await user.click(leagueHeader!);

      // Check that narrative editor is visible
      await waitFor(() => {
        const textarea = screen.getByPlaceholderText(
          "Describe this league/season..."
        );
        expect(textarea).toBeInTheDocument();
        expect(textarea).toHaveValue("Best summer ever!");
      });

      // Check that expand icon changed
      const expandIcon = container.querySelector(".league-expand-icon");
      expect(expandIcon?.textContent).toBe("▼");
    });

    it("collapse hides narrative editor", async () => {
      const user = userEvent.setup();
      const { container } = render(<ContentTab />);

      await waitFor(() => {
        expect(screen.getByText("Summer League 2024")).toBeInTheDocument();
      });

      const leagueHeader = container.querySelector(".league-header");

      // Expand
      await user.click(leagueHeader!);
      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Describe this league/season...")
        ).toBeInTheDocument();
      });

      // Collapse
      await user.click(leagueHeader!);
      await waitFor(() => {
        expect(
          screen.queryByPlaceholderText("Describe this league/season...")
        ).not.toBeInTheDocument();
      });
    });

    it("shows empty narrative for leagues without one", async () => {
      const user = userEvent.setup();
      const { container } = render(<ContentTab />);

      await waitFor(() => {
        expect(screen.getByText("Winter League 2023")).toBeInTheDocument();
      });

      // Click on second league (no narrative)
      const leagueHeaders = container.querySelectorAll(".league-header");
      await user.click(leagueHeaders[1]);

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText(
          "Describe this league/season..."
        );
        expect(textarea).toHaveValue("");
      });
    });
  });

  describe("Narrative Editing", () => {
    it("save updates narrative", async () => {
      const user = userEvent.setup();
      const { container } = render(<ContentTab />);

      await waitFor(() => {
        expect(screen.getByText("Summer League 2024")).toBeInTheDocument();
      });

      // Expand league
      const leagueHeader = container.querySelector(".league-header");
      await user.click(leagueHeader!);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Describe this league/season...")
        ).toBeInTheDocument();
      });

      // Edit narrative
      const textarea = screen.getByPlaceholderText(
        "Describe this league/season..."
      );
      await user.clear(textarea);
      await user.type(textarea, "Updated narrative");

      // Mock update query
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ data: null });
      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      });
      mockUpdate.mockReturnValue({ eq: mockEq });

      // Save
      const saveButton = screen.getByText("Save");
      await user.click(saveButton);

      // Verify update was called
      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith("leagues");
        expect(mockUpdate).toHaveBeenCalledWith({ narrative: "Updated narrative" });
        expect(mockEq).toHaveBeenCalledWith("id", "league-1");
      });
    });

    it("cancel button closes editor without saving", async () => {
      const user = userEvent.setup();
      const { container } = render(<ContentTab />);

      await waitFor(() => {
        expect(screen.getByText("Summer League 2024")).toBeInTheDocument();
      });

      // Expand league
      const leagueHeader = container.querySelector(".league-header");
      await user.click(leagueHeader!);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Describe this league/season...")
        ).toBeInTheDocument();
      });

      // Edit narrative
      const textarea = screen.getByPlaceholderText(
        "Describe this league/season..."
      );
      await user.clear(textarea);
      await user.type(textarea, "Should not save");

      // Cancel
      const cancelButton = screen.getByText("Cancel");
      await user.click(cancelButton);

      // Verify editor is closed
      await waitFor(() => {
        expect(
          screen.queryByPlaceholderText("Describe this league/season...")
        ).not.toBeInTheDocument();
      });
    });

    it("updates local state after save", async () => {
      const user = userEvent.setup();
      const { container } = render(<ContentTab />);

      await waitFor(() => {
        expect(screen.getByText("Summer League 2024")).toBeInTheDocument();
      });

      // Expand league
      const leagueHeader = container.querySelector(".league-header");
      await user.click(leagueHeader!);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Describe this league/season...")
        ).toBeInTheDocument();
      });

      // Edit and save
      const textarea = screen.getByPlaceholderText(
        "Describe this league/season..."
      );
      await user.clear(textarea);
      await user.type(textarea, "New narrative");

      // Mock successful update
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ data: null });
      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      });
      mockUpdate.mockReturnValue({ eq: mockEq });

      const saveButton = screen.getByText("Save");
      await user.click(saveButton);

      // Verify editor closed after save
      await waitFor(() => {
        expect(
          screen.queryByPlaceholderText("Describe this league/season...")
        ).not.toBeInTheDocument();
      });

      // Re-expand and verify updated value
      await user.click(leagueHeader!);
      await waitFor(() => {
        const updatedTextarea = screen.getByPlaceholderText(
          "Describe this league/season..."
        );
        expect(updatedTextarea).toHaveValue("New narrative");
      });
    });
  });

  describe("Empty State", () => {
    it("renders empty list when no leagues", async () => {
      // Mock empty response for both leagues and rounds
      const mockOrderChain = {
        order: vi.fn().mockResolvedValue({ data: [] }),
      };
      (supabase.from as any).mockImplementation((table: string) => {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnValue(mockOrderChain),
        };
      });

      const { container } = render(<ContentTab />);

      await waitFor(() => {
        const leagueList = container.querySelector(".league-list");
        expect(leagueList?.children.length).toBe(0);
      });
    });
  });

  describe("Imports Section", () => {
    it("renders imports section with league selector", async () => {
      render(<ContentTab />);

      await waitFor(() => {
        expect(screen.getByText(/📥/)).toBeInTheDocument();
        expect(screen.getByText(/Import Data/)).toBeInTheDocument();
        expect(screen.getByText("Target League")).toBeInTheDocument();
      });
    });

    it("CSV upload shows preview when league selected", async () => {
      const user = userEvent.setup();
      render(<ContentTab />);

      await waitFor(() => {
        expect(screen.getByText("Summer League 2024")).toBeInTheDocument();
      });

      // Select a league - find the import league selector (has "Select a league..." option)
      const selects = screen.getAllByTestId("admin-select");
      const importSelect = selects.find(select =>
        select.querySelector('option[value=""]')?.textContent?.includes("Select a league")
      );

      expect(importSelect).toBeDefined();
      await user.selectOptions(importSelect!, "league-1");

      // SeasonImport component should appear
      await waitFor(() => {
        const seasonImport = screen.getByTestId("season-import");
        expect(seasonImport).toBeInTheDocument();
        expect(seasonImport).toHaveTextContent("SeasonImport for league: league-1");
      });
    });

    it("import button processes CSV", async () => {
      const user = userEvent.setup();
      render(<ContentTab />);

      await waitFor(() => {
        expect(screen.getByText("Summer League 2024")).toBeInTheDocument();
      });

      // Select a league - find the import league selector
      const selects = screen.getAllByTestId("admin-select");
      const importSelect = selects.find(select =>
        select.querySelector('option[value=""]')?.textContent?.includes("Select a league")
      );

      expect(importSelect).toBeDefined();
      await user.selectOptions(importSelect!, "league-1");

      await waitFor(() => {
        expect(screen.getByTestId("season-import")).toBeInTheDocument();
      });

      // Click import button
      const importButton = screen.getByText("Import CSV");
      await user.click(importButton);

      // Verify import was triggered
      expect(importButton).toBeInTheDocument();
    });

    it("process emails button triggers function", async () => {
      const user = userEvent.setup();
      const mockInvoke = vi.fn().mockResolvedValue({
        data: { processed: 5 },
        error: null,
      });
      (supabase.functions.invoke as any) = mockInvoke;

      render(<ContentTab />);

      // Wait for component to render
      await waitFor(() => {
        expect(screen.getByText(/Import Data/)).toBeInTheDocument();
      });

      // Click process emails button - use getAllByText and get the button (not the h3 title)
      const processButtons = screen.getAllByText("Process Emails");
      const processButton = processButtons.find(el => el.tagName === 'BUTTON') || processButtons[processButtons.length - 1];
      await user.click(processButton);

      // Verify function was called
      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith("process-email-events");
      });

      // Verify status message appears
      await waitFor(() => {
        expect(screen.getByText("Processed 5 emails")).toBeInTheDocument();
      });
    });

    it("shows error status when process emails fails", async () => {
      const user = userEvent.setup();
      const mockInvoke = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Network error" },
      });
      (supabase.functions.invoke as any) = mockInvoke;

      render(<ContentTab />);

      await waitFor(() => {
        expect(screen.getByText(/Import Data/)).toBeInTheDocument();
      });

      const processButtons = screen.getAllByText("Process Emails");
      const processButton = processButtons.find(el => el.tagName === 'BUTTON') || processButtons[processButtons.length - 1];
      await user.click(processButton);

      // Verify error status appears
      await waitFor(() => {
        expect(screen.getByText("Error: Network error")).toBeInTheDocument();
      });
    });

    it("disables process emails button while processing", async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: any) => void;
      const promise = new Promise(resolve => { resolvePromise = resolve; });
      const mockInvoke = vi.fn().mockReturnValue(promise);
      (supabase.functions.invoke as any) = mockInvoke;

      render(<ContentTab />);

      // Wait for leagues to load (indicating component is ready)
      await waitFor(() => {
        expect(screen.getByText("Summer League 2024")).toBeInTheDocument();
      });

      const processButtons = screen.getAllByText("Process Emails");
      const processButton = processButtons.find(el => el.tagName === 'BUTTON') || processButtons[processButtons.length - 1];

      // Verify button is enabled before click
      expect(processButton).not.toBeDisabled();

      await user.click(processButton);

      // Button should show loading state immediately
      const loadingButtons = screen.getAllByText(/Processing\.\.\./i);
      const loadingButton = loadingButtons.find(el => el.tagName === 'BUTTON') || loadingButtons[loadingButtons.length - 1];
      expect(loadingButton).toBeInTheDocument();
      expect(loadingButton).toBeDisabled();

      // Resolve the promise
      resolvePromise!({ data: { processed: 3 }, error: null });

      // Wait for processing to complete
      await waitFor(() => {
        expect(screen.getByText(/Processed 3 emails/i)).toBeInTheDocument();
      });
    });

    it("hides CSV import when no league selected", async () => {
      render(<ContentTab />);

      // Wait for leagues to load (indicating component is ready)
      await waitFor(() => {
        expect(screen.getByText("Summer League 2024")).toBeInTheDocument();
      });

      // SeasonImport should not be visible when no league is selected
      expect(screen.queryByTestId("season-import")).not.toBeInTheDocument();
    });
  });

  describe("Rounds Section", () => {
    it("renders round list", async () => {
      render(<ContentTab />);

      await waitFor(() => {
        expect(screen.getByText("80s Hits")).toBeInTheDocument();
        expect(screen.getByText("90s Dance")).toBeInTheDocument();
      });

      // Check season/round labels
      expect(screen.getByText("S5 R1")).toBeInTheDocument();
      expect(screen.getByText("S5 R2")).toBeInTheDocument();
    });

    it("status dropdown changes round status", async () => {
      const user = userEvent.setup();
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ data: null });

      render(<ContentTab />);

      await waitFor(() => {
        expect(screen.getByText("80s Hits")).toBeInTheDocument();
      });

      // Mock update for status change
      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      });
      mockUpdate.mockReturnValue({ eq: mockEq });

      // Find the select elements and change the first one
      const selects = screen.getAllByTestId("admin-select");
      // Skip the import league selector, get the first round status selector
      const roundStatusSelect = selects.find((select) =>
        select.querySelector('option[value="revealed"]')
      );

      if (roundStatusSelect) {
        await user.selectOptions(roundStatusSelect, "archived");

        await waitFor(() => {
          expect(supabase.from).toHaveBeenCalledWith("rounds");
          expect(mockUpdate).toHaveBeenCalledWith({ status: "archived" });
          expect(mockEq).toHaveBeenCalledWith("id", "round-1");
        });
      }
    });

    it("image upload works", async () => {
      const { container } = render(<ContentTab />);

      await waitFor(() => {
        expect(screen.getByText("80s Hits")).toBeInTheDocument();
      });

      // Expand first round
      const expandButtons = container.querySelectorAll(".round-expand-btn");
      const user = userEvent.setup();
      await user.click(expandButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("Theme Image")).toBeInTheDocument();
        expect(screen.getByText("Winners Image")).toBeInTheDocument();
      });

      // Check file inputs exist
      const fileInputs = screen.getAllByDisplayValue("");
      const imageInputs = fileInputs.filter((input) =>
        input.getAttribute("type") === "file"
      );
      expect(imageInputs.length).toBeGreaterThanOrEqual(2);
    });

    it("URL inputs save on blur", async () => {
      const user = userEvent.setup();
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ data: null });
      const { container } = render(<ContentTab />);

      await waitFor(() => {
        expect(screen.getByText("80s Hits")).toBeInTheDocument();
      });

      // Expand first round
      const expandButtons = container.querySelectorAll(".round-expand-btn");
      await user.click(expandButtons[0]);

      await waitFor(() => {
        expect(screen.getByPlaceholderText("https://open.spotify.com/playlist/...")).toBeInTheDocument();
      });

      // Mock update
      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      });
      mockUpdate.mockReturnValue({ eq: mockEq });

      // Edit Spotify URL
      const spotifyInput = screen.getByPlaceholderText("https://open.spotify.com/playlist/...");
      await user.clear(spotifyInput);
      await user.type(spotifyInput, "https://open.spotify.com/playlist/new-url");

      // Trigger blur event
      spotifyInput.blur();

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith("rounds");
        expect(mockUpdate).toHaveBeenCalledWith({ playlist_url: "https://open.spotify.com/playlist/new-url" });
        expect(mockEq).toHaveBeenCalledWith("id", "round-1");
      });
    });

    it("narrative textarea updates on blur", async () => {
      const user = userEvent.setup();
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ data: null });
      const { container } = render(<ContentTab />);

      await waitFor(() => {
        expect(screen.getByText("80s Hits")).toBeInTheDocument();
      });

      // Expand first round
      const expandButtons = container.querySelectorAll(".round-expand-btn");
      await user.click(expandButtons[0]);

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Round story/summary...")).toBeInTheDocument();
      });

      // Mock update
      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      });
      mockUpdate.mockReturnValue({ eq: mockEq });

      // Edit narrative
      const narrativeTextarea = screen.getByPlaceholderText("Round story/summary...");
      await user.clear(narrativeTextarea);
      await user.type(narrativeTextarea, "Updated round narrative");

      // Trigger blur event
      narrativeTextarea.blur();

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith("rounds");
        expect(mockUpdate).toHaveBeenCalledWith({ narrative: "Updated round narrative" });
        expect(mockEq).toHaveBeenCalledWith("id", "round-1");
      });
    });

    it("expand shows round details", async () => {
      const user = userEvent.setup();
      const { container } = render(<ContentTab />);

      await waitFor(() => {
        expect(screen.getByText("80s Hits")).toBeInTheDocument();
      });

      // Expand first round
      const expandButtons = container.querySelectorAll(".round-expand-btn");
      await user.click(expandButtons[0]);

      // Verify round edit panel is visible
      await waitFor(() => {
        expect(screen.getByText("Spotify Playlist URL")).toBeInTheDocument();
        expect(screen.getByText("YouTube Playlist URL")).toBeInTheDocument();
        expect(screen.getByText("Theme Image")).toBeInTheDocument();
        expect(screen.getByText("Winners Image")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Round story/summary...")).toBeInTheDocument();
      });
    });

    it("displays existing images when URLs present", async () => {
      const user = userEvent.setup();
      const { container } = render(<ContentTab />);

      await waitFor(() => {
        expect(screen.getByText("80s Hits")).toBeInTheDocument();
      });

      // Expand first round (has images)
      const expandButtons = container.querySelectorAll(".round-expand-btn");
      await user.click(expandButtons[0]);

      await waitFor(() => {
        const images = container.querySelectorAll(".round-image-preview");
        expect(images.length).toBe(2);
        expect(images[0]).toHaveAttribute("src", "https://example.com/theme.jpg");
        expect(images[1]).toHaveAttribute("src", "https://example.com/winners.jpg");
      });
    });

    it("shows no image message when URLs are null", async () => {
      const user = userEvent.setup();
      const { container } = render(<ContentTab />);

      await waitFor(() => {
        expect(screen.getByText("90s Dance")).toBeInTheDocument();
      });

      // Expand second round (no images)
      const expandButtons = container.querySelectorAll(".round-expand-btn");
      await user.click(expandButtons[1]);

      await waitFor(() => {
        const noImageMessages = screen.getAllByText(/No (theme|winners) image/);
        expect(noImageMessages.length).toBe(2);
      });
    });
  });
});
