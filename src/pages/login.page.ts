import { BasePage } from './base.page';
import { Locator } from 'playwright';

/**
 * LoginPage — encapsulates login form selectors and the login flow.
 */
export class LoginPage extends BasePage {

    private readonly sel = {
        emailInput:    "//input[@name='email']",
        passwordInput: "//input[@name='password']",
        submitButton:  "//button[@type='submit']",
        // Headless UI modal overlay that can block the nav on first login
        headlessOverlay: "//*[@id='headlessui-portal-root']//div[contains(@class,'fixed') and contains(@class,'inset-0')]",
        // "Got it" / "OK" / "Close" / "Dismiss" dismiss buttons for first-login modals
        firstLoginDismiss: "//button[contains(normalize-space(),'Got it') or contains(normalize-space(),'OK') or contains(normalize-space(),'Dismiss') or contains(normalize-space(),'Close') or contains(normalize-space(),'Continue')]",
        announcementTitle: "//*[normalize-space()='Introducing the new Dashboard']",
        announcementDialog: "//*[@role='dialog' and .//*[normalize-space()='Introducing the new Dashboard']] | //*[@id='headlessui-portal-root']//*[.//*[normalize-space()='Introducing the new Dashboard']]",
        announcementCloseButton: ".//button[@aria-label='Close' or @title='Close' or normalize-space()='x' or normalize-space()='X' or .//*[local-name()='svg']]",
    };

    readonly baseUrl = 'https://demo.optikpi.com/en';

    /** Navigate to the base URL and wait for the page to fully load (React hydrated). */
    async goto() {
        await this.page.goto(this.baseUrl, { waitUntil: 'load' });
    }

    /** Check if the login form is visible. */
    async isLoginFormVisible(): Promise<boolean> {
        return this.isVisible(this.sel.emailInput, 5000);
    }

    /**
     * Fill a form field with automatic retry.
     *
     * React controlled inputs can be reset by the framework mid-fill.
     * Strategy: fill() → verify value → if mismatch, retry up to maxAttempts.
     * Last resort: pressSequentially (types char-by-char, bypasses React value reset).
     */
    private async fillWithRetry(locator: Locator, value: string, maxAttempts = 3): Promise<void> {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            await locator.click().catch(() => {});
            await locator.fill(value);
            await this.page.waitForTimeout(300);

            const current = await locator.inputValue().catch(() => '');
            if (current === value) {
                if (attempt > 1) {
                    console.log(`[Login] fillWithRetry: value set on attempt ${attempt}`);
                }
                return;
            }
            console.log(`[Login] fillWithRetry attempt ${attempt}/${maxAttempts}: expected "${value.substring(0, 3)}***" got "${current.substring(0, 3)}***"`);
            await this.page.waitForTimeout(300);
        }

        // Last resort: type character-by-character (cannot be intercepted by React)
        console.log(`[Login] fillWithRetry: falling back to pressSequentially`);
        await locator.click({ clickCount: 3 }).catch(() => {}); // triple-click selects all existing text
        await locator.pressSequentially(value, { delay: 60 });
    }

    /** Fill in credentials and submit the login form. */
    async login(username: string, password: string) {
        const emailLoc = this.page.locator(this.sel.emailInput);
        await emailLoc.waitFor({ state: 'visible', timeout: 30000 });
        await this.fillWithRetry(emailLoc, username);

        const passLoc = this.page.locator(this.sel.passwordInput);
        await passLoc.waitFor({ state: 'visible', timeout: 10000 });
        await this.fillWithRetry(passLoc, password);

        // ── Pre-submit verification ───────────────────────────────────────────
        // React can re-render and clear the email field AFTER the password is
        // filled. Check email value one final time before clicking Sign in.
        const emailBeforeSubmit = await emailLoc.inputValue().catch(() => '');
        if (emailBeforeSubmit !== username) {
            console.log(`[Login] Email was cleared after password fill (got: "${emailBeforeSubmit}") — re-filling`);
            await this.fillWithRetry(emailLoc, username);
        }

        await this.pause(500);

        const submit = this.page.locator(this.sel.submitButton);
        await submit.waitFor({ state: 'attached', timeout: 30000 });

        const networkIdleTimeout = new Promise<void>((_, reject) =>
            setTimeout(() => reject(new Error('networkidle timeout after 20s — proceeding')), 20000)
        );

        await Promise.all([
            Promise.race([
                this.page.waitForLoadState('networkidle'),
                networkIdleTimeout,
            ]).catch(() => {}),
            submit.click({ force: true }).catch(async () => {
                await this.page.keyboard.press('Enter');
            }),
        ]);

        await this.page.waitForURL(
            url => !url.toString().endsWith('/en') && !url.toString().endsWith('/en/'),
            { timeout: 30000 }
        ).catch(() => {});
    }

    /** Close the one-time dashboard announcement if the user has not dismissed it yet. */
    async closeAnnouncementPopupIfVisible(timeout = 5000): Promise<boolean> {
        const title = this.page.locator(this.sel.announcementTitle).first();
        const visible = await title.isVisible({ timeout }).catch(() => false);
        if (!visible) {
            return false;
        }

        const dialog = this.page.locator(this.sel.announcementDialog).first();
        const closeButton = dialog.locator(`xpath=${this.sel.announcementCloseButton}`).last();
        const closeVisible = await closeButton.isVisible({ timeout: 3000 }).catch(() => false);

        if (closeVisible) {
            await closeButton.click({ force: true });
        } else {
            await this.page.keyboard.press('Escape');
        }

        await title.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
        return true;
    }
}
