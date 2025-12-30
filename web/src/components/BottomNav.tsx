import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/app/chat", label: "Chat" },
  { to: "/app/history", label: "History" },
  { to: "/app/settings", label: "Settings" },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <NavLink key={item.to} className="bottom-nav-link" to={item.to}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
