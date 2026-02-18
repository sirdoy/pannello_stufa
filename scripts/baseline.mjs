#!/usr/bin/env node
/**
 * Baseline capture and comparison script for performance phases.
 *
 * Usage:
 *   PHASE=70 node scripts/baseline.mjs                        # capture bundle baseline
 *   PHASE=70 node scripts/baseline.mjs --lighthouse URL       # capture with Lighthouse
 *   PHASE=71 node scripts/baseline.mjs --compare              # compare vs phase 70
 *   PHASE=71 node scripts/baseline.mjs --compare --ref 69     # compare vs a specific phase
 *
 * The script reads .next/build-manifest.json (produced by `npm run build`) to extract
 * per-route JS chunk lists, then reads the actual file sizes from .next/static/.
 * Results are saved to .baseline/phase-{PHASE}.json.
 *
 * Dependencies: Node.js built-ins only (fs, path, child_process, url).
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// ── CLI argument parsing ───────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Bundle baseline capture and comparison tool.

Usage:
  PHASE=<n> node scripts/baseline.mjs [options]

Options:
  --compare              Compare current PHASE against reference baseline
  --ref <n>              Reference phase number (default: 70)
  --lighthouse <url>     Also capture Lighthouse metrics for the given URL
  --help, -h             Show this help message

Examples:
  PHASE=70 node scripts/baseline.mjs
  PHASE=70 node scripts/baseline.mjs --lighthouse http://localhost:3000
  PHASE=71 node scripts/baseline.mjs --compare
  PHASE=72 node scripts/baseline.mjs --compare --ref 71
`);
  process.exit(0);
}

const PHASE = process.env.PHASE;
if (!PHASE) {
  console.error('Error: PHASE environment variable is required (e.g. PHASE=70 node scripts/baseline.mjs)');
  process.exit(1);
}

const COMPARE_MODE = args.includes('--compare');
const LIGHTHOUSE_IDX = args.indexOf('--lighthouse');
const LIGHTHOUSE_URL = LIGHTHOUSE_IDX !== -1 ? args[LIGHTHOUSE_IDX + 1] : null;
const REF_IDX = args.indexOf('--ref');
const REF_PHASE = REF_IDX !== -1 ? args[REF_IDX + 1] : '70';

// ── File paths ─────────────────────────────────────────────────────────────────

const BUILD_MANIFEST = path.join(PROJECT_ROOT, '.next', 'build-manifest.json');
const BASELINE_DIR = path.join(PROJECT_ROOT, '.baseline');
const SNAPSHOT_PATH = path.join(BASELINE_DIR, `phase-${PHASE}.json`);
const REF_SNAPSHOT_PATH = path.join(BASELINE_DIR, `phase-${REF_PHASE}.json`);

// ── Utility helpers ────────────────────────────────────────────────────────────

/**
 * Format bytes as a human-readable string (e.g. "123.4 kB").
 */
function formatBytes(bytes) {
  if (bytes === null || bytes === undefined) return 'n/a';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Format a signed delta for display (e.g. "+12.3 kB" or "-5.0 kB").
 */
function formatDelta(delta) {
  if (delta === null || delta === undefined) return 'n/a';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${formatBytes(delta)}`;
}

/**
 * Get the size of a file in .next/static/. Returns 0 if the file is not found.
 * Chunk paths from build-manifest.json look like "static/chunks/foo.js".
 */
function getChunkSize(chunkRelPath) {
  // chunkRelPath: e.g. "static/chunks/pages/_app-abc123.js"
  const fullPath = path.join(PROJECT_ROOT, '.next', chunkRelPath);
  try {
    return fs.statSync(fullPath).size;
  } catch {
    // Some chunks listed in the manifest may not exist (e.g. edge/deno paths).
    return 0;
  }
}

// ── Bundle capture ─────────────────────────────────────────────────────────────

/**
 * Read .next/build-manifest.json and compute per-route First Load JS totals.
 * Returns { routes, shared, totalFirstLoad }.
 */
function captureBundleSizes() {
  if (!fs.existsSync(BUILD_MANIFEST)) {
    console.error(`Error: ${BUILD_MANIFEST} not found. Run 'npm run build' first.`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(BUILD_MANIFEST, 'utf8'));

  // pages is the key in build-manifest for App Router and Pages Router routes.
  // App Router also uses "pages" keyed by route segment.
  const pages = manifest.pages || {};

  // Collect all chunks and how many routes reference each one.
  const chunkRouteCount = {};
  for (const chunks of Object.values(pages)) {
    for (const chunk of chunks) {
      chunkRouteCount[chunk] = (chunkRouteCount[chunk] || 0) + 1;
    }
  }

  // A "shared" chunk is one referenced by more than one route.
  const totalRoutes = Object.keys(pages).length;
  const sharedChunks = new Set(
    Object.entries(chunkRouteCount)
      .filter(([, count]) => count > 1 || count === totalRoutes)
      .map(([chunk]) => chunk)
  );

  // Per-route size: sum of unique (non-shared) chunk sizes for this route.
  const routes = {};
  let sharedTotal = 0;

  // Compute shared size once.
  for (const chunk of sharedChunks) {
    sharedTotal += getChunkSize(chunk);
  }

  for (const [route, chunks] of Object.entries(pages)) {
    let routeSize = 0;
    for (const chunk of chunks) {
      if (!sharedChunks.has(chunk)) {
        routeSize += getChunkSize(chunk);
      }
    }
    routes[route] = routeSize;
  }

  // totalFirstLoad = route-specific + shared
  const totalFirstLoad = {};
  for (const [route, size] of Object.entries(routes)) {
    totalFirstLoad[route] = size + sharedTotal;
  }

  return { routes, shared: sharedTotal, totalFirstLoad };
}

// ── Lighthouse capture ─────────────────────────────────────────────────────────

/**
 * Run Lighthouse and return key metrics, or null on failure.
 */
function captureLighthouse(url) {
  console.log(`Running Lighthouse against ${url}...`);
  try {
    const output = execSync(
      `npx lighthouse "${url}" --output=json --quiet --chrome-flags='--headless --no-sandbox'`,
      { encoding: 'utf8', timeout: 120_000 }
    );
    const report = JSON.parse(output);
    const cats = report.categories || {};
    const audits = report.audits || {};

    return {
      performance: Math.round((cats.performance?.score ?? 0) * 100),
      lcp: Math.round(audits['largest-contentful-paint']?.numericValue ?? 0),
      fcp: Math.round(audits['first-contentful-paint']?.numericValue ?? 0),
      cls: Number((audits['cumulative-layout-shift']?.numericValue ?? 0).toFixed(3)),
      inp: Math.round(audits['interaction-to-next-paint']?.numericValue ?? 0),
      ttfb: Math.round(audits['server-response-time']?.numericValue ?? 0),
    };
  } catch (err) {
    console.warn(`Warning: Lighthouse failed — ${err.message}. Continuing with lighthouse: null.`);
    return null;
  }
}

// ── Comparison display ─────────────────────────────────────────────────────────

/**
 * Print a formatted delta table comparing two baseline snapshots.
 */
function printComparison(ref, current) {
  console.log(`\nComparison: Phase ${ref.phase} → Phase ${current.phase}\n`);

  const refRoutes = ref.bundle?.totalFirstLoad ?? {};
  const curRoutes = current.bundle?.totalFirstLoad ?? {};
  const allRoutes = new Set([...Object.keys(refRoutes), ...Object.keys(curRoutes)]);

  // Column widths
  const COL_ROUTE = 30;
  const COL_REF = 12;
  const COL_CUR = 12;
  const COL_DELTA = 12;
  const COL_PCT = 8;

  const pad = (str, len, right = false) => {
    const s = String(str);
    return right ? s.padStart(len) : s.padEnd(len);
  };

  const header = [
    pad('Route', COL_ROUTE),
    pad(`Phase ${ref.phase}`, COL_REF, true),
    pad(`Phase ${current.phase}`, COL_CUR, true),
    pad('Delta', COL_DELTA, true),
    pad('%', COL_PCT, true),
  ].join(' | ');

  const separator = '-'.repeat(header.length);

  console.log('Bundle Sizes (First Load JS):');
  console.log(separator);
  console.log(header);
  console.log(separator);

  const sorted = [...allRoutes].sort();
  for (const route of sorted) {
    const refSize = refRoutes[route] ?? null;
    const curSize = curRoutes[route] ?? null;
    const delta = refSize !== null && curSize !== null ? curSize - refSize : null;
    const pct = delta !== null && refSize ? ((delta / refSize) * 100).toFixed(1) + '%' : 'n/a';
    const pctSign = delta !== null && delta > 0 ? '+' : '';

    console.log([
      pad(route, COL_ROUTE),
      pad(formatBytes(refSize), COL_REF, true),
      pad(formatBytes(curSize), COL_CUR, true),
      pad(formatDelta(delta), COL_DELTA, true),
      pad(delta !== null ? `${pctSign}${pct}` : 'n/a', COL_PCT, true),
    ].join(' | '));
  }

  console.log(separator);

  // Shared chunks
  const refShared = ref.bundle?.shared ?? null;
  const curShared = current.bundle?.shared ?? null;
  const sharedDelta = refShared !== null && curShared !== null ? curShared - refShared : null;
  const sharedPct = sharedDelta !== null && refShared ? ((sharedDelta / refShared) * 100).toFixed(1) + '%' : 'n/a';
  const sharedSign = sharedDelta !== null && sharedDelta > 0 ? '+' : '';
  console.log([
    pad('(shared chunks)', COL_ROUTE),
    pad(formatBytes(refShared), COL_REF, true),
    pad(formatBytes(curShared), COL_CUR, true),
    pad(formatDelta(sharedDelta), COL_DELTA, true),
    pad(sharedDelta !== null ? `${sharedSign}${sharedPct}` : 'n/a', COL_PCT, true),
  ].join(' | '));

  // Lighthouse comparison (if available)
  if (ref.lighthouse && current.lighthouse) {
    const lh1 = ref.lighthouse;
    const lh2 = current.lighthouse;
    console.log('\nLighthouse Metrics:');
    console.log(separator);

    const metrics = [
      { key: 'performance', label: 'Performance', unit: '' },
      { key: 'lcp', label: 'LCP (ms)', unit: '' },
      { key: 'fcp', label: 'FCP (ms)', unit: '' },
      { key: 'cls', label: 'CLS', unit: '' },
      { key: 'inp', label: 'INP (ms)', unit: '' },
      { key: 'ttfb', label: 'TTFB (ms)', unit: '' },
    ];

    for (const { key, label } of metrics) {
      const v1 = lh1[key] ?? null;
      const v2 = lh2[key] ?? null;
      const d = v1 !== null && v2 !== null ? v2 - v1 : null;
      const p = d !== null && v1 ? ((d / v1) * 100).toFixed(1) + '%' : 'n/a';
      const dSign = d !== null && d > 0 ? '+' : '';
      console.log([
        pad(label, COL_ROUTE),
        pad(v1 ?? 'n/a', COL_REF, true),
        pad(v2 ?? 'n/a', COL_CUR, true),
        pad(d !== null ? `${dSign}${d}` : 'n/a', COL_DELTA, true),
        pad(d !== null ? `${dSign}${p}` : 'n/a', COL_PCT, true),
      ].join(' | '));
    }
  }

  console.log('');
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  if (COMPARE_MODE) {
    // Comparison mode: load ref and current snapshots, print delta table.
    if (!fs.existsSync(REF_SNAPSHOT_PATH)) {
      console.error(`Error: Reference baseline not found at ${REF_SNAPSHOT_PATH}`);
      console.error(`Run "PHASE=${REF_PHASE} node scripts/baseline.mjs" first to capture the reference.`);
      process.exit(1);
    }

    const ref = JSON.parse(fs.readFileSync(REF_SNAPSHOT_PATH, 'utf8'));

    if (!fs.existsSync(SNAPSHOT_PATH)) {
      console.error(`Error: Current phase baseline not found at ${SNAPSHOT_PATH}`);
      console.error(`Run "PHASE=${PHASE} node scripts/baseline.mjs" first to capture this phase's baseline.`);
      process.exit(1);
    }

    const current = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
    printComparison(ref, current);
    return;
  }

  // Capture mode: collect bundle sizes (and optionally Lighthouse) and write snapshot.
  console.log(`Capturing Phase ${PHASE} baseline...`);

  const bundle = captureBundleSizes();
  console.log(`  Bundle captured: ${Object.keys(bundle.routes).length} routes`);
  console.log(`  Shared chunks: ${formatBytes(bundle.shared)}`);

  let lighthouse = null;
  if (LIGHTHOUSE_URL) {
    lighthouse = captureLighthouse(LIGHTHOUSE_URL);
    if (lighthouse) {
      console.log(`  Lighthouse performance: ${lighthouse.performance}`);
    }
  }

  const snapshot = {
    phase: PHASE,
    timestamp: new Date().toISOString(),
    bundle,
    lighthouse,
  };

  fs.mkdirSync(BASELINE_DIR, { recursive: true });
  fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2), 'utf8');

  console.log(`\nBaseline saved to ${SNAPSHOT_PATH}`);

  // Print a quick summary table.
  console.log('\nPer-route First Load JS:');
  const routes = Object.entries(bundle.totalFirstLoad).sort(([a], [b]) => a.localeCompare(b));
  for (const [route, size] of routes) {
    console.log(`  ${route.padEnd(35)} ${formatBytes(size)}`);
  }
  console.log(`  ${'(shared chunks)'.padEnd(35)} ${formatBytes(bundle.shared)}`);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
