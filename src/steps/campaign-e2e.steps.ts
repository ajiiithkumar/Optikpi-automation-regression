import { After, Given, Status, Then } from '@cucumber/cucumber';
import { CampaignPage } from '../pages/campaign.page';
import { AudiencePage } from '../pages/audience.page';
import { CampaignReportPage } from '../pages/campaign-report.page';
import { DataPlatformPage } from '../pages/data-platform.page';
import { DateTimePicker } from '../pages/components/date-time-picker.component';
import { NavigationBar } from '../pages/components/navigation-bar.component';
import { WorkflowPage } from '../pages/workflow.page';
import { ExtentTestManager } from '../utils/extent-test-manager';
import { PlaywrightWorld } from '../support/world';
import { readUsersCsv, uniqueId } from '../utils/helper';
import { envMinutes, pollUntil } from '../utils/polling';
import { createSuccessfulDepositCsv } from '../utils/customer-event-csv';
import {
    EngagementRecord, NON_SEND_STATUSES, FAILED_STATUS, UserCommunications,
    countFor, describeSummary, summarizeByUser,
} from '../utils/campaign-engagement';
import {
    CaseState, RUN_ID, STATE_DIR, getCase, setPhase, startCase, updateCase, withSharedAudienceLock,
    dropSharedAudience, getSharedAudience, saveSharedAudience,
} from '../utils/campaign-e2e-state';

/**
 * Campaign execution E2E (features/e2e/campaign-execution.feature).
 * Create scenarios publish every campaign first; Verify scenarios then check each campaign's
 * initial send through the Logs and Engagement tabs. Later hourly executions and 1-day
 * re-enrollments are out of scope, so a run finishes in one go. A case that cannot run is Blocked.
 */

const getCampaignPage = (world: PlaywrightWorld): CampaignPage => new CampaignPage(world.page);
const getAudiencePage = (world: PlaywrightWorld): AudiencePage => new AudiencePage(world.page);
const getReportPage = (world: PlaywrightWorld): CampaignReportPage => new CampaignReportPage(world.page);
const getDataPlatformPage = (world: PlaywrightWorld): DataPlatformPage => new DataPlatformPage(world.page);
const getDatePicker = (world: PlaywrightWorld): DateTimePicker => new DateTimePicker(world.page);
const getNav = (world: PlaywrightWorld): NavigationBar => new NavigationBar(world.page);
const getWorkflowPage = (world: PlaywrightWorld): WorkflowPage => new WorkflowPage(world.page);

const EXECUTION_TIMEOUT_MS = envMinutes('E2E_EXECUTION_TIMEOUT_MIN', 30);
const PROCESSING_WINDOW_MS = envMinutes('E2E_PROCESSING_WINDOW_MIN', 10);
/**
 * Report update order on Dev: Logs at launch, Engagement a few minutes later. The Overview counters are
 * not validated: they do not update reliably on Dev/Demo (known application issue), so Logs + Engagement are the source of truth.
 */
const POLL_INTERVAL_MS = 20000;
/** Step timeout for steps that wait on backend execution. */
const LONG_STEP = { timeout: EXECUTION_TIMEOUT_MS + PROCESSING_WINDOW_MS + 10 * 60 * 1000 };

// ─── World / state helpers ───────────────────────────────────────────────────

const caseId = (world: PlaywrightWorld): string => {
    const id = world['e2eCaseId'];
    if (!id) throw new Error('E2E case not started. Add "Given Start E2E case ..." or "Given Load the created E2E case ..." first.');
    return id;
};

const e2eUsers = (world: PlaywrightWorld): string[] => {
    const users: string[] = world['e2eUsers'];
    if (!users?.length) throw new Error('No E2E users set. Add "Given Use users ... from users.csv for the E2E case".');
    return users;
};

/** Users currently in the case's audience (case 2 starts with a subset and adds one later). */
const audienceUsers = (world: PlaywrightWorld): string[] => world['currentAudienceUserIds'] ?? e2eUsers(world);

const userAt = (world: PlaywrightWorld, position: number): string => {
    const users = e2eUsers(world);
    const id = users[position - 1];
    if (!id) throw new Error(`E2E user ${position} not defined (case has ${users.length} users: ${users.join(', ')})`);
    return id;
};

const campaignIdOf = (c: CaseState): string => {
    if (!c.campaign?.id) throw new Error(`${c.caseId}: campaign id not recorded. Run "Record the published E2E campaign" first.`);
    return c.campaign.id;
};

/** Writes setup / expected / observed / status into the report and the state file, then fails if needed. */
async function reportOutcome(
    world: PlaywrightWorld,
    phase: string,
    expected: string,
    observed: string,
    passed: boolean,
    evidence: Record<string, unknown> = {},
): Promise<void> {
    const id = caseId(world);
    const c = getCase(id);
    const lines = [
        `Case: ${id} — ${c?.title ?? ''}`,
        `Phase: ${phase}`,
        `Setup: ${c?.setup ?? ''}`,
        `Campaign: ${c?.campaign?.name ?? '-'} (${c?.campaign?.id ?? '-'}) ${c?.campaign?.url ?? ''}`,
        `Expected: ${expected}`,
        `Observed: ${observed}`,
        `Status: ${passed ? 'PASSED' : 'FAILED'}`,
    ];
    await world.attach(lines.join('\n'), 'text/plain');
    if (Object.keys(evidence).length) await world.attach(JSON.stringify(evidence, null, 2), 'application/json');
    // A passing setup check does not finish the setup phase: "Mark the E2E setup phase as passed" does.
    const status = passed ? (phase === 'setup' ? 'pending' : 'passed') : 'failed';
    setPhase(id, phase, { status, expected, observed, checkedAt: new Date().toISOString() });
    if (!passed) throw new Error(`[${id} / ${phase}] Expected: ${expected}. Observed: ${observed}`);
    ExtentTestManager.logPass(`[${phase}] ${observed}`);
}

async function loadSummary(world: PlaywrightWorld): Promise<{ records: EngagementRecord[]; summary: Map<string, UserCommunications> }> {
    const c = getCase(caseId(world));
    const records = await getReportPage(world).getEngagementRecords(campaignIdOf(c));
    return { records, summary: summarizeByUser(records) };
}

/** Stores the latest per-user communications and their first-seen times in the state file. */
function saveCommunications(id: string, summary: Map<string, UserCommunications>): void {
    updateCase(id, (c) => {
        for (const [userId, u] of summary) {
            c.communications[userId] = u.communicationIds;
            c.enrollmentTimes[userId] = u.firstSeenAt;
        }
    });
}

const block = async (world: PlaywrightWorld, phase: string, reason: string): Promise<string> => {
    // A case with no record yet has nothing to mark; just report it.
    if (getCase(caseId(world))) setPhase(caseId(world), phase, { status: 'blocked', observed: reason, checkedAt: new Date().toISOString() });
    await world.attach(`BLOCKED ${caseId(world)} / ${phase}: ${reason}`, 'text/plain');
    ExtentTestManager.logInfo(`BLOCKED ${caseId(world)} / ${phase}: ${reason}`);
    return 'skipped';
};

// ─── Case setup ──────────────────────────────────────────────────────────────

Given('Start E2E case {string} titled {string}', async function (this: PlaywrightWorld, id: string, title: string) {
    startCase(id, title, '', [{ name: 'create', status: 'pending' }, { name: 'setup', status: 'pending' }]);
    updateCase(id, (c) => { c.notes.push(`environment: ${new URL(process.env.BASE_URL ?? 'http://unset').host}`); });
    this['e2eCaseId'] = id;
    ExtentTestManager.logPass(`Started E2E case ${id}: ${title} (state: ${STATE_DIR})`);
});

Given('Use users {string} from users.csv for the E2E case', async function (this: PlaywrightWorld, positions: string) {
    const rows = await readUsersCsv();
    const ids = positions.split(',').map((p) => {
        const row = rows[Number(p.trim()) - 1];
        if (!row?.user_id) throw new Error(`data/users.csv has no row ${p.trim()} (rows: ${rows.length})`);
        return row.user_id;
    });
    this['e2eUsers'] = ids;
    updateCase(caseId(this), (c) => { c.users = ids; });
    ExtentTestManager.logPass(`E2E users: ${ids.join(', ')}`);
});

Given('Describe the E2E setup as {string}', async function (this: PlaywrightWorld, setup: string) {
    updateCase(caseId(this), (c) => { c.setup = setup; });
    ExtentTestManager.logPass(`Setup: ${setup}`);
});

// ─── Audience ────────────────────────────────────────────────────────────────

Then('Add E2E users {string} to the User Id condition', async function (this: PlaywrightWorld, positions: string) {
    const audience = getAudiencePage(this);
    const users = positions.split(',').map((p) => userAt(this, Number(p.trim())));
    await audience.selectCustomerPropertiesValueslevel1Btn();
    await audience.enterUserIdValue(users[0]);
    for (const userId of users.slice(1)) {
        await audience.clickAddValuesBtn();
        await audience.enterUserIdValue(userId);
    }
    this['currentAudienceUserIds'] = [...users];
    ExtentTestManager.logPass(`User Id is one of: ${users.join(', ')}`);
});

Then('Verify the audience preview matches the E2E users', async function (this: PlaywrightWorld) {
    const audience = getAudiencePage(this);
    await audience.clickPreviewButton();
    const count = await audience.getPreviewRecordCount();
    const expected = audienceUsers(this).length;
    if (count !== expected) throw new Error(`Audience preview shows ${count} customers, expected ${expected} (${audienceUsers(this).join(', ')})`);
    ExtentTestManager.logPass(`Audience preview shows ${count} customers`);
});

Then('Publish the E2E audience as Static', async function (this: PlaywrightWorld) {
    const audience = getAudiencePage(this);
    await audience.publishStatic();
    const { found, message } = await audience.checkLimitReachedPopup();
    if (found) throw new Error(`Audience was not published: ${message}`);
    const title = this['currentAudienceTitle'];
    updateCase(caseId(this), (c) => { c.audience = { title, userIds: [...audienceUsers(this)] }; });
    ExtentTestManager.logPass(`Published Static audience "${title}"`);
});

/**
 * Waits until the saved customer list of the audience has exactly `users.length` customers, then
 * checks each expected id in it (counts can match with the wrong people). Throws with details otherwise.
 */
async function verifyAudienceCustomerList(world: PlaywrightWorld, title: string, users: string[], timeoutMs: number): Promise<void> {
    const audience = getAudiencePage(world);
    await pollUntil(async () => {
        await getNav(world).navigateTo('Audience');
        await audience.searchByName(title);
        return audience.getTotalCustomerCount(title);
    }, (n) => n === users.length, { description: `audience "${title}" to list ${users.length} customers`, timeoutMs, intervalMs: POLL_INTERVAL_MS });
    await audience.clickReportIcon(title);
    const missing: string[] = [];
    for (const userId of users) {
        if (!await audience.searchAndVerifyUserInReportList(userId)) missing.push(userId);
    }
    if (missing.length) throw new Error(`Audience "${title}" lists ${users.length} customers but these ids are missing from its customer list: ${missing.join(', ')}`);
}

Then('Wait until the E2E audience customer list contains the E2E users', LONG_STEP, async function (this: PlaywrightWorld) {
    const title = this['currentAudienceTitle'];
    await verifyAudienceCustomerList(this, title, audienceUsers(this), EXECUTION_TIMEOUT_MS);
    ExtentTestManager.logPass(`Audience "${title}" customer list has ${audienceUsers(this).length} customers: ${audienceUsers(this).join(', ')}`);
});

/**
 * Reuses one Static audience per exact user set across cases and runs (recorded in the state file).
 * The audience is re-verified by user id every time; if it no longer matches, a fresh one is created.
 * Not for the audience-update case (C2), which must own the audience it edits.
 */
Then('Use the shared Static audience for users {string}', LONG_STEP, async function (this: PlaywrightWorld, positions: string) {
    const users = positions.split(',').map((p) => userAt(this, Number(p.trim())));
    this['currentAudienceUserIds'] = [...users];
    // Parallel workers (C6 and C7 both use users 1-4): the lock makes one worker create the audience
    // while the other waits, then finds it already recorded and reuses it.
    await withSharedAudienceLock(users, async () => {
    const existing = getSharedAudience(users);
    if (existing) {
        try {
            // Already built: a short check is enough, no need to wait for processing.
            await verifyAudienceCustomerList(this, existing.title, users, 2 * 60 * 1000);
            this['currentAudienceTitle'] = existing.title;
            saveSharedAudience({ ...existing, lastVerifiedAt: new Date().toISOString() });
            updateCase(caseId(this), (c) => { c.audience = { title: existing.title, userIds: [...users] }; });
            ExtentTestManager.logPass(`Reusing shared audience "${existing.title}" (verified ids: ${users.join(', ')})`);
            return;
        } catch (err) {
            ExtentTestManager.logInfo(`Shared audience "${existing.title}" no longer matches ${users.join(', ')} (${String(err).slice(0, 200)}); creating a new one`);
            dropSharedAudience(users);
        }
    }

    const title = `Audience-${uniqueId()}`;
    const audience = getAudiencePage(this);
    await getNav(this).navigateTo('Audience');
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
    await verifyAudienceCustomerList(this, title, users, EXECUTION_TIMEOUT_MS);
    saveSharedAudience({ title, userIds: [...users], createdAt: new Date().toISOString(), lastVerifiedAt: new Date().toISOString() });
    this['currentAudienceTitle'] = title;
    updateCase(caseId(this), (c) => { c.audience = { title, userIds: [...users] }; });
    ExtentTestManager.logPass(`Created shared Static audience "${title}" for ${users.join(', ')}`);
    });
});

// ─── Campaign configuration ──────────────────────────────────────────────────

Then('Select the E2E audience in the campaign', async function (this: PlaywrightWorld) {
    const title = this['currentAudienceTitle'];
    if (!title) throw new Error('No E2E audience title on the World; create the audience first.');
    const campaign = getCampaignPage(this);
    await campaign.clickExistingAudienceTab();
    await campaign.clickSelectExistingAudience();
    await campaign.selectAudienceByName(title);
    await campaign.confirmAudienceSelection();
    this['selectedAudienceName'] = title;
    ExtentTestManager.logPass(`Selected audience "${title}"`);
});

Then('Verify the campaign audience preview count equals the E2E user count', async function (this: PlaywrightWorld) {
    const campaign = getCampaignPage(this);
    await campaign.clickCampaignAudiencePreview();
    const count = await campaign.getCampaignAudiencePreviewCount();
    const expected = audienceUsers(this).length;
    if (count !== expected) throw new Error(`Campaign audience preview shows ${count} active customers, expected ${expected}`);
    ExtentTestManager.logPass(`Campaign audience resolves to ${count} active customers before publishing`);
});

/** Needed before a control group can be entered: see CampaignPage.reloadCampaignDraft. */
Then('Reload the new campaign draft', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).reloadCampaignDraft();
    ExtentTestManager.logPass('Reloaded the new campaign draft');
});

Then('Enter {int} as the Control Group percentage', async function (this: PlaywrightWorld, percent: number) {
    await getCampaignPage(this).enterControlGroupPercentageChecked(String(percent));
    ExtentTestManager.logPass(`Control group: ${percent}%`);
});

Then('Select Repeat every Hour on the time-based trigger', async function (this: PlaywrightWorld) {
    const campaign = getCampaignPage(this);
    await campaign.selectRepeatHourly();
    const { unit, endDate } = await campaign.getRepeatSummary();
    ExtentTestManager.logPass(`Repeat every ${unit} until ${endDate}`);
});

/** Parses the trigger date button text "29/10/2026 03:55 PM" in the trigger's timezone offset ("UTC+05:30"). */
const parseTriggerDate = (text: string, offset: string): Date | null => {
    const m = text.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    const o = offset.match(/UTC([+-])(\d{2}):(\d{2})/);
    if (!m) return null;
    let hours = Number(m[4]) % 12;
    if (/pm/i.test(m[6])) hours += 12;
    const offsetMin = o ? (o[1] === '-' ? -1 : 1) * (Number(o[2]) * 60 + Number(o[3])) : 0;
    return new Date(Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1]), hours, Number(m[5])) - offsetMin * 60000);
};

Then('Set the event trigger start time to the next available slot', async function (this: PlaywrightWorld) {
    // The yellow "Trigger dates or Event rules are not set properly" banner stays until an event is chosen,
    // so it is not a date check: read the start time and only use the picker when it is not in the future.
    const campaign = getCampaignPage(this);
    const picker = getDatePicker(this);
    const offset = await campaign.getEventTriggerTimeZoneText();
    let { start, end } = await campaign.getEventTriggerDates();
    let startAt = parseTriggerDate(start, offset);
    for (let attempt = 0; attempt < 3 && !(startAt && startAt.getTime() > Date.now() + 60000); attempt++) {
        await campaign.clickEventTriggerStartDate();
        const now = new Date();
        await picker.selectDate(now.getFullYear(), now.getMonth(), now.getDate());
        await picker.selectNextAvailableTime();
        await picker.clickApply();
        ({ start, end } = await campaign.getEventTriggerDates());
        startAt = parseTriggerDate(start, offset);
    }
    if (!startAt || startAt.getTime() <= Date.now()) throw new Error(`Event trigger start "${start}" (${offset}) is not in the future`);
    const endAt = parseTriggerDate(end, offset);
    if (!endAt || endAt.getTime() <= startAt.getTime()) throw new Error(`Event trigger end "${end}" is not after start "${start}"`);
    ExtentTestManager.logPass(`Event trigger active from ${start} to ${end} (${offset}); start ${startAt.toISOString()}`);
});

/** Searches the "Select content" library for a named communication; the next step picks it. */
Then('Search the communication {string} in the search bar', async function (this: PlaywrightWorld, name: string) {
    await getWorkflowPage(this).searchCommunication(name);
    this['lastSearchedCommunication'] = name;
    ExtentTestManager.logPass(`Searched communication name in library: ${name}`);
});

Then('Select the Deposit event on the event trigger', async function (this: PlaywrightWorld) {
    const chosen = await getCampaignPage(this).selectDepositEvent();
    ExtentTestManager.logPass(`Trigger event: ${chosen}`);
});

Then('Enable re-enrollment every {int} day(s) for max. {int} times', async function (this: PlaywrightWorld, days: number, maxTimes: number) {
    await getCampaignPage(this).enableReenrollment(days, maxTimes);
    ExtentTestManager.logPass(`Re-enroll customers every ${days} day(s) for max. ${maxTimes} times`);
});

Then('Verify re-enrollment is disabled', async function (this: PlaywrightWorld) {
    if (await getCampaignPage(this).isReenrollmentEnabled()) throw new Error('Re-enrollment is enabled but the case requires it disabled');
    ExtentTestManager.logPass('Re-enrollment is disabled');
});

Then('Publish the E2E campaign', async function (this: PlaywrightWorld) {
    const campaign = getCampaignPage(this);
    await campaign.clickPublish();
    await campaign.confirmPublish();
    const { found, message } = await campaign.checkLimitReachedPopup();
    if (found) throw new Error(`Campaign was not published: ${message}`);
    updateCase(caseId(this), (c) => {
        c.campaign = { ...(c.campaign ?? { name: this['currentCampaignName'] }), name: this['currentCampaignName'], publishedAt: new Date().toISOString() };
    });
    ExtentTestManager.logPass(`Published campaign "${this['currentCampaignName']}"`);
});

Then('Record the published E2E campaign', LONG_STEP, async function (this: PlaywrightWorld) {
    const name = this['currentCampaignName'];
    const report = getReportPage(this);
    const id = await pollUntil(() => report.findCampaignIdByName(name), (v) => !!v,
        { description: `campaign "${name}" to appear in the campaign list`, timeoutMs: 3 * 60 * 1000, intervalMs: 10000 });
    const details = await report.getCampaignDetails(id);
    const url = report.reportUrl(id, details.versionId);
    updateCase(caseId(this), (c) => {
        c.campaign = { ...(c.campaign ?? { name }), name, id, versionId: details.versionId, url, startAt: details.startDateTime };
    });
    await report.open(id, details.versionId);
    await this.attach(`Campaign ${name}\nid: ${id}\nversion: ${details.versionId}\nstatus: ${details.status}\nstart: ${details.startDateTime}\nend: ${details.endDateTime}\n${url}`, 'text/plain');
    ExtentTestManager.logPass(`Campaign ${name} -> ${url} (status ${details.status})`);
});

/**
 * UI status label -> values the campaign API returns. Observed on Dev (2026-10-29): "draft",
 * "scheduled", "inprogress" (shown under the Active tab) and "completed".
 */
const API_STATUSES: Record<string, string[]> = {
    active: ['inprogress', 'active'],
    completed: ['completed'],
    scheduled: ['scheduled'],
    draft: ['draft'],
};

Then('Wait for the E2E campaign status to be {string}', LONG_STEP, async function (this: PlaywrightWorld, status: string) {
    const c = getCase(caseId(this));
    const accepted = API_STATUSES[status.toLowerCase()] ?? [status.toLowerCase()];
    const details = await pollUntil(() => getReportPage(this).getCampaignDetails(campaignIdOf(c)),
        (d) => accepted.includes(d.status.toLowerCase()),
        { description: `campaign ${c.campaign?.name} status "${status}" (API: ${accepted.join(' or ')})`, timeoutMs: EXECUTION_TIMEOUT_MS, intervalMs: POLL_INTERVAL_MS });
    ExtentTestManager.logPass(`Campaign status is ${status} (API "${details.status}")`);
});

// ─── Execution / communication checks ────────────────────────────────────────

/**
 * Event-triggered campaigns: after a deposit is processed, the Logs tab must show the processing.
 * The exact wording for event campaigns is not specified, so this requires entries to exist and
 * attaches them all as evidence (and checks any "Sent ... to N users" totals against Engagement).
 */
Then('Verify the campaign logs show the deposit processing', LONG_STEP, async function (this: PlaywrightWorld) {
    const c = getCase(caseId(this));
    const report = getReportPage(this);
    const logs = await pollUntil(async () => {
        await report.open(campaignIdOf(c), c.campaign?.versionId);
        return report.readLogMessages();
    }, (lines) => lines.length > 0, { description: `log entries for ${c.campaign?.name}`, timeoutMs: EXECUTION_TIMEOUT_MS, intervalMs: POLL_INTERVAL_MS });
    const summary = summarizeByUser(await report.getEngagementRecords(campaignIdOf(c)));
    const sends = [...summary.values()].reduce((n, u) => n + u.communicationIds.length, 0);
    const sentInLogs = CampaignReportPage.sentCountFromLogs(logs);
    const hasSentLines = logs.some((l) => /Sent \w+ to \d+ users?/i.test(l));
    await reportOutcome(this, 'setup',
        'Logs tab has entries for the processed deposit' + (hasSentLines ? ` and its "Sent ... to N users" total equals the ${sends} distinct sends` : ''),
        `${logs.length} log entries; sent in logs ${hasSentLines ? sentInLogs : 'n/a'}; distinct sends ${sends}`,
        logs.length > 0 && (!hasSentLines || sentInLogs === sends), { logs: logs.slice(0, 50) });
});

Then('Wait for the campaign logs to show the launch', LONG_STEP, async function (this: PlaywrightWorld) {
    const c = getCase(caseId(this));
    const report = getReportPage(this);
    const logs = await pollUntil(async () => {
        await report.open(campaignIdOf(c), c.campaign?.versionId);
        return report.readLogMessages();
    }, (lines) => lines.some((l) => /Campaign launch initiated/i.test(l)),
    { description: `"Campaign launch initiated" in the Logs tab of ${c.campaign?.name}`, timeoutMs: EXECUTION_TIMEOUT_MS, intervalMs: POLL_INTERVAL_MS });
    await this.attach(`Logs at launch:\n${logs.join('\n')}`, 'text/plain');
    ExtentTestManager.logPass(`Logs tab shows the launch (${logs.length} entries)`);
});


Then('Wait for the E2E campaign to process {int} users', LONG_STEP, async function (this: PlaywrightWorld, expectedUsers: number) {
    const c = getCase(caseId(this));
    const report = getReportPage(this);
    const summary = await pollUntil(async () => summarizeByUser(await report.getEngagementRecords(campaignIdOf(c))),
        (s) => [...s.values()].filter((u) => u.communicationIds.length > 0).length >= expectedUsers,
        { description: `${expectedUsers} users with a communication on campaign ${c.campaign?.name}`, timeoutMs: EXECUTION_TIMEOUT_MS, intervalMs: POLL_INTERVAL_MS });
    saveCommunications(caseId(this), summary);
    ExtentTestManager.logPass(`Processed: ${describeSummary(summary)}`);
});

Then('Verify every E2E user has exactly {int} communication(s)', async function (this: PlaywrightWorld, expected: number) {
    const { records, summary } = await loadSummary(this);
    saveCommunications(caseId(this), summary);
    const users = audienceUsers(this);
    const wrong = users.filter((u) => countFor(summary, u) !== expected);
    const failed = users.filter((u) => (summary.get(u)?.failedCommunicationIds.length ?? 0) > 0);
    await reportOutcome(this, 'setup',
        `each of ${users.join(', ')} has exactly ${expected} distinct communication (status rows of one send counted once), no failed sends`,
        `${describeSummary(summary, users)}; rows read: ${records.length}`,
        wrong.length === 0 && failed.length === 0,
        { campaign: getCase(caseId(this))?.campaign, perUser: Object.fromEntries([...summary].map(([k, v]) => [k, v.communicationIds])) });
});

Then('Verify the campaign executed exactly once', LONG_STEP, async function (this: PlaywrightWorld) {
    const c = getCase(caseId(this));
    const report = getReportPage(this);
    const records = await report.getEngagementRecords(campaignIdOf(c));
    const runIds = [...new Set(records.map((r) => r.runId).filter(Boolean))];
    await report.open(campaignIdOf(c), c.campaign?.versionId);
    const launches = (await report.readLogMessages()).filter((m) => /Campaign launched successfully/i.test(m));
    await reportOutcome(this, 'setup', 'one execution: a single run_id in the communication logs and one "Campaign launched successfully" log entry',
        `run ids: ${runIds.length} [${runIds.map((r) => r.slice(0, 8)).join(', ')}]; launch log entries: ${launches.length}`,
        runIds.length === 1 && launches.length === 1, { launches });
});

Then('Verify no user outside the E2E audience was processed', async function (this: PlaywrightWorld) {
    const { summary } = await loadSummary(this);
    const allowed: string[] = audienceUsers(this);
    const extra = [...summary.keys()].filter((u) => !allowed.includes(u));
    await reportOutcome(this, 'setup', `only ${allowed.join(', ')} appear in the communication logs`,
        extra.length ? `unexpected users: ${extra.join(', ')}` : `users in logs: ${[...summary.keys()].join(', ')}`, extra.length === 0);
});

Then('Verify the engagement table and logs agree with the communication logs', LONG_STEP, async function (this: PlaywrightWorld) {
    const c = getCase(caseId(this));
    const id = campaignIdOf(c);
    const report = getReportPage(this);
    const records = await report.getEngagementRecords(id);
    const summary = summarizeByUser(records);
    const sendRows = records.filter((r) => !NON_SEND_STATUSES.includes(r.status) && r.status !== FAILED_STATUS);
    const totalSends = [...summary.values()].reduce((n, u) => n + u.communicationIds.length, 0);

    await report.open(id, c.campaign?.versionId);
    const tableRows = await report.readEngagementTable();
    const logs = await report.readLogMessages();
    const sentInLogs = CampaignReportPage.sentCountFromLogs(logs);

    const tableUsers = [...new Set(tableRows.map((r) => r.userId))].sort();
    const apiUsers = [...summary.keys()].sort();
    const problems: string[] = [];
    if (tableRows.length !== sendRows.length) problems.push(`engagement table rows ${tableRows.length} != API rows ${sendRows.length}`);
    if (tableUsers.join(',') !== apiUsers.join(',')) problems.push(`table users [${tableUsers}] != API users [${apiUsers}]`);
    if (sentInLogs !== totalSends) problems.push(`logs report ${sentInLogs} sent != ${totalSends} distinct communications`);
    const mockRows = tableRows.filter((r) => /mock/i.test(r.comment)).length;
    await reportOutcome(this, 'setup',
        'Engagement table (all pages), Logs tab and API agree on users and send count',
        `table rows ${tableRows.length}, API rows ${sendRows.length}, distinct sends ${totalSends}, logs sent ${sentInLogs}; ` +
        `${mockRows} rows from the mock provider (provider acceptance, not mailbox delivery)` +
        (problems.length ? `; MISMATCH: ${problems.join('; ')}` : ''),
        problems.length === 0,
        { logs: logs.slice(0, 50) });
});

Then('Verify the control group split is {int} control and {int} processed', async function (this: PlaywrightWorld, controlCount: number, processedCount: number) {
    const c = getCase(caseId(this));
    const report = getReportPage(this);
    const id = campaignIdOf(c);
    const users: string[] = e2eUsers(this);
    const summary = summarizeByUser(await report.getEngagementRecords(id));
    const controlUsers = [...new Set((await report.getEngagementRecords(id, true)).map((r) => r.userId).filter(Boolean))];
    const processed = users.filter((u) => countFor(summary, u) > 0);
    const overlap = controlUsers.filter((u) => processed.includes(u));
    const union = new Set([...controlUsers, ...processed]);
    const controlWithSends = controlUsers.filter((u) => countFor(summary, u) > 0);
    const processedTwice = processed.filter((u) => countFor(summary, u) !== 1);
    const ok = controlUsers.length === controlCount && processed.length === processedCount && overlap.length === 0 &&
        union.size === users.length && [...union].every((u) => users.includes(u)) && controlWithSends.length === 0 && processedTwice.length === 0;
    await reportOutcome(this, 'setup',
        `${controlCount} control users with no communication, ${processedCount} users processed once, disjoint, together = ${users.join(', ')}`,
        `control [${controlUsers.join(', ')}], processed [${processed.join(', ')}], overlap [${overlap.join(', ')}], ` +
        describeSummary(summary, users),
        ok, { controlUsers, processed });
});

Then('Verify the variant split is {int} users in A with {string} and {int} users in B with {string}', LONG_STEP, async function (
    this: PlaywrightWorld, inA: number, contentA: string, inB: number, contentB: string,
) {
    const c = getCase(caseId(this));
    const report = getReportPage(this);
    const id = campaignIdOf(c);
    const users: string[] = e2eUsers(this);
    const records = await report.getEngagementRecords(id);
    const summary = summarizeByUser(records);
    const groupA = users.filter((u) => summary.get(u)?.groups.join() === 'A');
    const groupB = users.filter((u) => summary.get(u)?.groups.join() === 'B');
    const multiGroup = users.filter((u) => (summary.get(u)?.groups.length ?? 0) > 1);
    const notOnce = users.filter((u) => countFor(summary, u) !== 1);
    // Content per variant: each group's sends must all use one channel, and the two groups' channels
    // must match their variant's content (e.g. A = email, B = sms), so no user got the other variant's content.
    const channelsOf = (group: string[]): string[] =>
        [...new Set(records.filter((r) => group.includes(r.userId) && !NON_SEND_STATUSES.includes(r.status)).map((r) => r.channel))];
    const channelsA = channelsOf(groupA);
    const channelsB = channelsOf(groupB);
    await report.open(id, c.campaign?.versionId);
    const variants = await report.readVariantContent();
    const contentOk = variants.A?.content === contentA && variants.B?.content === contentB;
    const channelOk = channelsA.length === 1 && channelsB.length === 1 && channelsA[0] !== channelsB[0];
    const ok = groupA.length === inA && groupB.length === inB && multiGroup.length === 0 && notOnce.length === 0 && contentOk && channelOk;
    await reportOutcome(this, 'setup',
        `${inA} users in A ("${contentA}") and ${inB} in B ("${contentB}"), each user in one variant only, processed once, ` +
        'each group sent only through its own variant\'s channel',
        `A [${groupA.join(', ')}] content "${variants.A?.content ?? '-'}" (${variants.A?.percent ?? '-'}%) channel ${channelsA.join('/') || '-'}, ` +
        `B [${groupB.join(', ')}] content "${variants.B?.content ?? '-'}" (${variants.B?.percent ?? '-'}%) channel ${channelsB.join('/') || '-'}, ` +
        `in both [${multiGroup.join(', ')}], not exactly once [${notOnce.join(', ')}]`,
        ok, { variants, channelsA, channelsB, perUser: describeSummary(summary, users) });
});

// ─── Deposit events ──────────────────────────────────────────────────────────

async function uploadDeposit(world: PlaywrightWorld, userId: string): Promise<void> {
    const event = createSuccessfulDepositCsv(userId, 100);
    const dataPlatform = getDataPlatformPage(world);
    await dataPlatform.openCustomerEvents();
    const upload = await dataPlatform.importCustomerEventsCsv(event.csvPath);
    // Upload acceptance is transport evidence only: confirm the persisted Customer Events record.
    const row = await pollUntil(async () =>
        (await dataPlatform.findEventRow(event.eventId)) || (await dataPlatform.findEventRow(event.transactionId)),
    (text) => !!text, { description: `event ${event.eventId} to be persisted in Customer Events`, timeoutMs: 10 * 60 * 1000, intervalMs: POLL_INTERVAL_MS })
        .catch(async (err) => {
            throw new Error(`Deposit event was not persisted: ${String(err)}; upload response ${upload.status}; first row: ${await dataPlatform.getFirstRowText()}`);
        });
    // The Customer Events list shows time, event name, category, user id and event id (no amount column),
    // e.g. "29/10/2026 07:50:35 PM Successful Deposit Deposit user_004 2c00260f-...". Check those.
    const missing = [userId, event.eventId].filter((v) => !row.includes(v));
    if (!/Successful Deposit/i.test(row)) missing.push('Successful Deposit');
    if (missing.length) throw new Error(`Persisted Customer Events row does not match the uploaded deposit (missing ${missing.join(', ')}): ${row}`);
    updateCase(caseId(world), (c) => {
        c.events.push({ ...event, uploadedAt: new Date().toISOString(), accepted: true });
    });
    world['lastEvent'] = event;
    await world.attach(`Successful Deposit event for ${userId}\nevent_id: ${event.eventId}\ntransaction_id: ${event.transactionId}\nevent_time (UTC): ${event.eventTime}\n` +
        `upload status: ${upload.status}\npersisted row: ${row}`, 'text/plain');
}

Then('Upload a Successful Deposit event for E2E user {int} and verify it was accepted', LONG_STEP, async function (this: PlaywrightWorld, position: number) {
    const userId = userAt(this, position);
    await uploadDeposit(this, userId);
    ExtentTestManager.logPass(`Deposit event ${this['lastEvent'].eventId} for ${userId} accepted`);
});

Then('Wait for E2E user {int} to have {int} communication(s)', LONG_STEP, async function (this: PlaywrightWorld, position: number, expected: number) {
    const userId = userAt(this, position);
    const c = getCase(caseId(this));
    const report = getReportPage(this);
    const summary = await pollUntil(async () => summarizeByUser(await report.getEngagementRecords(campaignIdOf(c))),
        (s) => countFor(s, userId) >= expected,
        { description: `${userId} to reach ${expected} communication(s)`, timeoutMs: EXECUTION_TIMEOUT_MS, intervalMs: POLL_INTERVAL_MS });
    saveCommunications(caseId(this), summary);
    await reportOutcome(this, 'setup', `${userId} has exactly ${expected} communication(s)`, describeSummary(summary, [userId]), countFor(summary, userId) === expected);
});

/** Watches the normal processing window and fails as soon as an extra communication appears. */
async function watchNoNewCommunication(world: PlaywrightWorld, userId: string, expected: number, phase: string): Promise<void> {
    const c = getCase(caseId(world));
    const report = getReportPage(world);
    let last: Map<string, UserCommunications> = new Map();
    await pollUntil(async () => {
        last = summarizeByUser(await report.getEngagementRecords(campaignIdOf(c)));
        return countFor(last, userId);
    }, (n) => n > expected, { description: 'an extra communication', timeoutMs: PROCESSING_WINDOW_MS, intervalMs: POLL_INTERVAL_MS })
        .then(() => true)
        .catch((err) => { if (err?.name !== 'PollTimeoutError') throw err; return false; });
    saveCommunications(caseId(world), last);
    await reportOutcome(world, phase,
        `${userId} still has exactly ${expected} communication(s) after the event was accepted and a ${Math.round(PROCESSING_WINDOW_MS / 60000)} min processing window`,
        describeSummary(last, [userId]), countFor(last, userId) === expected);
}

Then('Watch the processing window and verify E2E user {int} still has {int} communication(s)', LONG_STEP, async function (this: PlaywrightWorld, position: number, expected: number) {
    await watchNoNewCommunication(this, userAt(this, position), expected, 'setup');
});

// ─── Create first, verify later ──────────────────────────────────────────────
// Create scenarios only build and publish campaigns (no waiting). Verify scenarios run afterwards,
// load the recorded campaign and wait for its launch, so all campaigns are scheduled in one pass.

const LAUNCH_WAIT_MS = envMinutes('E2E_LAUNCH_WAIT_MIN', 20);

Then('Mark the E2E campaign as created', async function (this: PlaywrightWorld) {
    const id = caseId(this);
    const c = getCase(id);
    if (!c?.campaign?.id) throw new Error(`${id}: campaign was not recorded, cannot mark it as created`);
    setPhase(id, 'create', { status: 'passed', checkedAt: new Date().toISOString(), observed: `published ${c.campaign.name}, starts ${c.campaign.startAt}` });
    ExtentTestManager.logPass(`${id}: campaign ${c.campaign.name} created; starts ${c.campaign.startAt}. Verification runs in its Verify scenario.`);
});

/** Max wait in a full run for this case's Create scenario (possibly on another parallel worker) to finish. */
const CREATE_WAIT_MS = envMinutes('E2E_CREATE_WAIT_MIN', 40);

// A failed Create scenario never reaches "Mark the E2E campaign as created"; record the failure so a
// Verify waiting on another parallel worker stops waiting and reports Blocked straight away.
After({ tags: '@E2E-Create' }, async function (this: PlaywrightWorld, scenario: any) {
    const id = this['e2eCaseId'];
    if (!id || scenario?.result?.status !== Status.FAILED) return;
    if (getCase(id)?.phases.find((p) => p.name === 'create')?.status === 'pending') {
        setPhase(id, 'create', { status: 'failed', checkedAt: new Date().toISOString(), observed: 'Create scenario failed' });
    }
});

Given('Load the created E2E case {string}', { timeout: CREATE_WAIT_MS + 5 * 60 * 1000 }, async function (this: PlaywrightWorld, id: string) {
    this['e2eCaseId'] = id;
    if (process.env.E2E_RUN_MODE === 'full') {
        // Full run (create + verify together): with parallel workers this Verify can start while its
        // Create is still running elsewhere, and an older run's record may still be on disk. Wait for
        // this run's record and its create phase to finish.
        await pollUntil(async () => getCase(id), (rec) => !!rec && rec.runId === RUN_ID &&
            rec.phases.find((p) => p.name === 'create')?.status !== 'pending',
        { description: `${id} Create scenario of this run to finish`, timeoutMs: CREATE_WAIT_MS, intervalMs: 10000 })
            .catch(() => undefined);
    }
    const c = getCase(id);
    if (!c) return block(this, 'setup', `no state recorded for ${id} in ${STATE_DIR}; run its Create scenario first`);
    if (process.env.E2E_RUN_MODE === 'full' && c.runId !== RUN_ID) {
        return block(this, 'setup', `${id} Create scenario of this run did not start within ${Math.round(CREATE_WAIT_MS / 60000)} min`);
    }
    const create = c.phases.find((p) => p.name === 'create');
    if (create?.status !== 'passed' || !c.campaign?.id) {
        return block(this, 'setup', `${id} has no created campaign (create phase: ${create?.status ?? 'not run'}); run its Create scenario first`);
    }
    const setup = c.phases.find((p) => p.name === 'setup');
    if (setup?.status === 'passed') {
        ExtentTestManager.logInfo(`${id} was already verified (${c.campaign.name}); run its Create scenario to test it again`);
        return 'skipped';
    }
    this['e2eUsers'] = c.users;
    this['currentAudienceUserIds'] = c.audience?.userIds ?? c.users;
    this['currentAudienceTitle'] = c.audience?.title;
    this['currentCampaignName'] = c.campaign.name;
    await this.attach(`Verifying ${id}: ${c.campaign.name}\n${c.campaign.url ?? ''}\nstarts ${c.campaign.startAt}`, 'text/plain');
    ExtentTestManager.logPass(`Loaded ${id}: campaign ${c.campaign.name} (starts ${c.campaign.startAt})`);
});

Then('Wait for the E2E campaign launch time', { timeout: LAUNCH_WAIT_MS + 5 * 60 * 1000 }, async function (this: PlaywrightWorld) {
    const c = getCase(caseId(this));
    const startAt = c.campaign?.startAt ? new Date(c.campaign.startAt).getTime() : NaN;
    if (!Number.isFinite(startAt)) throw new Error(`${c.caseId}: launch time not recorded`);
    const waitMs = startAt - Date.now();
    if (waitMs > LAUNCH_WAIT_MS) {
        ExtentTestManager.logInfo(`PENDING ${c.caseId}: launch at ${c.campaign?.startAt} is more than ${Math.round(LAUNCH_WAIT_MS / 60000)} min away. ` +
            'Run npm run test:campaign-e2e:verify after that time.');
        return 'pending';
    }
    if (waitMs > 0) {
        await pollUntil(async () => Date.now(), (now) => now >= startAt,
            { description: `launch time ${c.campaign?.startAt}`, timeoutMs: waitMs + 60000, intervalMs: Math.min(30000, waitMs) });
    }
    ExtentTestManager.logPass(`Launch time ${c.campaign?.startAt} reached`);
});

Then('Mark the E2E setup phase as passed', async function (this: PlaywrightWorld) {
    const id = caseId(this);
    setPhase(id, 'setup', { status: 'passed', checkedAt: new Date().toISOString() });
    const c = getCase(id);
    await this.attach(`${id} PASSED: initial send verified for ${c.campaign?.name} ${c.campaign?.url ?? ''}`, 'text/plain');
    ExtentTestManager.logPass(`${id} passed: initial send verified for ${c.campaign?.name}`);
});
