
import { After, AfterAll, AfterStep, Before, BeforeStep, Status } from '@cucumber/cucumber';
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { ExtentTestManager } from '../utils/extent-test-manager';
import * as Helper from '../utils/helper';
import { releaseLock } from '../utils/user-pool';
import { PlaywrightWorld } from './world';

let sharedBrowser: Browser | null = null;

const getScenarioScreenshotMode = (): string => {
    const mode = String(process.env.SCENARIO_SCREENSHOTS || 'always').toLowerCase();
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

// ─── Auto-skip remaining steps when limit reached ────────────────────────────
BeforeStep(async function (this: PlaywrightWorld, { pickleStep }: any) {
    if (this.limitReached) {
        console.log(`[LimitReached] ⏭️ Skipping step: ${pickleStep.text}`);
        ExtentTestManager.logInfo(`⏭️ Skipped (limit reached): ${pickleStep.text}`);
        return 'skipped';
    }
});

Before(async function (this: any, scenario: any) {
    // SET THE TEST CONTEXT FOR EXTENT REPORT
    ExtentTestManager.setTest(this);

    this._hasFailureScreenshot = false;

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

    // ✅ Capture screenshot for FAILED steps (always)
    if (status === Status.FAILED) {
        await Helper.captureScreenshot(this, {
            label: `FAILED: ${stepText}`,
            writeToDisk: true, // Save to disk for failures
            filePrefix: `STEP-FAILED-${stepText.replace(/[^a-zA-Z0-9]/g, '_')}`,
        });
    }

    // ✅ Capture screenshot for PASSED steps (if you want)
    else if (status === Status.PASSED) {
        await Helper.captureScreenshot(this, {
            label: `PASSED: ${stepText}`,
            writeToDisk: false, // Don't clutter disk with passed screenshots
            filePrefix: `STEP-PASSED-${stepText.replace(/[^a-zA-Z0-9]/g, '_')}`,
        });
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
