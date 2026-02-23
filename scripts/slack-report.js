/**
 * Slack Report Notification Script
 * 
 * Sends a test execution summary to Slack and optionally uploads
 * the HTML Extent report file.
 *
 * Supports two modes:
 *   1. Slack Web API (Bot Token) — sends message + uploads HTML file
 *      Requires: SLACK_BOT_TOKEN, SLACK_CHANNEL_ID
 *
 *   2. Incoming Webhook — sends message only (no file upload)
 *      Requires: SLACK_WEBHOOK_URL
 *
 * Optional env vars:
 *   REPORT_URL  — link to hosted report (e.g. from CI/CD)
 *   RUN_LABEL   — custom label for the run (e.g. "Production Smoke Test")
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ──────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────
const REPORT_PATH = path.join(process.cwd(), 'reports', 'extent', 'OptiKPI_V2.0_Smoke_Test.html');

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN || '';
const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID || '';
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || '';
const REPORT_URL = process.env.REPORT_URL || '';
const RUN_LABEL = process.env.RUN_LABEL || 'OptiKPI V2.0 Smoke Test';

// ──────────────────────────────────────────────
// Parse HTML report for metrics
// ──────────────────────────────────────────────
const parseReport = (htmlContent) => {
  const metrics = {
    totalScenarios: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 'N/A',
    startTime: 'N/A',
  };

  // Try to extract scenario counts from the Extent report HTML
  // Extent reports typically have test-count badges or summary sections

  // Look for pass/fail counts in the dashboard or summary section
  // Pattern: class="test-count" or data attributes with counts
  const passMatch = htmlContent.match(/pass[^"]*"[^>]*>\s*(\d+)/i)
    || htmlContent.match(/pass(?:ed)?\s*(?::|=)\s*(\d+)/i)
    || htmlContent.match(/<span[^>]*class="[^"]*label-success[^"]*"[^>]*>\s*(\d+)/i);

  const failMatch = htmlContent.match(/fail[^"]*"[^>]*>\s*(\d+)/i)
    || htmlContent.match(/fail(?:ed)?\s*(?::|=)\s*(\d+)/i)
    || htmlContent.match(/<span[^>]*class="[^"]*label-danger[^"]*"[^>]*>\s*(\d+)/i);

  const skipMatch = htmlContent.match(/skip[^"]*"[^>]*>\s*(\d+)/i)
    || htmlContent.match(/skip(?:ped)?\s*(?::|=)\s*(\d+)/i);

  // For merged runner report — parse the summary table
  const groupRows = htmlContent.match(/<tr class="(pass|fail|skip)">\s*<td>\d+<\/td>\s*<td>([^<]+)<\/td>\s*<td>([^<]+)<\/td>\s*<td>([^<]+)<\/td>/g);

  if (groupRows && groupRows.length > 0) {
    // This is the merged runner report — extract group-level results
    let passed = 0, failed = 0, skipped = 0;
    for (const row of groupRows) {
      if (row.includes('class="pass"')) passed++;
      else if (row.includes('class="fail"')) failed++;
      else if (row.includes('class="skip"')) skipped++;
    }
    metrics.passed = passed;
    metrics.failed = failed;
    metrics.skipped = skipped;
    metrics.totalScenarios = passed + failed + skipped;
    metrics._isGroupReport = true;
  } else {
    // Individual extent report — use regex matches
    if (passMatch) metrics.passed = parseInt(passMatch[1], 10);
    if (failMatch) metrics.failed = parseInt(failMatch[1], 10);
    if (skipMatch) metrics.skipped = parseInt(skipMatch[1], 10);
    metrics.totalScenarios = metrics.passed + metrics.failed + metrics.skipped;
  }

  // Try to extract duration
  const durationMatch = htmlContent.match(/(?:total\s+)?(?:time|duration)[^<]*?(\d+[hms]\s*\d*[ms]?\s*\d*s?)/i)
    || htmlContent.match(/(\d+m\s*\d+s)/i)
    || htmlContent.match(/(\d+:\d+:\d+)/);
  if (durationMatch) metrics.duration = durationMatch[1].trim();

  // Try to extract start time
  const timeMatch = htmlContent.match(/(\d{1,2}\/\d{1,2}\/\d{4},?\s*\d{1,2}:\d{2}:\d{2}\s*(?:AM|PM)?)/i);
  if (timeMatch) metrics.startTime = timeMatch[1];

  return metrics;
};

// ──────────────────────────────────────────────
// Build Slack Block Kit message
// ──────────────────────────────────────────────
const buildSlackMessage = (metrics) => {
  const isAllPassed = metrics.failed === 0;
  const statusEmoji = isAllPassed ? '✅' : '❌';
  const statusText = isAllPassed ? 'ALL TESTS PASSED' : `${metrics.failed} TEST(S) FAILED`;

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
        { type: 'mrkdwn', text: `*Total Scenarios:*\n${metrics.totalScenarios}` },
        { type: 'mrkdwn', text: `*Passed:*\n✅ ${metrics.passed}` },
        { type: 'mrkdwn', text: `*Failed:*\n❌ ${metrics.failed}` },
      ],
    },
  ];

  // Add skipped count if any
  if (metrics.skipped > 0) {
    blocks.push({
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Skipped:*\n⏭ ${metrics.skipped}` },
        { type: 'mrkdwn', text: `*Duration:*\n⏱ ${metrics.duration}` },
      ],
    });
  } else {
    blocks.push({
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Duration:*\n⏱ ${metrics.duration}` },
        { type: 'mrkdwn', text: `*Run Time:*\n🕐 ${metrics.startTime}` },
      ],
    });
  }

  // Add report link if available
  if (REPORT_URL) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `📄 <${REPORT_URL}|View Full Report>`,
      },
    });
  }

  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `🕐 Report generated at ${new Date().toLocaleString()}`,
      },
    ],
  });

  blocks.push({ type: 'divider' });

  return blocks;
};

// ──────────────────────────────────────────────
// Send via Incoming Webhook (no file upload)
// ──────────────────────────────────────────────
const sendViaWebhook = (blocks) => {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      blocks,
      text: `${RUN_LABEL} — Test Report`, // Fallback text
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
const sendViaWebAPI = async (blocks) => {
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
      text: `${RUN_LABEL} — Test Report`, // Fallback text
    });

    if (msgResult.ok) {
      console.log('[Slack] ✅ Summary message sent.');
    }

    // 2. Upload the HTML report file (if it exists)
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
      console.warn('[Slack]   Skipping file upload.');
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
  // Determine which mode to use
  const useWebAPI = SLACK_BOT_TOKEN && SLACK_CHANNEL_ID;
  const useWebhook = SLACK_WEBHOOK_URL;

  if (!useWebAPI && !useWebhook) {
    console.warn('[Slack] No Slack credentials found. Set either:');
    console.warn('  • SLACK_BOT_TOKEN + SLACK_CHANNEL_ID  (Web API mode — supports file upload)');
    console.warn('  • SLACK_WEBHOOK_URL                   (Webhook mode — message only)');
    process.exit(0);
  }

  // Parse the report
  let metrics;
  if (fs.existsSync(REPORT_PATH)) {
    console.log(`[Slack] Parsing report: ${REPORT_PATH}`);
    const html = fs.readFileSync(REPORT_PATH, 'utf8');
    metrics = parseReport(html);
    console.log(`[Slack] Metrics: ${metrics.totalScenarios} total, ${metrics.passed} passed, ${metrics.failed} failed, ${metrics.skipped} skipped`);
  } else {
    console.warn(`[Slack] Report file not found: ${REPORT_PATH}`);
    metrics = {
      totalScenarios: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 'N/A',
      startTime: 'N/A',
    };
  }

  // Build the Slack message blocks
  const blocks = buildSlackMessage(metrics);

  // Send to Slack
  if (useWebAPI) {
    console.log('[Slack] Sending via Web API (Bot Token)...');
    await sendViaWebAPI(blocks);
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
