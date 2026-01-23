/**
 * AdminFieldGroup Unit Tests
 *
 * Test coverage for rendering, title, and grouping styles
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminFieldGroup from "./AdminFieldGroup";

describe("AdminFieldGroup", () => {
  describe("Rendering", () => {
    it("renders children", () => {
      render(
        <AdminFieldGroup>
          <div>Test content</div>
        </AdminFieldGroup>
      );
      expect(screen.getByText("Test content")).toBeInTheDocument();
    });

    it("renders title when provided", () => {
      render(
        <AdminFieldGroup title="Check Song Settings">
          <div>Content</div>
        </AdminFieldGroup>
      );

      expect(screen.getByText("Check Song Settings")).toBeInTheDocument();
    });

    it("does not render title element when title is not provided", () => {
      const { container } = render(
        <AdminFieldGroup>
          <div>Content</div>
        </AdminFieldGroup>
      );

      const title = container.querySelector(".admin-field-group__title");
      expect(title).not.toBeInTheDocument();
    });

    it("renders multiple children", () => {
      render(
        <AdminFieldGroup>
          <div>First child</div>
          <div>Second child</div>
        </AdminFieldGroup>
      );

      expect(screen.getByText("First child")).toBeInTheDocument();
      expect(screen.getByText("Second child")).toBeInTheDocument();
    });
  });

  describe("Component Structure", () => {
    it("applies base admin-field-group class", () => {
      const { container } = render(
        <AdminFieldGroup>
          <div>Content</div>
        </AdminFieldGroup>
      );

      const group = container.querySelector(".admin-field-group");
      expect(group).toBeInTheDocument();
    });

    it("wraps children in content container", () => {
      const { container } = render(
        <AdminFieldGroup>
          <div>Content</div>
        </AdminFieldGroup>
      );

      const content = container.querySelector(".admin-field-group__content");
      expect(content).toBeInTheDocument();
      expect(content?.textContent).toBe("Content");
    });

    it("renders title with correct class", () => {
      const { container } = render(
        <AdminFieldGroup title="Test Title">
          <div>Content</div>
        </AdminFieldGroup>
      );

      const title = container.querySelector(".admin-field-group__title");
      expect(title).toBeInTheDocument();
      expect(title?.textContent).toBe("Test Title");
    });

    it("maintains correct DOM structure with title", () => {
      const { container } = render(
        <AdminFieldGroup title="Test Title">
          <div>Content</div>
        </AdminFieldGroup>
      );

      const group = container.querySelector(".admin-field-group");
      const title = group?.querySelector(".admin-field-group__title");
      const content = group?.querySelector(".admin-field-group__content");

      expect(group).toBeInTheDocument();
      expect(title).toBeInTheDocument();
      expect(content).toBeInTheDocument();

      // Title should come before content
      const children = Array.from(group?.children || []);
      expect(children[0]).toBe(title);
      expect(children[1]).toBe(content);
    });

    it("maintains correct DOM structure without title", () => {
      const { container } = render(
        <AdminFieldGroup>
          <div>Content</div>
        </AdminFieldGroup>
      );

      const group = container.querySelector(".admin-field-group");
      const title = group?.querySelector(".admin-field-group__title");
      const content = group?.querySelector(".admin-field-group__content");

      expect(group).toBeInTheDocument();
      expect(title).not.toBeInTheDocument();
      expect(content).toBeInTheDocument();

      // Only content should be present
      const children = Array.from(group?.children || []);
      expect(children.length).toBe(1);
      expect(children[0]).toBe(content);
    });
  });

  describe("Styling", () => {
    it("applies grouping styles via CSS classes", () => {
      const { container } = render(
        <AdminFieldGroup>
          <div>Content</div>
        </AdminFieldGroup>
      );

      const group = container.querySelector(".admin-field-group");
      const content = container.querySelector(".admin-field-group__content");

      // Verify CSS classes are applied (actual styling tested via CSS)
      expect(group).toHaveClass("admin-field-group");
      expect(content).toHaveClass("admin-field-group__content");
    });

    it("applies title styles via CSS class", () => {
      const { container } = render(
        <AdminFieldGroup title="Test">
          <div>Content</div>
        </AdminFieldGroup>
      );

      const title = container.querySelector(".admin-field-group__title");
      expect(title).toHaveClass("admin-field-group__title");
    });
  });
});
