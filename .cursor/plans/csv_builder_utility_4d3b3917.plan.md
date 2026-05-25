---
name: CSV Builder Utility
overview: Build a CSV generator utility that creates fresh event CSVs (account + deposit combined, and audience sample) with today's date/time and random user IDs, usable both as a standalone CLI script and automatically before test runs. This prepares realistic test data for a new Settings-based CSV upload scenario.
todos:
  - id: csv-builder
    content: Create `src/utils/csv-builder.ts` with generators for users, account+deposit events, and audience sample CSVs
    status: pending
  - id: npm-script
    content: Add `csv:build` npm script to `package.json`
    status: pending
  - id: hooks-integration
    content: Add `BeforeAll` hook call to `buildAll()` in `src/support/hooks.ts`
    status: pending
  - id: verify
    content: Run the CSV builder standalone and verify output files have correct schema and fresh timestamps
    status: pending
isProject: false
---

# CSV Builder Utility for Dynamic Test Data

## Context

The current `Sample_CSV/` files and `data/users.csv` contain static, stale data. The audience test scenarios (e.g. REG-AUD-02, REG-AUD-05, REG-AUD-06, REG-AUD-08) rely on steps like "check the Customer count" and "Click the Preview button" which verify real-time data. The CSV builder will generate fresh CSVs with current timestamps and random user IDs so that uploaded data matches the test execution window.

## Current State

- `data/users.csv` — 6 static test users (`user_001` to `user_006`) read by [`src/utils/helper.ts`](src/utils/helper.ts) via `readUsersCsv()`
- `Sample_CSV/audience_sample.csv` — single-row audience template with hardcoded user `45652`
- `Sample_CSV/account (2).csv` — 20 account events (Login, Logout, KYC, etc.) with timestamps from May 12
- `Sample_CSV/deposit (1).csv` — 20 deposit events with timestamps from May 12
- Steps in [`src/steps/audience.steps.ts`](src/steps/audience.steps.ts) call `readUsersCsv()` to get user IDs for criteria input

## Plan

### 1. Create `src/utils/csv-builder.ts`

A single utility that exports three generators and a CLI entry point:

- **`generateUsers(count: number)`** — produces `data/users.csv` with `count` random users (email, name, user_id columns matching current schema)
- **`generateAccountDepositEvents(userIds: string[])`** — produces a combined CSV at `Sample_CSV/account_deposit_events.csv` containing:
  - Account events: Login, Logout, Email Verification, KYC Verification, Phone Verification, Player Activation, Player Registration (columns matching `account (2).csv` schema)
  - Deposit events: Successful Deposit, First/Second/Third Time Deposit, Failed Deposit (columns matching `deposit (1).csv` schema plus account event columns, with nulls for non-applicable fields)
  - All timestamps set to **today** with sequential times starting from current hour
- **`generateAudienceSample(userIds: string[])`** — produces `Sample_CSV/audience_sample_generated.csv` with a subset of the generated user IDs (columns matching `audience_sample.csv` schema)
- **`buildAll()`** — orchestrates: generate users, then generate events + audience sample using those user IDs

Key design decisions:
- Random IDs generated via `crypto.randomUUID().slice(0, 10)` prefixed with `user_`
- Timestamps use the current date (`new Date()`) with sequential minute offsets
- Event fields (device, affiliate_id, partner_id, status, etc.) randomized from realistic value pools
- Deposit amounts randomized within reasonable ranges
- The combined account+deposit CSV will share the same columns with empty values where a column doesn't apply to the event type

### 2. Update `data/users.csv` schema alignment

The generated `users.csv` will keep the same 3-column schema (`email,name,user_id`) so `readUsersCsv()` in [`src/utils/helper.ts`](src/utils/helper.ts) continues to work without changes. The audience steps that call `readUsersCsv()` (lines 152, 167, 230, 242, 266, 590 in `audience.steps.ts`) will automatically pick up the fresh user IDs.

### 3. Add npm script and Before-hook integration

- Add `"csv:build"` script to `package.json`: `ts-node src/utils/csv-builder.ts`
- In [`src/support/hooks.ts`](src/support/hooks.ts), add a `BeforeAll` call to `buildAll()` so CSVs are regenerated at the start of every test run (similar to how `names.json` is reset)

### 4. Output files

| Generated file | Purpose |
|---|---|
| `data/users.csv` | Fresh user IDs for `readUsersCsv()` |
| `Sample_CSV/account_deposit_events.csv` | Combined account + deposit events for UI upload |
| `Sample_CSV/audience_sample_generated.csv` | Audience CSV for new audience creation upload |

The original `Sample_CSV/` files remain untouched as reference templates.
