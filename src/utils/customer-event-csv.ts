import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

/**
 * Builds the Customer Events CSV imported through Data platform -> Customer Events -> Import CSV.
 * Columns follow the approved deposit sample; required by the importer:
 * user_id, event_id, event_time, event_category, event_name.
 * Every file gets a fresh event_id, transaction_id and event_time so the backend treats it as a new event.
 */

const HEADER = [
    'event_id', 'event_name', 'event_category', 'event_time', 'user_id', 'amount',
    'payment_method', 'transaction_id', 'payment_provider_id', 'payment_provider_name', 'failure_reason',
];

export interface DepositEvent {
    eventId: string;
    transactionId: string;
    userId: string;
    amount: number;
    eventTime: string;
    csvPath: string;
}

const EVENTS_DIR = path.join(process.cwd(), 'reports', 'e2e-events');

const hex = (): string => randomUUID().replace(/-/g, '');

export function createSuccessfulDepositCsv(userId: string, amount = 100, when: Date = new Date()): DepositEvent {
    if (!userId) throw new Error('createSuccessfulDepositCsv: userId is required');
    const eventId = randomUUID();
    const transactionId = `transact_${hex()}`;
    const eventTime = when.toISOString();
    const row = [
        eventId, 'Successful Deposit', 'Deposit', eventTime, userId, String(amount),
        'wallet', transactionId, `payment__${hex().slice(0, 8)}`, 'Stripe', '',
    ];
    fs.mkdirSync(EVENTS_DIR, { recursive: true });
    const stamp = eventTime.replace(/[-:]/g, '').replace(/\..+$/, '');
    const csvPath = path.join(EVENTS_DIR, `deposit_event_${userId}_amount_${amount}_${stamp}_${eventId.slice(0, 8)}.csv`);
    fs.writeFileSync(csvPath, `${HEADER.join(',')}\n${row.join(',')}\n`, 'utf8');
    return { eventId, transactionId, userId, amount, eventTime, csvPath };
}
