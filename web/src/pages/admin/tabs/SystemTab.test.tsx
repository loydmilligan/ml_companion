import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SystemTab from "./SystemTab";

// Mock supabase
vi.mock("../../../lib/supabase", () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

// Mock useAdmin hook
const mockUpdateSetting = vi.fn();
vi.mock("../AdminContext", () => ({
  useAdmin: () => ({
    settings: {
      admin_v2_enabled: false,
    },
    updateSetting: mockUpdateSetting,
  }),
}));

// Mock the components
vi.mock("../components", () => ({
  AdminSection: ({
    children,
    title,
    defaultOpen,
  }: {
    children: React.ReactNode;
    title: string;
    defaultOpen?: boolean;
  }) => (
    <div data-testid={`section-${title}`} data-open={defaultOpen}>
      <h3>{title}</h3>
      {children}
    </div>
  ),
  AdminCard: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="admin-card">{children}</div>
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
    <label>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  ),
}));

// Get reference to mocked invoke function
import { supabase } from "../../../lib/supabase";

const mockInvoke = vi.mocked(supabase.functions.invoke);

describe("SystemTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all four sections", () => {
    render(<SystemTab />);

    expect(screen.getByTestId("section-Admin Panel Version")).toBeInTheDocument();
    expect(screen.getByTestId("section-Testing")).toBeInTheDocument();
    expect(screen.getByTestId("section-Diagnostics")).toBeInTheDocument();
    expect(screen.getByTestId("section-Advanced")).toBeInTheDocument();
  });

  it("Testing section is open by default", () => {
    render(<SystemTab />);

    const testingSection = screen.getByTestId("section-Testing");
    expect(testingSection).toHaveAttribute("data-open", "true");
  });

  describe("Testing Section", () => {
    it("renders test dashboard link", () => {
      render(<SystemTab />);

      const link = screen.getByRole("link", { name: /open test dashboard/i });
      expect(link).toHaveAttribute("href", "/app/test-dashboard");
    });

    it("renders seed test data button", () => {
      render(<SystemTab />);

      const button = screen.getByRole("button", { name: /seed test data/i });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    it("renders clear test data button", () => {
      render(<SystemTab />);

      const button = screen.getByRole("button", { name: /clear test data/i });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    describe("Seed Test Data", () => {
      it("calls seed-test-data function on click", async () => {
        mockInvoke.mockResolvedValueOnce({
          data: { success: true, testUsers: [1, 2, 3] },
          error: null,
        });

        render(<SystemTab />);

        const button = screen.getByRole("button", { name: /seed test data/i });
        fireEvent.click(button);

        await waitFor(() => {
          expect(mockInvoke).toHaveBeenCalledWith("seed-test-data", {
            body: { reset: true },
          });
        });
      });

      it("shows loading state while seeding", async () => {
        mockInvoke.mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 100))
        );

        render(<SystemTab />);

        const button = screen.getByRole("button", { name: /seed test data/i });
        fireEvent.click(button);

        expect(screen.getByRole("button", { name: /seeding.../i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /seeding.../i })).toBeDisabled();
      });

      it("displays success message on successful seed", async () => {
        mockInvoke.mockResolvedValueOnce({
          data: { success: true, testUsers: [1, 2, 3] },
          error: null,
        });

        render(<SystemTab />);

        const button = screen.getByRole("button", { name: /seed test data/i });
        fireEvent.click(button);

        await waitFor(() => {
          expect(screen.getByText(/success! created 3 test users/i)).toBeInTheDocument();
        });
      });

      it("displays error message on failed seed", async () => {
        mockInvoke.mockResolvedValueOnce({
          data: null,
          error: { message: "Failed to seed" },
        });

        render(<SystemTab />);

        const button = screen.getByRole("button", { name: /seed test data/i });
        fireEvent.click(button);

        await waitFor(() => {
          expect(screen.getByText(/error: failed to seed/i)).toBeInTheDocument();
        });
      });

      it("handles exception during seed", async () => {
        mockInvoke.mockRejectedValueOnce(new Error("Network error"));

        render(<SystemTab />);

        const button = screen.getByRole("button", { name: /seed test data/i });
        fireEvent.click(button);

        await waitFor(() => {
          expect(screen.getByText(/error: network error/i)).toBeInTheDocument();
        });
      });
    });

    describe("Clear Test Data", () => {
      it("calls clear-test-data function on click", async () => {
        mockInvoke.mockResolvedValueOnce({
          data: { deleted: 10 },
          error: null,
        });

        render(<SystemTab />);

        const button = screen.getByRole("button", { name: /clear test data/i });
        fireEvent.click(button);

        await waitFor(() => {
          expect(mockInvoke).toHaveBeenCalledWith("clear-test-data");
        });
      });

      it("shows loading state while clearing", async () => {
        mockInvoke.mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 100))
        );

        render(<SystemTab />);

        const button = screen.getByRole("button", { name: /clear test data/i });
        fireEvent.click(button);

        expect(screen.getByRole("button", { name: /clearing.../i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /clearing.../i })).toBeDisabled();
      });

      it("displays success message on successful clear", async () => {
        mockInvoke.mockResolvedValueOnce({
          data: { deleted: 10 },
          error: null,
        });

        render(<SystemTab />);

        const button = screen.getByRole("button", { name: /clear test data/i });
        fireEvent.click(button);

        await waitFor(() => {
          expect(screen.getByText(/cleared 10 test records/i)).toBeInTheDocument();
        });
      });

      it("displays error message on failed clear", async () => {
        mockInvoke.mockResolvedValueOnce({
          data: null,
          error: { message: "Failed to clear" },
        });

        render(<SystemTab />);

        const button = screen.getByRole("button", { name: /clear test data/i });
        fireEvent.click(button);

        await waitFor(() => {
          expect(screen.getByText(/error: failed to clear/i)).toBeInTheDocument();
        });
      });
    });
  });

  describe("Diagnostics Section", () => {
    it("renders diagnostics items", () => {
      render(<SystemTab />);

      expect(screen.getByText("Email Processing")).toBeInTheDocument();
      expect(screen.getByText("Database")).toBeInTheDocument();
      expect(screen.getByText("Edge Functions")).toBeInTheDocument();
    });

    it("shows connected status for database and edge functions", () => {
      render(<SystemTab />);

      const diagnosticsSection = screen.getByTestId("section-Diagnostics");

      // Check for status values within the diagnostics section
      expect(diagnosticsSection).toHaveTextContent("Connected");
      expect(diagnosticsSection).toHaveTextContent("Available");
    });

    it("references Content tab for email processing", () => {
      render(<SystemTab />);

      expect(
        screen.getByText(/check content tab for manual email processing/i)
      ).toBeInTheDocument();
    });
  });

  describe("Advanced Section", () => {
    it("renders placeholder text", () => {
      render(<SystemTab />);

      expect(
        screen.getByText(/advanced system settings will be available here in the future/i)
      ).toBeInTheDocument();
    });

    it("lists future features", () => {
      render(<SystemTab />);

      expect(screen.getByText(/data export/i)).toBeInTheDocument();
      expect(screen.getByText(/backup\/restore/i)).toBeInTheDocument();
      expect(screen.getByText(/migration tools/i)).toBeInTheDocument();
    });
  });
});
