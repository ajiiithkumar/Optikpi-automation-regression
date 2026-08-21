import { BasePage } from './base.page';
import { ExtentTestManager } from '../utils/extent-test-manager';

/**
 * AudiencePage — encapsulates all Audience module selectors and actions.
 */
export class AudiencePage extends BasePage {

    private readonly sel = {
        // Tabs
        tabAll: "//a[@data-testid='audience-tab-all']",
        tabLive: "//a[@data-testid='audience-tab-live']",
        tabOnSchedule: "//a[@data-testid='audience-tab-scheduled']",
        tabStatic: "//a[@data-testid='audience-tab-static']",
        staticTabActive: "//h3[normalize-space()='Static audiences']",

        // View toggle
        viewDropdown: "//button[@data-testid='audience-select-menu']",
        cardViewBtn: "//button[@data-testid='audience-select-menu-card-view']",
        listViewBtn: "//button[@data-testid='audience-select-menu-list-view']",
        cardViewContainer: "//button[@data-testid='audience-select-menu-card-view' and @aria-pressed='true']",
        listViewContainer: "//button[@data-testid='audience-select-menu-list-view' and @aria-pressed='true']",

        // Create
        createNewBtn: "//button[@data-testid='create-new-audience-btn']",
        createFromScratch: "//li[@data-testid='audience-create-from-scratch-modal-btn'] | //*[normalize-space()='Create from scratch' and not(ancestor::li)]",
        nameInput: "//input[@data-testid='create-audience-modal-popup-input']",
        tagsInput: "//input[@data-testid='create-audience-modal-popup-tag']",
        submitBtn: "//button[@data-testid='create-audience-modal-popup-ok-btn']",
        editTitle: "//h2[contains(@class,'text-2xl')]",


        // Criteria
        criteria: "//button[@data-testid='audience-ruleBuilder-criteriaIcon-group-1']",
        criteriaCustomerProps: "//button[@data-testid='audience-ruleBuilder-criteriaIcon-group-1-customer-properties']",
        customerPropsEvent: "//button[normalize-space()='+ customer property' or contains(@data-testid,'customer property-btn-')]",
        userIdInput: "//input[@data-testid='user_id']",
        ConditionIsOneOfBtn: "//input[@data-testid='is-one-of']",
        searchField: "//input[@id='search-data']",
        CustomerPropertiesValueslevel1Btn: "//button[contains(@data-testid,'customer-properties-group-') and contains(@data-testid,'-values-btn-') and not(contains(normalize-space(), 'Add'))]",
        CustomerEngagementValueslevel1Btn: "//button[contains(@data-testid,'customer-engagement-group-') and contains(@data-testid,'-eventValues-btn-') and not(contains(normalize-space(), 'Add'))]",
        CustomerEngagementValueslevel2Btn: "//button[contains(@data-testid,'customer-engagement-group-') and contains(@data-testid,'-eventValues-btn-') and contains(normalize-space(), 'Add')]",
        addValuesBtn: "//button[@data-testid='commonProfile-add-values-btn']",
        CustomerPropertiesValueslevel2Btn: "//button[contains(@data-testid,'customer-properties-group-') and contains(@data-testid,'-values-btn-')]",
        // Preview
        preview1: "//button[@data-testid='audience-ruleBuilder-previewButton']",
        preview2: "//button[@data-testid='audience-ruleBuilder-preview-refresh-button']",

        // Save / Publish
        saveDraftBtn: "//button[@data-testid='audience-create-save-draft-btn']",
        saveDraftConfirm: "//button[@data-testid='audience-save-draft-create-btn']",
        cancelBtn: "//button[@data-testid='audience-cancel-save-draft']",
        publishBtn: "//button[@data-testid='audience-create-publish-now-btn']",
        publishConfirm1: "//button[@data-testid='audience-publish-create-btn']",
        publishCancel: "//button[@data-testid='audience-cancel-publish']",
        publishTypeConfirm: "//button[@data-testid='audience-type-modal-confirm-btn']",
        publishStatic: "//button[@data-testid='audience-type-modal-static-input-radio']",
        publishSchedule: "//input[@data-testid='audience-type-modal-scheduled-input-radio']",
        updateBtn: "//button[@data-testid='audience-edit-update-btn']",
        updateConfirm: "//button[@data-testid='audience-publish-edit-btn']",

        // Filter & Search
        filterBtn: "//button[@data-testid='audience-table-listing-filter-btn']",
        filterActive: "//input[@data-testid='audience-active']",
        filterApplyBtn: "//button[@data-testid='audience-apply-btn']",
        mainSearchField: "//input[@placeholder='Search']",

        // Criteria — Event Performed
        criteriaEventPerformed: "//button[@data-testid='audience-ruleBuilder-criteriaIcon-group-1-event-performed']",
        criteriaevent: "//button[normalize-space()='+ event' or contains(@data-testid,'event-performed-group-1-event-btn-')]",
        eventLoginOption: "//input[@data-testid='login']",
        eventOccurrenceExactlyOnce: "//span[@data-testid='audience-ruleBuilder-event-performed-group-1-occurrence-condition-btn-1']",
        eventOccurrenceAtLeast: "//input[@data-testid='atleast-[#]-time']",
        occurrenceCountInput: "//input[@class='w-10 px-2 py-1 text-sm outline-none border-none bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none']",
        eventDateRangeBtn: "//span[@data-testid='audience-ruleBuilder-event-performed-group-1-dateTimePickerModal-rangeValue-Btn-1']",
        eventDateRangeToday: "//ul[@data-testid='dateTimePicker-modal-relative-today']",
        eventDateRangeApply: "//button[@data-testid='dateTimePicker-modal-apply-button']",
        eventDateRangeCancel: "//button[@data-testid='dateTimePicker-modal-cancel-button']",
        TimeWindowBtn: "//button[@class='bg-white flex flex-row items-center justify-center border border-gray-300 rounded-lg px-3 py-2 cursor-pointer']",
        SlectedTimeWindowclose: "//span[normalize-space()='Today']/ancestor::div[contains(@class,'bg-white')]//button[contains(@class,'ps-1')]",



        // Criteria — Customer Metric
        criteriaCustomerMetric: "//button[@data-testid='audience-ruleBuilder-criteriaIcon-group-1-customer-metric']",
        criteriaCustomerMetricEvent: "//button[@class='bg-white flex flex-row items-center justify-center rounded-md px-3 py-2 border border-gray-300 cursor-pointer']",
        metricTotalDeposited: "//input[@data-testid='total-deposited-amount']",
        ConditionBtn: "//button[@class='bg-white flex flex-row items-center justify-center border border-gray-300 rounded-lg px-3 py-2 cursor-pointer']",
        metricConditionGreaterEqual: "//input[@data-testid='greater-than-or-equal-to']",
        metricValueInput: "//input[@class='text-center focus:outline-none']",

        // Criteria — Part of Audience
        criteriaPartOfAudience: "//button[@data-testid='audience-ruleBuilder-criteriaIcon-group-1-part-of-an-audience']",
        criteriaPartOfAudienceevent: "//button[contains(@data-testid,'existingAudience-') or contains(normalize-space(),'audience') or contains(normalize-space(),'Audience')]",
        partOfAudienceDropdown: "//button[contains(@data-testid,'existingAudience-') or contains(normalize-space(),'audience') or contains(normalize-space(),'Audience')]",
        partOfAudienceSearch: "//input[@id='search-data'] | //input[@placeholder='Search'] | //*[@role='dialog']//input[@type='text'] | //*[contains(text(),'Select one of the existing')]/preceding-sibling::*//input | //*[contains(@class, 'search')]//input",
        AddAudienceBtn: "//button[@data-testid='commonProfile-add-audience-btn']",

        // Criteria — Customer Engagement
        criteriaCustomerEngagement: "//button[@data-testid='audience-ruleBuilder-criteriaIcon-group-1-customer-engagement']",
        criteriaCustomerEngagementevent: "//button[contains(normalize-space(),'+ engagement') or contains(normalize-space(),'+ customer engagement') or (contains(@data-testid,'customer-engagement') and contains(@data-testid,'btn-'))]",
        engagementWorkflow: "//input[@data-testid='workflow_engagement']",
        engagementattribute: "//button[contains(@data-testid,'eventAttribute-btn-') or contains(normalize-space(),'workflow') or contains(normalize-space(),'Workflow')]",
        workflowName: "//input[@data-testid='workflow_id']",
        workflowAction: "//input[@data-testid='node_id']",

        // AND / OR logic
        Group1AndConditionBtn: "//button[@data-testid='audience-ruleBuilder-criteriaIcon-group-1']",
        addGroupBtn: "//button[@data-testid='audience-ruleBuilder-OR-groupIcon'] | //*[normalize-space()='+ OR group']",
        criteriaGroup2: "//button[@data-testid='audience-ruleBuilder-criteriaIcon-group-2']",
        criteriaGroup2CustomerProps: "//button[@data-testid='audience-ruleBuilder-criteriaIcon-group-2-customer-properties']",

        // Action menu (list view)
        actionMenuBtnTemplate: "//tr[.//span[contains(normalize-space(.), '{{TITLE}}')]]//button[contains(@class,'action') or @data-testid]//span[contains(@class,'dots') or text()='⋮']/.. | //tr[.//span[contains(normalize-space(.), '{{TITLE}}')]]//td[last()]//button",
        duplicateOption: "//button[normalize-space()='Duplicate' or @data-testid='audience-listView-tableList-dropdownIcon-1-duplicate']",
        duplicatePopupInput: "//div[contains(@class,'modal') or @role='dialog']//input",
        duplicatePopupBtn: "//button[normalize-space()='Duplicate']",
        duplicatePopupCancel: "//button[normalize-space()='Cancel']",
        duplicatePopupTitle: "//div[contains(@class,'modal') or @role='dialog']//input",


        // Validation
        validationError: "//div[contains(@class,'bg-warning')]//p[string-length(normalize-space()) > 0]",

        // Value removal
        removeValueBtn: "//button[@data-testid='audience-ruleBuilder-customer-properties-group-1-eventValue-clearBtn-1-values']",

        conditionIsNotEmpty: "[data-testid='is-not-empty']",
        previewViewAllBtn:   "[data-testid='audience-ruleBuilder-preview-totalCustomers-viewall-button']",
        flyoutBackToEditor:  "[data-testid='audience-flyout-backToEditor-button']",
        customerListSearchInput: "[data-testid='audience-customerList-search-input'], input[placeholder*='Search'], [aria-label='Search']",
        customerListTableRow:    "[data-testid^='audience-customerList-tableRow']",
        audienceSearchInput:     "[data-testid='audience-listView-searchInput']",
        firstRowThreeDotIcon:    "[data-testid='audience-listView-tableList-dropdownIcon-1']",
        downloadCustomerListBtn: "[data-testid='audience-listView-tableList-dropdownIcon-1-download-customer-list']",
        downloadSubmitBtn:       "[data-testid='modal-submit-button']",
        downloadGenerateBtn:     "button:has-text('Generate'), [data-testid*='download-generate'], [data-testid*='customer-list-generate']",
        createNewDropdownBtn:    "[data-testid='create-new-audience-dropdown-btn']",
        retentionAudienceBtn:    "[data-testid='create-new-audience-dropdown-btn-retention-audience']",
        csvFileInput:            "#selectFile",
        createNewCampaignBtn: "[data-testid='audience-listView-tableList-dropdownIcon-1-create-new-campaign']",
        viewHistoryLogBtn: "[data-testid='audience-listView-tableList-dropdownIcon-1-view-history-log']",
        historyLogEntry:   "tr:nth-of-type(1) span > span.block",
        reportIcon: "xpath=//*[@data-testid='audience-listView-tableList-reportIcon-1']/svg",
    };

    // ─── Tab Navigation ──────────────────────────────────────────────────────

    async clickTabAll() { await this.click(this.sel.tabAll); }
    async clickTabLive() { await this.click(this.sel.tabLive); }
    async clickTabOnSchedule() { await this.click(this.sel.tabOnSchedule); }
    async clickTabStatic() { await this.click(this.sel.tabStatic); }

    async isStaticTabActive(): Promise<boolean> {
        return this.isVisible(this.sel.staticTabActive);
    }

    // ─── View Toggle ─────────────────────────────────────────────────────────

    async switchToCardView() {
        // Dropdown removed from UI — card view button is now directly clickable
        await this.click(this.sel.cardViewBtn);
    }

    async switchToListView() {
        // Dropdown removed from UI — list view button is now directly clickable
        await this.click(this.sel.listViewBtn);
    }

    async waitForCardView() {
        await this.pause(5000);
        await this.waitForVisible(this.sel.cardViewContainer);
    }

    async waitForListView() {
        await this.pause(5000);
        await this.waitForVisible(this.sel.listViewContainer);
    }

    // ─── Audience Creation ───────────────────────────────────────────────────

    async clickCreateNew() {
        await this.click(this.sel.createNewBtn);
    }
    async clickCreateFromScratch() {
        // Specifically click the 'Create audience' link inside the 'Create from scratch' template card
        await this.click(this.sel.createFromScratch);
    }

    async waitForCreatePage() {
        await this.waitForVisible(this.sel.nameInput, 30000);
    }

    async fillDetails(name: string, tag?: string) {
        await this.fill(this.sel.nameInput, name);
        if (tag) {
            const visible = await this.isVisible(this.sel.tagsInput);
            if (visible) {
                await this.fill(this.sel.tagsInput, tag);
                await this.page.keyboard.press('Enter').catch(() => { });
            }
        }
    }

    async clickCreateSubmit() {
        const submitBtn = this.page.locator(this.sel.submitBtn).first();
        await submitBtn.waitFor({ state: 'visible', timeout: 20000 });
        await Promise.allSettled([
            this.page.waitForLoadState('networkidle').catch(() => { }),
            submitBtn.click({ timeout: 20000 }),
        ]);
    }

    async waitForEditPage() {
        await this.waitForVisible(this.sel.criteria);
    }

    // ─── Criteria Builder ────────────────────────────────────────────────────

    async openCustomerProperty() {
        await this.click(this.sel.criteria);
        await this.click(this.sel.criteriaCustomerProps);
    }

    async selectUserIdProperty() {
        await this.click(this.sel.customerPropsEvent);
        await this.click(this.sel.userIdInput);
    }

    async selectConditionIsOneOf() {
        await this.click(this.sel.ConditionBtn);
        await this.click(this.sel.ConditionIsOneOfBtn);
    }

    async selectCustomerPropertiesValueslevel1Btn() {
        await this.clickLast(this.sel.CustomerPropertiesValueslevel1Btn);
    }

    async clickAddValuesBtn() {
        await this.clickLast(this.sel.CustomerPropertiesValueslevel2Btn);
    }

    async enterUserIdValue(userId: string) {
        await this.pause(1000);
        const searchField = this.page.locator(this.sel.searchField).first();
        await searchField.waitFor({ state: 'visible', timeout: 15000 });
        await searchField.fill(userId);
        await this.pause(1000); // wait for search filter

        // Try to click the specific value's checkbox/label, or the first available checkbox
        const exactMatch = this.page.locator(`//label[contains(normalize-space(), '${userId}')] | //div[contains(@class, 'checkbox')]//span[contains(normalize-space(), '${userId}')]`).first();
        const firstCheckbox = this.page.locator('input[type="checkbox"]').first();

        if (await exactMatch.isVisible().catch(() => false)) {
            await exactMatch.click();
        } else if (await firstCheckbox.isVisible().catch(() => false)) {
            await firstCheckbox.click();
        } else {
            // Fallback: press Enter or click "+ Add value" if it's a new value
            await this.page.keyboard.press('Enter').catch(() => { });
        }

        await this.pause(500);
        await this.click(this.sel.addValuesBtn);
    }

    async addExtraUserIds(userIds: string[]) {
        await this.click(this.sel.addValuesBtn);
        await this.pause(2000);
        const searchField = this.page.locator(this.sel.searchField).first();
        await searchField.waitFor({ state: 'visible', timeout: 20000 });

        for (const userId of userIds) {
            await searchField.fill(userId);
            await this.page.keyboard.press('Enter').catch(() => { });
        }
        await this.click(this.sel.addValuesBtn);
    }

    // ─── Preview ─────────────────────────────────────────────────────────────

    async clickPreview1() {
        await this.click(this.sel.preview1);
    }
    
    async isPreviewDisabled(): Promise<boolean> {
        const previewBtn = this.page.locator(this.sel.preview1).first();
        return await previewBtn.isDisabled();
    }
    
    async isIncompleteCriteriaErrorVisible(): Promise<boolean> {
        const errorLocator = this.page.locator("text='Please choose a valid rule to activate the preview and publish button.'");
        return await errorLocator.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false);
    }
    
    async clickPreview2() { await this.click(this.sel.preview2); }

    // ─── Save / Publish ──────────────────────────────────────────────────────

    async clickPublishBtn() {
        await this.click(this.sel.publishBtn);
    }

    async saveDraft() {
        await this.click(this.sel.saveDraftBtn);
        const confirmBtn = this.page.locator(this.sel.saveDraftConfirm).first();
        await confirmBtn.waitFor({ state: 'visible', timeout: 20000 });
        await Promise.allSettled([
            this.page.waitForLoadState('networkidle').catch(() => { }),
            confirmBtn.click(),
        ]);
    }

    async publishAndCancel(): Promise<{ beforeUrl: string; afterUrl: string }> {
        const beforeUrl = this.page.url();
        await this.click(this.sel.publishBtn);
        await this.click(this.sel.publishCancel);
        const afterUrl = this.page.url();
        return { beforeUrl, afterUrl };
    }

    async publishStatic() {
        const publishBtn = this.page.locator(`${this.sel.publishBtn} | ${this.sel.updateBtn}`).first();
        await publishBtn.waitFor({ state: 'visible', timeout: 20000 });
        await publishBtn.click();

        const confirmBtn = this.page.locator(`${this.sel.publishConfirm1} | ${this.sel.updateConfirm}`).first();
        await confirmBtn.waitFor({ state: 'visible', timeout: 20000 });
        await Promise.allSettled([
            this.page.waitForLoadState('networkidle').catch(() => { }),
            confirmBtn.click(),
        ]);

        await this.click(this.sel.publishStatic);
        await this.click(this.sel.publishTypeConfirm);
        await this.pause(4000);
    }

    async publishSchedule() {
        const publishBtn = this.page.locator(`${this.sel.publishBtn} | ${this.sel.updateBtn}`).first();
        await publishBtn.waitFor({ state: 'visible', timeout: 20000 });
        await publishBtn.click();

        const confirmBtn = this.page.locator(`${this.sel.publishConfirm1} | ${this.sel.updateConfirm}`).first();
        await confirmBtn.waitFor({ state: 'visible', timeout: 20000 });
        await Promise.allSettled([
            this.page.waitForLoadState('networkidle').catch(() => { }),
            confirmBtn.click(),
        ]);

        await this.page.locator(this.sel.publishSchedule).click();
        await this.click(this.sel.publishTypeConfirm);
    }

    // ─── Filter & Search ─────────────────────────────────────────────────────

    async applyStatusFilter(status: string) {
        await this.click(this.sel.filterBtn);
        const testId = `audience-${status.toLowerCase()}`;
        const checkboxSelector = `//input[@data-testid='${testId}']`;
        await this.page.locator(checkboxSelector).check().catch(() => this.click(checkboxSelector));
        await this.click(this.sel.filterApplyBtn);
        await this.pause(2000); // Give the table time to filter
    }

    async searchByName(name: string) {
        const searchField = this.page.locator(this.sel.mainSearchField).first();
        // Explicitly wait for the search box to appear (solves race conditions after page redirects)
        await searchField.waitFor({ state: 'visible', timeout: 30000 });

        // Clear existing text first
        await searchField.fill('');
        await this.page.waitForTimeout(500);

        // Type the new search term and hit Enter
        await searchField.fill(name);
        await this.page.keyboard.press('Enter').catch(() => { });
        await this.pause(2000); // Give the table time to filter
    }

    // ─── Edit Audience ───────────────────────────────────────────────────────

    async openEditForAudience(title: string) {
        const titleXPath = !title.includes("'") ? `'${title}'` : `"${title}"`;
        const menuSelector = `//tr[.//span[contains(normalize-space(.), ${titleXPath})]]//button[contains(@data-testid,'audience-listView-tableList-dropdownIcon')]`;
        await this.click(menuSelector);

        const editBtn = this.page.locator("//button[contains(normalize-space(),'Edit Audience') or @data-testid='audience-listView-tableList-dropdownIcon-1-edit-audience'] | //li[normalize-space()='Edit Audience']").first();
        await editBtn.waitFor({ state: 'visible', timeout: 20000 });
        await editBtn.click();
    }

    async verifyEditPageTitle(expectedTitle: string) {
        const titleHeader = this.page.locator(this.sel.editTitle, { hasText: expectedTitle }).first();
        await titleHeader.waitFor({ state: 'visible', timeout: 20000 });
        const headerText = (await titleHeader.textContent())?.trim() || '';

        if (headerText !== expectedTitle) {
            throw new Error(`Audience header title mismatch. Expected "${expectedTitle}", got "${headerText}"`);
        }
    }

    async verifyTooltipTitle(expectedTitle: string) {
        // 1. Locate the hidden tooltip
        const tooltipLocator = this.page.locator(
            "span[class*='group-hover:visible']",
            { hasText: expectedTitle }
        ).first();

        // 2. Find its closest ancestor with the Tailwind 'group' class. 
        // In Tailwind, hovering this specific container is what triggers 'group-hover:visible'
        const groupLocator = tooltipLocator.locator("xpath=ancestor::*[contains(@class, 'group')][1]");

        // 3. Hover over the exact group container
        await groupLocator.hover();

        // 4. Wait for the tooltip to become visible
        await tooltipLocator.waitFor({ state: 'visible', timeout: 5000 });
        const actualTitle = (await tooltipLocator.textContent())?.trim() || '';

        if (actualTitle !== expectedTitle) {
            throw new Error(`Tooltip title mismatch. Expected "${expectedTitle}", got "${actualTitle}"`);
        }
    }

    async getTotalCustomerCount(audienceTitle: string): Promise<number> {
        const titleXPath = !audienceTitle.includes("'") ? `'${audienceTitle}'` : `"${audienceTitle}"`;
        const xpath = `//tr[.//span[contains(normalize-space(.), ${titleXPath})]]//td[5]//span`;
        const cell = this.page.locator(xpath).first();
        await cell.waitFor({ state: 'visible', timeout: 20000 });
        const text = (await cell.textContent())?.trim() || '0';
        const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
        return isNaN(num) ? 0 : num;
    }

    async verifyUserIdsPresent(userIds: string[]) {
        for (const userId of userIds) {
            const locator = this.page.locator(`text=${userId}`).first();
            await locator.waitFor({ state: 'visible', timeout: 20000 });
        }
    }

    async verifyAudienceInList(title: string) {
        const titleXPath = !title.includes("'") ? `'${title}'` : `"${title}"`;
        const rowSelector = `//span[contains(text(), ${titleXPath})]`;
        await this.pause(2000);
        const row = this.page.locator(rowSelector).first();
        await row.waitFor({ state: 'attached', timeout: 30000 });
    }

    async searchInCriteriaField(name: string) {
        const searchField = this.page.locator(this.sel.searchField).first();
        await searchField.waitFor({ state: 'visible', timeout: 30000 });
        await searchField.fill(name);
        await this.page.keyboard.press('Enter').catch(() => { });
    }

    // ─── Event Performed Criteria ─────────────────────────────────────────────

    async openEventPerformed() {
        await this.clickLast(this.sel.criteria);
        await this.click(this.sel.criteriaEventPerformed);
    }

    async selectLoginEvent() {
        await this.clickLast(this.sel.criteriaevent);
        await this.click(this.sel.eventLoginOption);
        await this.pause(500);
    }

    async setAtLeastOneTime() {
        await this.click(this.sel.eventOccurrenceExactlyOnce);
        await this.pause(1000);

        const radio = this.page.locator("//label[contains(normalize-space(),'Atleast')] | //input[contains(@data-testid, 'atleast')]").first();
        await radio.waitFor({ state: 'attached', timeout: 5000 });
        await radio.click({ force: true });

        const applyBtn = this.page.locator("//button[normalize-space()='Add occurrence'] | //button[normalize-space()='Apply'] | //button[@data-testid='flyout-confirm-btn']").first();

        // If "Atleast" was already selected by default (V2.0 behavior), the Apply button will be disabled
        // because no actual changes were made to the form. If so, just click Cancel to close the flyout!
        const isBtnDisabled = await applyBtn.isDisabled().catch(() => false);
        if (isBtnDisabled) {
            const cancelBtn = this.page.locator("//button[normalize-space()='Cancel']").first();
            await cancelBtn.click();
        } else {
            await applyBtn.click();
        }
        await this.pause(500);
    }

    async setOccurrenceCountRandom(min: number, max: number): Promise<number> {
        const target = Math.floor(Math.random() * (max - min + 1)) + min;
        const input = this.page.locator(this.sel.occurrenceCountInput).first();
        await input.waitFor({ state: 'visible', timeout: 10000 });
        await input.fill('');
        await input.fill(String(target));
        await this.pause(500);
        return target;
    }



    async setOccurrenceDateToday() {

        if (await this.isVisible(this.sel.TimeWindowBtn)) {
            for (let attempt = 0; attempt < 3; attempt++) {
                await this.click(this.sel.TimeWindowBtn);
                await this.click(this.sel.eventDateRangeToday);
                await this.page.locator(this.sel.eventDateRangeApply).first().click();
                await this.pause(500);
                if (await this.isVisible(this.sel.SlectedTimeWindowclose)) break;
            }
        }
        else { await this.pause(500); }
    }

    // ─── Customer Metric Criteria ─────────────────────────────────────────────

    async openCustomerMetric() {
        await this.clickLast(this.sel.criteria);
        await this.click(this.sel.criteriaCustomerMetric);
    }

    async selectTotalDepositedAmount() {
        await this.clickLast(this.sel.criteriaCustomerMetricEvent);
        await this.click(this.sel.metricTotalDeposited);
        await this.pause(500);
    }

    async selectConditionGreaterOrEqual() {
        await this.click(this.sel.ConditionBtn);
        await this.click(this.sel.metricConditionGreaterEqual);
        await this.pause(500);
    }

    async enterMetricValue(value: string) {
        const input = this.page.locator(this.sel.metricValueInput).first();
        await input.waitFor({ state: 'visible', timeout: 10000 });
        await input.click();
        await input.fill(value);
        await this.page.keyboard.press('Enter').catch(() => { });
        await this.pause(500);
    }

    async validateMetricInputAttributes(): Promise<{ valid: boolean; errors: string[] }> {
        const input = this.page.locator(this.sel.metricValueInput).first();
        await input.waitFor({ state: 'visible', timeout: 10000 });

        const expected: Record<string, string> = {
            inputmode: 'numeric',
            pattern: '[0-9]*',
            maxlength: '19',
        };

        const errors: string[] = [];
        for (const [attr, expectedVal] of Object.entries(expected)) {
            const actual = await input.getAttribute(attr);
            if (actual !== expectedVal) {
                errors.push(`${attr}: expected "${expectedVal}" but got "${actual ?? '(missing)'}"`);
            }
        }
        return { valid: errors.length === 0, errors };
    }

    // ─── Part of Audience Criteria ────────────────────────────────────────────

    async openPartOfAudience() {
        await this.clickLast(this.sel.criteria);
        await this.click(this.sel.criteriaPartOfAudience);
    }

    async selectExistingAudienceInCriteria(audienceName: string) {
        // Click ONCE to open the dropdown popup. (The second identical click was instantly closing it!)
        await this.clickLast(this.sel.partOfAudienceDropdown);
        await this.pause(500);
        const searchField = this.page.locator(this.sel.partOfAudienceSearch).first();
        if (await searchField.isVisible({ timeout: 5000 }).catch(() => false)) {
            await searchField.click();
            await searchField.fill(audienceName);
            await this.page.keyboard.press('Enter').catch(() => { });
            await this.pause(1500);
        }
        // Match either the label containing the text, or the data-testid (lowercased)
        const option = this.page.locator(`//label[contains(., '${audienceName}')] | //*[@data-testid='${audienceName.toLowerCase()}']`).last();
        await option.click({ force: true });
        await this.click(this.sel.AddAudienceBtn);
        await this.pause(500);
    }

    // ─── Customer Engagement Criteria ─────────────────────────────────────────

    async openCustomerEngagement() {
        await this.clickLast(this.sel.criteria);
        await this.click(this.sel.criteriaCustomerEngagement);
    }

    async selectWorkflowEngagement() {
        await this.clickLast(this.sel.criteriaCustomerEngagementevent);
        await this.click(this.sel.engagementWorkflow);
        await this.pause(500);
    }

    async selectWorkflowName() {
        await this.page.locator(this.sel.engagementattribute).last().click();
        await this.pause(500);
        await this.click(this.sel.workflowName);
        await this.pause(500);
    }

    async selectWorkflowNameValue() {
        await this.click(this.sel.ConditionBtn);
        await this.click(this.sel.ConditionIsOneOfBtn);
        await this.page.locator("//button[contains(@data-testid,'-eventValues-btn-')]").first().click();
        await this.page.locator("//input[@id='search-data']/ancestor::div[contains(@class,'absolute') or contains(@class,'bg-white')][1]//button[@class='flex items-center']").first().click();
        await this.click(this.sel.addValuesBtn);
        await this.pause(500);
    }

    async selectWorkflowActionValue() {
        await this.page.locator(this.sel.ConditionBtn).last().click();
        await this.click(this.sel.ConditionIsOneOfBtn);
        await this.page.locator("//button[contains(@data-testid,'-eventValues-btn-')]").last().click();
        await this.page.locator("//input[@id='search-data']/ancestor::div[contains(@class,'absolute') or contains(@class,'bg-white')][1]//button[@class='flex items-center']").first().click();
        await this.click(this.sel.addValuesBtn);
        await this.pause(500);
    }

    async selectWorkflowAction() {
        await this.page.locator(this.sel.engagementattribute).last().click();
        await this.click(this.sel.workflowAction);
        await this.pause(500);
    }

    // ─── AND / OR Logic ───────────────────────────────────────────────────────

    async clickAndCondition() {
        await this.click(this.sel.Group1AndConditionBtn);
        await this.pause(500);
    }

    async clickAddGroup() {
        await this.click(this.sel.addGroupBtn);
        await this.pause(500);
    }

    async openCriteriaGroup2CustomerProps() {
        await this.click(this.sel.criteriaGroup2);
        await this.click(this.sel.criteriaGroup2CustomerProps);
    }

    // ─── Preview (generic) ────────────────────────────────────────────────────

    async clickPreviewButton() {
        const refreshBtn = this.page.locator(this.sel.preview2).first();
        const mainBtn = this.page.locator(this.sel.preview1).first();
        if (await refreshBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await refreshBtn.click();
        } else {
            await mainBtn.click();
        }
        await this.pause(3000);
    }

    async getCustomerCount(): Promise<number> {
        await this.pause(1000);
        const countLocator = this.page.locator("//div[@class='font-semibold text-4xl text-primary pt-2']").first();
        if (await countLocator.isVisible({ timeout: 5000 }).catch(() => false)) {
            const text = (await countLocator.textContent())?.trim() || '0';
            const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
            return isNaN(num) ? 0 : num;
        }
        return 0;
    }

    async getPreviewRecordCount(): Promise<number> {
        await this.pause(2000);
        const countLocator = this.page.locator("//div[@class = 'font-semibold text-4xl text-primary pt-2']").first();
        if (await countLocator.isVisible({ timeout: 5000 }).catch(() => false)) {
            const text = (await countLocator.textContent())?.trim() || '0';
            const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
            return isNaN(num) ? 0 : num;
        }
        return 0;
    }

    // ─── Remove Value ─────────────────────────────────────────────────────────

    async removeFirstUserIdValue() {
        const removeBtn = this.page.locator(this.sel.removeValueBtn).first();
        await removeBtn.waitFor({ state: 'visible', timeout: 10000 });
        await removeBtn.click();
        await this.pause(500);
    }

    // ─── Action Menu (Duplicate) ──────────────────────────────────────────────

    async clickActionMenuForAudience(title: string) {
        const titleXPath = !title.includes("'") ? `'${title}'` : `"${title}"`;
        const menuSelector = `//tr[.//span[contains(normalize-space(.), ${titleXPath})]]//td[last()]//button`;
        await this.click(menuSelector);
        await this.pause(500);
    }

    async clickDuplicateOption() {
        await this.click(this.sel.duplicateOption);
        await this.pause(500);
    }

    async getDuplicatePopupTitle(): Promise<string> {
        const input = this.page.locator(this.sel.duplicatePopupInput).first();
        await input.waitFor({ state: 'visible', timeout: 10000 });
        return await input.inputValue();
    }

    async setDuplicateTitle(title: string) {
        const input = this.page.locator(this.sel.duplicatePopupInput).first();
        await input.waitFor({ state: 'visible', timeout: 10000 });
        await input.fill('');
        await input.fill(title);
    }

    async clickDuplicateConfirm() {
        await this.click(this.sel.duplicatePopupBtn);
        await this.pause(3000);
    }

    // ─── Edit Published ───────────────────────────────────────────────────────



    async saveUpdatedAudience() {
        const updateBtn = this.page.locator(this.sel.updateBtn).first();
        if (await updateBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await updateBtn.click();
            const confirmBtn = this.page.locator(this.sel.updateConfirm).first();
            if (await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
                await confirmBtn.click();
            }
        } else {
            await this.saveDraft();
        }
        await this.pause(3000);
    }

    // ─── Validation ───────────────────────────────────────────────────────────

    async isValidationErrorVisible(): Promise<boolean> {
        await this.pause(500);
        return this.isVisible(this.sel.validationError, 5000);
    }

    async isFieldValidationVisible(): Promise<boolean> {
        return this.isValidationErrorVisible();
    }

    async verifyPreviewAndPublishDisabled(): Promise<{ allDisabled: boolean; details: string[] }> {
        const buttons = [
            { name: 'Preview', selector: this.sel.preview1 },
            { name: 'Preview Refresh', selector: this.sel.preview2 },
            { name: 'Publish', selector: this.sel.publishBtn },
        ];
        const details: string[] = [];
        let allDisabled = true;

        for (const { name, selector } of buttons) {
            const btn = this.page.locator(selector).first();
            const visible = await btn.isVisible({ timeout: 3000 }).catch(() => false);
            if (!visible) {
                details.push(`${name}: not visible (OK)`);
                continue;
            }
            const disabled = await btn.isDisabled();
            details.push(`${name}: ${disabled ? 'disabled (OK)' : 'ENABLED (FAIL)'}`);
            if (!disabled) allDisabled = false;
        }
        return { allDisabled, details };
    }

    // ─── Console Errors ───────────────────────────────────────────────────────

    async getConsoleErrors(): Promise<string[]> {
        const errors: string[] = [];
        this.page.on('console', (msg) => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });
        await this.pause(3000);
        return errors;
    }

    // ─── Action Menu Options ──────────────────────────────────────────────────

    async getActionMenuOptions(): Promise<string[]> {
        const options = this.page.locator(
            "//div[contains(@class,'dropdown') or @role='menu']//button | //ul[@role='menu']//li"
        );
        await this.pause(500);
        const count = await options.count();
        const labels: string[] = [];
        for (let i = 0; i < count; i++) {
            const text = await options.nth(i).textContent();
            if (text?.trim()) labels.push(text.trim());
        }
        return labels;
    }

    // ---------------------------------------------------------------------
    // REG-AUD-16  Static Audience helpers
    // ---------------------------------------------------------------------

    async clickConditionIsNotEmpty() {
        await this.click(this.sel.ConditionBtn);
        await this.pause(500);
        await this.page.locator(this.sel.conditionIsNotEmpty).first().dispatchEvent('click');
        await this.pause(500);
    }

    async clickPreviewViewAll() {
        await this.page.locator(this.sel.previewViewAllBtn).first().waitFor({ state: 'visible', timeout: 15000 });
        await this.page.locator(this.sel.previewViewAllBtn).first().click();
        await this.pause(2000);
    }

    async clickBackToEditor() {
        await this.page.locator(this.sel.flyoutBackToEditor).first().waitFor({ state: 'visible', timeout: 10000 });
        await this.page.locator(this.sel.flyoutBackToEditor).first().click();
        await this.pause(1000);
    }

    async searchAudienceInList(keyword: string) {
        const input = this.page.locator(this.sel.audienceSearchInput).first();
        await input.waitFor({ state: 'visible', timeout: 10000 });
        await input.fill('');
        await input.fill(keyword);
        await input.press('Enter');
        // Wait for the loading spinner to disappear before returning
        await this.page.waitForFunction(() => {
            const spinners = document.querySelectorAll('[class*="loading"], [class*="spinner"], .animate-spin, svg.animate-spin');
            return spinners.length === 0 || Array.from(spinners).every(el => (el as HTMLElement).offsetParent === null);
        }, { timeout: 30000 }).catch(() => {});
        await this.pause(1500);
    }

    async clickFirstRowThreeDot() {
        await this.page.locator('table tbody tr').first().hover().catch(() => {});
        await this.pause(500);
        const btn = this.page.locator(this.sel.firstRowThreeDotIcon).first();
        await btn.waitFor({ state: 'visible', timeout: 10000 });
        await btn.click();
        await this.pause(700);
    }

    async clickDownloadCustomerList() {
        await this.page.locator(this.sel.downloadCustomerListBtn).first().waitFor({ state: 'visible', timeout: 8000 });
        await this.page.locator(this.sel.downloadCustomerListBtn).first().click();
        await this.pause(1000);
    }

    async clickModalSubmit() {
        const isRetentionModal = await this.page.locator("text='Upload retention audience'").first().isVisible({ timeout: 3000 }).catch(() => false);
        if (isRetentionModal) {
            const uploadBtn = this.page.locator("button:has-text('Upload')").first();
            if (await uploadBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
                console.log("[Upload] Clicking 'Upload' to start processing...");
                await uploadBtn.click();
            }
            console.log("[Upload] Waiting for upload processing to complete...");
            await this.page.locator("text=uploaded").first().waitFor({ state: 'visible', timeout: 120000 }).catch(() => {});
            await this.pause(2000);
            const publishBtn = this.page.locator("button:has-text('Publish now')").first();
            if (await publishBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
                console.log("[Upload] File uploaded - clicking Publish now...");
                await publishBtn.click();
                await this.pause(2000);
                return;
            }
        } else {
            const candidates = [
                this.page.locator(this.sel.downloadSubmitBtn).first()
            ];
            for (const btn of candidates) {
                if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await btn.click();
                    await this.pause(2000);
                    return;
                }
            }
        }
        throw new Error('clickModalSubmit: no visible submit button found');
    }

    async clickModalSubmitAndWaitForDownload(): Promise<string> {
        const btn = this.page.locator(this.sel.downloadGenerateBtn).first();
        await btn.waitFor({ state: 'visible', timeout: 8000 });
        const [download] = await Promise.all([
            this.page.waitForEvent('download', { timeout: 120000 }),
            btn.click(),
        ]);
        console.log('[Download] started: ' + download.suggestedFilename());
        const os = require('os');
        const path = require('path');
        const targetPath = path.join(os.tmpdir(), 'audience-download-' + Date.now() + '.csv');
        await download.saveAs(targetPath);
        console.log('[Download] saved with .csv to: ' + targetPath);
        await this.pause(1000);
        return targetPath;
    }

    async clickCreateRetentionAudience() {
        await this.page.locator(this.sel.createNewDropdownBtn).first().click();
        await this.pause(500);
        await this.page.locator(this.sel.retentionAudienceBtn).first().waitFor({ state: 'visible', timeout: 8000 });
        await this.page.locator(this.sel.retentionAudienceBtn).first().click();
        await this.pause(1000);
    }

    async uploadCSVFile(filePath: string) {
        await this.page.locator("text=Upload retention audience").first().waitFor({ state: "visible", timeout: 20000 }).catch(() => {});
        await this.pause(500);
        const selectors = [
            "input[type=\"file\"]",
            "#selectFile",
            "#headlessui-portal-root input[type=\"file\"]",
            "input[accept*=\"csv\"]",
        ];
        let fileInput = null;
        for (const sel of selectors) {
            const loc = this.page.locator(sel).first();
            const found = await loc.count().catch(() => 0);
            if (found > 0) { fileInput = loc; break; }
        }
        if (!fileInput) throw new Error("Could not find file input in upload modal");
        await fileInput.waitFor({ state: "attached", timeout: 10000 });
        await fileInput.setInputFiles(filePath);
        await this.pause(1500);
    }

    async pollAudienceStatus(audienceName: string, targetStatus: string, timeoutMs = 300000): Promise<void> {
        const start = Date.now();
        
        // Search ONCE
        await this.searchAudienceInList(audienceName);
        
        // Wait for the table row to exist
        const firstRow = this.page.locator('table tbody tr').first();
        await firstRow.waitFor({ state: 'attached', timeout: 10000 }).catch(() => {});
        
        while (Date.now() - start < timeoutMs) {
            let fullText = '';
            for (let i = 0; i < 3; i++) {
                await this.pause(1000);
                fullText = (await firstRow.innerText().catch(() => '')).toLowerCase().trim();
                if (fullText !== '') { break; }
            }
            
            console.log(`[Wait Status] First row text: "${fullText}" | Looking for: "${targetStatus.toLowerCase()}"`);
            
            if (fullText.includes(targetStatus.toLowerCase())) {
                console.log('[Wait Status] Success! Target status found.');
                return;
            }
            
            // Just pause and check the row again
            await this.pause(5000);
        }
        throw new Error(`Timed out waiting for "${audienceName}" to reach "${targetStatus}"`);
    }
    // REG-AUD-18  Create Campaign from Audience
    async clickCreateNewCampaignFromAudience() {
        await this.page.locator(this.sel.createNewCampaignBtn).first().waitFor({ state: 'visible', timeout: 8000 });
        await this.page.locator(this.sel.createNewCampaignBtn).first().click();
        await this.pause(2000);
    }

    // REG-AUD-19  View History Log
    async clickViewHistoryLog() {
        await this.page.locator(this.sel.viewHistoryLogBtn).first().waitFor({ state: 'visible', timeout: 8000 });
        await this.page.locator(this.sel.viewHistoryLogBtn).first().click();
        await this.pause(2000);
    }

    async isHistoryLogVisible(): Promise<boolean> {
        return this.page.locator(this.sel.historyLogEntry).first()
            .isVisible({ timeout: 10000 }).catch(() => false);
    }

    // REG-AUD-20  View Report
    async clickReportIcon(title?: string) {
        const iconLocator = this.page.getByTestId('audience-listView-tableList-reportIcon-1');
        await iconLocator.waitFor({ state: 'visible', timeout: 10000 });
        console.log("[Report Icon] Clicking the report icon...");
        await iconLocator.click();
        await this.pause(3000);
    }

    // REG-AUD-16  Customer List Flyout  search & validate
    async waitForCustomerListFlyout(): Promise<void> {
        await this.page.locator(this.sel.flyoutBackToEditor)
            .first().waitFor({ state: 'visible', timeout: 20000 });
        const start = Date.now();
        while (Date.now() - start < 30000) {
            const rows = this.page.locator('div.h-\\[700px\\] td, div.h-\\[700px\\] tr');
            const count = await rows.count().catch(() => 0);
            if (count > 0) break;
            await this.pause(1000);
        }
        await this.pause(1000);
    }

    async clickLastPageInCustomerListFlyout(): Promise<void> {
        const pageBtns = this.page.locator("[data-testid^='audience-customerList-pagination-button-pageNumber-']");
        const count = await pageBtns.count().catch(() => 0);
        if (count > 0) {
            await pageBtns.last().click();
            await this.pause(2000);
        }
    }

    async searchAndVerifyCustomerListFlyout(userId: string): Promise<boolean> {
        await this.clickLastPageInCustomerListFlyout();
        const searchInput = this.page.locator(
            "div.h-\\[700px\\] input[placeholder*='Search'], [aria-label='Search'], div.h-\\[700px\\] input[type='text'], input[placeholder='Search']"
        ).first();
        await searchInput.waitFor({ state: 'visible', timeout: 10000 });
        await searchInput.fill(userId);
        await searchInput.press('Enter');
        await this.pause(3000);
        const rows = this.page.locator('td:has-text("' + userId + '")');
        const rowCount = await rows.count().catch(() => 0);
        return rowCount > 0;
    }

    async searchAndVerifyUserInReportList(userId: string): Promise<boolean> {
        // Use the specific testid provided for the search input
        const searchInput = this.page.getByTestId('search-data');
        
        // Give the page plenty of time to load the search box initially
        await searchInput.waitFor({ state: 'visible', timeout: 20000 });
        await searchInput.scrollIntoViewIfNeeded();
        
        console.log(`[Search] Entering userId: ${userId}`);
        await searchInput.fill('');
        await searchInput.fill(userId);
        await searchInput.press('Enter');
        
        // Wait dynamically for the user row to appear instead of hardcoded pause
        console.log(`[Search] Waiting for user row to appear in the table...`);
        const userRow = this.page.locator(`td:has-text("${userId}")`).first();
        
        try {
            // Give the server plenty of time to fetch and render the filtered list
            await userRow.waitFor({ state: 'visible', timeout: 30000 });
            return true;
        } catch (e) {
            console.error(`[Search] User ${userId} did not appear in time.`);
            return false;
        }
    }

}
