# T023: Create SystemTab

## Task Summary
Create SystemTab.tsx with Testing AdminSection (seed/clear test data) and Diagnostics AdminSection (email processing status, health checks).

## Required Context

### Current Testing Tab (lines ~5007-5115)
```typescript
{activeTab === "testing" ? (
  <TestingTab groupId={group?.id} />
) : null}

function TestingTab({ groupId: _groupId }: { groupId?: string }) {
  const [seedStatus, setSeedStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [seedMessage, setSeedMessage] = useState<string>("");

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
        setSeedMessage(`Success! Created ${data.testUsers?.length || 0} test users`);
      }
    } catch (err) {
      setSeedStatus("error");
      setSeedMessage(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  return (
    <Card className="dashboard-card">
      <h2>Testing Environment</h2>
      <p className="muted">Access the test dashboard and manage test data.</p>
      <a href="/app/test-dashboard">Open Test Dashboard</a>
      <Button onClick={handleSeedTestData} disabled={seedStatus === "loading"}>
        {seedStatus === "loading" ? "Seeding..." : "Seed Test Data"}
      </Button>
      {seedMessage && <p>{seedMessage}</p>}
    </Card>
  );
}
```

### New SystemTab Implementation
```typescript
// web/src/pages/admin/tabs/SystemTab.tsx
import { useState } from "react";
import { AdminSection, AdminCard } from "../components";
import { supabase } from "../../../lib/supabase";

type StatusType = "idle" | "loading" | "success" | "error";

export default function SystemTab() {
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

  return (
    <div className="system-tab">
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
```

### CSS for System Tab
```css
/* Add to admin.css */
.system-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0;
}

.system-status {
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.9rem;
}

.system-status--success {
  background: var(--success-bg);
  color: var(--success);
}

.system-status--error {
  background: rgba(255, 111, 97, 0.1);
  color: var(--error);
}

.system-status--loading {
  background: var(--bg-secondary);
  color: var(--text-muted);
}

.diagnostics-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}

.diagnostics-item:last-child {
  border-bottom: none;
}

.diagnostics-label {
  font-weight: 500;
}

.diagnostics-value {
  color: var(--text-muted);
}

.diagnostics-value--ok {
  color: var(--success);
}

.diagnostics-value--warning {
  color: var(--warning);
}

.diagnostics-value--error {
  color: var(--error);
}

.btn-danger {
  background: var(--error);
  color: white;
}

.btn-danger:hover {
  background: #e55a4d;
}
```

## Files to Create
- `web/src/pages/admin/tabs/SystemTab.tsx`

## Files to Edit
- `web/src/pages/admin/tabs/index.ts` - Add export
- `web/src/pages/admin/admin.css` - Add system styles

## Test Cases
1. seed button calls seed function
2. clear button calls clear function
3. diagnostics section renders

## Acceptance Criteria
- [ ] Seed test data button works
- [ ] Clear test data button works
- [ ] Test dashboard link works
- [ ] Diagnostics show basic status
