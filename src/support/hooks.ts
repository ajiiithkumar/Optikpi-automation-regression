
import { After, AfterAll, AfterStep, Before, Status } from '@cucumber/cucumber';
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

Before(async function (this: any, scenario: any) {
    // SET THE TEST CONTEXT FOR EXTENT REPORT
    ExtentTestManager.setTest(this);

    this._hasFailureScreenshot = false;

    if (!sharedBrowser) {
        const headless = process.env.HEADLESS === 'true' || this.parameters?.headless === true;
        sharedBrowser = await chromium.launch({
            headless,
            args: [
                '--start-maximized',
                '--window-size=1920,1080',
                '--disable-gpu',
                '--disable-software-rasterizer'
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
