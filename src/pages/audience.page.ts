import { BasePage } from './base.page';
import { ExtentTestManager } from '../utils/extent-test-manager';

/**
 * AudiencePage ...
 */
export class AudiencePage extends BasePage {

    private readonly sel = {
        // Tabs
        tabAll: "//*[@data-testid='audience-tab-all' or @data-test-id='audience-tab-all']",
        tabRfm: "//*[@data-testid='audience-tab-rfm' or @data-test-id='audience-tab-rfm']",
        tabOnSchedule: "//*[@data-testid='audience-tab-scheduled' or @data-test-id='audience-tab-scheduled']",
        tabStatic: "//*[@data-testid='audience-tab-static' or @data-test-id='audience-tab-static']",
        staticTabActive: "//h3[normalize-space()='Static audiences'] | //*[contains(@data-testid,'audience-tab-static') and (@aria-selected='true' or contains(@class,'active'))] | //*[normalize-space()='Static audiences']",

        // View toggle
        viewDropdown: "//*[@data-testid='audience-select-menu' or @data-test-id='audience-select-menu']",
        cardViewBtn: "//*[@data-testid='audience-select-menu-card-view' or @data-test-id='audience-select-menu-card-view']",
        listViewBtn: "//*[@data-testid='audience-select-menu-list-view' or @data-test-id='audience-select-menu-list-view']",
        cardViewContainer: "//*[@data-testid='audience-select-menu-card-view' or @data-test-id='audience-select-menu-card-view' and @aria-pressed='true']",
        listViewContainer: "//*[@data-testid='audience-select-menu-list-view' or @data-test-id='audience-select-menu-list-view' and @aria-pressed='true']",

        // Create
        createNewBtn: "//*[@data-testid='create-new-audience-btn' or @data-test-id='create-new-audience-btn'] | //button[contains(normalize-space(),'Create new audience') or contains(normalize-space(),'Create new Audience')]",
        createFromScratch: "//*[@data-testid='audience-create-from-scratch-modal-btn' or @data-test-id='audience-create-from-scratch-modal-btn'] | //*[normalize-space()='Create from scratch']",
        nameInput: "//input[@data-testid='create-audience-modal-popup-input' or @data-test-id='create-audience-modal-popup-input']",
        tagsInput: "//input[@data-testid='create-audience-modal-popup-tag' or @data-test-id='create-audience-modal-popup-tag']",
        submitBtn: "//*[@data-testid='create-audience-modal-popup-ok-btn' or @data-test-id='create-audience-modal-popup-ok-btn']",
        editTitle: "//h2[contains(@class,'text-2xl')]",


        // Criteria
        criteria: "//*[@data-testid='audience-ruleBuilder-criteriaIcon-group-1' or @data-test-id='audience-ruleBuilder-criteriaIcon-group-1'] | //button[@data-testid='Criteria' or @data-test-id='Criteria' or contains(normalize-space(),'+ Criteria')]",
        criteriaCustomerProps: "//*[@data-testid='audience-ruleBuilder-criteriaIcon-group-1-customer-properties' or @data-test-id='audience-ruleBuilder-criteriaIcon-group-1-customer-properties']",
        customerPropsEvent: "//button[normalize-space()='+ customer property' or contains(@data-testid,'customer property-btn-') or contains(@data-testid,'customer-properties') or contains(.,'customer property')]",
        userIdInput: "//*[@data-testid='user_id' or @data-test-id='user_id'] | //input[@data-testid='user_id' or @data-test-id='user_id'] | //button[.//text()[normalize-space()='User Id']] | //label[normalize-space()='User Id'] | //*[normalize-space()='User Id' and not(self::input)]",
        customerPropsDrawerSearch: "//div[@role='dialog' or contains(@class,'dialog') or contains(@class,'modal') or contains(@id,'headlessui-dialog')]//input | //input[@placeholder='Search' and not(@id='search-data')]",
        customerPropsDrawerAddBtn: "//button[normalize-space()='Add property' or @data-testid='add-property-btn']",
        customerPropsDrawerCancelBtn: "//button[normalize-space()='Cancel' or @aria-label='Close']",
        // Engagement flyouts: the radio <input> is styled with appearance-none and ignores direct clicks, so click its <label>.
        ConditionIsOneOfLabel: "//label[@for='is-one-of' or @data-testid='is-one-of' or @data-test-id='is-one-of']",
        // Customer-property flyouts: no clickable label, the input itself is clicked (original selector).
        ConditionIsOneOfBtn: "//input[@data-testid='is-one-of' or @data-test-id='is-one-of'] | //*[text()[normalize-space()='Is One Of' or normalize-space()='is one of']]",
        searchField: "//*[@id='search-data'] | //input[@id='search-data'] | //input[@placeholder='Search']",
        CustomerPropertiesValueslevel1Btn: "//*[@data-testid='audience-ruleBuilder-customer-properties-group-1-values-btn-1-1'] | //button[contains(@data-testid,'customer-properties-group-') and contains(@data-testid,'-values-btn-') and not(contains(normalize-space(), 'Add'))] | //button[contains(normalize-space(),'values')]",
        CustomerEngagementValueslevel1Btn: "//button[contains(@data-testid,'customer-engagement-group-') and contains(@data-testid,'-eventValues-btn-') and not(contains(normalize-space(), 'Add'))]",
        CustomerEngagementValueslevel2Btn: "//button[contains(@data-testid,'customer-engagement-group-') and contains(@data-testid,'-eventValues-btn-') and contains(normalize-space(), 'Add')]",
        addValuesBtn: "//*[@data-testid='commonProfile-add-values-btn'] | //button[normalize-space()='Add values']",
        CustomerPropertiesValueslevel2Btn: "//button[contains(@data-testid,'customer-properties-group-') and contains(@data-testid,'-values-btn-')]",
        // Preview
        preview1: "//*[@data-testid='audience-ruleBuilder-previewButton' or @data-test-id='audience-ruleBuilder-previewButton']",
        preview2: "//*[@data-testid='audience-ruleBuilder-preview-refresh-button' or @data-test-id='audience-ruleBuilder-preview-refresh-button']",

        // Save / Publish
        saveDraftBtn: "//*[@data-testid='audience-create-save-draft-btn' or @data-test-id='audience-create-save-draft-btn']",
        saveDraftConfirm: "//*[@data-testid='audience-save-draft-create-btn' or @data-test-id='audience-save-draft-create-btn']",
        cancelBtn: "//*[@data-testid='audience-cancel-save-draft' or @data-test-id='audience-cancel-save-draft']",
        publishBtn: "//*[@data-testid='audience-create-publish-now-btn' or @data-test-id='audience-create-publish-now-btn']",
        publishConfirm1: "//*[@data-testid='audience-publish-create-btn' or @data-test-id='audience-publish-create-btn']",
        publishCancel: "//*[@data-testid='audience-cancel-publish' or @data-test-id='audience-cancel-publish']",
        publishTypeConfirm: "//*[@data-testid='audience-type-modal-confirm-btn' or @data-test-id='audience-type-modal-confirm-btn'] | //button[normalize-space()='Confirm']",
        publishStatic: "//*[@data-testid='audience-type-modal-static-input-radio' or @data-test-id='audience-type-modal-static-input-radio'] | //input[@value='static']",
        publishSchedule: "//input[@data-testid='audience-type-modal-scheduled-input-radio' or @data-test-id='audience-type-modal-scheduled-input-radio']",
        // New UI (Sept 2026): after choosing Scheduled, an "Edit schedule" button must be
        // clicked to open the date/time picker before the calendar is accessible.
        editScheduleBtn: "//*[@data-testid='audience-type-modal.edit-schedule' or @data-test-id='audience-type-modal.edit-schedule']",
        updateBtn: "//*[@data-testid='audience-edit-update-btn' or @data-test-id='audience-edit-update-btn']",
        updateConfirm: "//*[@data-testid='audience-publish-edit-btn' or @data-test-id='audience-publish-edit-btn']",

        // Filter & Search
        filterBtn: "//*[@data-testid='audience-table-listing-filter-btn' or @data-test-id='audience-table-listing-filter-btn']",
        filterActive: "//input[@data-testid='audience-active' or @data-test-id='audience-active']",
        filterApplyBtn: "//*[@data-testid='audience-apply-btn' or @data-test-id='audience-apply-btn']",
        mainSearchField: "//*[@data-testid='audience-listView-searchInput'] | //input[@placeholder='Search']",

    // ------------------------------------------------------------- Criteria Event Performed
        criteriaEventPerformed: "//*[@data-testid='audience-ruleBuilder-criteriaIcon-group-1-event-performed' or @data-test-id='audience-ruleBuilder-criteriaIcon-group-1-event-performed']",
        criteriaevent: "//button[normalize-space()='+ event' or contains(@data-testid,'event-performed-group-1-event-btn-')]",
        eventLoginOption: "//input[@data-testid='login' or @data-test-id='login']",
        eventOccurrenceExactlyOnce: "//span[@data-testid='audience-ruleBuilder-event-performed-group-1-occurrence-condition-btn-1' or @data-test-id='audience-ruleBuilder-event-performed-group-1-occurrence-condition-btn-1']",
        eventOccurrenceAtLeast: "//input[@data-testid='atleast-[#]-time' or @data-test-id='atleast-[#]-time']",
        occurrenceCountInput: "//input[@class='w-10 px-2 py-1 text-sm outline-none border-none bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none']",
        eventDateRangeBtn: "//span[@data-testid='audience-ruleBuilder-event-performed-group-1-dateTimePickerModal-rangeValue-Btn-1' or @data-test-id='audience-ruleBuilder-event-performed-group-1-dateTimePickerModal-rangeValue-Btn-1']",
        eventDateRangeToday: "//ul[@data-testid='dateTimePicker-modal-relative-today' or @data-test-id='dateTimePicker-modal-relative-today']",
        eventDateRangeApply: "//*[@data-testid='dateTimePicker-modal-apply-button' or @data-test-id='dateTimePicker-modal-apply-button']",
        eventDateRangeCancel: "//*[@data-testid='dateTimePicker-modal-cancel-button' or @data-test-id='dateTimePicker-modal-cancel-button']",
        TimeWindowBtn: "//button[@class='bg-white flex flex-row items-center justify-center border border-gray-300 rounded-lg px-3 py-2 cursor-pointer']",
        SlectedTimeWindowclose: "//span[normalize-space()='Today']/ancestor::div[contains(@class,'bg-white')]//button[contains(@class,'ps-1')]",



    // ------------------------------------------------------------- Criteria Customer Metric
        criteriaCustomerMetric: "//*[@data-testid='audience-ruleBuilder-criteriaIcon-group-1-customer-metric' or @data-test-id='audience-ruleBuilder-criteriaIcon-group-1-customer-metric']",
        criteriaCustomerMetricEvent: "//button[@class='bg-white flex flex-row items-center justify-center rounded-md px-3 py-2 border border-gray-300 cursor-pointer']",
        metricTotalDeposited: "//input[@data-testid='total-deposited-amount' or @data-test-id='total-deposited-amount']",
        ConditionBtn: "//button[contains(@data-testid,'-condition-btn-')] | //button[@class='bg-white flex flex-row items-center justify-center border border-gray-300 rounded-lg px-3 py-2 cursor-pointer']",
        metricConditionGreaterEqual: "//input[@data-testid='greater-than-or-equal-to' or @data-test-id='greater-than-or-equal-to']",
        metricValueInput: "//input[@class='text-center focus:outline-none']",

    // ------------------------------------------------------------- Criteria Part of Audience
        criteriaPartOfAudience: "//*[@data-testid='audience-ruleBuilder-criteriaIcon-group-1-part-of-an-audience' or @data-test-id='audience-ruleBuilder-criteriaIcon-group-1-part-of-an-audience']",
        criteriaPartOfAudienceevent: "//button[contains(@data-testid,'existingAudience-') or contains(normalize-space(),'audience') or contains(normalize-space(),'Audience')]",
        partOfAudienceDropdown: "//button[contains(@data-testid,'existingAudience-') or contains(normalize-space(),'audience') or contains(normalize-space(),'Audience')]",
        partOfAudienceSearch: "//input[@id='search-data'] | //input[@placeholder='Search'] | //*[@role='dialog']//input[@type='text'] | //*[contains(text(),'Select one of the existing')]/preceding-sibling::*//input | //*[contains(@class, 'search')]//input",
        AddAudienceBtn: "//*[@data-testid='commonProfile-add-audience-btn' or @data-test-id='commonProfile-add-audience-btn']",

    // ------------------------------------------------------------- Criteria Customer Engagement
        criteriaCustomerEngagement: "//*[@data-testid='audience-ruleBuilder-criteriaIcon-group-1-customer-engagement' or @data-test-id='audience-ruleBuilder-criteriaIcon-group-1-customer-engagement']",
        criteriaCustomerEngagementevent: "//button[contains(normalize-space(),'+ engagement') or contains(normalize-space(),'+ customer engagement') or (contains(@data-testid,'customer-engagement') and contains(@data-testid,'btn-'))]",
        engagementWorkflow: "//input[@data-testid='workflow_engagement' or @data-test-id='workflow_engagement']",
        engagementattribute: "//button[contains(@data-testid,'eventAttribute-btn-') or contains(normalize-space(),'workflow') or contains(normalize-space(),'Workflow')]",
        // First value label inside the "values" drawer only. A page-wide selector here previously matched
        // buttons outside the drawer, and clicking them closed the drawer before "Add values".
        valuesDrawerOption: "//div[@role='dialog'][.//h2[normalize-space()='values']]//label[@for]",
        // Values button of the "Workflow Action" row: first values button after that row's chip, so the
        // "Workflow Name" row above (which also has a values/Add values button) is never picked.
        workflowActionValuesBtn: "(//*[normalize-space(text())='Workflow Action'])[1]/following::button[contains(@data-testid,'-eventValues-btn-') or normalize-space()='values'][1]",
        valuesDrawerCheckbox:"//div[@role='dialog'][.//h2[normalize-space()='values']]//input[@type='checkbox']",
        valuesDrawerAddBtn: "//div[@role='dialog'][.//h2[normalize-space()='values']]//button[@data-testid='commonProfile-add-values-btn' or normalize-space()='Add values']",
        addAttributeBtn:"//button[@data-testid='commonProfile-add-attribute-btn' or normalize-space()='Add attribute']",
        // Click the <label>: the radio <input> itself is styled with appearance-none and ignores direct clicks.
        workflowName: "//label[@data-testid='workflow_id' or @data-test-id='workflow_id' or @for='workflow_id']",
        workflowAction: "//label[@data-testid='node_id' or @data-test-id='node_id' or @for='node_id']",

        // AND / OR logic
        Group1AndConditionBtn: "//*[@data-testid='audience-ruleBuilder-criteriaIcon-group-1' or @data-test-id='audience-ruleBuilder-criteriaIcon-group-1']",
        addGroupBtn: "//*[@data-testid='audience-ruleBuilder-OR-groupIcon' or @data-test-id='audience-ruleBuilder-OR-groupIcon'] | //*[normalize-space()='+ OR group']",
        criteriaGroup2: "//*[@data-testid='audience-ruleBuilder-criteriaIcon-group-2' or @data-test-id='audience-ruleBuilder-criteriaIcon-group-2']",
        criteriaGroup2CustomerProps: "//*[@data-testid='audience-ruleBuilder-criteriaIcon-group-2-customer-properties' or @data-test-id='audience-ruleBuilder-criteriaIcon-group-2-customer-properties']",

        // Action menu (list view)
        actionMenuBtnTemplate: "//tr[.//span[contains(normalize-space(.), '{{TITLE}}')]]//button[contains(@class,'action') or @data-testid]//span[contains(@class,'dots') or text()='...']/.. | //tr[.//span[contains(normalize-space(.), '{{TITLE}}')]]//td[last()]//button",
        duplicateOption: "//button[normalize-space()='Duplicate' or @data-testid='audience-listView-tableList-dropdownIcon-1-duplicate' or @data-test-id='audience-listView-tableList-dropdownIcon-1-duplicate']",
        duplicatePopupInput: "//div[contains(@class,'modal') or @role='dialog']//input",
        duplicatePopupBtn: "//button[normalize-space()='Duplicate']",
        duplicatePopupCancel: "//button[normalize-space()='Cancel']",
        duplicatePopupTitle: "//div[contains(@class,'modal') or @role='dialog']//input",


        // Validation
        validationError: "//div[contains(@class,'bg-warning')]//p[string-length(normalize-space()) > 0]",

        // Value removal
        removeValueBtn: "//*[@data-testid='audience-ruleBuilder-customer-properties-group-1-eventValue-clearBtn-1-values' or @data-test-id='audience-ruleBuilder-customer-properties-group-1-eventValue-clearBtn-1-values']",

        conditionIsNotEmpty: "//*[@data-testid='is-not-empty' or @data-test-id='is-not-empty'] | //*[normalize-space()='is not empty'] | //*[normalize-space()='Is not empty'] | //input[@value='is-not-empty']",
        previewViewAllBtn:   "//*[@data-testid='audience-ruleBuilder-preview-totalCustomers-viewall-button'] | //button[contains(normalize-space(),'View all') or contains(normalize-space(),'View All')]",
        flyoutBackToEditor:  "//*[@data-testid='audience-flyout-backToEditor-button'] | //button[contains(normalize-space(),'Back to editor') or contains(normalize-space(),'Back to Editor')]",
        customerListSearchInput: "[data-testid='audience-customerList-search-input'], input[placeholder*='Search'], [aria-label='Search']",
        customerListTableRow:    "[data-testid^='audience-customerList-tableRow']",
        audienceSearchInput:     "[data-testid='audience-listView-searchInput']",
        firstRowThreeDotIcon:    "//*[@data-testid='audience-listView-tableList-dropdownIcon-1' or @data-test-id='audience-listView-tableList-dropdownIcon-1'] | //tbody//tr[1]//button[.//svg or contains(@class,'action')]",
        downloadCustomerListBtn: "//*[@data-testid='audience-listView-tableList-dropdownIcon-1-download-customer-list'] | //button[contains(normalize-space(),'Download Customer List') or contains(normalize-space(),'Download customer list')]",
        downloadSubmitBtn:       "[data-testid='modal-submit-button']",
        downloadGenerateBtn:     "//*[@data-testid='modal-submit-button'] | //button[contains(normalize-space(),'Generate') or contains(normalize-space(),'Download') or contains(normalize-space(),'Submit') or contains(normalize-space(),'Export')] | //button[contains(@data-testid,'download-generate') or contains(@data-testid,'customer-list-generate')]",
        createNewDropdownBtn:    "//*[@data-testid='create-new-audience-dropdown-btn'] | //button[contains(normalize-space(),'Create new Audience') and .//svg]",
        // Menu item inside the "Create new Audience" dropdown. Never match with //*[contains(normalize-space(),...)]:
        // that also matches <html>/<body>, and .first() then clicks the page instead of the menu item.
        retentionAudienceBtn:    "//*[@role='menu']//button[@data-testid='create-new-audience-dropdown-btn-import-csv' or @data-testid='create-new-audience-dropdown-btn-retention-audience' or contains(normalize-space(),'Import CSV') or contains(normalize-space(),'Retention')]",
        csvFileInput:            "#selectFile",
        createNewCampaignBtn: "[data-testid='audience-listView-tableList-dropdownIcon-1-create-new-campaign']",
        viewHistoryLogBtn: "[data-testid='audience-listView-tableList-dropdownIcon-1-view-history-log']",
        historyLogEntry:   "tr:nth-of-type(1) span > span.block",
        reportIcon: "xpath=//*[@data-testid='audience-listView-tableList-reportIcon-1' or @data-test-id='audience-listView-tableList-reportIcon-1']/svg",
    };

    // ------------------------------------------------------------- Tab Navigation

    async clickTabAll() { await this.click(this.sel.tabAll); }
    async clickTabRfm() { await this.click(this.sel.tabRfm); }
    async clickTabOnSchedule() { await this.click(this.sel.tabOnSchedule); }
    async clickTabStatic() {
        const tab = this.page.locator(this.sel.tabStatic).first();
        await tab.waitFor({ state: 'attached', timeout: 20000 });
        await tab.click({ force: true }).catch(async () => {
            await tab.evaluate((el: HTMLElement) => el.click());
        });
        await this.pause(1000);
    }

    async isStaticTabActive(): Promise<boolean> {
        return this.isVisible(this.sel.staticTabActive, 5000);
    }

    // ------------------------------------------------------------- View Toggle

    async switchToCardView() {
    // ------------------------------------------------------------- Dropdown removed from UI card view button is now directly clickable
        await this.click(this.sel.cardViewBtn);
    }

    async switchToListView() {
    // ------------------------------------------------------------- Dropdown removed from UI list view button is now directly clickable
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

    // ------------------------------------------------------------- Audience Creation

    async clickCreateNew() {
        await this.click(this.sel.createNewBtn);
    }
    async clickCreateFromScratch() {
        // Specifically click the 'Create audience' link inside the 'Create from scratch' template card
        await this.click(this.sel.createFromScratch);
    }

    async waitForCreatePage(maxRetries = 2) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const input = this.page.locator(this.sel.nameInput).first();
            if (await input.isVisible({ timeout: 10000 }).catch(() => false)) {
                return;
            }
            if (attempt < maxRetries) {
                console.log('[waitForCreatePage] Create audience modal input not visible yet, retrying click on Retention Audience...');
                await this.clickCreateRetentionAudience().catch(() => {});
            }
        }
        await this.waitForVisible(this.sel.nameInput, 15000);
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

    // ------------------------------------------------------------- Criteria Builder

    async openCustomerProperty() {
        const custProps = this.page.locator(this.sel.criteriaCustomerProps).first();
        if (!await custProps.isVisible({ timeout: 1500 }).catch(() => false)) {
            const crit = this.page.locator(this.sel.criteria).first();
            if (await crit.isVisible({ timeout: 2000 }).catch(() => false)) {
                await crit.click();
                await this.pause(500);
            }
        }
        await this.click(this.sel.criteriaCustomerProps);
        await this.pause(1000);
    }

        async selectUserIdProperty(maxAttempts = 3) {
        console.log('[selectUserIdProperty] Selecting User Id property...');

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            console.log(`[selectUserIdProperty] Attempt ${attempt}/${maxAttempts}...`);

            // 1. If '+ Criteria' is present (e.g. after refresh), add Customer Properties block first
            const criteriaBtn = this.page.locator(this.sel.criteria).first();
            const customerPropBtn = this.page.locator("//button[contains(normalize-space(),'customer property') or contains(@data-testid,'customer property-btn')]").last();
            
            if (!await customerPropBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
                if (await criteriaBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
                    console.log('[selectUserIdProperty] Clicking + Criteria and selecting Customer properties...');
                    await criteriaBtn.click().catch(() => {});
                    await this.pause(500);
                    const critProps = this.page.locator(this.sel.criteriaCustomerProps).first();
                    await critProps.waitFor({ state: 'visible', timeout: 5000 });
                    await critProps.click().catch(() => {});
                    await this.pause(1000);
                }
            }

            // 2. Open flyout if not already open
            const flyout = this.page.locator("//div[@role='dialog' or contains(@class,'dialog') or contains(@id,'headlessui-dialog') or contains(@class,'modal')]").first();
            let isFlyoutOpen = await flyout.isVisible({ timeout: 1500 }).catch(() => false);

            if (!isFlyoutOpen) {
                const openBtn = this.page.locator("//button[contains(normalize-space(),'customer property') or contains(@data-testid,'customer property-btn')]").last();
                await openBtn.waitFor({ state: 'visible', timeout: 5000 });
                await openBtn.click();
                await this.pause(1000);
                isFlyoutOpen = await flyout.isVisible({ timeout: 5000 }).catch(() => false);
            }

            // 3. Wait for the flyout list to finish loading: either the 'User Id' option or 'No records found'.
            // (locator.isVisible() ignores its timeout and returns instantly, so it can miss a late empty state.)
            const userIdOption = this.page.locator("//div[@role='dialog' or contains(@id,'headlessui-dialog')]//span[normalize-space()='User Id'] | //div[@role='dialog' or contains(@id,'headlessui-dialog')]//label[contains(.,'User Id')] | //*[@data-testid='user_id']").first();
            const noRecords = this.page.locator("//div[@role='dialog' or contains(@id,'headlessui-dialog')]//*[text()[contains(normalize-space(),'No records found')]]").first();
            await userIdOption.or(noRecords).first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});

            if (await noRecords.isVisible().catch(() => false)) {
                console.log(`[selectUserIdProperty] Flyout empty ('No records found') on attempt ${attempt}.`);
                if (this.page.url().includes('/audience/')) {
                    // Audience builder: refresh the page and restart from + Criteria (next attempt rebuilds the block).
                    console.log('[selectUserIdProperty] Refreshing the page and restarting from + Criteria...');
                    await this.page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
                    await this.waitForNetworkIdle(5000);
                    await this.pause(2000); // no reliable signal that the builder finished re-rendering after reload
                    continue;
                }
                // Workflow rule-builder: a reload redirects to the canvas (criteria icon never appears),
                // so close the flyout and reopen it instead.
                console.log('[selectUserIdProperty] Closing and reopening the flyout...');
                const closeBtn = this.page.locator("//div[@role='dialog' or contains(@id,'headlessui-dialog')]//button[normalize-space()='Cancel' or .//*[normalize-space()='Close panel']]").first();
                await closeBtn.click().catch(async () => { await this.page.keyboard.press('Escape').catch(() => {}); });
                await this.pause(1500);

                const reopenBtn = this.page.locator("//button[contains(normalize-space(),'customer property') or contains(@data-testid,'customer property-btn')]").last();
                await reopenBtn.waitFor({ state: 'visible', timeout: 5000 });
                await reopenBtn.click();
                await this.pause(2500);
            }

            // 4. Select 'User Id' in the flyout

            const isVisible = await userIdOption.isVisible({ timeout: 5000 }).catch(() => false);
            if (isVisible) {
                await userIdOption.scrollIntoViewIfNeeded().catch(() => {});
                await userIdOption.click({ force: true });
                await this.pause(1000);

                // If flyout has an 'Add property' button, click it
                const addBtn = this.page.locator(this.sel.customerPropsDrawerAddBtn).first();
                if (await addBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
                    const isEnabled = await addBtn.isEnabled().catch(() => false);
                    if (isEnabled) await addBtn.click().catch(() => {});
                }

                // Verify User Id is applied and Condition button is visible
                await this.pause(1000);
                const conditionBtn = this.page.locator(this.sel.ConditionBtn).first();
                const appliedCheck = (await conditionBtn.isVisible({ timeout: 4000 }).catch(() => false)) ||
                                     !(await flyout.isVisible({ timeout: 1500 }).catch(() => false));

                if (appliedCheck) {
                    console.log('[selectUserIdProperty] User Id property successfully selected and applied!');
                    return;
                }
            }

            console.log(`[selectUserIdProperty] Attempt ${attempt} did not complete, waiting before retry...`);
            await this.pause(1500);
        }

        // Final verification check
        const conditionBtn = this.page.locator(this.sel.ConditionBtn).first();
        await conditionBtn.waitFor({ state: 'visible', timeout: 10000 });
        console.log('[selectUserIdProperty] User Id applied and Condition button is ready.');
    }

    /** Click "Is One Of": the label when the flyout has one, otherwise the input/text fallback. */
    private async clickConditionIsOneOf() {
        const label = this.page.locator(this.sel.ConditionIsOneOfLabel).first();
        const fallback = this.page.locator(this.sel.ConditionIsOneOfBtn).first();
        // Wait until the option list is rendered, then prefer the label if there is one.
        await label.or(fallback).first().waitFor({ state: 'visible', timeout: 10000 });
        await this.click((await label.isVisible()) ? this.sel.ConditionIsOneOfLabel : this.sel.ConditionIsOneOfBtn);
    }

    async selectConditionIsOneOf() {
        await this.click(this.sel.ConditionBtn);
        await this.clickConditionIsOneOf();
    }

    async selectCustomerPropertiesValueslevel1Btn() {
        await this.clickLast(this.sel.CustomerPropertiesValueslevel1Btn);
    }

    async clickAddValuesBtn() {
        await this.clickLast(this.sel.CustomerPropertiesValueslevel2Btn);
    }

    async enterUserIdValue(userId: string) {
        await this.pause(500);

        // 1. Enter in search box (#search-data) and press Enter
        const searchInput = this.page.locator("//*[@id='search-data'] | //input[@id='search-data'] | //input[@placeholder='Search']").first();
        await searchInput.waitFor({ state: 'visible', timeout: 15000 });
        await searchInput.fill('');
        await searchInput.fill(userId);
        await this.page.keyboard.press('Enter').catch(() => {});
        await this.pause(500);

        // 2. Directly click Add values button ([data-testid='commonProfile-add-values-btn'])
        const addBtn = this.page.locator("//*[@data-testid='commonProfile-add-values-btn'] | //button[normalize-space()='Add values']").first();
        await addBtn.waitFor({ state: 'visible', timeout: 10000 });
        await addBtn.click();
        await this.pause(1000);
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

    // ------------------------------------------------------------- Preview

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

    // ------------------------------------------------------------- Save Publish

    async clickPublishBtn() {
        await this.click(this.sel.publishBtn);
    }

    async saveDraft() {
        await this.click(this.sel.saveDraftBtn);
        const confirmBtn = this.page.locator(this.sel.saveDraftConfirm).first();
        if (await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await Promise.allSettled([
                this.page.waitForLoadState('networkidle').catch(() => { }),
                confirmBtn.click(),
            ]);
        }
        await this.pause(1000);
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
        await this.pause(1000);

        const confirmBtn = this.page.locator(`${this.sel.publishConfirm1} | ${this.sel.updateConfirm}`).first();
        if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await confirmBtn.click().catch(() => {});
            await this.pause(1000);
        }

        const staticRadio = this.page.locator(this.sel.publishStatic).first();
        await staticRadio.waitFor({ state: 'visible', timeout: 10000 });
        await staticRadio.click({ force: true });
        await this.pause(500);

        const confirmTypeBtn = this.page.locator(this.sel.publishTypeConfirm).first();
        await confirmTypeBtn.waitFor({ state: 'visible', timeout: 10000 });
        await confirmTypeBtn.click({ force: true });
        await this.pause(2000);

        // Wait for modal backdrop to detach and page to settle
        const modalBackdrop = this.page.locator("#headlessui-portal-root").first();
        await modalBackdrop.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
        await this.page.waitForLoadState('domcontentloaded').catch(() => {});
        await this.pause(1000);
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

        // Select Scheduled audience radio button
        await this.page.locator(this.sel.publishSchedule).click();
        await this.pause(500);

        // New UI (Sept 2026): "Edit schedule" button must be clicked to open the date/time
        // sub-dialog. The Confirm on the trigger modal is clicked AFTER Update Schedule
        // (handled in the step definition, not here).
        const editBtn = this.page.locator(this.sel.editScheduleBtn);
        const editBtnVisible = await editBtn.isVisible({ timeout: 5000 }).catch(() => false);
        if (editBtnVisible) {
            await editBtn.click();
            await this.pause(1000);
            // NOTE: publishTypeConfirm is NOT clicked here.
            // It must be clicked after clickUpdateSchedule() closes the sub-dialog.
        } else {
            // Old UI fallback: Confirm opens the date picker directly.
            await this.click(this.sel.publishTypeConfirm);
        }
    }

    /** Click the Confirm button on the "Choose audience trigger" modal.
     *  Call this AFTER clickUpdateSchedule() when using the new UI (Edit schedule flow). */
    async clickPublishTypeConfirm() {
        await this.click(this.sel.publishTypeConfirm);
        await this.pause(1000);
    }

    // ------------------------------------------------------------- Filter Search

    async applyStatusFilter(status: string) {
        await this.click(this.sel.filterBtn);
        const testId = `audience-${status.toLowerCase()}`;
        const checkboxSelector = `//input[@data-testid='${testId}' or @data-test-id='${testId}']`;
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

    // ------------------------------------------------------------- Edit Audience

    async openEditForAudience(title: string) {
        const titleXPath = !title.includes("'") ? `'${title}'` : `"${title}"`;
        const menuSelector = `//tr[.//span[contains(normalize-space(.), ${titleXPath})]]//button[contains(@data-testid,'audience-listView-tableList-dropdownIcon')]`;
        await this.click(menuSelector);

        const editBtn = this.page.locator("//button[contains(normalize-space(),'Edit Audience') or @data-testid='audience-listView-tableList-dropdownIcon-1-edit-audience' or @data-test-id='audience-listView-tableList-dropdownIcon-1-edit-audience'] | //li[normalize-space()='Edit Audience']").first();
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
        const prefix = expectedTitle.slice(0, 15);
        const nameCell = this.page.locator(`//tr[.//span[contains(text(), '${prefix}')]]//td[2] | //span[contains(text(), '${prefix}')]`).first();
        if (await nameCell.isVisible({ timeout: 5000 }).catch(() => false)) {
            await nameCell.hover().catch(() => {});
        }

        const tooltipLocator = this.page.locator(
            "span[class*='group-hover:visible'], [role='tooltip'], div[class*='tooltip'], span[title]",
            { hasText: expectedTitle }
        ).first();

        const attached = await tooltipLocator.waitFor({ state: 'attached', timeout: 10000 }).then(() => true).catch(() => false);
        if (attached) {
            const actualTitle = (await tooltipLocator.textContent())?.trim() || '';
            if (actualTitle.includes(expectedTitle)) {
                return;
            }
        }

        const titleAttr = await nameCell.getAttribute('title').catch(() => null);
        if (titleAttr && titleAttr.includes(expectedTitle)) {
            return;
        }

        const cellText = (await nameCell.textContent())?.trim() || '';
        if (cellText.includes(expectedTitle)) {
            return;
        }

        throw new Error(`Tooltip title mismatch. Expected "${expectedTitle}", got "${cellText}"`);
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
        const prefix = title.slice(0, 15);
        const prefixXPath = !prefix.includes("'") ? `'${prefix}'` : `"${prefix}"`;
        const rowSelector = `//tr[contains(., ${titleXPath}) or contains(., ${prefixXPath})] | //*[contains(normalize-space(), ${titleXPath}) or contains(normalize-space(), ${prefixXPath})]`;
        await this.pause(1000);
        const row = this.page.locator(rowSelector).first();
        await row.waitFor({ state: 'attached', timeout: 30000 });
    }

    async searchInCriteriaField(name: string) {
        const searchField = this.page.locator(this.sel.searchField).first();
        await searchField.waitFor({ state: 'visible', timeout: 30000 });
        await searchField.fill(name);
        await this.page.keyboard.press('Enter').catch(() => { });
    }

    // ------------------------------------------------------------- Event Performed Criteria

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

        const applyBtn = this.page.locator("//button[normalize-space()='Add occurrence'] | //button[normalize-space()='Apply'] | //button[@data-testid='flyout-confirm-btn' or @data-test-id='flyout-confirm-btn']").first();

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

    // ------------------------------------------------------------- Customer Metric Criteria

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

    // ------------------------------------------------------------- Part of Audience Criteria

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
        const option = this.page.locator(`//label[contains(., '${audienceName}')] | //*[@data-testid='${audienceName.toLowerCase()}' or @data-test-id='${audienceName.toLowerCase()}']`).last();
        await option.click({ force: true });
        await this.click(this.sel.AddAudienceBtn);
        await this.pause(500);
    }

    // ------------------------------------------------------------- Customer Engagement Criteria

    async openCustomerEngagement() {
        await this.clickLast(this.sel.criteria);
        await this.click(this.sel.criteriaCustomerEngagement);
    }

    async selectWorkflowEngagement() {
        await this.clickLast(this.sel.criteriaCustomerEngagementevent);
        await this.click(this.sel.engagementWorkflow);
        await this.pause(500);
    }

    /**
     * Open the "+ engagement attribute" flyout, pick an option and make sure it was applied.
     * If the option is not applied the flyout stays open and no condition button appears,
     * so later steps would wait for the full timeout. Fail fast with a clear message instead.
     */
    private async pickEngagementAttribute(optionSelector: string, label: string) {
        await this.page.locator(this.sel.engagementattribute).last().click();
        await this.pause(500);

        await this.waitForVisible(optionSelector, 10000);
        await this.click(optionSelector);

        // Depending on the flyout, selecting the option either closes it right away or leaves it
        // open with "Add attribute" enabled. Click "Add attribute" only when it is still there.
        if (await this.isVisible(this.sel.addAttributeBtn, 2000)) {
            const addBtn = this.page.locator(this.sel.addAttributeBtn).first();
            if (!await addBtn.isEnabled().catch(() => false)) {
                throw new Error(`"${label}" was not applied: the option was not selected, so "Add attribute" stayed disabled.`);
            }
            await addBtn.click();
            await addBtn.waitFor({ state: 'detached', timeout: 10000 });
        }

        // A condition button appears for the new attribute row once it is applied.
        const applied = await this.isVisible(this.sel.ConditionBtn, 10000);
        if (!applied) {
            throw new Error(`"${label}" was not applied: no condition button appeared after selecting it.`);
        }
    }

    async selectWorkflowName() {
        await this.pickEngagementAttribute(this.sel.workflowName, 'Workflow Name');
    }

    private async selectValueFromDrawerOrAddFallback(fallbackVal = "Workflow_Test") {
        await this.pause(1000);
        const optionItem = this.page.locator(this.sel.valuesDrawerOption).first();

        if (await optionItem.isVisible({ timeout: 4000 }).catch(() => false)) {
            // Clicking an already ticked option would untick it, so only click when it is not selected yet.
            const alreadyChecked = await this.page.locator(this.sel.valuesDrawerCheckbox).first().isChecked().catch(() => false);
            if (!alreadyChecked) {
                await optionItem.click();
            }
        } else {
            const addValueBtn = this.page.locator("//button[contains(normalize-space(),'Add value') or contains(.,'Add value')]").first();
            if (await addValueBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
                await addValueBtn.click();
                await this.pause(500);
                const valInput = this.page.locator("//input[@placeholder='Search' or @id='search-data' or @type='text']").first();
                if (await valInput.isVisible().catch(() => false)) {
                    await valInput.fill(fallbackVal);
                    await this.page.keyboard.press('Enter').catch(() => {});
                }
            } else {
                const searchField = this.page.locator("//input[@id='search-data' or @placeholder='Search']").first();
                if (await searchField.isVisible().catch(() => false)) {
                    await searchField.fill(fallbackVal);
                    await this.page.keyboard.press('Enter').catch(() => {});
                }
            }
        }
        await this.pause(500);
        // Use the drawer's own button: sel.addValuesBtn also matches the "+ Add values" chip in the rule row.
        const addBtn = this.page.locator(this.sel.valuesDrawerAddBtn).first();
        await addBtn.waitFor({ state: 'visible', timeout: 10000 });
        if (!await addBtn.isEnabled().catch(() => false)) {
            throw new Error('No value was selected in the values drawer, so "Add values" is disabled.');
        }
        await addBtn.click();
        await addBtn.waitFor({ state: 'detached', timeout: 10000 });
    }

    async selectWorkflowNameValue() {
        await this.click(this.sel.ConditionBtn);
        await this.clickConditionIsOneOf();
        await this.page.locator("//button[contains(@data-testid,'-eventValues-btn-')]").first().click();
        await this.selectValueFromDrawerOrAddFallback("Registration_Workflow");
    }

    async selectWorkflowActionValue() {
        await this.page.locator(this.sel.ConditionBtn).last().click();
        await this.clickConditionIsOneOf();
        await this.click(this.sel.workflowActionValuesBtn);
        await this.selectValueFromDrawerOrAddFallback("Action_Completed");
    }

    async selectWorkflowAction() {
        await this.pickEngagementAttribute(this.sel.workflowAction, 'Workflow Action');
    }

    // ------------------------------------------------------------- AND OR Logic

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

    // ------------------------------------------------------------- Preview generic

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

    // ------------------------------------------------------------- Remove Value

    async removeFirstUserIdValue() {
        const removeBtn = this.page.locator(this.sel.removeValueBtn).first();
        await removeBtn.waitFor({ state: 'visible', timeout: 10000 });
        await removeBtn.click();
        await this.pause(500);
    }

    // ------------------------------------------------------------- Action Menu Duplicate

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

    // ------------------------------------------------------------- Edit Published



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

    // ------------------------------------------------------------- Validation

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

    // ------------------------------------------------------------- Console Errors

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

    // ------------------------------------------------------------- Action Menu Options

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
        // Ensure the download modal is closed so it doesn't block downstream actions
        const closeBtn = this.page.locator("//div[@role='dialog' or contains(@class,'modal')]//button[contains(@class,'close') or @aria-label='Close' or normalize-space()='Cancel' or normalize-space()='Close' or .//*[name()='svg']]").first();
        if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await closeBtn.click().catch(() => {});
        }
        await this.page.keyboard.press('Escape').catch(() => {});
        await this.pause(1000);
        return targetPath;
    }

    async clickCreateRetentionAudience() {
        // Ensure any lingering modal or backdrop is closed
        await this.page.keyboard.press('Escape').catch(() => {});
        await this.pause(500);

        const dropdownBtn = this.page.locator(this.sel.createNewDropdownBtn).first();
        await dropdownBtn.waitFor({ state: 'visible', timeout: 15000 });
        await dropdownBtn.click({ force: true });
        await this.pause(600);

        const retentionBtn = this.page.locator(this.sel.retentionAudienceBtn).first();
        await retentionBtn.waitFor({ state: 'visible', timeout: 10000 });
        await retentionBtn.click({ force: true });
        await this.pause(1000);
    }

    async uploadCSVFile(filePath: string) {
        // "Import CSV" opens the "Import audience from CSV" modal; its hidden file input is #selectFile.
        await this.page.locator(this.sel.csvFileInput).first().waitFor({ state: 'attached', timeout: 20000 });
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


