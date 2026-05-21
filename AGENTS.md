# AGENTS.md — OptiKPI V2.0 Smoke Test Automation

This file provides context for AI assistants working on this codebase.

## Project Overview

End-to-end smoke and regression test suite for the **OptiKPI V2.0** customer-engagement platform.
Tests are written in Gherkin (BDD) and executed with Cucumber.js + Playwright against a headless
Chromium browser. The suite covers the five core modules: **Audience**, **Campaign**, **Dashboard**,
**Settings**, and **Workflow**.

## Tech Stack

| Technology        | Purpose                                      |
|-------------------|----------------------------------------------|
| TypeScript        | All source code (pages, steps, hooks, utils) |
| Playwright 1.58+  | Browser automation (Chromium)                |
| Cucumber.js v12   | BDD feature execution with Gherkin syntax    |
| Extent Reports    | HTML test reporting with screenshots         |
| ts-node           | TypeScript execution without precompilation  |
| Node.js >= 20.17  | Runtime                                      |
| runner.js         | Orchestrates grouped parallel test execution |

## Directory Structure

```
features/               # Gherkin feature files (one per module)
  audience.feature
  campaign.feature
  dashboard.feature
  settings.feature
  workflow.feature
config/
  cucumber.js           # Cucumber runner configuration
  parallel-run-config.json
runner.js               # Parallel execution orchestrator (spawns Cucumber workers)
src/
  pages/                # Page Object Model classes
    base.page.ts        # Base class — all pages extend this
    audience.page.ts
    campaign.page.ts
    dashboard.page.ts
    login.page.ts
    workflow.page.ts
    components/
      navigation-bar.component.ts
      date-time-picker.component.ts
  steps/                # Cucumber step definitions (one per module)
    audience.steps.ts
    campaign.steps.ts
    common.steps.ts
    dashboard.steps.ts
    settings.steps.ts
    workflow.steps.ts
  support/
    hooks.ts            # Before/After hooks (browser lifecycle, screenshots, names.json status)
    world.ts            # PlaywrightWorld — custom Cucumber World class
  reporting/            # Extent report adapter and templates
  utils/
    helper.ts           # Shared utilities (saveNameEntry, saveNameEntries, waitForNameEntryCompleted, markNameEntryCompleted, readNameJson, withFileLock, etc.)
    extent-test-manager.ts
    extent-manager.ts
    user-pool.ts        # Parallel user allocation with file locks
    casino-site-api.ts  # Casino API client for test data setup
data/
  names.json            # Runtime test data store (reset each run)
  users-config/users.json  # Test account credentials
reports/                # Generated reports and screenshots (gitignored)
```

## Common Commands

```bash
npm install                        # Install dependencies
npm test                           # Run all features serially (cleans reports first)
npm run test:tag -- "@Regression"   # Run scenarios matching a tag expression
npm run test:tag -- "@REG-AUD-01"   # Run a single scenario by its ID tag (Audience uses REG-AUD-*)
npm run test:parallel              # Run grouped parallel execution via runner.js
npm run test:parallel:continue     # Parallel run — continue on failures
npm run clean                      # Delete reports, screenshots, lock files
npm run cleanup                    # Clean up test data created during runs
npm run cleanup:dry-run            # Preview cleanup without deleting
```

> **Tip:** You can also invoke `node runner.js` directly to bypass npm scripts and pass raw
> arguments to the parallel orchestrator.

## Architecture Rules

### Page Object Model (POM)

Every browser interaction MUST go through a Page Object class.

- All page classes extend `BasePage` (`src/pages/base.page.ts`).
- Selectors live in a single `private readonly sel` object — never exposed publicly.
- Use `BasePage` helpers (`click`, `fill`, `getText`, `isVisible`, `waitForVisible`). These helpers
  wrap Playwright's raw locator API with built-in waits and error normalisation — do not call
  `page.locator(...)` directly unless a helper is genuinely insufficient for the use case.
- Step definitions instantiate page objects via a helper function: `const getPage = (world) => new PageClass(world.page)`.

Page class template:

```typescript
import { BasePage } from './base.page';

export class ModulePage extends BasePage {
    private readonly sel = {
        // Tabs
        activeTab: "//button[@data-test-id='module-tab-active']",
        // Actions
        createBtn: "//button[@data-testid='module-create-btn']",
    };

    async clickActiveTab() {
        await this.click(this.sel.activeTab);
    }
}
```

Method naming: `clickX`, `fillX`, `verifyX`, `isXVisible`, `getXText`, `waitForX`.

### Selector Priority

1. `@data-testid` — most stable
2. `@data-test-id` — alternate convention
3. `normalize-space()` text match — for buttons/links
4. Combination with `or` fallback — for resilience: `//button[@data-testid='save-btn' or normalize-space()='Save']`
5. Class-based selectors — last resort, most fragile

This project standardises on **XPath**, not CSS selectors.

### Step Definitions

- One step file per module: `audience.steps.ts`, `campaign.steps.ts`, etc.
- Steps MUST NOT contain raw selectors — delegate all locator logic to page objects.
- Always type `this` as `PlaywrightWorld` in every step function.
- Always call `ExtentTestManager.logPass(...)` at the end of a passing step.
- Use `throw new Error(...)` for failures — the hook captures screenshots automatically.
- Store shared state on `this['key']` (the Cucumber World) — not in module-level variables.
- Import the appropriate Cucumber keyword binding (`Given`, `When`, `Then`, `And`) that matches the
  Gherkin keyword used in the feature file; do not use a mismatched binding (e.g. `Then` for a
  `Given` step).

Step template:

```typescript
import { Given, When, Then } from '@cucumber/cucumber';
import { ModulePage } from '../pages/module.page';
import { ExtentTestManager } from '../utils/extent-test-manager';
import { PlaywrightWorld } from '../support/world';

const getModulePage = (world: PlaywrightWorld) => new ModulePage(world.page);

Then('Step description here', async function (this: PlaywrightWorld) {
    await getModulePage(this).doSomething();
    ExtentTestManager.logPass('What passed');
});
```

#### World State Keys

| Key                       | Set by                   | Used by                           |
|---------------------------|--------------------------|-----------------------------------|
| `currentAudienceTitle`    | Audience creation steps  | Filter/search/verify steps        |
| `currentCampaignName`     | Campaign creation steps  | Search/verify steps               |
| `currentWorkflowName`     | Workflow creation steps  | Search/verify steps               |
| `existingAudienceTitle`   | Precondition steps       | Part-of-audience, campaign steps  |
| `selectedAudienceName`    | Audience selection steps | Verification steps                |
| `duplicatedAudienceTitle` | Duplicate steps          | Filter steps                      |
| `updatedCampaignName`     | Edit name steps          | Search/verify steps               |
| `scenarioTag`             | Hooks (Before)           | Tag-based save steps; last `@REG-CAMP-*` when audience/module ID tag absent |
| `scenarioTags`            | Hooks (Before)           | Tag-based conditional logic       |
| `campaignNamesJsonKey`    | Hooks (Before)           | First `@REG-CAMP-*` on scenario — `names.json` lookup key for campaign reads (use with second tag for dependency, e.g. `@REG-CAMP-01 @REG-CAMP-18`) |

### Feature Files

- One feature file per module in `features/`.
- Smoke tests appear first, regression scenarios below a comment separator.
- Do not create new feature files for existing modules — add scenarios to the existing module feature file.
- Steps must match existing step definitions exactly (case-sensitive). Check `src/steps/*.ts` before writing new step text.
- Smoke test steps use lowercase verbs: `click the Set Goal button`. Regression steps may use title case. Do not mix styles within a single scenario.

Feature file structure:

```gherkin
Feature: Module name

  @Regression @REG-MODULE-01
  Scenario: Regression test scenario
    ...

  # ─────────────────────────────────────────────
  # REGRESSION
  # ─────────────────────────────────────────────

  @Regression @Module @REG-MODULE-01
  Scenario: Regression test scenario
    ...
```

#### Tagging Strategy

| Tag                  | Purpose                                      |
|----------------------|----------------------------------------------|
| `@Regression`        | All runnable scenarios — main parallel run   |
| `@TestPreparation`   | Must run before parallel groups              |
| `@ExistingAudience`  | Creates a reusable published audience        |
| `@REG-<MODULE>-<NN>` | Scenario identifier (reporting, names.json)  |

### Test Data (`names.json`)

- Use `saveNameEntry(type, title)` or `saveNameEntries([...])` to persist test data.
- Every entry is written with `status: "in progress"` automatically.
- Use `waitForNameEntryCompleted(key)` to read an entry — it polls every 500 ms until the entry's status is `"completed"`, then returns `{ title, timestamp }`. Default timeout: 60 seconds.
- Do **not** call `readNameJson()` directly in steps that depend on data produced by another parallel scenario — use `waitForNameEntryCompleted` instead.
- Use `readNameJson()` or `getNameEntry(type)` only for reads that do not depend on a parallel writer.
- Built-in file locking via `withFileLock` (exported from `src/utils/helper.ts`) for safe concurrent access in parallel runs.
- Reset to `{}` at startup — do not rely on data persisting across runs.
- Valid keys: `'audience'`, `'campaign'`, `'workflow'`, `'existingAudience'`, or scenario tag strings like `'REG-AUD-05'`.
- **Campaign dependency scenarios:** list the producer tag first, then the scenario tag, e.g. `@REG-CAMP-01 @REG-CAMP-18`. The `Before` hook sets `campaignNamesJsonKey` to the first `REG-CAMP-*` (for `waitForNameEntryCompleted` / `readNameJson`) and `scenarioTag` to the last (scenario id, `saveNameEntry`, and `markNameEntryCompleted`).

#### Status lifecycle

```
saveNameEntries / saveNameEntry   →   status: "in progress"
After hook (scenario PASSED)      →   status: "completed"   (via markNameEntryCompleted)
After hook (scenario FAILED)      →   status stays "in progress"
```

The `After` hook automatically marks the following keys as `"completed"` when a scenario passes:
- The scenario's own tag key (e.g. `REG-AUD-08`)
- `existingAudience` + `audience` when the `@ExistingAudience` tag is present
- `campaign` when the scenario tag matches `REG-CAMP-*`

## Coding Standards

- **TypeScript**: Target ES2019, module CommonJS, `strict: false`. Even though strict mode is off,
  all function parameters and return types must still be annotated explicitly — do not rely on
  implicit `any`.
- **Async/await** for all Playwright interactions — never `.then()` chains.
- **`const`** over `let`; never `var`.
- **Error handling**: use `catch(() => false)` for optional checks; retry loops for flaky actions; never swallow errors silently.

```typescript
// GOOD — graceful fallback
const visible = await btn.isVisible({ timeout: 5000 }).catch(() => false);

// GOOD — retry pattern
for (let attempt = 0; attempt < 3; attempt++) {
    try { /* action */ break; }
    catch { if (attempt < 2) await this.pause(1000); }
}

// BAD — swallowing errors silently
try { await action(); } catch {}
```

- **Waits**: use `waitFor({ state: 'visible' })` or `BasePage.waitForVisible()` — not arbitrary `pause()` calls. `pause(ms)` is acceptable only after actions with no reliable wait signal.
- **Default step timeout**: 120 seconds (set in `world.ts`).

## Fix Requirements

Every bug fix must:

0. Identify the root cause — understand *why* the test fails before writing any code.
1. Reproduce the bug (the test would have failed before the fix).
2. Confirm the fix works as expected.
3. Not break existing passing tests.
4. Be verified by running the affected scenarios.

## What NOT to Do

- Do not add raw `page.locator(...)` calls in step definition files — use page objects.
- Do not hardcode credentials, API keys, or secrets anywhere in the codebase.
- Do not commit TypeScript errors or linter errors.
- Do not create utility functions that duplicate existing `BasePage` or `helper.ts` utilities.
- Do not use `page.waitForTimeout()` in page objects — use `this.pause()` from `BasePage`.
- Do not store test state in module-level variables — use `this['key']` on the Cucumber World.
- Do not call `saveNameEntry` multiple times in sequence for the same scenario — use `saveNameEntries` for atomic batch writes.
- Do not add `console.log` for normal flow — use `ExtentTestManager.logPass/logInfo` so it appears in the report.
- Do not create new feature files for existing modules — add scenarios to the existing module feature file.
- Do not skip `@Regression` tags on scenarios — the runner uses them for execution grouping.
- Do not use a mismatched Cucumber keyword binding (e.g. importing `Then` for a step that is written as `Given` in the feature file).
- Do not add `pause()` calls longer than 2 000 ms without an inline comment explaining why no reliable wait signal exists.
- Do not call `readNameJson()` in steps that depend on data written by another parallel scenario — use `waitForNameEntryCompleted(key)` to block until the writing scenario has completed and the entry is marked `"completed"`.
