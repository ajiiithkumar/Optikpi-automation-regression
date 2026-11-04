const fs = require('fs');
const path = require('path');

const featuresDir = path.join(__dirname, '../features');
const coverageDir = path.join(__dirname, '../docs/automation-coverage');
const csvFile = path.join(coverageDir, 'automation-coverage-core.csv');
const mdFile = path.join(coverageDir, 'dashboard.md');

function splitCSV(text) {
    const rows = [];
    const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
    for (const line of lines) {
        const cleanRow = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"').trim());
        rows.push(cleanRow);
    }
    return rows;
}

let existingData = new Map();
let headers = ["Module", "Test Case ID", "Source Tag", "Core Area", "Core Scenario Covered", "Precondition", "Key Flow Covered", "Validation / Expected Result", "Priority", "Automation Status", "Feature File"];

if (fs.existsSync(csvFile)) {
    const content = fs.readFileSync(csvFile, 'utf-8');
    const rows = splitCSV(content);
    if (rows.length > 0) {
        headers = rows[0].map(h => `"${h}"`);
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const sourceTag = row[2];
            if (sourceTag) {
                existingData.set(sourceTag, {
                    testCaseId: row[1] || '',
                    coreArea: row[3] || '',
                    precondition: row[5] || '',
                    validation: row[7] || '',
                    priority: row[8] || 'Medium'
                });
            }
        }
    }
} else {
    headers = headers.map(h => `"${h}"`);
    if (!fs.existsSync(coverageDir)) {
        fs.mkdirSync(coverageDir, { recursive: true });
    }
}

const featureFiles = fs.readdirSync(featuresDir).filter(f => f.endsWith('.feature'));
const scenarios = [];

for (const file of featureFiles) {
    const content = fs.readFileSync(path.join(featuresDir, file), 'utf-8');
    const lines = content.split('\n');
    
    let currentModule = file.replace('.feature', '');
    let currentTags = [];
    let currentSteps = [];
    let scenarioDescription = '';
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('Feature:')) {
            currentModule = line.replace('Feature:', '').trim();
        } else if (line.startsWith('@')) {
            currentTags = line.split(/\s+/).filter(t => t.startsWith('@'));
        } else if (line.startsWith('Scenario:') || line.startsWith('Scenario Outline:')) {
            if (scenarioDescription) {
                scenarios.push({ module: currentModule, tags: currentTags, description: scenarioDescription, steps: currentSteps, file: file });
            }
            scenarioDescription = line.replace(/Scenario Outline:|Scenario:/, '').trim();
            currentSteps = [];
        } else if (line.startsWith('Given ') || line.startsWith('When ') || line.startsWith('Then ') || line.startsWith('And ')) {
            if (scenarioDescription) {
                currentSteps.push(line);
            }
        }
    }
    if (scenarioDescription) {
        scenarios.push({ module: currentModule, tags: currentTags, description: scenarioDescription, steps: currentSteps, file: file });
    }
}

const newRows = [headers];
const moduleStats = {};

scenarios.forEach(sc => {
    const sourceTagWithAt = sc.tags.find(t => t.match(/@REG-[A-Z]+-\d+/));
    const sourceTag = sourceTagWithAt ? sourceTagWithAt.substring(1) : '';
    
    if (!moduleStats[sc.module]) {
        moduleStats[sc.module] = { total: 0, automated: 0 };
    }
    moduleStats[sc.module].total++;
    
    let isAutomated = sourceTag ? "Automated" : "Needs Review";
    if (isAutomated === "Automated") {
        moduleStats[sc.module].automated++;
    }

    const manualData = existingData.get(sourceTag) || {};
    const flowCovered = sc.steps.join(' -> ');
    
    const tcId = manualData.testCaseId || (sourceTag ? `TC-${sourceTag.replace('REG-', '')}` : '');
    const coreArea = manualData.coreArea || '';
    const precondition = manualData.precondition || '';
    const validation = manualData.validation || '';
    const priority = manualData.priority || 'Medium';

    const row = [
        `"${sc.module}"`,
        `"${tcId}"`,
        `"${sourceTag}"`,
        `"${coreArea}"`,
        `"${sc.description.replace(/"/g, '""')}"`,
        `"${precondition.replace(/"/g, '""')}"`,
        `"${flowCovered.replace(/"/g, '""')}"`,
        `"${validation.replace(/"/g, '""')}"`,
        `"${priority}"`,
        `"${isAutomated}"`,
        `"${sc.file}"`
    ];
    newRows.push(row);
});

fs.writeFileSync(csvFile, newRows.map(r => r.join(',')).join('\n'), 'utf-8');
console.log(`CSV generated successfully at: docs/automation-coverage/automation-coverage-core.csv`);

let mdContent = `# Automation Coverage Dashboard\n\n`;
mdContent += `*Last generated: ${new Date().toLocaleString()}*\n\n`;

mdContent += `## Module-Level Coverage\n\n`;
mdContent += `| Module | Total TCs | Automated | Coverage % |\n`;
mdContent += `|--------|-----------|-----------|------------|\n`;

let totalTcs = 0;
let totalAutomated = 0;

Object.keys(moduleStats).sort().forEach(mod => {
    const stat = moduleStats[mod];
    const coverage = stat.total > 0 ? Math.round((stat.automated / stat.total) * 100) : 0;
    mdContent += `| **${mod}** | ${stat.total} | ${stat.automated} | ${coverage}% |\n`;
    totalTcs += stat.total;
    totalAutomated += stat.automated;
});

const totalCoverage = totalTcs > 0 ? Math.round((totalAutomated / totalTcs) * 100) : 0;
mdContent += `| **TOTAL** | **${totalTcs}** | **${totalAutomated}** | **${totalCoverage}%** |\n\n`;

mdContent += `## Test Case Detail\n\n`;
mdContent += `| Module | Tag | Priority | Status | Scenario |\n`;
mdContent += `|--------|-----|----------|--------|----------|\n`;

newRows.slice(1).forEach(r => {
    const mod = r[0].replace(/^"|"$/g, '');
    const tag = r[2].replace(/^"|"$/g, '');
    const pri = r[8].replace(/^"|"$/g, '');
    const status = r[9].replace(/^"|"$/g, '');
    const desc = r[4].replace(/^"|"$/g, '');
    let statusEmoji = status === 'Automated' ? '✅' : '⚠️';
    mdContent += `| ${mod} | \`${tag}\` | ${pri} | ${statusEmoji} ${status} | ${desc} |\n`;
});

fs.writeFileSync(mdFile, mdContent, 'utf-8');
console.log(`Dashboard MD generated successfully at: docs/automation-coverage/dashboard.md`);
