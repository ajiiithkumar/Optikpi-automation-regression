# Slack report after a test run

`scripts/slack-report.js` posts a **Block Kit** summary to a Slack channel using the **Slack Web API** (`chat.postMessage`). It does **not** use Incoming Webhooks.

## What it reads

| File | When it exists |
|------|----------------|
| **`reports/run-summary.json`** | Written by **`src/runner/runner.js`** after a **parallel** run (`npm run test:parallel`, `test:parallel:continue`, etc.). Contains pass/fail counts, duration, timestamp, and structured **failed scenario** entries. |

If that file is missing (for example you only ran serial `npm test` and never went through the group runner), the script still runs but uses a **fallback** summary (status `unknown`, zero counts, `duration: N/A`). For accurate Slack stats after parallel runs, ensure the runner completed and wrote the summary.

Counts in the summary are derived from the **merged Extent HTML** (`reports/extent/OptiKPI_V2.0_Smoke_Test.html`) where possible; failed scenarios are filled from the runner’s **rerun** file when the main run failed.

## Required environment variables

| Variable | Description |
|----------|-------------|
| **`SLACK_BOT_TOKEN`** | Bot User OAuth token (`xoxb-…`). Must allow **`chat:write`** (and access to the target channel — use **`chat:write.public`** if the bot is not a member of a public channel). |
| **`SLACK_CHANNEL_ID`** | Channel ID (e.g. `C0AC6AV2LEM`). Open channel details in Slack → copy ID at the bottom. |

If either is missing, the script **exits 0** and logs that it skipped — useful in CI when Slack is optional.

## Optional environment variables

| Variable | Description |
|----------|-------------|
| **`REPORT_URL`** | HTTPS link shown as a **View Report** button (hosted Extent artifact, internal portal, etc.). |
| **`RUN_LABEL`** | Short title for the run (default: **`CI Run`**). Shown in the message header. |

Local runs can rely on a **`.env`** file in the repo root; the script loads it via **`dotenv`** when present.

## How to run

```bash
# After tests (especially after parallel runner — summary file will be fresh)
npm run slack:report
```

Same as:

```bash
node scripts/slack-report.js
```

### When the parallel runner notifies Slack

If **`SLACK_BOT_TOKEN`** and **`SLACK_CHANNEL_ID`** are set in the environment, **`runner.js`** may invoke this script at the end of a group run (in addition to any explicit `npm run slack:report` step in CI). Align this with your GitHub Actions job (see below).

## Slack app setup (bot token)

1. Create a Slack app (api.slack.com) or use an existing one.
2. **OAuth & Permissions** → **Bot Token Scopes**: add **`chat:write`** (and **`chat:write.public`** if the bot will post without joining private channels).
3. **Install to Workspace** and copy the **Bot User OAuth Token** (`xoxb-…`).
4. Invite the bot to the channel (`/invite @YourBot`) **unless** you use `chat:write.public` on a public channel.
5. Store **`SLACK_BOT_TOKEN`** and **`SLACK_CHANNEL_ID`** in secrets or your shell — never commit them.

## What the message contains

- **Header:** `RUN_LABEL`, PASSED or FAILED, emoji.
- **Stats line:** total scenarios, passed, failed, duration, timestamp (no separate “skipped” line in the Slack text today).
- **Failed scenarios:** Up to **10** names (from `failedScenarios` in `run-summary.json`); if more, an “and N more” note.
- **View Report** button: only if **`REPORT_URL`** is set.

The script does **not** upload the HTML report file; it only posts the summary (and optional link). To upload files you would extend the script with Slack’s **`files.upload`** / **files.getUploadURLExternal** APIs.

## CI example (GitHub Actions)

Match the pattern used in `.github/workflows/playwright.yml`: run tests, then call the reporter with secrets.

```yaml
- name: Send Slack notification
  if: always() && env.SLACK_BOT_TOKEN != ''
  env:
    SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
    SLACK_CHANNEL_ID: ${{ secrets.SLACK_CHANNEL_ID }}
    REPORT_URL: ${{ steps.publish.outputs.url }}   # optional
    RUN_LABEL: "CI ${{ github.run_number }}"
  run: npm run slack:report
```

Ensure the job that runs **`npm run test:parallel`** (or **`test:parallel:continue`**) has finished so **`reports/run-summary.json`** exists before this step.

## Local examples

**PowerShell**

```powershell
$env:SLACK_BOT_TOKEN = "xoxb-your-token"
$env:SLACK_CHANNEL_ID = "C0AC6AV2LEM"
$env:RUN_LABEL = "Local smoke"
$env:REPORT_URL = "https://reports.example.com/last-run.html"  # optional
npm run slack:report
```

**cmd**

```cmd
set SLACK_BOT_TOKEN=xoxb-your-token
set SLACK_CHANNEL_ID=C0AC6AV2LEM
set RUN_LABEL=Local
npm run slack:report
```

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| “skipping” / exit 0, no message | `SLACK_BOT_TOKEN` or `SLACK_CHANNEL_ID` not set. |
| `not_in_channel` / `channel_not_found` | Bot not in channel, wrong ID, or missing `chat:write.public`. |
| Message shows 0 scenarios | `run-summary.json` missing or Extent HTML not parsed — run parallel runner to completion first. |
| `invalid_auth` | Revoked or wrong token; regenerate in Slack app settings. |

## See also

- [`PROJECT_DOCUMENTATION.md`](PROJECT_DOCUMENTATION.md) — Slack + runner overview.
- [`README.md`](../README.md) — CI secrets list.
