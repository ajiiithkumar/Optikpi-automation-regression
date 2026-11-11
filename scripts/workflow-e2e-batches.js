'use strict';

/**
 * Workflow E2E in batches (CI and local): runs features/e2e/workflow-execution.feature three cases at a time,
 * so every Verify starts within minutes of its workflow going live (timer and edit cases depend on that).
 * After the batches it deletes the shared audiences this run created and merges the batch summaries into
 * reports/run-summary.json for scripts/slack-report.js.
 *
 * Usage: node scripts/workflow-e2e-batches.js            (all batches)
 *        node scripts/workflow-e2e-batches.js 1 3        (only batches 1 and 3)
 * Env:   E2E_STATE_DIR (default data/workflow-e2e-state), PARALLEL_THREADS (default 4), BASE_URL via .env
 * Exit:  1 when any batch or the cleanup failed.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const BATCHES = [
    ['01', '02', '03'],
    ['04', '05', '06'],
    ['07', '08', '09'],
];

const root = process.cwd();
const reportsDir = path.join(root, 'reports');
const summaryFile = path.join(reportsDir, 'run-summary.json');
const stateDir = process.env.E2E_STATE_DIR || 'data/workflow-e2e-state';
const threads = process.env.PARALLEL_THREADS || '4';
const cucumber = path.join(root, 'node_modules', '@cucumber', 'cucumber', 'bin', 'cucumber.js');
const only = process.argv.slice(2).map(Number).filter(Boolean);
const startedAt = new Date().toISOString();

const tagsFor = (cases) => `@WorkflowE2E and (${cases.map((c) => `@REG-WF-E2E-${c} or @REG-WF-E2E-${c}-VERIFY`).join(' or ')})`;

function run(label, tags, env) {
    console.log(`\n[workflow-e2e] ${label}: ${tags}`);
    const res = spawnSync(process.execPath, [cucumber, '-c', 'config/cucumber.js', 'features/e2e/workflow-execution.feature', '--retry', '0', '--tags', tags], {
        stdio: 'inherit',
        env: { ...process.env, E2E_STATE_DIR: stateDir, PARALLEL_THREADS: threads, ...env },
    });
    return res.status === 0;
}

function readSummary() {
    try { return JSON.parse(fs.readFileSync(summaryFile, 'utf8')); } catch { return undefined; }
}

const summaries = [];
const htmlReports = [];
let ok = true;

BATCHES.forEach((cases, i) => {
    const n = i + 1;
    if (only.length && !only.includes(n)) return;
    const html = `reports/extent/Workflow_E2E_batch${n}.html`;
    // A finished run's lock is stale; remove it so the next batch is not mistaken for a second run.
    fs.rmSync(path.join(root, stateDir, 'run.lock'), { force: true });
    const passed = run(`Batch ${n} (WF-${cases.join(', WF-')})`, tagsFor(cases), {
        E2E_RUN_MODE: 'full',
        EXTENT_REPORT_PATH: html,
        JSON_REPORT_PATH: `reports/json/workflow-e2e-batch${n}.json`,
    });
    ok = ok && passed;
    const s = readSummary();
    if (s) {
        summaries.push(s);
        fs.copyFileSync(summaryFile, path.join(reportsDir, `run-summary.workflow-batch${n}.json`));
    }
    htmlReports.push(html);
});

// Delete the shared audiences created by this run (CI starts with an empty state, so none are reused later).
fs.rmSync(path.join(root, stateDir, 'run.lock'), { force: true });
const cleaned = run('Cleanup', '@WorkflowE2E-Cleanup', {
    E2E_CLEANUP_SINCE: startedAt,
    PARALLEL_THREADS: '1',
    EXTENT_REPORT_PATH: 'reports/extent/Workflow_E2E_cleanup.html',
    JSON_REPORT_PATH: 'reports/json/workflow-e2e-cleanup.json',
});
ok = ok && cleaned;

// One summary for the Slack report: totals of all batches (the cleanup run is not a test case).
const ms = summaries.reduce((t, s) => t + (s.durationMs || 0), 0);
const merged = {
    status: summaries.every((s) => s.status === 'passed') && summaries.length ? 'passed' : 'failed',
    totalScenarios: summaries.reduce((t, s) => t + (s.totalScenarios || 0), 0),
    passed: summaries.reduce((t, s) => t + (s.passed || 0), 0),
    failed: summaries.reduce((t, s) => t + (s.failed || 0), 0),
    duration: `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`,
    durationMs: ms,
    timestamp: new Date().toLocaleString(),
    failedScenarios: summaries.flatMap((s) => s.failedScenarios || []),
    failedScreenshots: summaries.flatMap((s) => s.failedScreenshots || []),
};
fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(summaryFile, JSON.stringify(merged, null, 2));
fs.writeFileSync(path.join(reportsDir, 'workflow-e2e-html-reports.txt'), htmlReports.join(','));
console.log(`\n[workflow-e2e] ${merged.passed}/${merged.totalScenarios} scenarios passed; audience cleanup ${cleaned ? 'done' : 'FAILED'}`);
process.exit(ok ? 0 : 1);
