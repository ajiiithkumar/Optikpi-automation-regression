const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load .env file
try { require('dotenv').config(); } catch (_) {}

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────
const EXTENT_DIR = 'reports/extent';
const EXTENT_HTML = path.join(EXTENT_DIR, 'OptiKPI_V2.0_Smoke_Test.html');
const PARALLEL_CONFIG_PATH = path.join('config', 'parallel-run-config.json');
const RERUN_FILE = path.join('reports', 'rerun.txt');
const RUN_SUMMARY_FILE = path.join('reports', 'run-summary.json');
const MAX_RETRIES = 1;  // Number of times to retry failed scenarios

const CLEAN_TARGETS = [
  EXTENT_DIR,
  'reports/screenshots',
  'reports/json',
  RERUN_FILE,
  RUN_SUMMARY_FILE,
  'data/.user-locks',
  'data/auth'
];

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
const removePath = (relativePath) => {
  const fullPath = path.join(process.cwd(), relativePath);
  try {
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    }
  } catch (err) {
    console.warn(`[Runner] Warning: failed to remove ${fullPath}: ${err.message}`);
  }
};

const clean = () => {
  CLEAN_TARGETS.forEach(removePath);
};

const run = (command, args, env = {}) =>
  spawnSync(command, args, {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...env }
  });

const pad = (str, len) => String(str).padEnd(len);

const formatDuration = (ms) => {
  if (ms < 1000) return `${ms}ms`;
  const secs = (ms / 1000).toFixed(1);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(ms / 60000);
  const remSecs = ((ms % 60000) / 1000).toFixed(0);
  return `${mins}m ${remSecs}s`;
};

// ──────────────────────────────────────────────
// Retry failed scenarios
// ──────────────────────────────────────────────
const retryFailedScenarios = (reportPath, parallelCount, extraArgs = []) => {
  const rerunFullPath = path.join(process.cwd(), RERUN_FILE);
  if (!fs.existsSync(rerunFullPath)) {
    console.log('[Runner] No rerun file found — nothing to retry.');
    return { retried: false, status: 1 };
  }

  const rerunContent = fs.readFileSync(rerunFullPath, 'utf8').trim();
  if (!rerunContent) {
    console.log('[Runner] Rerun file is empty — nothing to retry.');
    return { retried: false, status: 1 };
  }

  // Parse failed scenario paths (e.g., "features\audience.feature:53")
  const failedScenarios = rerunContent.split('\n').filter(line => line.trim());
  console.log(`\n[Runner] 🔄 RETRYING ${failedScenarios.length} failed scenario(s)...`);
  failedScenarios.forEach(s => console.log(`  → ${s}`));
  console.log();

  // Clean up rerun file before retry
  try { fs.unlinkSync(rerunFullPath); } catch (_) {}

  // Build retry args WITHOUT config/cucumber.js to avoid loading all feature paths
  // Pass only the failed scenario paths + required setup
  const retryCucumberArgs = [
    'cucumber-js',
    '--require-module', 'ts-node/register',
    '--require', 'src/steps/**/*.ts',
    '--require', 'src/support/**/*.ts',
    '--require', 'src/utils/**/*.ts',
    '--format', 'progress',
    `--format`, `./src/support/reporting/extent-adapter-wrapper.js:${reportPath}`,
    `--format`, `rerun:${RERUN_FILE}`,
    '--parallel', '1',
    ...extraArgs,
    ...failedScenarios,   // ONLY the failed scenario paths (e.g., features/audience.feature:53)
  ];

  const retryResult = run('npx', retryCucumberArgs, { EXTENT_REPORT_PATH: reportPath });
  const retryStatus = typeof retryResult.status === 'number' ? retryResult.status : 1;

  if (retryStatus === 0) {
    console.log('[Runner] ✅ RETRY PASSED — all previously failed scenarios now pass.');
  } else {
    console.log('[Runner] ❌ RETRY FAILED — some scenarios still failing.');
  }

  return { retried: true, status: retryStatus };
};

// ──────────────────────────────────────────────
// Write run summary JSON for Slack
// ──────────────────────────────────────────────
const writeRunSummary = (mainStatus, mainDuration, rerunFile) => {
  const summaryPath = path.join(process.cwd(), RUN_SUMMARY_FILE);
  const screenshotDir = path.join(process.cwd(), 'reports', 'screenshots');

  // Parse failed scenarios from rerun file
  const failedScenarios = [];
  const rerunFullPath = path.join(process.cwd(), rerunFile || RERUN_FILE);
  if (mainStatus !== 0 && fs.existsSync(rerunFullPath)) {
    const rerunContent = fs.readFileSync(rerunFullPath, 'utf8').trim();
    const rerunLines = rerunContent.split('\n').filter(l => l.trim());

    for (const line of rerunLines) {
      // Format: features\campaign.feature:51
      const [featurePath, lineNum] = line.trim().split(':');
      const normalizedPath = featurePath.replace(/\\/g, '/');
      const fullFeaturePath = path.join(process.cwd(), normalizedPath);

      let scenarioName = 'Unknown Scenario';
      let tags = [];

      // Parse the feature file to extract scenario name and tags
      if (fs.existsSync(fullFeaturePath)) {
        const featureLines = fs.readFileSync(fullFeaturePath, 'utf8').split('\n');
        const targetLine = parseInt(lineNum, 10) - 1;
        if (targetLine >= 0 && targetLine < featureLines.length) {
          // Find the scenario line
          const scenarioLine = featureLines[targetLine].trim();
          const scenarioMatch = scenarioLine.match(/Scenario(?:\s+Outline)?:\s*(.+)/i);
          if (scenarioMatch) {
            scenarioName = scenarioMatch[1].trim();
          }

          // Look backward for tags
          for (let i = targetLine - 1; i >= 0; i--) {
            const prevLine = featureLines[i].trim();
            if (prevLine.startsWith('@')) {
              tags = prevLine.match(/@[\w-]+/g) || [];
              break;
            }
            if (prevLine && !prevLine.startsWith('#')) break;
          }
        }
      }

      failedScenarios.push({
        feature: normalizedPath,
        line: parseInt(lineNum, 10),
        name: scenarioName,
        tags,
      });
    }
  }

  // Collect failed screenshots
  const failedScreenshots = [];
  if (fs.existsSync(screenshotDir)) {
    const files = fs.readdirSync(screenshotDir);
    for (const file of files) {
      if (file.includes('FAILED')) {
        failedScreenshots.push(path.join(screenshotDir, file));
      }
    }
  }

  // Count scenarios from the Extent report (main run only, not prereqs)
  let totalScenarios = 0, passed = 0, failed = 0;
  const reportPath = path.join(process.cwd(), EXTENT_HTML);
  if (fs.existsSync(reportPath)) {
    const html = fs.readFileSync(reportPath, 'utf8');
    // Try to extract scenario counts from Extent report
    const passMatch = html.match(/pass[^"]*"[^>]*>\s*(\d+)/i)
      || html.match(/<span[^>]*class="[^"]*label-success[^"]*"[^>]*>\s*(\d+)/i);
    const failMatch = html.match(/fail[^"]*"[^>]*>\s*(\d+)/i)
      || html.match(/<span[^>]*class="[^"]*label-danger[^"]*"[^>]*>\s*(\d+)/i);
    if (passMatch) passed = parseInt(passMatch[1], 10);
    if (failMatch) failed = parseInt(failMatch[1], 10);
    totalScenarios = passed + failed;
  }

  const summary = {
    status: mainStatus === 0 ? 'passed' : 'failed',
    totalScenarios,
    passed,
    failed,
    duration: formatDuration(mainDuration),
    durationMs: mainDuration,
    timestamp: new Date().toLocaleString(),
    failedScenarios,
    failedScreenshots,
  };

  try {
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
    console.log(`[Runner] Run summary written to: ${RUN_SUMMARY_FILE}`);
  } catch (err) {
    console.warn(`[Runner] Warning: failed to write run summary: ${err.message}`);
  }

  return summary;
};

// ──────────────────────────────────────────────
// Extent report setup
// ──────────────────────────────────────────────
const setupExtentReport = () => {
  const extentDirPath = path.join(process.cwd(), EXTENT_DIR);
  if (!fs.existsSync(extentDirPath)) {
    fs.mkdirSync(extentDirPath, { recursive: true });
  }

  const extentConfig = {
    documentTitle: 'Optikpi V2.0 Smoke Test',
    reportName: `Optikpi V2.0 Smoke Test  ${new Date().toLocaleString()}`,
    theme: 'standard',
    encoding: 'utf-8',
    timelineEnabled: true
  };

  try {
    const configPath = path.join(process.cwd(), 'extent-config.json');
    fs.writeFileSync(configPath, JSON.stringify(extentConfig, null, 2), 'utf8');
  } catch (err) {
    console.warn(`[Runner] Warning: failed to write extent-config.json: ${err.message}`);
  }
};

// ──────────────────────────────────────────────
// Slack notification
// ──────────────────────────────────────────────
const sendSlackNotification = () => {
  if (!process.env.SLACK_WEBHOOK_URL && !process.env.SLACK_BOT_TOKEN) return;
  console.log('[Runner] Sending report summary to Slack...');
  const slackScript = path.join(process.cwd(), 'scripts', 'slack-report.js');
  if (fs.existsSync(slackScript)) {
    const result = spawnSync('node', [slackScript], {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        REPORT_URL: process.env.REPORT_URL || '',
        RUN_LABEL: process.env.RUN_LABEL || ''
      }
    });
    if (result.status !== 0) {
      console.warn('[Runner] Slack notification failed (non-zero exit).');
    }
  }
};

// ──────────────────────────────────────────────
// Load parallel-run config
// ──────────────────────────────────────────────
const loadParallelConfig = () => {
  const fullPath = path.join(process.cwd(), PARALLEL_CONFIG_PATH);
  if (!fs.existsSync(fullPath)) {
    console.error(`[Runner] Parallel config not found: ${fullPath}`);
    process.exit(1);
  }
  try {
    const raw = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[Runner] Failed to parse parallel config: ${err.message}`);
    process.exit(1);
  }
};

// ──────────────────────────────────────────────
// Build tag expression from group config
// ──────────────────────────────────────────────
const buildTagExpression = (group, allGroups) => {
  // Catch-all: auto-compute "everything not in other groups"
  if (group.catchAll) {
    const usedTags = [];
    for (const g of allGroups) {
      if (g.catchAll) continue;
      if (Array.isArray(g.tags)) usedTags.push(...g.tags);
      else if (typeof g.tags === 'string') usedTags.push(g.tags);
    }
    if (usedTags.length === 0) return '@Regression';
    const notParts = usedTags.map(t => `not ${t}`).join(' and ');
    return `@Regression and ${notParts}`;
  }

  // Array of tags → OR them together
  if (Array.isArray(group.tags)) {
    return group.tags.join(' or ');
  }

  // String → use as-is (raw Cucumber tag expression)
  if (typeof group.tags === 'string') {
    return group.tags;
  }

  return null;
};

// ──────────────────────────────────────────────
// Run a single group
// ──────────────────────────────────────────────
const runGroup = (group, groupIndex, allGroups, extraArgs = []) => {
  const parallel = group.parallel || 1;
  const features = group.features || [];
  const tagExpr = buildTagExpression(group, allGroups);

  if (features.length === 0 && !tagExpr) {
    console.warn(`[Runner] Group "${group.name}" has no features or tags — skipping.`);
    return { status: 0, skipped: true };
  }

  // Validate feature files if specified
  for (const f of features) {
    const fullPath = path.join(process.cwd(), f);
    if (!fs.existsSync(fullPath)) {
      console.error(`[Runner] Feature file not found: ${fullPath}`);
      return { status: 1, skipped: false };
    }
  }

  // Per-group report file
  const groupReportPath = path.join(EXTENT_DIR, `group-${groupIndex + 1}.html`);

  const cucumberArgs = [
    'cucumber-js',
    '-c', 'config/cucumber.js',
    '--parallel', String(parallel),
  ];

  // Add tag filter
  if (tagExpr) {
    cucumberArgs.push('--tags', `"${tagExpr}"`);
  }

  // Add specific feature paths (if any)
  if (features.length > 0) {
    cucumberArgs.push(...features);
  }

  cucumberArgs.push(...extraArgs);

  const result = run('npx', cucumberArgs, { EXTENT_REPORT_PATH: groupReportPath });
  return {
    status: typeof result.status === 'number' ? result.status : 1,
    skipped: false
  };
};

// ──────────────────────────────────────────────
// Print summary table
// ──────────────────────────────────────────────
const printSummary = (results) => {
  console.log('\n' + '═'.repeat(70));
  console.log('  PARALLEL RUNNER — EXECUTION SUMMARY');
  console.log('═'.repeat(70));
  console.log(
    `  ${pad('#', 4)} ${pad('Group', 30)} ${pad('Status', 12)} ${pad('Duration', 12)}`
  );
  console.log('  ' + '─'.repeat(62));

  results.forEach((r, i) => {
    const statusLabel = r.skipped ? '⏭ SKIPPED' : r.status === 0 ? '✅ PASSED' : '❌ FAILED';
    console.log(
      `  ${pad(i + 1, 4)} ${pad(r.name, 30)} ${pad(statusLabel, 12)} ${pad(formatDuration(r.duration), 12)}`
    );
  });

  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  const failed = results.filter(r => r.status !== 0 && !r.skipped).length;
  const passed = results.filter(r => r.status === 0 && !r.skipped).length;
  const skipped = results.filter(r => r.skipped).length;

  console.log('  ' + '─'.repeat(62));
  console.log(`  Total: ${passed} passed, ${failed} failed, ${skipped} skipped | ${formatDuration(totalDuration)}`);
  console.log('═'.repeat(70) + '\n');
};

// ──────────────────────────────────────────────
// Merge per-group Extent reports into one
// ──────────────────────────────────────────────
const mergeExtentReports = (groups, results) => {
  const extentDir = path.join(process.cwd(), EXTENT_DIR);
  const outputPath = path.join(extentDir, 'OptiKPI_V2.0_Smoke_Test.html');

  // Collect all group HTML files that exist
  const groupFiles = [];
  for (let i = 1; i <= groups.length; i++) {
    const gFile = path.join(extentDir, `group-${i}.html`);
    if (fs.existsSync(gFile)) {
      groupFiles.push({ index: i, path: gFile, name: groups[i - 1].name });
    }
  }

  if (groupFiles.length === 0) {
    console.warn('[Runner] No group report files found — cannot merge.');
    return;
  }

  if (groupFiles.length === 1) {
    // Only one group ran — copy it as the final report
    fs.copyFileSync(groupFiles[0].path, outputPath);
    console.log(`[Runner] Single group report copied to: ${EXTENT_HTML}`);
    return;
  }

  // Build group navigation tabs
  const now = new Date().toLocaleString();
  const groupTabs = groupFiles.map(gf =>
    `<button class="group-tab ${gf.index === 1 ? 'active' : ''}" onclick="showGroup(this, ${gf.index})">${gf.name}</button>`
  ).join('\n        ');

  // Build iframe sections — each group report is loaded in its own iframe
  // This provides full DOM isolation so scripts, charts, and IDs don't conflict
  const groupSections = groupFiles.map(gf =>
    `<iframe id="group-${gf.index}" class="group-section" src="group-${gf.index}.html" style="display: ${gf.index === 1 ? 'block' : 'none'}"></iframe>`
  ).join('\n      ');

  // Build summary row data
  const summaryRows = results.map((r, i) => {
    const statusClass = r.skipped ? 'skip' : r.status === 0 ? 'pass' : 'fail';
    const statusLabel = r.skipped ? '⏭ SKIPPED' : r.status === 0 ? '✅ PASSED' : '❌ FAILED';
    return `<tr class="${statusClass}">
      <td>${i + 1}</td>
      <td>${r.name}</td>
      <td>${statusLabel}</td>
      <td>${formatDuration(r.duration)}</td>
    </tr>`;
  }).join('\n          ');

  const combinedHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
  <title>OptiKPI V2.0 Smoke Test — Combined Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; font-family: system-ui, -apple-system, sans-serif; }
    .group-runner-header {
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
      color: #fff;
      padding: 20px 30px;
    }
    .group-runner-header h1 { margin: 0 0 5px; font-size: 20px; }
    .group-runner-header .timestamp { font-size: 12px; opacity: 0.7; }
    .group-summary-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 14px;
    }
    .group-summary-table th {
      background: #475569;
      color: #fff;
      padding: 8px 12px;
      text-align: left;
    }
    .group-summary-table td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
    .group-summary-table tr.pass td { background: #f0fdf4; }
    .group-summary-table tr.fail td { background: #fef2f2; }
    .group-summary-table tr.skip td { background: #f8fafc; color: #94a3b8; }
    .group-tabs {
      display: flex;
      gap: 4px;
      padding: 10px 30px 0;
      background: #f1f5f9;
      border-bottom: 2px solid #e2e8f0;
      flex-wrap: wrap;
    }
    .group-tab {
      padding: 10px 20px;
      border: none;
      background: #e2e8f0;
      cursor: pointer;
      border-radius: 6px 6px 0 0;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s;
    }
    .group-tab:hover { background: #cbd5e1; }
    .group-tab.active { background: #fff; border-bottom: 2px solid #3b82f6; color: #1e40af; }
    .group-section {
      width: 100%;
      height: calc(100vh - 60px);
      border: none;
    }
  </style>
</head>
<body>
  <div class="group-runner-header">
    <h1>OptiKPI V2.0 Smoke Test — Combined Report</h1>
    <div class="timestamp">${now}</div>
    <table class="group-summary-table">
      <thead>
        <tr><th>#</th><th>Group</th><th>Status</th><th>Duration</th></tr>
      </thead>
      <tbody>
        ${summaryRows}
      </tbody>
    </table>
  </div>
  <div class="group-tabs">
    ${groupTabs}
  </div>
  <div class="group-content">
    ${groupSections}
  </div>
  <script>
    function showGroup(btn, idx) {
      document.querySelectorAll('.group-section').forEach(function(s) { s.style.display = 'none'; });
      document.querySelectorAll('.group-tab').forEach(function(t) { t.classList.remove('active'); });
      document.getElementById('group-' + idx).style.display = 'block';
      btn.classList.add('active');
    }
  </script>
</body>
</html>`;

  fs.writeFileSync(outputPath, combinedHtml, 'utf8');
  console.log(`[Runner] Merged ${groupFiles.length} group reports into: ${EXTENT_HTML}`);
};

// ──────────────────────────────────────────────
// Merge prerequisite + main reports (Ordered mode)
// ──────────────────────────────────────────────
const mergeOrderedReports = (prereqResults, allResults) => {
  const extentDir = path.join(process.cwd(), EXTENT_DIR);
  const outputPath = path.join(extentDir, 'OptiKPI_V2.0_Smoke_Test.html');

  const reportFiles = [];

  // Collect prerequisite HTML files
  for (let i = 0; i < prereqResults.length; i++) {
    if (prereqResults[i].skipped) continue;
    const prereqFile = path.join(extentDir, `prereq-${i + 1}.html`);
    if (fs.existsSync(prereqFile)) {
      reportFiles.push({
        path: prereqFile,
        name: `Prerequisite: ${prereqResults[i].name}`,
        index: reportFiles.length + 1
      });
    }
  }

  // Collect main run HTML
  const mainFile = path.join(extentDir, 'main-run.html');
  if (fs.existsSync(mainFile)) {
    reportFiles.push({
      path: mainFile,
      name: 'Main Run (@Regression)',
      index: reportFiles.length + 1
    });
  }

  if (reportFiles.length === 0) {
    console.warn('[Runner] No report files found — cannot merge.');
    return;
  }

  // Only one report — just copy it as the final report
  if (reportFiles.length === 1) {
    fs.copyFileSync(reportFiles[0].path, outputPath);
    console.log(`[Runner] Single report copied to: ${EXTENT_HTML}`);
    return;
  }

  const now = new Date().toLocaleString();

  const groupTabs = reportFiles.map(rf =>
    `<button class="group-tab ${rf.index === 1 ? 'active' : ''}" onclick="showGroup(this, ${rf.index})">${rf.name}</button>`
  ).join('\n        ');

  const groupSections = reportFiles.map(rf => {
    const relPath = path.basename(rf.path);
    return `<iframe id="group-${rf.index}" class="group-section" src="${relPath}" style="display: ${rf.index === 1 ? 'block' : 'none'}"></iframe>`;
  }).join('\n      ');

  const summaryRows = allResults.map((r, i) => {
    const statusClass = r.skipped ? 'skip' : r.status === 0 ? 'pass' : 'fail';
    const statusLabel = r.skipped ? '⏭ SKIPPED' : r.status === 0 ? '✅ PASSED' : '❌ FAILED';
    return `<tr class="${statusClass}">
      <td>${i + 1}</td>
      <td>${r.name}</td>
      <td>${statusLabel}</td>
      <td>${formatDuration(r.duration)}</td>
    </tr>`;
  }).join('\n          ');

  const combinedHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
  <title>OptiKPI V2.0 Smoke Test — Combined Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; font-family: system-ui, -apple-system, sans-serif; }
    .group-runner-header {
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
      color: #fff;
      padding: 20px 30px;
    }
    .group-runner-header h1 { margin: 0 0 5px; font-size: 20px; }
    .group-runner-header .timestamp { font-size: 12px; opacity: 0.7; }
    .group-summary-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 14px;
    }
    .group-summary-table th {
      background: #475569;
      color: #fff;
      padding: 8px 12px;
      text-align: left;
    }
    .group-summary-table td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
    .group-summary-table tr.pass td { background: #f0fdf4; }
    .group-summary-table tr.fail td { background: #fef2f2; }
    .group-summary-table tr.skip td { background: #f8fafc; color: #94a3b8; }
    .group-tabs {
      display: flex;
      gap: 4px;
      padding: 10px 30px 0;
      background: #f1f5f9;
      border-bottom: 2px solid #e2e8f0;
      flex-wrap: wrap;
    }
    .group-tab {
      padding: 10px 20px;
      border: none;
      background: #e2e8f0;
      cursor: pointer;
      border-radius: 6px 6px 0 0;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s;
    }
    .group-tab:hover { background: #cbd5e1; }
    .group-tab.active { background: #fff; border-bottom: 2px solid #3b82f6; color: #1e40af; }
    .group-section {
      width: 100%;
      height: calc(100vh - 60px);
      border: none;
    }
  </style>
</head>
<body>
  <div class="group-runner-header">
    <h1>OptiKPI V2.0 Smoke Test — Combined Report</h1>
    <div class="timestamp">${now}</div>
    <table class="group-summary-table">
      <thead>
        <tr><th>#</th><th>Phase</th><th>Status</th><th>Duration</th></tr>
      </thead>
      <tbody>
        ${summaryRows}
      </tbody>
    </table>
  </div>
  <div class="group-tabs">
    ${groupTabs}
  </div>
  <div class="group-content">
    ${groupSections}
  </div>
  <script>
    function showGroup(btn, idx) {
      document.querySelectorAll('.group-section').forEach(function(s) { s.style.display = 'none'; });
      document.querySelectorAll('.group-tab').forEach(function(t) { t.classList.remove('active'); });
      document.getElementById('group-' + idx).style.display = 'block';
      btn.classList.add('active');
    }
  </script>
</body>
</html>`;

  fs.writeFileSync(outputPath, combinedHtml, 'utf8');
  console.log(`[Runner] Merged ${reportFiles.length} phase reports into: ${EXTENT_HTML}`);
};

// ──────────────────────────────────────────────
// Legacy runner (no groups — plain cucumber-js)
// ──────────────────────────────────────────────
const runLegacy = (argv) => {
  const hasConfigFlag = argv.some(
    (arg, idx) =>
      arg === '-c' ||
      arg === '--config' ||
      arg.startsWith('--config=') ||
      (arg === 'config' && argv[idx + 1] === 'cucumber.js') ||
      arg === 'config/cucumber.js'
  );

  const baseCucumberArgs = hasConfigFlag ? [] : ['-c', 'config/cucumber.js'];
  const cucumberArgs = argv.length > 0
    ? [...baseCucumberArgs, ...argv]
    : [...baseCucumberArgs, '--parallel', '1'];

  console.log('[Runner] Running cucumber tests (legacy mode)...');
  const test = run('npx', ['cucumber-js', ...cucumberArgs]);
  return typeof test.status === 'number' ? test.status : 1;
};

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────
const main = () => {
  const argv = process.argv.slice(2);

  // --clean-only
  if (argv.includes('--clean-only')) {
    clean();
    process.exit(0);
  }

  clean();
  // Reset names.json to prevent stale data from previous runs
  const namesJsonPath = path.join(process.cwd(), 'data', 'names.json');
  try {
    fs.mkdirSync(path.dirname(namesJsonPath), { recursive: true });
    fs.writeFileSync(namesJsonPath, '{}', 'utf8');
    console.log('[Runner] Reset data/names.json');
  } catch (err) {
    console.warn(`[Runner] Warning: failed to reset names.json: ${err.message}`);
  }
  setupExtentReport();

  // ── Parallel / Ordered mode ──
  if (argv.includes('--groups')) {
    const isDryRun = argv.includes('--dry-run');
    const continueOnFail = argv.includes('--continue-on-fail');
    const extraArgs = argv.filter(a => !['--groups', '--dry-run', '--continue-on-fail'].includes(a));

    const config = loadParallelConfig();
    const failFast = continueOnFail ? false : (config.failFast !== false);

    // ════════════════════════════════════════════════
    // ORDERED MODE  (prerequisites + single main run)
    // ════════════════════════════════════════════════
    if (Array.isArray(config.prerequisites) && config.prerequisites.length > 0) {
      const prerequisites = config.prerequisites;
      const parallelCount = config.parallel || 2;

      // ── Dry-run ──
      if (isDryRun) {
        const dryBaseTag = config.baseTag || '@Regression';
        const dryNotParts = prerequisites.map(p => `not ${p.tag}`).join(' and ');
        const dryMainTag = prerequisites.length > 0
          ? `(${dryBaseTag}) and ${dryNotParts}`
          : dryBaseTag;
        console.log('\n[Runner] DRY-RUN — Ordered execution plan:\n');
        prerequisites.forEach((p, i) => {
          console.log(`  Prerequisite ${i + 1}: ${p.name || p.tag}  (tag: ${p.tag}, serial)`);
        });
        console.log(`\n  Main run: ${dryMainTag}  (parallel=${parallelCount})`);
        console.log(`  failFast: ${failFast}\n`);
        process.exit(0);
      }

      console.log(`\n[Runner] Ordered mode: ${prerequisites.length} prerequisite(s), then main run (parallel=${parallelCount})\n`);

      // ── Phase 1: Run prerequisites serially ──
      let prereqFailed = false;
      const prereqResults = [];

      for (let i = 0; i < prerequisites.length; i++) {
        const prereq = prerequisites[i];
        const label = `Prerequisite ${i + 1}/${prerequisites.length}: ${prereq.name || prereq.tag}`;

        if (prereqFailed && failFast) {
          console.log(`[Runner] ⏭ Skipping "${prereq.name}" (previous prerequisite failed)`);
          prereqResults.push({ name: prereq.name, status: 0, skipped: true, duration: 0 });
          continue;
        }

        console.log('─'.repeat(50));
        console.log(`[Runner] ▶ ${label}`);
        console.log('─'.repeat(50));

        // Prerequisite gets a temp report path (cleaned up afterward)
        const tempReportPath = path.join(EXTENT_DIR, `prereq-${i + 1}.html`);
        const cucumberArgs = [
          'cucumber-js',
          '-c', 'config/cucumber.js',
          '--parallel', '1',
          '--tags', `"${prereq.tag}"`,
          ...extraArgs,
        ];

        const start = Date.now();
        const result = run('npx', cucumberArgs, { EXTENT_REPORT_PATH: tempReportPath });
        const duration = Date.now() - start;
        const status = typeof result.status === 'number' ? result.status : 1;

        prereqResults.push({ name: prereq.name || prereq.tag, status, skipped: false, duration });

        if (status !== 0) {
          prereqFailed = true;
          console.log(`[Runner] ❌ ${label} FAILED (exit ${status}, ${formatDuration(duration)})`);
        } else {
          console.log(`[Runner] ✅ ${label} PASSED (${formatDuration(duration)})`);
        }
      }

      if (prereqFailed && failFast) {
        console.log('\n[Runner] Aborting — prerequisite failed and failFast is enabled.');
        printSummary(prereqResults);
        sendSlackNotification();
        process.exit(1);
      }

      // ── Phase 2: Run scenarios in one process ──
      // If excludeFromMainRun is set, exclude prerequisite tags from the main run
      const excludePrereqs = config.excludeFromMainRun !== false;
      const baseTag = config.baseTag || '@Regression';
      let mainTagExpr = baseTag;
      if (excludePrereqs && prerequisites.length > 0) {
        const notParts = prerequisites.map(p => `not ${p.tag}`).join(' and ');
        mainTagExpr = `(${baseTag}) and ${notParts}`;
      }

      console.log('\n' + '─'.repeat(50));
      console.log(`[Runner] ▶ Main run  (parallel=${parallelCount})`);
      console.log(`[Runner]   tags: ${mainTagExpr}`);
      console.log('─'.repeat(50));

      const mainReportPath = path.join(EXTENT_DIR, 'main-run.html');
      const mainCucumberArgs = [
        'cucumber-js',
        '-c', 'config/cucumber.js',
        '--parallel', String(parallelCount),
        '--tags', `"${mainTagExpr}"`,
        `--format`, `rerun:${RERUN_FILE}`,
        ...extraArgs,
      ];

      const mainStart = Date.now();
      const mainResult = run('npx', mainCucumberArgs, { EXTENT_REPORT_PATH: mainReportPath });
      let mainDuration = Date.now() - mainStart;
      let mainStatus = typeof mainResult.status === 'number' ? mainResult.status : 1;

      // ── Retry failed scenarios ──
      if (mainStatus !== 0 && MAX_RETRIES > 0) {
        const { retried, status: retryStatus } = retryFailedScenarios(mainReportPath, 1, extraArgs);
        if (retried) {
          mainDuration = Date.now() - mainStart;  // Include retry duration
          mainStatus = retryStatus;
        }
      }

      // ── Summary ──
      console.log('\n' + '═'.repeat(70));
      console.log('  ORDERED RUNNER — EXECUTION SUMMARY');
      console.log('═'.repeat(70));
      prereqResults.forEach((r, i) => {
        const sl = r.skipped ? '⏭ SKIPPED' : r.status === 0 ? '✅ PASSED' : '❌ FAILED';
        console.log(`  ${pad(i + 1, 4)} ${pad('[prereq] ' + r.name, 38)} ${pad(sl, 12)} ${pad(formatDuration(r.duration), 12)}`);
      });
      const mainLabel = mainStatus === 0 ? '✅ PASSED' : '❌ FAILED';
      console.log(`  ${pad('→', 4)} ${pad('Main run (all @Regression)', 38)} ${pad(mainLabel, 12)} ${pad(formatDuration(mainDuration), 12)}`);
      console.log('═'.repeat(70) + '\n');

      // Merge prerequisite + main reports into a single HTML
      const allResults = [
        ...prereqResults.map(r => ({ ...r, name: `[prereq] ${r.name}` })),
        { name: 'Main run (@Regression)', status: mainStatus, skipped: false, duration: mainDuration }
      ];
      mergeOrderedReports(prereqResults, allResults);

      if (fs.existsSync(path.join(process.cwd(), EXTENT_HTML))) {
        console.log('[Runner] Extent report: reports/extent/OptiKPI_V2.0_Smoke_Test.html');
      }

      writeRunSummary(mainStatus, mainDuration, RERUN_FILE);
      sendSlackNotification();
      process.exit(prereqFailed || mainStatus !== 0 ? 1 : 0);
    }

    // ════════════════════════════════════════════════
    // GROUP MODE  (original multi-group approach)
    // ════════════════════════════════════════════════
    const groups = config.groups || [];

    if (groups.length === 0) {
      console.error('[Runner] No groups or prerequisites defined in parallel-run-config.json');
      process.exit(1);
    }

    // ── Dry-run: print plan and exit ──
    if (isDryRun) {
      console.log('\n[Runner] DRY-RUN — Execution plan:\n');
      groups.forEach((g, i) => {
        const p = g.parallel || 1;
        const tagExpr = buildTagExpression(g, groups);
        console.log(`  Group ${i + 1}: ${g.name}  (parallel=${p})`);
        if (tagExpr) console.log(`    tags: ${tagExpr}`);
        (g.features || []).forEach(f => console.log(`    → ${f}`));
      });
      console.log(`\n  failFast: ${failFast}\n`);
      process.exit(0);
    }

    // ── Execute groups sequentially ──
    console.log(`\n[Runner] Starting parallel group execution (${groups.length} groups, failFast=${failFast})\n`);

    const results = [];
    let hasFailure = false;

    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const groupLabel = `Group ${i + 1}/${groups.length}: ${group.name}`;

      if (hasFailure && failFast) {
        console.log(`[Runner] ⏭ Skipping "${group.name}" (previous group failed, failFast=true)`);
        results.push({ name: group.name, status: 0, skipped: true, duration: 0 });
        continue;
      }

      console.log('\n' + '─'.repeat(50));
      console.log(`[Runner] ▶ ${groupLabel}  (parallel=${group.parallel || 1})`);
      console.log('─'.repeat(50));

      const start = Date.now();
      const { status, skipped } = runGroup(group, i, groups, extraArgs);
      const duration = Date.now() - start;

      results.push({ name: group.name, status, skipped, duration });

      if (status !== 0 && !skipped) {
        hasFailure = true;
        console.log(`[Runner] ❌ ${groupLabel} FAILED (exit ${status})`);
      } else if (!skipped) {
        console.log(`[Runner] ✅ ${groupLabel} PASSED (${formatDuration(duration)})`);
      }
    }

    printSummary(results);

    // Merge per-group reports into combined HTML
    mergeExtentReports(groups, results);

    if (fs.existsSync(path.join(process.cwd(), EXTENT_HTML))) {
      console.log('[Runner] Extent report: reports/extent/OptiKPI_V2.0_Smoke_Test.html');
    }

    sendSlackNotification();

    const exitCode = hasFailure ? 1 : 0;
    process.exit(exitCode);
  }

  // ── Legacy mode (no --groups flag) ──
  const exitCode = runLegacy(argv);

  if (fs.existsSync(path.join(process.cwd(), EXTENT_HTML))) {
    console.log('[Runner] Extent report: reports/extent/OptiKPI_V2.0_Smoke_Test.html');
  }

  sendSlackNotification();
  process.exit(exitCode);
};

main();
