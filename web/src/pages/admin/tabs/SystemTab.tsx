import { useState } from "react";
import { AdminSection, AdminCard, AdminToggle } from "../components";
import { useAdmin } from "../AdminContext";
import { supabase } from "../../../lib/supabase";

type StatusType = "idle" | "loading" | "success" | "error";

export default function SystemTab() {
  const { settings, updateSetting } = useAdmin();
  const [seedStatus, setSeedStatus] = useState<StatusType>("idle");
  const [seedMessage, setSeedMessage] = useState("");
  const [clearStatus, setClearStatus] = useState<StatusType>("idle");
  const [clearMessage, setClearMessage] = useState("");

  const handleSeedTestData = async () => {
    setSeedStatus("loading");
    setSeedMessage("Seeding test data...");
    try {
      const { data, error } = await supabase.functions.invoke("seed-test-data", {
        body: { reset: true },
      });
      if (error) {
        setSeedStatus("error");
        setSeedMessage(`Error: ${error.message}`);
      } else if (data?.success) {
        setSeedStatus("success");
        setSeedMessage(`Success! Created ${data.testUsers?.length || 0} test users and test group.`);
      } else {
        setSeedStatus("error");
        setSeedMessage(`Failed: ${data?.errors?.join(", ") || "Unknown error"}`);
      }
    } catch (err) {
      setSeedStatus("error");
      setSeedMessage(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleClearTestData = async () => {
    setClearStatus("loading");
    setClearMessage("Clearing test data...");
    try {
      const { data, error } = await supabase.functions.invoke("clear-test-data");
      if (error) {
        setClearStatus("error");
        setClearMessage(`Error: ${error.message}`);
      } else {
        setClearStatus("success");
        setClearMessage(`Cleared ${data?.deleted || 0} test records`);
      }
    } catch (err) {
      setClearStatus("error");
      setClearMessage(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  if (!settings) return <p>Loading settings...</p>;

  return (
    <div className="system-tab">
      {/* Admin Panel Version */}
      <AdminSection icon="🔄" title="Admin Panel Version" color="gray" defaultOpen>
        <AdminCard>
          <p className="muted">
            Switch between the classic admin panel and the new redesigned version.
          </p>
          <AdminToggle
            icon="✨"
            label="Use New Admin Panel (v2)"
            helper="Enable the redesigned admin panel with improved navigation"
            checked={settings.admin_v2_enabled ?? false}
            onChange={(checked) => {
              updateSetting("admin_v2_enabled", checked);
              // Redirect after toggle
              if (checked) {
                window.location.href = "/app/admin-v2";
              }
            }}
          />
          <p className="muted" style={{ marginTop: 8, fontSize: "0.85rem" }}>
            You can switch back at any time from the System tab.
          </p>
        </AdminCard>
      </AdminSection>

      {/* Testing Section */}
      <AdminSection icon="🧪" title="Testing" color="gray" defaultOpen>
        <AdminCard>
          <p className="muted">
            Manage test data and access the test dashboard for development.
          </p>

          <div className="system-actions">
            <a href="/app/test-dashboard" className="btn btn-secondary">
              Open Test Dashboard
            </a>

            <button
              type="button"
              className="btn"
              onClick={handleSeedTestData}
              disabled={seedStatus === "loading"}
            >
              {seedStatus === "loading" ? "Seeding..." : "Seed Test Data"}
            </button>

            <button
              type="button"
              className="btn btn-danger"
              onClick={handleClearTestData}
              disabled={clearStatus === "loading"}
            >
              {clearStatus === "loading" ? "Clearing..." : "Clear Test Data"}
            </button>
          </div>

          {seedMessage && (
            <div className={`system-status system-status--${seedStatus}`}>
              {seedMessage}
            </div>
          )}

          {clearMessage && (
            <div className={`system-status system-status--${clearStatus}`}>
              {clearMessage}
            </div>
          )}
        </AdminCard>
      </AdminSection>

      {/* Diagnostics Section */}
      <AdminSection icon="📊" title="Diagnostics" color="gray" defaultOpen={false}>
        <AdminCard>
          <p className="muted">System health and status information.</p>

          <div className="diagnostics-item">
            <span className="diagnostics-label">Email Processing</span>
            <span className="diagnostics-value">
              Check Content tab for manual email processing
            </span>
          </div>

          <div className="diagnostics-item">
            <span className="diagnostics-label">Database</span>
            <span className="diagnostics-value diagnostics-value--ok">Connected</span>
          </div>

          <div className="diagnostics-item">
            <span className="diagnostics-label">Edge Functions</span>
            <span className="diagnostics-value diagnostics-value--ok">Available</span>
          </div>
        </AdminCard>
      </AdminSection>

      {/* Advanced Section - placeholder for future */}
      <AdminSection icon="🔧" title="Advanced" color="gray" defaultOpen={false}>
        <AdminCard>
          <p className="muted">
            Advanced system settings will be available here in the future.
          </p>
          <ul className="muted" style={{ fontSize: "0.85rem" }}>
            <li>Data export</li>
            <li>Backup/restore</li>
            <li>Migration tools</li>
          </ul>
        </AdminCard>
      </AdminSection>
    </div>
  );
}
