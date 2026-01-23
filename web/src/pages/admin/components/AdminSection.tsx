import { useState } from "react";
import clsx from "clsx";

type AdminSectionProps = {
  title: string;
  icon: string;
  color?: "blue" | "green" | "purple" | "gray";
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export default function AdminSection({
  title,
  icon,
  color,
  defaultOpen = true,
  children,
}: AdminSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={clsx(
        "admin-section",
        color && `admin-section--${color}`,
        !isOpen && "admin-section--closed"
      )}
    >
      <button
        type="button"
        className="admin-section__header"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="admin-section__icon">{icon}</span>
        <span className="admin-section__title">{title}</span>
        <span className="admin-section__chevron">
          {isOpen ? "▼" : "▶"}
        </span>
      </button>
      <div className="admin-section__content">
        {children}
      </div>
    </div>
  );
}
