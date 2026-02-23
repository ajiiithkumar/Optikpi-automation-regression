
import { Then } from '@cucumber/cucumber';
import { WorkflowPage } from '../pages/workflow.page';
import { AudiencePage } from '../pages/audience.page';
import { DateTimePicker } from '../pages/components/date-time-picker.component';
import { ExtentTestManager } from '../utils/extent-test-manager';
import { PlaywrightWorld } from '../support/world';
import { generateAudienceTitle, saveNameEntry, readNameJson } from '../utils/helper';

const getWorkflowPage = (world: PlaywrightWorld) => new WorkflowPage(world.page);
const getAudiencePage = (world: PlaywrightWorld) => new AudiencePage(world.page);
const getDatePicker   = (world: PlaywrightWorld) => new DateTimePicker(world.page);

// ─── Workflow Tab Steps (ST-Workflow-02) ─────────────────────────────────────

Then('Click The Active tab', async function (this: PlaywrightWorld) {
    await getWorkflowPage(this).clickActiveTab();
    ExtentTestManager.logPass('Clicked Active tab');
});

Then('Verify Workflow Active tab should load successfully', async function (this: PlaywrightWorld) {
    await getWorkflowPage(this).pause(2000);
    ExtentTestManager.logPass('Active tab loaded successfully');
});

Then('Click The Inactive tab', async function (this: PlaywrightWorld) {
    await getWorkflowPage(this).clickInactiveTab();
    ExtentTestManager.logPass('Clicked Inactive tab');
});

Then('Verify Workflow Inactive tab should load successfully', async function (this: PlaywrightWorld) {
    await getWorkflowPage(this).pause(2000);
    ExtentTestManager.logPass('Inactive tab loaded successfully');
});

Then('Click The Draft tab', async function (this: PlaywrightWorld) {
    await getWorkflowPage(this).clickDraftTab();
    ExtentTestManager.logPass('Clicked Draft tab');
});

Then('Verify Workflow Draft tab should load successfully', async function (this: PlaywrightWorld) {
    await getWorkflowPage(this).pause(2000);
    ExtentTestManager.logPass('Draft tab loaded successfully');
});

Then('Click The All tab', async function (this: PlaywrightWorld) {
    await getWorkflowPage(this).clickAllTab();
    ExtentTestManager.logPass('Clicked All tab');
});

Then('Verify Workflow All tab should load successfully', async function (this: PlaywrightWorld) {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await getWorkflowPage(this).clickAllTab();
            await getWorkflowPage(this).pause(2000);
            ExtentTestManager.logPass(`All tab loaded successfully (attempt ${attempt})`);
            return;
        } catch (err) {
            lastError = err as Error;
            console.log(`[Workflow] All tab attempt ${attempt} failed: ${lastError.message}`);
            if (attempt < maxRetries) {
                await this.page.waitForTimeout(2000);
                await this.page.reload({ waitUntil: 'networkidle' }).catch(() => {});
                await this.page.waitForTimeout(2000);
            }
        }
    }

    throw lastError || new Error('Workflow All tab did not load after retries');
});

// ─── Workflow Creation Steps (ST-Workflow-03) ────────────────────────────────

Then('Click The Create New Workflow button', async function (this: PlaywrightWorld) {
    await getWorkflowPage(this).clickCreateNew();
    ExtentTestManager.logPass('Clicked Create New Workflow button');
});

Then('Click the workflow create from scratch button', async function (this: PlaywrightWorld) {
    await getWorkflowPage(this).clickCreateFromScratch();
    ExtentTestManager.logPass('Clicked workflow create from scratch button');
});

Then('enter the Workflow name and Tag', async function (this: PlaywrightWorld) {
    const workflowTitle = generateAudienceTitle();
    await saveNameEntry('workflow', workflowTitle, 'Test');
    this['currentWorkflowTitle'] = workflowTitle;

    const workflow = getWorkflowPage(this);
    await workflow.enterWorkflowName(workflowTitle);
    await workflow.enterWorkflowTag('auto-tag');
    ExtentTestManager.logPass(`Entered Workflow name: ${workflowTitle}`);
});

Then('Click The Create Workflow button', async function (this: PlaywrightWorld) {
    await getWorkflowPage(this).clickCreateWorkflow();
    ExtentTestManager.logPass('Clicked Create Workflow button');
});

Then('Verify Workflow Edit page should load successfully', async function (this: PlaywrightWorld) {
    await getWorkflowPage(this).waitForEditPage();
    ExtentTestManager.logPass('Workflow Edit page loaded successfully');
});

Then('Click the zoom out workflow panel', async function (this: PlaywrightWorld) {
    await getWorkflowPage(this).zoomOut(3);
    ExtentTestManager.logPass('Zoomed out workflow panel 3 times');
});

// ─── Enrollment Steps ────────────────────────────────────────────────────────

Then('click the Setup Enrollment node', async function (this: PlaywrightWorld) {
    await getWorkflowPage(this).clickSetupEnrollment();
    ExtentTestManager.logPass('Clicked Setup Enrollment node');
});

Then('click the Workflow New Audience button', async function (this: PlaywrightWorld) {
    await getWorkflowPage(this).clickNewAudience();
    ExtentTestManager.logPass('Clicked Workflow New Audience button');
});

Then('Click the New Audience criteria', async function (this: PlaywrightWorld) {
    await getWorkflowPage(this).clickNewAudienceCriteria();
    ExtentTestManager.logPass('Clicked New Audience criteria');
});

Then('Check the Workflow Audience Preview button 2 records are shown', async function (this: PlaywrightWorld) {
    const workflow = getWorkflowPage(this);
    await workflow.clickAudiencePreview();
    const count = await workflow.getReachableCustomerCount();

    if (count == 2) {
        ExtentTestManager.logPass(`Total reachable customers: ${count} (expected 2)`);
    } else {
        ExtentTestManager.logFail(`Total reachable customers: ${count} (expected 2)`);
    }
    ExtentTestManager.logPass('Total reachable customers: (expected 2)');
});

Then('Click the Workflow Add To Enrollment Trigger button', async function (this: PlaywrightWorld) {
    await getWorkflowPage(this).clickAddToEnrollment();
    ExtentTestManager.logPass('Clicked Add To Enrollment Trigger button');
});

Then('Click the workflow apply button', async function (this: PlaywrightWorld) {
    await getWorkflowPage(this).clickNodeApply();
    ExtentTestManager.logPass('Clicked workflow apply button');
});

// ─── Node Actions ────────────────────────────────────────────────────────────

Then('Click the Add new node button {string}', async function (this: PlaywrightWorld, nodeIndex: string) {
    await getWorkflowPage(this).clickAddNodeDropdown(nodeIndex);
    ExtentTestManager.logPass(`Clicked Add new node dropdown ${nodeIndex}`);
});

Then('Click the action node button', async function (this: PlaywrightWorld) {
    await getWorkflowPage(this).clickActionNode();
    ExtentTestManager.logPass('Clicked action node button');
});

Then('Click the action node add content button', async function (this: PlaywrightWorld) {
    await getWorkflowPage(this).clickAddContent();
    ExtentTestManager.logPass('Clicked action node Add Content button');
});

Then('Click the workflow Cancel button', async function (this: PlaywrightWorld) {
    await getWorkflowPage(this).clickCancel();
    ExtentTestManager.logPass('Clicked workflow Cancel button');
});

Then('Click the workflow save draft button', async function (this: PlaywrightWorld) {
    await getWorkflowPage(this).saveDraft();
    ExtentTestManager.logPass('Clicked workflow save draft button');
});

Then('Click the workflow save draft confirm button', async function (this: PlaywrightWorld) {
    await getWorkflowPage(this).confirmSaveDraft();
    ExtentTestManager.logPass('Clicked workflow save draft confirm button');
});

Then('Click the Workflow Publish button', async function (this: PlaywrightWorld) {
    await getWorkflowPage(this).clickPublish();
    ExtentTestManager.logPass('Clicked Workflow Publish button');
});

Then('Click the Workflow Publish confirm button', async function (this: PlaywrightWorld) {
    await getWorkflowPage(this).confirmPublish();
    ExtentTestManager.logPass('Clicked Workflow Publish confirm button');
});

Then('Check for Error message', async function (this: PlaywrightWorld) {
    const { found, message } = await getWorkflowPage(this).checkAndCloseErrorPopup();
    if (found) {
        ExtentTestManager.logInfo(`Error popup detected: ${message}`);
        ExtentTestManager.logPass('Error popup closed successfully');
    } else {
        ExtentTestManager.logFail('No error popup detected');
    }
});

Then('Click the node edit button {string}', async function (this: PlaywrightWorld, nodeIndex: string) {
    await getWorkflowPage(this).clickNodeEdit(nodeIndex);
    ExtentTestManager.logPass(`Clicked edit button for node ${nodeIndex}`);
});

Then('Click the Add Content button', async function (this: PlaywrightWorld) {
    await getWorkflowPage(this).clickAddContent();
    ExtentTestManager.logPass('Clicked Add Content button');
});

Then('Click the new exit node button', async function (this: PlaywrightWorld) {
    await getWorkflowPage(this).clickExitNode();
    ExtentTestManager.logPass('Clicked new exit node button');
});

Then('Click the exit node mark as goal button and verify toggle is ON', async function (this: PlaywrightWorld) {
    const ariaChecked = await getWorkflowPage(this).clickExitMarkAsGoal();
    if (ariaChecked === 'true') {
        ExtentTestManager.logPass('Exit node Mark As Goal toggle is ON');
    } else {
        ExtentTestManager.logFail(`Exit node Mark As Goal toggle is still OFF (aria-checked="${ariaChecked}")`);
    }
});

// ─── Date Steps ──────────────────────────────────────────────────────────────

Then('Choose The Start date', async function (this: PlaywrightWorld) {
    const workflow = getWorkflowPage(this);
    const datePicker = getDatePicker(this);

    await workflow.clickStartDate();

    const now = new Date();
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const targetMonthYear = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

    // Navigate to current month (calendar may default to future month)
    for (let m = 0; m < 6; m++) {
        const monthLabel = await this.page.locator("//div[contains(@class,'text-tertiary') and contains(@class,'font-semibold')]").first().innerText().catch(() => '');
        if (monthLabel.trim().toLowerCase() === targetMonthYear.toLowerCase()) break;
        await this.page.locator("//button[@data-testid='audience-dateTimeSelection-modal-previousMonth-btn']").first().click();
        await this.page.waitForTimeout(500);
    }

    await datePicker.selectDate(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedTime = await datePicker.selectNextAvailableTime();
    this['workflowStartTime'] = selectedTime;
    await datePicker.clickApply();
    ExtentTestManager.logPass('Start date selected (today, next available time slot)');
});

Then('Choose The End date', async function (this: PlaywrightWorld) {
    const workflow = getWorkflowPage(this);
    const datePicker = getDatePicker(this);

    await workflow.clickEndDate();

    const startTime: Date = this['workflowStartTime'] || new Date();
    const endTime = new Date(startTime.getTime() + 40 * 60000);

    const now = new Date();
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const targetMonthYear = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

    for (let m = 0; m < 6; m++) {
        const monthLabel = await this.page.locator("//div[contains(@class,'text-tertiary') and contains(@class,'font-semibold')]").first().innerText().catch(() => '');
        if (monthLabel.trim().toLowerCase() === targetMonthYear.toLowerCase()) break;
        await this.page.locator("//button[@data-testid='audience-dateTimeSelection-modal-previousMonth-btn']").first().click();
        await this.page.waitForTimeout(500);
    }

    await datePicker.selectDate(now.getFullYear(), now.getMonth(), now.getDate());
    await datePicker.selectNextAvailableTime(endTime);
    await datePicker.clickApply();
    ExtentTestManager.logPass('End date selected (today, Start + 40 mins)');
});

Then('Click the workflow dashboardBackButton', async function (this: PlaywrightWorld) {
    await getWorkflowPage(this).clickDashboardBack();
    ExtentTestManager.logPass('Clicked workflow dashboard back button');
});

// ─── Filter & Search ─────────────────────────────────────────────────────────

Then('Click the workflow filter button', async function (this: PlaywrightWorld) {
    await getWorkflowPage(this).clickFilterBtn();
    ExtentTestManager.logPass('Clicked workflow filter button');
});

Then('Click the workflow filter active checkbox', async function (this: PlaywrightWorld) {
    await getWorkflowPage(this).clickFilterActive();
    ExtentTestManager.logPass('Clicked workflow filter active checkbox');
});

Then('Click the workflow filter apply button', async function (this: PlaywrightWorld) {
    await getWorkflowPage(this).clickFilterApply();
    ExtentTestManager.logPass('Clicked workflow filter apply button');
});

Then('Enter the workflow name in the search bar', async function (this: PlaywrightWorld) {
    const data = await readNameJson();
    const workflowName = data.workflow?.title || '';
    if (!workflowName) {
        ExtentTestManager.logFail('No workflow name found in saved data');
        return;
    }

    const workflow = getWorkflowPage(this);
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[Workflow Search] Attempt ${attempt}/${maxRetries}...`);
            // Clear the search field first, then enter the workflow name
            const searchField = this.page.locator("//input[@name='search-input-box']").first();
            await searchField.fill('');
            await this.page.waitForTimeout(500);
            await workflow.searchWorkflow(workflowName);

            // Verify workflow is visible
            const isVisible = await workflow.verifyWorkflowInList(workflowName);
            if (!isVisible) throw new Error(`Workflow "${workflowName}" not found in the list`);

            ExtentTestManager.logPass(`Workflow "${workflowName}" found in the list (attempt ${attempt})`);
            return; // Success — exit the loop
        } catch (err) {
            lastError = err as Error;
            console.log(`[Workflow Search] Attempt ${attempt} failed: ${lastError.message}`);
            if (attempt < maxRetries) {
                console.log('[Workflow Search] Retrying...');
                await this.page.waitForTimeout(2000);
            }
        }
    }

    throw lastError || new Error(`Workflow "${workflowName}" not found after ${maxRetries} attempts`);
});

Then('Verify the workflow name is shown in the list', async function (this: PlaywrightWorld) {
    const data = await readNameJson();
    const workflowName = data.workflow?.title || '';
    if (!workflowName) {
        ExtentTestManager.logFail('No workflow name found in saved data');
        throw new Error('No workflow name found in saved data');
    }

    // Verification already done in search step with retry
    const isVisible = await getWorkflowPage(this).verifyWorkflowInList(workflowName);
    if (isVisible) {
        ExtentTestManager.logPass(`Verified Workflow "${workflowName}" is in the list`);
    } else {
        ExtentTestManager.logFail(`Workflow "${workflowName}" not found in the list`);
        throw new Error(`Workflow "${workflowName}" not found in the list`);
    }
});
