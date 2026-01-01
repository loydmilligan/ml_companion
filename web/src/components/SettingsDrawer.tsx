import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { supabase } from "../lib/supabase";

type SettingsDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  isLead: boolean;
};

export default function SettingsDrawer({ isOpen, onClose, isLead }: SettingsDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const timeout = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSignOut = async () => {
    onClose();
    await supabase.auth.signOut();
    // Force navigation to home page after sign out
    window.location.href = "/";
  };

  return (
    <div
      ref={drawerRef}
      className={clsx("settings-drawer", isOpen && "open")}
      role="region"
      aria-label="Settings menu"
      aria-hidden={!isOpen}
    >
      <div className="settings-drawer-content">
        <div className="settings-drawer-header">
          <svg viewBox="0 0 24 24" fill="currentColor" className="settings-drawer-icon">
            <path d="M12 8.7a3.3 3.3 0 1 0 0 6.6 3.3 3.3 0 0 0 0-6.6Zm9 3.3-.9-.5a7.2 7.2 0 0 0-.7-1.7l.6-1a1 1 0 0 0-.3-1.3l-1.7-1a1 1 0 0 0-1.3.3l-.6 1a7.5 7.5 0 0 0-1.8-.7l-.3-1.1a1 1 0 0 0-1-.7h-2a1 1 0 0 0-1 .7l-.3 1.1a7.5 7.5 0 0 0-1.8.7l-.6-1a1 1 0 0 0-1.3-.3l-1.7 1a1 1 0 0 0-.3 1.3l.6 1a7.2 7.2 0 0 0-.7 1.7L3 12a1 1 0 0 0 0 1.9l.9.5c.2.6.4 1.1.7 1.7l-.6 1a1 1 0 0 0 .3 1.3l1.7 1a1 1 0 0 0 1.3-.3l.6-1c.6.3 1.2.5 1.8.7l.3 1.1a1 1 0 0 0 1 .7h2a1 1 0 0 0 1-.7l.3-1.1c.6-.2 1.2-.4 1.8-.7l.6 1a1 1 0 0 0 1.3.3l1.7-1a1 1 0 0 0 .3-1.3l-.6-1c.3-.6.5-1.1.7-1.7l.9-.5a1 1 0 0 0 0-1.9Z" />
          </svg>
          <h2>Settings</h2>
        </div>

        <div className="settings-drawer-actions">
          <Link to="/app/settings" className="drawer-link" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
            <span>Appearance & Notifications</span>
          </Link>

          {isLead && (
            <Link to="/app/admin" className="drawer-link drawer-link-admin" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span>Admin Panel</span>
              <span className="admin-badge">Lead</span>
            </Link>
          )}

          <button type="button" className="drawer-link drawer-link-danger" onClick={handleSignOut}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
