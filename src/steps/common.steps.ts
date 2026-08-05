
import { Given, When, Then } from '@cucumber/cucumber';
import * as fs from 'fs';
import * as path from 'path';
import { LoginPage } from '../pages/login.page';
import { NavigationBar } from '../pages/components/navigation-bar.component';
import { acquireUser } from '../utils/user-pool';
import { ExtentTestManager } from '../utils/extent-test-manager';
import { PlaywrightWorld } from '../support/world';

const sanitizeFileName = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, '_');

const getStoragePath = (username: string) => {
    const authDir = path.join(process.cwd(), 'data', 'auth');
    if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true });
    }
    return path.join(authDir, `${sanitizeFileName(username)}.json`);
};

// ─── Login Logic (uses LoginPage + NavigationBar) ────────────────────────────

const loginIfNeeded = async (page: any, username: string, password: string) => {
    const loginPage = new LoginPage(page);
    const navBar = new NavigationBar(page);

    await loginPage.goto();

    const loginVisible = await loginPage.isLoginFormVisible();
    if (!loginVisible) {
        return false;
    }

    await loginPage.login(username, password);

    const navReady = await navBar.waitForAnyNavVisible(60000);
    if (!navReady) {
        throw new Error('Timed out waiting for main navigation after login (60s).');
    }

    return true;
};

Then('I close the announcement popup if it appears', async function (this: PlaywrightWorld) {
    // Handled automatically by Playwright's native page.addLocatorHandler registered in createSession
    ExtentTestManager.logInfo("Announcement popup auto-handler active.");
});

const createSession = async (world: PlaywrightWorld, username: string, password: string) => {
    const isHeadless = process.env.HEADLESS === 'true';
    const storagePath = getStoragePath(username);
    const contextOptions: any = isHeadless
        ? { viewport: { width: 1920, height: 1080 } }
        : { viewport: null };
    if (fs.existsSync(storagePath)) {
        contextOptions.storageState = storagePath;
    }

    if (!world.browser) throw new Error("Browser not initialized");
    const context = await world.browser.newContext(contextOptions);
    const page = await context.newPage();
    
    // Playwright native handler: Automatically detects and closes announcement popup whenever it appears
    await page.addLocatorHandler(
        page.locator('[data-testid="announcement-modal-close-button"]'),
        async (closeBtn) => {
            console.log("[Playwright Auto-Handler] Announcement popup detected! Dispatching direct DOM click events...");
            // 1. Direct DOM click on close button (bypasses CSS 70% zoom calculation issues)
            await closeBtn.evaluate((el: HTMLElement) => {
                el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
                el.click();
            }).catch(() => {});
            
            // 2. Direct DOM click on backdrop overlay (mimics manual click outside)
            await page.evaluate(() => {
                const backdrop = document.querySelector('.fixed.inset-0.bg-opacity-75') as HTMLElement;
                if (backdrop) {
                    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
                    backdrop.click();
                }
            }).catch(() => {});
        }
    );

    // Set global timeouts to 60 seconds (up from the default 30s)
    page.setDefaultTimeout(60000);
    page.setDefaultNavigationTimeout(60000);
    const didLogin = await loginIfNeeded(page, username, password);
    if (!isHeadless) {
        await page.evaluate(() => {
            if (document.body) {
                (document.body.style as any).zoom = '70%';
            }
        }).catch(() => { });
    }
    if (didLogin || !fs.existsSync(storagePath)) {
        await context.storageState({ path: storagePath });
    }
    return { username, context, page };
};

const RETRYABLE_LOGIN_ERRORS = [
    'timeout',
    'networkidle',
    'net::',
    'ERR_',
    'navigation',
    'waiting for main navigation',
    'context was destroyed',
    'target closed',
];

const isRetryableLoginError = (err: Error): boolean =>
    RETRYABLE_LOGIN_ERRORS.some(keyword => err.message.toLowerCase().includes(keyword.toLowerCase()));

async function loginForModule(this: PlaywrightWorld, moduleName: string) {
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 3000;

    if (!this.user) {
        const { user, lockFile } = await acquireUser({ timeoutMs: 120000 });
        this.user = user;
        this.userLockFile = lockFile;
        ExtentTestManager.logInfo(`User acquired for scenario: ${user.username}`);
    }

    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            if (attempt === 1) {
                // First attempt: full fresh context
                if (this.context) {
                    await this.page!.close().catch(() => { });
                    await this.context.close().catch(() => { });
                }
                const session = await createSession(this, this.user.username, this.user.password);
                this.context = session.context;
                this.page = session.page;
                this.username = session.username;
            } else {
                const pageUnusable = !this.page || this.page.isClosed();

                if (pageUnusable) {
                    // Attempt 1 threw before assigning this.page — close any orphaned context and start fresh
                    ExtentTestManager.logInfo(`Login retry ${attempt}/${MAX_RETRIES} — page unavailable, creating fresh context`);
                    if (this.context) {
                        await this.context.close().catch(() => { });
                        this.context = null;
                        this.page = null;
                    }
                    const session = await createSession(this, this.user.username, this.user.password);
                    this.context = session.context;
                    this.page = session.page;
                    this.username = session.username;
                } else {
                    // Page is alive — reuse existing context, just reload login and re-fill
                    ExtentTestManager.logInfo(`Login retry ${attempt}/${MAX_RETRIES} — reusing context, reloading login page`);
                    const loginPage = new LoginPage(this.page!);
                    const navBar = new NavigationBar(this.page!);

                    await loginPage.goto();
                    const loginVisible = await loginPage.isLoginFormVisible();
                    if (!loginVisible) {
                        // Already logged in (session recovered) — nothing to do
                        ExtentTestManager.logInfo('Session recovered — login form not visible on retry');
                    } else {
                        await loginPage.login(this.user.username, this.user.password!);
                        const navReady = await navBar.waitForAnyNavVisible(60000);
                        if (!navReady) {
                            throw new Error('Timed out waiting for main navigation after retry login (60s).');
                        }
                    }
                    this.username = this.user.username;
                }
            }

            if (attempt > 1) {
                ExtentTestManager.logInfo(`Login succeeded on attempt ${attempt}/${MAX_RETRIES}`);
            }
            return;
        } catch (err: any) {
            lastError = err;
            if (!isRetryableLoginError(err)) {
                ExtentTestManager.logInfo(`Login failed with non-retryable error: ${err.message}`);
                break;
            }
            ExtentTestManager.logInfo(`Login attempt ${attempt}/${MAX_RETRIES} failed (retryable): ${err.message}`);
            if (attempt < MAX_RETRIES) {
                await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
            }
        }
    }
    throw lastError || new Error('Login failed after retries');
}

// ─── Step Definitions ────────────────────────────────────────────────────────

Given('I log in for module {string} with users:', async function (this: PlaywrightWorld, moduleName: string, dataTable: any) {
    ExtentTestManager.logInfo('Deprecated step: ignoring inline user table; using config/users.json user pool.');
    await loginForModule.call(this, moduleName);
});

Given('I log in for module {string}', async function (this: PlaywrightWorld, moduleName: string) {
    await loginForModule.call(this, moduleName);
});

When('I navigate to {string}', async function (this: PlaywrightWorld, moduleName: string) {
    ExtentTestManager.logInfo(`Navigating to ${moduleName}`);
    const navBar = new NavigationBar(this.page!);
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await navBar.navigateTo(moduleName);
            await this.page!.waitForLoadState('domcontentloaded');
            await this.page!.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => { });
            await this.page!.waitForTimeout(1000); // Settle buffer for React/Vue hydration
            ExtentTestManager.logPass(`Navigated to ${moduleName} (attempt ${attempt})`);
            return;
        } catch (err) {
            lastError = err as Error;
            console.log(`[Navigation] Attempt ${attempt} to ${moduleName} failed: ${lastError.message}`);
            if (attempt < maxRetries) {
                await this.page!.waitForTimeout(2000);
                await this.page!.reload({ waitUntil: 'networkidle' }).catch(() => { });
                await this.page!.waitForTimeout(2000);
            }
        }
    }

    throw lastError || new Error(`Failed to navigate to ${moduleName} after ${maxRetries} attempts`);
});

Then('I should see the {string} page', async function (this: PlaywrightWorld, moduleName: string) {
    // Navigation already verified in navigateTo — just confirm via URL
    const pathHints: Record<string, string> = {
        Dashboard: 'dashboard', Settings: 'setting', Audience: 'audience',
        Campaign: 'campaign', Workflow: 'workflow',
    };
    const hint = pathHints[moduleName];
    if (hint && !this.page!.url().toLowerCase().includes(hint)) {
        throw new Error(`Expected URL to contain "${hint}" but got: ${this.page!.url()}`);
    }
    ExtentTestManager.logPass(`${moduleName} page loaded successfully`);
});
