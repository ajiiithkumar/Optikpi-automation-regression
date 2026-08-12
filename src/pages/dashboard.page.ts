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

    // ─────────────────────────────────────────────────────────────────────────
    // Dashboard v2 (/dashboard_v2/{tab})
    // ─────────────────────────────────────────────────────────────────────────

    private readonly v2Tab: Record<string, string> = {
        'Overview':             "[data-test-id='dashboard_v2-tab-overview']",
        'Actions':              "[data-test-id='dashboard_v2-tab-actions']",
        'Engagement':           "[data-test-id='dashboard_v2-tab-engagement']",
        'Business Performance': "[data-test-id='dashboard_v2-tab-business-performance']",
    };

    private readonly v2TabSlug: Record<string, string> = {
        'Overview':             'overview',
        'Actions':              'actions',
        'Engagement':           'engagement',
        'Business Performance': 'business-performance',
    };

    private readonly v2DateRange = {
        /** The clickable dropdown button showing the current selection. */
        dropdownBtn:   "[data-testid='date-range-dropdown']",
        /** The <span> INSIDE the dropdown button that shows the current label text. */
        dropdownLabel: "[data-testid='date-range-dropdown'] span",
        /** A separate date-range display span in the dashboard header. */
        headerSpan:    "div.relative div.gap-2 > span",
        /** data-testid suffix for each preset option. */
        presets: {
            'This week':    'date-range-dropdown-this-week',
            'This month':   'date-range-dropdown-this-month',
            'Last 7 days':  'date-range-dropdown-last-7-days',
            'Last 30 days': 'date-range-dropdown-last-30-days',
            'Last month':   'date-range-dropdown-last-month',
            'Last quarter': 'date-range-dropdown-last-quarter',
            'Custom':       'date-range-dropdown-custom',
        } as Record<string, string>,
        /** Custom date picker apply button (different component from campaign/audience DateTimePicker). */
        customApply:   "[data-testid='dateTimePicker-modal-apply-button']",
    };

    private readonly v2Filter = {
        btn:            "[data-testid='dashboard-filter-btn']",
        selectAudience: "[data-testid='dashboard-filter-select-audience-btn']",
        /** Audience search input inside the filter flyout. */
        searchInput:    "div.min-h-0 > div > div input",
        /** Shared testid used for both the audience-sub-flyout OK and the filter-flyout Apply. */
        confirmBtn:     "[data-testid='flyout-confirm-btn']",
        resetBtn:       "[data-testid='common-flyout-reset-btn']",
    };

    // ─── v2 Date Utilities ────────────────────────────────────────────────────

    /** Format a Date as "MMM D, YYYY" matching the Dashboard v2 UI format. */
    formatDateLabel(d: Date): string {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }

    /**
     * Dynamically calculate the expected start/end dates for a preset option.
     * Dates match what the Dashboard v2 UI displays (no hardcoded values).
     *
     * "Last 30 days" logic: today − 29 days → today (30 days inclusive).
     * Verified from recorder: on Aug 12 the range showed Jul 14 (Aug 12 − 29 = Jul 14).
     */
    calculateExpectedRange(option: string): { start: string; end: string; label: string } {
        const today = new Date();
        const fmt = (d: Date) => this.formatDateLabel(d);

        const daysAgo = (n: number): Date => {
            const d = new Date(today);
            d.setDate(today.getDate() - n);
            return d;
        };

        switch (option) {
            case 'This week': {
                const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon …
                const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                const monday = new Date(today);
                monday.setDate(today.getDate() + diffToMonday);
                return { start: fmt(monday), end: fmt(today), label: 'This week' };
            }
            case 'This month': {
                const first = new Date(today.getFullYear(), today.getMonth(), 1);
                return { start: fmt(first), end: fmt(today), label: 'This month' };
            }
            case 'Last 7 days':
                return { start: fmt(daysAgo(6)), end: fmt(today), label: 'Last 7 days' };

            case 'Last 30 days':
                return { start: fmt(daysAgo(29)), end: fmt(today), label: 'Last 30 days' };

            case 'Last month': {
                const firstOfLast = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const lastOfLast  = new Date(today.getFullYear(), today.getMonth(), 0);
                return { start: fmt(firstOfLast), end: fmt(lastOfLast), label: 'Last month' };
            }
            case 'Last quarter': {
                const currentQ    = Math.floor(today.getMonth() / 3);           // 0-3
                const prevQStart  = ((currentQ - 1 + 4) % 4) * 3;               // month index 0-11
                const yearOfPrevQ = currentQ === 0 ? today.getFullYear() - 1 : today.getFullYear();
                const firstOfPrevQ = new Date(yearOfPrevQ, prevQStart, 1);
                const lastOfPrevQ  = new Date(yearOfPrevQ, prevQStart + 3, 0);
                return { start: fmt(firstOfPrevQ), end: fmt(lastOfPrevQ), label: 'Last quarter' };
            }
            default:
                return { start: '', end: '', label: option };
        }
    }

    // ─── v2 Tab Navigation ───────────────────────────────────────────────────

    /** Click a v2 tab and wait for the URL to update and network to settle. */
    async navigateToV2Tab(label: string) {
        const tabSel = this.v2Tab[label];
        if (!tabSel) throw new Error(`Unknown Dashboard v2 tab: "${label}"`);

        const tab = this.page.locator(tabSel).first();
        await tab.waitFor({ state: 'visible', timeout: 15000 });
        await tab.click();
        await this.page.waitForTimeout(1500);

        const slug = this.v2TabSlug[label];
        if (slug) {
            const deadline = Date.now() + 10000;
            while (Date.now() < deadline) {
                if (this.page.url().toLowerCase().includes(slug)) break;
                await this.pause(300);
            }
        }
        await this.waitForNetworkIdle();
    }

    // ─── v2 Date Range ───────────────────────────────────────────────────────

    /** Open the date range dropdown. */
    private async openDateRangeDropdown() {
        const btn = this.page.locator(this.v2DateRange.dropdownBtn).first();
        await btn.waitFor({ state: 'visible', timeout: 10000 });
        await btn.click();
        await this.pause(500);
    }

    /**
     * Select a date range preset by option name.
     * Uses data-testid selector first; falls back to exact text match.
     */
    async selectDateRangePreset(option: string) {
        const testId = this.v2DateRange.presets[option];
        if (!testId) throw new Error(`Unknown date range option: "${option}"`);

        await this.openDateRangeDropdown();

        const byId = this.page.locator(`[data-testid='${testId}']`).first();
        const byIdVisible = await byId.isVisible({ timeout: 3000 }).catch(() => false);

        if (byIdVisible) {
            await byId.click();
        } else {
            // Fallback: exact text — covers any testid naming discrepancies
            const byText = this.page.getByText(option, { exact: true }).first();
            await byText.waitFor({ state: 'visible', timeout: 5000 });
            await byText.click();
        }
        await this.pause(1000);
        await this.waitForNetworkIdle();
    }

    /**
     * Get the label currently shown in the date range dropdown button
     * (e.g., "Last 30 days", "Custom").
     */
    async getDateRangeLabel(): Promise<string> {
        const span = this.page.locator(this.v2DateRange.dropdownLabel).first();
        const spanVisible = await span.isVisible({ timeout: 3000 }).catch(() => false);
        if (spanVisible) return (await span.innerText()).trim();
        // Fallback: read the whole button
        const btn = this.page.locator(this.v2DateRange.dropdownBtn).first();
        return (await btn.innerText()).trim();
    }

    /**
     * Get the full date range text from the dashboard header
     * (e.g., "Aug 1, 2026 - Aug 12, 2026 (UTC+05:30)").
     * Falls back to the dropdown label if the header span is not found.
     */
    async getHeaderDateRangeText(): Promise<string> {
        const el = this.page.locator(this.v2DateRange.headerSpan).first();
        const visible = await el.isVisible({ timeout: 5000 }).catch(() => false);
        if (visible) return (await el.innerText()).trim();
        return await this.getDateRangeLabel();
    }

    /**
     * Select a custom date range.
     * Opens the Custom picker, clicks start date, end date, then Apply.
     * Date buttons use testid: dateTimePicker-modal-absolute-date-YYYY-MM-DD
     */
    async selectCustomDateRange(
        startYear: number, startMonth: number, startDay: number,
        endYear:   number, endMonth:   number, endDay:   number,
    ) {
        await this.selectDateRangePreset('Custom');
        await this.pause(500);

        const p2 = (n: number) => String(n).padStart(2, '0');

        const startSel = `[data-testid='dateTimePicker-modal-absolute-date-${startYear}-${p2(startMonth)}-${p2(startDay)}']`;
        const endSel   = `[data-testid='dateTimePicker-modal-absolute-date-${endYear}-${p2(endMonth)}-${p2(endDay)}']`;

        // Click start date (using dispatchEvent to bypass layout grid interception)
        const startBtn = this.page.locator(startSel).first();
        await startBtn.waitFor({ state: 'attached', timeout: 10000 });
        await startBtn.scrollIntoViewIfNeeded().catch(() => {});
        await startBtn.dispatchEvent('click').catch(async () => await startBtn.click({ force: true }));
        await this.pause(500);

        // Click end date
        const endBtn = this.page.locator(endSel).first();
        await endBtn.waitFor({ state: 'attached', timeout: 5000 });
        await endBtn.scrollIntoViewIfNeeded().catch(() => {});
        await endBtn.dispatchEvent('click').catch(async () => await endBtn.click({ force: true }));
        await this.pause(500);

        // Apply
        const applyBtn = this.page.locator(this.v2DateRange.customApply).first();
        await applyBtn.waitFor({ state: 'attached', timeout: 5000 });
        await applyBtn.dispatchEvent('click').catch(async () => await applyBtn.click({ force: true }));
        await this.pause(1000);
        await this.waitForNetworkIdle();
    }

    // ─── v2 Filter ───────────────────────────────────────────────────────────

    /** Click the filter button to open or re-open the filter panel. */
    async openDashboardFilter() {
        const btn = this.page.locator(this.v2Filter.btn).first();
        await btn.waitFor({ state: 'visible', timeout: 10000 });
        await btn.click({ force: true });
        await this.pause(800);
    }

    /**
     * Inside the filter flyout: click "Select audience", search by name,
     * click the audience radio, then click OK to close the audience sub-flyout.
     *
     * Note: flyout-confirm-btn is reused for both OK (audience sub-flyout)
     * and Apply (filter flyout). We distinguish them by their inner text.
     */
    async selectAudienceInFilter(audienceName: string) {
        // 1. Click "Select audience"
        const selectBtn = this.page.locator(this.v2Filter.selectAudience).first();
        await selectBtn.waitFor({ state: 'visible', timeout: 10000 });
        await selectBtn.click({ force: true });
        await this.pause(500);

        // 2. Search
        const input = this.page.locator(this.v2Filter.searchInput).first();
        await input.waitFor({ state: 'visible', timeout: 10000 });
        await input.click({ force: true });
        await input.fill(audienceName);
        await this.page.keyboard.press('Enter');
        await this.pause(2000);

        // 3. Click radio / label by audience name
        const partial = audienceName.substring(0, 25);
        const radioLocators = [
            // Try to find the radio input directly within the filtered list
            this.page.locator("input[type='radio']").first(),
            // Try to find a role=radio element
            this.page.locator("[role='radio']").first(),
            // Try to click the text itself
            this.page.locator(`//*[contains(normalize-space(),'${partial}')]`).last()
        ];

        let clicked = false;
        for (const loc of radioLocators) {
            if (await loc.isVisible({ timeout: 2000 }).catch(() => false)) {
                // Use dispatchEvent to ensure the click hits the element directly
                await loc.dispatchEvent('click').catch(async () => await loc.click({ force: true }));
                clicked = true;
                break;
            }
        }
        
        // If not found, try one more time by clicking the first list item
        if (!clicked) {
            const fallbackItem = this.page.locator("ul li").first();
            if (await fallbackItem.isVisible({ timeout: 1000 }).catch(() => false)) {
                await fallbackItem.click({ force: true });
            }
        }
        await this.pause(500);

        // 4. Click OK button (closes the audience sub-flyout, identified by "Ok" inner text)
        const okBtn = this.page.locator(this.v2Filter.confirmBtn)
            .filter({ hasText: /ok/i }).first();
        await okBtn.waitFor({ state: 'attached', timeout: 5000 });
        await okBtn.dispatchEvent('click').catch(async () => await okBtn.click({ force: true }));
        await this.pause(500);
    }

    /**
     * Click Apply in the filter flyout to apply the selected filters.
     * Called after selectAudienceInFilter — the audience sub-flyout is already closed.
     */
    async applyDashboardFilter() {
        const applyBtn = this.page.locator(this.v2Filter.confirmBtn)
            .filter({ hasText: /apply/i }).first();
        await applyBtn.waitFor({ state: 'attached', timeout: 5000 });
        await applyBtn.dispatchEvent('click').catch(async () => await applyBtn.click({ force: true }));
        await this.pause(1000);
        await this.waitForNetworkIdle();
    }

    /** Click Reset in the filter flyout to clear all applied filters. */
    async resetDashboardFilter() {
        const resetBtn = this.page.locator(this.v2Filter.resetBtn).first();
        await resetBtn.waitFor({ state: 'attached', timeout: 5000 });
        await resetBtn.dispatchEvent('click').catch(async () => await resetBtn.click({ force: true }));
        await this.pause(1000);
        await this.waitForNetworkIdle();
    }

    /**
     * Check whether an audience filter chip/indicator is visible on the page.
     * Uses a partial match of the audience name to handle UI truncation.
     * Excludes dialog/flyout descendants so we only see chips in the main content.
     */
    async isAudienceFilterApplied(audienceName: string): Promise<boolean> {
        // Strategy 1: audience name visible in non-dialog area
        const partial = audienceName.substring(0, 20);
        const nameEl = this.page.locator(
            `//*[contains(normalize-space(),'${partial}') and not(ancestor::*[@role='dialog']) and not(self::script) and not(self::style)]`
        ).first();
        if (await nameEl.isVisible({ timeout: 3000 }).catch(() => false)) return true;

        // Strategy 2: filter button has an active/count badge (class-based heuristic)
        const activeBadge = this.page.locator(
            "[data-testid='dashboard-filter-btn'] [class*='badge'], " +
            "[data-testid='dashboard-filter-btn'] [class*='dot'], " +
            "[data-testid='dashboard-filter-btn'] [class*='count']"
        ).first();
        return activeBadge.isVisible({ timeout: 2000 }).catch(() => false);
    }
}
