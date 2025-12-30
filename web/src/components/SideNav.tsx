import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function SideNav() {
  const { group } = useAuth();
  const isLead = group?.role === "lead";
  return (
    <aside className="side-nav">
      <div className="side-nav-section">
        <NavLink className="side-nav-link" to="/app/chat">
          Chat
        </NavLink>
        <NavLink className="side-nav-link" to="/app/history">
          History
        </NavLink>
        <NavLink className="side-nav-link" to="/app/settings">
          Settings
        </NavLink>
        {isLead ? (
          <NavLink className="side-nav-link" to="/app/admin">
            Admin
          </NavLink>
        ) : null}
      </div>
    </aside>
  );
}
