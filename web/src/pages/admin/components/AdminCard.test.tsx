/**
 * AdminCard Unit Tests
 *
 * Test coverage for rendering, props, and styling
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminCard from "./AdminCard";

describe("AdminCard", () => {
  describe("Rendering", () => {
    it("renders children", () => {
      render(
        <AdminCard>
          <p>Test content</p>
        </AdminCard>
      );
      expect(screen.getByText("Test content")).toBeInTheDocument();
    });

    it("renders title and icon when provided", () => {
      render(
        <AdminCard title="Settings" icon="⚙️">
          <p>Content</p>
        </AdminCard>
      );

      expect(screen.getByText("Settings")).toBeInTheDocument();
      expect(screen.getByText("⚙️")).toBeInTheDocument();
    });

    it("does not render header when title and icon are not provided", () => {
      const { container } = render(
        <AdminCard>
          <p>Content</p>
        </AdminCard>
      );

      const header = container.querySelector(".admin-card__header");
      expect(header).not.toBeInTheDocument();
    });

    it("renders header with only title", () => {
      render(
        <AdminCard title="Settings">
          <p>Content</p>
        </AdminCard>
      );

      expect(screen.getByText("Settings")).toBeInTheDocument();
      const header = screen.getByText("Settings").parentElement;
      expect(header).toHaveClass("admin-card__header");
    });

    it("renders header with only icon", () => {
      render(
        <AdminCard icon="⚙️">
          <p>Content</p>
        </AdminCard>
      );

      expect(screen.getByText("⚙️")).toBeInTheDocument();
      const header = screen.getByText("⚙️").parentElement;
      expect(header).toHaveClass("admin-card__header");
    });
  });

  describe("Color Props", () => {
    it("applies color class for left border - blue", () => {
      const { container } = render(
        <AdminCard color="blue">
          <p>Content</p>
        </AdminCard>
      );

      const card = container.querySelector(".card");
      expect(card).toHaveClass("admin-card--blue");
    });

    it("applies color class for left border - green", () => {
      const { container } = render(
        <AdminCard color="green">
          <p>Content</p>
        </AdminCard>
      );

      const card = container.querySelector(".card");
      expect(card).toHaveClass("admin-card--green");
    });

    it("applies color class for left border - purple", () => {
      const { container } = render(
        <AdminCard color="purple">
          <p>Content</p>
        </AdminCard>
      );

      const card = container.querySelector(".card");
      expect(card).toHaveClass("admin-card--purple");
    });

    it("applies color class for left border - gray", () => {
      const { container } = render(
        <AdminCard color="gray">
          <p>Content</p>
        </AdminCard>
      );

      const card = container.querySelector(".card");
      expect(card).toHaveClass("admin-card--gray");
    });

    it("does not apply color class when color is not provided", () => {
      const { container } = render(
        <AdminCard>
          <p>Content</p>
        </AdminCard>
      );

      const card = container.querySelector(".card");
      expect(card).toHaveClass("admin-card");
      expect(card).not.toHaveClass("admin-card--blue");
      expect(card).not.toHaveClass("admin-card--green");
      expect(card).not.toHaveClass("admin-card--purple");
      expect(card).not.toHaveClass("admin-card--gray");
    });
  });

  describe("Custom className", () => {
    it("applies custom className", () => {
      const { container } = render(
        <AdminCard className="custom-class">
          <p>Content</p>
        </AdminCard>
      );

      const card = container.querySelector(".card");
      expect(card).toHaveClass("custom-class");
    });

    it("combines custom className with color class", () => {
      const { container } = render(
        <AdminCard color="blue" className="custom-class">
          <p>Content</p>
        </AdminCard>
      );

      const card = container.querySelector(".card");
      expect(card).toHaveClass("admin-card");
      expect(card).toHaveClass("admin-card--blue");
      expect(card).toHaveClass("custom-class");
    });
  });

  describe("Component Structure", () => {
    it("renders with base admin-card class", () => {
      const { container } = render(
        <AdminCard>
          <p>Content</p>
        </AdminCard>
      );

      const card = container.querySelector(".card");
      expect(card).toHaveClass("admin-card");
    });

    it("wraps content in Card component", () => {
      const { container } = render(
        <AdminCard>
          <p>Content</p>
        </AdminCard>
      );

      const card = container.querySelector(".card");
      expect(card).toBeInTheDocument();
    });

    it("renders title in h3 with correct class", () => {
      render(
        <AdminCard title="Settings">
          <p>Content</p>
        </AdminCard>
      );

      const title = screen.getByText("Settings");
      expect(title.tagName).toBe("H3");
      expect(title).toHaveClass("admin-card__title");
    });

    it("renders icon in span with correct class", () => {
      const { container } = render(
        <AdminCard icon="⚙️">
          <p>Content</p>
        </AdminCard>
      );

      const icon = screen.getByText("⚙️");
      expect(icon.tagName).toBe("SPAN");
      expect(icon).toHaveClass("admin-card__icon");
    });
  });
});
