/**
 * Slack Report Notification Script
 * 
 * Reads the run summary JSON and sends a rich Slack message with:
 *   - Overall pass/fail status (excluding prerequisites)
 *   - Failed scenario names and tags
 *   - Failed step screenshots
 *   - HTML Extent report file upload
 *
 * Supports two modes:
 *   1. Slack Web API (Bot Token) — sends message + uploads files
 *      Requires: SLACK_BOT_TOKEN, SLACK_CHANNEL_ID
 *
 *   2. Incoming Webhook — sends message only (no file upload)
 *      Requires: SLACK_WEBHOOK_URL
 */

// Load .env file
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const https = require('https');

// ──────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────
const REPORT_PATH = path.join(process.cwd(), 'reports', 'extent', 'OptiKPI_V2.0_Smoke_Test.html');
const SUMMARY_PATH = path.join(process.cwd(), 'reports', 'run-summary.json');

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN || '';
const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID || '';
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || '';
const REPORT_URL = process.env.REPORT_URL || '';
const RUN_LABEL = process.env.RUN_LABEL || 'OptiKPI V2.0 Smoke Test';

// ──────────────────────────────────────────────
// Load run summary
// ──────────────────────────────────────────────
const loadSummary = () => {
  if (fs.existsSync(SUMMARY_PATH)) {
    try {
      const raw = fs.readFileSync(SUMMARY_PATH, 'utf8');
      return JSON.parse(raw);
    } catch (err) {
      console.warn(`[Slack] Warning: failed to parse run-summary.json: ${err.message}`);
    }
  }

  // Fallback: no summary file, return minimal data
  console.warn('[Slack] No run-summary.json found — using fallback.');
  return {
    status: 'unknown',
    totalScenarios: 0,
    passed: 0,
    failed: 0,
    duration: 'N/A',
    timestamp: new Date().toLocaleString(),
    failedScenarios: [],
    failedScreenshots: [],
  };
};

// ──────────────────────────────────────────────
// Build Slack Block Kit message
// ──────────────────────────────────────────────
const buildSlackMessage = (summary) => {
  const isAllPassed = summary.failed === 0 && summary.status !== 'unknown';
  const statusEmoji = isAllPassed ? '✅' : '❌';
  const statusText = isAllPassed ? 'ALL TESTS PASSED' : `${summary.failed} TEST(S) FAILED`;

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${statusEmoji} ${RUN_LABEL}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Status:*\n${statusText}` },
        { type: 'mrkdwn', text: `*Total Scenarios:*\n${summary.totalScenarios}` },
        { type: 'mrkdwn', text: `*Passed:*\n✅ ${summary.passed}` },
        { type: 'mrkdwn', text: `*Failed:*\n❌ ${summary.failed}` },
      ],
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Duration:*\n⏱ ${summary.duration}` },
        { type: 'mrkdwn', text: `*Run Time:*\n🕐 ${summary.timestamp}` },
      ],
    },
  ];

  // Add failed scenario details
  if (summary.failedScenarios && summary.failedScenarios.length > 0) {
    blocks.push({ type: 'divider' });
    blocks.push({
      type: 'header',
      text: {
        type: 'plain_text',
        text: '❌ Failed Scenarios',
        emoji: true,
      },
    });

    for (const scenario of summary.failedScenarios) {
      // Filter out generic tags like @SmokeTest, show only scenario-specific tags
      const specificTags = (scenario.tags || []).filter(t => t.toLowerCase() !== '@smoketest');
      const tagStr = specificTags.length > 0
        ? specificTags.map(t => `\`${t}\``).join(' ')
        : '_no tags_';

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${scenario.name}*\n🏷️ ${tagStr}`,
        },
      });
    }
  }

  // Add report link if available
  if (REPORT_URL) {
    blocks.push({ type: 'divider' });
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `📄 <${REPORT_URL}|View Full Report>`,
      },
    });
  }

  blocks.push({ type: 'divider' });
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `🕐 Report generated at ${new Date().toLocaleString()} | _Prerequisites excluded from counts_`,
      },
    ],
  });

  return blocks;
};

// ──────────────────────────────────────────────
// Send via Incoming Webhook (no file upload)
// ──────────────────────────────────────────────
const sendViaWebhook = (blocks) => {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      blocks,
      text: `${RUN_LABEL} — Test Report`,
    });

    const url = new URL(SLACK_WEBHOOK_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('[Slack] ✅ Message sent via webhook.');
          resolve();
        } else {
          console.error(`[Slack] ❌ Webhook returned ${res.statusCode}: ${body}`);
          reject(new Error(`Webhook failed: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (err) => {
      console.error(`[Slack] ❌ Webhook request error: ${err.message}`);
      reject(err);
    });

    req.write(payload);
    req.end();
  });
};

// ──────────────────────────────────────────────
// Send via Slack Web API (supports file upload)
// ──────────────────────────────────────────────
const sendViaWebAPI = async (blocks, summary) => {
  let WebClient;
  try {
    WebClient = require('@slack/web-api').WebClient;
  } catch (err) {
    console.error('[Slack] ❌ @slack/web-api is not installed.');
    console.error('[Slack]    Run: npm install @slack/web-api');
    process.exit(1);
  }

  const client = new WebClient(SLACK_BOT_TOKEN);

  try {
    // 1. Send the summary message
    const msgResult = await client.chat.postMessage({
      channel: SLACK_CHANNEL_ID,
      blocks,
      text: `${RUN_LABEL} — Test Report`,
    });

    if (msgResult.ok) {
      console.log('[Slack] ✅ Summary message sent.');
    }

    // 2. Upload the HTML report file
    if (fs.existsSync(REPORT_PATH)) {
      const fileContent = fs.readFileSync(REPORT_PATH);
      const fileName = path.basename(REPORT_PATH);

      const uploadResult = await client.filesUploadV2({
        channel_id: SLACK_CHANNEL_ID,
        file: fileContent,
        filename: fileName,
        title: `${RUN_LABEL} — Extent Report`,
        initial_comment: '📎 HTML Extent Report attached. Download and open in a browser to view.',
      });

      if (uploadResult.ok) {
        console.log('[Slack] ✅ Report file uploaded.');
      }
    } else {
      console.warn(`[Slack] ⚠ Report file not found: ${REPORT_PATH}`);
    }

    // 3. Upload failed screenshots (if any)
    if (summary.failedScreenshots && summary.failedScreenshots.length > 0) {
      console.log(`[Slack] Uploading ${summary.failedScreenshots.length} failure screenshot(s)...`);

      for (const screenshotPath of summary.failedScreenshots) {
        if (fs.existsSync(screenshotPath)) {
          const screenshotContent = fs.readFileSync(screenshotPath);
          const screenshotName = path.basename(screenshotPath);

          // Make the filename more readable
          const readableName = screenshotName
            .replace(/^\d+-\d+-/, '')  // Remove timestamp prefix
            .replace(/\.png$/, '')
            .replace(/_/g, ' ');

          try {
            await client.filesUploadV2({
              channel_id: SLACK_CHANNEL_ID,
              file: screenshotContent,
              filename: screenshotName,
              title: `🖼 ${readableName}`,
              initial_comment: `❌ Failure screenshot: *${readableName}*`,
            });
            console.log(`[Slack] ✅ Screenshot uploaded: ${screenshotName}`);
          } catch (err) {
            console.warn(`[Slack] ⚠ Failed to upload screenshot ${screenshotName}: ${err.message}`);
          }
        }
      }
    }
  } catch (err) {
    console.error(`[Slack] ❌ Web API error: ${err.message}`);
    if (err.data) console.error('[Slack]   Details:', JSON.stringify(err.data, null, 2));
    process.exit(1);
  }
};

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────
const main = async () => {
  const useWebAPI = SLACK_BOT_TOKEN && SLACK_CHANNEL_ID;
  const useWebhook = SLACK_WEBHOOK_URL;

  if (!useWebAPI && !useWebhook) {
    console.warn('[Slack] No Slack credentials found. Set either:');
    console.warn('  • SLACK_BOT_TOKEN + SLACK_CHANNEL_ID  (Web API mode — supports file upload)');
    console.warn('  • SLACK_WEBHOOK_URL                   (Webhook mode — message only)');
    process.exit(0);
  }

  // Load run summary (written by runner.js)
  const summary = loadSummary();
  console.log(`[Slack] Run summary: ${summary.totalScenarios} total, ${summary.passed} passed, ${summary.failed} failed`);

  if (summary.failedScenarios.length > 0) {
    console.log(`[Slack] Failed scenarios:`);
    summary.failedScenarios.forEach(s => {
      console.log(`  ❌ ${s.name} [${s.tags.join(', ')}] — ${s.feature}:${s.line}`);
    });
  }

  if (summary.failedScreenshots.length > 0) {
    console.log(`[Slack] Failed screenshots: ${summary.failedScreenshots.length} file(s)`);
  }

  // Build and send
  const blocks = buildSlackMessage(summary);

  if (useWebAPI) {
    console.log('[Slack] Sending via Web API (Bot Token)...');
    await sendViaWebAPI(blocks, summary);
  } else {
    console.log('[Slack] Sending via Incoming Webhook...');
    await sendViaWebhook(blocks);
  }

  console.log('[Slack] Done.');
};

main().catch((err) => {
  console.error(`[Slack] Unhandled error: ${err.message}`);
  process.exit(1);
});
