/**
 * Bounded polling for asynchronous backend processing (campaign execution, event ingestion).
 * Use this instead of long fixed sleeps: it returns as soon as the condition holds and fails
 * with a descriptive message (including the last observed value) when the deadline passes.
 */

export interface PollOptions {
    /** What we are waiting for, used in the timeout message. */
    description: string;
    timeoutMs: number;
    intervalMs?: number;
}

export class PollTimeoutError extends Error {
    constructor(message: string, readonly lastObserved: unknown) {
        super(message);
        this.name = 'PollTimeoutError';
    }
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calls `probe` until `isDone(value)` is true, or throws PollTimeoutError.
 * Errors thrown by `probe` are remembered and retried (the backend may not have the record yet);
 * the last one is reported if the deadline passes.
 */
export async function pollUntil<T>(
    probe: () => Promise<T>,
    isDone: (value: T) => boolean,
    options: PollOptions,
): Promise<T> {
    const intervalMs = options.intervalMs ?? 15000;
    const deadline = Date.now() + options.timeoutMs;
    let lastValue: T | undefined;
    let lastError: unknown;
    let attempts = 0;

    while (Date.now() < deadline) {
        attempts++;
        try {
            lastValue = await probe();
            lastError = undefined;
            if (isDone(lastValue)) return lastValue;
        } catch (err) {
            lastError = err;
        }
        const remaining = deadline - Date.now();
        if (remaining <= 0) break;
        await sleep(Math.min(intervalMs, remaining));
    }

    const observed = lastError !== undefined ? `last error: ${String(lastError)}` : `last value: ${JSON.stringify(lastValue)}`;
    throw new PollTimeoutError(
        `Timed out after ${Math.round(options.timeoutMs / 1000)}s (${attempts} attempts) waiting for ${options.description}; ${observed}`,
        lastError ?? lastValue,
    );
}

/** Minutes from an env var, with a default. */
export const envMinutes = (name: string, defaultMinutes: number): number => {
    const raw = Number(process.env[name]);
    return (Number.isFinite(raw) && raw > 0 ? raw : defaultMinutes) * 60 * 1000;
};
