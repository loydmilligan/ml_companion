import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminTabBar from "./AdminTabBar";

const mockTabs = [
  { id: "people", label: "People", shortLabel: "People", icon: "👥" },
  { id: "content", label: "Content", shortLabel: "Content", icon: "📋" },
  { id: "games", label: "Games & AI", shortLabel: "Games", icon: "🎮" },
  { id: "system", label: "System", shortLabel: "System", icon: "⚙️" },
];

describe("AdminTabBar", () => {
  it("renders all tabs", () => {
    render(
      <AdminTabBar tabs={mockTabs} activeTab="people" onTabChange={vi.fn()} />
    );

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(4);

    // Verify tab text (appears in both label and shortLabel)
    expect(screen.getAllByText("People").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Content").length).toBeGreaterThan(0);
    expect(screen.getByText("Games & AI")).toBeInTheDocument();
    expect(screen.getAllByText("System").length).toBeGreaterThan(0);
  });

  it("shows active state on current tab", () => {
    render(
      <AdminTabBar tabs={mockTabs} activeTab="games" onTabChange={vi.fn()} />
    );

    const allTabs = screen.getAllByRole("tab");
    const gamesTab = allTabs.find(
      (tab) => tab.getAttribute("aria-selected") === "true"
    );

    expect(gamesTab).toBeInTheDocument();
    expect(gamesTab).toHaveClass("admin-tab--active");
    expect(gamesTab).toHaveAttribute("aria-selected", "true");
  });

  it("calls onTabChange when clicked", async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();

    render(
      <AdminTabBar tabs={mockTabs} activeTab="people" onTabChange={mockOnChange} />
    );

    const tabs = screen.getAllByRole("tab");
    const contentTab = tabs[1]; // Second tab is "content"

    await user.click(contentTab);

    expect(mockOnChange).toHaveBeenCalledWith("content");
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  it("renders icons for all tabs", () => {
    render(
      <AdminTabBar tabs={mockTabs} activeTab="people" onTabChange={vi.fn()} />
    );

    expect(screen.getByText("👥")).toBeInTheDocument();
    expect(screen.getByText("📋")).toBeInTheDocument();
    expect(screen.getByText("🎮")).toBeInTheDocument();
    expect(screen.getByText("⚙️")).toBeInTheDocument();
  });

  it("marks only the active tab with aria-selected=true", () => {
    render(
      <AdminTabBar tabs={mockTabs} activeTab="content" onTabChange={vi.fn()} />
    );

    const tabs = screen.getAllByRole("tab");

    expect(tabs[0]).toHaveAttribute("aria-selected", "false"); // people
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");  // content (active)
    expect(tabs[2]).toHaveAttribute("aria-selected", "false"); // games
    expect(tabs[3]).toHaveAttribute("aria-selected", "false"); // system
  });

  it("renders with tablist role for accessibility", () => {
    render(
      <AdminTabBar tabs={mockTabs} activeTab="people" onTabChange={vi.fn()} />
    );

    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });
});
