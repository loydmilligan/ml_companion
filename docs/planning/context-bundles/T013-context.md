# T013: Create PeopleTab - Invitations section

## Task Summary
Add Invitations AdminSection to PeopleTab. Display active invite codes with status. Form to create/send invites.

## Required Context

### Current Invites Tab in AdminPage.tsx (approximate lines 3150-3250)
```typescript
{activeTab === "invites" ? (
  <Card className="dashboard-card">
    <h2>Invite codes</h2>
    <div className="admin-list">
      {invites.map((inv) => (
        <div key={inv.id} className="admin-list-row">
          <div>
            <code>{inv.code}</code>
            {inv.invite_email && <span className="muted">{inv.invite_email}</span>}
          </div>
          <span className="pill">
            {inv.used_at ? "Used" : inv.expires_at && new Date(inv.expires_at) < new Date() ? "Expired" : "Active"}
          </span>
          <button onClick={() => copyInviteCode(inv.code)}>Copy</button>
        </div>
      ))}
    </div>
    <div className="admin-form">
      <input
        placeholder="Email (optional)"
        value={inviteEmail}
        onChange={(e) => setInviteEmail(e.target.value)}
      />
      <Button onClick={generateInvite}>Generate Invite</Button>
      {inviteEmail && <Button onClick={sendEmailInvite}>Send Email Invite</Button>}
    </div>
  </Card>
) : null}
```

### InviteRow Type
```typescript
type InviteRow = {
  id: string;
  code: string;
  created_at: string;
  expires_at: string | null;
  used_at: string | null;
  used_by: string | null;
  invite_email: string | null;
  email_sent_at: string | null;
};
```

### Addition to PeopleTab.tsx
```typescript
// Add to PeopleTab.tsx (after Members section)

// State for invitations
const [invites, setInvites] = useState<InviteRow[]>([]);
const [inviteEmail, setInviteEmail] = useState("");
const [inviteLink, setInviteLink] = useState<string | null>(null);

// Fetch invites
useEffect(() => {
  if (!group?.id) return;
  const fetchInvites = async () => {
    const { data } = await supabase
      .from("invite_codes")
      .select("*")
      .eq("group_id", group.id)
      .order("created_at", { ascending: false });
    if (data) setInvites(data);
  };
  fetchInvites();
}, [group?.id]);

// Generate invite
const generateInvite = async () => {
  const code = crypto.randomUUID().slice(0, 8);
  const { error } = await supabase.from("invite_codes").insert({
    code,
    group_id: group?.id,
    invite_email: inviteEmail || null,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
  if (!error) {
    setInviteLink(`${window.location.origin}/invite?code=${code}`);
    // Refetch invites
  }
};

// In JSX, add after Members section:
<AdminSection icon="✉️" title="Invitations" color="blue">
  <div className="invite-list">
    {invites.map((inv) => {
      const status = inv.used_at
        ? "used"
        : inv.expires_at && new Date(inv.expires_at) < new Date()
        ? "expired"
        : "active";

      return (
        <div key={inv.id} className="invite-row">
          <div className="invite-info">
            <code className="invite-code">{inv.code}</code>
            {inv.invite_email && (
              <span className="invite-email muted">{inv.invite_email}</span>
            )}
          </div>
          <span className={`invite-status invite-status--${status}`}>
            {status}
          </span>
          <button
            type="button"
            className="invite-copy-btn"
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/invite?code=${inv.code}`);
            }}
          >
            Copy
          </button>
        </div>
      );
    })}
  </div>

  <div className="invite-form">
    <input
      type="email"
      className="field-input"
      placeholder="Email (optional)"
      value={inviteEmail}
      onChange={(e) => setInviteEmail(e.target.value)}
    />
    <button type="button" className="btn" onClick={generateInvite}>
      Generate Invite
    </button>
  </div>

  {inviteLink && (
    <div className="invite-link-display">
      <p>Share this link:</p>
      <code>{inviteLink}</code>
    </div>
  )}
</AdminSection>
```

### CSS for Invitations
```css
/* Add to admin.css */
.invite-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.invite-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-radius: 6px;
}

.invite-info {
  flex: 1;
  min-width: 0;
}

.invite-code {
  font-family: monospace;
  background: var(--surface);
  padding: 2px 6px;
  border-radius: 4px;
}

.invite-email {
  display: block;
  font-size: 0.85rem;
  margin-top: 2px;
}

.invite-status {
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 12px;
  text-transform: uppercase;
}

.invite-status--active {
  background: var(--success-bg);
  color: var(--success);
}

.invite-status--used {
  background: var(--bg-secondary);
  color: var(--text-muted);
}

.invite-status--expired {
  background: var(--bg-warning);
  color: var(--warning);
}

.invite-form {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.invite-form .field-input {
  flex: 1;
  min-width: 200px;
}

.invite-link-display {
  margin-top: 12px;
  padding: 12px;
  background: var(--success-bg);
  border-radius: 8px;
}

.invite-link-display code {
  display: block;
  word-break: break-all;
  font-size: 0.9rem;
}
```

## Files to Edit
- `web/src/pages/admin/tabs/PeopleTab.tsx` - Add Invitations section
- `web/src/pages/admin/admin.css` - Add invite styles

## Test Cases (bundled with T012)
1. renders invite list
2. create invite form works
3. copy code button copies to clipboard

## Acceptance Criteria
- [ ] Invite list shows status (active/used/expired)
- [ ] Generate invite creates new code
- [ ] Copy button works
- [ ] Optional email field works
