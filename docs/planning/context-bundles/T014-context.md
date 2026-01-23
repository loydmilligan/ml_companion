# T014: Create PeopleTab - Competitors section

## Task Summary
Add Competitors AdminSection to PeopleTab. Display season competitors with profile linking dropdown. REMOVE AI image traits JSON textarea entirely.

## Required Context

### Current Competitors Tab in AdminPage.tsx (lines ~3450-3578)
```typescript
// SECTION TO REMOVE - AI Image Traits (lines 3525-3554)
<label className="field">
  <span className="field-label">AI image traits</span>
  <textarea
    className="field-input"
    rows={3}
    placeholder='{"Age":"27","Gender":"NB","Hair style with color":"cropped blonde"}'
    value={getCompetitorTraitsDraft(competitor.id, competitor.ai_image_traits)}
    onChange={(event) =>
      setCompetitorTraitsDrafts((prev) => ({
        ...prev,
        [competitor.id]: event.target.value,
      }))
    }
  />
  <span className="field-helper">
    Use double quotes around keys and values
  </span>
</label>
<Button onClick={() => updateCompetitorTraits(...)}>Save traits</Button>
// END REMOVAL

// KEEP - Profile linking dropdown
<select
  className="field-input"
  value={competitor.profile_id ?? ""}
  onChange={(event) =>
    linkCompetitor(competitor.id, event.target.value ? event.target.value : null)
  }
>
  <option value="">Link to user</option>
  {users.map((user) =>
    user.profiles?.id ? (
      <option key={user.profiles.id} value={user.profiles.id}>
        {user.profiles.display_name ?? user.profiles.email ?? "Member"}
      </option>
    ) : null
  )}
</select>
```

### SeasonCompetitor Type
```typescript
type SeasonCompetitor = {
  id: string;
  name: string;
  profile_id: string | null;
  external_id: string | null;
  ai_image_traits: string | null;  // KEEP in type but don't show UI
};
```

### Addition to PeopleTab.tsx
```typescript
// Add state for competitors
const [seasonCompetitors, setSeasonCompetitors] = useState<SeasonCompetitor[]>([]);

// Fetch competitors
useEffect(() => {
  if (!group?.id) return;
  const fetchCompetitors = async () => {
    const { data } = await supabase
      .from("season_competitors")
      .select("*")
      .eq("group_id", group.id)
      .order("name");
    if (data) setSeasonCompetitors(data);
  };
  fetchCompetitors();
}, [group?.id]);

// Link competitor to profile
const linkCompetitor = async (competitorId: string, profileId: string | null) => {
  await supabase
    .from("season_competitors")
    .update({ profile_id: profileId })
    .eq("id", competitorId);
  // Refetch competitors
};

// In JSX, add after Invitations section:
<AdminSection icon="🎤" title="Competitors" color="blue">
  <p className="muted" style={{ marginBottom: 12 }}>
    Link external competitor names to member profiles for correct attribution.
  </p>
  <div className="competitor-list">
    {seasonCompetitors.map((competitor) => (
      <div key={competitor.id} className="competitor-row">
        <div className="competitor-name">
          <strong>{competitor.name}</strong>
          {competitor.profile_id && (
            <span className="competitor-linked">
              → {users.find(u => u.profiles?.id === competitor.profile_id)?.profiles?.display_name ?? "Linked"}
            </span>
          )}
        </div>
        <select
          className="field-input competitor-link-select"
          value={competitor.profile_id ?? ""}
          onChange={(e) => linkCompetitor(competitor.id, e.target.value || null)}
        >
          <option value="">Unlinked</option>
          {users.map((user) =>
            user.profiles?.id ? (
              <option key={user.profiles.id} value={user.profiles.id}>
                {user.profiles.display_name ?? user.profiles.email ?? "Member"}
              </option>
            ) : null
          )}
        </select>
      </div>
    ))}
  </div>
</AdminSection>
```

### CSS for Competitors
```css
/* Add to admin.css */
.competitor-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.competitor-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-radius: 6px;
}

.competitor-name {
  flex: 1;
  min-width: 0;
}

.competitor-name strong {
  display: block;
}

.competitor-linked {
  font-size: 0.85rem;
  color: var(--success);
}

.competitor-link-select {
  width: auto;
  min-width: 150px;
  max-width: 200px;
}
```

## IMPORTANT: Features REMOVED
- NO ai_image_traits JSON textarea (was clunky, poor results)
- Saves ~100 lines of complex JSON editing UI

## Files to Edit
- `web/src/pages/admin/tabs/PeopleTab.tsx` - Add Competitors section
- `web/src/pages/admin/admin.css` - Add competitor styles

## Test Cases (bundled with T012)
1. renders competitor list
2. profile link dropdown shows available profiles
3. linking competitor updates database

## Acceptance Criteria
- [ ] Competitor list renders
- [ ] Profile dropdown works
- [ ] Shows linked status when linked
- [ ] NO ai_image_traits field
