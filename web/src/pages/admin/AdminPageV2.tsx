import { useState } from "react";
import { AdminProvider, useAdmin } from "./AdminContext";
import { AdminTabBar } from "./components";
import { PeopleTab, ContentTab, GamesTab, SystemTab } from "./tabs";
import "./admin.css";

const ADMIN_TABS = [
  { id: "people", label: "People", icon: "👥" },
  { id: "content", label: "Content", icon: "📋" },
  { id: "games", label: "Games & AI", icon: "🎮" },
  { id: "system", label: "System", icon: "⚙️" },
] as const;

type AdminTabId = typeof ADMIN_TABS[number]["id"];

function AdminContent() {
  const { group, loading } = useAdmin();
  const [activeTab, setActiveTab] = useState<AdminTabId>("people");

  if (loading) {
    return <div className="admin-loading">Loading admin settings...</div>;
  }

  if (group?.role !== "lead") {
    return (
      <div className="admin-unauthorized">
        You need lead permissions to access admin settings.
      </div>
    );
  }

  return (
    <div className="admin-page-v2">
      <h1 className="admin-title">Admin Panel</h1>
      <AdminTabBar
        tabs={[...ADMIN_TABS]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as AdminTabId)}
      />
      <div className="admin-tab-content">
        {activeTab === "people" && <PeopleTab />}
        {activeTab === "content" && <ContentTab />}
        {activeTab === "games" && <GamesTab />}
        {activeTab === "system" && <SystemTab />}
      </div>
    </div>
  );
}

export default function AdminPageV2() {
  return (
    <AdminProvider>
      <AdminContent />
    </AdminProvider>
  );
}
