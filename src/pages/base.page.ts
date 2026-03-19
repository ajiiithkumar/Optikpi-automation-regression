import { Page } from 'playwright';

/**
 * BasePage — common Playwright interactions shared by all page objects.
 * Every page class should extend this and use these helper methods
 * instead of calling `page.locator(...)` directly.
 */
export class BasePage {
    constructor(protected page: Page) {}

    /** Wait for an element to be visible, then click it. */
    protected async click(selector: string, timeout = 20000) {
        const el = this.page.locator(selector).first();
        await el.waitFor({ state: 'visible', timeout });
        await el.click();
        await this.page.waitForTimeout(3000);
    }

    /** Wait for an element, then click it with force (useful for overlapping elements). */
    protected async forceClick(selector: string, timeout = 20000) {
        const el = this.page.locator(selector).first();
        await el.waitFor({ state: 'visible', timeout });
        await el.click({ force: true });
        await this.page.waitForTimeout(3000);
    }

    /** Wait for an element to be visible, clear it, then type the value. */
    protected async fill(selector: string, value: string, timeout = 20000) {
        const el = this.page.locator(selector).first();
        await el.waitFor({ state: 'visible', timeout });
        await el.fill(value);
    }

    /** Read the inner text of a visible element. */
    protected async getText(selector: string, timeout = 20000): Promise<string> {
        const el = this.page.locator(selector).first();
        await el.waitFor({ state: 'visible', timeout });
        return (await el.innerText()).trim();
    }

    /** Read the value of an <input> / <textarea> / <select>. */
    protected async getInputValue(selector: string, timeout = 20000): Promise<string> {
        const el = this.page.locator(selector).first();
        await el.waitFor({ state: 'visible', timeout });
        return await el.inputValue();
    }

    /** Check whether an element is currently visible (within timeout). */
    protected async isVisible(selector: string, timeout = 5000): Promise<boolean> {
        return this.page.locator(selector).first()
            .isVisible({ timeout })
            .catch(() => false);
    }

    /** Wait until an element becomes visible. */
    protected async waitForVisible(selector: string, timeout = 20000) {
        await this.page.locator(selector).first()
            .waitFor({ state: 'visible', timeout });
    }

    /** Fixed-time wait (use sparingly). */
    async pause(ms = 1000) {
        await this.page.waitForTimeout(ms);
    }

    /** Wait for network to settle after an action. */
    protected async waitForNetworkIdle() {
        await this.page.waitForLoadState('networkidle').catch(() => {});
    }

    /**
     * Check for a "limit reached" error popup and dismiss it.
     * Returns { found: true, message } if popup was detected and dismissed,
     * or { found: false } if no popup.
     */
    async checkLimitReachedPopup(): Promise<{ found: boolean; message: string }> {
        await this.pause(2000);

        // Look for popup text containing "limit reached"
        const limitPopup = this.page.locator(
            "//*[contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'limit reached')]"
        ).first();

        const isVisible = await limitPopup.isVisible().catch(() => false);
        if (!isVisible) return { found: false, message: '' };

        // Grab the popup message
        const message = await limitPopup.innerText().catch(() => 'Limit reached');
        console.log(`[LimitCheck] ⚠️ Limit reached popup detected: ${message.trim()}`);

        // Click Dismiss button
        const dismissBtn = this.page.locator(
            "//button[normalize-space()='Dismiss']"
        ).first();

        if (await dismissBtn.isVisible().catch(() => false)) {
            await dismissBtn.click();
            await this.pause(1000);
            console.log('[LimitCheck] Clicked Dismiss button');
        } else {
            // Fallback: press Escape or click X
            const closeBtn = this.page.locator(
                "//*[contains(@class,'close') or @aria-label='Close'] | //button[contains(@class,'close')]"
            ).first();
            if (await closeBtn.isVisible().catch(() => false)) {
                await closeBtn.click();
            } else {
                await this.page.keyboard.press('Escape');
            }
            await this.pause(1000);
            console.log('[LimitCheck] Dismissed popup via close/escape');
        }

        return { found: true, message: message.trim() };
    }
}
