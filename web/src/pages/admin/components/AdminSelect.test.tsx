/**
 * AdminSelect Component Tests
 *
 * Run with: npm test AdminSelect.test.tsx
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminSelect from "./AdminSelect";

const mockOptions = [
  { value: "open", label: "Open phase only" },
  { value: "voting", label: "Voting phase only" },
  { value: "both", label: "Both open and voting" },
];

describe("AdminSelect", () => {
  describe("Rendering", () => {
    it("renders label and options", () => {
      render(
        <AdminSelect
          label="Available during"
          value="open"
          onChange={() => {}}
          options={mockOptions}
        />
      );

      expect(screen.getByText("Available during")).toBeInTheDocument();
      expect(screen.getByRole("combobox")).toBeInTheDocument();

      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(3);
      expect(screen.getByRole("option", { name: "Open phase only" })).toBeInTheDocument();
    });

    it("shows selected value", () => {
      render(
        <AdminSelect
          label="Available during"
          value="voting"
          onChange={() => {}}
          options={mockOptions}
        />
      );

      const select = screen.getByRole("combobox") as HTMLSelectElement;
      expect(select.value).toBe("voting");
    });

    it("renders icon when provided", () => {
      render(
        <AdminSelect
          icon="📅"
          label="Available during"
          value="open"
          onChange={() => {}}
          options={mockOptions}
        />
      );

      expect(screen.getByText("📅")).toBeInTheDocument();
    });

    it("renders helper text when provided", () => {
      render(
        <AdminSelect
          label="Available during"
          helper="Choose when the challenge is available"
          value="open"
          onChange={() => {}}
          options={mockOptions}
        />
      );

      expect(screen.getByText("Choose when the challenge is available")).toBeInTheDocument();
    });

    it("does not render icon when not provided", () => {
      const { container } = render(
        <AdminSelect
          label="Available during"
          value="open"
          onChange={() => {}}
          options={mockOptions}
        />
      );

      expect(container.querySelector(".admin-select__icon")).not.toBeInTheDocument();
    });

    it("does not render helper when not provided", () => {
      const { container } = render(
        <AdminSelect
          label="Available during"
          value="open"
          onChange={() => {}}
          options={mockOptions}
        />
      );

      expect(container.querySelector(".admin-select__helper")).not.toBeInTheDocument();
    });
  });

  describe("Interaction", () => {
    it("calls onChange when selection changes", async () => {
      const handleChange = vi.fn();
      render(
        <AdminSelect
          label="Available during"
          value="open"
          onChange={handleChange}
          options={mockOptions}
        />
      );

      const select = screen.getByRole("combobox");
      await userEvent.selectOptions(select, "voting");

      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith("voting");
    });

    it("calls onChange with correct value for multiple changes", async () => {
      const handleChange = vi.fn();
      render(
        <AdminSelect
          label="Available during"
          value="open"
          onChange={handleChange}
          options={mockOptions}
        />
      );

      const select = screen.getByRole("combobox");

      await userEvent.selectOptions(select, "voting");
      expect(handleChange).toHaveBeenLastCalledWith("voting");

      await userEvent.selectOptions(select, "both");
      expect(handleChange).toHaveBeenLastCalledWith("both");

      expect(handleChange).toHaveBeenCalledTimes(2);
    });
  });

  describe("Disabled State", () => {
    it("disables select when disabled prop is true", () => {
      render(
        <AdminSelect
          label="Available during"
          value="open"
          onChange={() => {}}
          options={mockOptions}
          disabled
        />
      );

      const select = screen.getByRole("combobox");
      expect(select).toBeDisabled();
    });

    it("applies disabled class when disabled", () => {
      const { container } = render(
        <AdminSelect
          label="Available during"
          value="open"
          onChange={() => {}}
          options={mockOptions}
          disabled
        />
      );

      expect(container.querySelector(".admin-select--disabled")).toBeInTheDocument();
    });

    it("does not call onChange when disabled", async () => {
      const handleChange = vi.fn();
      render(
        <AdminSelect
          label="Available during"
          value="open"
          onChange={handleChange}
          options={mockOptions}
          disabled
        />
      );

      const select = screen.getByRole("combobox");
      await userEvent.selectOptions(select, "voting");

      expect(handleChange).not.toHaveBeenCalled();
    });

    it("is enabled by default", () => {
      render(
        <AdminSelect
          label="Available during"
          value="open"
          onChange={() => {}}
          options={mockOptions}
        />
      );

      const select = screen.getByRole("combobox");
      expect(select).not.toBeDisabled();
    });
  });

  describe("CSS Classes", () => {
    it("applies correct base classes", () => {
      const { container } = render(
        <AdminSelect
          label="Available during"
          value="open"
          onChange={() => {}}
          options={mockOptions}
        />
      );

      expect(container.querySelector(".admin-select")).toBeInTheDocument();
      expect(container.querySelector(".admin-select__label")).toBeInTheDocument();
      expect(container.querySelector(".admin-select__input")).toBeInTheDocument();
    });

    it("applies field-input class to select element", () => {
      render(
        <AdminSelect
          label="Available during"
          value="open"
          onChange={() => {}}
          options={mockOptions}
        />
      );

      const select = screen.getByRole("combobox");
      expect(select).toHaveClass("field-input");
      expect(select).toHaveClass("admin-select__input");
    });
  });

  describe("Accessibility", () => {
    it("associates label with select", () => {
      render(
        <AdminSelect
          label="Available during"
          value="open"
          onChange={() => {}}
          options={mockOptions}
        />
      );

      const select = screen.getByRole("combobox");
      const label = screen.getByText("Available during");

      // Label and select should be within the same container
      const container = label.closest(".admin-select");
      expect(container).toContainElement(select);
    });

    it("renders native select for accessibility", () => {
      render(
        <AdminSelect
          label="Available during"
          value="open"
          onChange={() => {}}
          options={mockOptions}
        />
      );

      const select = screen.getByRole("combobox");
      expect(select.tagName).toBe("SELECT");
    });

    it("each option has correct value attribute", () => {
      render(
        <AdminSelect
          label="Available during"
          value="open"
          onChange={() => {}}
          options={mockOptions}
        />
      );

      mockOptions.forEach((option) => {
        const optionElement = screen.getByRole("option", { name: option.label }) as HTMLOptionElement;
        expect(optionElement.value).toBe(option.value);
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles empty options array", () => {
      render(
        <AdminSelect
          label="Available during"
          value=""
          onChange={() => {}}
          options={[]}
        />
      );

      const options = screen.queryAllByRole("option");
      expect(options).toHaveLength(0);
    });

    it("handles single option", () => {
      const singleOption = [{ value: "only", label: "Only option" }];

      render(
        <AdminSelect
          label="Available during"
          value="only"
          onChange={() => {}}
          options={singleOption}
        />
      );

      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(1);
    });

    it("handles long option labels", () => {
      const longOptions = [
        {
          value: "long",
          label: "This is a very long option label that might wrap to multiple lines in the UI"
        },
      ];

      render(
        <AdminSelect
          label="Available during"
          value="long"
          onChange={() => {}}
          options={longOptions}
        />
      );

      expect(
        screen.getByRole("option", {
          name: "This is a very long option label that might wrap to multiple lines in the UI"
        })
      ).toBeInTheDocument();
    });

    it("handles special characters in option labels", () => {
      const specialOptions = [
        { value: "special", label: "Option with & < > \"quotes\" 'apostrophes'" },
      ];

      render(
        <AdminSelect
          label="Available during"
          value="special"
          onChange={() => {}}
          options={specialOptions}
        />
      );

      expect(
        screen.getByRole("option", {
          name: "Option with & < > \"quotes\" 'apostrophes'"
        })
      ).toBeInTheDocument();
    });
  });
});
