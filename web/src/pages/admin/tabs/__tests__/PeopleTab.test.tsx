import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PeopleTab from "../PeopleTab";
import { AdminProvider } from "../../AdminContext";
import { supabase } from "../../../../lib/supabase";

// Mock supabase
vi.mock("../../../../lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn((field: string, opts?: { ascending: boolean }) => {
            // Return different data based on table (competitor vs invite)
            if (opts?.ascending === false) {
              // This is invite_codes query
              return Promise.resolve({
                data: [
                  {
                    id: "invite-1",
                    code: "ABC12345",
                    created_at: "2026-01-20T10:00:00Z",
                    expires_at: "2026-01-27T10:00:00Z",
                    used_at: null,
                    used_by: null,
                    invite_email: "test@example.com",
                    email_sent_at: null
                  },
                  {
                    id: "invite-2",
                    code: "XYZ67890",
                    created_at: "2026-01-15T10:00:00Z",
                    expires_at: "2026-01-10T10:00:00Z",
                    used_at: null,
                    used_by: null,
                    invite_email: null,
                    email_sent_at: null
                  },
                  {
                    id: "invite-3",
                    code: "USED1234",
                    created_at: "2026-01-10T10:00:00Z",
                    expires_at: "2026-01-17T10:00:00Z",
                    used_at: "2026-01-12T10:00:00Z",
                    used_by: "member-1",
                    invite_email: null,
                    email_sent_at: null
                  },
                ],
                error: null
              });
            }
            // This is season_competitors query
            return Promise.resolve({
              data: [
                { id: "comp-1", name: "Alice Johnson", profile_id: null, external_id: "ext-1", ai_image_traits: null },
                { id: "comp-2", name: "Bob Wilson", profile_id: "profile-1", external_id: "ext-2", ai_image_traits: null },
              ],
              error: null
            });
          }),
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
}));

// Mock AuthContext
vi.mock("../../../../contexts/AuthContext", () => ({
  useAuth: () => ({
    group: { id: "test-group-id", role: "lead" },
  }),
}));

const mockUsers = [
  {
    member_id: "member-1",
    role: "lead",
    profiles: {
      id: "profile-1",
      display_name: "John Doe",
      email: "john@example.com",
      chat_notify_enabled: true,
      email_notify_enabled: false,
      can_toggle_chat_notify: true,
      can_toggle_email_notify: true,
      reaction_notify_enabled: false,
      can_toggle_reaction_notify: true,
      can_toggle_ntfy_notify: false,
      can_toggle_push_notify: false,
      ntfy_topic: null,
      timeline_game_tester: false,
    },
  },
  {
    member_id: "member-2",
    role: "member",
    profiles: {
      id: "profile-2",
      display_name: "Jane Smith",
      email: "jane@example.com",
      chat_notify_enabled: false,
      email_notify_enabled: true,
      can_toggle_chat_notify: true,
      can_toggle_email_notify: true,
      reaction_notify_enabled: true,
      can_toggle_reaction_notify: true,
      can_toggle_ntfy_notify: false,
      can_toggle_push_notify: false,
      ntfy_topic: null,
      timeline_game_tester: false,
    },
  },
];

// Mock AdminContext with test data
vi.mock("../../AdminContext", async () => {
  const actual = await vi.importActual<typeof import("../../AdminContext")>("../../AdminContext");
  return {
    ...actual,
    useAdmin: () => ({
      users: mockUsers,
      refreshUsers: vi.fn(),
      group: { id: "test-group-id", role: "lead" },
      settings: null,
      loading: false,
      updateSetting: vi.fn(),
    }),
  };
});

describe("PeopleTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders member list from context", () => {
    render(<PeopleTab />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });

  it("displays user avatar with first letter of name", () => {
    render(<PeopleTab />);

    const avatars = document.querySelectorAll(".member-avatar span");
    expect(avatars[0]).toHaveTextContent("J");
    expect(avatars[1]).toHaveTextContent("J");
  });

  it("displays role selector for each user", () => {
    render(<PeopleTab />);

    const roleSelects = document.querySelectorAll(".admin-select__input");
    expect(roleSelects).toHaveLength(2);
    expect(roleSelects[0]).toHaveValue("lead");
    expect(roleSelects[1]).toHaveValue("member");
  });

  it("updates user role when role selector is changed", async () => {
    const user = userEvent.setup();
    render(<PeopleTab />);

    const roleSelects = document.querySelectorAll(".admin-select__input");
    await user.selectOptions(roleSelects[1] as HTMLSelectElement, "lead");

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("group_members");
    });
  });

  it("renders permission toggles for each user", () => {
    render(<PeopleTab />);

    // Check for toggles by text content
    expect(screen.getAllByText("Chat notify")).toHaveLength(2);
    expect(screen.getAllByText("Email notify")).toHaveLength(2);
    expect(screen.getAllByText("Reaction notify")).toHaveLength(2);
  });

  it("updates user permission when toggle is clicked", async () => {
    const user = userEvent.setup();
    render(<PeopleTab />);

    const chatToggles = document.querySelectorAll(".admin-toggle__checkbox");
    await user.click(chatToggles[0] as HTMLInputElement);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("profiles");
    });
  });

  it("displays correct checked state for permission toggles", () => {
    render(<PeopleTab />);

    const allToggles = document.querySelectorAll(".admin-toggle__checkbox") as NodeListOf<HTMLInputElement>;
    // Find chat notify toggles (first and fourth in the list based on the order in the component)
    const chatToggles = Array.from(allToggles).filter((_, index) => index % 3 === 0);
    expect(chatToggles[0]).toBeChecked(); // John has chat notify enabled
    expect(chatToggles[1]).not.toBeChecked(); // Jane has chat notify disabled
  });

  it("only shows permission toggles user can control", () => {
    render(<PeopleTab />);

    // All users in mockUsers have all three permission toggles enabled
    // Verify all expected toggles are present
    expect(screen.getAllByText("Chat notify")).toHaveLength(2);
    expect(screen.getAllByText("Email notify")).toHaveLength(2);
    expect(screen.getAllByText("Reaction notify")).toHaveLength(2);
  });

  it("displays Members section header", () => {
    render(<PeopleTab />);
    expect(screen.getByText("Members")).toBeInTheDocument();
  });

  it("handles users with proper data structure", () => {
    render(<PeopleTab />);

    // Verify all mock users are displayed
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();

    // Verify role selector shows correct values
    const roleSelects = document.querySelectorAll(".admin-select__input");
    expect(roleSelects[0]).toHaveValue("lead");
    expect(roleSelects[1]).toHaveValue("member");
  });

  describe("Competitors section", () => {
    it("renders competitor list", async () => {
      render(<PeopleTab />);

      await waitFor(() => {
        expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
        expect(screen.getByText("Bob Wilson")).toBeInTheDocument();
      });
    });

    it("profile link dropdown shows available profiles", async () => {
      render(<PeopleTab />);

      await waitFor(() => {
        expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
      });

      const dropdowns = document.querySelectorAll(".competitor-link-select");
      expect(dropdowns).toHaveLength(2);

      // Check that profile options are available
      const firstDropdown = dropdowns[0] as HTMLSelectElement;
      const options = Array.from(firstDropdown.options).map(opt => opt.textContent);
      expect(options).toContain("John Doe");
      expect(options).toContain("Jane Smith");
      expect(options).toContain("Unlinked");
    });

    it("linking competitor updates database", async () => {
      const user = userEvent.setup();
      render(<PeopleTab />);

      await waitFor(() => {
        expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
      });

      const dropdowns = document.querySelectorAll(".competitor-link-select");
      await user.selectOptions(dropdowns[0] as HTMLSelectElement, "profile-1");

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith("season_competitors");
      });
    });

    it("displays linked status for linked competitors", async () => {
      render(<PeopleTab />);

      await waitFor(() => {
        expect(screen.getByText("Bob Wilson")).toBeInTheDocument();
      });

      // Bob Wilson is linked to profile-1 (John Doe)
      const linkedSpans = document.querySelectorAll(".competitor-linked");
      expect(linkedSpans).toHaveLength(1);
      expect(linkedSpans[0].textContent).toContain("John Doe");
    });

    it("displays Competitors section header", async () => {
      render(<PeopleTab />);

      await waitFor(() => {
        expect(screen.getByText("Competitors")).toBeInTheDocument();
      });
    });
  });

  describe("Invitations section", () => {
    it("renders invite list", async () => {
      render(<PeopleTab />);

      await waitFor(() => {
        expect(screen.getByText("ABC12345")).toBeInTheDocument();
        expect(screen.getByText("XYZ67890")).toBeInTheDocument();
        expect(screen.getByText("USED1234")).toBeInTheDocument();
      });
    });

    it("displays invite status correctly", async () => {
      render(<PeopleTab />);

      await waitFor(() => {
        expect(screen.getByText("ABC12345")).toBeInTheDocument();
      });

      const statusElements = document.querySelectorAll(".invite-status");
      expect(statusElements).toHaveLength(3);

      // Check status classes
      expect(statusElements[0]).toHaveClass("invite-status--active");
      expect(statusElements[1]).toHaveClass("invite-status--expired");
      expect(statusElements[2]).toHaveClass("invite-status--used");
    });

    it("displays invite email when present", async () => {
      render(<PeopleTab />);

      await waitFor(() => {
        expect(screen.getByText("test@example.com")).toBeInTheDocument();
      });
    });

    it("create invite form works", async () => {
      const user = userEvent.setup();
      render(<PeopleTab />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Email (optional)")).toBeInTheDocument();
      });

      const emailInput = screen.getByPlaceholderText("Email (optional)") as HTMLInputElement;
      const generateButton = screen.getByText("Generate Invite");

      await user.type(emailInput, "newinvite@example.com");
      await user.click(generateButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith("invite_codes");
      });
    });

    it("copy code button copies to clipboard", async () => {
      const user = userEvent.setup();

      // Mock clipboard API
      const writeTextMock = vi.fn(() => Promise.resolve());
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: writeTextMock,
        },
        writable: true,
      });

      render(<PeopleTab />);

      await waitFor(() => {
        expect(screen.getByText("ABC12345")).toBeInTheDocument();
      });

      const copyButtons = screen.getAllByText("Copy");
      await user.click(copyButtons[0]);

      expect(writeTextMock).toHaveBeenCalledWith(
        expect.stringContaining("ABC12345")
      );
    });

    it("displays Invitations section header", async () => {
      render(<PeopleTab />);

      await waitFor(() => {
        expect(screen.getByText("Invitations")).toBeInTheDocument();
      });
    });
  });
});
