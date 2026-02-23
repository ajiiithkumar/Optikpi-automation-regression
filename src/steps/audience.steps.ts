
import { Then } from '@cucumber/cucumber';
import { AudiencePage } from '../pages/audience.page';
import { DateTimePicker } from '../pages/components/date-time-picker.component';
import { getOrSetAudienceTitle, saveDraftAudienceTitle, readUsersCsv, getNewAudienceTitle, saveNameEntry, generateAudienceTitle } from '../utils/helper';
import { ExtentTestManager } from '../utils/extent-test-manager';
import { PlaywrightWorld } from '../support/world';

const getAudiencePage = (world: PlaywrightWorld) => new AudiencePage(world.page);
const getDatePicker   = (world: PlaywrightWorld) => new DateTimePicker(world.page);

// ─── View Toggle ─────────────────────────────────────────────────────────────

Then('Click the card view icon', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).switchToCardView();
    ExtentTestManager.logPass('Clicked the card view icon');
});

Then('Card view should load successfully', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).waitForCardView();
    ExtentTestManager.logPass('Card view loaded successfully');
});

Then('Click the list view icon', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).switchToListView();
    ExtentTestManager.logPass('Clicked the list view icon');
});

Then('List view should load successfully', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).waitForListView();
    ExtentTestManager.logPass('List view loaded successfully');
});

// ─── Tab Navigation ──────────────────────────────────────────────────────────

Then('Verify All tab data loads successfully', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).clickTabAll();
    ExtentTestManager.logPass('All tab data loaded successfully');
});

Then('Static tab should load successfully', async function (this: PlaywrightWorld) {
    const audience = getAudiencePage(this);
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await audience.clickTabStatic();
            await this.page.waitForTimeout(3000);
            const isActive = await audience.isStaticTabActive();
            if (!isActive) throw new Error('Static tab is not active after clicking');
            ExtentTestManager.logPass(`Static tab loaded (attempt ${attempt})`);
            return;
        } catch (err) {
            lastError = err as Error;
            console.log(`[Audience] Static tab attempt ${attempt} failed: ${lastError.message}`);
            if (attempt < maxRetries) {
                await this.page.waitForTimeout(3000);
                await this.page.reload({ waitUntil: 'networkidle' }).catch(() => {});
                await this.page.waitForTimeout(2000);
            }
        }
    }

    await ExtentTestManager.logFail('Static tab is not active after retries');
    throw lastError || new Error('Static tab did not load successfully');
});

Then('Live tab should load successfully', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).clickTabLive();
    await this.page.waitForTimeout(500);
    ExtentTestManager.logPass('Live tab loaded');
});

Then('On Schedule tab should load successfully', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).clickTabOnSchedule();
    await this.page.waitForTimeout(500);
    ExtentTestManager.logPass('On Schedule tab loaded');
});

// ─── Audience Creation ───────────────────────────────────────────────────────

Then('Click the Create new Audience button', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).clickCreateNew();
    ExtentTestManager.logPass('Clicked "Create new Audience" button');
});

Then('Click the Create from scratch option', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).clickCreateFromScratch();
    ExtentTestManager.logPass('Clicked "Create from scratch" option');
});

Then('I should see the Create Audience page', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).waitForCreatePage();
    ExtentTestManager.logPass('Create Audience page is visible');
});

Then('Fill in the Audience details and save', async function (this: PlaywrightWorld) {
    const audienceTitle = await getOrSetAudienceTitle('Test');
    this['currentAudienceTitle'] = audienceTitle;

    const audience = getAudiencePage(this);
    await audience.fillDetails(audienceTitle, 'auto-tag');
    await audience.clickCreateSubmit();
    ExtentTestManager.logPass(`Audience created with title: ${audienceTitle}`);
});

Then('Fill in the Existing Audience details and save', async function (this: PlaywrightWorld) {
    const audienceTitle = generateAudienceTitle();
    this['currentAudienceTitle'] = audienceTitle;
    await saveNameEntry('existingAudience', audienceTitle, 'Test');

    const audience = getAudiencePage(this);
    await audience.fillDetails(audienceTitle, 'auto-tag');
    await audience.clickCreateSubmit();
    ExtentTestManager.logPass(`Existing Audience created with title: ${audienceTitle}`);
});

Then('It should enter into the edit page of the created Audience', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).waitForEditPage();
    ExtentTestManager.logPass('Edit page for created Audience is visible');
});

// ─── Criteria Builder ────────────────────────────────────────────────────────

Then('Click the customer property option on Criteria', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).openCustomerProperty();
    ExtentTestManager.logPass('Opened customer properties on Criteria');
});

Then('on the customer property pop up select User Id property and apply', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).selectUserIdProperty();
    ExtentTestManager.logPass('User Id property selected on customer property popup');
});

Then('Click the Condition and select is one of option', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).selectConditionIsOneOf();
    ExtentTestManager.logPass('Condition "is one of" selected for User Id');
});

Then('In the value field enter a valid User Id and apply', async function (this: PlaywrightWorld) {
    const users = await readUsersCsv().catch(() => []);
    const firstUser = Array.isArray(users) && users.length > 0 ? users[0] : null;
    const userIdValue = firstUser?.user_id || 'user_001';
    this['currentAudienceUserIds'] = [userIdValue];

    await getAudiencePage(this).enterUserIdValue(userIdValue);
    ExtentTestManager.logPass(`Applied User Id value: ${userIdValue}`);
});

Then('Check the Preview button 1 record is shown', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).clickPreview1();
    ExtentTestManager.logPass('Preview 1 button clicked (expected 1 record).');
});

Then('Click the \"+ Add values\" enter a valid User Id and apply', async function (this: PlaywrightWorld) {
    const users = await readUsersCsv().catch(() => []);
    const secondUser = Array.isArray(users) && users.length > 1 ? users[1] : null;
    const userIdValue = secondUser?.user_id || 'user_002';
    this['currentAudienceUserIds'] = [...(this['currentAudienceUserIds'] || []), userIdValue];

    await getAudiencePage(this).enterUserIdValue(userIdValue);
    ExtentTestManager.logPass(`Additional User Id value added: ${userIdValue}`);
});

Then('Check the Preview button 2 records are shown', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).clickPreview2();
    ExtentTestManager.logPass('Preview 2 button clicked (expected 2 records).');
});

// ─── Save / Publish ──────────────────────────────────────────────────────────

Then('Save as draft the Audience and go back to Audience list page', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).saveDraft();

    if (this['currentAudienceTitle']) {
        await saveDraftAudienceTitle('Test', this['currentAudienceTitle']);
    }
    ExtentTestManager.logPass('Audience saved as draft and navigated back to Audience list page');
});

Then('Search for the created Audience and verify it is present in the list', async function (this: PlaywrightWorld) {
    const audienceTitle = this['currentAudienceTitle'];
    if (!audienceTitle) {
        throw new Error('currentAudienceTitle is not set; ensure "Fill in the Audience details and save" step ran successfully.');
    }

    await getAudiencePage(this).searchInCriteriaField(audienceTitle);

    const resultLocator = this.page.locator(`text=${audienceTitle}`).first();
    await resultLocator.waitFor({ state: 'visible', timeout: 30000 });
    ExtentTestManager.logPass(`Verified created Audience "${audienceTitle}" is present in the list`);
});

Then('Validate the Audience tooltip title matches the saved Audience title', async function (this: PlaywrightWorld) {
    const entry = await getNewAudienceTitle();
    const expectedTitle = entry?.title;
    if (!expectedTitle) throw new Error('No audience title found in config/data/Name.json.');

    await getAudiencePage(this).verifyTooltipTitle(expectedTitle);
    ExtentTestManager.logPass(`Tooltip title matches saved Audience title: ${expectedTitle}`);
});

Then('enter into that Audience', async function (this: PlaywrightWorld) {
    const entry = await getNewAudienceTitle();
    const expectedTitle = entry?.title;
    if (!expectedTitle) throw new Error('No audience title found in config/data/Name.json.');

    const audience = getAudiencePage(this);
    await audience.openEditForAudience(expectedTitle);
    await audience.verifyEditPageTitle(expectedTitle);
    ExtentTestManager.logPass(`Opened Audience "${expectedTitle}" for editing (title verified)`);
});

Then('Verify the added user Id are still in the Audience', async function (this: PlaywrightWorld) {
    const users = await readUsersCsv().catch(() => []);
    const expectedIds = [
        users?.[0]?.user_id || 'user_001',
        users?.[1]?.user_id || 'user_002',
    ].filter(Boolean);

    if (expectedIds.length === 0) throw new Error('No User Ids available to verify.');
    await getAudiencePage(this).verifyUserIdsPresent(expectedIds);
    ExtentTestManager.logPass(`Verified User Ids still present: ${expectedIds.join(', ')}`);
});

Then('Add the Reminding users into the Audience and apply', async function (this: PlaywrightWorld) {
    const users = await readUsersCsv().catch(() => []);
    const extraUserIds = [
        users?.[2]?.user_id || 'user_003',
        users?.[3]?.user_id || 'user_004',
    ].filter(Boolean);

    await getAudiencePage(this).addExtraUserIds(extraUserIds);

    this['currentAudienceUserIds'] = [...(this['currentAudienceUserIds'] || []), ...extraUserIds];
    await getAudiencePage(this).clickPreview2();
    ExtentTestManager.logPass(`Added remaining User Ids and applied: ${extraUserIds.join(', ')}`);
});

Then('Click the Publish button and Cancel the Publish', async function (this: PlaywrightWorld) {
    const { beforeUrl, afterUrl } = await getAudiencePage(this).publishAndCancel();

    if (beforeUrl !== afterUrl) {
        await ExtentTestManager.logFail(`URL changed after cancel. Before: ${beforeUrl} | After: ${afterUrl}`);
        throw new Error(`URL changed after cancel.`);
    }
    ExtentTestManager.logPass('Publish canceled');
});

Then('Verify the added 4 user Id are still in the Audience', async function (this: PlaywrightWorld) {
    const users = await readUsersCsv().catch(() => []);
    const expectedIds = [
        users?.[0]?.user_id || 'user_001',
        users?.[1]?.user_id || 'user_002',
        users?.[2]?.user_id || 'user_003',
        users?.[3]?.user_id || 'user_004',
    ].filter(Boolean);

    if (expectedIds.length === 0) throw new Error('No User Ids available to verify.');
    await getAudiencePage(this).verifyUserIdsPresent(expectedIds);
    ExtentTestManager.logPass(`Verified All 4 User Ids still present: ${expectedIds.join(', ')}`);
});

Then('Click the Publish button and Confirm the Publish Static Audience', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).publishStatic();
    ExtentTestManager.logPass('Published Static Audience Clicked successfully');
});

Then('Click the Publish button and Confirm the Publish Schedule Audience', async function (this: PlaywrightWorld) {
    const audience = getAudiencePage(this);
    await audience.publishSchedule();

    // Schedule date/time with retry
    const datePicker = getDatePicker(this);
    await datePicker.selectTodayWithRetry(true);

    // Click Update Schedule
    await datePicker.clickUpdateSchedule();

    ExtentTestManager.logPass('Published Schedule Audience Clicked successfully');
});

// ─── Filter & Search ─────────────────────────────────────────────────────────

Then('Filter the Audience with the saved Audience title', async function (this: PlaywrightWorld) {
    const audience = getAudiencePage(this);
    const entry = await getNewAudienceTitle();
    const expectedTitle = entry?.title;
    if (!expectedTitle) throw new Error('No audience title found in config/data/Name.json.');

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[Audience Search] Attempt ${attempt}/${maxRetries}...`);
            await audience.applyActiveFilter();

            // Clear the search field first, then enter the audience name
            const searchField = this.page.locator("//input[@id='mobile-search-candidate']").first();
            if (await searchField.isVisible().catch(() => false)) {
                await searchField.fill('');
                await this.page.waitForTimeout(500);
            }
            await audience.searchByName(expectedTitle);

            // Verify audience is visible
            await audience.verifyAudienceInList(expectedTitle);
            ExtentTestManager.logPass(`Filtered and searched for Audience: ${expectedTitle} (attempt ${attempt})`);
            return; // Success — exit the loop
        } catch (err) {
            lastError = err as Error;
            console.log(`[Audience Search] Attempt ${attempt} failed: ${lastError.message}`);
            if (attempt < maxRetries) {
                console.log('[Audience Search] Retrying...');
                await this.page.waitForTimeout(2000);
            }
        }
    }

    throw lastError || new Error(`Audience "${expectedTitle}" not found after ${maxRetries} attempts`);
});

Then('Verify the Audience is displayed in the list', async function (this: PlaywrightWorld) {
    const entry = await getNewAudienceTitle();
    const expectedTitle = entry?.title;
    if (!expectedTitle) throw new Error('No audience title found in config/data/Name.json.');

    // Verification already done in filter step with retry
    await getAudiencePage(this).verifyAudienceInList(expectedTitle);
    ExtentTestManager.logPass(`Verified Audience "${expectedTitle}" is displayed in the list`);
});

Then('Log out from the application', async function (this: PlaywrightWorld) {
    const logoutCandidate = this.page.locator("//*[self::button or self::a][contains(translate(normalize-space(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'logout') or contains(translate(normalize-space(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'log out')]").first();
    if (await logoutCandidate.isVisible().catch(() => false)) {
        await logoutCandidate.click().catch(() => {});
        ExtentTestManager.logPass('Logged out from the application');
        return;
    }
    ExtentTestManager.logInfo('Logout control not found; please update selectors for logout if needed.');
});
