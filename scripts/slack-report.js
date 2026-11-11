'use strict';

/**
 * Slack report script — posts a rich pass/fail summary and uploads the
 * Extent HTML report as a file attachment to Slack after a test run.
 *
 * Reads:  reports/run-summary.json               (written by extent-adapter-wrapper.js)
 *         reports/extent/OptiKPI_V2.0_Smoke_Test.html  (Extent HTML report)
 *
 * Required env vars:
 *   SLACK_BOT_TOKEN   — xoxb-... bot token with chat:write + files:write permissions
 *   SLACK_CHANNEL_ID  — channel ID (e.g. C0AC6AV2LEM)
 *
 * Optional env vars:
 *   RUN_LABEL    — label for this run (e.g. "OptiKPI V2.0 Regression Test")
 *   HTML_REPORT  — Extent HTML report(s) to attach, comma-separated (default reports/extent/OptiKPI_V2.0_Smoke_Test.html);
 *                  the campaign E2E job sets reports/extent/Campaign_E2E.html
 */

try { require('dotenv').config(); } catch (_) {}

const fs   = require('fs');
const path = require('path');
const { WebClient } = require('@slack/web-api');

const SUMMARY_FILE = path.join(process.cwd(), 'reports', 'run-summary.json');
// HTML_REPORT may list several reports separated by commas (the workflow E2E run has one per batch).
const HTML_REPORTS = process.env.HTML_REPORT
  ? process.env.HTML_REPORT.split(',').map(p => p.trim()).filter(Boolean).map(p => path.resolve(p))
  : [path.join(process.cwd(), 'reports', 'extent', 'OptiKPI_V2.0_Smoke_Test.html')];

// ── Read run summary ──────────────────────────────────────────────────────────
let summary;
if (fs.existsSync(SUMMARY_FILE)) {
  try {
    summary = JSON.parse(fs.readFileSync(SUMMARY_FILE, 'utf8'));
  } catch (err) {
    console.warn('[slack-report] Warning: failed to parse run-summary.json:', err.message);
  }
}

if (!summary) {
  summary = {
    status: 'unknown',
    totalScenarios: 0,
    passed: 0,
    failed: 0,
    duration: 'N/A',
    failedScenarios: [],
    timestamp: new Date().toLocaleString(),
  };
}

// ── Config ────────────────────────────────────────────────────────────────────
const token     = process.env.SLACK_BOT_TOKEN;
const channelId = process.env.SLACK_CHANNEL_ID;
const runLabel  = process.env.RUN_LABEL || 'OptiKPI V2.0 Regression Test';

if (!token || !channelId) {
  console.log('[slack-report] SLACK_BOT_TOKEN or SLACK_CHANNEL_ID not set — skipping.');
  process.exit(0);
}

const client = new WebClient(token);

const isPassed    = summary.status === 'passed';
const statusLabel = isPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED';
const passedEmoji = ':white_check_mark:';
const failedEmoji = ':x:';
const clockEmoji  = ':clock3:';
const reportedAt  = `Report generated at ${summary.timestamp}`;

// ── Build Block Kit message ───────────────────────────────────────────────────
const blocks = [
  // Header
  {
    type: 'header',
    text: {
      type: 'plain_text',
      text: `${isPassed ? '✅' : '❌'} ${runLabel}`,
      emoji: true,
    },
  },
  // Status + Total
  {
    type: 'section',
    fields: [
      { type: 'mrkdwn', text: `*Status:*\n${statusLabel}` },
      { type: 'mrkdwn', text: `*Total Scenarios:*\n${summary.totalScenarios}` },
    ],
  },
  // Passed + Failed
  {
    type: 'section',
    fields: [
      { type: 'mrkdwn', text: `*Passed:*\n${passedEmoji} ${summary.passed}` },
      { type: 'mrkdwn', text: `*Failed:*\n${failedEmoji} ${summary.failed}` },
    ],
  },
  // Duration + Run Time
  {
    type: 'section',
    fields: [
      { type: 'mrkdwn', text: `*Duration:*\n${clockEmoji} ${summary.duration}` },
      { type: 'mrkdwn', text: `*Run Time:*\n${clockEmoji} ${summary.timestamp}` },
    ],
  },
  // Report generated at
  {
    type: 'context',
    elements: [
      { type: 'mrkdwn', text: `${clockEmoji} ${reportedAt}` },
    ],
  },
  { type: 'divider' },
];

// Failed scenario list (up to 10)
if (summary.failedScenarios && summary.failedScenarios.length > 0) {
  const shown = summary.failedScenarios.slice(0, 10);
  const lines = shown.map(s => `• ${s.name || s.feature}`).join('\n');
  const extra = summary.failedScenarios.length > 10
    ? `\n_…and ${summary.failedScenarios.length - 10} more. See attached report._`
    : '';
  blocks.push({
    type: 'section',
    text: { type: 'mrkdwn', text: `*Failed Scenarios:*\n${lines}${extra}` },
  });
  blocks.push({ type: 'divider' });
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  // 1. Post the summary message
  const msgResult = await client.chat.postMessage({
    channel: channelId,
    blocks,
    text: `${runLabel} — ${statusLabel} | ${summary.passed}/${summary.totalScenarios} passed | ${summary.duration}`,
  });

  if (!msgResult.ok) {
    console.error('[slack-report] Slack API error (chat.postMessage):', msgResult.error);
    process.exit(1);
  }
  console.log('[slack-report] Summary message posted successfully.');

  // 2. Upload each HTML report as a file attachment (if it exists)
  for (const [i, report] of HTML_REPORTS.entries()) {
    if (!fs.existsSync(report)) {
      console.warn('[slack-report] HTML report not found at:', report);
      continue;
    }
    const part = HTML_REPORTS.length > 1 ? `_part${i + 1}` : '';
    const uploadResult = await client.filesUploadV2({
      channel_id: channelId,
      file: fs.createReadStream(report),
      filename: `${runLabel.replace(/[^A-Za-z0-9.]+/g, '_')}${part}_${new Date().toISOString().replace(/[:.]/g, '-')}.html`,
      title: `${runLabel}${part ? ` (${path.basename(report, '.html')})` : ''} — Extent Report (${summary.timestamp})`,
      initial_comment: 'HTML Extent Report attached. Download and open in a browser to view.',
    });

    if (!uploadResult.ok) {
      console.warn('[slack-report] Warning: HTML report upload failed:', uploadResult.error);
    } else {
      console.log('[slack-report] HTML report uploaded successfully:', path.basename(report));
    }
  }
})().catch(err => {
  console.error('[slack-report] Fatal error:', err.message);
  process.exit(1);
});
