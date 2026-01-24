import clsx from "clsx";

type AdminTab = {
  id: string;
  label: string;
  icon: string;
};

type AdminTabBarProps = {
  tabs: AdminTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
};

export default function AdminTabBar({
  tabs,
  activeTab,
  onTabChange,
}: AdminTabBarProps) {
  const activeTabData = tabs.find((t) => t.id === activeTab);

  return (
    <div className="admin-tab-bar-wrapper">
      <nav className="admin-tab-bar" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={clsx("admin-tab", activeTab === tab.id && "admin-tab--active")}
            onClick={() => onTabChange(tab.id)}
          >
            <span className="admin-tab__icon">{tab.icon}</span>
            <span className="admin-tab__label">{tab.label}</span>
          </button>
        ))}
      </nav>
      {/* Mobile-only: show selected tab name */}
      {activeTabData && (
        <div className="admin-tab-bar__selected-title">
          {activeTabData.label}
        </div>
      )}
    </div>
  );
}
