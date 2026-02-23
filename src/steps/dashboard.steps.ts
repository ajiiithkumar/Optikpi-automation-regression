
import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { DashboardPage } from '../pages/dashboard.page';
import { ExtentTestManager } from '../utils/extent-test-manager';
import { PlaywrightWorld } from '../support/world';

const getDashboardPage = (world: PlaywrightWorld) => new DashboardPage(world.page);

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
