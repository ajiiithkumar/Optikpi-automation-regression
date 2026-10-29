/**
 * Turns raw campaign engagement log records into per-user communication counts.
 *
 * One communication produces several rows (SentToProvider, Delivered, Open, Engaged, Click ...).
 * They share the same communication_id, so a send is counted once per distinct communication_id,
 * never once per status row. Goal-tracking rows (revenue / deposit / login) are not sends.
 */

export interface EngagementRecord {
    userId: string;
    communicationId: string;
    runId: string;
    group: string;
    status: string;
    channel: string;
    provider: string;
    comment: string;
    timestamp: string;
}

export interface UserCommunications {
    userId: string;
    /** Distinct communication ids, oldest first. */
    communicationIds: string[];
    /** Earliest row timestamp for each communication id, same order. */
    firstSeenAt: string[];
    groups: string[];
    statuses: string[];
    failedCommunicationIds: string[];
}

/** Rows the report itself excludes from delivery data (goal tracking, not sends). */
export const NON_SEND_STATUSES = ['revenue', 'deposit', 'login'];
export const FAILED_STATUS = 'SentFailed';
export const CONTROL_GROUP = 'controlGroup';

/** Maps one report API hit (`_source`) to an EngagementRecord. */
export function toEngagementRecord(source: Record<string, any>): EngagementRecord {
    return {
        userId: String(source.user_id ?? ''),
        communicationId: String(source.communication_id ?? ''),
        runId: String(source.run_id ?? ''),
        group: String(source.group ?? ''),
        status: String(source.status ?? ''),
        channel: String(source.channel ?? ''),
        provider: String(source.provider ?? ''),
        comment: String(source.comment ?? ''),
        timestamp: String(source['@timestamp'] ?? ''),
    };
}

export function summarizeByUser(records: EngagementRecord[]): Map<string, UserCommunications> {
    const byUser = new Map<string, UserCommunications>();
    const sorted = [...records].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    for (const r of sorted) {
        if (!r.userId || NON_SEND_STATUSES.includes(r.status)) continue;
        let u = byUser.get(r.userId);
        if (!u) {
            u = { userId: r.userId, communicationIds: [], firstSeenAt: [], groups: [], statuses: [], failedCommunicationIds: [] };
            byUser.set(r.userId, u);
        }
        if (!u.statuses.includes(r.status)) u.statuses.push(r.status);
        if (r.group && !u.groups.includes(r.group)) u.groups.push(r.group);
        if (!r.communicationId) continue;
        if (r.status === FAILED_STATUS) {
            if (!u.failedCommunicationIds.includes(r.communicationId)) u.failedCommunicationIds.push(r.communicationId);
            continue;
        }
        if (!u.communicationIds.includes(r.communicationId)) {
            u.communicationIds.push(r.communicationId);
            u.firstSeenAt.push(r.timestamp);
        }
    }
    return byUser;
}

/** Number of distinct (non-failed) communications for a user; 0 when the user has none. */
export const countFor = (summary: Map<string, UserCommunications>, userId: string): number =>
    summary.get(userId)?.communicationIds.length ?? 0;

/** Compact, secret-free text for reports: "user_001: 1 [abc123..] groups=A". */
export function describeSummary(summary: Map<string, UserCommunications>, userIds?: string[]): string {
    const ids = userIds ?? [...summary.keys()];
    return ids.map((id) => {
        const u = summary.get(id);
        if (!u) return `${id}: 0`;
        const comms = u.communicationIds.map((c) => c.slice(0, 8)).join(',');
        const failed = u.failedCommunicationIds.length ? ` failed=${u.failedCommunicationIds.length}` : '';
        return `${id}: ${u.communicationIds.length} [${comms}] groups=${u.groups.join('/') || '-'}${failed}`;
    }).join('; ');
}
