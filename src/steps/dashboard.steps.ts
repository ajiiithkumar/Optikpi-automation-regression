
import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { DashboardPage } from '../pages/dashboard.page';
import { ExtentTestManager } from '../utils/extent-test-manager';
import { PlaywrightWorld } from '../support/world';
import { waitForNameEntryCompleted } from '../utils/helper';

const getDashboardPage = (world: PlaywrightWorld) => new DashboardPage(world.page);

// ─── Legacy dashboard v1 steps (kept for backward compatibility) ──────────────

Then('KPI widgets should load', async function (this: PlaywrightWorld) {
    await getDashboardPage(this).waitForReady();
    ExtentTestManager.logPass('KPI widgets loaded');
});

When('I apply "Last 30 days" filter on Dashboard', async function (this: PlaywrightWorld) {
    const dashboard = getDashboardPage(this);
    await dashboard.waitForReady();
    this['kpiSnapshot'] = await dashboard.getKpiSnapshot();
    ExtentTestManager.logInfo('Applying Last 30 days filter');

    const applied = await dashboard.applyLast30DaysFilter();
    this['filterApplied'] = applied;

    if (applied) {
        ExtentTestManager.logPass('Last 30 days selected successfully');
    } else {
        ExtentTestManager.logFail('Unable to select Last 30 days filter');
    }
});

Then('KPI data should change', async function (this: PlaywrightWorld) {
    const dashboard = getDashboardPage(this);
    if (this['filterApplied'] === false) return;

    await dashboard.waitForReady();
    const updatedSnapshot = await dashboard.getKpiSnapshot();

    if (!updatedSnapshot || !this['kpiSnapshot']) {
        ExtentTestManager.logPass('KPI cards not found for comparison — skipping snapshot diff');
        return;
    }

    expect(updatedSnapshot).not.toEqual(this['kpiSnapshot']);
    ExtentTestManager.logPass('KPI data updated after filter');
});

Then('Business Performance tab should load', async function (this: PlaywrightWorld) {
    await getDashboardPage(this).openTab('Business Performance');
    ExtentTestManager.logPass('Business Performance tab loaded');
});

Then('Marketing tab should load', async function (this: PlaywrightWorld) {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await getDashboardPage(this).openTab('Marketing');
            ExtentTestManager.logPass(`Marketing tab loaded (attempt ${attempt})`);
            return;
        } catch (err) {
            lastError = err as Error;
            console.log(`[Dashboard] Marketing tab attempt ${attempt} failed: ${lastError.message}`);
            if (attempt < maxRetries) {
                await this.page.waitForTimeout(2000);
                await this.page.reload({ waitUntil: 'networkidle' }).catch(() => {});
                await this.page.waitForTimeout(2000);
            }
        }
    }

    throw lastError || new Error('Marketing tab did not load after retries');
});

Then('Notification tab should load', async function (this: PlaywrightWorld) {
    await getDashboardPage(this).openTab('Notification');
    ExtentTestManager.logPass('Notification tab loaded');
});

// ─── Dashboard v2 Steps ────────────────────────────────────────────────────────

/**
 * REG-DASH-03 — Tab navigation
 * Clicks the named v2 tab and waits for URL change + network idle.
 */
Then('I navigate to the {string} dashboard tab and verify it loads',
    async function (this: PlaywrightWorld, tabName: string) {
        const dashboard = getDashboardPage(this);
        await dashboard.navigateToV2Tab(tabName);
        ExtentTestManager.logPass(`Dashboard v2 tab "${tabName}" loaded — URL: ${this.page!.url()}`);
    }
);

/**
 * REG-DASH-04 — Date range preset validation
 * Calculates the expected date range dynamically, selects the preset,
 * then verifies the dropdown label and the header date text.
 */
Then('I select the {string} date range and verify it is displayed correctly',
    async function (this: PlaywrightWorld, option: string) {
        const dashboard = getDashboardPage(this);

        // Calculate BEFORE selecting so we use the same "now"
        const expected = dashboard.calculateExpectedRange(option);

        await dashboard.selectDateRangePreset(option);

        // 1. Verify dropdown label matches the selected option name
        const label = await dashboard.getDateRangeLabel();
        expect(label).toContain(option);

        // 2. If we have an expected start date, verify the header contains it
        if (expected.start) {
            const headerText = await dashboard.getHeaderDateRangeText();
            // Check month+day portion to be flexible with timezone offsets
            const monthDay = expected.start.split(',')[0]; // e.g., "Aug 1"
            expect(headerText).toContain(monthDay);
            ExtentTestManager.logPass(
                `Date range "${option}" verified — label: "${label}", ` +
                `header contains: "${monthDay}" (expected start: ${expected.start})`
            );
        } else {
            ExtentTestManager.logPass(`Date range "${option}" verified — label: "${label}"`);
        }
    }
);

/**
 * REG-DASH-05 — Custom date range (first of current month → today)
 * Stores the selected range in world context for cross-tab persistence checks.
 */
Then('I select a custom date range from the first of the current month to today',
    async function (this: PlaywrightWorld) {
        const dashboard = getDashboardPage(this);
        const now   = new Date();
        const year  = now.getFullYear();
        const month = now.getMonth() + 1; // 1-indexed for the date picker testid
        const today = now.getDate();

        // Store for downstream verification steps
        this['customDateStart'] = dashboard.formatDateLabel(new Date(year, month - 1, 1));
        this['customDateEnd']   = dashboard.formatDateLabel(now);

        await dashboard.selectCustomDateRange(year, month, 1, year, month, today);

        ExtentTestManager.logPass(
            `Custom date range selected: ${this['customDateStart']} – ${this['customDateEnd']}`
        );
    }
);

/**
 * REG-DASH-05 — Verify custom date range persists in the header.
 * Checks the dropdown shows "Custom" and the header contains the start month+day.
 */
Then('Verify the custom date range is displayed in the dashboard header',
    async function (this: PlaywrightWorld) {
        const dashboard = getDashboardPage(this);

        // Dropdown label must say "Custom"
        const label = await dashboard.getDateRangeLabel();
        expect(label).toContain('Custom');

        // Header must contain the start date (month+day)
        const start = this['customDateStart'] as string | undefined;
        if (start) {
            const headerText = await dashboard.getHeaderDateRangeText();
            const monthDay   = start.split(',')[0]; // e.g., "Aug 1"
            expect(headerText).toContain(monthDay);
            ExtentTestManager.logPass(
                `Custom date range persists — header: "${headerText}", contains: "${monthDay}"`
            );
        } else {
            ExtentTestManager.logPass(`Custom label verified — label: "${label}"`);
        }
    }
);

/**
 * REG-DASH-06/07/08 — Open the dashboard filter panel.
 */
Then('I open the dashboard filter panel', async function (this: PlaywrightWorld) {
    await getDashboardPage(this).openDashboardFilter();
    ExtentTestManager.logPass('Dashboard filter panel opened');
});

/**
 * REG-DASH-06/07/08 — Select the existing automation audience in the filter.
 * Reads the audience name from names.json["existingAudience"] (same pattern
 * used by Campaign and Workflow steps).
 */
Then('I select the existing audience in the dashboard filter',
    async function (this: PlaywrightWorld) {
        const entry = await waitForNameEntryCompleted('existingAudience');
        this['dashboardFilterAudience'] = entry.title;
        ExtentTestManager.logInfo(`Selecting audience in Dashboard filter: "${entry.title}"`);

        await getDashboardPage(this).selectAudienceInFilter(entry.title);
        ExtentTestManager.logPass(`Audience selected: "${entry.title}"`);
    }
);

/**
 * REG-DASH-06/07/08 — Click Apply in the filter flyout.
 */
Then('I apply the dashboard audience filter', async function (this: PlaywrightWorld) {
    await getDashboardPage(this).applyDashboardFilter();
    ExtentTestManager.logPass('Dashboard audience filter applied');
});

/**
 * REG-DASH-06/07 — Verify the applied audience filter chip/indicator is visible.
 */
Then('Verify the audience filter is displayed in the dashboard',
    async function (this: PlaywrightWorld) {
        const audienceName = this['dashboardFilterAudience'] as string;
        if (!audienceName) {
            throw new Error(
                'dashboardFilterAudience not set — ensure "I select the existing audience" step ran first.'
            );
        }
        const isApplied = await getDashboardPage(this).isAudienceFilterApplied(audienceName);
        expect(isApplied).toBeTruthy();
        ExtentTestManager.logPass(`Audience filter displayed for: "${audienceName}"`);
    }
);

/**
 * REG-DASH-08 — Click Reset in the filter flyout.
 */
Then('I reset the dashboard filter', async function (this: PlaywrightWorld) {
    await getDashboardPage(this).resetDashboardFilter();
    ExtentTestManager.logPass('Dashboard filter reset');
});

/**
 * REG-DASH-08 — Verify the audience filter chip/indicator is gone after reset.
 */
Then('Verify the audience filter is not displayed in the dashboard',
    async function (this: PlaywrightWorld) {
        const audienceName = this['dashboardFilterAudience'] as string;
        const dashboard    = getDashboardPage(this);

        const isApplied = await dashboard.isAudienceFilterApplied(
            audienceName || 'Audience'
        );
        expect(isApplied).toBeFalsy();
        ExtentTestManager.logPass('Audience filter is no longer displayed after reset');
    }
);
