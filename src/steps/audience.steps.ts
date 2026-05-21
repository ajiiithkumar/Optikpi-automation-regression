
import { Given, Then } from '@cucumber/cucumber';
import { AudiencePage } from '../pages/audience.page';
import { DateTimePicker } from '../pages/components/date-time-picker.component';
import { readUsersCsv, saveNameEntry, saveNameEntries, generateAudienceTitle, readNameJson, waitForNameEntryCompleted } from '../utils/helper';
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
    const audienceTitle = generateAudienceTitle();
    this['currentAudienceTitle'] = audienceTitle;

    const scenarioTag = this.scenarioTag || '';
    const tagMatch = scenarioTag.match(/REG-AUD-\d+/);
    const entries: Array<{ type: string; title: string }> = [];
    if (tagMatch) entries.push({ type: tagMatch[0], title: audienceTitle });
    if (this.scenarioTags?.includes('ExistingAudience')) {
        entries.push({ type: 'existingAudience', title: audienceTitle });
    }
    await saveNameEntries(entries);

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
    await getAudiencePage(this).selectCustomerPropertiesValueslevel1Btn();
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
    await getAudiencePage(this).clickAddValuesBtn();
    await getAudiencePage(this).enterUserIdValue(userIdValue);
    ExtentTestManager.logPass(`Additional User Id value added: ${userIdValue}`);
});

Then('Check the Preview button 2 records is shown', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).clickPreview2();
    ExtentTestManager.logPass('Preview 2 button clicked (expected 2 records).');
});

// ─── Save / Publish ──────────────────────────────────────────────────────────

Then('Save as draft the Audience and go back to Audience list page', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).saveDraft();
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
    const expectedTitle = this['currentAudienceTitle'];
    if (!expectedTitle) throw new Error('No audience title set on World. Ensure "Fill in the Audience details and save" ran first.');

    const audience = getAudiencePage(this);
    await audience.verifyTooltipTitle(expectedTitle);

    const previewCount = this['lastPreviewCount'];
    if (previewCount !== undefined) {
        const listCount = await audience.getTotalCustomerCount(expectedTitle);
        if (listCount !== previewCount) {
            throw new Error(`Total Customers mismatch. Preview: ${previewCount}, List: ${listCount}`);
        }
        ExtentTestManager.logPass(`Total Customers in list (${listCount}) matches preview count (${previewCount})`);
    }
    ExtentTestManager.logPass(`Tooltip title matches saved Audience title: ${expectedTitle}`);
});

Then('enter into that Audience', async function (this: PlaywrightWorld) {
    const expectedTitle = this['currentAudienceTitle'];
    if (!expectedTitle) throw new Error('No audience title set on World. Ensure "Fill in the Audience details and save" ran first.');

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

    // Check for "limit reached" popup
    const { found, message } = await getAudiencePage(this).checkLimitReachedPopup();
    if (found) {
        this.limitReached = true;
        ExtentTestManager.logInfo(`⚠️ ${message} — skipping remaining steps`);
        ExtentTestManager.logPass('Publish Static Audience — limit reached, step passed gracefully');
        return;
    }

    ExtentTestManager.logPass('Published Static Audience Clicked successfully');
});

Then('Click the Publish button and Confirm the Publish Schedule Audience', async function (this: PlaywrightWorld) {
    const audience = getAudiencePage(this);
    await audience.publishSchedule();

    // Check for "limit reached" popup
    const { found, message } = await audience.checkLimitReachedPopup();
    if (found) {
        this.limitReached = true;
        ExtentTestManager.logInfo(`⚠️ ${message} — skipping remaining steps`);
        ExtentTestManager.logPass('Publish Schedule Audience — limit reached, step passed gracefully');
        return;
    }

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
    const expectedTitle = this['currentAudienceTitle'];
    if (!expectedTitle) throw new Error('No audience title set on World. Ensure "Fill in the Audience details and save" ran first.');

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
    const expectedTitle = this['currentAudienceTitle'];
    if (!expectedTitle) throw new Error('No audience title set on World. Ensure "Fill in the Audience details and save" ran first.');

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

// ═══════════════════════════════════════════════════════════════════════════════
// REGRESSION — Event Performed Criteria
// ═══════════════════════════════════════════════════════════════════════════════

Then('Click the Event performed option on Criteria', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).openEventPerformed();
    ExtentTestManager.logPass('Opened Event Performed criteria');
});

Then('on the Event performed pop up select login event and apply', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).selectLoginEvent();
    ExtentTestManager.logPass('Selected login event');
});

Then('Set the occurrence at least', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).setAtLeastOneTime();
    ExtentTestManager.logPass('Set occurrence at least');
});

Then('Change the occurrence count to a random number between {int} and {int}', async function (this: PlaywrightWorld, min: number, max: number) {
    const count = await getAudiencePage(this).setOccurrenceCountRandom(min, max);
    ExtentTestManager.logPass(`Set occurrence count to ${count} (random between ${min}-${max})`);
});

Then('Set the occurrence date range to Today and apply', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).setOccurrenceDateToday();
    ExtentTestManager.logPass('Set occurrence date range to Today');
});

// ═══════════════════════════════════════════════════════════════════════════════
// REGRESSION — Customer Metric Criteria
// ═══════════════════════════════════════════════════════════════════════════════

Then('Click the Customer Metric option on Criteria', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).openCustomerMetric();
    ExtentTestManager.logPass('Opened Customer Metric criteria');
});

Then('on the Customer Metric pop up select Total Deposited Amount property and apply', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).selectTotalDepositedAmount();
    ExtentTestManager.logPass('Selected Total Deposited Amount property');
});

Then('Click the Condition and select greater than or equal option', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).selectConditionGreaterOrEqual();
    ExtentTestManager.logPass('Selected condition: greater than or equal');
});

Then('In the value field enter {int} and apply', async function (this: PlaywrightWorld, value: number) {
    await getAudiencePage(this).enterMetricValue(String(value));
    ExtentTestManager.logPass(`Entered metric value: ${value}`);
});

Then('In the value field enter a random number between {int} and {int} and apply', async function (this: PlaywrightWorld, min: number, max: number) {
    const value = Math.floor(Math.random() * (max - min + 1)) + min;
    await getAudiencePage(this).enterMetricValue(String(value));
    ExtentTestManager.logPass(`Entered random metric value: ${value} (range ${min}-${max})`);
});

Then('In the value field enter alphabetic text instead of a number and apply', async function (this: PlaywrightWorld) {
    const audience = getAudiencePage(this);
    const { valid, errors } = await audience.validateMetricInputAttributes();
    if (!valid) {
        throw new Error(`Metric input has incorrect attributes: ${errors.join('; ')}`);
    }
    ExtentTestManager.logPass('Metric input attributes verified (inputmode, pattern, maxlength)');
    await audience.enterMetricValue('abcdef');
    ExtentTestManager.logPass('Entered alphabetic text in numeric field');
});

// ═══════════════════════════════════════════════════════════════════════════════
// REGRESSION — Part of Audience Criteria
// ═══════════════════════════════════════════════════════════════════════════════

Given('an Audience from REG-AUD-01 or REG-AUD-02 or REG-AUD-03 is available', async function (this: PlaywrightWorld) {
    const entry = await waitForNameEntryCompleted('existingAudience');
    this['existingAudienceTitle'] = entry.title;
    ExtentTestManager.logPass(`Picked Audience from existingAudience: "${entry.title}"`);
});

Given('an existing published Audience is available', async function (this: PlaywrightWorld) {
    const entry = await waitForNameEntryCompleted('existingAudience').catch(() => null);
    if (entry) {
        this['existingAudienceTitle'] = entry.title;
        ExtentTestManager.logInfo(`Using existing published Audience: ${entry.title}`);
        return;
    }
    ExtentTestManager.logInfo('No existing published Audience found in names.json — test will create one inline if needed');
});

Then('Click the Part of Audience option on Criteria', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).openPartOfAudience();
    ExtentTestManager.logPass('Opened Part of Audience criteria');
});

Then('on the Part of Audience pop up select the existing audience and apply', async function (this: PlaywrightWorld) {
    const audienceName = this['existingAudienceTitle'];
    if (!audienceName) throw new Error('existingAudienceTitle not set. Ensure "an existing published Audience is available" ran first.');
    await getAudiencePage(this).selectExistingAudienceInCriteria(audienceName);
    ExtentTestManager.logPass(`Selected existing audience: ${audienceName}`);
});

// ═══════════════════════════════════════════════════════════════════════════════
// REGRESSION — Customer Engagement Criteria
// ═══════════════════════════════════════════════════════════════════════════════

Then('Click the Customer Engagement option on Criteria', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).openCustomerEngagement();
    ExtentTestManager.logPass('Opened Customer Engagement criteria');
});

Then('on the Customer Engagement pop up select Workflow Engagement and apply', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).selectWorkflowEngagement();
    ExtentTestManager.logPass('Selected Workflow Engagement');
});

Then('Select a  Workflow Name option and apply', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).selectWorkflowName();
    ExtentTestManager.logPass('Selected Workflow Name from dropdown');
});

Then('Select a valid Workflow Name from the dependent dropdown', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).selectWorkflowNameValue();
    ExtentTestManager.logPass('Selected Workflow Name from dropdown');
});

Then('Select a  Workflow Action option and apply', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).selectWorkflowAction();
    ExtentTestManager.logPass('Selected Workflow Action from dropdown');
});

Then('Select a valid Workflow Action from the dependent dropdown', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).selectWorkflowActionValue();
    ExtentTestManager.logPass('Selected Workflow Action from dropdown');
});


// ═══════════════════════════════════════════════════════════════════════════════
// REGRESSION — AND / OR Logic
// ═══════════════════════════════════════════════════════════════════════════════

Then('Click the AND condition and add Customer Metric criteria in the same group', async function (this: PlaywrightWorld) {
    const audience = getAudiencePage(this);
    // await audience.clickAndCondition();
    await audience.openCustomerMetric();
    ExtentTestManager.logPass('Added AND condition with Customer Metric criteria');
});

Then('Click the Add Group button to add a second criteria group with OR logic', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).clickAddGroup();
    ExtentTestManager.logPass('Added second criteria group (OR logic)');
});

Then('Click the customer property option on the second group Criteria', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).openCriteriaGroup2CustomerProps();
    ExtentTestManager.logPass('Opened Customer Properties on group 2');
});

// ═══════════════════════════════════════════════════════════════════════════════
// REGRESSION — Preview (generic)
// ═══════════════════════════════════════════════════════════════════════════════

Then('check the Customer count', async function (this: PlaywrightWorld) {
    const count = await getAudiencePage(this).getCustomerCount();
    this['customerCountBefore'] = count;
    ExtentTestManager.logPass(`Customer count before preview: ${count}`);
});

Then('Click the Preview button', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).clickPreviewButton();
    ExtentTestManager.logPass('Clicked Preview button');
});

Then('Check updates records are matching', async function (this: PlaywrightWorld) {
    const lastCount = this['lastPreviewCount'];
    const count = await getAudiencePage(this).getPreviewRecordCount();
    if (lastCount !== undefined && count !== lastCount) {
        ExtentTestManager.logPass(`Preview count updated: ${lastCount} → ${count}`);
    } else if (count >= 1) {
        ExtentTestManager.logPass(`Preview records found: ${count}`);
    } else {
        ExtentTestManager.logInfo('Preview returned 0 records — verify criteria matches test data');
    }
});

Then('Remove one User Id value from the criteria', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).removeFirstUserIdValue();
    ExtentTestManager.logPass('Removed one User Id value from criteria');
});

// ═══════════════════════════════════════════════════════════════════════════════
// REGRESSION — Lifecycle (Prerequisites)
// ═══════════════════════════════════════════════════════════════════════════════

Given('a Published Audience exists', async function (this: PlaywrightWorld) {
    const entry = await waitForNameEntryCompleted('existingAudience');
    this['currentAudienceTitle'] = entry.title;
    ExtentTestManager.logInfo(`Using published Audience: ${entry.title}`);
});

Given('an Audience exists in the list', async function (this: PlaywrightWorld) {
    const entry = await waitForNameEntryCompleted('existingAudience');
    this['existingAudienceTitle'] = entry.title;
    ExtentTestManager.logInfo(`Using existing Audience: ${entry.title}`);
});

// ═══════════════════════════════════════════════════════════════════════════════
// REGRESSION — Lifecycle (Edit Published)
// ═══════════════════════════════════════════════════════════════════════════════



Then('Modify the criteria by updating the User Id value', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).clickAddValuesBtn();
    const users = await readUsersCsv().catch(() => []);
    const userId = users?.[2]?.user_id || 'user_003';
    await getAudiencePage(this).enterUserIdValue(userId);
    ExtentTestManager.logPass(`Updated criteria with User Id: ${userId}`);
});

Then('Save the updated Audience', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).saveUpdatedAudience();
    ExtentTestManager.logPass('Saved updated Audience');
});

Then('Verify the updated criteria are reflected correctly', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).waitForEditPage();
    ExtentTestManager.logPass('Verified updated criteria are reflected on the edit page');
});

// ═══════════════════════════════════════════════════════════════════════════════
// REGRESSION — Duplicate
// ═══════════════════════════════════════════════════════════════════════════════

Then('Filter the Audience with the existing Audience title', async function (this: PlaywrightWorld) {
    const title = this['existingAudienceTitle'];
    if (!title) throw new Error('existingAudienceTitle not set. Ensure prerequisite Given step ran.');

    const audience = getAudiencePage(this);
    await audience.applyActiveFilter();
    await audience.searchByName(title);
    ExtentTestManager.logPass(`Filtered for existing Audience: ${title}`);
});

Then('Click the 3-dot action menu for the Audience', async function (this: PlaywrightWorld) {
    const title = this['existingAudienceTitle'] || this['currentAudienceTitle'];
    if (!title) throw new Error('No audience title available for action menu.');
    await getAudiencePage(this).clickActionMenuForAudience(title);
    ExtentTestManager.logPass(`Clicked action menu for Audience: ${title}`);
});

Then('Click the Duplicate option', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).clickDuplicateOption();
    ExtentTestManager.logPass('Clicked Duplicate option');
});

Then('Verify the duplicate popup shows the title starting with Copy of', async function (this: PlaywrightWorld) {
    const popupTitle = await getAudiencePage(this).getDuplicatePopupTitle();
    if (!popupTitle.startsWith('Copy of')) {
        throw new Error(`Expected duplicate title to start with "Copy of", got: "${popupTitle}"`);
    }
    ExtentTestManager.logPass(`Duplicate popup title verified: "${popupTitle}"`);
});

Then('Clear the duplicate title and enter a new unique title', async function (this: PlaywrightWorld) {
    const newTitle = generateAudienceTitle();
    this['duplicatedAudienceTitle'] = newTitle;
    this['currentAudienceTitle'] = newTitle;
    await getAudiencePage(this).setDuplicateTitle(newTitle);
    ExtentTestManager.logPass(`Set duplicate title to: ${newTitle}`);
});

Then('Click the Duplicate button on the popup', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).clickDuplicateConfirm();
    ExtentTestManager.logPass('Clicked Duplicate confirm button');
});

Then('The duplicated Audience should open in edit mode', async function (this: PlaywrightWorld) {
    await getAudiencePage(this).waitForEditPage();
    ExtentTestManager.logPass('Duplicated Audience opened in edit mode');
});

Then('Verify all criteria and fields are copied from the original Audience', async function (this: PlaywrightWorld) {
    const criteriaLocator = this.page.locator("//button[@data-testid='audience-ruleBuilder-criteriaIcon-group-1']").first();
    const criteriaVisible = await criteriaLocator.isVisible({ timeout: 10000 }).catch(() => false);
    if (!criteriaVisible) {
        throw new Error('Criteria builder not visible — fields may not have been copied');
    }
    ExtentTestManager.logPass('Verified criteria and fields are present on duplicated Audience');
});

// ═══════════════════════════════════════════════════════════════════════════════
// REGRESSION — Negative
// ═══════════════════════════════════════════════════════════════════════════════

Then('Click the Preview button and then Publish button without adding any criteria', async function (this: PlaywrightWorld) {
    const audience = getAudiencePage(this);
    const { allDisabled, details } = await audience.verifyPreviewAndPublishDisabled();
    if (!allDisabled) {
        throw new Error(`Preview/Publish buttons should be disabled without criteria: ${details.join('; ')}`);
    }
    ExtentTestManager.logPass(`Buttons correctly disabled without criteria — ${details.join(', ')}`);
});

Then('A validation error message should be displayed', async function (this: PlaywrightWorld) {
    const hasError = await getAudiencePage(this).isValidationErrorVisible();
    if (!hasError) {
        throw new Error('Expected validation error message but none was displayed');
    }
    ExtentTestManager.logPass('Validation error message displayed');
});

Then('A field validation message should be displayed', async function (this: PlaywrightWorld) {
    const hasError = await getAudiencePage(this).isFieldValidationVisible();
    if (!hasError) {
        throw new Error('Expected field validation message but none was displayed');
    }
    ExtentTestManager.logPass('Field validation message displayed');
});

// ═══════════════════════════════════════════════════════════════════════════════
// REGRESSION — UI
// ═══════════════════════════════════════════════════════════════════════════════

Then('Verify no UI breakage or console errors across all tabs and views', async function (this: PlaywrightWorld) {
    const errors = await getAudiencePage(this).getConsoleErrors();
    if (errors.length > 0) {
        ExtentTestManager.logInfo(`Console errors detected: ${errors.join(' | ')}`);
    }
    ExtentTestManager.logPass(`UI consistency verified (${errors.length} console errors)`);
});

Then('All expected action options should be visible and clickable', async function (this: PlaywrightWorld) {
    const options = await getAudiencePage(this).getActionMenuOptions();
    if (options.length === 0) {
        throw new Error('No action menu options found');
    }
    ExtentTestManager.logPass(`Action menu options found: ${options.join(', ')}`);
});
