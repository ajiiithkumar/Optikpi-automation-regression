# Sending the Report to Slack After Run

## Possibilities

| Option | What is sent | How |
|--------|----------------|-----|
| **1. Summary only** | Pass/fail/skip counts, duration, optional failed scenario names | Incoming Webhook (no token). Use `scripts/slack-report.js`. |
| **2. Summary + report link** | Same as above + link to hosted report (Allure/Extent) | Set `REPORT_URL` to your artifact URL (e.g. CI job artifact, S3, internal server). |
| **3. Upload HTML file** | The actual Allure/Extent HTML file in Slack | Use Slack API `files.upload` with a Bot token (not webhook). Requires extra script + `SLACK_BOT_TOKEN` and `SLACK_CHANNEL`. |
| **4. CI integration** | Summary (and optionally link) from pipeline | Run `npm run slack:report` (or `node scripts/slack-report.js`) in your CI after tests; set `REPORT_URL` to the published report URL. |

This project implements **1** and **2** via Incoming Webhook. For **3**, you’d add a separate script that uses `files.upload`.

---

## Setup (Summary to Slack)

1. **Create a Slack Incoming Webhook**
   - In Slack: **Settings & administration** → **Manage apps** → **Incoming Webhooks** → **Add to Slack** (or create an app with Incoming Webhooks).
   - Choose the channel and copy the webhook URL (e.g. `https://hooks.slack.com/services/T…/B…/…`).

2. **Set the webhook URL**
   - **One-off:**  
     `set SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...` (Windows)  
     `export SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...` (Mac/Linux)
   - **CI:** Add `SLACK_WEBHOOK_URL` as a secret/environment variable.

3. **Run tests and send summary**
   - **After a local run:**  
     `npm run slack:report`  
     (reads `reports/json/cucumber-report.json` and posts the summary).
   - **Automatically after every run:**  
     Set `SLACK_WEBHOOK_URL` in the environment, then run `npm test`. The runner will call the Slack script after generating reports.

---

## Optional environment variables

- **`SLACK_WEBHOOK_URL`** (required for posting) – Incoming Webhook URL.
- **`REPORT_URL`** – Public URL of the report (e.g. Allure/Extent). Included in the Slack message so users can open the full report.
- **`RUN_LABEL`** – Label for the run (e.g. `Nightly`, `PR #123`). Shown in the Slack message.

Example (Windows CMD):

```cmd
set SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
set REPORT_URL=https://ci.example.com/job/123/artifact/reports/
set RUN_LABEL=Nightly
npm test
```

Example (CI, e.g. GitHub Actions):

```yaml
- name: Run tests
  run: npm test
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
    REPORT_URL: ${{ steps.upload.outputs.url }}   # if you publish report as artifact
    RUN_LABEL: "CI ${{ github.run_number }}"
```

---

## What the Slack message contains

- **Status:** PASSED or FAILED (emoji + text).
- **Counts:** Scenarios passed, failed, skipped, total.
- **Duration:** Total run time in seconds.
- **Run label:** If `RUN_LABEL` is set.
- **Report link:** If `REPORT_URL` is set.
- **Failed scenarios:** Names of failed scenarios (up to 10; if more, “see report” note).

No report file is uploaded by this script; only the summary (and optional link) is sent.
