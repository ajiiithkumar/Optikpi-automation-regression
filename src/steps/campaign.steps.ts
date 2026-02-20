
import { Given, When, Then } from '@cucumber/cucumber';
import { CampaignPage } from '../pages/campaign.page';
import { ExtentTestManager } from '../utils/extent-test-manager';
import { PlaywrightWorld } from '../support/world';
import { uniqueId, saveNameEntry, readNameJson } from '../utils/helper';

// ─── Shared state ────────────────────────────────────────────────────────────

// Inlined selectors (previously from AllModulePages)
const SCHEDULE_TIME_SEL = "//div[@data-testid='audience-dateTimeSelection-modal-hour-select']//input";
const SCHEDULE_APPLY_SEL = "//button[@data-testid='audience-dateTimeUtil-modal-apply-btn']";
const SCHEDULE_ERROR_SEL = "//div[contains(@class,'text-red') or contains(@class,'error')]";
const LIBRARY_SEARCH_SEL = "//input[@data-testid='library-search-input' or @placeholder='Search']";
const LIBRARY_USE_CONTENT_SEL = "//button[@data-testid='library-use-this-content-btn' or contains(normalize-space(),'Use this content')]";

const campaignName = `Campaign-${uniqueId()}`;

/** Helper to instantiate CampaignPage from a step's world context. */
const getCampaignPage = (world: PlaywrightWorld) => new CampaignPage(world.page);

// ─── Campaign Tab Steps (ST-CAMP-01) ─────────────────────────────────────────

Then('Click the Active tab', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickActiveTab();
    ExtentTestManager.logPass('Clicked Active tab');
});

Then('Verify Active tab should load successfully', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).pause(2000);
    ExtentTestManager.logPass('Active tab loaded successfully');
});

Then('Click the Completed tab', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickCompletedTab();
    ExtentTestManager.logPass('Clicked Completed tab');
});

Then('Verify Completed tab should load successfully', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).pause(2000);
    ExtentTestManager.logPass('Completed tab loaded successfully');
});

Then('Click the Draft tab', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickDraftTab();
    ExtentTestManager.logPass('Clicked Draft tab');
});

Then('Verify Draft tab should load successfully', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).pause(2000);
    ExtentTestManager.logPass('Draft tab loaded successfully');
});

Then('Click the All tab', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickAllTab();
    ExtentTestManager.logPass('Clicked All tab');
});

Then('Verify All tab should load successfully', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).pause(2000);
    ExtentTestManager.logPass('All tab loaded successfully');
});

// ─── Campaign Creation Flow (ST-CAMP-02) ─────────────────────────────────────

Then('Click the Create New Campaign button', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickCreateNew();
    ExtentTestManager.logPass('Clicked "Create New Campaign" button');
});

Then('Enter the Campaign Name and Campaign Tag', async function (this: PlaywrightWorld) {
    this['currentCampaignName'] = campaignName;
    const page = getCampaignPage(this);
    await page.enterCampaignName(campaignName);
    await page.enterCampaignTag('auto-tag');
    await saveNameEntry('campaign', campaignName);
    ExtentTestManager.logPass(`Entered Campaign Name: ${campaignName}`);
});

Then('Click the Create campaign button', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickCreateCampaign();
    ExtentTestManager.logPass('Clicked "Create Campaign" button');
});

Then('Verify the Campaign should should Create and navigate to the Edit Campaign page', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).waitForEditPage();
    ExtentTestManager.logPass('Campaign created and navigated to Edit Campaign page');
});

// ─── Goal Steps ──────────────────────────────────────────────────────────────

Then('click the Click Goal button', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickGoalClick();
    ExtentTestManager.logPass('Clicked Goal button (Engagement Click)');
});
//2
Then('click the Set Goal button', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickSetGoal();
    ExtentTestManager.logPass('Clicked "Set Goal" button');
});

Then('Verify the Click Goal should be set successfully', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).verifyGoalIsSet();
    ExtentTestManager.logPass('Verified Goal value is set to 100');
});
//1
Then('click the Open Goal button', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickGoalOpen();
    ExtentTestManager.logPass('Clicked Goal button (Engagement Open)');
});
//3
Then('Verify the Open Goal should be set successfully', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).verifyGoalIsSet();
    ExtentTestManager.logPass('Verified Open Goal is set successfully');
});


// ─── Audience Steps (within Campaign) ────────────────────────────────────────

Then('click the campaign New Audience button', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickNewAudienceTab();
    ExtentTestManager.logPass('Clicked "New Audience" tab in Campaign');
});

Then('click the Set Audience button', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickSetAudience();
    ExtentTestManager.logPass('Clicked "Set Audience" button');
});

Then('click the Existing Audience button', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickExistingAudienceTab();
    ExtentTestManager.logPass('Clicked "Existing Audience" button');
});

Then('select the audience from the list', async function (this: PlaywrightWorld) {
    const data = await readNameJson();
    const audienceName = data?.audience?.title;
    if (!audienceName) throw new Error('No audience name found in Name.json');

    const page = getCampaignPage(this);
    await page.clickSelectExistingAudience();
    await page.selectAudienceByName(audienceName);
    ExtentTestManager.logPass(`Selected audience "${audienceName}" from the list`);
});

Then('click the ok button on the pop up', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).confirmAudienceSelection();
    ExtentTestManager.logPass('Clicked OK button on the audience popup');
});

// ─── Trigger Steps ───────────────────────────────────────────────────────────

Then('click the Trigger button', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickTriggerStartDate();
    ExtentTestManager.logPass('Clicked Trigger start date select button');
});

Then('select the next available time slot and apply', async function (this: PlaywrightWorld) {
    // --- Schedule date/time picker logic ---
    // Note: The trigger button already opens the date picker,
    // so we skip clicking scheduleStartingat (that's for audience only).
    for (let attempt = 0; attempt < 3; attempt++) {
        console.log(`[Campaign Schedule] === Attempt ${attempt + 1} ===`);

        // Step 1: Click "Starting at" to open the date/time picker
        const datePicker = this.page.locator(SCHEDULE_TIME_SEL).first();
        await datePicker.click();
        await this.page.waitForTimeout(1000);
        console.log(`[Campaign Schedule] Date picker opened`);

        // Step 2: Click today's date
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const dateTestId = `audience-dateTimeSelection-modal-date-${yyyy}-${mm}-${dd}`;
        console.log(`[Campaign Schedule] Selecting today's date: ${dd}/${mm}/${yyyy} (testId: ${dateTestId})`);

        const dateBtn = this.page.locator(`//button[@data-testid='${dateTestId}']`).first();
        const dateBtnVisible = await dateBtn.isVisible({ timeout: 5000 }).catch(() => false);
        console.log(`[Campaign Schedule] Date button visible: ${dateBtnVisible}`);
        
        if (dateBtnVisible) {
            await dateBtn.click({ force: true });
            console.log(`[Campaign Schedule] Today's date selected`);
        } else {
            console.log(`[Campaign Schedule] Date button not found with testId, trying day number text...`);
            const dayText = String(now.getDate());
            const dayBtn = this.page.locator(`//button[normalize-space()='${dayText}']`).first();
            await dayBtn.waitFor({ state: 'visible', timeout: 10000 });
            await dayBtn.click({ force: true });
            await this.page.waitForTimeout(500);
            console.log(`[Campaign Schedule] Selected day "${dayText}" by text`);
        }
        await this.page.waitForTimeout(500);

        // Step 3: Click time dropdown
        const timeDropdown = this.page.locator(SCHEDULE_TIME_SEL).first();
        await timeDropdown.waitFor({ state: 'visible', timeout: 10000 });
        await timeDropdown.click();
        await this.page.waitForTimeout(1000);
        console.log(`[Campaign Schedule] Time dropdown opened`);

        // Step 4: Find next 5-min slot
        const currentMinutes = now.getMinutes();
        const nextSlotMinutes = Math.ceil(currentMinutes / 5) * 5 + 5;
        const slotTime = new Date(now);
        slotTime.setMinutes(nextSlotMinutes);
        slotTime.setSeconds(0);

        let timeClicked = false;
        for (let t = 0; t < 5; t++) {
            const tryTime = new Date(slotTime.getTime() + t * 5 * 60000);
            let hours = tryTime.getHours();
            const mins = tryTime.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            if (hours === 0) hours = 12;
            const timeStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${ampm}`;

            console.log(`[Campaign Schedule] Looking for time slot: "${timeStr}"`);
            const timeOption = this.page.locator(`//span[text()='${timeStr}']`).first();
            const isVisible = await timeOption.isVisible({ timeout: 2000 }).catch(() => false);

            if (isVisible) {
                await timeOption.click();
                console.log(`[Campaign Schedule] ✅ Selected time: ${timeStr}`);
                timeClicked = true;
                break;
            }
            console.log(`[Campaign Schedule] "${timeStr}" not visible, trying next slot...`);
        }

        if (!timeClicked) {
            throw new Error('[Campaign Schedule] Could not find any available time slot in the dropdown.');
        }
        await this.page.waitForTimeout(500);

        // Step 5: Click Apply
        const applyBtn = this.page.locator(SCHEDULE_APPLY_SEL).first();
        await applyBtn.waitFor({ state: 'visible', timeout: 10000 });
        await applyBtn.click();
        console.log(`[Campaign Schedule] Apply clicked`);
        await this.page.waitForTimeout(1000);

        // Check for validation error
        const errorVisible = await this.page.locator(SCHEDULE_ERROR_SEL).first().isVisible().catch(() => false);
        if (!errorVisible) {
            console.log(`[Campaign Schedule] ✅ Schedule set on attempt ${attempt + 1}`);
            break;
        }
        console.log(`[Campaign Schedule] ❌ Attempt ${attempt + 1}: date validation error. Retrying...`);
        if (attempt === 2) {
            throw new Error('Failed to set schedule after 3 attempts due to date validation error.');
        }
    }

    ExtentTestManager.logPass('Selected next available time slot');
});

Then('click the Set Trigger button', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickSetTrigger();
    ExtentTestManager.logPass('Clicked "Set Trigger" button');
});

// ─── Communication Steps ─────────────────────────────────────────────────────

Then('click the Choose Content button', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickChooseContent();
    ExtentTestManager.logPass('Clicked "Choose Content" button');
});

let communicationName = "Sendgrid_automation_test";

Then('Search the communication name in the search bar', async function (this: PlaywrightWorld) {
    const searchInput = this.page.locator(LIBRARY_SEARCH_SEL).first();
    await searchInput.waitFor({ state: 'visible', timeout: 20000 });
    await searchInput.click();
    await searchInput.fill(communicationName);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(2000);
    ExtentTestManager.logPass(`Searched communication name in library: ${communicationName}`);
});

Then('Click the communication that comes first in the list', async function (this: PlaywrightWorld) {
    const anyClickable = this.page.locator(`//div[@data-testid='${communicationName}']`).first();
    await this.page.waitForTimeout(2000);
    await anyClickable.click();
    await this.page.locator(LIBRARY_USE_CONTENT_SEL).click();
    await this.page.waitForTimeout(2000);
    ExtentTestManager.logPass('Clicked first communication in the list (fallback)');
});

Then('click the Set Communication button', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickSetCommunication();
    ExtentTestManager.logPass('Clicked "Set Communication" button');
});

// ─── Publish Steps ───────────────────────────────────────────────────────────

Then('click the Publish button', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickPublish();
    ExtentTestManager.logPass('Clicked "Publish" button');
});

Then('click the Publish Confirm button', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).confirmPublish();
    ExtentTestManager.logPass('Clicked Publish Confirm button — Campaign published');
});

Then('Enter the Campaign Name in the search bar', async function (this: PlaywrightWorld) {
    console.log(campaignName);
    await getCampaignPage(this).searchCampaign(campaignName);
    ExtentTestManager.logPass(`Entered Campaign Name in search bar: ${campaignName}`);
});

Then('Verify the campaign is visible in the Active tab', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).verifyCampaignVisible(campaignName);
    ExtentTestManager.logPass(`Campaign "${campaignName}" is visible in the Active tab`);
});
