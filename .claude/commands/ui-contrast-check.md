---
allowed-tools: Read, Bash, Glob, Grep
argument-hint: [file-path] | --all
description: Verify UI contrast and visibility for CSS changes with automated checking
---

# UI Contrast & Visibility Verification

Verify CSS contrast and visibility: $ARGUMENTS

## Verification Steps

### Step 1: Run Automated Checks

```bash
# Run contrast checker to find undefined variables
cd /home/mmariani/Projects/ml_companion/web && node ../scripts/css-contrast-checker.js

# Run Stylelint for CSS issues
cd /home/mmariani/Projects/ml_companion/web && npm run lint:css
```

### Step 2: Variable Audit

Search for undefined CSS variables in the target file(s):

```bash
# Find all var(--*) usages without fallbacks
grep -rn "var(--" web/src/ | grep -v "var(--.*," | head -50
```

Cross-reference against approved variables in `web/src/index.css`.

### Step 3: Mode Coverage Check

For any file with color/background properties, verify both mode overrides exist:

```bash
# Check for light mode overrides
grep -c 'data-mode="light"' web/src/App.css

# Check for dark mode overrides
grep -c 'data-mode="dark"' web/src/App.css
```

### Step 4: Common Issues to Flag

Search for these forbidden patterns:
- `var(--primary)` - Does not exist
- `var(--secondary)` - Does not exist
- `var(--background)` - Use `var(--surface)`
- `var(--text)` - Use `var(--text-primary)`
- `var(--color-*)` - None of these exist

### Step 5: Generate Fix Suggestions

For each issue found, suggest the correct replacement from `docs/design/style-guide.md`:

| Undefined Variable | Replacement |
|-------------------|-------------|
| `--primary` | `#4f46e5` or `var(--coral)` |
| `--background` | `var(--surface)` |
| `--text` | `var(--text-primary)` |
| `--border` | `rgba(10, 26, 47, 0.12)` (light) or `rgba(255, 255, 255, 0.12)` (dark) |

## Output Format

Report results as:

```
UI Contrast Check Results
=========================

CRITICAL (will cause invisible elements):
  - [file:line] Issue description

WARNING (accessibility concerns):
  - [file:line] Low contrast detected

PASS:
  - X files checked, no issues found

Reference: docs/design/style-guide.md
```
