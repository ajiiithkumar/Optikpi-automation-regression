#!/usr/bin/env node
/**
 * Prints the campaign execution E2E result per case from the state folder
 * (data/e2e-state/cases/<caseId>.json): Passed / Failed / Pending / Blocked per phase, with campaign links.
 * Usage: npm run test:campaign-e2e:status
 */
const fs = require('fs');
const path = require('path');

const dir = process.env.E2E_STATE_DIR
    ? path.resolve(process.env.E2E_STATE_DIR)
    : path.join(process.cwd(), 'data', 'e2e-state');

const ALL_CASES = [
    ['REG-CAMP-E2E-01', 'Single launch - three users'],
    ['REG-CAMP-E2E-02', 'Recurring - re-enrollment disabled'],
    ['REG-CAMP-E2E-03', 'Event trigger - re-enrollment disabled'],
    ['REG-CAMP-E2E-04', 'Recurring - re-enrollment enabled'],
    ['REG-CAMP-E2E-05', 'Event trigger - re-enrollment enabled'],
    ['REG-CAMP-E2E-06', 'Single launch - 50% control group'],
    ['REG-CAMP-E2E-07', 'Single launch - two variants'],
];

const readJson = (file) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return undefined; } };
// Older single-file layout, used until the first run with per-case files migrates it.
const legacy = readJson(path.join(dir, 'campaign-e2e.json'));
const getCase = (id) => readJson(path.join(dir, 'cases', `${id}.json`)) || legacy?.cases?.[id];

const label = (s) => ({ passed: 'PASSED', failed: 'FAILED', pending: 'PENDING', blocked: 'BLOCKED' }[s] || 'NOT RUN');

console.log(`Campaign execution E2E status (${dir})\n`);
for (const [id, title] of ALL_CASES) {
    const c = getCase(id);
    if (!c) { console.log(`${id}  ${title}\n    NOT RUN\n`); continue; }
    const overall = c.phases.some((p) => p.status === 'failed') ? 'FAILED'
        : c.phases.some((p) => p.status === 'blocked') ? 'BLOCKED'
        : c.phases.some((p) => p.status === 'pending') ? 'PENDING' : 'PASSED';
    console.log(`${id}  ${title}  ->  ${overall}`);
    console.log(`    campaign: ${c.campaign?.name || '-'} ${c.campaign?.url || ''}`);
    console.log(`    users: ${(c.users || []).join(', ')}  events: ${(c.events || []).map((e) => e.eventId.slice(0, 8)).join(', ') || '-'}`);
    for (const p of c.phases) {
        console.log(`    - ${p.name.padEnd(8)} ${label(p.status)}`);
        if (p.observed) console.log(`        observed: ${p.observed}`);
    }
    console.log('');
}
