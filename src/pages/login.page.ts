import { BasePage } from './base.page';

/**
 * LoginPage — encapsulates login form selectors and the login flow.
 */
export class LoginPage extends BasePage {

    private readonly sel = {
        emailInput:    "//input[@name='email']",
        passwordInput: "//input[@name='password']",
        submitButton:  "//button[@type='submit']",
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
        await this.pause(1000);
        await this.fill(this.sel.emailInput, username);

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
    }
}
