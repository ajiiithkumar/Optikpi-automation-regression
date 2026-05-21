# OptiKPI V2.0 Smoke Test Automation — Project Documentation

End-to-end smoke and regression tests for the **OptiKPI V2.0** platform, using Gherkin, Cucumber.js, and Playwright. For day-to-day contribution rules (POM, steps, tags, test data), see [`AGENTS.md`](../AGENTS.md) in the repository root.

## Technologies Used

| Technology | Purpose |
|-----------|---------|
| **TypeScript** | Page objects, step definitions, hooks, and utilities |
| **Playwright** (1.58+ in dev; Docker image may pin an older baseline) | Browser automation (Chromium) |
| **Cucumber.js** (`@cucumber/cucumber` v12) | BDD execution with Gherkin |
| **Extent Reports** (`cucumber-js-extent`) | HTML reporting with screenshots and step logs |
| **ts-node** | TypeScript execution without precompilation |
| **dotenv** | Loads `.env` for local and runner scripts |
| **Docker** | Optional containerised headless runs |
| **cross-env** | Cross-platform environment variables |
| **rimraf** | Cross-platform directory cleanup |
| **Node.js** ≥ 20.17 | Runtime |

---

## Project Structure

```
OptiKPI_V2.0_SmokeTest_Automation/
├── config/
│   ├── cucumber.js                  # Cucumber paths, formats, parallel workers
│   └── parallel-run-config.json     # Group runner: tags, prerequisites, thread count
├── data/
│   ├── users-config/users.json      # User pool credentials
│   ├── users.csv                    # Optional CSV helpers / IDs
│   ├── names.json                   # Shared names (audience/campaign/workflow); reset per run
│   ├── auth/                        # Cached storage state per user (generated)
│   └── .user-locks/                 # Concurrency locks (generated)
├── features/
│   ├── audience.feature             # Audience regression (criteria, lifecycle, UI)
│   ├── campaign.feature             # Campaign regression (goals, triggers, variants, etc.)
│   ├── dashboard.feature            # Dashboard smoke scenarios
│   ├── settings.feature             # Settings smoke scenarios
│   └── workflow.feature             # Workflow smoke scenarios
├── src/
│   ├── pages/                       # Page Object Model
│   │   ├── base.page.ts
│   │   ├── login.page.ts
│   │   ├── dashboard.page.ts
│   │   ├── audience.page.ts
│   │   ├── campaign.page.ts
│   │   ├── workflow.page.ts
│   │   └── components/
│   │       ├── navigation-bar.component.ts
│   │       └── date-time-picker.component.ts
│   ├── steps/
│   │   ├── common.steps.ts
│   │   ├── audience.steps.ts
│   │   ├── campaign.steps.ts
│   │   ├── dashboard.steps.ts
│   │   ├── settings.steps.ts
│   │   └── workflow.steps.ts
│   ├── support/
│   │   ├── world.ts                 # PlaywrightWorld
│   │   ├── hooks.ts                 # Browser lifecycle, screenshots, locks
│   │   └── reporting/               # Extent adapter (JS wrapper + TS adapter)
│   │       ├── extent-adapter-wrapper.js
│   │       ├── extent-adapter.ts
│   │       └── templates/           # Nunjucks macros (e.g. step_logs_macro.njk)
│   ├── utils/
│   │   ├── helper.ts                # names.json (save/wait/mark-completed), screenshots, logging helpers
│   │   ├── user-pool.ts
│   │   ├── extent-manager.ts
│   │   ├── extent-test-manager.ts
│   │   ├── casino-site-api.ts       # Optional casino API client for test data
│   │   └── run-casino-api.ts        # CLI entry for casino helpers
│   └── runner/
│       └── runner.js                # Group parallel runner, merge, optional retry & Slack
├── scripts/
│   └── slack-report.js              # Post summary / report to Slack (optional)
├── reports/                         # Generated (gitignored): extent, screenshots, json
├── AGENTS.md                        # Maintainer conventions
├── Dockerfile
├── docker-compose.yml
├── extent-config.json
├── playwright.config.ts             # Playwright tooling config (e.g. example spec)
├── tsconfig.json
└── package.json
```

---

## Test Coverage Overview

### Regression (`@Regression`)

All scenarios use `@Regression` for execution. Scenario IDs use `@REG-<MODULE>-<NN>` (e.g. `@REG-DASH-01`, `@REG-AUD-01`, `@REG-CAMP-18`).

| Module | Scenarios (approx.) | Focus |
|--------|:-------------------:|-------|
| **Dashboard** | 2 | Page load, KPI widgets, tabs, date filter |
| **Settings** | 1 | Page load |
| **Workflow** | 2 | Tabs, create/activate workflow with validation |
| **Audience** | 15 | Criteria types (event, metric, engagement, part-of-audience), AND/OR groups, draft/publish, duplicate, preview, validation, UI |
| **Campaign** | 25 | Tabs, goals, audiences, triggers, variants, A/B allocation, draft/publish, duplicate, delete, pagination, search, filters, history, report |

Parallel execution uses `baseTag`: `@Regression` in `config/parallel-run-config.json`.

---

## Architecture Overview

### Page Object Model (POM)

All browser interactions go through page classes that extend **`BasePage`** (`src/pages/base.page.ts`).

```
BasePage
  ├── LoginPage
  ├── DashboardPage
  ├── AudiencePage
  ├── CampaignPage
  ├── WorkflowPage
  └── components/
      ├── NavigationBarComponent
      └── DateTimePickerComponent
```

Common **`BasePage`** helpers:

| Method | Purpose |
|--------|---------|
| `click(selector)` | Wait → click → short settle |
| `forceClick(selector)` | Force click when overlapping |
| `fill(selector, value)` | Wait → clear → type |
| `getText(selector)` | `innerText` |
| `getInputValue(selector)` | Input value |
| `isVisible(selector)` | Boolean within timeout |
| `waitForVisible(selector)` | Wait until visible |
| `pause(ms)` | Fixed delay (use sparingly) |
| `waitForNetworkIdle()` | Network idle |

Selectors are defined in a **`private readonly sel`** object per page (see [`AGENTS.md`](../AGENTS.md)).

---

### Custom World — `PlaywrightWorld`

Defined in `src/support/world.ts`. Extends Cucumber’s `World` with:

| Property | Purpose |
|----------|---------|
| `browser` | Shared Chromium instance |
| `context` | Per-scenario context |
| `page` | Active page |
| `user` | Credentials from the pool |
| `userLockFile` | Lock file path for the current user |
| `scenarioTag` / `scenarioTags` | Set in `Before` for tag-based data and logic |

Default step timeout: **120 seconds**.

---

### Cucumber Hooks (summary)

```
Before      → scenario: Extent context, tags, shared browser
BeforeStep  → optional skip when “limit reached” is set on the world
AfterStep   → screenshot: failures to disk + report; passes attached to report only (unless configured)
After       → scenario screenshot (per SCENARIO_SCREENSHOTS); on PASSED: markNameEntryCompleted for scenario tag key + type keys; close page/context, release user lock, clear Extent context
AfterAll    → close shared browser
```

---

## Test Execution

### NPM Scripts

| Script | Description |
|--------|-------------|
| `npm test` | `pretest` clean → Cucumber with `config/cucumber.js` (parallelism from `PARALLEL_THREADS`, default 1) |
| `npm run test:tag -- "<expression>"` | Cucumber with `--tags` (clears user locks/auth first via `pretest:tag`) |
| `npm run test:serial` | Same as `npm test` with `PARALLEL_THREADS=1` |
| `npm run test:screenshots` | `STEP_SCREENSHOTS` + `SCENARIO_SCREENSHOTS` set to capture more |
| `npm run test:extent` | Alias for serial run |
| `npm run test:parallel` | Group runner: `node src/runner/runner.js --groups` |
| `npm run test:parallel:continue` | Group runner, continue on group failure |
| `npm run test:parallel:dry-run` | Group runner dry-run |
| `npm run clean` | Remove reports, screenshots, JSON output, locks, auth cache |
| `npm run cleanup` / `cleanup:dry-run` | `node scripts/cleanup-test-data.js` (script must exist in `scripts/`) |
| `npm run slack:report` | Run Slack reporter standalone |
| `casino:*` | Optional casino API utilities (`register`, `login`, …) via `run-casino-api.ts` |

Examples:

```powershell
npm test
npm run test:tag -- "@Regression"
npm run test:tag -- "@REG-AUD-01"
npm run test:parallel
```

You can also run `node src/runner/runner.js` with the same flags as in `package.json` for custom orchestration.

### Parallel group runner

Configured in **`config/parallel-run-config.json`**. Example (align with repo):

```json
{
    "failFast": false,
    "parallel": 4,
    "baseTag": "@Regression",
    "prerequisites": [
        {
            "tag": "@ExistingAudience",
            "name": "Existing Audience Setup"
        }
    ]
}
```

**Typical flow**

1. **Clean** — runner removes prior report artifacts, locks, and auth cache targets.
2. **Prerequisites** — scenarios tagged per `prerequisites` (e.g. `@ExistingAudience`) run first.
3. **Groups** — remaining scenarios matching `baseTag` run in parallel batches (`parallel` workers).
4. **Merge** — per-worker Extent HTML output is merged into `reports/extent/OptiKPI_V2.0_Smoke_Test.html`.
5. **Slack** — if `SLACK_WEBHOOK_URL` or `SLACK_BOT_TOKEN` is set, `scripts/slack-report.js` may run after the run.

The runner may also retry failed scenarios (see `MAX_RETRIES` in `src/runner/runner.js`).

---

## Reporting — Extent Reports

1. Cucumber uses the adapter referenced from **`config/cucumber.js`** (`extent-adapter-wrapper.js` + report path).
2. Steps attach logs and screenshots through hooks and helpers.
3. Default report path: `reports/extent/OptiKPI_V2.0_Smoke_Test.html` (overridable via `EXTENT_REPORT_PATH`).
4. **`postinstall`** (and Docker build) copy `step_logs_macro.njk` into `cucumber-js-extent` for inline popups.

### `extent-config.json`

Theme, title, and options (e.g. `timelineEnabled`) live in `extent-config.json`.

### Screenshot environment variables

| Variable | Values | Typical behaviour |
|----------|--------|-------------------|
| `STEP_SCREENSHOTS` | `always`, `never`, or unset | Hooks control pass/fail captures |
| `SCENARIO_SCREENSHOTS` | `always`, `failed`, `never` | End-of-scenario capture |
| `HEADLESS` | `true` / `false` | Browser launch (also world parameters) |

---

## User Pool (Concurrency-Safe Logins)

1. Users in **`data/users-config/users.json`**.
2. **`acquireUser()`** in `src/utils/user-pool.ts` creates a lock under **`data/.user-locks/`**.
3. **`After`** hook releases the lock.
4. Auth state may be cached under **`data/auth/`** to avoid redundant logins.

Provide at least as many users as parallel workers.

---

## Test Data (`data/names.json`)

Managed from **`src/utils/helper.ts`** (file locking inside helpers for safe parallel writes):

| Function | Purpose |
|----------|---------|
| `saveNameEntry` / `saveNameEntries` | Persist titles / names by type or tag key; sets `status: "in progress"` |
| `markNameEntryCompleted(keys)` | Sets `status: "completed"` on the given keys (called by `After` hook on PASSED) |
| `waitForNameEntryCompleted(key, timeoutMs?)` | Polls every 500 ms until an entry reaches `status: "completed"`, then returns `{ title, timestamp }`. Default timeout: 60 s |
| `getNameEntry` / `readNameJson` | Read entries directly (use only when no parallel writer dependency exists) |
| `resetNamesJson` | Reset store to `{}` at run start |
| `generateAudienceTitle` | Unique audience title |
| `readUsersCsv` | Read `data/users.csv` if used |
| `captureScreenshot` | Screenshots for hooks / steps |

Valid key types include `'audience'`, `'campaign'`, `'workflow'`, `'existingAudience'`, and scenario tag keys such as `'REG-AUD-05'` (see [`AGENTS.md`](../AGENTS.md)).

### Entry status lifecycle

Each entry in `names.json` tracks a `status` field:

```
saveNameEntries / saveNameEntry  →  status: "in progress"
After hook (PASSED)              →  status: "completed"    (markNameEntryCompleted)
After hook (FAILED)              →  status stays "in progress"
```

Steps that read data produced by another parallel scenario (e.g. `select the audience from the list`, `a Published Audience exists`) use `waitForNameEntryCompleted` instead of `readNameJson`, ensuring they block until the producer scenario has passed and the UI entity is ready.

---

## Feature Files & Tags

| Feature file | Primary tags | Role |
|--------------|--------------|------|
| `audience.feature` | `@Regression`, `@REG-AUD-NN` (+ `@Negative`, `@UI`, `@ExistingAudience` where used) | Audience regression |
| `campaign.feature` | `@Regression`, `@Campaign`, `@REG-CAMP-NN` | Campaign regression |
| `dashboard.feature` | `@Regression`, `@REG-DASH-NN` | Dashboard regression |
| `settings.feature` | `@Regression`, `@REG-SET-NN` | Settings regression |
| `workflow.feature` | `@Regression`, `@REG-WORKFLOW-NN` | Workflow regression |

**Special tags**

| Tag | Purpose |
|-----|---------|
| `@Regression` | All runnable scenarios — default `baseTag` |
| `@TestPreparation` | Reserved for prerequisite-style flows (see hooks/tag conventions in AGENTS) |
| `@ExistingAudience` | Prerequisite audience setup (see `parallel-run-config.json`) |
| `@REG-<MODULE>-<NN>` | Scenario ID — reporting and `names.json` keys |

---

## Slack Integration

Script: **`scripts/slack-report.js`**.

| Mode | Env | Behaviour |
|------|-----|-----------|
| Web API | `SLACK_BOT_TOKEN`, `SLACK_CHANNEL_ID` | Rich posting + optional file upload |
| Webhook | `SLACK_WEBHOOK_URL` | Incoming webhook message |

Optional: `REPORT_URL`, `RUN_LABEL`. See [slack-report.md](slack-report.md).

```powershell
npm run slack:report
```

---

## Docker

- **Dockerfile**: `mcr.microsoft.com/playwright:v1.52.0-noble`, Chromium, `HEADLESS=true`, `TZ=Asia/Kolkata`, default **`CMD`** `npm run test:parallel`.
- **docker-compose.yml**: Mounts `reports/` and `data/`; typical env `PARALLEL_THREADS=4`.

```powershell
docker compose up --build
docker compose run tests npm run test:serial
```

---

## Cucumber configuration (`config/cucumber.js`)

- **`paths`**: `features/**/*.feature`
- **`require`**: steps, `src/support/**/*.ts`, `src/utils/**/*.ts`
- **`format`**: `pretty` or `progress` depending on `PARALLEL_THREADS`, plus Extent adapter:
  - `./src/support/reporting/extent-adapter-wrapper.js:<report-path>`
- **`parallel`**: from `PARALLEL_THREADS` (default single worker)

---

## Setup Guide

### Prerequisites

- **Node.js** ≥ 20.17  
- **npm**

### Install & browsers

```powershell
git clone <repository-url>
cd OptiKPI_V2.0_SmokeTest_Automation
npm install
npx playwright install
```

### User pool

Create **`data/users-config/users.json`** with one object per parallel user (`username` / `password`).

### Run & open report

```powershell
npm test
# or
npm run test:parallel
```

Report: **`reports/extent/OptiKPI_V2.0_Smoke_Test.html`**

---

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| Cannot acquire user | Add users or lower `PARALLEL_THREADS` / group `parallel` count |
| Browser missing | `npx playwright install` |
| Stale login | Delete `data/auth/` |
| Stale locks | `npm run clean` or remove `data/.user-locks/` |
| No Extent HTML | Confirm adapter path in `config/cucumber.js` and that `npm install` / template patch ran |
| Docker crashes | `HEADLESS=true`, sufficient memory |
| Wrong scenarios in parallel | Check `baseTag` and `prerequisites` in `parallel-run-config.json` |
| `npm run cleanup` fails | Ensure `scripts/cleanup-test-data.js` is present (defined in `package.json`) |

---

## Related documentation

- **[AGENTS.md](../AGENTS.md)** — Architecture rules, tagging, and coding standards for this repo.
- **[slack-report.md](slack-report.md)** — Slack setup details.
