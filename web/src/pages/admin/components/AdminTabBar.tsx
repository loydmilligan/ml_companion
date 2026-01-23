import clsx from "clsx";

type AdminTab = {
  id: string;
  label: string;
  shortLabel: string;
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
  return (
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
          <span className="admin-tab__short-label">{tab.shortLabel}</span>
        </button>
      ))}
    </nav>
  );
}
