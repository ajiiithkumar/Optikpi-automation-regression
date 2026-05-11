'use strict';

/**
 * Slack report script — posts a pass/fail summary to Slack after a test run.
 *
 * Reads:  reports/run-summary.json  (written by runner.js)
 * Posts:  a Slack Block Kit message via Bot token + channel ID
 *
 * Required env vars:
 *   SLACK_BOT_TOKEN   — xoxb-... bot token with chat:write permission
 *   SLACK_CHANNEL_ID  — channel ID (e.g. C0AC6AV2LEM)
 *
 * Optional env vars:
 *   REPORT_URL   — link to the published HTML report artifact
 *   RUN_LABEL    — label for this run (e.g. "CI #42", "Nightly")
 */

try { require('dotenv').config(); } catch (_) {}

const fs   = require('fs');
const path = require('path');
const https = require('https');

const SUMMARY_FILE = path.join(process.cwd(), 'reports', 'run-summary.json');

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

// ── Build message ─────────────────────────────────────────────────────────────
const token      = process.env.SLACK_BOT_TOKEN;
const channelId  = process.env.SLACK_CHANNEL_ID;
const reportUrl  = process.env.REPORT_URL  || '';
const runLabel   = process.env.RUN_LABEL   || 'CI Run';

if (!token || !channelId) {
  console.log('[slack-report] SLACK_BOT_TOKEN or SLACK_CHANNEL_ID not set — skipping.');
  process.exit(0);
}

const isPassed  = summary.status === 'passed';
const statusEmoji = isPassed ? ':white_check_mark:' : ':x:';
const statusText  = isPassed ? 'PASSED' : 'FAILED';

const headerText = `${statusEmoji} *${runLabel}* — ${statusText}`;

const statsText = [
  `*Total:* ${summary.totalScenarios}`,
  `*Passed:* ${summary.passed}`,
  `*Failed:* ${summary.failed}`,
  `*Duration:* ${summary.duration}`,
  `*Time:* ${summary.timestamp}`,
].join('   |   ');

const blocks = [
  {
    type: 'section',
    text: { type: 'mrkdwn', text: headerText },
  },
  {
    type: 'section',
    text: { type: 'mrkdwn', text: statsText },
  },
];

// Failed scenario list (up to 10)
if (summary.failedScenarios && summary.failedScenarios.length > 0) {
  const shown = summary.failedScenarios.slice(0, 10);
  const lines = shown.map(s => `• ${s.name || s.feature}`).join('\n');
  const extra = summary.failedScenarios.length > 10
    ? `\n_…and ${summary.failedScenarios.length - 10} more. See report for details._`
    : '';
  blocks.push({
    type: 'section',
    text: { type: 'mrkdwn', text: `*Failed Scenarios:*\n${lines}${extra}` },
  });
}

// Report link button
if (reportUrl) {
  blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: { type: 'plain_text', text: 'View Report', emoji: true },
        url: reportUrl,
        style: isPassed ? 'primary' : 'danger',
      },
    ],
  });
}

blocks.push({ type: 'divider' });

// ── Post to Slack ─────────────────────────────────────────────────────────────
const payload = JSON.stringify({
  channel: channelId,
  blocks,
  text: `${runLabel} ${statusText} — ${summary.passed}/${summary.totalScenarios} scenarios passed`,
});

const options = {
  hostname: 'slack.com',
  path: '/api/chat.postMessage',
  method: 'POST',
  headers: {
    'Content-Type':  'application/json; charset=utf-8',
    'Authorization': `Bearer ${token}`,
    'Content-Length': Buffer.byteLength(payload),
  },
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', chunk => { body += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(body);
      if (json.ok) {
        console.log('[slack-report] Message posted successfully.');
      } else {
        console.error('[slack-report] Slack API error:', json.error);
        process.exit(1);
      }
    } catch (e) {
      console.error('[slack-report] Failed to parse Slack response:', e.message);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error('[slack-report] HTTP request failed:', err.message);
  process.exit(1);
});

req.write(payload);
req.end();
