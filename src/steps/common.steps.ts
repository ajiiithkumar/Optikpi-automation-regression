
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
    if (!isHeadless) {
        await page.evaluate(() => {
            (document.body.style as any).zoom = '70%';
        });
    }
    const didLogin = await loginIfNeeded(page, username, password);
    if (didLogin || !fs.existsSync(storagePath)) {
        await context.storageState({ path: storagePath });
    }
    return { username, context, page };
};

async function loginForModule(this: PlaywrightWorld, moduleName: string) {
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 3000;

    if (!this.user) {
        const { user, lockFile } = await acquireUser({ timeoutMs: 3600000 });
        this.user = user;
        this.userLockFile = lockFile;
        ExtentTestManager.logInfo(`User acquired for scenario: ${user.username}`);
    }

    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            if (this.context) {
                await this.page!.close().catch(() => {});
                await this.context.close().catch(() => {});
            }

            const session = await createSession(this, this.user.username, this.user.password);
            this.context = session.context;
            this.page = session.page;
            this.username = session.username;
            if (attempt > 1) {
                ExtentTestManager.logInfo(`Login succeeded on attempt ${attempt}/${MAX_RETRIES}`);
            }
            return;
        } catch (err: any) {
            lastError = err;
            ExtentTestManager.logInfo(`Login attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`);
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
            ExtentTestManager.logPass(`Navigated to ${moduleName} (attempt ${attempt})`);
            return;
        } catch (err) {
            lastError = err as Error;
            console.log(`[Navigation] Attempt ${attempt} to ${moduleName} failed: ${lastError.message}`);
            if (attempt < maxRetries) {
                await this.page!.waitForTimeout(2000);
                await this.page!.reload({ waitUntil: 'networkidle' }).catch(() => {});
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
