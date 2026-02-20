import { BasePage } from './base.page';

/**
 * DashboardPage — encapsulates Dashboard selectors and actions.
 */
export class DashboardPage extends BasePage {

    private readonly sel = {
        // Page title
        title: "//*[self::h1 or self::h2][contains(translate(normalize-space(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'dashboard')]",

        // KPI widgets & loader
        kpiCards:  "//*[contains(@class,'kpi') or contains(@class,'Kpi') or contains(@class,'card')][.//span or .//h3 or .//p]",
        loader:    "//*[contains(@class,'loader') or contains(@class,'spinner') or @aria-busy='true']",

        // Date filter
        dateFilter:       "//button[@data-testid='date-range-dropdown']",
        dateLast30Days:   "//button[@data-testid='date-range-dropdown-last-30-days']",

        // Tabs
        tabBusinessPerformance: "//button[@data-test-id='dashboard-tab-business-performance']",
        tabMarketing:           "//button[@data-test-id='dashboard-tab-marketing']",
        tabNotification:        "//button[@data-test-id='dashboard-tab-notification']",

        // Tab content indicators
        businessPerformanceTotalCustomers: "//*[self::p or self::span][normalize-space()='Total customers']",
        marketingTotalEvents:              "//*[self::p or self::span][normalize-space()='Total events']",
        notificationScheduledAudiences:    "//*[self::p or self::span][normalize-space()='Scheduled Audiences']",
    };

    private readonly tabMap: Record<string, { tabSel: string; pathHint: string; contentSel: string }> = {
        'Business Performance': { tabSel: this.sel.tabBusinessPerformance, pathHint: 'business-performance', contentSel: this.sel.businessPerformanceTotalCustomers },
        Marketing:              { tabSel: this.sel.tabMarketing,           pathHint: 'marketing',            contentSel: this.sel.marketingTotalEvents },
        Notification:           { tabSel: this.sel.tabNotification,        pathHint: 'notification',         contentSel: this.sel.notificationScheduledAudiences },
    };

    // ─── Ready / Loader ──────────────────────────────────────────────────────

    /** Wait for dashboard to be fully ready (loader hidden, KPI cards visible). */
    async waitForReady() {
        await this.waitForNetworkIdle();
        await this.page.locator(this.sel.loader).waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
        const cards = this.page.locator(this.sel.kpiCards);
        if (await cards.count()) {
            await cards.first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
        }
    }

    /** Wait for loader to disappear. */
    async waitForLoaderHidden() {
        await this.page.locator(this.sel.loader).waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
    }

    // ─── KPI ─────────────────────────────────────────────────────────────────

    /** Get a snapshot of KPI card texts (pipe-separated). */
    async getKpiSnapshot(): Promise<string> {
        const cards = this.page.locator(this.sel.kpiCards);
        const count = await cards.count();
        if (count > 0) {
            const texts = await cards.allInnerTexts();
            return texts.map(t => t.trim()).join('|');
        }
        return '';
    }

    // ─── Date Filter ─────────────────────────────────────────────────────────

    /** Click the date filter dropdown and select "Last 30 days". Returns true if selected. */
    async applyLast30DaysFilter(): Promise<boolean> {
        const filterButton = this.page.locator(this.sel.dateFilter).first();
        await filterButton.click({ timeout: 15000 });

        const candidates = [
            this.page.locator(this.sel.dateLast30Days).first(),
            this.page.getByRole('menuitem', { name: /last\s*30/i }).first(),
            this.page.getByText('Last 30 days', { exact: true }).first(),
            this.page.locator('//*[self::div or self::li or self::button][normalize-space()="Last 30 days" and not(ancestor::*[@aria-hidden="true"])]').first(),
        ];

        for (const candidate of candidates) {
            if (await candidate.count()) {
                await candidate.click({ timeout: 15000 });
                return true;
            }
        }
        return false;
    }

    // ─── Tabs ────────────────────────────────────────────────────────────────

    /** Open a dashboard tab by label ('Business Performance', 'Marketing', 'Notification'). */
    async openTab(label: string) {
        const entry = this.tabMap[label];
        if (!entry) throw new Error(`Unsupported dashboard tab: ${label}`);

        const tab = this.page.locator(entry.tabSel).first();
        await tab.waitFor({ state: 'visible', timeout: 15000 });

        await Promise.allSettled([
            this.page.waitForLoadState('networkidle').catch(() => {}),
            tab.click({ timeout: 15000 }),
        ]);

        // Wait for URL to include the tab path hint
        const start = Date.now();
        while (Date.now() - start < 20000) {
            if (this.page.url().toLowerCase().includes(`/dashboard/${entry.pathHint}`)) break;
            await this.pause(500);
        }

        // Verify tab is selected
        await this.pause(1000);
        await this.waitForLoaderHidden();

        // Wait for tab content to be visible
        await this.page.locator(entry.contentSel).first().waitFor({ state: 'visible', timeout: 20000 });
    }
}
