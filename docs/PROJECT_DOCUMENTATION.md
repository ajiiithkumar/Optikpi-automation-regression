# OptiKPI SmokeTest Automation - Project Documentation

## Technologies Used
- Node.js (JavaScript runtime for the test runner and scripts)
- Cucumber.js (`@cucumber/cucumber`) for BDD-style feature execution
- Playwright for browser automation
- Allure Report 3 for test reporting
- npm scripts for running tests and generating reports

## Project Structure (Key Paths)
- `features/` - `.feature` files (Gherkin scenarios)
- `src/step_definitions/` - step implementation code
- `src/support/` - Cucumber hooks, world setup, and report helpers
- `src/runner_class/` - test runner with cleanup and Allure 3 integration
- `src/pages/` - page selectors and locators
- `src/users/` - user pool, locks, and user-related artifacts
- `src/users/config/users.json` - user pool credentials
- `reports/allure-results/` - Allure test results (generated)
- `reports/allure-report/` - Allure HTML report (generated)
- `reports/json/` - Cucumber JSON output

## Execution Flow
The following diagram illustrates the end-to-end execution flow of the automation framework:

![Execution Flow](diagrams/execution_flow.png)

## BDD Workflow
Each test follows a structured BDD flow from feature files to browser automation:

![BDD Flow](diagrams/bdd_flow.png)

## How Parallel Running Works
Parallel execution is driven by Cucumber's `--parallel` option.
Each scenario runs in its own worker with a separate World instance.

![Parallel Architecture](diagrams/parallel_architecture.png)

Configured in `cucumber.js`:
```js
parallel: 4,
format: ['progress', 'json:reports/json/cucumber-report.json', 'allure-cucumberjs/reporter'],
formatOptions: { resultsDir: 'reports/allure-results' }
```

Run in parallel (default):
```powershell
npm test
```

Override the parallel level:
```powershell
npm test -- --parallel 2
```

Run serially:
```powershell
npm run test:serial
```

## NPM Scripts Reference

| Script | Description |
|--------|-------------|
| `npm test` | Run tests with cleanup and Allure 3 report (4 parallel workers) |
| `npm run test:serial` | Run tests serially (1 worker) |
| `npm run test:direct` | Run tests directly via `allure run` (no extra cleanup) |
| `npm run test:screenshots` | Run tests with all screenshots enabled |
| `npm run clean` | Remove `allure-results` and `allure-report` folders |
| `npm run allure:generate` | Generate Allure HTML report |
| `npm run allure:open` | Open existing Allure report |
| `npm run allure:report` | Generate and open Allure report |

## User Pool (Concurrency-Safe Logins)
Because multiple workers run in parallel, the project uses a user pool with file locks.
Each scenario acquires a unique user and releases it after the scenario.

Users live in `src/users/config/users.json`:
```json
{
  "users": [
    { "username": "user1@example.com", "password": "secret1" },
    { "username": "user2@example.com", "password": "secret2" }
  ]
}
```

Example usage (from `src/step_definitions/common.steps.js`):
```js
const { acquireUser, releaseLock } = require('../users/userPool');

const { user, lockFile } = await acquireUser({ timeoutMs: 120000 });
// ... use user credentials in the scenario ...
releaseLock(lockFile);
```

Lock files are stored under `src/users/.user-locks/` to prevent two workers from using the same user.

## Auth Cache (Storage State)
To reduce repeated logins, storage state is cached per user under `src/support/user/auth/`.
If a cache exists, it is reused; otherwise a fresh login is performed and cached.

Example (from `src/step_definitions/common.steps.js`):
```js
const storagePath = path.join(process.cwd(), 'src', 'support', 'user', 'auth', `${username}.json`);
if (fs.existsSync(storagePath)) {
  contextOptions.storageState = storagePath;
}

const didLogin = await loginIfNeeded(page, selectors, username, password);
if (didLogin || !fs.existsSync(storagePath)) {
  await context.storageState({ path: storagePath });
}
```

## Failure Capture (Screenshots + Attachments)
On step failure, a screenshot is captured and attached to the Allure report.

Example (from `src/support/hooks.js`):
```js
AfterStep(async function ({ result, pickleStep }) {
  if (result?.status !== Status.FAILED) return;
  const label = `${pickleStep?.text || 'step'} - ${result?.status || 'unknown'}`;
  await report.captureScreenshot(this, { label, writeToDisk: true });
});
```

## Reporting (Allure 3)
The project uses **Allure Report 3** with the Allure CLI to generate a single-file report.

When running `npm test` (via `src/runner_class/runner.js`):
1. Cleanup runs (reports/allure-results, reports/allure-report, legacy allure-report, screenshots, user locks)
2. Tests execute with `npx cucumber-js` using `config/cucumber.js`
3. Report is generated with `npx allure awesome --single-file`
4. Report opens in browser

Report output:
- JSON: `reports/json/cucumber-report.json`
- Allure: `reports/allure-report/index.html`

- Allure: `reports/allure-report/index.html`

## CI/CD Integration
The framework is designed to integrate seamlessly into CI/CD pipelines:

![CI/CD Pipeline](diagrams/cicd_pipeline.png)

---

## Setup Process

### Prerequisites
- **Node.js**: Version 20.17.0 or higher (or Node.js 22.9.0+)
- **npm**: Comes with Node.js
- **Java**: Required for Allure CLI (JRE 8+)

### Step 1: Clone the Repository
```powershell
git clone <repository-url>
cd OptiKPI_V2.0_SmokeTest_Automation
```

### Step 2: Install Dependencies
```powershell
npm install
```

### Step 3: Install Playwright Browsers
```powershell
npx playwright install
```

### Step 4: Configure User Pool
Create or update `src/users/config/users.json` with your test credentials:
```json
{
  "users": [
    { "username": "testuser1@example.com", "password": "password1" },
    { "username": "testuser2@example.com", "password": "password2" }
  ]
}
```

> [!IMPORTANT]
> Add at least as many users as your parallel worker count (default: 4) for optimal parallel execution.

### Step 5: Run Tests
```powershell
# Run tests with default settings (4 parallel workers)
npm test

# Run tests serially
npm run test:serial

# Run with custom parallel count
npm test -- --parallel 2

# Run with screenshots on every step
npm run test:screenshots
```

### Step 6: View Reports
After test execution, the Allure report opens automatically in your browser.

To reopen an existing report:
```powershell
npm run allure:open
```

### Troubleshooting

| Issue | Solution |
|-------|----------|
| `allure` command not found | Ensure Java is installed and `npm install` completed successfully |
| Tests failing to acquire user | Add more users to `config/users.json` or reduce parallel count |
| Browser not launching | Run `npx playwright install` to install browsers |
| Stale auth cache | Delete `src/support/user/auth/` to clear cached data |
