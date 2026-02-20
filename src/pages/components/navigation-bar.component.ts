import { BasePage } from '../base.page';

/**
 * NavigationBar — shared navigation actions used across all modules.
 */
export class NavigationBar extends BasePage {

    private readonly sel = {
        navDashboard: "//*[self::a or self::button][.//span[normalize-space()='Dashboard'] or normalize-space()='Dashboard']",
        navSettings:  "//*[self::a or self::button][.//span[normalize-space()='Settings'] or normalize-space()='Settings']",
        navAudience:  "//*[self::a or self::button][.//span[normalize-space()='Audience'] or normalize-space()='Audience']",
        navLibrary:   "//*[self::a or self::button][.//span[normalize-space()='Library'] or normalize-space()='Library']",
        navCampaign:  "//*[self::a or self::button][.//span[normalize-space()='Campaign'] or normalize-space()='Campaign']",
        navWorkflow:  "//*[self::a or self::button][.//span[normalize-space()='Workflow'] or normalize-space()='Workflow']",
        closeBody:    "//body[contains(@class,'__className_f367f3')]",
    };

    private readonly navMap: Record<string, { nav: string; pathHint: string }> = {
        Dashboard: { nav: this.sel.navDashboard, pathHint: 'dashboard' },
        Settings:  { nav: this.sel.navSettings,  pathHint: 'setting' },
        Audience:  { nav: this.sel.navAudience,  pathHint: 'audience' },
        Campaign:  { nav: this.sel.navCampaign,  pathHint: 'campaign' },
        Workflow:  { nav: this.sel.navWorkflow,  pathHint: 'workflow' },
    };

    /** Navigate to a module by clicking its sidebar link. */
    async navigateTo(moduleName: string) {
        const entry = this.navMap[moduleName];
        if (!entry) throw new Error(`Unsupported module: ${moduleName}`);

        const navLocator = this.page.locator(entry.nav).first();

        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                await navLocator.waitFor({ state: 'visible', timeout: 30000 });
                await this.pause(2000);
                await navLocator.click();
                await this.waitForNetworkIdle();
                await this.pause(1000);

                // Close sidebar hover
                await this.page.locator(this.sel.closeBody).hover().catch(() => {});
                await this.pause(500);

                // Wait for URL to contain the path hint
                await this.waitForUrlContains(entry.pathHint);
                return;
            } catch (err) {
                if (attempt === 2) throw new Error(`Failed to navigate to ${moduleName} after 2 attempts: ${err}`);
                await this.pause(2000);
            }
        }
    }

    /** Wait for any nav element to become visible (indicates successful login). */
    async waitForAnyNavVisible(timeoutMs = 60000): Promise<boolean> {
        const selectors = [
            this.sel.navDashboard, this.sel.navSettings, this.sel.navAudience,
            this.sel.navCampaign, this.sel.navWorkflow, this.sel.navLibrary,
        ];
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            for (const s of selectors) {
                const visible = await this.page.locator(s).first().isVisible().catch(() => false);
                if (visible) return true;
            }
            await this.pause(500);
        }
        return false;
    }

    /** Check the URL contains a path hint within a timeout. */
    private async waitForUrlContains(hint: string, timeoutMs = 10000) {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            if (this.page.url().toLowerCase().includes(hint.toLowerCase())) return;
            await this.pause(500);
        }
        throw new Error(`URL did not contain "${hint}" within ${timeoutMs}ms`);
    }
}
