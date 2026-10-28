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
        rememberMeCheckbox: "//input[@type='checkbox'] | //label[contains(normalize-space(),'Remember for 30 days')]",
        addPasskeyBtn: "//button[contains(normalize-space(),'Add passkey')]",
        continueWithoutPasskeyBtn: "//button[contains(normalize-space(),'Continue without a passkey')]",
        // Headless UI modal overlay that can block the nav on first login
        headlessOverlay: "//*[@id='headlessui-portal-root']//div[contains(@class,'fixed') and contains(@class,'inset-0')]",
        // 'Got it' / 'OK' / 'Close' / 'Dismiss' dismiss buttons for first-login modals
        firstLoginDismiss: "//button[contains(normalize-space(),'Got it') or contains(normalize-space(),'OK') or contains(normalize-space(),'Dismiss') or contains(normalize-space(),'Close') or contains(normalize-space(),'Continue')]",
        announcementTitle: "//*[normalize-space()='Introducing the new Dashboard']",
        announcementDialog: "//*[@role='dialog' and .//*[normalize-space()='Introducing the new Dashboard']] | //*[@id='headlessui-portal-root']//*[.//*[normalize-space()='Introducing the new Dashboard']]",
        announcementCloseButton: ".//button[@aria-label='Close' or @title='Close' or normalize-space()='x' or normalize-space()='X' or .//*[local-name()='svg']]",
    };

    readonly baseUrl = process.env.BASE_URL || 'https://demo.optikpi.com/en';

    /** Navigate to the base URL and wait for the page to fully load (React hydrated). */
    async goto() {
        await this.page.goto(this.baseUrl, { waitUntil: 'load' });
    }

    /** Check if the login form is visible. */
    async isLoginFormVisible(): Promise<boolean> {
        return this.isVisible(this.sel.emailInput, 5000);
    }

    /** Check if we are currently on the 'Set up your passkey' screen. */
    async isOnPasskeyPage(): Promise<boolean> {
        return this.page.url().includes('/add-passkey') ||
               await this.isVisible(this.sel.addPasskeyBtn, 3000);
    }

    /**
     * Bypass the 'Set up your passkey' screen.
     * Mocks navigator.credentials.create, clicks '+ Add passkey', then
     * waits for and clicks 'Continue without a passkey'.
     */
    async bypassPasskeyScreen(): Promise<void> {
        console.log('[Login] Bypassing passkey screen...');
        await this.page.evaluate(() => {
            if (window.navigator && window.navigator.credentials) {
                (window.navigator.credentials as any).create = () => Promise.reject(new DOMException('Cancelled', 'NotAllowedError'));
            }
        }).catch(() => {});

        await this.page.locator(this.sel.addPasskeyBtn).first().click().catch(() => {});

        const continueWithout = this.page.locator(this.sel.continueWithoutPasskeyBtn).first();
        await continueWithout.waitFor({ state: 'visible', timeout: 8000 });
        await continueWithout.click();

        await this.page.waitForURL(
            url => !url.toString().includes('/add-passkey') && !url.toString().includes('/login'),
            { timeout: 20000 }
        ).catch(() => {});
        console.log('[Login] Passkey screen bypassed, now at:', this.page.url());
    }

    /**
     * Fill a form field with automatic retry.
     *
     * React controlled inputs can be reset by the framework mid-fill.
     * Strategy: fill() -> verify value -> if mismatch, retry up to maxAttempts.
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

        // Click Continue if on the two-step email screen
        const submit = this.page.locator(this.sel.submitButton).first();
        const passLoc = this.page.locator(this.sel.passwordInput);
        if (!(await passLoc.isVisible({ timeout: 1500 }).catch(() => false))) {
            await submit.click().catch(() => {});
            await this.pause(1000);
        }

        // Fill password
        await passLoc.waitFor({ state: 'visible', timeout: 15000 });
        await this.fillWithRetry(passLoc, password);

        // Check 'Remember for 30 days' if present
        const rememberMe = this.page.locator(this.sel.rememberMeCheckbox).first();
        if (await rememberMe.isVisible({ timeout: 2000 }).catch(() => false)) {
            const isChecked = await rememberMe.isChecked().catch(() => false);
            if (!isChecked) {
                await rememberMe.click().catch(() => {});
            }
        }

        await this.pause(500);

        // Click Sign in
        await submit.click({ force: true }).catch(async () => {
            await this.page.keyboard.press('Enter');
        });

        // Wait up to 15s to see where Sign-in redirects us:
        //   - /en/add-passkey  → passkey setup page
        //   - anything else    → dashboard / main app
        await this.page.waitForURL(
            url => url.toString().includes('/add-passkey') ||
                   (!url.toString().includes('/login') &&
                    !url.toString().endsWith('/en') &&
                    !url.toString().endsWith('/en/')),
            { timeout: 15000 }
        ).catch(() => {});

        // If we landed on the passkey setup page, bypass it
        if (this.page.url().includes('/add-passkey') ||
            await this.page.locator(this.sel.addPasskeyBtn).isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log('[Login] "Set up your passkey" screen detected — bypassing...');
            await this.bypassPasskeyScreen();
        }

        // Final wait: make sure we are fully on a post-login page
        await this.page.waitForURL(
            url => !url.toString().includes('/login') &&
                   !url.toString().includes('/add-passkey') &&
                   !url.toString().endsWith('/en') &&
                   !url.toString().endsWith('/en/'),
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
