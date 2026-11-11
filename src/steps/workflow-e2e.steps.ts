import path from 'path';
import { Given, Then } from '@cucumber/cucumber';
import { WorkflowPage } from '../pages/workflow.page';
import { AudiencePage } from '../pages/audience.page';
import { DataPlatformPage } from '../pages/data-platform.page';
import { createSuccessfulDepositCsv } from '../utils/customer-event-csv';
import { WorkflowReportPage, WorkflowDetail, WorkflowNode, WorkflowNodeEvent, WorkflowNodeLogCount, WorkflowLogEntry } from '../pages/workflow-report.page';
import { DateTimePicker } from '../pages/components/date-time-picker.component';
import { NavigationBar } from '../pages/components/navigation-bar.component';
import { ExtentTestManager } from '../utils/extent-test-manager';
import { PlaywrightWorld } from '../support/world';
import { captureScreenshot, readUsersCsv, uniqueId } from '../utils/helper';
import { envMinutes, pollUntil } from '../utils/polling';
import {
    CaseState, EventRecord, RUN_ID, getCase, setPhase, updateCase,
    dropSharedAudience, getSharedAudience, listCases, listSharedAudiences, saveSharedAudience, withSharedAudienceLock,
} from '../utils/campaign-e2e-state';

/**
 * Workflow execution E2E (features/e2e/workflow-execution.feature).
 * Create scenarios build and publish each workflow; Verify scenarios follow the users through the Delay,
 * Action and Exit nodes using the workflow report APIs (node customer lists + Logs), then set the workflow
 * inactive and delete it. Users come from data/workflow-users.csv (wf_user_01..18), never users.csv.
 * Shared steps reused from campaign-e2e.steps.ts: "Start E2E case", "Describe the E2E setup as",
 * "Use the shared Static audience for users" and "Upload a Successful Deposit event for E2E user N ...".
 */

const getWorkflowPage = (world: PlaywrightWorld): WorkflowPage => new WorkflowPage(world.page);
const getAudiencePage = (world: PlaywrightWorld): AudiencePage => new AudiencePage(world.page);
const getDataPlatformPage = (world: PlaywrightWorld): DataPlatformPage => new DataPlatformPage(world.page);
const getReport = (world: PlaywrightWorld): WorkflowReportPage => new WorkflowReportPage(world.page);
const getDatePicker = (world: PlaywrightWorld): DateTimePicker => new DateTimePicker(world.page);
const getNav = (world: PlaywrightWorld): NavigationBar => new NavigationBar(world.page);

const WORKFLOW_USERS_CSV = path.join(process.cwd(), 'data', 'workflow-users.csv');
/** How long the workflow stays active after its start; must cover the longest case. */
const WINDOW_MS = envMinutes('E2E_WORKFLOW_WINDOW_MIN', 180);
/** Backend processing allowance on top of a Delay timer (test configuration, not a product SLA). */
const ALLOWANCE_MS = envMinutes('E2E_WORKFLOW_ALLOWANCE_MIN', 5);
/** Max wait for the workflow to start and enroll its users. */
const ENTRY_TIMEOUT_MS = envMinutes('E2E_WORKFLOW_ENTRY_TIMEOUT_MIN', 30);
/** Max wait in a full run for this case's Create scenario to finish. */
const CREATE_WAIT_MS = envMinutes('E2E_CREATE_WAIT_MIN', 40);
const POLL_INTERVAL_MS = 20000;
/** Timer releases earlier than this before the due time count as early. */
const EARLY_TOLERANCE_MS = 60 * 1000;
const LONG_STEP = { timeout: ENTRY_TIMEOUT_MS + 60 * 60 * 1000 };

// ─── World / state helpers ───────────────────────────────────────────────────

const caseId = (world: PlaywrightWorld): string => {
    const id = world['e2eCaseId'];
    if (!id) throw new Error('E2E case not started. Add "Given Start E2E case ..." or "Given Load the created E2E workflow case ..." first.');
    return id;
};

const e2eUsers = (world: PlaywrightWorld): string[] => {
    const users: string[] = world['e2eUsers'];
    if (!users?.length) throw new Error('No E2E users set. Add "Given Use workflow users ... for the E2E case".');
    return users;
};

const userAt = (world: PlaywrightWorld, position: number): string => {
    const id = e2eUsers(world)[position - 1];
    if (!id) throw new Error(`E2E user ${position} not defined (case users: ${e2eUsers(world).join(', ')})`);
    return id;
};

const workflowOf = (c: CaseState): NonNullable<CaseState['workflow']> & { id: string } => {
    if (!c?.workflow?.id) throw new Error(`${c?.caseId}: workflow id not recorded. Run "Record the published E2E workflow" first.`);
    return c.workflow as NonNullable<CaseState['workflow']> & { id: string };
};

const minutesBetween = (from: string, to: string): number => (Date.parse(to) - Date.parse(from)) / 60000;
const fmt = (n: number): string => n.toFixed(1);

/** Writes expected / observed / status to the report and the state file, then fails if needed. */
async function reportOutcome(world: PlaywrightWorld, expected: string, observed: string, passed: boolean, evidence: Record<string, unknown> = {}): Promise<void> {
    const id = caseId(world);
    const c = getCase(id);
    await world.attach([
        `Case: ${id} — ${c?.title ?? ''}`,
        `Setup: ${c?.setup ?? ''}`,
        `Workflow: ${c?.workflow?.name ?? '-'} (${c?.workflow?.id ?? '-'}) ${c?.workflow?.url ?? ''}`,
        `Expected: ${expected}`,
        `Observed: ${observed}`,
        `Status: ${passed ? 'PASSED' : 'FAILED'}`,
    ].join('\n'), 'text/plain');
    if (Object.keys(evidence).length) await world.attach(JSON.stringify(evidence, null, 2), 'application/json');
    setPhase(id, 'setup', { status: passed ? 'pending' : 'failed', expected, observed, checkedAt: new Date().toISOString() });
    if (!passed) throw new Error(`[${id}] Expected: ${expected}. Observed: ${observed}`);
    ExtentTestManager.logPass(observed);
}

async function loadWorkflow(world: PlaywrightWorld): Promise<WorkflowDetail> {
    return getReport(world).getWorkflow(targetWorkflowId(world));
}

const nodeOfType = (wf: WorkflowDetail, type: string): WorkflowNode => {
    const node = wf.nodes.find((n) => n.type === type);
    if (!node) throw new Error(`Workflow ${wf.name} has no ${type} node (nodes: ${wf.nodes.map((n) => n.type).join(', ')})`);
    return node;
};

/** First event time per user at a node. */
const firstSeen = (events: WorkflowNodeEvent[]): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const e of events) if (e.userId && (!out[e.userId] || e.timestamp < out[e.userId])) out[e.userId] = e.timestamp;
    return out;
};

const describeEvents = (events: WorkflowNodeEvent[], users: string[]): string => users.map((u) => {
    const mine = events.filter((e) => e.userId === u);
    return `${u}: ${mine.length ? mine.map((e) => `${e.eventType}@${e.timestamp.slice(11, 19)}`).join(', ') : 'none'}`;
}).join('; ');

// ─── Case setup ──────────────────────────────────────────────────────────────

Given('Use workflow users {string} for the E2E case', async function (this: PlaywrightWorld, positions: string) {
    const rows = await readUsersCsv(WORKFLOW_USERS_CSV);
    const ids = positions.split(',').map((p) => {
        const row = rows[Number(p.trim()) - 1];
        if (!row?.user_id) throw new Error(`data/workflow-users.csv has no row ${p.trim()} (rows: ${rows.length})`);
        return row.user_id;
    });
    this['e2eUsers'] = ids;
    updateCase(caseId(this), (c) => { c.users = ids; });
    ExtentTestManager.logPass(`Workflow E2E users: ${ids.join(', ')}`);
});

// ─── Audience ────────────────────────────────────────────────────────────────

/** Waits until the audience list API reports the audience active with exactly `count` customers. */
async function waitForAudienceCount(world: PlaywrightWorld, title: string, count: number, timeoutMs: number): Promise<void> {
    const audience = getAudiencePage(world);
    await pollUntil(() => audience.getAudienceSummaryByTitle(title), (a) => !!a && a.status === 'active' && a.totalCustomers === count,
        { description: `audience "${title}" to be active with ${count} customers`, timeoutMs, intervalMs: POLL_INTERVAL_MS });
}

/** Creates and publishes a Static audience with exactly these user ids; returns its title. */
async function createStaticAudience(world: PlaywrightWorld, users: string[]): Promise<string> {
    const title = `Audience-${uniqueId()}`;
    const audience = getAudiencePage(world);
    await getNav(world).navigateTo('Audience');
    await audience.clickCreateNew();
    await audience.clickCreateFromScratch();
    await audience.waitForCreatePage();
    await audience.fillDetails(title, 'auto-tag');
    await audience.clickCreateSubmit();
    await audience.waitForEditPage();
    await audience.openCustomerProperty();
    await audience.selectUserIdProperty();
    await audience.selectConditionIsOneOf();
    await audience.selectCustomerPropertiesValueslevel1Btn();
    await audience.enterUserIdValue(users[0]);
    for (const userId of users.slice(1)) {
        await audience.clickAddValuesBtn();
        await audience.enterUserIdValue(userId);
    }
    await audience.clickPreviewButton();
    const preview = await audience.getPreviewRecordCount();
    if (preview !== users.length) throw new Error(`Audience preview shows ${preview} customers, expected ${users.length} (${users.join(', ')})`);
    await audience.publishStatic();
    const { found, message } = await audience.checkLimitReachedPopup();
    if (found) throw new Error(`Audience was not published: ${message}`);
    await waitForAudienceCount(world, title, users.length, 10 * 60 * 1000);
    return title;
}

/**
 * One Static audience per exact workflow user set, reused across cases and runs (workflow state folder).
 * Membership is checked by the audience preview and the audience's total customer count, not by its
 * customer list: newly imported profiles are missing from the Customer Profile search index on Dev
 * (ClickUp 1amxvnb40er), so that list stays empty even though the audience resolves the users.
 */
Then('Use the workflow E2E Static audience for users {string}', LONG_STEP, async function (this: PlaywrightWorld, positions: string) {
    const users = positions.split(',').map((p) => userAt(this, Number(p.trim())));
    this['currentAudienceUserIds'] = [...users];
    await withSharedAudienceLock(users, async () => {
        const existing = getSharedAudience(users);
        if (existing) {
            try {
                await waitForAudienceCount(this, existing.title, users.length, 60 * 1000);
                this['currentAudienceTitle'] = existing.title;
                saveSharedAudience({ ...existing, lastVerifiedAt: new Date().toISOString() });
                updateCase(caseId(this), (c) => { c.audience = { title: existing.title, userIds: [...users] }; });
                ExtentTestManager.logPass(`Reusing workflow audience "${existing.title}" (${users.length} customers: ${users.join(', ')})`);
                return;
            } catch (err) {
                ExtentTestManager.logInfo(`Workflow audience "${existing.title}" no longer matches ${users.join(', ')} (${String(err).slice(0, 200)}); creating a new one`);
                dropSharedAudience(users);
            }
        }
        const title = await createStaticAudience(this, users);
        saveSharedAudience({ title, userIds: [...users], createdAt: new Date().toISOString(), lastVerifiedAt: new Date().toISOString() });
        this['currentAudienceTitle'] = title;
        updateCase(caseId(this), (c) => { c.audience = { title, userIds: [...users] }; });
        ExtentTestManager.logPass(`Created workflow Static audience "${title}" for ${users.join(', ')}`);
    });
});

/**
 * A new Static audience owned by this case (not shared): the edit cases add a user to it later,
 * so it must not be reused by other cases. Deleted with the case cleanup.
 */
Then('Create a new workflow E2E Static audience for users {string}', LONG_STEP, async function (this: PlaywrightWorld, positions: string) {
    const users = positions.split(',').map((p) => userAt(this, Number(p.trim())));
    const title = await createStaticAudience(this, users);
    this['currentAudienceTitle'] = title;
    this['currentAudienceUserIds'] = [...users];
    updateCase(caseId(this), (c) => { c.audience = { title, userIds: [...users] }; });
    ExtentTestManager.logPass(`Created case audience "${title}" for ${users.join(', ')}`);
});

// ─── Workflow configuration ──────────────────────────────────────────────────

Then('Select the E2E audience in the workflow enrollment', async function (this: PlaywrightWorld) {
    const title = this['currentAudienceTitle'];
    if (!title) throw new Error('No E2E audience title on the World; run "Use the shared Static audience for users ..." first.');
    await getWorkflowPage(this).selectExistingAudienceByTitle(title);
    ExtentTestManager.logPass(`Selected enrollment audience "${title}"`);
});

Then('Set the workflow Delay to wait {int} minutes only', async function (this: PlaywrightWorld, minutes: number) {
    await getWorkflowPage(this).configureDelay({ minutes });
    this['workflowDelayConfig'] = `time-only ${minutes} min`;
    ExtentTestManager.logPass(`Delay: Amount of time ${minutes} Minute(s), Live event off`);
});

Then('Set the workflow Delay to wait for a Successful Deposit only', async function (this: PlaywrightWorld) {
    await getWorkflowPage(this).configureDelay({ successfulDeposit: true });
    this['workflowDelayConfig'] = 'event-only Successful Deposit';
    ExtentTestManager.logPass('Delay: Live event Successful Deposit, Amount of time off');
});

Then('Set the workflow Delay to wait for a Successful Deposit or {int} minutes', async function (this: PlaywrightWorld, minutes: number) {
    await getWorkflowPage(this).configureDelay({ minutes, successfulDeposit: true });
    this['workflowDelayConfig'] = `event-or-time Successful Deposit or ${minutes} min`;
    ExtentTestManager.logPass(`Delay: Successful Deposit or ${minutes} Minute(s)`);
});

/** Picks today's next start slot and an end time WINDOW_MS later in the publish dialog. */
async function chooseWindow(world: PlaywrightWorld): Promise<{ start: Date; end: Date }> {
    const workflow = getWorkflowPage(world);
    const picker = getDatePicker(world);
    const now = new Date();
    await workflow.clickStartDate();
    await picker.navigateToMonth(now.getMonth(), now.getFullYear(), 0);
    await picker.selectDate(now.getFullYear(), now.getMonth(), now.getDate());
    const start = await picker.selectNextAvailableTime();
    await picker.clickApply();
    const end = new Date(start.getTime() + WINDOW_MS);
    await workflow.clickEndDate();
    await picker.navigateToMonth(end.getMonth(), end.getFullYear(), 0);
    await picker.selectDate(end.getFullYear(), end.getMonth(), end.getDate());
    await picker.selectNextAvailableTime(end);
    await picker.clickApply();
    return { start, end };
}

Then('Publish the E2E workflow', async function (this: PlaywrightWorld) {
    const workflow = getWorkflowPage(this);
    await workflow.clickPublish();
    const { start, end } = await chooseWindow(this);
    await workflow.confirmPublish();
    const { found, message } = await workflow.checkLimitReachedPopup();
    if (found) throw new Error(`Workflow was not published: ${message}`);
    const name = this['currentWorkflowTitle'];
    updateCase(caseId(this), (c) => {
        c.workflow = { name, publishedAt: new Date().toISOString(), startAt: start.toISOString(), endAt: end.toISOString(), delayConfig: this['workflowDelayConfig'] };
    });
    ExtentTestManager.logPass(`Published workflow "${name}" (start ${start.toISOString()}, end ${end.toISOString()})`);
});

Then('Record the published E2E workflow', LONG_STEP, async function (this: PlaywrightWorld) {
    const id = caseId(this);
    const name = getCase(id)?.workflow?.name ?? this['currentWorkflowTitle'];
    const report = getReport(this);
    const summary = await pollUntil(() => report.findWorkflowByName(name), (w) => !!w && w.status !== 'draft',
        { description: `workflow "${name}" to be published`, timeoutMs: 3 * 60 * 1000, intervalMs: 10000 });
    const detail = await report.getWorkflow(summary.id);
    const delay = nodeOfType(detail, 'delay');
    updateCase(id, (c) => {
        c.workflow = { ...(c.workflow ?? { name }), id: summary.id, url: report.reportUrl(summary.id), delayNodeId: delay.id };
    });
    await this.attach(`Workflow ${name}\nid: ${summary.id}\nstatus: ${summary.status}\nstart: ${summary.startDateTime}\nend: ${summary.endDateTime}\n` +
        `nodes: ${detail.nodes.map((n) => `${n.type}:${n.id.slice(0, 8)}${n.description ? ` (${n.description.replace(/<[^>]+>/g, '')})` : ''}`).join(' | ')}`, 'text/plain');
    ExtentTestManager.logPass(`Recorded workflow ${name} (${summary.status}); Delay node ${delay.id}: ${(delay.description ?? '').replace(/<[^>]+>/g, '')}`);
});

Then('Mark the E2E workflow as created', async function (this: PlaywrightWorld) {
    const id = caseId(this);
    const w = workflowOf(getCase(id));
    setPhase(id, 'create', { status: 'passed', checkedAt: new Date().toISOString(), observed: `published ${w.name}, starts ${w.startAt}` });
    ExtentTestManager.logPass(`${id}: workflow ${w.name} created; starts ${w.startAt}. Verification runs in its Verify scenario.`);
});

Given('Load the created E2E workflow case {string}', { timeout: CREATE_WAIT_MS + 5 * 60 * 1000 }, async function (this: PlaywrightWorld, id: string) {
    this['e2eCaseId'] = id;
    if (process.env.E2E_RUN_MODE === 'full') {
        await pollUntil(async () => getCase(id), (rec) => !!rec && rec.runId === RUN_ID && rec.phases.find((p) => p.name === 'create')?.status !== 'pending',
            { description: `${id} Create scenario of this run to finish`, timeoutMs: CREATE_WAIT_MS, intervalMs: 10000 }).catch(() => undefined);
    }
    const c = getCase(id);
    const create = c?.phases.find((p) => p.name === 'create');
    if (!c || create?.status !== 'passed' || !c.workflow?.id) {
        setPhase(id, 'setup', { status: 'blocked', observed: `create phase: ${create?.status ?? 'not run'}`, checkedAt: new Date().toISOString() });
        ExtentTestManager.logInfo(`BLOCKED ${id}: no created workflow (create phase: ${create?.status ?? 'not run'}); run its Create scenario first`);
        return 'skipped';
    }
    if (c.phases.find((p) => p.name === 'setup')?.status === 'passed') {
        ExtentTestManager.logInfo(`${id} was already verified (${c.workflow.name}); run its Create scenario to test it again`);
        return 'skipped';
    }
    this['e2eUsers'] = c.users;
    this['currentWorkflowTitle'] = c.workflow.name;
    await this.attach(`Verifying ${id}: ${c.workflow.name}\n${c.workflow.url ?? ''}\nstarts ${c.workflow.startAt}; Delay: ${c.workflow.delayConfig ?? '-'}`, 'text/plain');
    ExtentTestManager.logPass(`Loaded ${id}: workflow ${c.workflow.name} (starts ${c.workflow.startAt})`);
    return undefined;
});

// ─── Deposit events ──────────────────────────────────────────────────────────

/** How long to look for an uploaded event in the Customer Events list before continuing without it. */
const EVENT_LIST_WAIT_MS = envMinutes('E2E_WORKFLOW_EVENT_LIST_WAIT_MIN', 3);
/** Minimum time between the user's Delay entry and the deposit, so the Delay is listening for the event. */
const DEPOSIT_SETTLE_MS = envMinutes('E2E_WORKFLOW_DEPOSIT_SETTLE_MIN', 2);

/**
 * Uploads one Successful Deposit for the user (unique event id) and requires an accepted upload.
 * The Customer Events list is checked for a short time: for newly imported workflow users it can stay
 * empty because of the search-index issue (ClickUp 1amxvnb40er), so a missing row is recorded, not failed.
 * Event-driven cases prove processing by the release that the event causes.
 */
/** Uploads one Successful Deposit (unique event id) for the user and records it on the case. */
async function uploadDeposit(world: PlaywrightWorld, userId: string, timing: string): Promise<void> {
    const event = createSuccessfulDepositCsv(userId, 100);
    const dataPlatform = getDataPlatformPage(world);
    await dataPlatform.openCustomerEvents();
    const upload = await dataPlatform.importCustomerEventsCsv(event.csvPath);
    if (upload.status < 200 || upload.status >= 300) throw new Error(`Deposit upload for ${userId} was rejected: ${upload.status} ${upload.message}`);
    const row = await pollUntil(async () =>
        (await dataPlatform.findEventRow(event.eventId)) || (await dataPlatform.findEventRow(event.transactionId)),
    (text) => !!text, { description: `event ${event.eventId} in Customer Events`, timeoutMs: EVENT_LIST_WAIT_MS, intervalMs: POLL_INTERVAL_MS })
        .catch((err) => { if (err?.name !== 'PollTimeoutError') throw err; return ''; });
    updateCase(caseId(world), (c) => { c.events.push({ ...event, uploadedAt: new Date().toISOString(), accepted: true }); });
    world['lastEvent'] = event;
    await world.attach(`Successful Deposit for ${userId}\nevent_id: ${event.eventId}\ntransaction_id: ${event.transactionId}\nevent_time (UTC): ${event.eventTime}\n` +
        `${timing}\nupload status: ${upload.status}\nCustomer Events row: ${row || `not listed within ${EVENT_LIST_WAIT_MS / 60000} min (search-index issue 1amxvnb40er)`}`, 'text/plain');
    if (row) ExtentTestManager.logPass(`Deposit ${event.eventId} for ${userId} accepted and listed in Customer Events`);
    else ExtentTestManager.logInfo(`Deposit ${event.eventId} for ${userId} accepted (HTTP ${upload.status}) but not listed in Customer Events (search-index issue 1amxvnb40er)`);
}

Then('Upload a Successful Deposit event for workflow E2E user {int}', LONG_STEP, async function (this: PlaywrightWorld, position: number) {
    const userId = userAt(this, position);
    const entered = Date.parse(getCase(caseId(this)).workflow?.delayEntries?.[userId] ?? '');
    if (!entered) throw new Error(`No Delay entry recorded for ${userId}; run "Wait for the E2E users to enter the workflow Delay node" first.`);
    const due = entered + DEPOSIT_SETTLE_MS;
    if (due > Date.now()) {
        await pollUntil(async () => Date.now(), (now) => now >= due,
            { description: `${DEPOSIT_SETTLE_MS / 60000} min after ${userId} entered the Delay`, timeoutMs: due - Date.now() + 60000, intervalMs: 10000 });
    }
    await uploadDeposit(this, userId, `Delay entry (UTC): ${new Date(entered).toISOString()} (deposit ${((Date.now() - entered) / 60000).toFixed(1)} min after entry)`);
});

/** WF-05: a deposit made after publishing but before the workflow starts, so it predates the user's Delay entry. */
Then('Upload a Successful Deposit event for workflow E2E user {int} before the workflow starts', LONG_STEP, async function (this: PlaywrightWorld, position: number) {
    const userId = userAt(this, position);
    const startAt = getCase(caseId(this)).workflow?.startAt;
    if (!startAt) throw new Error('Workflow start time not recorded; run "Publish the E2E workflow" first.');
    if (Date.now() >= Date.parse(startAt) - 60000) throw new Error(`Too close to the workflow start (${startAt}) to make a pre-entry deposit`);
    await uploadDeposit(this, userId, `Before the workflow start (${startAt}); ${fmt((Date.parse(startAt) - Date.now()) / 60000)} min before it`);
});

/** WF-05 evidence: the first (pre-start) deposit of the user is older than its Delay entry. */
Then('Verify the first deposit of E2E user {int} was made before it entered the workflow Delay node', async function (this: PlaywrightWorld, position: number) {
    const userId = userAt(this, position);
    const c = getCase(caseId(this));
    const first = c.events.find((e) => e.userId === userId);
    if (!first) throw new Error(`No deposit recorded for ${userId}`);
    const entered = delayEntryOf(this, userId);
    await reportOutcome(this, `the first deposit of ${userId} is older than its Delay entry`,
        `deposit ${first.eventTime} (uploaded ${first.uploadedAt}); Delay entry ${entered}`, first.eventTime < entered && (first.uploadedAt ?? '') < entered);
});

// ─── Execution checks ────────────────────────────────────────────────────────
//
// Movement is read from the node customer lists when they have data, otherwise from the Logs.
// Known gaps: Dev writes no Logs (Flink); Demo leaves the node customer lists empty. Either source proves
// the movement; the missing one is reported (and failed) by the report-evidence step at the end.
// Logs carry counts per node, not user ids, so Logs-based checks compare counts.
// Checks run on the case workflow, or on its duplicate while world['wfTarget'] is 'duplicate' (WF-09).

type Source = 'customer list' | 'Logs';
type Target = 'original' | 'duplicate';

interface NodeTrack {
    source: Source;
    /** Customer list: first record per user. */
    byUser: Record<string, string>;
    /** Customer list: every record (event types per user). */
    events: WorkflowNodeEvent[];
    /** Logs: processed counts (non-live), oldest first. */
    counts: { at: string; count: number }[];
    /** Logs: Delay releases caused by a live event. */
    live: WorkflowNodeLogCount[];
}

const targetOf = (world: PlaywrightWorld): Target => world['wfTarget'] === 'duplicate' ? 'duplicate' : 'original';

/** Workflow id of the current target. */
const targetWorkflowId = (world: PlaywrightWorld): string => {
    const c = getCase(caseId(world));
    const w = workflowOf(c);
    if (targetOf(world) === 'original') return w.id;
    if (!w.duplicate?.id) throw new Error(`${c.caseId}: no duplicated workflow recorded. Run "Duplicate the E2E workflow and publish the copy" first.`);
    return w.duplicate.id;
};

const entriesOf = (world: PlaywrightWorld): Record<string, string> => {
    const w = getCase(caseId(world)).workflow;
    return (targetOf(world) === 'original' ? w?.delayEntries : w?.duplicate?.delayEntries) ?? {};
};

const saveEntries = (world: PlaywrightWorld, entries: Record<string, string>): void => {
    const target = targetOf(world);
    updateCase(caseId(world), (c) => {
        const w = workflowOf(c);
        c.workflow = target === 'original'
            ? { ...w, delayEntries: { ...(w.delayEntries ?? {}), ...entries } }
            : { ...w, duplicate: { ...w.duplicate!, delayEntries: { ...(w.duplicate?.delayEntries ?? {}), ...entries } } };
    });
};

const delayEntryOf = (world: PlaywrightWorld, user: string): string => {
    const at = entriesOf(world)[user];
    if (!at) throw new Error(`No Delay entry recorded for ${user}; run "Wait for E2E users ... to enter the workflow Delay node" first.`);
    return at;
};

async function trackNode(world: PlaywrightWorld, wf: WorkflowDetail, node: WorkflowNode): Promise<NodeTrack> {
    const report = getReport(world);
    const list = await report.getEventsForNode(wf.id, node);
    if (list.length) return { source: 'customer list', byUser: firstSeen(list), events: list, counts: [], live: [] };
    const logs = await report.getNodeLogCounts(wf.id, node);
    return { source: 'Logs', byUser: {}, events: [], counts: logs.filter((l) => !l.live).map((l) => ({ at: l.at, count: l.count })), live: logs.filter((l) => l.live) };
}

const totalCount = (t: NodeTrack, from = '', to = '￿'): number =>
    t.counts.filter((c) => c.at >= from && c.at < to).reduce((s, c) => s + c.count, 0);

const describeTrack = (t: NodeTrack): string => t.source === 'customer list'
    ? Object.entries(t.byUser).map(([u, at]) => `${u}@${at.slice(11, 19)}`).join(', ') || 'none'
    : [...t.counts.map((c) => `${c.at.slice(11, 19)} processed ${c.count}`), ...t.live.map((l) => `${l.at.slice(11, 19)} ${l.message}`)].join(' | ') || 'none';

/** Time when the Logs show `needed` users processed at the node (cumulative), or undefined. */
const reachedAt = (t: NodeTrack, needed: number): string | undefined => {
    let sum = 0;
    for (const c of t.counts) { sum += c.count; if (sum >= needed) return c.at; }
    return undefined;
};

const usersAt = (world: PlaywrightWorld, positions: string): string[] => positions.split(',').map((p) => userAt(world, Number(p.trim())));

const label = (world: PlaywrightWorld, wf: WorkflowDetail): string => `${targetOf(world) === 'duplicate' ? 'duplicate ' : ''}${wf.name}`;

/** Runs a check on the original workflow, then on its duplicate. */
async function onBothWorkflows(world: PlaywrightWorld, check: () => Promise<void>): Promise<void> {
    for (const target of ['original', 'duplicate'] as Target[]) {
        world['wfTarget'] = target;
        try { await check(); } finally { world['wfTarget'] = undefined; }
    }
}

// Core checks (used by the single-workflow steps and the "both E2E workflows" steps)

async function waitForDelayEntry(world: PlaywrightWorld, users: string[]): Promise<void> {
    const wf = await loadWorkflow(world);
    const delay = nodeOfType(wf, 'delay');
    // Users already recorded in the Delay (edit cases add a user later) plus these users.
    const expected = [...new Set([...Object.keys(entriesOf(world)), ...users])];
    const track = await pollUntil(() => trackNode(world, wf, delay),
        (t) => t.source === 'customer list' ? users.every((u) => t.byUser[u]) : totalCount(t) >= expected.length,
        { description: `${users.join(', ')} to enter the Delay node of ${label(world, wf)}`, timeoutMs: ENTRY_TIMEOUT_MS, intervalMs: POLL_INTERVAL_MS });
    // Logs have no user ids: the new users get the time the Delay count reached the expected size.
    const at = track.source === 'Logs' ? reachedAt(track, expected.length) : undefined;
    const entries: Record<string, string> = Object.fromEntries(users.map((u) => [u, track.byUser[u] ?? at]));
    saveEntries(world, entries);
    const extra = track.source === 'customer list'
        ? Object.keys(track.byUser).filter((u) => !expected.includes(u)).join(', ')
        : (totalCount(track) > expected.length ? `${totalCount(track) - expected.length} more user(s) by count` : '');
    await reportOutcome(world, `${users.join(', ')} entered the Delay node of ${label(world, wf)}, and no other user`,
        `[${track.source}] Delay entries: ${users.map((u) => `${u} @ ${entries[u]}`).join(', ')}; ${describeTrack(track)}${extra ? `; unexpected: ${extra}` : ''}`,
        !extra, { delay: track });
}

/** Fails as soon as one of the users reaches the Action node before `untilMs` (Logs: any new Action count). */
async function stayInDelay(world: PlaywrightWorld, users: string[], untilMs: number, what: string): Promise<void> {
    const wf = await loadWorkflow(world);
    const action = nodeOfType(wf, 'action');
    const baseline = await trackNode(world, wf, action);
    const baseCount = totalCount(baseline);
    const started = Date.now();
    let last = baseline;
    const moved = (t: NodeTrack): boolean => t.source === 'customer list' ? users.some((u) => t.byUser[u]) : totalCount(t) > baseCount;
    if (!moved(last) && untilMs > Date.now()) {
        await pollUntil(async () => { last = await trackNode(world, wf, action); return last; }, moved,
            { description: `${users.join(', ')} to leave the Delay node`, timeoutMs: untilMs - Date.now(), intervalMs: POLL_INTERVAL_MS })
            .catch((err) => { if (err?.name !== 'PollTimeoutError') throw err; });
    }
    const waited = (Date.now() - started) / 60000;
    const early = moved(last);
    const observed = early
        ? `[${last.source}] reached the Action node during the window (after ${fmt(waited)} min): ${describeTrack(last)}`
        : `[${last.source}] ${users.map((u) => `${u} (entered ${entriesOf(world)[u] ?? '?'})`).join(', ')} still at the Delay node at ${new Date().toISOString()} (watched ${fmt(waited)} min); Action: ${describeTrack(last)}`;
    await reportOutcome(world, `${users.join(', ')} stay in the Delay node ${what} (no release)`, observed, !early);
}

async function waitForExit(world: PlaywrightWorld, users: string[]): Promise<void> {
    const wf = await loadWorkflow(world);
    const exit = nodeOfType(wf, 'exitFlow');
    const track = await pollUntil(() => trackNode(world, wf, exit),
        (t) => t.source === 'customer list' ? users.every((u) => t.byUser[u]) : totalCount(t) >= users.length,
        { description: `${users.join(', ')} to reach the Exit node of ${label(world, wf)}`, timeoutMs: ENTRY_TIMEOUT_MS + ALLOWANCE_MS + 30 * 60 * 1000, intervalMs: POLL_INTERVAL_MS });
    ExtentTestManager.logPass(`[${track.source}] Exit of ${label(world, wf)} reached: ${describeTrack(track)}`);
}

/** The user's latest uploaded deposit. */
const lastDepositOf = (world: PlaywrightWorld, user: string): EventRecord => {
    const ev = [...getCase(caseId(world)).events].reverse().find((e) => e.userId === user);
    if (!ev) throw new Error(`No deposit uploaded for ${user}; run "Upload a Successful Deposit event for workflow E2E user N" first.`);
    return ev;
};

/** Event release: after the user's latest deposit the Delay released it (Logs: live-event release) and it reached the Action node. */
async function releasedByDeposit(world: PlaywrightWorld, user: string): Promise<void> {
    const deposit = lastDepositOf(world, user);
    const wf = await loadWorkflow(world);
    const action = await trackNode(world, wf, nodeOfType(wf, 'action'));
    const expected = `${user} leaves the Delay node of ${label(world, wf)} after its deposit (${deposit.eventTime}) and reaches the Action node`;
    if (action.source === 'customer list') {
        const left = action.byUser[user];
        await reportOutcome(world, expected, `[customer list] ${user}: action ${left ?? '-'}${left ? ` (${fmt(minutesBetween(deposit.eventTime, left))} min after the deposit)` : ''}`,
            !!left && left >= deposit.eventTime);
        return;
    }
    const delay = await trackNode(world, wf, nodeOfType(wf, 'delay'));
    const live = delay.live.filter((l) => l.at >= deposit.eventTime);
    const after = totalCount(action, deposit.eventTime);
    await reportOutcome(world, expected,
        `[Logs] live-event release after the deposit: ${live.map((l) => `${l.at.slice(11, 19)} ${l.message}`).join(' | ') || 'none'}; Action processed after the deposit: ${after} (${describeTrack(action)})`,
        live.length > 0 && after >= 1, { delay, action });
}

async function actionOnce(world: PlaywrightWorld, users: string[]): Promise<void> {
    const wf = await loadWorkflow(world);
    const action = nodeOfType(wf, 'action');
    const expected = `${users.join(', ')} passed the Action node of ${label(world, wf)} exactly once, and no other user reached it`;
    const track = await trackNode(world, wf, action);
    if (track.source === 'customer list') {
        // One communication per visit: no event type (Entered, Exited, ...) may repeat for a user.
        const problems = users.filter((u) => {
            const types = track.events.filter((e) => e.userId === u).map((e) => e.eventType);
            return types.length === 0 || new Set(types).size !== types.length;
        });
        const extra = [...new Set(track.events.map((e) => e.userId))].filter((u) => !users.includes(u));
        await reportOutcome(world, expected, `[customer list] ${describeEvents(track.events, users)}${extra.length ? `; other users at Action: ${extra.join(', ')}` : ''}`,
            problems.length === 0 && extra.length === 0, { actionEvents: track.events });
        return;
    }
    await reportOutcome(world, expected, `[Logs] Action processed ${totalCount(track)} user(s) in total, expected ${users.length}: ${describeTrack(track)}`,
        totalCount(track) === users.length, { action: track });
}

// Steps

Then('Wait for the E2E users to enter the workflow Delay node', LONG_STEP, async function (this: PlaywrightWorld) {
    await waitForDelayEntry(this, e2eUsers(this));
});

Then('Wait for E2E users {string} to enter the workflow Delay node', LONG_STEP, async function (this: PlaywrightWorld, positions: string) {
    await waitForDelayEntry(this, usersAt(this, positions));
});

Then('Wait for E2E users {string} to enter the Delay node of both E2E workflows', LONG_STEP, async function (this: PlaywrightWorld, positions: string) {
    await onBothWorkflows(this, () => waitForDelayEntry(this, usersAt(this, positions)));
});

Then('Verify E2E users {string} stay in the workflow Delay node for {int} minutes', LONG_STEP, async function (this: PlaywrightWorld, positions: string, minutes: number) {
    await stayInDelay(this, usersAt(this, positions), Date.now() + minutes * 60000, `for ${minutes} min`);
});

/** Waits until the users' own Delay entry + N minutes + the processing allowance; they must not move meanwhile. */
Then('Verify E2E users {string} stay in the workflow Delay node until {int} minutes plus the processing allowance after their entry', LONG_STEP, async function (this: PlaywrightWorld, positions: string, minutes: number) {
    const users = usersAt(this, positions);
    const due = Math.max(...users.map((u) => Date.parse(delayEntryOf(this, u)))) + minutes * 60000 + ALLOWANCE_MS;
    await stayInDelay(this, users, due, `until ${new Date(due).toISOString()} (entry + ${minutes} min + ${ALLOWANCE_MS / 60000} min allowance)`);
});

Then('Wait for E2E users {string} to reach the workflow Exit node', LONG_STEP, async function (this: PlaywrightWorld, positions: string) {
    await waitForExit(this, usersAt(this, positions));
});

Then('Wait for E2E users {string} to reach the Exit node of both E2E workflows', LONG_STEP, async function (this: PlaywrightWorld, positions: string) {
    await onBothWorkflows(this, () => waitForExit(this, usersAt(this, positions)));
});

/** Timer release: each user reached the Action node only after its own N minutes from its Delay entry. */
Then('Verify E2E users {string} left the workflow Delay node after their own {int} minutes', async function (this: PlaywrightWorld, positions: string, minutes: number) {
    const users = usersAt(this, positions);
    const wf = await loadWorkflow(this);
    const action = await trackNode(this, wf, nodeOfType(wf, 'action'));
    const expected = `each user moves to the Action node only after ${minutes} min from its own Delay entry (timer release; processing allowance ${ALLOWANCE_MS / 60000} min)`;
    if (action.source === 'customer list') {
        const rows = users.map((u) => {
            const entered = delayEntryOf(this, u);
            const left = action.byUser[u];
            return { user: u, entered, left, waited: left ? minutesBetween(entered, left) : NaN };
        });
        await reportOutcome(this, expected, `[customer list] ${rows.map((r) => `${r.user}: entered ${r.entered}, action ${r.left ?? '-'}, waited ${Number.isFinite(r.waited) ? fmt(r.waited) : '-'} min`).join('; ')}`,
            rows.every((r) => Number.isFinite(r.waited) && r.waited * 60000 >= minutes * 60000 - EARLY_TOLERANCE_MS), { timing: rows });
        return;
    }
    const entered = delayEntryOf(this, users[0]);
    const due = new Date(Date.parse(entered) + minutes * 60000 - EARLY_TOLERANCE_MS).toISOString();
    const afterTimer = totalCount(action, due);
    await reportOutcome(this, expected,
        `[Logs] Delay entry ${entered}; Action processed after ${minutes} min: ${afterTimer} of ${users.length} (${action.counts.map((c) => `${c.at.slice(11, 19)} +${c.count} = ${fmt(minutesBetween(entered, c.at))} min`).join(', ') || 'none'})`,
        afterTimer >= users.length, { action });
});

/** Event release: the user reached the Action node before its timer could have released it. */
Then('Verify E2E user {int} left the workflow Delay node before its {int} minute timer', async function (this: PlaywrightWorld, position: number, minutes: number) {
    const user = userAt(this, position);
    const entered = delayEntryOf(this, user);
    const wf = await loadWorkflow(this);
    const action = await trackNode(this, wf, nodeOfType(wf, 'action'));
    const expected = `${user} moves to the Action node before ${minutes} min (released by the event, not the timer)`;
    if (action.source === 'customer list') {
        const left = action.byUser[user];
        const waited = left ? minutesBetween(entered, left) : NaN;
        await reportOutcome(this, expected, `[customer list] ${user}: entered ${entered}, action ${left ?? '-'}, waited ${Number.isFinite(waited) ? fmt(waited) : '-'} min`,
            Number.isFinite(waited) && waited < minutes);
        return;
    }
    const due = new Date(Date.parse(entered) + minutes * 60000).toISOString();
    const delay = await trackNode(this, wf, nodeOfType(wf, 'delay'));
    const beforeTimer = totalCount(action, '', due);
    await reportOutcome(this, expected,
        `[Logs] Delay entry ${entered}; live-event release: ${delay.live.map((l) => `${l.at.slice(11, 19)} ${l.message}`).join(' | ') || 'none'}; ` +
        `Action processed before ${minutes} min: ${beforeTimer} (${describeTrack(action)})`,
        beforeTimer >= 1 && delay.live.length > 0, { delay, action });
});

Then('Verify the deposit released E2E user {int} from the workflow Delay node', async function (this: PlaywrightWorld, position: number) {
    await releasedByDeposit(this, userAt(this, position));
});

Then('Verify the deposit released E2E user {int} from the Delay node of both E2E workflows', async function (this: PlaywrightWorld, position: number) {
    await onBothWorkflows(this, () => releasedByDeposit(this, userAt(this, position)));
});

/** Waits until the latest Delay entry of the users + minutes + processing allowance, e.g. before a duplicate-release check. */
Then('Wait until {int} minutes plus the processing allowance have passed since the Delay entry of E2E users {string}', LONG_STEP, async function (this: PlaywrightWorld, minutes: number, positions: string) {
    const users = usersAt(this, positions);
    const latest = Math.max(...users.map((u) => Date.parse(delayEntryOf(this, u))));
    const due = latest + minutes * 60000 + ALLOWANCE_MS;
    if (due > Date.now()) {
        await pollUntil(async () => Date.now(), (now) => now >= due,
            { description: `${minutes} min + allowance after the Delay entry`, timeoutMs: due - Date.now() + 60000, intervalMs: 30000 });
    }
    ExtentTestManager.logPass(`Waited until ${new Date(due).toISOString()} (Delay entry + ${minutes} min + ${ALLOWANCE_MS / 60000} min allowance)`);
});

Then('Verify E2E users {string} passed the workflow Action node exactly once', async function (this: PlaywrightWorld, positions: string) {
    await actionOnce(this, usersAt(this, positions));
});

Then('Verify E2E users {string} passed the Action node of both E2E workflows exactly once', async function (this: PlaywrightWorld, positions: string) {
    await onBothWorkflows(this, () => actionOnce(this, usersAt(this, positions)));
});

/** Republishing must not enroll a waiting user again (Logs: enrollment total equals the users that entered). */
Then('Verify E2E users {string} were enrolled only once', async function (this: PlaywrightWorld, positions: string) {
    const users = usersAt(this, positions);
    const wf = await loadWorkflow(this);
    const track = await trackNode(this, wf, nodeOfType(wf, 'enrollmentTrigger'));
    const entered = Object.keys(entriesOf(this));
    const expected = `${users.join(', ')} enrolled once (no new enrollment after the workflow was republished)`;
    if (track.source === 'customer list') {
        const twice = users.filter((u) => track.events.filter((e) => e.userId === u && /enter/i.test(e.eventType)).length > 1);
        await reportOutcome(this, expected, `[customer list] ${describeEvents(track.events, users)}`, twice.length === 0, { enrollment: track.events });
        return;
    }
    await reportOutcome(this, expected, `[Logs] enrollment processed ${totalCount(track)} user(s) in total for ${entered.length} user(s) that entered the Delay: ${describeTrack(track)}`,
        totalCount(track) === entered.length, { enrollment: track });
});

// ─── Edit / duplicate (WF-07, WF-08, WF-09) ─────────────────────────────────

/** Adds the user to the case audience in the Audience module and updates it; waits for the new count. */
Then('Add E2E user {int} to the case audience and update it', LONG_STEP, async function (this: PlaywrightWorld, position: number) {
    const id = caseId(this);
    const user = userAt(this, position);
    const c = getCase(id);
    if (!c.audience?.title) throw new Error(`${id}: no case audience recorded; create it with "Create a new workflow E2E Static audience for users ..."`);
    const title = c.audience.title;
    const count = c.audience.userIds.length + 1;
    const audience = getAudiencePage(this);
    await getNav(this).navigateTo('Audience');
    await audience.clickTabStatic();
    await audience.searchByName(title);
    await audience.verifyAudienceInList(title);
    await audience.openEditForAudience(title);
    await audience.verifyEditPageTitle(title);
    await audience.clickAddValuesBtn();
    await audience.enterUserIdValue(user);
    await audience.clickPreviewButton();
    const preview = await audience.getPreviewRecordCount();
    if (preview !== count) throw new Error(`Audience preview shows ${preview} customers after adding ${user}, expected ${count}`);
    await audience.saveUpdatedAudience();
    await waitForAudienceCount(this, title, count, 10 * 60 * 1000);
    updateCase(id, (rec) => { rec.audience = { title, userIds: [...(rec.audience?.userIds ?? []), user] }; });
    ExtentTestManager.logPass(`Added ${user} to audience "${title}" (now ${count} customers)`);
});

/** Opens the active workflow from its report, edits the Delay node and applies it; publishing is a separate step. */
async function editDelay(world: PlaywrightWorld, config: { minutes?: number; successfulDeposit?: boolean }, description: string): Promise<void> {
    const wf = await loadWorkflow(world);
    const workflow = getWorkflowPage(world);
    await getReport(world).open(wf.id);
    await workflow.clickReportEdit();
    await workflow.clickNodeEdit('2');
    await workflow.configureDelay(config);
    await workflow.clickNodeApply();
    world['pendingDelayConfig'] = { ...config, description };
    ExtentTestManager.logPass(`Delay node edited to ${description} (not yet published)`);
}

Then('Edit the E2E workflow Delay to wait for a Successful Deposit only', async function (this: PlaywrightWorld) {
    await editDelay(this, { successfulDeposit: true }, 'event-only Successful Deposit');
});

Then('Edit the E2E workflow Delay to wait {int} minutes only', async function (this: PlaywrightWorld, minutes: number) {
    await editDelay(this, { minutes }, `time-only ${minutes} min`);
});

/** Publish changes -> Update; then the saved Delay must have the new settings and the same node id. */
Then('Publish the E2E workflow changes and verify the Delay node id is unchanged', LONG_STEP, async function (this: PlaywrightWorld) {
    const id = caseId(this);
    const pending: { minutes?: number; successfulDeposit?: boolean; description: string } = this['pendingDelayConfig'];
    if (!pending) throw new Error('No pending Delay edit; run "Edit the E2E workflow Delay to ..." first.');
    const before = workflowOf(getCase(id));
    await getWorkflowPage(this).publishChanges();
    const publishedAt = new Date().toISOString();
    const report = getReport(this);
    const saved = await pollUntil(() => report.getWorkflow(before.id), (w) => {
        const d = w.nodes.find((n) => n.type === 'delay')?.nodeData ?? {};
        return !!d.liveEvent === !!pending.successfulDeposit && !!d.amountOfTime === !!pending.minutes
            && (!pending.minutes || d.amountOfTime?.value === pending.minutes);
    }, { description: `the Delay of ${before.name} to be saved as ${pending.description}`, timeoutMs: 3 * 60 * 1000, intervalMs: 10000 });
    const delay = nodeOfType(saved, 'delay');
    updateCase(id, (c) => { c.workflow = { ...workflowOf(c), changesPublishedAt: publishedAt, delayConfig: pending.description }; });
    this['pendingDelayConfig'] = undefined;
    await reportOutcome(this, `the workflow is republished with the Delay as ${pending.description} on the same node (${before.delayNodeId})`,
        `published changes at ${publishedAt}; status ${saved.status}; Delay node ${delay.id}: ${JSON.stringify(delay.nodeData)}`,
        delay.id === before.delayNodeId);
});

Then('Duplicate the E2E workflow and publish the copy', LONG_STEP, async function (this: PlaywrightWorld) {
    const id = caseId(this);
    const original = workflowOf(getCase(id));
    const name = `${original.name}-dup`;
    const workflow = getWorkflowPage(this);
    await getNav(this).navigateTo('Workflow');
    await workflow.openRowMenu(original.name);
    await workflow.clickRowDuplicate();
    await workflow.confirmDuplicate(name);
    await workflow.clickPublish();
    const { start } = await chooseWindow(this);
    await workflow.confirmPublish();
    const { found, message } = await workflow.checkLimitReachedPopup();
    if (found) throw new Error(`Duplicated workflow was not published: ${message}`);
    const report = getReport(this);
    const summary = await pollUntil(() => report.findWorkflowByName(name), (w) => !!w && w.status !== 'draft',
        { description: `duplicated workflow "${name}" to be published`, timeoutMs: 3 * 60 * 1000, intervalMs: 10000 });
    const detail = await report.getWorkflow(summary.id);
    const delay = nodeOfType(detail, 'delay');
    updateCase(id, (c) => { c.workflow = { ...workflowOf(c), duplicate: { name, id: summary.id, url: report.reportUrl(summary.id), delayNodeId: delay.id } }; });
    await this.attach(`Duplicate ${name}\nid: ${summary.id}\nstatus: ${summary.status}\nstart: ${start.toISOString()}\nDelay node: ${delay.id} (${JSON.stringify(delay.nodeData)})`, 'text/plain');
    ExtentTestManager.logPass(`Duplicated ${original.name} as ${name} (${summary.status}); Delay node ${delay.id}`);
});

Then('Verify the original and duplicated E2E workflows have different Delay node ids', async function (this: PlaywrightWorld) {
    const w = workflowOf(getCase(caseId(this)));
    const report = getReport(this);
    const original = nodeOfType(await report.getWorkflow(w.id), 'delay');
    this['wfTarget'] = 'duplicate';
    const copy = nodeOfType(await loadWorkflow(this), 'delay');
    this['wfTarget'] = undefined;
    await reportOutcome(this, 'the duplicate has its own Delay node id and the same Delay settings',
        `original ${w.name} Delay ${original.id} ${JSON.stringify(original.nodeData?.liveEvent ?? original.nodeData?.amountOfTime)}; duplicate ${w.duplicate?.name} Delay ${copy.id} ${JSON.stringify(copy.nodeData?.liveEvent ?? copy.nodeData?.amountOfTime)}`,
        original.id !== copy.id && JSON.stringify(original.nodeData?.liveEvent?.groups?.map((g: any) => g.event_name)) === JSON.stringify(copy.nodeData?.liveEvent?.groups?.map((g: any) => g.event_name)));
});

/**
 * Report evidence (screenshots of the node customer lists and Logs tab) and the data the final
 * report-evidence check uses. Runs before cleanup so the workflow still exists.
 */
Then('Capture the workflow report node customer lists and Logs', async function (this: PlaywrightWorld) {
    const wf = await loadWorkflow(this);
    const report = getReport(this);
    await report.open(wf.id);
    await captureScreenshot(this, { label: 'Workflow report overview', writeToDisk: false, filePrefix: 'WF-E2E-REPORT', attachToReport: true });
    for (const type of ['delay', 'action', 'exitFlow']) {
        const node = nodeOfType(wf, type);
        if (await report.openNodeCustomers(node)) {
            await captureScreenshot(this, { label: `${node.name || type} customers`, writeToDisk: false, filePrefix: `WF-E2E-NODE-${type}`, attachToReport: true });
            await report.closeNodeCustomers();
        } else {
            ExtentTestManager.logInfo(`Node ${type} (${node.id}) not found on the report canvas; screenshot skipped`);
        }
    }
    await report.openLogsTab();
    await captureScreenshot(this, { label: 'Workflow Logs tab', writeToDisk: false, filePrefix: 'WF-E2E-LOGS', attachToReport: true });
    this['workflowLogs'] = await report.getLogs(wf.id);
    this['workflowDelayList'] = await report.getEventsForNode(wf.id, nodeOfType(wf, 'delay'));
    ExtentTestManager.logPass(`Report evidence captured; ${this['workflowLogs'].length} Logs entries, ${this['workflowDelayList'].length} Delay customer-list records`);
});

// ─── Branch (WF-06) ──────────────────────────────────────────────────────────

/** Yes/No Branch with "have Performed Successful Deposit, Atleast 1 time, in Today" (the rule builder default for the event). */
Then('Add a Yes-No Branch for a Successful Deposit today after the last step', async function (this: PlaywrightWorld) {
    const workflow = getWorkflowPage(this);
    const audience = getAudiencePage(this);
    await workflow.addNodeAfterLastStep('Branch');
    await workflow.clickBranchType('Yes/No');
    await workflow.clickBranchCriteria();
    await audience.openEventPerformed();
    await audience.selectSuccessfulDepositEvent();
    const rule = (await audience.getRuleBuilderText()).replace(/\s+/g, ' ');
    // The count (1) sits in an input box, so the page text reads "Atleast time in Today".
    if (!/Performed Successful Deposit Atleast\s*(1\s*)?time in Today/i.test(rule)) {
        throw new Error(`Branch criteria is not "Performed Successful Deposit Atleast 1 time in Today": ${rule.slice(0, 300)}`);
    }
    await workflow.addCriteriaAndReturnToWorkflow();
    const flyout = (await workflow.getFlyoutText()).replace(/\s+/g, ' ');
    if (!/Successful Deposit/i.test(flyout)) throw new Error(`Branch criteria not added. Flyout text: ${flyout.slice(0, 300)}`);
    await workflow.clickNodeApply();
    ExtentTestManager.logPass('Added Yes/No Branch: have Performed Successful Deposit Atleast 1 time in Today');
});

Then('Add the Action node with communication {string} on the Branch Yes path', async function (this: PlaywrightWorld, content: string) {
    const workflow = getWorkflowPage(this);
    await workflow.addNodeOnBranchPath('Yes', 'Action');
    await workflow.clickAddContent();
    await workflow.searchCommunication(content);
    await workflow.clickFirstCommunication(content);
    await workflow.clickNodeApply();
    ExtentTestManager.logPass(`Added Action (${content}) on the Branch Yes path`);
});

Then('Add an Exit node marked as goal after the Action on the Branch Yes path', async function (this: PlaywrightWorld) {
    const workflow = getWorkflowPage(this);
    await workflow.addNodeAfterBranchPathStep('Exit Flow');
    await workflow.setExitMarkAsGoal(true);
    await workflow.clickNodeApply();
    ExtentTestManager.logPass('Added Exit (marked as goal) after the Action on the Branch Yes path');
});

Then('Add an Exit node on the Branch No path', async function (this: PlaywrightWorld) {
    const workflow = getWorkflowPage(this);
    await workflow.addNodeOnBranchPath('No', 'Exit Flow');
    await workflow.setExitMarkAsGoal(false);
    await workflow.clickFlyoutApply();
    ExtentTestManager.logPass('Added Exit (not a goal) on the Branch No path');
});

/** The two Exit nodes: Yes = the one linked from the Action node, No = the other one. */
function branchExits(wf: WorkflowDetail): { Yes: WorkflowNode; No: WorkflowNode } {
    const exits = wf.nodes.filter((n) => n.type === 'exitFlow');
    const action = nodeOfType(wf, 'action');
    const yes = exits.find((x) => wf.edges.some((e) => action.reportIds.includes(e.source) && x.reportIds.includes(e.target)));
    const no = exits.find((x) => x !== yes);
    if (exits.length !== 2 || !yes || !no) {
        throw new Error(`${wf.name}: expected a Yes Exit after the Action and a No Exit (exits: ${exits.map((x) => x.id).join(', ')}; edges: ${wf.edges.map((e) => `${e.source}->${e.target}`).join(', ')})`);
    }
    return { Yes: yes, No: no };
}

const exitOn = (wf: WorkflowDetail, path: string): WorkflowNode => {
    if (path !== 'Yes' && path !== 'No') throw new Error(`Unknown Branch path "${path}"`);
    return branchExits(wf)[path];
};

Then('Wait for E2E users {string} to reach the Branch {string} Exit node', LONG_STEP, async function (this: PlaywrightWorld, positions: string, path: string) {
    const users = usersAt(this, positions);
    const wf = await loadWorkflow(this);
    const exit = exitOn(wf, path);
    const track = await pollUntil(() => trackNode(this, wf, exit),
        (t) => t.source === 'customer list' ? users.every((u) => t.byUser[u]) : totalCount(t) >= users.length,
        { description: `${users.join(', ')} to reach the ${path} Exit of ${wf.name}`, timeoutMs: ENTRY_TIMEOUT_MS + ALLOWANCE_MS + 30 * 60 * 1000, intervalMs: POLL_INTERVAL_MS });
    ExtentTestManager.logPass(`[${track.source}] ${path} Exit reached: ${describeTrack(track)}`);
});

/** Timer path: the users reached the Exit only after their own N minutes in the Delay. */
Then('Verify E2E users {string} reached the Branch {string} Exit node only after their own {int} minutes', async function (this: PlaywrightWorld, positions: string, path: string, minutes: number) {
    const users = usersAt(this, positions);
    const wf = await loadWorkflow(this);
    const track = await trackNode(this, wf, exitOn(wf, path));
    const expected = `${users.join(', ')} reach the ${path} Exit only after ${minutes} min from their Delay entry (timer release)`;
    if (track.source === 'customer list') {
        const rows = users.map((u) => ({ user: u, entered: delayEntryOf(this, u), exited: track.byUser[u] }));
        const waits = rows.map((r) => (r.exited ? minutesBetween(r.entered, r.exited) : NaN));
        await reportOutcome(this, expected, `[customer list] ${rows.map((r, i) => `${r.user}: entered ${r.entered}, ${path} Exit ${r.exited ?? '-'}, ${Number.isFinite(waits[i]) ? fmt(waits[i]) : '-'} min`).join('; ')}`,
            waits.every((w) => Number.isFinite(w) && w * 60000 >= minutes * 60000 - EARLY_TOLERANCE_MS));
        return;
    }
    const entered = delayEntryOf(this, users[0]);
    const due = new Date(Date.parse(entered) + minutes * 60000 - EARLY_TOLERANCE_MS).toISOString();
    const after = totalCount(track, due);
    await reportOutcome(this, expected,
        `[Logs] Delay entry ${entered}; ${path} Exit processed after ${minutes} min: ${after} of ${users.length} (${track.counts.map((c) => `${c.at.slice(11, 19)} +${c.count} = ${fmt(minutesBetween(entered, c.at))} min`).join(', ') || 'none'})`,
        after >= users.length, { exit: track });
});

/** Each user took the intended path and no user took both (Logs: counts per Exit). */
Then('Verify E2E users {string} took the Branch Yes path and E2E users {string} took the No path', async function (this: PlaywrightWorld, yesPositions: string, noPositions: string) {
    const yesUsers = usersAt(this, yesPositions);
    const noUsers = usersAt(this, noPositions);
    const wf = await loadWorkflow(this);
    const exits = branchExits(wf);
    const yes = await trackNode(this, wf, exits.Yes);
    const no = await trackNode(this, wf, exits.No);
    const expected = `Yes path (deposit today): ${yesUsers.join(', ')}; No path: ${noUsers.join(', ')}`;
    if (yes.source === 'customer list' || no.source === 'customer list') {
        const yesIds = Object.keys(yes.byUser).sort();
        const noIds = Object.keys(no.byUser).sort();
        await reportOutcome(this, expected, `[customer list] Yes Exit: ${yesIds.join(', ') || 'none'}; No Exit: ${noIds.join(', ') || 'none'}`,
            JSON.stringify(yesIds) === JSON.stringify([...yesUsers].sort()) && JSON.stringify(noIds) === JSON.stringify([...noUsers].sort()));
        return;
    }
    await reportOutcome(this, expected, `[Logs] Yes Exit processed ${totalCount(yes)} (${describeTrack(yes)}); No Exit processed ${totalCount(no)} (${describeTrack(no)})`,
        totalCount(yes) === yesUsers.length && totalCount(no) === noUsers.length, { yesExit: yes, noExit: no });
});

// ─── Cleanup ─────────────────────────────────────────────────────────────────

async function deleteWorkflow(world: PlaywrightWorld, name: string): Promise<void> {
    const workflow = getWorkflowPage(world);
    const report = getReport(world);
    await getNav(world).navigateTo('Workflow');
    if ((await report.findWorkflowByName(name))?.status === 'active') {
        await workflow.openRowMenu(name);
        await workflow.clickRowSetInactive();
        await getNav(world).navigateTo('Workflow');
    }
    await workflow.openRowMenu(name);
    await workflow.clickRowDelete(name);
    await pollUntil(() => report.findWorkflowByName(name), (found) => !found,
        { description: `workflow "${name}" to be deleted`, timeoutMs: 2 * 60 * 1000, intervalMs: 10000 });
}

/** Sets the case workflow (and its duplicate, if any) inactive and deletes it. */
Then('Set the E2E workflow inactive and delete it', async function (this: PlaywrightWorld) {
    const id = caseId(this);
    const w = workflowOf(getCase(id));
    if (w.duplicate?.id && !w.duplicate.deleted) {
        await deleteWorkflow(this, w.duplicate.name);
        updateCase(id, (c) => { const cw = workflowOf(c); c.workflow = { ...cw, duplicate: { ...cw.duplicate!, deleted: true } }; });
    }
    await deleteWorkflow(this, w.name);
    updateCase(id, (c) => { c.workflow = { ...workflowOf(c), deleted: true }; });
    ExtentTestManager.logPass(`Workflow ${w.name}${w.duplicate ? ` and ${w.duplicate.name}` : ''} set inactive and deleted`);
});

/** Deletes the audience created for this case ("Create a new workflow E2E Static audience ..."). */
Then('Delete the E2E case audience', async function (this: PlaywrightWorld) {
    const id = caseId(this);
    const title = getCase(id).audience?.title;
    if (!title) throw new Error(`${id}: no case audience recorded`);
    const audience = getAudiencePage(this);
    await getNav(this).navigateTo('Audience');
    await audience.clickTabStatic();
    await audience.searchByName(title);
    await audience.verifyAudienceInList(title);
    await audience.deleteAudience(title);
    await pollUntil(() => audience.getAudienceSummaryByTitle(title), (a) => !a,
        { description: `audience "${title}" to be deleted`, timeoutMs: 2 * 60 * 1000, intervalMs: 10000 });
    ExtentTestManager.logPass(`Case audience "${title}" deleted`);
});

/**
 * End-of-run cleanup (scripts/workflow-e2e-batches.js): deletes what this run left on the environment.
 * Workflows of cases that failed before their own cleanup, case audiences, and the shared audiences created
 * since E2E_CLEANUP_SINCE. Refuses to run without E2E_CLEANUP_SINCE so it never removes older test data.
 */
Then('Delete the workflow E2E data created since the run started', LONG_STEP, async function (this: PlaywrightWorld) {
    const since = process.env.E2E_CLEANUP_SINCE;
    if (!since) throw new Error('E2E_CLEANUP_SINCE is not set; this cleanup only runs from scripts/workflow-e2e-batches.js');
    const report = getReport(this);
    const audience = getAudiencePage(this);
    const done: string[] = [];
    const failed: string[] = [];
    const attempt = async (what: string, fn: () => Promise<void>): Promise<void> => {
        try { await fn(); done.push(what); } catch (err) { failed.push(`${what}: ${String(err).slice(0, 200)}`); }
    };
    const deleteAudience = async (title: string): Promise<void> => {
        if (!await audience.getAudienceSummaryByTitle(title)) return;
        await getNav(this).navigateTo('Audience');
        await audience.searchByName(title);
        await audience.verifyAudienceInList(title);
        await audience.deleteAudience(title);
        await pollUntil(() => audience.getAudienceSummaryByTitle(title), (a) => !a,
            { description: `audience "${title}" to be deleted`, timeoutMs: 2 * 60 * 1000, intervalMs: 10000 });
    };
    const cases = listCases().filter((c) => c.createdAt >= since);
    // Workflows first: an audience used by a workflow cannot be deleted.
    for (const c of cases) {
        const w = c.workflow;
        for (const name of [w?.duplicate && !w.duplicate.deleted ? w.duplicate.name : '', w && !w.deleted ? w.name : ''].filter(Boolean)) {
            if (await report.findWorkflowByName(name)) await attempt(`workflow ${name} (${c.caseId})`, () => deleteWorkflow(this, name));
        }
    }
    // Case audiences (WF-07/08 own theirs) and shared audiences created by this run.
    const shared = listSharedAudiences().filter((a) => a.createdAt >= since);
    const titles = new Set([
        ...cases.map((c) => c.audience?.title).filter((t): t is string => !!t),
        ...shared.map((a) => a.title),
    ]);
    for (const title of titles) await attempt(`audience ${title}`, () => deleteAudience(title));
    for (const a of shared) if (!failed.some((f) => f.includes(a.title))) dropSharedAudience(a.userIds);
    await this.attach(`Cleanup since ${since}\nDeleted: ${done.join('; ') || 'nothing'}\nFailed: ${failed.join('; ') || 'none'}`, 'text/plain');
    if (failed.length) throw new Error(`Cleanup could not delete: ${failed.join('; ')}`);
    ExtentTestManager.logPass(`Cleanup done: ${done.length} item(s) deleted`);
});

/**
 * Report evidence check, after cleanup so it never leaves the workflow behind. Fails when the Delay node
 * customer list misses the users (known on Demo) or the Logs have no Delay entry (known on Dev, Flink).
 * The functional result is already recorded by "Mark the E2E workflow case as passed".
 */
Then('Verify the workflow report node customer lists and Logs recorded the users', async function (this: PlaywrightWorld) {
    const id = caseId(this);
    const users = e2eUsers(this);
    const logs: WorkflowLogEntry[] = this['workflowLogs'];
    const list: WorkflowNodeEvent[] = this['workflowDelayList'];
    if (!logs || !list) throw new Error('Report evidence was not read; run "Capture the workflow report node customer lists and Logs" first.');
    const listed = users.filter((u) => list.some((e) => e.userId === u));
    const delayLogs = logs.filter((l) => /delay node .*processed/i.test(l.message));
    const listOk = listed.length === users.length;
    const logsOk = delayLogs.length > 0;
    const expected = `Delay node customer list shows ${users.join(', ')}; Logs tab has the Delay "processed N users" entries`;
    const observed = `customer list: ${listed.length}/${users.length} users (${listed.join(', ') || 'empty'}) — ${listOk ? 'OK' : 'FAILED'}; ` +
        `Logs: ${logs.length} entries, Delay: ${delayLogs.map((l) => `${l.timestamp.slice(11, 19)} ${l.message}`).join(' | ') || 'none'} — ${logsOk ? 'OK' : 'FAILED'}`;
    await this.attach(`Report evidence\nExpected: ${expected}\nObserved: ${observed}\nStatus: ${listOk && logsOk ? 'PASSED' : 'FAILED'}`, 'text/plain');
    setPhase(id, 'report', { status: listOk && logsOk ? 'passed' : 'failed', expected, observed, checkedAt: new Date().toISOString() });
    if (!listOk || !logsOk) throw new Error(`[${id}] Report evidence: ${observed}`);
    ExtentTestManager.logPass(observed);
});

Then('Mark the E2E workflow case as passed', async function (this: PlaywrightWorld) {
    const id = caseId(this);
    setPhase(id, 'setup', { status: 'passed', checkedAt: new Date().toISOString() });
    const c = getCase(id);
    await this.attach(`${id} PASSED: ${c.title} verified for ${c.workflow?.name}`, 'text/plain');
    ExtentTestManager.logPass(`${id} passed`);
});
