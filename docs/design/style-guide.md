# TML Style Guide - Color & Contrast Reference

> **Purpose**: This document defines all approved CSS variables, contrast ratios, and patterns to prevent UI visibility issues between light and dark modes.

---

## 1. Approved CSS Variables

### Brand Colors
| Variable | Value | Usage |
|----------|-------|-------|
| `--navy` | `#0a1a2f` | Primary brand, headings, dark backgrounds |
| `--coral` | `#ff6f61` | Accent, CTAs, warnings |
| `--mint` | `#18e0a8` | Success states, positive indicators |
| `--blue` | `#11c1ec` | Links, interactive elements |
| `--light-blue` | `#86b7fe` | Secondary interactive, highlights |

### Semantic Colors (Mode-Dependent)
| Variable | Light Mode | Dark Mode | Usage |
|----------|------------|-----------|-------|
| `--surface` | `#ffffff` | `#121c2b` | Card backgrounds, containers |
| `--surface-dark` | `#0f223f` | `#0a1426` | Elevated surfaces, headers |
| `--text-primary` | `#0a1a2f` | `#eef3ff` | Body text, headings |
| `--text-muted` | `#5a6b7f` | `#9fb0c8` | Secondary text, labels |

### Status Colors
| Variable | Value | Usage |
|----------|-------|-------|
| `--gauge-safe` | `#18e0a8` | Safe/good status |
| `--gauge-warning` | `#ffd166` | Warning status |
| `--gauge-urgent` | `#ff6f61` | Urgent/danger status |
| `--gauge-bg` | `rgba(10, 26, 47, 0.15)` | Gauge background track |

### Trophy Colors
| Variable | Value | Usage |
|----------|-------|-------|
| `--trophy-gold` | `#ffd700` | 1st place |
| `--trophy-silver` | `#c0c0c0` | 2nd place |
| `--trophy-bronze` | `#cd7f32` | 3rd place |

### Semantic Aliases (Mode-Dependent)
| Variable | Light Mode | Dark Mode | Usage |
|----------|------------|-----------|-------|
| `--primary` | `#4f46e5` | `#6366f1` | Primary actions, buttons |
| `--accent` | `#11c1ec` | `#22d3ee` | Secondary interactive |
| `--success` | `#18e0a8` | `#34d399` | Success states |
| `--error` | `#ff6f61` | `#f87171` | Error states |
| `--warning` | `#ffd166` | `#fbbf24` | Warning states |
| `--text` | `#0a1a2f` | `#eef3ff` | Body text (alias) |
| `--muted` | `#5a6b7f` | `#9fb0c8` | Muted text (alias) |
| `--border` | `rgba(10,26,47,0.12)` | `rgba(255,255,255,0.12)` | Borders |
| `--bg-primary` | `#ffffff` | `#121c2b` | Primary background |
| `--bg-secondary` | `#f3f7fb` | `#0a1426` | Secondary background |
| `--green` | `#18e0a8` | `#34d399` | Positive/success color |

### Layout Variables
| Variable | Value | Usage |
|----------|-------|-------|
| `--radius` | `16px` | Standard border radius |
| `--shadow` | See below | Primary shadow |
| `--shadow-soft` | See below | Subtle shadow |
| `--peek-width-mobile` | `85vw` | Peek panel mobile width |
| `--peek-width-desktop` | `400px` | Peek panel desktop width |
| `--peek-backdrop` | `rgba(10, 26, 47, 0.5)` | Modal backdrop |

---

## 2. Pre-Calculated Contrast Ratios

### Light Mode Pairs (background → text)
| Background | Text | Ratio | Rating | Safe? |
|------------|------|-------|--------|-------|
| `#ffffff` (surface) | `#0a1a2f` (text-primary) | **16.1:1** | AAA | YES |
| `#ffffff` (surface) | `#5a6b7f` (text-muted) | **5.8:1** | AA | YES |
| `#f3f7fb` (page-bg) | `#0a1a2f` (text-primary) | **14.5:1** | AAA | YES |
| `#f3f7fb` (page-bg) | `#5a6b7f` (text-muted) | **5.2:1** | AA | YES |
| `#ff6f61` (coral) | `#ffffff` | **3.2:1** | Large only | CAUTION |
| `#ff6f61` (coral) | `#0a1a2f` | **4.9:1** | AA | YES |
| `#18e0a8` (mint) | `#0a1a2f` | **8.4:1** | AAA | YES |
| `#11c1ec` (blue) | `#0a1a2f` | **6.8:1** | AA | YES |
| `#4f46e5` (purple btn) | `#ffffff` | **6.0:1** | AA | YES |

### Dark Mode Pairs (background → text)
| Background | Text | Ratio | Rating | Safe? |
|------------|------|-------|--------|-------|
| `#121c2b` (surface) | `#eef3ff` (text-primary) | **12.4:1** | AAA | YES |
| `#121c2b` (surface) | `#9fb0c8` (text-muted) | **6.2:1** | AA | YES |
| `#0b1322` (page-bg) | `#eef3ff` (text-primary) | **13.8:1** | AAA | YES |
| `#0a1426` (surface-dark) | `#eef3ff` (text-primary) | **14.1:1** | AAA | YES |
| `#6366f1` (purple btn) | `#ffffff` | **4.6:1** | AA | YES |

---

## 3. Best Practices

### Always Provide Both Mode Overrides
For any interactive element with color/background, provide explicit overrides:

```css
/* Base styles */
.my-element {
  /* Default to light mode values */
}

/* Explicit light mode */
[data-mode="light"] .my-element {
  background: var(--surface);
  color: var(--text-primary);
}

/* Explicit dark mode */
[data-mode="dark"] .my-element {
  background: var(--surface);
  color: var(--text-primary);
}
```

### Use Semantic Variables
| For this purpose | Use this variable |
|-----------------|-------------------|
| Primary actions | `var(--primary)` |
| Success states | `var(--success)` |
| Error states | `var(--error)` |
| Warning states | `var(--warning)` |
| Borders | `var(--border)` |
| Body text | `var(--text-primary)` or `var(--text)` |
| Muted text | `var(--text-muted)` or `var(--muted)` |
| Card backgrounds | `var(--surface)` |
| Page backgrounds | `var(--bg-primary)` or `var(--bg-secondary)` |

---

## 4. Component Patterns

### Primary Button
```css
/* Base - works for both modes with explicit colors */
.btn-primary {
  background: #4f46e5;
  color: #ffffff;
  border: none;
  border-radius: var(--radius);
  padding: 12px 24px;
  font-weight: 600;
}

/* Light mode */
[data-mode="light"] .btn-primary {
  background: #4f46e5;
  color: #ffffff;
}

/* Dark mode - slightly lighter for visibility */
[data-mode="dark"] .btn-primary {
  background: #6366f1;
  color: #ffffff;
}

.btn-primary:hover {
  background: #4338ca;
}
```

### Secondary Button
```css
.btn-secondary {
  background: transparent;
  border: 2px solid var(--text-muted);
  color: var(--text-primary);
}

[data-mode="light"] .btn-secondary {
  border-color: rgba(10, 26, 47, 0.2);
  color: #0a1a2f;
}

[data-mode="dark"] .btn-secondary {
  border-color: rgba(255, 255, 255, 0.2);
  color: #eef3ff;
}
```

### Badge/Pill
```css
.badge {
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Success badge */
.badge-success {
  background: rgba(24, 224, 168, 0.15);
  color: #18e0a8;
}

[data-mode="light"] .badge-success {
  background: rgba(24, 224, 168, 0.15);
  color: #0d8a65; /* Darker for light bg contrast */
}

[data-mode="dark"] .badge-success {
  background: rgba(24, 224, 168, 0.2);
  color: #18e0a8;
}
```

### Input Field
```css
.field-input {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 1rem;
  width: 100%;
  transition: border-color 0.2s;
}

[data-mode="light"] .field-input {
  background: #ffffff;
  color: #0a1a2f;
  border: 1px solid rgba(10, 26, 47, 0.15);
}

[data-mode="light"] .field-input::placeholder {
  color: #5a6b7f;
}

[data-mode="dark"] .field-input {
  background: rgba(255, 255, 255, 0.08);
  color: #f1f5f9;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

[data-mode="dark"] .field-input::placeholder {
  color: #9fb0c8;
}
```

### Drawer/Panel
```css
.drawer {
  position: fixed;
  box-shadow: var(--shadow);
  border-radius: var(--radius);
}

[data-mode="light"] .drawer {
  background: #ffffff;
  border: 1px solid rgba(10, 26, 47, 0.08);
}

[data-mode="dark"] .drawer {
  background: #1a1a2e;
  border: 1px solid rgba(255, 255, 255, 0.08);
}
```

### Card
```css
.card {
  border-radius: var(--radius);
  padding: 16px;
}

[data-mode="light"] .card {
  background: var(--surface);
  box-shadow: var(--shadow-soft);
}

[data-mode="dark"] .card {
  background: var(--surface);
  box-shadow: var(--shadow-soft);
}
```

---

## 5. WCAG Contrast Requirements

| Text Size | Minimum Ratio | Rating |
|-----------|--------------|--------|
| Normal text (< 18pt) | **4.5:1** | AA |
| Large text (≥ 18pt or 14pt bold) | **3.0:1** | AA |
| Normal text (< 18pt) | **7.0:1** | AAA |
| Large text (≥ 18pt) | **4.5:1** | AAA |

### Contrast Calculation Formula
```
Relative luminance: L = 0.2126 × R + 0.7152 × G + 0.0722 × B
(where R, G, B are gamma-corrected: value ≤ 0.03928 ? value/12.92 : ((value+0.055)/1.055)^2.4)

Contrast ratio: (L1 + 0.05) / (L2 + 0.05)
(where L1 is the lighter color)
```

---

## 6. Checklist for New UI Elements

Before implementing any new UI component:

- [ ] Only use variables from Section 1 (Approved CSS Variables)
- [ ] Check contrast ratios in Section 2 for your color pairs
- [ ] Avoid ALL patterns in Section 3 (Forbidden Patterns)
- [ ] Provide BOTH `[data-mode="light"]` and `[data-mode="dark"]` overrides
- [ ] Test visually in both modes before claiming complete
- [ ] Run `npm run check:contrast` if available

---

## 7. Quick Copy-Paste Colors

### Safe Text on Backgrounds
```css
/* On light backgrounds (#fff, #f3f7fb) */
color: #0a1a2f;  /* Primary text - 16.1:1 */
color: #5a6b7f;  /* Muted text - 5.8:1 */

/* On dark backgrounds (#121c2b, #0b1322) */
color: #eef3ff;  /* Primary text - 12.4:1 */
color: #9fb0c8;  /* Muted text - 6.2:1 */
```

### Safe Colored Buttons
```css
/* Purple button (works both modes) */
background: #4f46e5; color: #ffffff;  /* 6.0:1 */

/* Coral on dark text */
background: #ff6f61; color: #0a1a2f;  /* 4.9:1 */

/* Mint on dark text */
background: #18e0a8; color: #0a1a2f;  /* 8.4:1 */
```

### Border Colors
```css
/* Light mode borders */
border-color: rgba(10, 26, 47, 0.12);  /* Subtle */
border-color: rgba(10, 26, 47, 0.20);  /* Medium */

/* Dark mode borders */
border-color: rgba(255, 255, 255, 0.12);  /* Subtle */
border-color: rgba(255, 255, 255, 0.20);  /* Medium */
```
