import fs from 'fs';
import path from 'path';

/**
 * State for the campaign execution scenarios (@CampaignE2E).
 *
 * Create scenarios record each campaign (id, users, launch time); Verify scenarios read it back after
 * the launch. Shared audiences are kept too, so this is not reset like data/names.json.
 *
 * Safe for parallel workers: every case has its own file and every shared audience has its own file
 * plus a creation lock, so two workers never write the same file.
 *   data/e2e-state/cases/<caseId>.json            one record per case
 *   data/e2e-state/archive/<caseId>-<time>.json   previous records of a case
 *   data/e2e-state/shared-audiences/<key>.json    reusable Static audiences (key = exact user ids)
 *   data/e2e-state/run.lock                       stops a second, separate run
 * Location: data/e2e-state (override with E2E_STATE_DIR).
 */

export type PhaseStatus = 'pending' | 'passed' | 'failed' | 'blocked';

export interface PhaseRecord {
    name: string;
    status: PhaseStatus;
    expected?: string;
    observed?: string;
    checkedAt?: string;
}

export interface EventRecord {
    eventId: string;
    transactionId: string;
    userId: string;
    eventTime: string;
    amount: number;
    csvPath: string;
    uploadedAt: string;
    accepted: boolean;
}

export interface CaseState {
    caseId: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    /** Run that created this record (see RUN_ID); Verify in a full run waits for its own run's Create. */
    runId?: string;
    setup: string;
    audience?: { title: string; userIds: string[] };
    campaign?: { name: string; id?: string; versionId?: string; url?: string; publishedAt?: string; startAt?: string };
    users: string[];
    events: EventRecord[];
    /** Distinct communication ids per user, from the latest check. */
    communications: Record<string, string[]>;
    /** Earliest communication timestamp per user per enrollment, in order. */
    enrollmentTimes: Record<string, string[]>;
    phases: PhaseRecord[];
    notes: string[];
}

export interface SharedAudience {
    title: string;
    userIds: string[];
    createdAt: string;
    lastVerifiedAt?: string;
}

export const STATE_DIR = process.env.E2E_STATE_DIR
    ? path.resolve(process.env.E2E_STATE_DIR)
    : path.join(process.cwd(), 'data', 'e2e-state');

const CASES_DIR = path.join(STATE_DIR, 'cases');
const ARCHIVE_DIR = path.join(STATE_DIR, 'archive');
const AUDIENCES_DIR = path.join(STATE_DIR, 'shared-audiences');
const RUN_LOCK = path.join(STATE_DIR, 'run.lock');
/** Single-file layout used before parallel support; migrated on first use. */
const LEGACY_FILE = path.join(STATE_DIR, 'campaign-e2e.json');

const safeName = (s: string): string => s.replace(/[^A-Za-z0-9_.-]+/g, '_');
const caseFile = (caseId: string): string => path.join(CASES_DIR, `${safeName(caseId)}.json`);

/**
 * Identifies one run. Parallel Cucumber workers are child processes of one coordinator, so they share
 * its process id (process.ppid); a serial run is a single process.
 */
export const RUN_ID = String(process.env.CUCUMBER_WORKER_ID !== undefined ? process.ppid : process.pid);

const isAlive = (pid: number): boolean => {
    try { process.kill(pid, 0); return true; } catch (err: any) { return err?.code === 'EPERM'; }
};

/** Write via a temp file + rename so a reader never sees a half-written file. */
function writeJson(file: string, data: unknown): void {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmp, file);
}

function readJson<T>(file: string): T | undefined {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')) as T; } catch { return undefined; }
}

let migrated = false;
/** Splits the old single campaign-e2e.json into per-case and per-audience files, once. */
function migrateLegacy(): void {
    if (migrated) return;
    migrated = true;
    const legacy = readJson<{ cases?: Record<string, CaseState>; archive?: CaseState[]; sharedAudiences?: Record<string, SharedAudience> }>(LEGACY_FILE);
    if (!legacy) return;
    for (const c of Object.values(legacy.cases ?? {})) if (!fs.existsSync(caseFile(c.caseId))) writeJson(caseFile(c.caseId), c);
    for (const c of legacy.archive ?? []) writeJson(path.join(ARCHIVE_DIR, `${safeName(c.caseId)}-${safeName(c.createdAt)}.json`), c);
    for (const a of Object.values(legacy.sharedAudiences ?? {})) {
        const f = audienceFile(a.userIds);
        if (!fs.existsSync(f)) writeJson(f, a);
    }
    try { fs.renameSync(LEGACY_FILE, `${LEGACY_FILE}.migrated`); } catch { /* another worker moved it */ }
}

// ─── Run lock ────────────────────────────────────────────────────────────────
// A second, separate run would recreate campaigns other workers are verifying. The first write of a
// run records RUN_ID; a different run that is still alive stops this one with a clear message.
// Workers of the same run share RUN_ID, so parallel workers do not block each other.

let runLockChecked = false;

function checkRunLock(): void {
    if (runLockChecked) return;
    fs.mkdirSync(STATE_DIR, { recursive: true });
    const owner = Number((readJson<{ runId: string }>(RUN_LOCK))?.runId ?? 0);
    if (owner && String(owner) !== RUN_ID && isAlive(owner)) {
        throw new Error(`Another campaign E2E run (process ${owner}) is using ${STATE_DIR}. ` +
            'Wait for it to finish, or stop it, before starting a new run.');
    }
    if (String(owner) !== RUN_ID) writeJson(RUN_LOCK, { runId: RUN_ID, startedAt: new Date().toISOString() });
    runLockChecked = true;
    if (RUN_ID === String(process.pid)) {
        // Serial run: release on exit. A parallel run's lock goes stale when its coordinator exits.
        process.once('exit', () => {
            try { if (readJson<{ runId: string }>(RUN_LOCK)?.runId === RUN_ID) fs.unlinkSync(RUN_LOCK); } catch { /* gone */ }
        });
    }
}

// ─── Cases ───────────────────────────────────────────────────────────────────

export function getCase(caseId: string): CaseState | undefined {
    migrateLegacy();
    return readJson<CaseState>(caseFile(caseId));
}

export function listCases(): CaseState[] {
    migrateLegacy();
    if (!fs.existsSync(CASES_DIR)) return [];
    return fs.readdirSync(CASES_DIR).filter((f) => f.endsWith('.json'))
        .map((f) => readJson<CaseState>(path.join(CASES_DIR, f))).filter(Boolean) as CaseState[];
}

/** Start a fresh record for a case; a previous record for the same case is archived. */
export function startCase(caseId: string, title: string, setup: string, phases: PhaseRecord[]): CaseState {
    checkRunLock();
    const previous = getCase(caseId);
    if (previous) writeJson(path.join(ARCHIVE_DIR, `${safeName(caseId)}-${safeName(previous.createdAt)}.json`), previous);
    const now = new Date().toISOString();
    const record: CaseState = {
        caseId, title, setup, createdAt: now, updatedAt: now, runId: RUN_ID,
        users: [], events: [], communications: {}, enrollmentTimes: {}, phases, notes: [],
    };
    writeJson(caseFile(caseId), record);
    return record;
}

export function updateCase(caseId: string, mutate: (c: CaseState) => void): CaseState {
    checkRunLock();
    const record = getCase(caseId);
    if (!record) throw new Error(`No E2E state for ${caseId}. Run its Create scenario first (npm run test:campaign-e2e).`);
    mutate(record);
    record.updatedAt = new Date().toISOString();
    writeJson(caseFile(caseId), record);
    return record;
}

export function setPhase(caseId: string, name: string, patch: Partial<PhaseRecord>): PhaseRecord {
    let result: PhaseRecord;
    updateCase(caseId, (c) => {
        let phase = c.phases.find((p) => p.name === name);
        if (!phase) {
            phase = { name, status: 'pending' };
            c.phases.push(phase);
        }
        Object.assign(phase, patch);
        result = phase;
    });
    return result;
}

// ─── Shared audiences ────────────────────────────────────────────────────────

/** Key for a shared audience: the user ids exactly as stored (case and prefix preserved), sorted. */
export const sharedAudienceKey = (userIds: string[]): string => [...userIds].sort().join(',');
function audienceFile(userIds: string[]): string {
    return path.join(AUDIENCES_DIR, `${safeName(sharedAudienceKey(userIds))}.json`);
}

export function getSharedAudience(userIds: string[]): SharedAudience | undefined {
    migrateLegacy();
    return readJson<SharedAudience>(audienceFile(userIds));
}

export function saveSharedAudience(audience: SharedAudience): void {
    writeJson(audienceFile(audience.userIds), audience);
}

/** Forget a shared audience that no longer matches its user ids, so it is created again. */
export function dropSharedAudience(userIds: string[]): void {
    try { fs.unlinkSync(audienceFile(userIds)); } catch { /* already gone */ }
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/**
 * Runs `fn` while holding the creation lock for one user set, so two parallel workers never create
 * the same shared audience. The lock file is created atomically ('wx'); a lock left by a dead process
 * or older than `staleMs` is cleared. Other workers wait until it is free.
 */
export async function withSharedAudienceLock<T>(userIds: string[], fn: () => Promise<T>, timeoutMs = 30 * 60 * 1000, staleMs = 30 * 60 * 1000): Promise<T> {
    fs.mkdirSync(AUDIENCES_DIR, { recursive: true });
    const lock = `${audienceFile(userIds)}.lock`;
    const deadline = Date.now() + timeoutMs;
    for (;;) {
        try {
            const fd = fs.openSync(lock, 'wx');
            fs.writeSync(fd, String(process.pid));
            fs.closeSync(fd);
            break;
        } catch (err: any) {
            if (err?.code !== 'EEXIST') throw err;
            const holder = Number(fs.readFileSync(lock, 'utf8').trim() || 0);
            const age = Date.now() - fs.statSync(lock).mtimeMs;
            if ((holder && !isAlive(holder)) || age > staleMs) {
                try { fs.unlinkSync(lock); } catch { /* another worker cleared it */ }
                continue;
            }
            if (Date.now() > deadline) throw new Error(`Timed out waiting for the shared audience lock for ${sharedAudienceKey(userIds)} (held by process ${holder})`);
            await sleep(3000);
        }
    }
    try {
        return await fn();
    } finally {
        try { fs.unlinkSync(lock); } catch { /* gone */ }
    }
}
