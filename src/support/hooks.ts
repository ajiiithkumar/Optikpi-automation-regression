
import { After, AfterAll, AfterStep, Before, BeforeStep, Status } from '@cucumber/cucumber';
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { ExtentTestManager } from '../utils/extent-test-manager';
import * as Helper from '../utils/helper';
import { releaseLock } from '../utils/user-pool';
import { PlaywrightWorld } from './world';

let sharedBrowser: Browser | null = null;

const getScenarioScreenshotMode = (): string => {
    const mode = String(process.env.SCENARIO_SCREENSHOTS || 'failed').toLowerCase();
    if (mode === 'always' || mode === 'all') return 'always';
    if (mode === 'never' || mode === 'off' || mode === 'none') return 'never';
    return 'failed';
};

const shouldCaptureScenario = (status: any): boolean => {
    const mode = getScenarioScreenshotMode();
    if (mode === 'never') return false;
    if (mode === 'always') return true;
    return status === Status.FAILED;
};

const shouldCaptureStep = (status: any): boolean => {
    return status === Status.PASSED || status === Status.FAILED;
};

BeforeStep(async function (this: PlaywrightWorld, { pickleStep }: any) {
    if (this.limitReached) {
        console.log(`[LimitReached] ⏭️ Skipping step: ${pickleStep.text}`);
        ExtentTestManager.logInfo(`⏭️ Skipped (limit reached): ${pickleStep.text}`);
        return 'skipped';
    }

    // Inject Global Error Observer and Network Listener once per page
    if (this.page && !this._globalErrorListenerAttached) {
        this._globalErrorListenerAttached = true;
        
        // Network Level Listener for 5xx errors
        this.globalApiErrors = [];
        this.page.on('response', response => {
            const status = response.status();
            // Catch 500, 502, 503, 504 etc. Ignore 400 validation errors.
            if (status >= 500 && status < 600) {
                this.globalApiErrors.push(`API Error ${status} on ${response.url()}`);
            }
        });

        // UI Level DOM Observer for critical error text
        const initScript = `
            window.__criticalTestErrors = [];
            const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                const text = node.textContent || '';
                                if (/unexpected error|internal server error|failed to load/i.test(text)) {
                                    window.__criticalTestErrors.push(text.trim());
                                }
                            }
                        });
                    }
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        `;
        
        await this.page.addInitScript(initScript);
        // Also evaluate on the current page immediately (in case addInitScript missed the first load)
        await this.page.evaluate(initScript).catch(() => {});
    }
});

Before(async function (this: any, scenario: any) {
    // SET THE TEST CONTEXT FOR EXTENT REPORT
    ExtentTestManager.setTest(this);

    this._hasFailureScreenshot = false;
    this._screenshotTaken = false; // Track if at least one screenshot was taken this scenario

    // Extract all scenario tags and the unique identifier tag
    const tags: any[] = scenario?.pickle?.tags || [];
    const allTags = tags.map((t: any) => String(t.name || '').replace('@', ''));
    this.scenarioTags = allTags;
    const campTags = allTags.filter((t: string) => /^REG-CAMP-\w+$/.test(t));
    const audienceRegId = allTags.find((t: string) =>
        /^REG-AUD-\d+$/.test(t) || /^TestPreparation$/.test(t));
    const regModuleId = allTags.find((t: string) =>
        /^REG-(DASH|SET|WORKFLOW)-\d+$/.test(t));
    this.scenarioTag = audienceRegId || regModuleId || (campTags.length > 0 ? campTags[campTags.length - 1] : '');
    this.campaignNamesJsonKey = campTags.length > 0 ? campTags[0] : '';

    if (!sharedBrowser) {
        const headless = process.env.HEADLESS === 'true' || this.parameters?.headless === true;
        sharedBrowser = await chromium.launch({
            headless,
            args: [
                '--start-maximized',
                '--window-size=1920,1080'
            ]
        });
    }

    this.browser = sharedBrowser;
});

AfterStep(async function (this: PlaywrightWorld, { result, pickleStep }: any) {
    const status = result.status;
    const stepText = pickleStep.text;

    if (!this.page) return;

    // Check for API errors (5xx)
    // IGNORED FOR NOW as requested by user
    /*
    if (this.globalApiErrors && this.globalApiErrors.length > 0) {
        const errs = this.globalApiErrors.join(', ');
        this.globalApiErrors = []; // Reset so it doesn't fail subsequent steps
        throw new Error(`CRITICAL NETWORK ERROR: HTTP 5xx detected during step "${stepText}". Details: ${errs}`);
    }
    */

    // Check for UI errors (DOM Toasts)
    const uiErrors = await this.page.evaluate(() => {
        const win = window as any;
        const errors = win.__criticalTestErrors || [];
        win.__criticalTestErrors = []; // Reset after reading
        return errors;
    }).catch(() => []);

    if (uiErrors.length > 0) {
        // Capture screenshot FIRST so the error state is visible in the report
        await Helper.captureScreenshot(this, {
            label: `CRITICAL ERROR: ${stepText}`,
            writeToDisk: true,
            filePrefix: `STEP-FAILED-${stepText.replace(/[^a-zA-Z0-9]/g, '_')}`,
        }).catch(() => {}); // Don't let screenshot failure mask the real error
        (this as any)._screenshotTaken = true;
        throw new Error(`CRITICAL SYSTEM ERROR: An unexpected UI error was detected during step "${stepText}". Details: ${uiErrors.join(', ')}`);
    }

    // ✅ Capture screenshot for FAILED steps (always)
    if (status === Status.FAILED) {
        await Helper.captureScreenshot(this, {
            label: `FAILED: ${stepText}`,
            writeToDisk: true,
            filePrefix: `STEP-FAILED-${stepText.replace(/[^a-zA-Z0-9]/g, '_')}`,
        });
        (this as any)._screenshotTaken = true;
    }

    // ✅ Capture screenshot for Verify/Check/Should/Confirm steps + specific named steps
    else if (status === Status.PASSED) {
        const isVerifyStep =
            /^(verify|check|should|confirm|all expected|a field)/i.test(stepText.trim()) ||
            /\b(visible and clickable|validation message|should be displayed|should be visible)\b/i.test(stepText);
        if (isVerifyStep) {
            await this.page.waitForTimeout(300); // Let page settle before screenshot
            await Helper.captureScreenshot(this, {
                label: `PASSED: ${stepText}`,
                writeToDisk: false,
                filePrefix: `STEP-PASSED-${stepText.replace(/[^a-zA-Z0-9]/g, '_')}`,
            });
            (this as any)._screenshotTaken = true;
        }
    }
});

After(async function (this: any, scenario: any) {
    const status = scenario.result?.status || Status.UNKNOWN;
    const name = scenario.pickle.name;

    if (status === Status.PASSED || status === Status.FAILED) {
        if (shouldCaptureScenario(status)) {
            const mode = getScenarioScreenshotMode();
            if (!(mode === 'failed' && status === Status.FAILED && this._hasFailureScreenshot)) {
                const statusLabel = status === Status.PASSED ? 'PASSED' : 'FAILED';
                await Helper.captureScreenshot(this, {
                    label: `Scenario: ${name} | Status: ${statusLabel}`,
                    writeToDisk: false,
                    filePrefix: `SCENARIO-${statusLabel}-${name.replace(/[^a-zA-Z0-9]/g, '_')}`,
                    attachToReport: true
                });
            }
        }

        // ✅ Guarantee at least one screenshot per scenario
        // If no Verify/Check step was found during the scenario, take one final screenshot now
        if (!this._screenshotTaken && this.page && status === Status.PASSED) {
            await Helper.captureScreenshot(this, {
                label: `Scenario End: ${name}`,
                writeToDisk: false,
                filePrefix: `SCENARIO-END-${name.replace(/[^a-zA-Z0-9]/g, '_')}`,
                attachToReport: true
            });
        }
    }

    if (status === Status.PASSED) {
        const keysToMark: string[] = [];
        if (this.scenarioTag) keysToMark.push(this.scenarioTag);
        if (this.scenarioTags?.includes('ExistingAudience')) {
            keysToMark.push('existingAudience', 'audience');
        }
        if (/^REG-CAMP-/.test(this.scenarioTag || '')) keysToMark.push('campaign');
        if (keysToMark.length) await Helper.markNameEntryCompleted(keysToMark);
    }

    // Cleanup
    ExtentTestManager.removeTest();

    if (this.page) {
        await this.page.close().catch(() => { });
        this.page = null;
    }
    if (this.context) {
        await this.context.close().catch(() => { });
        this.context = null;
    }
    if (this.userLockFile) {
        releaseLock(this.userLockFile);
        this.userLockFile = null;
    }
    this.user = null;
});

AfterAll(async function () {
    if (sharedBrowser) {
        await sharedBrowser.close();
        sharedBrowser = null;
    }
});
