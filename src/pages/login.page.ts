import { BasePage } from './base.page';

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

    /** Navigate to the base URL. */
    async goto() {
        await this.page.goto(this.baseUrl, { waitUntil: 'domcontentloaded' });
    }

    /** Check if the login form is visible. */
    async isLoginFormVisible(): Promise<boolean> {
        return this.isVisible(this.sel.emailInput, 5000);
    }

    /** Fill in credentials and submit the login form. */
    async login(username: string, password: string) {
        await this.waitForVisible(this.sel.emailInput, 30000);
        await this.pause(1000);
        await this.fill(this.sel.emailInput, username);

        await this.waitForVisible(this.sel.passwordInput, 10000);
        await this.pause(1000);
        await this.fill(this.sel.passwordInput, password);

        await this.pause(3000);
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
