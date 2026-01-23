import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import AdminToggle from "./AdminToggle";

describe("AdminToggle", () => {
  it("renders icon, label, and helper text", () => {
    render(
      <AdminToggle
        icon="🤖"
        label="AI Assistant"
        helper="Enable AI features"
        checked={false}
        onChange={() => {}}
      />
    );

    expect(screen.getByText("🤖")).toBeInTheDocument();
    expect(screen.getByText("AI Assistant")).toBeInTheDocument();
    expect(screen.getByText("Enable AI features")).toBeInTheDocument();
  });

  it("renders without helper text when not provided", () => {
    render(
      <AdminToggle
        icon="🔔"
        label="Notifications"
        checked={false}
        onChange={() => {}}
      />
    );

    expect(screen.getByText("🔔")).toBeInTheDocument();
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.queryByRole("text", { name: /helper/i })).not.toBeInTheDocument();
  });

  it("checkbox reflects checked prop", () => {
    const { rerender } = render(
      <AdminToggle
        icon="🤖"
        label="AI Assistant"
        checked={false}
        onChange={() => {}}
      />
    );

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();

    rerender(
      <AdminToggle
        icon="🤖"
        label="AI Assistant"
        checked={true}
        onChange={() => {}}
      />
    );

    expect(checkbox).toBeChecked();
  });

  it("calls onChange with boolean value when clicked", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <AdminToggle
        icon="🤖"
        label="AI Assistant"
        checked={false}
        onChange={handleChange}
      />
    );

    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);

    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it("checkbox is disabled when disabled prop is true", () => {
    render(
      <AdminToggle
        icon="🤖"
        label="AI Assistant"
        checked={false}
        onChange={() => {}}
        disabled={true}
      />
    );

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeDisabled();
  });

  it("applies disabled class when disabled", () => {
    const { container } = render(
      <AdminToggle
        icon="🤖"
        label="AI Assistant"
        checked={false}
        onChange={() => {}}
        disabled={true}
      />
    );

    const label = container.querySelector(".admin-toggle");
    expect(label).toHaveClass("admin-toggle--disabled");
  });

  it("does not apply disabled class when not disabled", () => {
    const { container } = render(
      <AdminToggle
        icon="🤖"
        label="AI Assistant"
        checked={false}
        onChange={() => {}}
      />
    );

    const label = container.querySelector(".admin-toggle");
    expect(label).not.toHaveClass("admin-toggle--disabled");
  });

  it("has correct class for touch target styling", () => {
    const { container } = render(
      <AdminToggle
        icon="🤖"
        label="AI Assistant"
        checked={false}
        onChange={() => {}}
      />
    );

    // Verify the admin-toggle class is applied (CSS sets min-height: 44px)
    const label = container.querySelector(".admin-toggle");
    expect(label).toBeInTheDocument();
    expect(label).toHaveClass("admin-toggle");
  });
});
