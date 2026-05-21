import { setWorldConstructor, setDefaultTimeout, World, IWorldOptions } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page } from 'playwright';

// Increase default step timeout to 120 seconds
setDefaultTimeout(120 * 1000);

export class PlaywrightWorld extends World {
    browser: Browser | null = null;
    context: BrowserContext | null = null;
    page: Page | null = null;
    user: any = null;
    userLockFile: string | null = null;
    scenarioTag: string = '';
    scenarioTags: string[] = [];
    /** First @REG-CAMP-* on the scenario (for names.json reads). When two tags are present (e.g. @REG-CAMP-01 @REG-CAMP-18), this is the producer data key; scenarioTag is the last REG-CAMP (scenario id). */
    campaignNamesJsonKey: string = '';
    [key: string]: any;

    constructor(options: IWorldOptions) {
        super(options);
    }

    // Helper method to attach screenshots (optional but recommended)
    async attachScreenshot(screenshot: Buffer, name?: string): Promise<void> {
        await this.attach(screenshot, {
            mediaType: 'image/png',
            fileName: name || `screenshot-${Date.now()}.png`
        });
    }

    // Helper method to attach text logs (optional)
    async attachLog(message: string): Promise<void> {
        await this.attach(message, 'text/plain');
    }
}

setWorldConstructor(PlaywrightWorld);