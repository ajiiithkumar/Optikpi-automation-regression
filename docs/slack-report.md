# Slack report after a test run

`scripts/slack-report.js` posts a rich **Block Kit** summary to a Slack channel and uploads the **Extent HTML report** as a file attachment. It uses the official **`@slack/web-api`** SDK (`WebClient`) — not Incoming Webhooks, not raw `https` calls.

## What it reads

| File | Written by | Contents |
|------|------------|---------|
| **`reports/run-summary.json`** | `src/support/reporting/extent-adapter-wrapper.js` (every Cucumber run) | Pass/fail counts, duration, timestamp, failed scenario list |
| **`reports/extent/OptiKPI_V2.0_Smoke_Test.html`** | Extent formatter | Full HTML report — uploaded as a Slack file attachment |

`run-summary.json` is written at the end of every Cucumber run (serial, tag, or parallel) by the Extent formatter. If it is missing the script falls back to zero counts and `duration: N/A`.

## Required environment variables

| Variable | Description |
|----------|-------------|
| **`SLACK_BOT_TOKEN`** | Bot User OAuth token (`xoxb-…`). Must have **`chat:write`** and **`files:write`** scopes. Use **`chat:write.public`** if the bot is not a member of a public channel. |
| **`SLACK_CHANNEL_ID`** | Channel ID (e.g. `C0AC6AV2LEM`). Open channel details in Slack → copy ID at the bottom. |

If either is missing, the script **exits 0** and logs that it skipped — safe in CI when Slack is optional.

## Optional environment variables

| Variable | Description |
|----------|-------------|
| **`RUN_LABEL`** | Short title for the run (default: **`OptiKPI V2.0 Smoke Test`**). Shown in the message header. |

Local runs can rely on a **`.env`** file in the repo root; the script loads it via **`dotenv`** when present.

## How to run

```bash
# After any test run — summary file will be fresh
npm run slack:report
```

Same as:

```bash
node scripts/slack-report.js
```

## Slack app setup (bot token)

1. Create a Slack app (api.slack.com) or use an existing one.
2. **OAuth & Permissions** → **Bot Token Scopes**: add **`chat:write`**, **`chat:write.public`** (for public channels without joining), and **`files:write`** (for HTML report upload).
3. **Install to Workspace** and copy the **Bot User OAuth Token** (`xoxb-…`).
4. Invite the bot to the channel (`/invite @YourBot`) unless you use `chat:write.public`.
5. Store **`SLACK_BOT_TOKEN`** and **`SLACK_CHANNEL_ID`** in secrets or your shell — never commit them.

## What the message contains

**Summary message (Block Kit)**

- **Header:** run label + ✅/❌ emoji.
- **Status:** `ALL TESTS PASSED` or `SOME TESTS FAILED`.
- **Fields grid:** Total Scenarios | Passed ✅ | Failed ❌ | Duration ⏱ | Run Time ⏱.
- **Context line:** `Report generated at <timestamp>`.
- **Failed scenarios** (if any): up to 10 names listed; "and N more" note if there are more.

**File attachment**

- The Extent HTML report (`OptiKPI_V2.0_Smoke_Test.html`) is uploaded directly to Slack as an HTML file.
- Recipient clicks the attachment, downloads it, and opens it in any browser to see the full visual report with **inline failure screenshots**.

## CI example (GitHub Actions)

```yaml
- name: Upload test reports
  if: always()
  uses: actions/upload-artifact@v4.6.2
  with:
    name: test-reports
    path: reports/
    retention-days: 14

- name: Send Slack notification
  if: always() && env.SLACK_BOT_TOKEN != ''
  env:
    SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
    SLACK_CHANNEL_ID: ${{ secrets.SLACK_CHANNEL_ID }}
    RUN_LABEL: "OptiKPI V2.0 Smoke Test"
  run: npm run slack:report
```

## Local examples

**PowerShell**

```powershell
$env:SLACK_BOT_TOKEN = "xoxb-your-token"
$env:SLACK_CHANNEL_ID = "C0AC6AV2LEM"
$env:RUN_LABEL = "Local smoke"
npm run slack:report
```

**cmd**

```cmd
set SLACK_BOT_TOKEN=xoxb-your-token
set SLACK_CHANNEL_ID=C0AC6AV2LEM
set RUN_LABEL=Local
npm run slack:report
```

## Failure screenshots in the report

Screenshots are captured automatically on step failure by the Cucumber hooks (`src/support/hooks.ts`) and embedded directly into the Extent HTML report as base64 images. They are **not** sent as separate Slack messages. To see failure screenshots:

1. Click the HTML attachment in Slack.
2. Download and open it in a browser.
3. Expand any failed scenario — screenshots appear inline under the failed step.

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| "skipping" / exit 0, no message | `SLACK_BOT_TOKEN` or `SLACK_CHANNEL_ID` not set. |
| `not_in_channel` / `channel_not_found` | Bot not in channel, wrong ID, or missing `chat:write.public`. |
| Message shows 0 scenarios | `run-summary.json` missing — check that the Cucumber run completed and the Extent formatter ran. |
| `invalid_auth` | Revoked or wrong token; regenerate in Slack app settings. |
| HTML upload fails with `missing_scope` | Add `files:write` scope to the Slack app and reinstall. |

## See also

- [`PROJECT_DOCUMENTATION.md`](PROJECT_DOCUMENTATION.md) — Slack + runner overview.
- [`README.md`](../README.md) — CI secrets list.
