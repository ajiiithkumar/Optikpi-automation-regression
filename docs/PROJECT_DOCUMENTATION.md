# OptiKPI V2.0 Smoke Test Automation — Project Documentation

## Technologies Used

| Technology | Purpose |
|-----------|---------|
| **TypeScript** | Primary language for all page objects, step definitions, hooks, and utilities |
| **Playwright** | Browser automation (Chromium) |
| **Cucumber.js** (`@cucumber/cucumber` v12) | BDD-style feature execution with Gherkin syntax |
| **Extent Reports** (`cucumber-js-extent`) | HTML test reporting with screenshots and step logs |
| **ts-node** | TypeScript execution without precompilation |
| **Docker** | Containerised headless test execution |
| **cross-env** | Cross-platform environment variable injection |
| **rimraf** | Cross-platform directory cleanup |
| **Node.js** ≥ 20.17 | JavaScript runtime |

---

## Project Structure

```
OptiKPI_V2.0_SmokeTest_Automation/
├── config/
│   ├── cucumber.js                  # Cucumber configuration (paths, formats, parallel)
│   └── parallel-run-config.json     # Group-based parallel runner settings
├── data/
│   ├── users-config/users.json      # User pool credentials
│   ├── users.csv                    # Raw user credentials CSV
│   ├── names.json                   # Shared test-data names (audience/campaign/workflow)
│   ├── auth/                        # Cached auth storage state per user (generated)
│   └── .user-locks/                 # File-based locks for concurrency (generated)
├── features/
│   ├── audience.feature             # Audience module scenarios (5 scenarios)
│   ├── campaign.feature             # Campaign module scenarios (3 scenarios)
│   ├── dashboard.feature            # Dashboard module scenarios (2 scenarios)
│   ├── settings.feature             # Settings module scenarios (1 scenario)
│   └── workflow.feature             # Workflow module scenarios (2 scenarios)
├── src/
│   ├── pages/                       # Page Object Model classes
│   │   ├── base.page.ts             # BasePage — shared Playwright helpers
│   │   ├── login.page.ts            # Login page selectors & actions
│   │   ├── dashboard.page.ts        # Dashboard page selectors & actions
│   │   ├── audience.page.ts         # Audience page selectors & actions
│   │   ├── campaign.page.ts         # Campaign page selectors & actions
│   │   ├── workflow.page.ts         # Workflow page selectors & actions
│   │   └── components/              # Reusable UI component page objects
│   │       ├── navigation-bar.component.ts
│   │       └── date-time-picker.component.ts
│   ├── steps/                       # Cucumber step definitions (TypeScript)
│   │   ├── common.steps.ts          # Login, navigation, shared steps
│   │   ├── audience.steps.ts        # Audience-specific steps
│   │   ├── campaign.steps.ts        # Campaign-specific steps
│   │   ├── dashboard.steps.ts       # Dashboard-specific steps
│   │   └── workflow.steps.ts        # Workflow-specific steps
│   ├── support/
│   │   ├── world.ts                 # PlaywrightWorld — custom Cucumber World class
│   │   ├── hooks.ts                 # Before/After/AfterStep hooks
│   │   └── reporting/               # Extent report adapter & templates
│   │       ├── extent-adapter.ts
│   │       ├── extent-adapter-wrapper.ts
│   │       └── templates/           # Custom Nunjucks templates for Extent
│   ├── utils/
│   │   ├── helper.ts                # Screenshot capture, logging, test-data helpers
│   │   ├── user-pool.ts             # Concurrency-safe user pool with file locking
│   │   ├── extent-manager.ts        # Extent Report manager singleton
│   │   └── extent-test-manager.ts   # Per-scenario Extent test context
│   └── runner/
│       └── runner.js                # Smart parallel group runner with Extent merging
├── scripts/
│   ├── slack-report.js              # Post test summary + report to Slack
│   ├── open-extent-report.js        # Open generated Extent report in browser
│   └── docker-diag.js               # Docker environment diagnostics
├── reports/
│   ├── extent/                      # Generated Extent HTML report
│   ├── screenshots/                 # Step & scenario screenshots (generated)
│   └── json/                        # Cucumber JSON output (generated)
├── Dockerfile                       # Containerised test runner image
├── docker-compose.yml               # Docker Compose service definition
├── extent-config.json               # Extent report theme & metadata
├── tsconfig.json                    # TypeScript compiler configuration
└── package.json                     # Dependencies & npm scripts
```

---

## Smoke Test Coverage

| Module | Scenarios | What's Validated |
|--------|:---------:|-----------------|
| **Dashboard** | 2 | KPI widgets load, date filters update data, Business Performance / Marketing / Notification tabs |
| **Audience** | 5 | Page load, tab switching (Live, On Schedule, Static), card/list views, full CRUD (create → criteria → preview → draft → re-enter → publish), tooltip verification, and test preparation |
| **Campaign** | 3 | Page load & tab switching (Active, Completed, Draft, All), create campaign with new audience, and create campaign with existing audience |
| **Workflow** | 2 | Page load & tab switching (Active, Inactive, Draft, All), full workflow creation (enrollment → action node → exit node → publish) |
| **Settings** | 1 | Page load verification |

---

## Architecture Overview

### Page Object Model (POM)

All browser interactions follow the **Page Object Model** pattern:

```
BasePage  (src/pages/base.page.ts)
  ├── LoginPage
  ├── DashboardPage
  ├── AudiencePage
  ├── CampaignPage
  ├── WorkflowPage
  └── components/
      ├── NavigationBarComponent
      └── DateTimePickerComponent
```

`BasePage` provides common Playwright helpers used by every page class:

| Method | Purpose |
|--------|---------|
| `click(selector)` | Wait → click → 3 s settle |
| `forceClick(selector)` | Wait → force-click (overlapping elements) |
| `fill(selector, value)` | Wait → clear → type |
| `getText(selector)` | Wait → return `innerText` |
| `getInputValue(selector)` | Wait → return input value |
| `isVisible(selector)` | Returns `true`/`false` within timeout |
| `waitForVisible(selector)` | Wait until visible |
| `pause(ms)` | Fixed delay (use sparingly) |
| `waitForNetworkIdle()` | Wait for network to settle |

Each page class extends `BasePage`:
```typescript
export class AudiencePage extends BasePage {
    // Selectors (private static readonly)
    // Action methods that compose BasePage helpers
}
```

---

### Custom World — `PlaywrightWorld`

Defined in `src/support/world.ts`. Extends Cucumber's `World` with:

| Property | Type | Purpose |
|----------|------|---------|
| `browser` | `Browser` | Shared Chromium instance |
| `context` | `BrowserContext` | Per-scenario browser context |
| `page` | `Page` | Active page instance |
| `user` | `any` | Acquired user credentials |
| `userLockFile` | `string` | Path to current user lock file |

Default step timeout: **120 seconds**.

---

### Cucumber Hooks Lifecycle

```
Before  →  Each scenario
├── Set Extent test context
├── Launch shared browser (once)
└── Assign browser reference

AfterStep  →  After each step
├── FAILED  → Capture screenshot (disk + report)
└── PASSED  → Capture screenshot (report only)

After  →  After each scenario
├── Capture final scenario screenshot
├── Close page & context
├── Release user lock
└── Clear Extent test context

AfterAll  →  After all scenarios
└── Close shared browser
```

---

## Test Execution

### NPM Scripts

| Script | Description |
|--------|-------------|
| `npm test` | Clean → run tests serially (1 worker) with Extent report |
| `npm run test:serial` | Explicitly serial execution (`PARALLEL_THREADS=1`) |
| `npm run test:screenshots` | Run with all step & scenario screenshots enabled |
| `npm run test:parallel` | Group-based parallel runner with prerequisite support |
| `npm run test:parallel:continue` | Parallel groups, continue on group failure |
| `npm run test:parallel:dry-run` | Parallel groups, dry-run mode |
| `npm run test:extent` | Alias for serial test run |
| `npm run clean` | Remove reports, screenshots, user locks, and auth cache |
| `npm run slack:report` | Send test summary + report link to Slack |

### Basic Execution

```powershell
# Run all tests (serial, single worker)
npm test

# Run serially (explicit)
npm run test:serial
```

### Parallel Execution (Group Runner)

The smart group runner (`src/runner/runner.js`) supports **prerequisite-aware parallel execution**:

```powershell
# Run groups in parallel (default: 3 threads)
npm run test:parallel

# Continue even if a group fails
npm run test:parallel:continue

# Dry run (validate without executing)
npm run test:parallel:dry-run
```

Configured in `config/parallel-run-config.json`:
```json
{
    "failFast": false,
    "parallel": 3,
    "prerequisites": [
        {
            "tag": "@TestPreparation",
            "name": "Audience Creation"
        }
    ]
}
```

**How it works:**
1. **Clean** — removes reports, screenshots, locks, and auth cache
2. **Prerequisites** — runs scenarios tagged `@TestPreparation` first (serially)
3. **Parallel groups** — runs remaining `@SmokeTest` scenarios in parallel batches
4. **Report merge** — merges per-group Extent HTML reports into a single report
5. **Slack notification** — optionally sends results to Slack

---

## Reporting — Extent Reports

The project uses **Extent Reports** via the `cucumber-js-extent` adapter.

### Report Generation Flow
1. Cucumber runs scenarios using the custom Extent adapter wrapper (`src/support/reporting/extent-adapter-wrapper.ts`)
2. Step results, screenshots, and logs are attached in real time
3. A single HTML report is generated at `reports/extent/OptiKPI_V2.0_Smoke_Test.html`
4. The `postinstall` script patches the Extent template for inline text + image popups

### Report Configuration (`extent-config.json`)
```json
{
  "documentTitle": "Optikpi V2.0 Smoke Test",
  "reportName": "Optikpi V2.0 Smoke Test",
  "theme": "standard",
  "encoding": "utf-8",
  "timelineEnabled": true
}
```

### Screenshots

| Trigger | Saved to Disk | Attached to Report |
|---------|:---:|:---:|
| Step failure | ✅ | ✅ |
| Step pass | ❌ | ✅ |
| Scenario end (configurable) | ❌ | ✅ |

Screenshot behaviour is controlled via environment variables:

| Variable | Values | Default |
|----------|--------|---------|
| `STEP_SCREENSHOTS` | `always`, `never` | Failed only |
| `SCENARIO_SCREENSHOTS` | `always`, `failed`, `never` | `always` |

---

## User Pool (Concurrency-Safe Logins)

Because multiple workers may run in parallel, the project uses a **file-lock-based user pool** (`src/utils/user-pool.ts`).

### How It Works
1. Users are defined in `data/users-config/users.json`
2. Each scenario calls `acquireUser()` which polls for an unlocked user
3. A `.lock` file is created atomically (`wx` flag) in `data/.user-locks/`
4. After the scenario, `releaseLock()` deletes the lock file in the `After` hook
5. Auth state is cached per user in `data/auth/<username>.json` to skip repeated logins

### User Configuration (`data/users-config/users.json`)
```json
{
  "users": [
    { "username": "user1@example.com", "password": "secret1" },
    { "username": "user2@example.com", "password": "secret2" }
  ]
}
```

> [!IMPORTANT]
> Add at least as many users as your parallel worker count for optimal parallel execution.

### Usage in Steps
```typescript
import { acquireUser, releaseLock } from '../utils/user-pool';

// In a step definition:
const { user, lockFile } = await acquireUser({ timeoutMs: 60000 });
// ... use user.username, user.password, user.authFile
// Lock is released automatically in the After hook
```

---

## Test Data Management

Shared test data lives in `data/names.json` and is managed via helpers in `src/utils/helper.ts`:

| Function | Purpose |
|----------|---------|
| `saveNameEntry(type, title)` | Persist an audience/campaign/workflow name |
| `getNameEntry(type)` | Retrieve the saved name for a type |
| `generateAudienceTitle()` | Generate a unique audience title |
| `readUsersCsv()` | Read user IDs from `data/users.csv` |
| `captureScreenshot(world, opts)` | Capture and attach a screenshot |
| `logInfo / logPass / logFail` | Attach labelled log entries to Extent report |

---

## Feature Files & Tags

| Feature | Tag Prefix | Scenarios | Description |
|---------|-----------|:---------:|-------------|
| `audience.feature` | `@ST-AUD-` | 5 | Page load, views, static/schedule audience CRUD |
| `campaign.feature` | `@ST-CAMP-` | 3 | Page load, create campaigns with new/existing audiences |
| `dashboard.feature` | `@ST-DASH-` | 2 | Page load, KPI widgets, filter interaction |
| `settings.feature` | `@ST-SET-` | 1 | Page load verification |
| `workflow.feature` | `@ST-Workflow-` | 2 | Page load, full workflow creation & publish |

**Special tag:** `@TestPreparation` — marks prerequisite scenarios that must run before parallel groups.

---

## Slack Integration

The Slack notification script (`scripts/slack-report.js`) supports two modes:

| Mode | Token/URL | Sends Message | Uploads Report |
|------|-----------|:---:|:---:|
| **Web API** | `SLACK_BOT_TOKEN` | ✅ | ✅ |
| **Webhook** | `SLACK_WEBHOOK_URL` | ✅ | ❌ |

### Environment Variables
| Variable | Required | Description |
|----------|:---:|-------------|
| `SLACK_BOT_TOKEN` | One of these | Bot OAuth token (Web API mode) |
| `SLACK_WEBHOOK_URL` | is required | Incoming webhook URL |
| `SLACK_CHANNEL_ID` | For Web API | Channel to post to |
| `REPORT_URL` | No | Public URL to the hosted report |
| `RUN_LABEL` | No | Custom label for the test run |

```powershell
npm run slack:report
```

The script parses the Extent HTML report for pass/fail metrics and sends a formatted Slack Block Kit message.

For detailed setup instructions, see [slack-report.md](slack-report.md).

---

## Docker Support

### Dockerfile
- Base image: `mcr.microsoft.com/playwright:v1.52.0-noble`
- Installs Chromium via Playwright
- Forces headless mode (`HEADLESS=true`)
- Timezone: `Asia/Kolkata`

### Running in Docker

```powershell
# Build and run with Docker Compose
docker compose up --build

# Run serially
docker compose run tests npm run test:serial

# Override parallel thread count
docker compose run -e PARALLEL_THREADS=4 tests npm test

# Run with dry-run
docker compose run tests npm test -- --dry-run
```

### Docker Compose (`docker-compose.yml`)
- Mounts `./reports` to extract test reports to the host
- Mounts `./data` to share credentials and user data
- Default: `PARALLEL_THREADS=4`, `HEADLESS=true`

---

## Cucumber Configuration (`config/cucumber.js`)

```js
module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    requireModule: ['ts-node/register'],
    require: [
      'src/steps/**/*.ts',
      'src/support/**/*.ts',
      'src/utils/**/*.ts'
    ],
    format: [
      'progress',
      './src/support/reporting/extent-adapter-wrapper.ts:<report-path>'
    ],
    publishQuiet: true,
    parallel: PARALLEL_THREAD_COUNT,  // Default: 1, overridden via PARALLEL_THREADS env
    worldParameters: { headless: false }
  }
};
```

---

## Setup Guide

### Prerequisites
- **Node.js** ≥ 20.17.0 (or 22.9.0+)
- **npm** (comes with Node.js)

### Step 1: Clone & Install
```powershell
git clone <repository-url>
cd OptiKPI_V2.0_SmokeTest_Automation
npm install
```

### Step 2: Install Playwright Browsers
```powershell
npx playwright install
```

### Step 3: Configure User Pool
Create or update `data/users-config/users.json`:
```json
{
  "users": [
    { "username": "testuser1@example.com", "password": "password1" },
    { "username": "testuser2@example.com", "password": "password2" }
  ]
}
```

### Step 4: Run Tests
```powershell
# Serial (default)
npm test

# Parallel with group runner
npm run test:parallel

# With all screenshots
npm run test:screenshots
```

### Step 5: View Reports
After test execution, open the Extent report:
```powershell
reports/extent/OptiKPI_V2.0_Smoke_Test.html
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Tests fail to acquire user | Add more users to `data/users-config/users.json` or reduce parallel count |
| Browser not launching | Run `npx playwright install` to install browsers |
| Stale auth cache | Delete `data/auth/` to clear cached login state |
| Lock files not cleaned up | Run `npm run clean` or delete `data/.user-locks/` manually |
| Extent report not generated | Ensure `cucumber-js-extent` is installed and `postinstall` script ran |
| Docker: browser crash | Ensure `HEADLESS=true` and sufficient container memory |
| Parallel group runner hangs | Check `config/parallel-run-config.json` for correct tag names |
