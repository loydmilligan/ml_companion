#!/usr/bin/env node
/**
 * CSS Contrast Checker
 *
 * Validates CSS files for:
 * 1. Undefined CSS variables
 * 2. WCAG contrast ratio compliance
 *
 * Usage: node scripts/css-contrast-checker.js
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// APPROVED CSS VARIABLES (extracted from web/src/index.css)
// ============================================================================
const APPROVED_VARIABLES = new Set([
  // Brand colors
  '--navy', '--coral', '--mint', '--blue', '--light-blue',
  // Semantic colors
  '--surface', '--surface-dark', '--text-primary', '--text-muted',
  // Layout
  '--page-bg', '--shadow', '--shadow-soft', '--radius',
  // Gauge
  '--gauge-safe', '--gauge-warning', '--gauge-urgent', '--gauge-bg',
  // Peek panel
  '--peek-width-mobile', '--peek-width-desktop', '--peek-backdrop',
  // Trophy
  '--trophy-gold', '--trophy-silver', '--trophy-bronze',
  // Logo palette
  '--logo-mark-bg', '--logo-mark-border', '--logo-bubble',
  '--logo-bubble-outline', '--logo-note',
  // Semantic aliases
  '--primary', '--accent', '--success', '--error', '--warning',
  '--text', '--muted', '--border', '--bg-primary', '--bg-secondary', '--green',
  // Test dashboard colors
  '--color-primary', '--color-surface', '--color-surface-hover',
  '--color-border', '--color-text', '--color-text-secondary',
  '--color-success', '--color-error',
  // Additional semantic aliases
  '--border-color', '--surface-primary', '--surface-secondary',
  '--surface-light', '--surface-muted', '--accent-primary',
  '--text-secondary', '--success-bg', '--bg-warning',
  // Chat (defined in App.css)
  '--chat-bg', '--chat-bubble-bg', '--chat-bubble-own-bg',
  '--chat-compose-bg', '--chat-text', '--chat-input-text',
  '--chat-input-bg', '--chat-input-border',
  // Layout vars (defined in App.css)
  '--topbar-height', '--bottomnav-height',
  // CardStack component vars (local to component)
  '--cs-red', '--cs-green', '--cs-blue', '--cs-black', '--cs-saffron',
  '--track-bg', '--track-text', '--track-border',
  // Fallback patterns (CSS allows var with fallback)
  '--primary-rgb', '--bg-tertiary',
  // Animation/utility vars (set via JS inline styles)
  '--item-index',
]);

// ============================================================================
// COLOR UTILITIES
// ============================================================================

/**
 * Parse hex color to RGB
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };
}

/**
 * Calculate relative luminance (WCAG formula)
 */
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
function getContrastRatio(hex1, hex2) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return null;

  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get WCAG rating for contrast ratio
 */
function getWcagRating(ratio) {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA-large';
  return 'FAIL';
}

// ============================================================================
// CSS PARSING
// ============================================================================

/**
 * Find all CSS variable usages in a file
 */
function findVariableUsages(content, filePath) {
  const errors = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Match var(--variable-name) patterns
    const varRegex = /var\(--([a-zA-Z0-9_-]+)(?:,\s*[^)]+)?\)/g;
    let match;

    while ((match = varRegex.exec(line)) !== null) {
      const varName = `--${match[1]}`;
      const hasFallback = match[0].includes(',');

      // Skip if variable has a fallback value
      if (hasFallback) continue;

      // Check if variable is approved
      if (!APPROVED_VARIABLES.has(varName)) {
        errors.push({
          file: filePath,
          line: index + 1,
          variable: varName,
          context: line.trim().substring(0, 80)
        });
      }
    }
  });

  return errors;
}

/**
 * Recursively find all CSS and TSX files
 */
function findCssFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules and hidden directories
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      findCssFiles(fullPath, files);
    } else if (entry.isFile()) {
      if (entry.name.endsWith('.css') || entry.name.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  const webSrcDir = path.join(__dirname, '..', 'web', 'src');

  console.log('CSS Contrast & Variable Checker');
  console.log('================================\n');

  // Check if directory exists
  if (!fs.existsSync(webSrcDir)) {
    console.error(`Error: Directory not found: ${webSrcDir}`);
    process.exit(1);
  }

  // Find all CSS and TSX files
  const files = findCssFiles(webSrcDir);
  console.log(`Scanning ${files.length} files...\n`);

  // Collect all errors
  const allErrors = [];

  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const errors = findVariableUsages(content, filePath);
      allErrors.push(...errors);
    } catch (err) {
      console.error(`Error reading ${filePath}: ${err.message}`);
    }
  }

  // Report results
  if (allErrors.length === 0) {
    console.log('PASS: No undefined CSS variables found!\n');
  } else {
    console.log(`ERRORS: Found ${allErrors.length} undefined CSS variable(s)\n`);
    console.log('─'.repeat(80));

    // Group by file
    const byFile = {};
    for (const err of allErrors) {
      if (!byFile[err.file]) byFile[err.file] = [];
      byFile[err.file].push(err);
    }

    for (const [file, errors] of Object.entries(byFile)) {
      const relativePath = path.relative(process.cwd(), file);
      console.log(`\n${relativePath}:`);
      for (const err of errors) {
        console.log(`  Line ${err.line}: ${err.variable}`);
        console.log(`    > ${err.context}`);
      }
    }

    console.log('\n' + '─'.repeat(80));
    console.log('\nSuggested fixes:');
    console.log('  - var(--primary) → #4f46e5 or var(--coral)');
    console.log('  - var(--background) → var(--surface)');
    console.log('  - var(--text) → var(--text-primary)');
    console.log('  - var(--color-*) → Use approved colors from style-guide.md');
    console.log('\nSee: docs/design/style-guide.md for approved variables\n');
  }

  // Known contrast pairs check
  console.log('\nContrast Ratio Reference:');
  console.log('─'.repeat(40));

  const contrastChecks = [
    { bg: '#ffffff', fg: '#0a1a2f', label: 'Light: surface + text-primary' },
    { bg: '#ffffff', fg: '#5a6b7f', label: 'Light: surface + text-muted' },
    { bg: '#121c2b', fg: '#eef3ff', label: 'Dark: surface + text-primary' },
    { bg: '#121c2b', fg: '#9fb0c8', label: 'Dark: surface + text-muted' },
    { bg: '#4f46e5', fg: '#ffffff', label: 'Purple button + white' },
    { bg: '#ff6f61', fg: '#ffffff', label: 'Coral + white (CAUTION)' },
    { bg: '#ff6f61', fg: '#0a1a2f', label: 'Coral + navy' },
  ];

  for (const check of contrastChecks) {
    const ratio = getContrastRatio(check.bg, check.fg);
    const rating = getWcagRating(ratio);
    const symbol = rating === 'FAIL' ? '✗' : '✓';
    console.log(`  ${symbol} ${check.label}: ${ratio.toFixed(1)}:1 (${rating})`);
  }

  console.log('\n');

  // Exit with error code if issues found
  process.exit(allErrors.length > 0 ? 1 : 0);
}

main();
