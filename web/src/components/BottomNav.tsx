import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

type NavTabProps = {
  to: string;
  label: "chat" | "history";
};

function NavTab({ to, label }: NavTabProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const location = useLocation();
  const isActive = location.pathname === to ||
    (to === "/app/chat" && location.pathname === "/app");

  useEffect(() => {
    // Check initial mode
    const checkMode = () => {
      setIsDarkMode(document.documentElement.getAttribute("data-mode") === "dark");
    };
    checkMode();

    // Watch for mode changes
    const observer = new MutationObserver(checkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-mode"],
    });

    return () => observer.disconnect();
  }, []);

  const mode = isDarkMode ? "dark" : "light";
  const imageSrc = `/images/nav-tabs/nav-tab-${label}-${mode}.png`;
  const imageSrc2x = `/images/nav-tabs/nav-tab-${label}-${mode}@2x.png`;

  return (
    <NavLink
      className={`bottom-nav-tab ${isActive ? "active" : ""}`}
      to={to}
    >
      <img
        src={imageSrc}
        srcSet={`${imageSrc} 1x, ${imageSrc2x} 2x`}
        alt={label}
        className="bottom-nav-tab-image"
      />
    </NavLink>
  );
}

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavTab to="/app/chat" label="chat" />
      <NavTab to="/app/history" label="history" />
    </nav>
  );
}
