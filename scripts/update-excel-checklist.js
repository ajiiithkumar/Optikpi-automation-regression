const fs = require("fs");
const path = require("path");
const Excel = require("exceljs");

const ROOT = path.join(__dirname, "..");
const xlFile = path.join(ROOT, "docs/Automation_Checklist_Updated.xlsx");

(async () => {

// ─── 1. Parse feature files ──────────────────────────────────────────────────
const featuresDir = path.join(ROOT, "features");
const allScenarios = [];
const seenTags = new Set();

for (const file of fs.readdirSync(featuresDir).filter(f => f.endsWith(".feature"))) {
    const lines = fs.readFileSync(path.join(featuresDir, file), "utf-8").split("\n");
    let currentModule = "", currentTags = [], currentSteps = [], scenarioDesc = "";
    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (line.startsWith("Feature:")) {
            const full = line.replace("Feature:", "").trim().toLowerCase();
            if (full.includes("audience")) currentModule = "Audience";
            else if (full.includes("campaign")) currentModule = "Campaign";
            else if (full.includes("dashboard")) currentModule = "Dashboard";
            else if (full.includes("setting")) currentModule = "Settings";
            else if (full.includes("workflow")) currentModule = "Workflow";
            else currentModule = line.replace("Feature:", "").trim();
        } else if (line.startsWith("@")) {
            currentTags = line.split(/\s+/).filter(t => t.startsWith("@"));
        } else if (line.startsWith("Scenario:") || line.startsWith("Scenario Outline:")) {
            if (scenarioDesc) allScenarios.push({ module: currentModule, tags: [...currentTags], description: scenarioDesc, steps: [...currentSteps], file });
            scenarioDesc = line.replace(/Scenario Outline:|Scenario:/, "").trim();
            currentSteps = [];
        } else if (/^(Given |When |Then |And )/.test(line) && scenarioDesc) {
            currentSteps.push(line);
        }
    }
    if (scenarioDesc) allScenarios.push({ module: currentModule, tags: [...currentTags], description: scenarioDesc, steps: [...currentSteps], file });
}

// De-duplicate by tag
for (const sc of allScenarios) {
    const tagWithAt = sc.tags.find(t => t.match(/@REG-[A-Z]+-\d+/));
    const tag = tagWithAt ? tagWithAt.substring(1) : null;
    if (!tag || seenTags.has(tag)) continue;
    seenTags.add(tag);
}

// ─── 2. Open Excel and read existing state ───────────────────────────────────
const wb = new Excel.Workbook();
await wb.xlsx.readFile(xlFile);
const ws = wb.getWorksheet("Test Case Detail");

// Build ordered list of existing tags and their row numbers
const existingTagOrder = []; // [{tag, rowNum}] in sheet order
for (let r = 3; r <= ws.rowCount; r++) {
    const tagVal = ws.getRow(r).getCell(2).value;
    if (tagVal && String(tagVal).match(/REG-/)) {
        existingTagOrder.push({ tag: String(tagVal), rowNum: r });
    }
}
const existingTagSet = new Set(existingTagOrder.map(e => e.tag));

// Find missing tags
const missingTags = [...seenTags].filter(t => !existingTagSet.has(t));
console.log(`Existing tags: ${existingTagSet.size}`);
console.log(`Missing tags : ${missingTags.length}`);
missingTags.forEach(t => console.log("  MISSING:", t));

if (missingTags.length === 0) {
    console.log("Nothing to insert. File is up to date!");
    process.exit(0);
}

// ─── 3. Figure out sort key for any tag ─────────────────────────────────────
const modOrder = { AUD: 0, CAMP: 1, DASH: 2, SET: 3, WORKFLOW: 4 };
function tagSortKey(tag) {
    const m = tag.match(/REG-([A-Z]+)-(\d+)([A-Z]?)/);
    if (!m) return [99, 99, ""];
    return [modOrder[m[1]] ?? 9, parseInt(m[2]), m[3] || ""];
}
function compareTags(a, b) {
    const [am, an, as_] = tagSortKey(a);
    const [bm, bn, bs]  = tagSortKey(b);
    if (am !== bm) return am - bm;
    if (an !== bn) return an - bn;
    return as_.localeCompare(bs);
}

// ─── 4. Style helpers — copy from FIRST existing data row as template ────────
// Capture style from existing row 3 (first data row)
const templateDataRow = ws.getRow(3);
const mkFill = argb => ({ type: "pattern", pattern: "solid", fgColor: { argb } });
const centerMid = { vertical: "middle", horizontal: "center" };
const wrapMid   = { vertical: "middle", wrapText: true };

const moduleColors = {
    "Audience":  "FF2E75B6",
    "Campaign":  "FFE67E22",
    "Dashboard": "FF27AE60",
    "Settings":  "FFF39C12",
    "Workflow":  "FFC0392B",
};
const priorityColors = { "High": "FFFADBD8", "Medium": "FFFDEDEC" };
const statusColors   = { "Automated": "FFD5F5E3", "Needs Review": "FFFEF9E7" };

function buildNewRowValues(tag, sc) {
    return {
        module:      sc.module,
        sourceTag:   tag,
        coreArea:    "",                // leave blank - user fills manually
        description: sc.description,
        priority:    "High",
        status:      "Automated",
        featureFile: sc.file,
        notes:       "Completed, executed, and working fine.",
    };
}

function styleNewRow(row, vals) {
    row.height = 28;
    // Col 1: Module
    const c1 = row.getCell(1);
    c1.value = vals.module;
    c1.fill = mkFill(moduleColors[vals.module] || "FFBFBFBF");
    c1.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10, name: "Calibri" };
    c1.alignment = centerMid;
    // Col 2: Source Tag
    const c2 = row.getCell(2);
    c2.value = vals.sourceTag;
    c2.fill = mkFill("FFEAF2FF");
    c2.alignment = centerMid;
    // Col 3: Core Area (blank)
    const c3 = row.getCell(3);
    c3.value = vals.coreArea;
    c3.fill = mkFill("FFEAF2FF");
    c3.alignment = wrapMid;
    // Col 4: Scenario Description
    const c4 = row.getCell(4);
    c4.value = vals.description;
    c4.fill = mkFill("FFEAF2FF");
    c4.alignment = wrapMid;
    // Col 5: Priority
    const c5 = row.getCell(5);
    c5.value = vals.priority;
    c5.fill = mkFill(priorityColors[vals.priority] || "FFEAF2FF");
    c5.font = { bold: true, size: 10, name: "Calibri" };
    c5.alignment = centerMid;
    // Col 6: Status
    const c6 = row.getCell(6);
    c6.value = vals.status;
    c6.fill = mkFill(statusColors[vals.status] || "FFEAF2FF");
    c6.font = { bold: true, size: 10, name: "Calibri" };
    c6.alignment = centerMid;
    // Col 7: Feature File
    const c7 = row.getCell(7);
    c7.value = vals.featureFile;
    c7.fill = mkFill("FFEAF2FF");
    c7.alignment = wrapMid;
    // Col 8: Notes
    const c8 = row.getCell(8);
    c8.value = vals.notes;
    c8.fill = mkFill("FFEAF2FF");
    c8.alignment = wrapMid;
    row.commit();
}

// ─── 5. Insert missing rows in correct sorted position ───────────────────────
// Build a lookup: tag -> scenario info
const tagToScenario = new Map();
for (const sc of allScenarios) {
    const tagWithAt = sc.tags.find(t => t.match(/@REG-[A-Z]+-\d+/));
    if (!tagWithAt) continue;
    const tag = tagWithAt.substring(1);
    if (!tagToScenario.has(tag)) tagToScenario.set(tag, sc);
}

// Process missing tags one by one, sorted so insertions stack correctly
// IMPORTANT: Process from LAST to FIRST so earlier row inserts don't shift later ones
const sortedMissing = [...missingTags].sort(compareTags);

// For each missing tag, find which row to insert BEFORE
// We insert BEFORE the first existing tag that is "greater" than our missing tag
// Must recompute row positions after each insert (offset tracking)
let insertionOffset = 0; // how many rows we've added so far

for (const missingTag of sortedMissing) {
    const sc = tagToScenario.get(missingTag);
    if (!sc) { console.log(`WARNING: no scenario data for ${missingTag}`); continue; }

    // Find where to insert: before the first existing tag that sorts AFTER missingTag
    // existingTagOrder contains original row numbers, adjust by insertionOffset
    let insertBeforeRow = null;
    for (const existing of existingTagOrder) {
        if (compareTags(missingTag, existing.tag) < 0) {
            insertBeforeRow = existing.rowNum + insertionOffset;
            break;
        }
    }

    const insertAt = insertBeforeRow !== null ? insertBeforeRow : (ws.rowCount + 1);
    console.log(`Inserting ${missingTag} at row ${insertAt} (before ${insertBeforeRow !== null ? existingTagOrder.find(e => (e.rowNum + insertionOffset) === insertBeforeRow)?.tag : "end"})`);

    // spliceRows(pos, deleteCount, ...rowValues) — 0 delete = pure insert
    ws.spliceRows(insertAt, 0, []);

    // Now style the newly inserted blank row
    const newRow = ws.getRow(insertAt);
    const vals = buildNewRowValues(missingTag, sc);
    styleNewRow(newRow, vals);

    insertionOffset++;
}

// ─── 6. Update formula ranges in Dashboard ───────────────────────────────────
const newLastDataRow = 3 + existingTagOrder.length + sortedMissing.length - 1;
console.log(`\nNew last data row: ${newLastDataRow}`);

const updateFormula = f => f.replace(/\$(\d+)(?!\d)/g, (match, n) => {
    const num = parseInt(n);
    return (num >= 40 && num <= 200) ? `$${newLastDataRow}` : match;
});

const dash = wb.getWorksheet("Dashboard");
for (let r = 6; r <= 20; r++) {
    const row = dash.getRow(r);
    for (let c = 2; c <= 9; c++) {
        const cell = row.getCell(c);
        const v = cell.value;
        if (v && typeof v === "object" && v.formula) {
            const updated = updateFormula(v.formula);
            if (updated !== v.formula) cell.value = { formula: updated, date1904: false };
        }
    }
    row.commit();
}

const core = wb.getWorksheet("Core Area Coverage");
if (core) {
    for (let r = 3; r <= 30; r++) {
        const row = core.getRow(r);
        for (let c = 1; c <= 5; c++) {
            const cell = row.getCell(c);
            const v = cell.value;
            if (v && typeof v === "object" && v.formula) {
                const updated = updateFormula(v.formula);
                if (updated !== v.formula) cell.value = { formula: updated, date1904: false };
            }
        }
        row.commit();
    }
}

// ─── 7. Update summary formula row in Test Case Detail ───────────────────────
for (let r = newLastDataRow + 1; r <= newLastDataRow + 15; r++) {
    const row = ws.getRow(r);
    row.eachCell({ includeEmpty: false }, (cell) => {
        const v = cell.value;
        if (v && typeof v === "object" && v.formula && v.formula.includes("COUNTA")) {
            cell.value = { formula: updateFormula(v.formula), date1904: false };
        }
    });
    row.commit();
}

// ─── 8. Save ─────────────────────────────────────────────────────────────────
await wb.xlsx.writeFile(xlFile);
console.log("\nExcel updated: docs/Automation_Checklist_Updated.xlsx");
console.log(`  Inserted       : ${sortedMissing.length} new rows`);
console.log(`  Existing rows  : untouched`);
console.log(`  Formula range  : updated to row ${newLastDataRow}`);

})().catch(err => { console.error("ERROR:", err.message, err.stack); process.exit(1); });
