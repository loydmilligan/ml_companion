import { NavLink } from "react-router-dom";

export default function SideNav() {
  return (
    <aside className="side-nav">
      <div className="side-nav-section">
        <NavLink className="side-nav-link" to="/app" end>
          Dashboard
        </NavLink>
        <NavLink className="side-nav-link" to="/app/chat">
          Group Chat
        </NavLink>
        <NavLink className="side-nav-link" to="/app/leaderboard">
          Leaderboard
        </NavLink>
      </div>
      <div className="side-nav-footer">
        <div className="side-nav-footer-title">Need to adjust your account?</div>
        <div className="side-nav-footer-links">
          <NavLink className="side-nav-link" to="/app/profile">
            Profile
          </NavLink>
          <NavLink className="side-nav-link" to="/app/settings">
            Settings
          </NavLink>
        </div>
      </div>
    </aside>
  );
}
