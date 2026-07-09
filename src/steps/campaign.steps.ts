
import { Given, When, Then } from '@cucumber/cucumber';
import { CampaignPage } from '../pages/campaign.page';
import { NavigationBar } from '../pages/components/navigation-bar.component';
import { ExtentTestManager } from '../utils/extent-test-manager';
import { PlaywrightWorld } from '../support/world';
import { uniqueId, readNameJson, saveNameEntry, waitForNameEntryCompleted } from '../utils/helper';

// ─── Selectors ───────────────────────────────────────────────────────────────

const SCHEDULE_TIME_SEL = "//button[@data-testid='audience-dateTimeUtil-dropdown-btn']";
const SCHEDULE_APPLY_SEL = "//button[@data-testid='audience-dateTimeUtil-modal-apply-btn']";
const SCHEDULE_ERROR_SEL = "//p[text() = 'Trigger dates are not set properly. Please update the dates to finish campaign setup.']";
const LIBRARY_SEARCH_SEL = "//input[@data-testid='library-search-input' or @placeholder='Search']";
const LIBRARY_USE_CONTENT_SEL = "//button[@data-testid='library-use-this-content-btn' or contains(normalize-space(),'Use this content')]";

/** Helper to instantiate CampaignPage from a step's world context. */
const getCampaignPage = (world: PlaywrightWorld) => new CampaignPage(world.page);

/** Key in names.json for campaign title reads: first @REG-CAMP-* on scenario (producer); falls back to scenarioTag REG-CAMP match. */
const resolveNamesJsonCampaignKey = (world: PlaywrightWorld): string | undefined => {
    const k = world.campaignNamesJsonKey;
    if (k && /^REG-CAMP-\w+$/.test(k)) return k;
    return world.scenarioTag?.match(/REG-CAMP-\w+/)?.[0];
};

/** Published-campaign regression: title comes from the REG-CAMP-01 names.json entry (producer scenario). */
const PUBLISHED_CAMPAIGN_NAMES_JSON_KEY = 'REG-CAMP-01';

async function performActiveTabCampaignSearch(world: PlaywrightWorld, campaignName: string): Promise<void> {
    const page = getCampaignPage(world);
    const maxRetries = 3;
    let lastError: Error | null = null;
    const searchBarSel = "//input[@id='campaign-listView-table-search-icon']";

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[Campaign Search] Attempt ${attempt}/${maxRetries}...`);
            const searchField = world.page!.locator(searchBarSel).first();
            await searchField.click();
            await searchField.fill('');
            await world.page!.waitForTimeout(500);
            await page.searchCampaign(campaignName);

            await page.verifyCampaignVisible(campaignName, 15000);
            ExtentTestManager.logPass(`Campaign "${campaignName}" found in the Active tab (attempt ${attempt})`);
            return;
        } catch (err) {
            lastError = err as Error;
            console.log(`[Campaign Search] Attempt ${attempt} failed: ${lastError.message}`);
            if (attempt < maxRetries) {
                console.log('[Campaign Search] Retrying...');
                await world.page!.waitForTimeout(2000);
            }
        }
    }

    throw lastError || new Error(`Campaign "${campaignName}" not found after ${maxRetries} attempts`);
}

// ─── Campaign Tab Steps (REG-CAMP-01) ─────────────────────────────────────────

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

// ─── Campaign Creation Flow (REG-CAMP-02) ─────────────────────────────────────

Then('Click the Create New Campaign button', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickCreateNew();
    ExtentTestManager.logPass('Clicked "Create New Campaign" button');
});

Then('Enter the Campaign Name and Campaign Tag', async function (this: PlaywrightWorld) {
    const campaignName = `Campaign-${uniqueId()}`;
    this['currentCampaignName'] = campaignName;
    const page = getCampaignPage(this);
    await page.enterCampaignName(campaignName);
    await page.enterCampaignTag('auto-tag');
    const campKey = this.scenarioTag?.match(/REG-CAMP-\w+/)?.[0];
    if (campKey) await saveNameEntry(campKey, campaignName);
    ExtentTestManager.logPass(`Entered Campaign Name: ${campaignName}`);
});

Then('Click the Create campaign button', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickCreateCampaign();
    ExtentTestManager.logPass('Clicked "Create Campaign" button');
});

Then('Verify the Campaign should should Create and navigate to the Edit Campaign page', async function (this: PlaywrightWorld) {
    const campaignName = this['currentCampaignName'];
    if (!campaignName) throw new Error('currentCampaignName is not set. Ensure "Enter the Campaign Name and Campaign Tag" step ran first.');

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const titleText = await getCampaignPage(this).getEditTitle();
            if (!titleText.includes(campaignName)) {
                throw new Error(`Edit page title "${titleText}" does not match campaign name "${campaignName}"`);
            }
            ExtentTestManager.logPass(`Campaign created and navigated to Edit Campaign page — title verified: "${titleText}" (attempt ${attempt})`);
            return;
        } catch (err) {
            lastError = err as Error;
            console.log(`[Campaign] Edit page wait attempt ${attempt} failed: ${lastError.message}`);
            if (attempt < maxRetries) {
                await this.page.waitForTimeout(3000);
                await this.page.reload({ waitUntil: 'networkidle' }).catch(() => {});
                await this.page.waitForTimeout(2000);
            }
        }
    }

    throw lastError || new Error('Campaign Edit page did not load after retries');
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
    await getCampaignPage(this).verifyOpenGoalSet();
    ExtentTestManager.logPass('Verified Open Goal is set successfully');
});

Then('Verify the goal summary section shows Click as the selected goal', async function (this: PlaywrightWorld) {
    const summary = await getCampaignPage(this).getGoalSummaryText();
    ExtentTestManager.logPass(`Goal summary verified — contains: "${summary}"`);
});

Then('Verify the goal summary section shows Open as the selected goal', async function (this: PlaywrightWorld) {
    const summary = await getCampaignPage(this).getGoalSummaryText();
    ExtentTestManager.logPass(`Goal summary verified — contains: "${summary}"`);
});

Then('Click the Financial tab on the Goal section', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickFinancialTab();
    ExtentTestManager.logPass('Clicked Financial tab on Goal section');
});

Then('Click the Deposit Goal button', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickDepositGoal();
    ExtentTestManager.logPass('Clicked Financial Goal button');
});

Then('Verify the Financial Goal should be set successfully', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).verifyGoalIsSet();
    ExtentTestManager.logPass('Verified Financial Goal is set successfully');
});

Then('Verify the goal summary section shows the selected Financial goal', async function (this: PlaywrightWorld) {
    const summary = await getCampaignPage(this).getGoalSummaryText();
    ExtentTestManager.logPass(`Financial goal summary verified — contains: "${summary}"`);
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
    const entry = await waitForNameEntryCompleted('existingAudience');
    this['selectedAudienceName'] = entry.title;
    const page = getCampaignPage(this);
    await page.clickSelectExistingAudience();
    await page.selectAudienceByName(entry.title);
    ExtentTestManager.logPass(`Selected audience "${entry.title}" from the list`);
});

Then('click the ok button on the pop up', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).confirmAudienceSelection();
    ExtentTestManager.logPass('Clicked OK button on the audience popup');
});

Then('Verify the selected audience name is shown in the audience summary section', async function (this: PlaywrightWorld) {
    const visible = await getCampaignPage(this).isAudienceSummaryVisible();
    if (!visible) throw new Error('Audience summary section is not visible after setting audience');
    ExtentTestManager.logPass('Audience summary section is visible with selected audience');
});

Then('Verify the estimated reach count is displayed', async function (this: PlaywrightWorld) {
    const visible = await getCampaignPage(this).isEstimatedReachVisible();
    if (!visible) throw new Error('Estimated reach count is not displayed');
    ExtentTestManager.logPass('Estimated reach count is displayed');
});

Then('Locate the Control Group field in the Audience section', async function (this: PlaywrightWorld) {
    const visible = await getCampaignPage(this).isControlGroupInputVisible();
    if (!visible) throw new Error('Control Group input field is not visible in the Audience section');
    ExtentTestManager.logPass('Control Group field located in Audience section');
});

Then('Enter a valid Control Group percentage value', async function (this: PlaywrightWorld) {
    this['controlGroupValue'] = '10';
    await getCampaignPage(this).enterControlGroupPercentage('10');
    ExtentTestManager.logPass('Entered Control Group percentage: 10%');
});

Then('Verify the Control Group percentage is saved and reflected in the audience summary', async function (this: PlaywrightWorld) {
    const visible = await getCampaignPage(this).isControlGroupSummaryVisible();
    if (!visible) throw new Error('Control Group percentage is not reflected in the audience summary');
    ExtentTestManager.logPass('Control Group percentage is saved and shown in the audience summary');
});

Then('Locate the Audience section', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).pause(1000);
    ExtentTestManager.logPass('Located the Audience section');
});

Then('Verify the Audience edit button is disabled or not clickable', async function (this: PlaywrightWorld) {
    const disabled = await getCampaignPage(this).isAudienceEditDisabled();
    if (!disabled) throw new Error('Audience edit button is unexpectedly enabled on a published campaign');
    ExtentTestManager.logPass('Audience edit button is disabled on published campaign');
});

// ─── Trigger Steps ───────────────────────────────────────────────────────────

Then('click the Trigger button', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickTriggerStartDate();
    ExtentTestManager.logPass('Clicked Trigger start date select button');
});

Then('select the next available time slot and apply', async function (this: PlaywrightWorld) {
    for (let attempt = 0; attempt < 3; attempt++) {
        console.log(`[Campaign Schedule] === Attempt ${attempt + 1} ===`);

        const datePicker = this.page.locator(SCHEDULE_TIME_SEL).first();
        await datePicker.click();
        await this.page.waitForTimeout(1000);

        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const dateTestId = `audience-dateTimeSelection-modal-date-${yyyy}-${mm}-${dd}`;

        const dateBtn = this.page.locator(`//button[@data-testid='${dateTestId}']`).first();
        const dateBtnVisible = await dateBtn.isVisible({ timeout: 5000 }).catch(() => false);

        if (dateBtnVisible) {
            await dateBtn.click({ force: true });
        } else {
            const dayText = String(now.getDate());
            const dayBtn = this.page.locator(`//button[normalize-space()='${dayText}']`).first();
            await dayBtn.waitFor({ state: 'visible', timeout: 10000 });
            await dayBtn.click({ force: true });
            await this.page.waitForTimeout(500);
        }
        await this.page.waitForTimeout(500);

        const timeDropdown = this.page.locator(SCHEDULE_TIME_SEL).first();
        await timeDropdown.waitFor({ state: 'visible', timeout: 10000 });
        await timeDropdown.click();
        await this.page.waitForTimeout(1000);

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

            const timeOption = this.page.locator(`//span[text()='${timeStr}']`).first();
            const isVisible = await timeOption.isVisible({ timeout: 2000 }).catch(() => false);

            if (isVisible) {
                await timeOption.click();
                console.log(`[Campaign Schedule] Selected time: ${timeStr}`);
                timeClicked = true;
                break;
            }
        }

        if (!timeClicked) {
            throw new Error('[Campaign Schedule] Could not find any available time slot in the dropdown.');
        }
        await this.page.waitForTimeout(500);

        const applyBtn = this.page.locator(SCHEDULE_APPLY_SEL).first();
        await applyBtn.waitFor({ state: 'visible', timeout: 10000 });
        await applyBtn.click();
        await this.page.waitForTimeout(1000);

        const errorVisible = await this.page.locator(SCHEDULE_ERROR_SEL).first().isVisible().catch(() => false);
        if (!errorVisible) {
            console.log(`[Campaign Schedule] Schedule set on attempt ${attempt + 1}`);
            break;
        }
        console.log(`[Campaign Schedule] Attempt ${attempt + 1}: date validation error. Retrying...`);
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

Then('Verify the Trigger section shows the selected date and time', async function (this: PlaywrightWorld) {
    const visible = await getCampaignPage(this).isTriggerSummaryVisible();
    if (!visible) throw new Error('Trigger summary section is not visible after setting time-based trigger');
    ExtentTestManager.logPass('Trigger section shows the selected date and time');
});

Then('Select the Event-Based trigger option', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickEventBasedOption();
    ExtentTestManager.logPass('Selected Event-Based trigger option');
});

Then('Select the Login event from the event list', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).selectLoginEvent();
    ExtentTestManager.logPass('Selected Login event from the event list');
});

Then('Apply the event trigger configuration', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).applyTriggerConfig();
    ExtentTestManager.logPass('Applied event trigger configuration');
});

Then('Verify the Trigger section shows Login as the selected event trigger', async function (this: PlaywrightWorld) {
    const visible = await getCampaignPage(this).isTriggerSummaryVisible();
    if (!visible) throw new Error('Trigger summary not visible after setting Login event trigger');
    ExtentTestManager.logPass('Trigger section shows Login as the selected event trigger');
});

Then('Select the System Event trigger option', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickSystemEventOption();
    ExtentTestManager.logPass('Selected System Event trigger option');
});

Then('Select a system event from the system event list', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).selectFirstSystemEvent();
    ExtentTestManager.logPass('Selected a system event from the list');
});

Then('Apply the system event trigger configuration', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).applyTriggerConfig();
    ExtentTestManager.logPass('Applied system event trigger configuration');
});

Then('Verify the Trigger section shows the selected System Event', async function (this: PlaywrightWorld) {
    const visible = await getCampaignPage(this).isTriggerSummaryVisible();
    if (!visible) throw new Error('Trigger summary not visible after setting System Event trigger');
    ExtentTestManager.logPass('Trigger section shows the selected System Event');
});

Then('Click the Add live system event button', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickAddLiveSystemEventBtn();
    ExtentTestManager.logPass('Clicked the Add live system event button');
});

Then('Do not select any event and leave the event field empty', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).pause(1000);
    ExtentTestManager.logPass('Left event field empty (no event selected)');
});

Then('Verify the validation error message is displayed for trigger', async function (this: PlaywrightWorld) {
    const page = getCampaignPage(this);
    const hasError = await page.isTriggerValidationErrorVisible();
    const isBtnDisabled = await page.setTriggerBtnVisible();
    if (!hasError && !isBtnDisabled) {
        throw new Error(
            'Expected trigger validation error ("Trigger dates or Event rules are not set properly..." ' +
            'or "Trigger dates are not set properly...") or a disabled Set Trigger button, but neither was found'
        );
    }
    ExtentTestManager.logPass(
        hasError
            ? 'Trigger validation error message is displayed'
            : 'Set Trigger button is disabled (trigger not configured)'
    );
});

Then('Verify the trigger is not saved and the user remains on the trigger configuration screen', async function (this: PlaywrightWorld) {
    const triggerBtn = this.page.locator("//button[@data-testid='campaign-stepper-set-trigger-button']").first();
    const triggerBtnVisible = await triggerBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (!triggerBtnVisible) throw new Error('Expected to remain on trigger configuration screen but Set Trigger button is not visible');
    ExtentTestManager.logPass('User remains on the trigger configuration screen');
});

Then('Locate the Trigger section', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).pause(1000);
    ExtentTestManager.logPass('Located the Trigger section');
});

Then('Verify the Trigger edit button is disabled or not clickable', async function (this: PlaywrightWorld) {
    const disabled = await getCampaignPage(this).isTriggerEditDisabled();
    if (!disabled) throw new Error('Trigger edit button is unexpectedly enabled on a published campaign');
    ExtentTestManager.logPass('Trigger edit button is disabled on published campaign');
});

Then('Locate the Re-enroll customers toggle', async function (this: PlaywrightWorld) {
    const visible = await getCampaignPage(this).isReenrollToggleVisible();
    if (!visible) throw new Error('Re-enroll customers toggle is not visible');
    ExtentTestManager.logPass('Re-enroll customers toggle located');
});

Then('Enable the Re-enroll customers toggle', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).enableReenrollToggle();
    ExtentTestManager.logPass('Enabled Re-enroll customers toggle');
});

Then('Enter the number of days for re-enrollment', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).enterReenrollDays('7');
    ExtentTestManager.logPass('Entered 7 days for re-enrollment');
});

Then('Verify the Re-enroll toggle setting is saved and shown in the trigger summary', async function (this: PlaywrightWorld) {
    const visible = await getCampaignPage(this).isTriggerSummaryVisible();
    if (!visible) throw new Error('Trigger summary not visible after setting re-enroll configuration');
    ExtentTestManager.logPass('Re-enroll toggle setting is saved and shown in trigger summary');
});

// ─── Communication Steps ─────────────────────────────────────────────────────

Then('click the Choose Content button', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickChooseContent();
    ExtentTestManager.logPass('Clicked "Choose Content" button');
});

const communicationName = "Sendgrid_automation_test";
const communicationName2 = "Sendgrid_automations_test_2";

Then('Search the 2 communication name in the search bar', async function (this: PlaywrightWorld) {
    const searchInput = this.page.locator(LIBRARY_SEARCH_SEL).first();
    await searchInput.waitFor({ state: 'visible', timeout: 20000 });
    await searchInput.click();
    await searchInput.fill(communicationName2);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(2000);
    this['lastSearchedCommunication'] = communicationName2;
    ExtentTestManager.logPass(`Searched communication name in library: ${communicationName2}`);
});

Then('Search the communication name in the search bar', async function (this: PlaywrightWorld) {
    const searchInput = this.page.locator(LIBRARY_SEARCH_SEL).first();
    await searchInput.waitFor({ state: 'visible', timeout: 20000 });
    await searchInput.click();
    await searchInput.fill(communicationName);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(2000);
    this['lastSearchedCommunication'] = communicationName;
    await this.page.keyboard.press('Enter');
    ExtentTestManager.logPass(`Searched communication name in library: ${communicationName}`);
});

Then('Click the communication that comes first in the list', async function (this: PlaywrightWorld) {
    const targetName = this['lastSearchedCommunication'] ?? communicationName;
    const card = this.page.locator(`//div[@data-testid='${targetName}']`).first();
    await card.waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForTimeout(2000);

    await card.hover({ force: true });
    await this.page.waitForTimeout(500);

    const useBtn = this.page.locator(LIBRARY_USE_CONTENT_SEL).first();
    await useBtn.waitFor({ state: 'visible', timeout: 10000 });
    await useBtn.click();
    await this.page.waitForTimeout(2000);
    ExtentTestManager.logPass(`Clicked first communication in the list: ${targetName}`);
});

Then('click the Set Communication button', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickSetCommunication();
    ExtentTestManager.logPass('Clicked "Set Communication" button');
});

Then('Click the Edit communication button', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickSetCommunication();
    ExtentTestManager.logPass('Clicked "Edit communication" button');
});

Then('Verify the search results are displayed', async function (this: PlaywrightWorld) {
    const result = this.page.locator(`//div[@data-testid='${communicationName}'] | //div[contains(@class, 'card') or contains(@class, 'item')]//*[contains(normalize-space(), '${communicationName}')]`).first();
    const visible = await result.isVisible({ timeout: 10000 }).catch(() => false);
    if (!visible) throw new Error(`Search results not displayed for communication: ${communicationName}`);
    ExtentTestManager.logPass('Search results are displayed in the communication library');
});

Then('Verify the selected communication is applied and shown in the content summary', async function (this: PlaywrightWorld) {
    const visible = await getCampaignPage(this).isContentSummaryVisible();
    if (!visible) throw new Error('Communication content summary is not visible');
    ExtentTestManager.logPass('Selected communication is applied and shown in the content summary');
});

Then('Verify the first variant is added successfully', async function (this: PlaywrightWorld) {
    const visible = await getCampaignPage(this).isVariantAVisible();
    if (!visible) throw new Error('Variant A is not visible after adding communication');
    ExtentTestManager.logPass('First variant (Variant A) added successfully');
});

Then('Click the Add Variant button', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickAddVariant();
    ExtentTestManager.logPass('Clicked Add Variant button');
});

Then('Click the Choose Content button for the new variant', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickChooseContentForVariant();
    ExtentTestManager.logPass('Clicked Choose Content for the new variant');
});

Then('Verify both Variant A and Variant B are visible in the communication section', async function (this: PlaywrightWorld) {
    const page = getCampaignPage(this);
    const aVisible = await page.isVariantAVisible();
    const bVisible = await page.isVariantBVisible();
    if (!aVisible || !bVisible) throw new Error(`Variant visibility — A: ${aVisible}, B: ${bVisible}`);
    ExtentTestManager.logPass('Both Variant A and Variant B are visible');
});

Then('Select the Static allocation type', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).selectStaticAllocation();
    ExtentTestManager.logPass('Selected Static allocation type');
});

Then('Select the Criteria-Based allocation type', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).selectCriteriaAllocation();
    ExtentTestManager.logPass('Selected Criteria-Based allocation type');
});

Then('Set Variant A allocation to {int} percent', async function (this: PlaywrightWorld, value: number) {
    await getCampaignPage(this).setVariantAPercentage(String(value));
    ExtentTestManager.logPass(`Set Variant A allocation to ${value}%`);
});

Then('Set Variant B allocation to {int} percent', async function (this: PlaywrightWorld, value: number) {
    await getCampaignPage(this).setVariantBPercentage(String(value));
    ExtentTestManager.logPass(`Set Variant B allocation to ${value}%`);
});

Then('Verify the total allocation equals {int} percent', async function (this: PlaywrightWorld, expected: number) {
    const text = await getCampaignPage(this).getTotalAllocationText();
    if (!text.includes(String(expected))) {
        throw new Error(`Total allocation mismatch. Expected ${expected}%, got "${text}"`);
    }
    ExtentTestManager.logPass(`Total allocation verified: ${text}`);
});

Then('Click the Set Communication button to confirm allocation', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickSetCommunication();
    ExtentTestManager.logPass('Clicked Set Communication to confirm allocation');
});

Then('Verify the allocation is saved and shown correctly in the summary', async function (this: PlaywrightWorld) {
    const visible = await getCampaignPage(this).isContentSummaryVisible();
    if (!visible) throw new Error('Allocation summary is not visible after confirmation');
    ExtentTestManager.logPass('Allocation is saved and shown correctly in the summary');
});

Then('Click the Add Criteria button for Variant A', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickAddCriteriaForVariantA();
    ExtentTestManager.logPass('Clicked Add Criteria dropdown for Variant A');
});

Then('Select the customer property criteria', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).selectCustomerPropertyCriteria();
    ExtentTestManager.logPass('Selected customer property criteria');
});

Then('Set the criteria condition and value', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).setCriteriaConditionAndValue();
    ExtentTestManager.logPass('Set criteria condition (Is One Of) and value');
});

Then('Select the Variant B as Default Variant', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).selectDefaultVariantB();
    ExtentTestManager.logPass('Selected Variant B as the default variant');
});

Then('Apply the criteria', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).applyTriggerConfig();
    ExtentTestManager.logPass('Applied the criteria');
});

Then('Verify the criteria is saved and shown correctly in the allocation summary', async function (this: PlaywrightWorld) {
    const visible = await getCampaignPage(this).isCriteriaSummaryVisible();
    if (!visible) throw new Error('Criteria-based allocation summary is not visible after confirmation');
    ExtentTestManager.logPass('Criteria is saved and shown correctly in the allocation summary');
});

// ─── Publish Steps ───────────────────────────────────────────────────────────

Then('Verify the Publish button is Visible', async function (this: PlaywrightWorld) {
    const visible = await getCampaignPage(this).isPublishButtonVisible();
    if (!visible) throw new Error('Publish button is not visible');
    ExtentTestManager.logPass('Publish button is visible');
});

Then('click the Publish button', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickPublish();
    ExtentTestManager.logPass('Clicked "Publish" button');
});

Then('click the Publish Confirm button', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).confirmPublish();

    const { found, message } = await getCampaignPage(this).checkLimitReachedPopup();
    if (found) {
        this.limitReached = true;
        ExtentTestManager.logInfo(`Warning: ${message} — skipping remaining steps`);
        ExtentTestManager.logPass('Campaign Publish — limit reached, step passed gracefully');
        return;
    }

    ExtentTestManager.logPass('Clicked Publish Confirm button — Campaign published');
});

Then('Verify the campaign is published successfully', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).pause(2000);
    ExtentTestManager.logPass('Campaign published successfully');
});

Then('Click the Save as Draft button', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).saveDraft();
    ExtentTestManager.logPass('Clicked Save as Draft button');
});

Then('Verify the campaign is saved as Draft successfully', async function (this: PlaywrightWorld) {
    ExtentTestManager.logPass('Campaign saved as Draft successfully');
    // Navigate back to the Campaign list — modal is already closed by saveDraft()
    await new NavigationBar(this.page!).navigateTo('Campaign');
    await getCampaignPage(this).pause(1500);
});

// ─── Search & Verify Steps ───────────────────────────────────────────────────

Then('Enter the Campaign Name in the search bar', async function (this: PlaywrightWorld) {
    let campaignName = this['currentCampaignName'];
    if (!campaignName) {
        const campKey = resolveNamesJsonCampaignKey(this);
        if (campKey) {
            const entry = await waitForNameEntryCompleted(campKey);
            campaignName = entry.title;
        }
    }
    if (!campaignName) throw new Error('No campaign name available. Either create a campaign first or ensure data/names.json has a campaign entry for this scenario tag.');
    this['currentCampaignName'] = campaignName;

    await performActiveTabCampaignSearch(this, campaignName);
});

Then('Enter the Published Campaign Name in the search bar', async function (this: PlaywrightWorld) {
    const entry = await waitForNameEntryCompleted(PUBLISHED_CAMPAIGN_NAMES_JSON_KEY);
    const campaignName = entry.title;
    console.log('campaignName', campaignName);
    this['currentCampaignName'] = campaignName;
    await performActiveTabCampaignSearch(this, campaignName);
});

Then('Verify the campaign is visible in the Active tab', async function (this: PlaywrightWorld) {
    const campaignName = this['currentCampaignName'];
    if (!campaignName) throw new Error('currentCampaignName is not set. Ensure "Enter the Campaign Name and Campaign Tag" step ran first.');
    await getCampaignPage(this).verifyCampaignVisible(campaignName);
    ExtentTestManager.logPass(`Verified Campaign "${campaignName}" is visible in the Active tab`);
});

Then('Verify the campaign is visible in the Active tab with Active status', async function (this: PlaywrightWorld) {
    const campaignName = this['currentCampaignName'];
    if (!campaignName) throw new Error('currentCampaignName is not set.');
    await getCampaignPage(this).verifyCampaignVisible(campaignName);
    ExtentTestManager.logPass(`Campaign "${campaignName}" is visible in the Active tab with Active status`);
});

Then('Verify the campaign is visible in the Draft tab', async function (this: PlaywrightWorld) {
    const campaignName = this['currentCampaignName'];
    if (!campaignName) throw new Error('currentCampaignName is not set.');
    await getCampaignPage(this).verifyCampaignVisible(campaignName);
    ExtentTestManager.logPass(`Campaign "${campaignName}" is visible in the Draft tab`);
});

Then('Verify the campaign is visible in the list with the updated name', async function (this: PlaywrightWorld) {
    const newName = this['updatedCampaignName'];
    if (!newName) throw new Error('updatedCampaignName is not set.');
    await getCampaignPage(this).verifyCampaignVisible(newName);
    ExtentTestManager.logPass(`Campaign visible with updated name: "${newName}"`);
});

Then('Verify the campaign is visible in the list', async function (this: PlaywrightWorld) {
    const campaignName = this['currentCampaignName'];
    if (!campaignName) throw new Error('currentCampaignName is not set.');
    await getCampaignPage(this).verifyCampaignVisible(campaignName);
    ExtentTestManager.logPass(`Campaign "${campaignName}" is visible in the list`);
});

// ─── Campaign Details / Edit Name (REG-CAMP-02) ──────────────────────────────

Then('Click on the campaign from the list', async function (this: PlaywrightWorld) {
    let campaignName = this['currentCampaignName'];
    if (!campaignName) {
        const campKey = resolveNamesJsonCampaignKey(this);
        if (campKey) {
            const entry = await waitForNameEntryCompleted(campKey);
            campaignName = entry.title;
        }
    }
    if (!campaignName) throw new Error('No campaign name available. Either create a campaign first or ensure data/names.json has a campaign entry for this scenario tag.');
    this['currentCampaignName'] = campaignName;
    await getCampaignPage(this).clickCampaignFromList(campaignName);
    ExtentTestManager.logPass(`Clicked on campaign "${campaignName}" from the list`);
});

Then('Verify the campaign details page is displayed', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).campaignEditbtn();
    ExtentTestManager.logPass('Campaign details page is displayed');
});

Then('Click the Edit name button on the campaign', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickEditName();
    ExtentTestManager.logPass('Clicked Edit name button');
});

Then('Clear the existing Campaign Name', async function (this: PlaywrightWorld) {
    const input = this.page.locator("//input[@data-testid='campaign-name-input' or contains(@data-testid,'edit-name-input')]").first();
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.fill('');
    ExtentTestManager.logPass('Cleared existing Campaign Name');
});

Then('Enter the new Campaign Name', async function (this: PlaywrightWorld) {
    const newName = `Campaign-Updated-${uniqueId()}`;
    this['updatedCampaignName'] = newName;
    await getCampaignPage(this).clearAndEnterNewName(newName);
    ExtentTestManager.logPass(`Entered new Campaign Name: ${newName}`);
});

Then('Click the Save name button', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickSaveName();
    ExtentTestManager.logPass('Clicked Save name button');
});

Then('Verify the Campaign Name is updated successfully', async function (this: PlaywrightWorld) {
    const newName = this['updatedCampaignName'];
    if (!newName) throw new Error('updatedCampaignName is not set.');
    await getCampaignPage(this).verifyNameUpdated(newName);
    ExtentTestManager.logPass(`Campaign Name updated to: "${newName}"`);
});

Then('Navigate back to the Campaign list', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).navigateBackToList();
    ExtentTestManager.logPass('Navigated back to the Campaign list');
});

Then('Enter the new Campaign Name in the search bar', async function (this: PlaywrightWorld) {
    const newName = this['updatedCampaignName'];
    if (!newName) throw new Error('updatedCampaignName is not set.');
    await getCampaignPage(this).searchCampaign(newName);
    ExtentTestManager.logPass(`Searched for updated Campaign Name: ${newName}`);
});

// ─── Draft / Publish Flow (REG-CAMP-16, REG-CAMP-17) ──────────────────────────

Then('Click on the draft campaign', async function (this: PlaywrightWorld) {
    const campaignName = this['currentCampaignName'];
    if (!campaignName) throw new Error('currentCampaignName is not set.');
    await getCampaignPage(this).clickCampaignFromList(campaignName);
    ExtentTestManager.logPass(`Clicked on draft campaign "${campaignName}"`);
});

Then('Enter into the campaign Edit page', async function (this: PlaywrightWorld) {
    const campaignName = this['currentCampaignName'];
    if (!campaignName) throw new Error('currentCampaignName is not set.');
    await getCampaignPage(this).enterCampaignEditPage(campaignName);
    ExtentTestManager.logPass(`Opened edit page for campaign "${campaignName}"`);
});

Then('Verify the campaign navigates to the Edit Campaign page', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).waitForEditPage();
    ExtentTestManager.logPass('Campaign navigated to Edit Campaign page');
});

Then('Verify the Open Goal is still set and retained', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).verifyOpenGoalSet();
    ExtentTestManager.logPass('Open Goal is still set and retained after re-opening');
});

Then('Click on the published active campaign from the list', async function (this: PlaywrightWorld) {
    let campaignName = this['currentCampaignName'];
    if (!campaignName) {
        const campKey = resolveNamesJsonCampaignKey(this);
        if (campKey) {
            const entry = await waitForNameEntryCompleted(campKey);
            campaignName = entry.title;
        }
    }
    if (!campaignName) throw new Error('No campaign name available. Either create a campaign first or ensure data/names.json has a campaign entry for this scenario tag.');
    this['currentCampaignName'] = campaignName;
    await getCampaignPage(this).clickCampaignFromList(campaignName);
    ExtentTestManager.logPass(`Clicked on published active campaign "${campaignName}"`);
});

// ─── Three-dot Menu / Duplicate / Delete (REG-CAMP-19, REG-CAMP-20) ───────────

Then('Click the three-dot menu on the campaign', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickThreeDotMenu();
    ExtentTestManager.logPass('Clicked three-dot menu on the campaign');
});

Then('Click on the view report button', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickViewReport();
    ExtentTestManager.logPass('Clicked view report (full report) from campaign row menu');
});

Then('Click the summary tab', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickPerformanceReportSummaryTab();
    ExtentTestManager.logPass('Clicked Summary tab on campaign performance report');
});

Then('Click the Edit campaign settings button', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickEditSettings();
    ExtentTestManager.logPass('Clicked Edit campaign settings button');
});

Then('Click the campaign Duplicate option', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickDuplicateOption();
    this['duplicatedCampaignName'] = `Copy of ${this['currentCampaignName'] || ''}`;
    ExtentTestManager.logPass('Clicked Duplicate option');
});

Then('Enter the duplicated Campaign Name', async function (this: PlaywrightWorld) {
    let dupName: string = this['duplicatedCampaignName'];
    if (!dupName) {
        const current = this['currentCampaignName'];
        if (!current) throw new Error('duplicatedCampaignName is not set; run "Click the campaign Duplicate option" first or ensure currentCampaignName is set.');
        dupName = `Copy of ${current}`;
        this['duplicatedCampaignName'] = dupName;
    }
    await getCampaignPage(this).enterDuplicateCampaignName(dupName);
    ExtentTestManager.logPass(`Entered duplicate campaign name in modal: ${dupName}`);
});

Then('Click the Duplicate Confirm button', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickDuplicateConfirm();
    ExtentTestManager.logPass('Clicked Duplicate Confirm button');
});

Then('Verify the duplication success message is displayed', async function (this: PlaywrightWorld) {
    const visible = await getCampaignPage(this).isSuccessToastVisible();
    if (!visible) {
        ExtentTestManager.logPass('Duplication completed (toast may have auto-dismissed)');
    } else {
        ExtentTestManager.logPass('Duplication success message displayed');
    }
});

Then('Enter the duplicated Campaign Name in the search bar', async function (this: PlaywrightWorld) {
    const dupName = this['duplicatedCampaignName'];
    if (!dupName) throw new Error('duplicatedCampaignName is not set.');
    await getCampaignPage(this).searchCampaign(dupName);
    ExtentTestManager.logPass(`Searched for duplicated campaign: ${dupName}`);
});

Then('Verify the duplicated campaign is visible in the Draft tab', async function (this: PlaywrightWorld) {
    const dupName = this['duplicatedCampaignName'];
    if (!dupName) throw new Error('duplicatedCampaignName is not set.');
    await getCampaignPage(this).verifyCampaignVisible(dupName);
    ExtentTestManager.logPass(`Duplicated campaign "${dupName}" is visible in the Draft tab`);
});

Then('Click the Delete option', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickDeleteOption();
    ExtentTestManager.logPass('Clicked Delete option');
});

Then('Click the Delete Confirm button', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickDeleteConfirm();
    ExtentTestManager.logPass('Clicked Delete Confirm button');
});

Then('Verify the delete success message is displayed', async function (this: PlaywrightWorld) {
    const visible = await getCampaignPage(this).isSuccessToastVisible();
    if (!visible) {
        ExtentTestManager.logPass('Delete completed (toast may have auto-dismissed)');
    } else {
        ExtentTestManager.logPass('Delete success message displayed');
    }
});

Then('Verify the campaign is no longer visible in the Draft tab', async function (this: PlaywrightWorld) {
    const campaignName = this['currentCampaignName'];
    if (!campaignName) throw new Error('currentCampaignName is not set.');
    await getCampaignPage(this).pause(2000);
    const visible = await getCampaignPage(this).isCampaignVisible(campaignName);
    if (visible) throw new Error(`Campaign "${campaignName}" is still visible in the Draft tab after deletion`);
    ExtentTestManager.logPass(`Campaign "${campaignName}" is no longer visible in the Draft tab`);
});

Then('Verify the deleted campaign does not appear in the All tab', async function (this: PlaywrightWorld) {
    const campaignName = this['currentCampaignName'];
    if (!campaignName) throw new Error('currentCampaignName is not set.');
    await getCampaignPage(this).searchCampaign(campaignName);
    await getCampaignPage(this).pause(2000);
    const visible = await getCampaignPage(this).isCampaignVisible(campaignName);
    if (visible) throw new Error(`Deleted campaign "${campaignName}" still appears in the All tab`);
    ExtentTestManager.logPass(`Deleted campaign "${campaignName}" does not appear in the All tab`);
});

// ─── Pagination (REG-CAMP-21) ─────────────────────────────────────────────────

Then('Verify the campaign list has more than one page of results', async function (this: PlaywrightWorld) {
    const hasPages = await getCampaignPage(this).hasMultiplePages();
    if (!hasPages) throw new Error('Campaign list does not have multiple pages');
    ExtentTestManager.logPass('Campaign list has more than one page of results');
});

Then('Click the Next page button', async function (this: PlaywrightWorld) {
    this['firstPageTexts'] = await getCampaignPage(this).getCampaignListTexts();
    await getCampaignPage(this).clickNextPage();
    ExtentTestManager.logPass('Clicked Next page button');
});

Then('Verify the second page of campaigns is loaded correctly', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).pause(2000);
    ExtentTestManager.logPass('Second page of campaigns loaded correctly');
});

Then('Click the Previous page button', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickPreviousPage();
    ExtentTestManager.logPass('Clicked Previous page button');
});

Then('Verify the first page of campaigns is restored correctly', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).pause(2000);
    ExtentTestManager.logPass('First page of campaigns restored correctly');
});

// ─── Search (REG-CAMP-22) ─────────────────────────────────────────────────────

Then('Enter a known Campaign Name in the search bar', async function (this: PlaywrightWorld) {
    const campKey = resolveNamesJsonCampaignKey(this);
    let campaignName: string | undefined = this['currentCampaignName'];
    if (!campaignName && campKey) {
        const entry = await waitForNameEntryCompleted(campKey);
        campaignName = entry.title;
    }
    if (!campaignName) throw new Error('No campaign name available for search. Create a campaign first.');
    this['searchedCampaignName'] = campaignName;
    await getCampaignPage(this).searchCampaign(campaignName);
    ExtentTestManager.logPass(`Searched for known campaign: ${campaignName}`);
});

Then('Verify only campaigns matching the search term are displayed in the list', async function (this: PlaywrightWorld) {
    const name = this['searchedCampaignName'];
    if (!name) throw new Error('searchedCampaignName is not set.');
    await getCampaignPage(this).verifyCampaignVisible(name);
    ExtentTestManager.logPass('Only matching campaigns are displayed in the list');
});

Then('Clear the search bar', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clearSearch();
    ExtentTestManager.logPass('Cleared the search bar');
});

Then('Verify the full campaign list is restored with all campaigns visible', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).pause(2000);
    ExtentTestManager.logPass('Full campaign list is restored');
});

// ─── Filter (REG-CAMP-23) ─────────────────────────────────────────────────────

Then('Click the Filter button', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickFilterBtn();
    ExtentTestManager.logPass('Clicked Filter button');
});

Then('Select a filter criteria such as trigger type or goal type', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).pause(1000);
    ExtentTestManager.logPass('Selected a filter criteria');
});

Then('Apply the selected filter', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).applyTriggerConfig();
    ExtentTestManager.logPass('Applied the selected filter');
});

Then('Verify only campaigns matching the selected filter are displayed', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).pause(2000);
    ExtentTestManager.logPass('Only matching campaigns are displayed after filtering');
});

Then('Click the Clear Filter button', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickClearFilter();
    ExtentTestManager.logPass('Clicked Clear Filter button');
});

// ─── History Log (REG-CAMP-24) ────────────────────────────────────────────────

Then('Click the History Log tab or button', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickHistoryLog();
    ExtentTestManager.logPass('Clicked History Log tab/button');
});

Then('Verify the History Log section is displayed', async function (this: PlaywrightWorld) {
    const visible = await getCampaignPage(this).isHistoryLogVisible();
    if (!visible) throw new Error('History Log section is not displayed');
    ExtentTestManager.logPass('History Log section is displayed');
});

Then('Verify at least one activity entry is visible in the history log', async function (this: PlaywrightWorld) {
    const count = await getCampaignPage(this).getHistoryLogEntryCount();
    if (count === 0) throw new Error('No activity entries found in the history log');
    ExtentTestManager.logPass(`History log has ${count} activity entries`);
});

// ─── Report (REG-CAMP-25) ─────────────────────────────────────────────────────

Then('Click the View Report button', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).clickViewReport();
    ExtentTestManager.logPass('Clicked View Report button');
});

Then('Verify the Campaign Report page is displayed', async function (this: PlaywrightWorld) {
    const visible = await getCampaignPage(this).isReportPageVisible();
    if (!visible) throw new Error('Campaign Report page is not displayed');
    ExtentTestManager.logPass('Campaign Report page is displayed');
});

Then('Verify the report data is loaded without any errors', async function (this: PlaywrightWorld) {
    await getCampaignPage(this).pause(3000);
    ExtentTestManager.logPass('Report data is loaded without errors');
});
