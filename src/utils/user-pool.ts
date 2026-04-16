import fs from 'fs';
import path from 'path';

// Helper types
interface User {
    username: string;
    password?: string;
    authFile: string;
    [key: string]: any;
}

const sanitizeFileName = (value: string): string => String(value || '').replace(/[^a-zA-Z0-9_-]/g, '_');

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// Base directory for all user-related data
const DATA_DIR = path.join(process.cwd(), 'data');

function readUsers(): User[] {
    const configPath = path.join(DATA_DIR, 'users-config', 'users.json');
    if (!fs.existsSync(configPath)) {
        throw new Error(`Users config not found at ${configPath}`);
    }

    const raw = fs.readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(raw);
    const entries = Array.isArray(parsed?.users) ? parsed.users : [];
    const users: User[] = entries.filter((user: any) => user && user.username);
    if (!users.length) {
        throw new Error('No users found in data/users-config/users.json (expected { "users": [ ... ] }).');
    }

    const authDir = path.join(DATA_DIR, 'auth');
    if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true });
    }

    return users.map((user: any) => ({
        ...user,
        authFile: path.join(authDir, `${sanitizeFileName(user.username)}.json`)
    }));
}

function ensureLocksDir(): string {
    const locksDir = path.join(DATA_DIR, '.user-locks');
    if (!fs.existsSync(locksDir)) {
        fs.mkdirSync(locksDir, { recursive: true });
    }
    return locksDir;
}

const MAX_LOCK_AGE_MS = 15 * 60 * 1000; // 15 minutes — well above longest scenario runtime

function isProcessAlive(pid: number): boolean {
    try {
        process.kill(pid, 0);
        return true;
    } catch {
        return false;
    }
}

function isLockStale(lockFile: string): boolean {
    try {
        const content = fs.readFileSync(lockFile, 'utf8').trim();
        const [pidStr, timestamp] = content.split('\n');
        const pid = parseInt(pidStr, 10);

        if (!isNaN(pid) && !isProcessAlive(pid)) return true;

        if (timestamp) {
            const lockAge = Date.now() - new Date(timestamp).getTime();
            if (lockAge > MAX_LOCK_AGE_MS) return true;
        }

        return false;
    } catch {
        return true;
    }
}

function tryAcquireLock(username: string): { lockFile: string } | null {
    const locksDir = ensureLocksDir();
    const lockFile = path.join(locksDir, `${sanitizeFileName(username)}.lock`);

    if (fs.existsSync(lockFile) && isLockStale(lockFile)) {
        try { fs.unlinkSync(lockFile); } catch { /* another worker may have grabbed it */ }
    }

    try {
        const fd = fs.openSync(lockFile, 'wx');
        fs.writeFileSync(fd, `${process.pid}\n${new Date().toISOString()}\n`, 'utf8');
        fs.closeSync(fd);
        return { lockFile };
    } catch {
        return null;
    }
}

export function releaseLock(lockFile: string | null): void {
    if (!lockFile) return;
    try {
        fs.unlinkSync(lockFile);
    } catch {
        // ignore
    }
}

/**
 * Acquire a free user for this scenario execution.
 */
export async function acquireUser({ timeoutMs = 60000, pollMs = 250 } = {}): Promise<{ user: User; lockFile: string }> {
    const users = readUsers();
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        for (const user of users) {
            const username = user.username;
            if (!username) continue;
            const lock = tryAcquireLock(username);
            if (lock) {
                return { user, lockFile: lock.lockFile };
            }
        }
        await sleep(pollMs);
    }

    throw new Error(`Timed out acquiring a user after ${timeoutMs}ms. All users appear to be in use.`);
}
