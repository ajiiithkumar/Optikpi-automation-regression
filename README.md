# OptiKPI V2.0 Smoke Test Automation

End-to-end smoke and regression test suite for the **OptiKPI V2.0** customer-engagement platform.
Tests are written in Gherkin (BDD) and executed with Cucumber.js + Playwright against a headless Chromium browser.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| TypeScript | All source code (pages, steps, hooks, utils) |
| Playwright 1.58+ | Browser automation (Chromium) |
| Cucumber.js v12 | BDD feature execution with Gherkin syntax |
| Extent Reports | HTML test reporting with screenshots |
| ts-node | TypeScript execution without precompilation |
| Node.js >= 20.17 | Runtime |

---

## Project Structure

```
features/                   # Gherkin feature files (one per module)
  audience.feature
  campaign.feature
  dashboard.feature
  settings.feature
  workflow.feature
config/
  cucumber.js               # Cucumber runner configuration
  parallel-run-config.json  # Parallel execution groups / prerequisites
src/
  pages/                    # Page Object Model classes
    base.page.ts
    audience.page.ts
    campaign.page.ts
    dashboard.page.ts
    login.page.ts
    workflow.page.ts
  components/
    navigation-bar.component.ts
    date-time-picker.component.ts
  steps/                    # Cucumber step definitions (one per module)
    audience.steps.ts
    campaign.steps.ts
    common.steps.ts
    dashboard.steps.ts
    settings.steps.ts
    workflow.steps.ts
  support/
    hooks.ts                # Before/After hooks (browser lifecycle, screenshots)
    world.ts                # PlaywrightWorld — custom Cucumber World class
    reporting/
      extent-adapter-wrapper.js   # Extent report formatter
  runner/
    runner.js               # Parallel execution orchestrator
  utils/
    helper.ts               # Shared utilities
    extent-test-manager.ts
    extent-manager.ts
    user-pool.ts            # Parallel user allocation with file locks
    casino-site-api.ts      # Casino API client for test data setup
scripts/
  slack-report.js           # Posts run summary to Slack after a run
data/
  names.json                # Runtime test data store (reset each run)
  users-config/
    users.json              # Test account credentials (not committed)
.env                        # Local environment variables (not committed)
reports/                    # Generated reports and screenshots (gitignored)
```

---

## Prerequisites

- Node.js >= 20.17
- npm >= 9

---

## Installation

```bash
npm install
npx playwright install chromium
```

This suite runs against **Chromium** only. On Linux CI or Docker you may need system dependencies as well:

```bash
npx playwright install --with-deps chromium
```

---

## Environment Setup

Create a `.env` file in the project root:

```env
BASE_URL=https://demo.optikpi.com/en
HEADLESS=true
RUN_LABEL=OptiKPI V2.0 Smoke Test
SLACK_BOT_TOKEN=xoxb-...
SLACK_CHANNEL_ID=C0XXXXXXXX
```

Create `data/users-config/users.json` with test account credentials.

**Shape must match what `user-pool.ts` reads:** a **`users` array**, not a bare list.

```json
{
  "users": [
    { "username": "user1@example.com", "password": "password1" },
    { "username": "user2@example.com", "password": "password2" }
  ]
}
```

If the file is a top-level array `[ ... ]`, you will see: *No users found … (expected `{ "users": [ ... ] }`.)*

---

## Running Tests

### Full parallel run (recommended)

```bash
npm run test:parallel:continue
```

Runs all `@Regression` scenarios using the groups defined in `config/parallel-run-config.json`. Continues on failure.

### Parallel run — stop on first failure

```bash
npm run test:parallel
```

### Run a single tag or scenario

Scenario IDs use **`@REG-<MODULE>-<NN>`** (e.g. `@REG-AUD-01`, `@REG-CAMP-18`, `@REG-DASH-01`).

```bash
npm run test:tag -- "@REG-AUD-01"
npm run test:tag -- "@Regression"
```

**No browser window?** If the tag matches **zero** scenarios, Cucumber exits immediately and the Playwright `Before` hook never runs — so nothing launches. Check the console for `0 scenarios`; fix the tag or list scenarios with:

```bash
npx cucumber-js -c config/cucumber.js --dry-run
```

### Serial run (single thread)

```bash
npm run test:serial
```

### Dry run (preview execution plan)

```bash
npm run test:parallel:dry-run
```

### Clean reports and locks

```bash
npm run clean
```

---

## Tagging Strategy

| Tag | Purpose |
|---|---|
| `@Regression` | All runnable scenarios — included in the main parallel run |
| `@TestPreparation` | Must run before parallel groups |
| `@ExistingAudience` | Creates a reusable published audience (prerequisite step) |
| `@REG-<MODULE>-<NN>` | Scenario identifier (reporting, `names.json` keys) |

---

## Parallel Execution

The runner uses `config/parallel-run-config.json`:

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

**Ordered mode** (current setup):
1. Prerequisites run **serially** first (e.g. `@ExistingAudience`)
2. Main run executes all `@Regression` scenarios in **parallel** (4 workers)

---

## Reports

After a run, the combined HTML report is at:

```
reports/extent/OptiKPI_V2.0_Smoke_Test.html
```

Screenshots of failed scenarios are saved to:

```
reports/screenshots/
```

---

## Slack Notifications

After a run, post a summary to Slack:

```bash
npm run slack:report
```

Reads `reports/run-summary.json` and posts a pass/fail summary with scenario counts and duration to the configured channel.

Required env vars: `SLACK_BOT_TOKEN`, `SLACK_CHANNEL_ID`

Optional: `REPORT_URL` (link to published report), `RUN_LABEL` (e.g. `Nightly`)

---

## CI/CD — GitHub Actions

The workflow is **manually triggered only** — it does not run on push or pull request.

### Trigger a run

**GitHub UI:**
1. Go to **Actions** → **OptiKPI Smoke Tests**
2. Click **Run workflow** → select branch `main` → **Run workflow**

**Slack (via GitHub app subscription):**
The `#bala-automation` channel is subscribed to `workflow_dispatch` notifications:
```
/github subscribe karthi2410/Optikpi-automation-smoke-test workflows:{event:"workflow_dispatch" branch:"main"}
```
Slack will notify the channel when a run starts and when it finishes.

### Required GitHub Secrets

Go to **Settings → Secrets and variables → Actions** and add:

| Secret | Description |
|---|---|
| `ENV_FILE` | Full contents of your `.env` file |
| `USERS_CONFIG_JSON` | Full contents of `data/users-config/users.json` |
| `SLACK_BOT_TOKEN` | Slack bot token (`xoxb-...`) |
| `SLACK_CHANNEL_ID` | Slack channel ID (e.g. `C0AC6AV2LEM`) |

### Artifacts

Test reports are uploaded as a GitHub Actions artifact (`test-reports`) and retained for 14 days.

---

## Test Data Cleanup

Preview what would be deleted:

```bash
npm run cleanup:dry-run
```

Delete test data created during runs:

```bash
npm run cleanup
```

---

## Architecture

- **Page Object Model** — all browser interactions go through page classes in `src/pages/`
- **BasePage** — shared Playwright helpers (`click`, `fill`, `getText`, `waitForVisible`, etc.)
- **PlaywrightWorld** — custom Cucumber World holds the browser page and shared state between steps
- **User pool** — `src/utils/user-pool.ts` allocates test accounts across parallel workers using file locks
- **names.json** — runtime test data store, reset to `{}` at the start of every run; each entry carries a `status` field (`"in progress"` → `"completed"`) so parallel readers can wait until the producing scenario has finished

---

## Test Data (`data/names.json`)

`names.json` is the shared runtime store for audience names, campaign names, and other titles created during a run.

### Status lifecycle

Every entry written by `saveNameEntry` / `saveNameEntries` starts as `"in progress"`. When the owning scenario passes, the `After` hook calls `markNameEntryCompleted`, flipping the status to `"completed"`.

```
saveNameEntries()          →  { title, timestamp, status: "in progress" }
After hook (PASSED)        →  { title, timestamp, status: "completed"   }
After hook (FAILED)        →  status stays "in progress"
```

### Reading in parallel scenarios

Steps that depend on data produced by a different parallel scenario use `waitForNameEntryCompleted(key)` from `src/utils/helper.ts`. It polls every 500 ms (up to 60 seconds) until the entry is `"completed"`, then returns the entry. This prevents race conditions where a reading step runs before the writing scenario has finished.

```typescript
// Instead of: const data = await readNameJson(); const title = data?.existingAudience?.title;
const entry = await waitForNameEntryCompleted('existingAudience');
// entry.title is guaranteed to belong to a fully-passed scenario
```

Steps affected: `select the audience from the list`, `a Published Audience exists`, `an Audience exists in the list`, `Enter the Campaign Name in the search bar`, and related campaign reading steps.
