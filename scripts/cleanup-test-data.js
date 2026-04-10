/**
 * Cleanup script — removes stale test entities from the OptiKPI app.
 *
 * Usage:
 *   node scripts/cleanup-test-data.js [--dry-run] [--max-age-hours=24]
 *   npm run cleanup
 *   npm run cleanup -- --dry-run
 *   npm run cleanup -- --max-age-hours=2
 *
 * Requires in .env:
 *   OPTIKPI_CLEANUP_EMAIL=your@email.com
 *   OPTIKPI_CLEANUP_PASSWORD=yourpassword
 *   OPTIKPI_CLEANUP_BASE_URL=https://demo.optikpi.com   (optional, defaults to demo)
 *
 * Deletes entities whose names match the auto-generated pattern:
 *   Audience-<timestamp>-<hrtime>
 *   Campaign-<timestamp>-<hrtime>
 *   Audience-<timestamp>-<hrtime>  (workflow titles reuse generateAudienceTitle)
 * and are older than --max-age-hours (default: 24h).
 */

'use strict';

const path = require('path');

try { require('dotenv').config(); } catch (_) {}

// ─── Config ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN      = args.includes('--dry-run');
const maxAgeArg    = args.find(a => a.startsWith('--max-age-hours='));
const MAX_AGE_MS   = (maxAgeArg ? parseInt(maxAgeArg.split('=')[1], 10) : 24) * 60 * 60 * 1000;
const BASE_URL     = (process.env.OPTIKPI_CLEANUP_BASE_URL || 'https://demo.optikpi.com').replace(/\/$/, '');
const EMAIL        = process.env.OPTIKPI_CLEANUP_EMAIL    || '';
const PASSWORD     = process.env.OPTIKPI_CLEANUP_PASSWORD || '';

// Pattern: Audience-1772026470834-108904... or Campaign-1772026034626-108468...
const STALE_PATTERN = /^(Audience|Campaign)-(\d{13,})-/;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const extractTimestamp = (title) => {
  const match = String(title || '').match(STALE_PATTERN);
  return match ? parseInt(match[2], 10) : null;
};

const isStale = (title) => {
  const ts = extractTimestamp(title);
  if (!ts) return false;
  return (Date.now() - ts) >= MAX_AGE_MS;
};

const log = (msg) => console.log(`[Cleanup] ${msg}`);
const warn = (msg) => console.warn(`[Cleanup] ⚠ ${msg}`);

// ─── API client ──────────────────────────────────────────────────────────────

let authToken = null;

async function apiRequest(method, endpoint, body) {
  const url = `${BASE_URL}/api${endpoint}`;
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${method} ${url} → ${res.status} ${res.statusText}: ${text}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function login() {
  log(`Logging in as ${EMAIL} at ${BASE_URL}...`);
  try {
    const data = await apiRequest('POST', '/auth/login', { email: EMAIL, password: PASSWORD });
    authToken = data?.token || data?.accessToken || data?.access_token || data?.data?.token || null;
    if (authToken) {
      log('Login successful (Bearer token obtained)');
      return;
    }
  } catch (err) {
    warn(`Bearer login failed: ${err.message}`);
  }

  // Fallback: try /auth/signin
  try {
    const data = await apiRequest('POST', '/auth/signin', { email: EMAIL, password: PASSWORD });
    authToken = data?.token || data?.accessToken || data?.access_token || data?.data?.token || null;
    if (authToken) {
      log('Login successful via /auth/signin');
      return;
    }
  } catch (err) {
    warn(`Signin fallback failed: ${err.message}`);
  }

  throw new Error(
    'Could not obtain auth token. Check OPTIKPI_CLEANUP_EMAIL / OPTIKPI_CLEANUP_PASSWORD ' +
    'and ensure the API endpoint is correct.'
  );
}

// ─── Entity fetchers ─────────────────────────────────────────────────────────

async function fetchAll(endpoint, nameField = 'name') {
  try {
    const data = await apiRequest('GET', endpoint);
    const items = Array.isArray(data) ? data
      : Array.isArray(data?.data) ? data.data
      : Array.isArray(data?.items) ? data.items
      : Array.isArray(data?.results) ? data.results
      : [];
    return items;
  } catch (err) {
    warn(`Could not fetch ${endpoint}: ${err.message}`);
    return [];
  }
}

// ─── Entity deleters ─────────────────────────────────────────────────────────

async function deleteEntity(endpoint, id, title) {
  if (DRY_RUN) {
    log(`  [dry-run] Would delete: "${title}" (id: ${id})`);
    return true;
  }
  try {
    await apiRequest('DELETE', `${endpoint}/${id}`);
    log(`  ✅ Deleted: "${title}" (id: ${id})`);
    return true;
  } catch (err) {
    warn(`  Failed to delete "${title}" (id: ${id}): ${err.message}`);
    return false;
  }
}

// ─── Cleanup per entity type ─────────────────────────────────────────────────

async function cleanupEntities(label, listEndpoint, deleteEndpoint, nameFields) {
  log(`\nFetching ${label}...`);
  const items = await fetchAll(listEndpoint);

  if (items.length === 0) {
    log(`  No ${label} found (endpoint may differ — check API docs)`);
    return { found: 0, stale: 0, deleted: 0 };
  }

  log(`  Found ${items.length} total ${label}`);

  const staleItems = items.filter(item => {
    const title = nameFields.map(f => item[f]).find(Boolean) || '';
    return isStale(title);
  });

  log(`  Stale (older than ${MAX_AGE_MS / 3600000}h): ${staleItems.length}`);

  let deleted = 0;
  for (const item of staleItems) {
    const title = nameFields.map(f => item[f]).find(Boolean) || String(item.id);
    const id = item.id || item._id;
    if (!id) {
      warn(`  No id found for "${title}" — skipping`);
      continue;
    }
    const ok = await deleteEntity(deleteEndpoint, id, title);
    if (ok) deleted++;
  }

  return { found: items.length, stale: staleItems.length, deleted };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const main = async () => {
  if (!EMAIL || !PASSWORD) {
    log('OPTIKPI_CLEANUP_EMAIL or OPTIKPI_CLEANUP_PASSWORD not set in .env');
    log('');
    log('To enable automatic cleanup, add to your .env:');
    log('  OPTIKPI_CLEANUP_EMAIL=your@email.com');
    log('  OPTIKPI_CLEANUP_PASSWORD=yourpassword');
    log('  OPTIKPI_CLEANUP_BASE_URL=https://demo.optikpi.com  (optional)');
    log('');
    log('Stale entity pattern:');
    log('  Audience-<timestamp>-<hrtime>  (e.g. Audience-1772026470834-...)');
    log('  Campaign-<timestamp>-<hrtime>');
    log(`Max age: ${MAX_AGE_MS / 3600000}h  |  Dry-run: ${DRY_RUN}`);
    process.exit(0);
  }

  log(`${ DRY_RUN ? '=== DRY RUN — no deletions will happen ===' : '=== Cleanup started ===' }`);
  log(`Base URL : ${BASE_URL}`);
  log(`Max age  : ${MAX_AGE_MS / 3600000}h`);
  log(`Pattern  : ${STALE_PATTERN}`);

  await login();

  // Try common OptiKPI REST API endpoint conventions
  // Adjust these paths to match your actual API if they differ
  const [audienceResult, campaignResult, workflowResult] = await Promise.all([
    cleanupEntities('Audiences', '/audiences',  '/audiences', ['name', 'title', 'audienceName']),
    cleanupEntities('Campaigns', '/campaigns',  '/campaigns', ['name', 'title', 'campaignName']),
    cleanupEntities('Workflows', '/workflows',  '/workflows', ['name', 'title', 'workflowName']),
  ]);

  log('\n' + '═'.repeat(50));
  log('  CLEANUP SUMMARY');
  log('═'.repeat(50));
  log(`  Audiences  — found: ${audienceResult.found}, stale: ${audienceResult.stale}, deleted: ${audienceResult.deleted}`);
  log(`  Campaigns  — found: ${campaignResult.found}, stale: ${campaignResult.stale}, deleted: ${campaignResult.deleted}`);
  log(`  Workflows  — found: ${workflowResult.found}, stale: ${workflowResult.stale}, deleted: ${workflowResult.deleted}`);
  log('═'.repeat(50));
  if (DRY_RUN) log('  (dry-run — nothing was deleted)');
  log('Done.\n');
};

main().catch(err => {
  console.error('[Cleanup] Fatal error:', err.message);
  process.exit(1);
});
