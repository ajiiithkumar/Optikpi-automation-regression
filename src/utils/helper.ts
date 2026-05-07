
import fs, { openSync, closeSync, unlinkSync } from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';
import { Buffer } from 'buffer';
// import { World } from '@cucumber/cucumber'; 
// We use 'any' for World to avoid strict typing issues with custom attachments for now, 
// or we can import the type if we augment it.


const SCREENSHOTS_DIR = path.join(process.cwd(), 'reports', 'screenshots');
const MAX_PREFIX_LENGTH = 80;
const FALLBACK_PNG_BASE64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/axjX8sAAAAASUVORK5CYII=';
const DEBUG_SCREENSHOTS = process.env.DEBUG_SCREENSHOTS === '1' || process.env.DEBUG_SCREENSHOTS === 'true';

const DATA_DIR = path.join(process.cwd(), 'data');
// audience.json path kept for cleanup only
const AUDIENCE_JSON_PATH = path.join(DATA_DIR, 'audience.json');
const NAME_JSON_PATH = path.join(DATA_DIR, 'names.json');
const USERS_CSV_PATH = path.join(DATA_DIR, 'users.csv');

const AUDIENCE_TITLE_MIN_LENGTH = 2;
const AUDIENCE_TITLE_MAX_LENGTH = 70;

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

let screenshotsDirPromise: Promise<string> | null = null;

export const ensureScreenshotsDir = async (): Promise<string> => {
    if (!screenshotsDirPromise) {
        screenshotsDirPromise = fsPromises.mkdir(SCREENSHOTS_DIR, { recursive: true }).then(() => SCREENSHOTS_DIR);
    }
    return screenshotsDirPromise;
};

export const sanitizeFileName = (value: string): string =>
    String(value || '')
        .replace(/[^a-zA-Z0-9-_]+/g, '_')
        .replace(/^_+|_+$/g, '');

export const truncate = (value: string, maxLength: number): string => (value.length > maxLength ? value.slice(0, maxLength) : value);

export const uniqueId = (): string => {
    if (process.hrtime && typeof process.hrtime.bigint === 'function') {
        return `${Date.now()}-${process.hrtime.bigint()}`;
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

export const generateAudienceTitle = (minLength = AUDIENCE_TITLE_MIN_LENGTH, maxLength = AUDIENCE_TITLE_MAX_LENGTH): string => {
    const min = Math.max(2, Math.min(minLength, maxLength));
    const max = Math.max(min, Math.min(70, maxLength));
    const prefix = 'Audience-';
    const suffix = uniqueId();
    const raw = `${prefix}${suffix}`;
    if (raw.length <= max) return raw.length >= min ? raw : raw + 'x'.repeat(min - raw.length);
    return raw.slice(0, max);
};

export const readAudienceJson = async (filePath = NAME_JSON_PATH): Promise<any> => {
    return readNameJson(filePath);
};

export const writeAudienceJson = async (filePath: string, data: any): Promise<void> => {
    const dir = path.dirname(filePath);
    await fsPromises.mkdir(dir, { recursive: true });
    await fsPromises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
};

export const isOlderThanOneDay = (timestampStr: string | number): boolean => {
    if (!timestampStr) return true;
    const ts = /^\d+$/.test(String(timestampStr).trim())
        ? Number(timestampStr)
        : Date.parse(String(timestampStr));
    if (Number.isNaN(ts)) return true;
    return (Date.now() - ts) >= ONE_DAY_MS;
};

// --- Legacy audience.json helpers now delegate to Name.json ---

export const getAudienceEntry = (data: any, slot: 'old' | 'new'): any => {
    // For 'new' slot, read from data.audience
    if (slot === 'new') {
        const obj = data?.audience;
        if (!obj || !obj.title) return null;
        return {
            title: String(obj.title),
            brand: String(obj.brand ?? ''),
            timestamp: String(obj.timestamp ?? '')
        };
    }
    // 'old' slot is no longer used but kept for backward compat
    const obj = data?.[slot];
    if (!obj || !obj.title) return null;
    return {
        title: String(obj.title),
        brand: String(obj.brand ?? ''),
        timestamp: String(obj.timestamp ?? '')
    };
};

export const setAudienceEntry = (data: any, slot: 'old' | 'new', entry: any): void => {
    if (slot === 'new') {
        // Write to data.audience (unified Name.json format)
        data.audience = {
            title: String(entry.title ?? ''),
            brand: String(entry.brand ?? ''),
            timestamp: String(entry.timestamp ?? '')
        };
        return;
    }
    // 'old' slot kept for backward compat
    if (!data[slot]) data[slot] = {};
    data[slot].title = String(entry.title ?? '');
    data[slot].brand = String(entry.brand ?? '');
    data[slot].timestamp = String(entry.timestamp ?? '');
};

export const getOldAudienceTitle = async (filePath = NAME_JSON_PATH): Promise<any> => {
    const data = await readNameJson(filePath);
    return getAudienceEntry(data, 'old');
};

export const getNewAudienceTitle = async (filePath = NAME_JSON_PATH): Promise<any> => {
    const data = await readNameJson(filePath);
    return getAudienceEntry(data, 'new');
};

export const saveDraftAudienceTitle = async (brandName: string, title: string): Promise<void> => {
    if (!title) return;
    await saveNameEntry('audience', title, brandName);
};

export const getOrSetAudienceTitle = async (
    brandName = '',
    minLength = AUDIENCE_TITLE_MIN_LENGTH,
    maxLength = AUDIENCE_TITLE_MAX_LENGTH
): Promise<string> => {
    const title = generateAudienceTitle(minLength, maxLength);
    await saveNameEntry('audience', title, brandName);
    return title;
};

export const readUsersCsv = async (csvPath = USERS_CSV_PATH): Promise<Array<Record<string, string>>> => {
    try {
        const content = await fsPromises.readFile(csvPath, 'utf8');
        const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        if (lines.length === 0) return [];
        const header = lines[0].split(',').map((c) => c.trim());
        const rows: Array<Record<string, string>> = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map((c) => c.trim());
            const row: Record<string, string> = {};
            header.forEach((h, j) => { row[h] = values[j] ?? ''; });
            rows.push(row);
        }
        return rows;
    } catch (err: any) {
        if (err?.code === 'ENOENT') return [];
        throw err;
    }
};

export const buildScreenshotName = (filePrefix: string): string => {
    const safePrefix = truncate(sanitizeFileName(filePrefix) || 'screenshot', MAX_PREFIX_LENGTH);
    return `${uniqueId()}-${safePrefix}.png`;
};

export const attachText = async (world: any, message: string): Promise<void> => {
    if (!world?.attach) return;
    const text = String(message ?? '').trim();
    if (!text) return;
    try {
        await world.attach(text, 'text/plain');
    } catch {
        // Ignore attach errors
    }
};

export const writeScreenshot = async (buffer: Buffer, filePrefix: string, targetDir = SCREENSHOTS_DIR): Promise<string> => {
    await fsPromises.mkdir(targetDir, { recursive: true });
    const filename = buildScreenshotName(filePrefix);
    const filePath = path.join(targetDir, filename);
    await fsPromises.writeFile(filePath, buffer);
    return filePath;
};

export const captureScreenshot = async (world: any, options: any = {}): Promise<Buffer | null> => {
    const {
        label,
        writeToDisk = false,
        filePrefix = 'screenshot',
        fullPage = true,
        timeoutMs = 15000,
        attachToReport = true
    } = options;

    if (DEBUG_SCREENSHOTS) console.log(`[Screenshot] Capturing: ${filePrefix}`);

    if (label) {
        if (DEBUG_SCREENSHOTS) console.log(`[Screenshot] Label: ${label}`);
    }

    const page = world?.page;
    let buffer: Buffer | null = null;
    let captureError = '';

    if (!page || typeof page.screenshot !== 'function') {
        captureError = 'No page available for screenshot';
        if (DEBUG_SCREENSHOTS) console.log(`[Screenshot] ${captureError}`);
    } else {
        buffer = await page
            .screenshot({ fullPage, timeout: timeoutMs })
            .catch((err: any) => {
                captureError = err?.message || 'Screenshot capture failed';
                if (DEBUG_SCREENSHOTS) console.log(`[Screenshot] Capture failed: ${captureError}`);
                return null;
            });
    }

    if (!buffer) {
        buffer = Buffer.from(FALLBACK_PNG_BASE64, 'base64');
        if (DEBUG_SCREENSHOTS) console.log('[Screenshot] Using fallback image');
    } else {
        if (DEBUG_SCREENSHOTS) console.log(`[Screenshot] Captured buffer size: ${buffer.length} bytes`);
    }

    if (writeToDisk) {
        try {
            const diskPath = await writeScreenshot(buffer, filePrefix, SCREENSHOTS_DIR);
            if (DEBUG_SCREENSHOTS) console.log(`[Screenshot] Saved to disk: ${diskPath}`);
        } catch (err: any) {
            if (DEBUG_SCREENSHOTS) console.log(`[Screenshot] Disk write failed: ${err.message}`);
        }
    }

    if (attachToReport && buffer && world?.attach) {
        try {
            await world.attach(buffer, 'image/png');
            if (captureError) {
                if (DEBUG_SCREENSHOTS) console.log(`[Screenshot] Fallback reason: ${captureError}`);
            }
            if (DEBUG_SCREENSHOTS) console.log('[Screenshot] Attached to Cucumber (Extent report)');
        } catch (err: any) {
            if (DEBUG_SCREENSHOTS) console.log(`[Screenshot] Cucumber attach failed: ${err.message}`);
        }
    }

    return buffer;
};

export const log = async (world: any, level: string, message: string, screenshotOptions: any): Promise<void> => {
    const line = `${level}: ${message}`;
    await attachText(world, line);

    if (screenshotOptions) {
        const options = screenshotOptions === true ? {} : { ...screenshotOptions };
        if (!options.label) {
            options.label = line;
        }
        await captureScreenshot(world, options);
    }
};

export const logInfo = (world: any, message: string, opts: any) => log(world, 'INFO', message, opts);
export const logPass = (world: any, message: string, opts: any) => log(world, 'PASS', message, opts);
export const logFail = (world: any, message: string, opts: any) => log(world, 'FAIL', message, opts);

// ─── Name.json helpers (campaign / audience / workflow) ──────────────────────

const NAMES_LOCK = NAME_JSON_PATH + '.lock';

const withFileLock = async <T>(fn: () => Promise<T>): Promise<T> => {
    let fd: number | null = null;
    const maxRetries = 20;
    for (let i = 0; i < maxRetries; i++) {
        try {
            fd = openSync(NAMES_LOCK, 'wx');
            break;
        } catch {
            await new Promise(r => setTimeout(r, 100));
        }
    }
    if (fd === null) throw new Error('Could not acquire names.json lock');
    try {
        return await fn();
    } finally {
        closeSync(fd);
        try { unlinkSync(NAMES_LOCK); } catch {}
    }
};

export const resetNamesJson = async (): Promise<void> => {
    await fsPromises.mkdir(path.dirname(NAME_JSON_PATH), { recursive: true });
    await fsPromises.writeFile(NAME_JSON_PATH, '{}', 'utf8');
};

export const readNameJson = async (filePath = NAME_JSON_PATH): Promise<any> => {
    return withFileLock(async () => {
        try {
            const content = await fsPromises.readFile(filePath, 'utf8');
            const data = JSON.parse(content || '{}');
            return data && typeof data === 'object' ? data : {};
        } catch (err: any) {
            if (err?.code === 'ENOENT' || err instanceof SyntaxError) return {};
            throw err;
        }
    });
};

const readNamesFileSafe = async (): Promise<Record<string, any>> => {
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const raw = await fsPromises.readFile(NAME_JSON_PATH, 'utf8');
            const parsed = JSON.parse(raw || '{}');
            if (parsed && typeof parsed === 'object') return parsed;
        } catch (err: any) {
            if (err?.code === 'ENOENT') return {};
            if (attempt < 2) await new Promise(r => setTimeout(r, 50));
        }
    }
    return {};
};

export const saveNameEntry = async (
    type: 'campaign' | 'audience' | 'workflow' | 'existingAudience' | string,
    title: string,
    brand?: string
): Promise<void> => {
    if (!title) return;
    await saveNameEntries([{ type, title, brand }]);
};

export const saveNameEntries = async (
    entries: Array<{ type: string; title: string; brand?: string }>
): Promise<void> => {
    const valid = entries.filter(e => e.title);
    if (valid.length === 0) return;
    await withFileLock(async () => {
        const data = await readNamesFileSafe();
        const now = new Date().toISOString();
        for (const { type, title, brand } of valid) {
            data[type] = {
                title: String(title),
                timestamp: now,
                ...(brand !== undefined ? { brand: String(brand) } : {})
            };
        }
        const dir = path.dirname(NAME_JSON_PATH);
        await fsPromises.mkdir(dir, { recursive: true });
        await fsPromises.writeFile(NAME_JSON_PATH, JSON.stringify(data, null, 2), 'utf8');
    });
};

export const getNameEntry = async (
    type: 'campaign' | 'audience' | 'workflow' | 'existingAudience'
): Promise<{ title: string; timestamp: string } | null> => {
    const data = await readNameJson();
    const entry = data?.[type];
    if (!entry?.title) return null;
    return { title: String(entry.title), timestamp: String(entry.timestamp ?? '') };
};
