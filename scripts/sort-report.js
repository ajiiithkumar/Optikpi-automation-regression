/**
 * sort-report.js
 * Post-run script: reads reports/json/results.json
 * and generates reports/extent/Ordered_Report.html
 * sorted by module: Audience → Campaign → Dashboard → Settings → Workflow
 * 
 * Uses a dark theme inspired by standard Extent reports.
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const JSON_INPUT  = path.join(process.cwd(), 'reports', 'json', 'results.json');
const HTML_OUTPUT = path.join(process.cwd(), 'reports', 'extent', 'Ordered_Report.html');
const SUMMARY_IN  = path.join(process.cwd(), 'reports', 'run-summary.json');

const MODULE_ORDER = ['Audience', 'Campaign', 'Dashboard', 'Settings', 'Workflow'];

const MODULE_TAG_PATTERNS = {
  Audience:  /^@?(REG-AUD-|ExistingAudience)/i,
  Campaign:  /^@?REG-CAMP-/i,
  Dashboard: /^@?REG-DASH-/i,
  Settings:  /^@?REG-SET-/i,
  Workflow:  /^@?REG-WORKFLOW-/i,
};

const readJSON = (p) => { try { return JSON.parse(fs.readFileSync(p,'utf8')); } catch(e) { return null; } };

const fmtDuration = (ms) => {
  if (!ms || !Number.isFinite(ms)) return '0ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const s = (ms/1000).toFixed(1);
  if (+s < 60) return `${s}s`;
  return `${Math.floor(ms/60000)}m ${((ms%60000)/1000).toFixed(0)}s`;
};

const detectModule = (tags=[]) => {
  for (const mod of MODULE_ORDER) {
    if (tags.some(t => MODULE_TAG_PATTERNS[mod].test(t))) return mod;
  }
  return 'Unknown';
};

const esc = (s) => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

const statusColor = (s) => {
  const st = String(s||'').toLowerCase();
  if (st === 'passed' || st === 'pass') return '#28a745';
  if (st === 'failed' || st === 'fail') return '#dc3545';
  if (st === 'skipped' || st === 'skip') return '#ffc107';
  if (st === 'info') return '#17a2b8';
  return '#6c757d'; // default/unknown
};

const parseResults = (raw) => {
  let idCounter = 0;
  const allScenarios = [];
  
  for (const feature of (raw||[])) {
    for (const element of (feature.elements||[])) {
      const tags = (element.tags||[]).map(t => t.name||'');
      const mod  = detectModule(tags);
      let scenarioStatus = 'pass', totalDuration = 0;
      const steps = (element.steps||[]);
      
      for (const step of steps) {
        const r  = step.result || {};
        totalDuration += (r.duration||0) / 1_000_000;
        const st = String(r.status||'').toLowerCase();
        if (st==='failed') scenarioStatus='fail';
        else if ((st==='skipped'||st==='pending'||st==='undefined') && scenarioStatus!=='fail') scenarioStatus='skip';
      }
      
      const failedStep = steps.find(s=>String((s.result||{}).status||'').toLowerCase()==='failed');
      const errorMsg   = failedStep ? String(failedStep.result.error_message||failedStep.result.message||'').trim() : '';
      
      allScenarios.push({
        id: 'scenario-' + (++idCounter),
        module: mod,
        name: element.name||'Unnamed Scenario',
        tags,
        status: scenarioStatus,
        duration: totalDuration,
        steps: steps.map(s=>({
          keyword: s.keyword||'', 
          name: s.name||'',
          status: String((s.result||{}).status||'').toLowerCase() === 'failed' ? 'fail' : (String((s.result||{}).status||'').toLowerCase() === 'passed' ? 'pass' : 'skip'),
          duration: ((s.result||{}).duration||0)/1_000_000,
          error: String((s.result||{}).error_message||'').trim(),
        })),
        errorMsg,
        feature: feature.name||feature.uri||'',
      });
    }
  }
  
  // Sort by module order
  return allScenarios.sort((a, b) => {
    let orderA = MODULE_ORDER.indexOf(a.module);
    let orderB = MODULE_ORDER.indexOf(b.module);
    if (orderA === -1) orderA = 999;
    if (orderB === -1) orderB = 999;
    return orderA - orderB;
  });
};

const generate = () => {
  if (!fs.existsSync(JSON_INPUT)) {
    console.error('[sort-report] ERROR: JSON results not found.');
    process.exit(1);
  }
  const raw = readJSON(JSON_INPUT);
  const summary = readJSON(SUMMARY_IN) || {};
  if (!raw) { console.error('[sort-report] ERROR: Could not parse results.json'); process.exit(1); }

  const scenarios = parseResults(raw);
  
  const grand = {
    total: scenarios.length,
    passed: scenarios.filter(s=>s.status==='pass').length,
    failed: scenarios.filter(s=>s.status==='fail').length,
    duration: summary.duration || fmtDuration(summary.durationMs),
    timestamp: summary.timestamp || new Date().toLocaleString()
  };

  const navBrand = `OptiKPI V2.0 Regression Test`;

  // Build Sidebar items
  let sidebarHtml = '';
  let currentModule = '';
  
  scenarios.forEach((sc) => {
    if (sc.module !== currentModule) {
      sidebarHtml += `<div class="module-header">${sc.module}</div>`;
      currentModule = sc.module;
    }
    
    // Support CSS :has selector alternative by adding a class if it's failed
    const failClass = sc.status === 'fail' ? 'is-failed' : '';
    
    sidebarHtml += `
      <div class="test-item ${failClass}" onclick="showScenario('${sc.id}')" id="nav-${sc.id}">
        <div class="test-item-title">${esc(sc.name)}</div>
        <div class="test-item-meta">
          <span>${fmtDuration(sc.duration)}</span>
          <span class="badge" style="background:${statusColor(sc.status)}">${sc.status === 'pass' ? 'Pass' : (sc.status === 'fail' ? 'Fail' : 'Skip')}</span>
        </div>
      </div>
    `;
  });

  // Build Scenario Details
  let detailsHtml = '';
  scenarios.forEach((sc) => {
    let stepsHtml = '';
    sc.steps.forEach(st => {
      // Step status color
      const sColor = statusColor(st.status);
      const sBadge = st.status === 'pass' ? 'Pass' : (st.status === 'fail' ? 'Fail' : 'Skip');
      
      stepsHtml += `
        <tr class="step-row">
          <td class="step-status"><span class="badge" style="background:${sColor}">${sBadge}</span></td>
          <td class="step-time">${fmtDuration(st.duration)}</td>
          <td class="step-details">
            <span class="step-keyword">${esc(st.keyword)}</span> ${esc(st.name)}
            ${st.error ? `<div class="step-error">${esc(st.error)}</div>` : ''}
          </td>
        </tr>
      `;
    });

    detailsHtml += `
      <div class="scenario-details" id="detail-${sc.id}" style="display:none;">
        <div class="scenario-header">
          <div class="scenario-title">${esc(sc.name)}</div>
          <div class="scenario-meta">
            <span class="badge" style="background:${statusColor(sc.status)}">${sc.status === 'pass' ? 'Pass' : (sc.status === 'fail' ? 'Fail' : 'Skip')}</span>
            <span class="meta-item">${fmtDuration(sc.duration)}</span>
            ${sc.tags.map(t => `<span class="tag-pill">${esc(t)}</span>`).join('')}
          </div>
        </div>
        <div class="scenario-body">
          <table class="steps-table">
            <thead>
              <tr>
                <th width="80">STATUS</th>
                <th width="120">TIME</th>
                <th>DETAILS</th>
              </tr>
            </thead>
            <tbody>
              ${stepsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${navBrand}</title>
<style>
  :root {
    --bg-dark: #22272e;
    --bg-darker: #1c2128;
    --bg-panel: #2d333b;
    --text-main: #cdd9e5;
    --text-muted: #768390;
    --border-color: #444c56;
    --brand-color: #539bf5;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { 
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; 
    background-color: var(--bg-dark); 
    color: var(--text-main); 
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }
  
  /* Navbar */
  .navbar {
    background-color: var(--bg-darker);
    border-bottom: 1px solid var(--border-color);
    padding: 0 20px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }
  .navbar-brand { font-size: 18px; font-weight: 600; color: var(--text-main); }
  .navbar-meta { font-size: 13px; color: var(--text-muted); }
  .navbar-pills { display: flex; gap: 10px; }
  .nav-pill { background: #373e47; padding: 5px 12px; border-radius: 4px; font-size: 13px; }

  /* Main Layout */
  .main-container {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  /* Sidebar */
  .sidebar {
    width: 350px;
    background-color: var(--bg-panel);
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }
  .sidebar-header {
    padding: 15px;
    border-bottom: 1px solid var(--border-color);
    font-weight: 600;
    font-size: 15px;
    color: var(--text-muted);
  }
  .module-header {
    padding: 10px 15px;
    background-color: #373e47;
    font-size: 12px;
    font-weight: bold;
    text-transform: uppercase;
    color: var(--text-muted);
    border-bottom: 1px solid var(--border-color);
    border-top: 1px solid var(--border-color);
  }
  .module-header:first-child { border-top: none; }
  
  .test-item {
    padding: 15px;
    border-bottom: 1px solid var(--border-color);
    cursor: pointer;
    transition: background 0.2s;
  }
  .test-item:hover { background-color: #373e47; }
  .test-item.active { background-color: #373e47; border-left: 4px solid var(--brand-color); }
  .test-item-title { font-size: 14px; font-weight: 500; margin-bottom: 8px; line-height: 1.4; }
  .test-item-meta { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); align-items: center; }
  
  /* Badges & Tags */
  .badge { padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; color: #fff; text-transform: uppercase; }
  .tag-pill { background-color: #444c56; color: #cdd9e5; padding: 3px 8px; border-radius: 4px; font-size: 12px; border: 1px solid #545d68; }

  /* Content Area */
  .content {
    flex: 1;
    overflow-y: auto;
    background-color: var(--bg-dark);
    padding: 30px;
  }
  
  .scenario-details { max-width: 1200px; margin: 0 auto; }
  
  .scenario-header {
    margin-bottom: 25px;
  }
  .scenario-title {
    font-size: 22px;
    font-weight: 600;
    color: var(--brand-color);
    margin-bottom: 15px;
    line-height: 1.3;
  }
  .scenario-meta {
    display: flex;
    align-items: center;
    gap: 15px;
    flex-wrap: wrap;
  }
  .meta-item { font-size: 13px; color: var(--text-muted); }
  
  /* Steps Table */
  .steps-table {
    width: 100%;
    border-collapse: collapse;
    background-color: var(--bg-panel);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    overflow: hidden;
  }
  .steps-table th {
    text-align: left;
    padding: 12px 15px;
    font-size: 12px;
    color: var(--text-muted);
    border-bottom: 1px solid var(--border-color);
    background-color: #373e47;
  }
  .steps-table td {
    padding: 12px 15px;
    font-size: 13px;
    border-bottom: 1px solid var(--border-color);
    vertical-align: top;
  }
  .step-row:last-child td { border-bottom: none; }
  .step-row:hover { background-color: #373e47; }
  
  .step-keyword { font-weight: bold; color: #8bb4e7; }
  .step-error {
    margin-top: 10px;
    padding: 10px;
    background-color: #4a2124;
    color: #ff8e95;
    font-family: monospace;
    font-size: 12px;
    border-radius: 4px;
    white-space: pre-wrap;
    word-break: break-all;
  }
  
  /* Empty State */
  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-muted);
    font-size: 16px;
  }

</style>
</head>
<body>

  <div class="navbar">
    <div class="navbar-brand">${navBrand}</div>
    <div class="navbar-pills">
      <div class="nav-pill" style="color:#28a745">Pass: ${grand.passed}</div>
      <div class="nav-pill" style="color:#dc3545">Fail: ${grand.failed}</div>
      <div class="nav-pill">${grand.timestamp}</div>
    </div>
  </div>

  <div class="main-container">
    <div class="sidebar">
      <div class="sidebar-header">Tests (${grand.total})</div>
      ${sidebarHtml}
    </div>
    
    <div class="content">
      <div id="empty-selection" class="empty-state">
        Select a test from the left to view details
      </div>
      ${detailsHtml}
    </div>
  </div>

<script>
  function showScenario(id) {
    // Hide all scenario details
    document.querySelectorAll('.scenario-details').forEach(el => el.style.display = 'none');
    document.getElementById('empty-selection').style.display = 'none';
    
    // Remove active class from all nav items
    document.querySelectorAll('.test-item').forEach(el => el.classList.remove('active'));
    
    // Show selected scenario detail
    const detailEl = document.getElementById('detail-' + id);
    if (detailEl) detailEl.style.display = 'block';
    
    // Highlight selected nav item
    const navEl = document.getElementById('nav-' + id);
    if (navEl) navEl.classList.add('active');
  }

  // Auto select the first failed test, or the first test if none failed
  window.addEventListener('DOMContentLoaded', () => {
    const firstFailedNav = document.querySelector('.test-item.is-failed') || document.querySelector('.test-item');
    if (firstFailedNav) {
      const idMatch = firstFailedNav.id.match(/nav-(.+)/);
      if (idMatch) {
        showScenario(idMatch[1]);
        firstFailedNav.scrollIntoView({ behavior: 'auto', block: 'center' });
      }
    }
  });
</script>
</body>
</html>`;

  const outDir = path.dirname(HTML_OUTPUT);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(HTML_OUTPUT, html, 'utf8');
  console.log('[sort-report] Dark Theme Ordered Report generated: ' + HTML_OUTPUT);
};

generate();
