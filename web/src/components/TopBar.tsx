import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import Avatar from "./Avatar";

export default function TopBar() {
  const { profile } = useAuth();

  const displayName = profile?.display_name ?? "Family Lead";

  return (
    <header className="top-bar">
      <div className="top-bar-brand">
        <div className="brand-mark">TM</div>
        <div>
          <div className="brand-title">Talking Music League</div>
          <div className="brand-subtitle">Your family's league, connected.</div>
        </div>
      </div>
      <nav className="top-bar-actions">
        <Link className="top-link" to="/app/settings">
          <Avatar src={profile?.avatar_url} name={displayName} size="sm" />
          {displayName}
        </Link>
        <button
          className="top-link top-link-ghost"
          type="button"
          onClick={() => supabase.auth.signOut()}
        >
          Sign out
        </button>
      </nav>
    </header>
  );
}
