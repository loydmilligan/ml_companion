# T017: Create ContentTab - Imports section

## Task Summary
Add Imports AdminSection to ContentTab. Three sub-sections: Import Submissions (CSV), Import Votes (CSV), Process Emails.

## Required Context

### Current Imports Tab (lines ~3581-3730)
```typescript
{activeTab === "imports" ? (
  <div className="history-dashboard">
    <SeasonImport
      leagueId={selectedLeagueId}
      groupId={group?.id ?? null}
      onImportComplete={() => { /* refetch */ }}
    />
    <Card className="dashboard-card">
      <h2>Active import target</h2>
      <select value={selectedLeagueId ?? ""} onChange={...}>
        <option value="">Select league</option>
        {leagues.map((league) => (
          <option key={league.id} value={league.id}>
            Season {league.season_number ?? "—"} · {league.name}
          </option>
        ))}
      </select>
    </Card>
    {/* More import cards for different types */}
  </div>
) : null}
```

### SeasonImport Component Reference
The existing SeasonImport component handles CSV parsing with Papa Parse.
Location: `web/src/components/SeasonImport.tsx`

### Addition to ContentTab.tsx
```typescript
// Import the existing SeasonImport component
import SeasonImport from "../../../components/SeasonImport";

// Add state
const [selectedImportLeagueId, setSelectedImportLeagueId] = useState<string | null>(null);
const [processEmailsLoading, setProcessEmailsLoading] = useState(false);
const [processEmailsStatus, setProcessEmailsStatus] = useState<string | null>(null);

// Process emails handler
const handleProcessEmails = async () => {
  setProcessEmailsLoading(true);
  setProcessEmailsStatus("Processing...");
  try {
    const { data, error } = await supabase.functions.invoke("process-emails");
    if (error) {
      setProcessEmailsStatus(`Error: ${error.message}`);
    } else {
      setProcessEmailsStatus(`Processed ${data?.processed ?? 0} emails`);
    }
  } catch (err) {
    setProcessEmailsStatus("Failed to process emails");
  } finally {
    setProcessEmailsLoading(false);
  }
};

// In JSX, after Rounds section:
<AdminSection icon="📥" title="Import Data" color="green">
  {/* Target League Selection */}
  <AdminCard title="Import Target">
    <p className="muted">Select which league/season to import data into.</p>
    <AdminSelect
      icon="🎯"
      label="Target League"
      value={selectedImportLeagueId ?? ""}
      onChange={(val) => setSelectedImportLeagueId(val || null)}
      options={[
        { value: "", label: "Select a league..." },
        ...leagues.map((l) => ({
          value: l.id,
          label: `Season ${l.season_number ?? "?"} · ${l.name}`,
        })),
      ]}
    />
  </AdminCard>

  {/* CSV Import - uses existing component */}
  {selectedImportLeagueId && (
    <AdminCard title="CSV Import">
      <SeasonImport
        leagueId={selectedImportLeagueId}
        groupId={group?.id ?? null}
        onImportComplete={() => {
          // Refetch rounds, competitors, etc.
        }}
      />
    </AdminCard>
  )}

  {/* Process Emails */}
  <AdminCard title="Process Emails" icon="📧">
    <p className="muted">
      Manually trigger email processing to sync votes and submissions.
    </p>
    <button
      type="button"
      className="btn"
      onClick={handleProcessEmails}
      disabled={processEmailsLoading}
    >
      {processEmailsLoading ? "Processing..." : "Process Emails"}
    </button>
    {processEmailsStatus && (
      <p className={`import-status ${processEmailsStatus.includes("Error") ? "import-status--error" : ""}`}>
        {processEmailsStatus}
      </p>
    )}
  </AdminCard>
</AdminSection>
```

### CSS for Imports
```css
/* Add to admin.css */
.import-status {
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--success-bg);
  border-radius: 6px;
  font-size: 0.9rem;
}

.import-status--error {
  background: rgba(255, 111, 97, 0.1);
  color: var(--error);
}
```

## Files to Edit
- `web/src/pages/admin/tabs/ContentTab.tsx` - Add Imports section
- `web/src/pages/admin/admin.css` - Add import styles

## Test Cases (bundled with T015)
1. CSV upload shows preview (via SeasonImport)
2. import button processes CSV
3. process emails button triggers function

## Notes
- Reuse existing SeasonImport component - don't rebuild Papa Parse logic
- Keep existing CSV import flow, just wrap in new UI

## Acceptance Criteria
- [ ] League selector works
- [ ] SeasonImport component renders
- [ ] Process emails triggers edge function
- [ ] Status feedback shown
