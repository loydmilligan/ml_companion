import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import GamesTab from "./GamesTab";
import type { GroupSettings } from "../../../types/group_settings";

// Mock the AdminContext
const mockUpdateSetting = vi.fn();
let mockSettings: Partial<GroupSettings> | null = {
  submitter_guess_enabled: true,
  timeline_game_enabled: false,
  timeline_game_phase: "voting",
  round_challenge_enabled: true,
  round_challenge_phase: "both",
  ai_assistant_enabled: true,
  ai_explain_enabled: true,
  ai_hint_enabled: true,
  ai_validate_enabled: true,
  ai_validate_daily_limit: 5,
  ai_chat_enabled: true,
  round_theme_image_model_key: "OPENROUTER_ROUND_IMAGE_MODEL",
  logo_palette: "ocean-coral",
};

const mockUsers = [
  {
    member_id: "user-1",
    role: "member",
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
      ntfy_topic: null,
      timeline_game_tester: false,
    },
  },
];

vi.mock("../AdminContext", () => ({
  useAdmin: () => ({
    settings: mockSettings,
    updateSetting: mockUpdateSetting,
    group: { id: "test-group-id", role: "lead" },
    users: mockUsers,
  }),
}));

// Mock supabase
vi.mock("../../../lib/supabase", () => {
  const createMockQueryBuilder = () => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockReturnThis(),
  });

  return {
    supabase: {
      from: vi.fn(() => createMockQueryBuilder()),
    },
  };
});

// Mock the components
vi.mock("../components", () => ({
  AdminSection: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid={`section-${title}`}>
      <h3>{title}</h3>
      {children}
    </div>
  ),
  AdminToggle: ({
    label,
    checked,
    onChange,
  }: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
  }) => (
    <div data-testid={`toggle-${label}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
      />
      <span>{label}</span>
    </div>
  ),
  AdminSelect: ({
    label,
    value,
    onChange,
    options,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
  }) => (
    <div data-testid={`select-${label}`}>
      <label>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  ),
  AdminFieldGroup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="field-group">{children}</div>
  ),
}));

describe("GamesTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mockSettings to default
    mockSettings = {
      submitter_guess_enabled: true,
      timeline_game_enabled: false,
      timeline_game_phase: "voting",
      round_challenge_enabled: true,
      round_challenge_phase: "both",
      ai_assistant_enabled: true,
      ai_explain_enabled: true,
      ai_hint_enabled: true,
      ai_validate_enabled: true,
      ai_validate_daily_limit: 5,
      ai_chat_enabled: true,
      round_theme_image_model_key: "OPENROUTER_ROUND_IMAGE_MODEL",
      logo_palette: "ocean-coral",
    };
  });

  it("renders three minigame sections", () => {
    render(<GamesTab />);

    expect(screen.getByTestId("section-Guess the Submitter")).toBeInTheDocument();
    expect(screen.getByTestId("section-Timeline Game")).toBeInTheDocument();
    expect(screen.getByTestId("section-Round Challenge")).toBeInTheDocument();
  });

  describe("Guess the Submitter", () => {
    it("renders enable toggle with correct state", () => {
      render(<GamesTab />);

      const section = screen.getByTestId("section-Guess the Submitter");
      const toggle = section.querySelector('[data-testid="toggle-Enable Game"]');
      const checkbox = toggle?.querySelector('input[type="checkbox"]') as HTMLInputElement;

      expect(checkbox).toBeChecked();
    });

    it("calls updateSetting when toggle changes", () => {
      render(<GamesTab />);

      const section = screen.getByTestId("section-Guess the Submitter");
      const toggle = section.querySelector('[data-testid="toggle-Enable Game"]');
      const checkbox = toggle?.querySelector('input[type="checkbox"]') as HTMLInputElement;

      fireEvent.click(checkbox);

      expect(mockUpdateSetting).toHaveBeenCalledWith("submitter_guess_enabled", false);
    });

    it("displays info text about voting phase", () => {
      render(<GamesTab />);

      expect(screen.getByText(/Available during voting phase/i)).toBeInTheDocument();
    });
  });

  describe("Timeline Game", () => {
    it("renders enable toggle", () => {
      render(<GamesTab />);

      const section = screen.getByTestId("section-Timeline Game");
      const toggle = section.querySelector('[data-testid="toggle-Enable Game"]');

      expect(toggle).toBeInTheDocument();
    });

    it("does not show phase select when disabled", () => {
      mockSettings.timeline_game_enabled = false;

      render(<GamesTab />);

      const section = screen.getByTestId("section-Timeline Game");
      const select = section.querySelector('[data-testid="select-Available during"]');

      expect(select).not.toBeInTheDocument();
    });

    it("shows phase select when enabled", () => {
      mockSettings.timeline_game_enabled = true;

      render(<GamesTab />);

      const section = screen.getByTestId("section-Timeline Game");
      const select = section.querySelector('[data-testid="select-Available during"]');
      const selectElement = select?.querySelector("select") as HTMLSelectElement;

      expect(selectElement).toBeInTheDocument();
      expect(selectElement.value).toBe("voting");
    });

    it("updates phase setting when select changes", () => {
      mockSettings.timeline_game_enabled = true;

      render(<GamesTab />);

      const section = screen.getByTestId("section-Timeline Game");
      const select = section.querySelector('[data-testid="select-Available during"]');
      const selectElement = select?.querySelector("select") as HTMLSelectElement;

      fireEvent.change(selectElement, { target: { value: "both" } });

      expect(mockUpdateSetting).toHaveBeenCalledWith("timeline_game_phase", "both");
    });

    it("displays info text about release year data", () => {
      render(<GamesTab />);

      expect(screen.getByText(/Requires release year data/i)).toBeInTheDocument();
    });

    it("has correct phase options (voting, revealed, both)", () => {
      mockSettings.timeline_game_enabled = true;

      render(<GamesTab />);

      const section = screen.getByTestId("section-Timeline Game");
      const select = section.querySelector('[data-testid="select-Available during"]');
      const options = select?.querySelectorAll("option");

      expect(options).toHaveLength(3);
      expect(options?.[0]).toHaveTextContent("Voting phase only");
      expect(options?.[1]).toHaveTextContent("Revealed phase only");
      expect(options?.[2]).toHaveTextContent("Both phases");
    });
  });

  describe("Round Challenge", () => {
    it("renders enable toggle with correct state", () => {
      render(<GamesTab />);

      const section = screen.getByTestId("section-Round Challenge");
      const toggle = section.querySelector('[data-testid="toggle-Enable Game"]');
      const checkbox = toggle?.querySelector('input[type="checkbox"]') as HTMLInputElement;

      expect(checkbox).toBeChecked();
    });

    it("calls updateSetting when toggle changes", () => {
      render(<GamesTab />);

      const section = screen.getByTestId("section-Round Challenge");
      const toggle = section.querySelector('[data-testid="toggle-Enable Game"]');
      const checkbox = toggle?.querySelector('input[type="checkbox"]') as HTMLInputElement;

      fireEvent.click(checkbox);

      expect(mockUpdateSetting).toHaveBeenCalledWith("round_challenge_enabled", false);
    });

    it("shows phase select when enabled", () => {
      mockSettings.round_challenge_enabled = true;

      render(<GamesTab />);

      const section = screen.getByTestId("section-Round Challenge");
      const select = section.querySelector('[data-testid="select-Available during"]');

      expect(select).toBeInTheDocument();
    });

    it("does not show phase select when disabled", () => {
      mockSettings.round_challenge_enabled = false;

      render(<GamesTab />);

      const section = screen.getByTestId("section-Round Challenge");
      const select = section.querySelector('[data-testid="select-Available during"]');

      expect(select).not.toBeInTheDocument();
    });

    it("updates phase setting when select changes", () => {
      mockSettings.round_challenge_enabled = true;

      render(<GamesTab />);

      const section = screen.getByTestId("section-Round Challenge");
      const select = section.querySelector('[data-testid="select-Available during"]');
      const selectElement = select?.querySelector("select") as HTMLSelectElement;

      fireEvent.change(selectElement, { target: { value: "open" } });

      expect(mockUpdateSetting).toHaveBeenCalledWith("round_challenge_phase", "open");
    });

    it("has correct phase options (open, voting, both)", () => {
      mockSettings.round_challenge_enabled = true;

      render(<GamesTab />);

      const section = screen.getByTestId("section-Round Challenge");
      const select = section.querySelector('[data-testid="select-Available during"]');
      const options = select?.querySelectorAll("option");

      expect(options).toHaveLength(3);
      expect(options?.[0]).toHaveTextContent("Open phase only");
      expect(options?.[1]).toHaveTextContent("Voting phase only");
      expect(options?.[2]).toHaveTextContent("Both phases");
    });
  });

  it("shows loading state when settings are null", () => {
    // Set mockSettings to null
    mockSettings = null;

    render(<GamesTab />);

    expect(screen.getByText("Loading settings...")).toBeInTheDocument();
  });

  describe("AI Assistant", () => {
    it("renders AI Assistant section", () => {
      render(<GamesTab />);

      expect(screen.getByTestId("section-AI Assistant")).toBeInTheDocument();
    });

    it("renders master toggle with correct state", () => {
      render(<GamesTab />);

      const section = screen.getByTestId("section-AI Assistant");
      const toggle = section.querySelector('[data-testid="toggle-AI Assistant (master)"]');
      const checkbox = toggle?.querySelector('input[type="checkbox"]') as HTMLInputElement;

      expect(checkbox).toBeChecked();
    });

    it("updates ai_assistant_enabled when master toggle changes", () => {
      render(<GamesTab />);

      const section = screen.getByTestId("section-AI Assistant");
      const toggle = section.querySelector('[data-testid="toggle-AI Assistant (master)"]');
      const checkbox = toggle?.querySelector('input[type="checkbox"]') as HTMLInputElement;

      fireEvent.click(checkbox);

      expect(mockUpdateSetting).toHaveBeenCalledWith("ai_assistant_enabled", false);
    });

    it("updates individual AI feature toggles", () => {
      render(<GamesTab />);

      const section = screen.getByTestId("section-AI Assistant");

      // Test Explain Theme toggle
      const explainToggle = section.querySelector('[data-testid="toggle-Explain Theme"]');
      const explainCheckbox = explainToggle?.querySelector('input[type="checkbox"]') as HTMLInputElement;
      fireEvent.click(explainCheckbox);
      expect(mockUpdateSetting).toHaveBeenCalledWith("ai_explain_enabled", false);

      // Test Get Hint toggle
      const hintToggle = section.querySelector('[data-testid="toggle-Get Hint"]');
      const hintCheckbox = hintToggle?.querySelector('input[type="checkbox"]') as HTMLInputElement;
      fireEvent.click(hintCheckbox);
      expect(mockUpdateSetting).toHaveBeenCalledWith("ai_hint_enabled", false);

      // Test Check Song toggle
      const validateToggle = section.querySelector('[data-testid="toggle-Check Song"]');
      const validateCheckbox = validateToggle?.querySelector('input[type="checkbox"]') as HTMLInputElement;
      fireEvent.click(validateCheckbox);
      expect(mockUpdateSetting).toHaveBeenCalledWith("ai_validate_enabled", false);

      // Test Chat AI toggle
      const chatToggle = section.querySelector('[data-testid="toggle-Chat @AI Replies"]');
      const chatCheckbox = chatToggle?.querySelector('input[type="checkbox"]') as HTMLInputElement;
      fireEvent.click(chatCheckbox);
      expect(mockUpdateSetting).toHaveBeenCalledWith("ai_chat_enabled", false);
    });

    it("updates daily limit when input changes", () => {
      render(<GamesTab />);

      const section = screen.getByTestId("section-AI Assistant");
      const input = section.querySelector('input[type="number"]') as HTMLInputElement;

      fireEvent.change(input, { target: { value: "10" } });

      expect(mockUpdateSetting).toHaveBeenCalledWith("ai_validate_daily_limit", 10);
    });
  });

  describe("AI Image Generation", () => {
    it("renders AI Images section", () => {
      render(<GamesTab />);

      expect(screen.getByTestId("section-AI Image Generation")).toBeInTheDocument();
    });

    it("updates image model when select changes", () => {
      render(<GamesTab />);

      const section = screen.getByTestId("section-AI Image Generation");
      const select = section.querySelector('[data-testid="select-Image Model"]');
      const selectElement = select?.querySelector("select") as HTMLSelectElement;

      fireEvent.change(selectElement, { target: { value: "OPENROUTER_MID_MODEL" } });

      expect(mockUpdateSetting).toHaveBeenCalledWith("round_theme_image_model_key", "OPENROUTER_MID_MODEL");
    });

    it("updates logo palette when select changes", () => {
      render(<GamesTab />);

      const section = screen.getByTestId("section-AI Image Generation");
      const select = section.querySelector('[data-testid="select-Logo Palette"]');
      const selectElement = select?.querySelector("select") as HTMLSelectElement;

      fireEvent.change(selectElement, { target: { value: "teal-mango" } });

      expect(mockUpdateSetting).toHaveBeenCalledWith("logo_palette", "teal-mango");
    });

    it("has correct model options", () => {
      render(<GamesTab />);

      const section = screen.getByTestId("section-AI Image Generation");
      const select = section.querySelector('[data-testid="select-Image Model"]');
      const options = select?.querySelectorAll("option");

      expect(options).toHaveLength(3);
      expect(options?.[0]).toHaveTextContent("Default Image Model");
      expect(options?.[1]).toHaveTextContent("Mid-tier Model");
      expect(options?.[2]).toHaveTextContent("Trophy Model");
    });

    it("has correct palette options", () => {
      render(<GamesTab />);

      const section = screen.getByTestId("section-AI Image Generation");
      const select = section.querySelector('[data-testid="select-Logo Palette"]');
      const options = select?.querySelectorAll("option");

      expect(options).toHaveLength(3);
      expect(options?.[0]).toHaveTextContent("Ocean + Coral");
      expect(options?.[1]).toHaveTextContent("Teal Night + Mango");
      expect(options?.[2]).toHaveTextContent("Midnight + Neon Mint");
    });
  });

  describe("Bonus Points", () => {
    it("renders Bonus Points section", () => {
      render(<GamesTab />);

      expect(screen.getByTestId("section-Bonus Points")).toBeInTheDocument();
    });
  });

  describe("Release Years", () => {
    it("shows release year management when timeline game is enabled", () => {
      mockSettings.timeline_game_enabled = true;

      render(<GamesTab />);

      expect(screen.getByTestId("section-Release Year Data")).toBeInTheDocument();
    });

    it("does not show release year management when timeline game is disabled", () => {
      mockSettings.timeline_game_enabled = false;

      render(<GamesTab />);

      expect(screen.queryByTestId("section-Release Year Data")).not.toBeInTheDocument();
    });
  });
});
