import { BasePage } from './base.page';

/**
 * AudiencePage — encapsulates all Audience module selectors and actions.
 */
export class AudiencePage extends BasePage {

    private readonly sel = {
        // Tabs
        tabAll:        "//a[@data-testid='audience-tab-all']",
        tabLive:       "//a[@data-testid='audience-tab-live']",
        tabOnSchedule: "//a[@data-testid='audience-tab-scheduled']",
        tabStatic:     "//a[@data-testid='audience-tab-static']",
        staticTabActive: "//h3[normalize-space()='Static audiences']",

        // View toggle
        viewDropdown:      "//button[@data-testid='audience-select-menu']",
        cardViewBtn:       "//button[@data-testid='audience-select-menu-card-view']",
        listViewBtn:       "//button[@data-testid='audience-select-menu-list-view']",
        cardViewContainer: "//button[.//span[normalize-space()='Card']]",
        listViewContainer: "//button[.//span[normalize-space()='List']]",

        // Create
        createNewBtn:      "//button[@data-testid='create-new-audience-btn']",
        createFromScratch: "//div[normalize-space(.)='Create from scratch']",
        nameInput:         "//input[@data-testid='create-audience-modal-popup-input']",
        tagsInput:         "//input[@data-testid='create-audience-modal-popup-tag']",
        submitBtn:         "//button[@data-testid='create-audience-modal-popup-ok-btn']",
        editTitle:         "//h2[@title]",

        // Criteria
        criteria:                  "//button[@data-testid='audience-ruleBuilder-criteriaIcon-group-1']",
        criteriaCustomerProps:     "//button[@data-testid='audience-ruleBuilder-criteriaIcon-group-1-customer-properties']",
        customerPropsEvent:        "//button[@data-testid='audience-ruleBuilder-customer-properties-group-1-customer property-btn-1']",
        userIdInput:               "//input[@data-testid='user_id']",
        ConditionIsOneOfBtn:    "//input[@data-testid='is-one-of']",
       searchField:               "//input[@id='search-data']",
        CustomerPropertiesValueslevel1Btn:    "//button[@data-testid='audience-ruleBuilder-customer-properties-group-1-values-btn-1-1']",
        CustomerEngagementValueslevel1Btn:                 "//button[@data-testid='audience-ruleBuilder-customer-engagement-group-1-eventValues-btn-1-1']",
        CustomerEngagementValueslevel2Btn:                 "//button[@data-testid='audience-ruleBuilder-customer-engagement-group-1-eventValues-btn-1-2']",
        addValuesBtn:              "//button[@data-testid='commonProfile-add-values-btn']",
        CustomerPropertiesValueslevel2Btn:              "//button[@data-testid='audience-ruleBuilder-customer-properties-group-1-values-btn-1']",
        // Preview
        preview1: "//button[@data-testid='audience-ruleBuilder-previewButton']",
        preview2: "//button[@data-testid='audience-ruleBuilder-preview-refresh-button']",

        // Save / Publish
        saveDraftBtn:       "//button[@data-testid='audience-create-save-draft-btn']",
        saveDraftConfirm:   "//button[@data-testid='audience-save-draft-create-btn']",
        cancelBtn:          "//button[@data-testid='audience-cancel-save-draft']",
        publishBtn:         "//button[@data-testid='audience-create-publish-now-btn']",
        publishConfirm1:    "//button[@data-testid='audience-publish-create-btn']",
        publishCancel:      "//button[@data-testid='audience-cancel-publish']",
        publishTypeConfirm: "//button[@data-testid='audience-type-modal-confirm-btn']",
        publishStatic:      "//button[@data-testid='audience-type-modal-static-input-radio']",
        publishSchedule:    "//input[@data-testid='audience-type-modal-scheduled-input-radio']",
        updateBtn:          "//button[@data-testid='audience-edit-update-btn']",
        updateConfirm:      "//button[@data-testid='audience-publish-edit-btn']",

        // Filter & Search
        filterBtn:        "//button[@data-testid='audience-table-listing-filter-btn']",
        filterActive:     "//input[@data-testid='audience-active']",
        filterApplyBtn:   "//button[@data-testid='audience-apply-btn']",
        mainSearchField:  "//input[@id='mobile-search-candidate']",

        // Criteria — Event Performed
        criteriaEventPerformed:   "//button[@data-testid='audience-ruleBuilder-criteriaIcon-group-1-event-performed']",
        criteriaevent:                    "//button[@data-testid='audience-ruleBuilder-event-performed-group-1-event-btn-1']",
        eventLoginOption:         "//input[@data-testid='login']",
        eventOccurrenceExactlyOnce: "//span[@data-testid='audience-ruleBuilder-event-performed-group-1-occurrence-condition-btn-1']",
        eventOccurrenceAtLeast:   "//input[@data-testid='atleast-[#]-time']",
        occurrenceCountInput:     "//input[@class='w-10 px-2 py-1 text-sm outline-none border-none bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none']",
        eventDateRangeBtn:        "//span[@data-testid='audience-ruleBuilder-event-performed-group-1-dateTimePickerModal-rangeValue-Btn-1']",
        eventDateRangeToday:      "//ul[@data-testid='dateTimePicker-modal-relative-today']",
        eventDateRangeApply:      "//button[@data-testid='dateTimePicker-modal-apply-button']",
        eventDateRangeCancel:     "//button[@data-testid='dateTimePicker-modal-cancel-button']",    
        TimeWindowBtn:            "//button[@class='bg-white flex flex-row items-center justify-center border border-gray-300 rounded-lg px-3 py-2 cursor-pointer']",
        SlectedTimeWindowclose:   "//span[normalize-space()='Today']/ancestor::div[contains(@class,'bg-white')]//button[contains(@class,'ps-1')]",
        
        
        
        // Criteria — Customer Metric
        criteriaCustomerMetric:       "//button[@data-testid='audience-ruleBuilder-criteriaIcon-group-1-customer-metric']",
        criteriaCustomerMetricEvent: "//button[@class='bg-white flex flex-row items-center justify-center rounded-md px-3 py-2 border border-gray-300 cursor-pointer']",
        metricTotalDeposited:         "//input[@data-testid='total-deposited-amount']",
        ConditionBtn:           "//button[@class='bg-white flex flex-row items-center justify-center border border-gray-300 rounded-lg px-3 py-2 cursor-pointer']",
        metricConditionGreaterEqual:  "//input[@data-testid='greater-than-or-equal-to']",
        metricValueInput:             "//input[@class='text-center focus:outline-none']",

        // Criteria — Part of Audience
        criteriaPartOfAudience:    "//button[@data-testid='audience-ruleBuilder-criteriaIcon-group-1-part-of-an-audience']",
        criteriaPartOfAudienceevent: "//button[@data-testid='audience-ruleBuilder-part-of-an-audience-existingAudience-1-btn']",
        partOfAudienceDropdown:    "//button[@data-testid='audience-ruleBuilder-part-of-an-audience-existingAudience-1-btn']",
        partOfAudienceSearch:      "//input[@id='search-data']",
        AddAudienceBtn:            "//button[@data-testid='commonProfile-add-audience-btn']",

        // Criteria — Customer Engagement
        criteriaCustomerEngagement:  "//button[@data-testid='audience-ruleBuilder-criteriaIcon-group-1-customer-engagement']",
        criteriaCustomerEngagementevent: "//button[@data-testid='audience-ruleBuilder-customer-engagement-group-1-eventAttribute-btn-1']",
        engagementWorkflow:          "//input[@data-testid='workflow_engagement']",
        engagementattribute:          "//button[@data-testid='audience-ruleBuilder-customer-engagement-group-1-eventAttribute-btn-1']",
        workflowName:        "//input[@data-testid='workflow_id']",
        workflowAction:      "//input[@data-testid='node_id']",

        // AND / OR logic
        Group1AndConditionBtn:   "//button[@data-testid='audience-ruleBuilder-criteriaIcon-group-1']",
        addGroupBtn:       "//button[@data-testid='audience-ruleBuilder-add-group-btn']",
        criteriaGroup2:    "//button[@data-testid='audience-ruleBuilder-criteriaIcon-group-2']",
        criteriaGroup2CustomerProps: "//button[@data-testid='audience-ruleBuilder-criteriaIcon-group-2-customer-properties']",

        // Action menu (list view)
        actionMenuBtnTemplate:  "//tr[.//span[contains(normalize-space(.), '{{TITLE}}')]]//button[contains(@class,'action') or @data-testid]//span[contains(@class,'dots') or text()='⋮']/.. | //tr[.//span[contains(normalize-space(.), '{{TITLE}}')]]//td[last()]//button",
        duplicateOption:        "//button[normalize-space()='Duplicate' or @data-testid='audience-listView-tableList-dropdownIcon-1-duplicate']",
        duplicatePopupInput:    "//div[contains(@class,'modal') or @role='dialog']//input",
        duplicatePopupBtn:      "//button[normalize-space()='Duplicate']",
        duplicatePopupCancel:   "//button[normalize-space()='Cancel']",
        duplicatePopupTitle:    "//div[contains(@class,'modal') or @role='dialog']//input",

       
        // Validation
        validationError:       "//div[contains(@class,'bg-warning')]//p[string-length(normalize-space()) > 0]",

        // Value removal
        removeValueBtn:  "//button[@data-testid='audience-ruleBuilder-customer-properties-group-1-eventValue-clearBtn-1-values']",
    };

    // ─── Tab Navigation ──────────────────────────────────────────────────────

    async clickTabAll()        { await this.click(this.sel.tabAll); }
    async clickTabLive()       { await this.click(this.sel.tabLive); }
    async clickTabOnSchedule() { await this.click(this.sel.tabOnSchedule); }
    async clickTabStatic()     { await this.click(this.sel.tabStatic); }

    async isStaticTabActive(): Promise<boolean> {
        return this.isVisible(this.sel.staticTabActive);
    }

    // ─── View Toggle ─────────────────────────────────────────────────────────

    async switchToCardView() {
        await this.click(this.sel.viewDropdown);
        await this.click(this.sel.cardViewBtn);
    }

    async switchToListView() {
        await this.click(this.sel.viewDropdown);
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

    async clickCreateNew()       { await this.pause(500);
        await this.click(this.sel.createNewBtn); }
    async clickCreateFromScratch() { await this.pause(500);
        await this.click(this.sel.createFromScratch); }

    async waitForCreatePage() {
        await this.waitForVisible(this.sel.nameInput, 30000);
    }

    async fillDetails(name: string, tag?: string) {
        await this.fill(this.sel.nameInput, name);
        if (tag) {
            const visible = await this.isVisible(this.sel.tagsInput);
            if (visible) {
                await this.fill(this.sel.tagsInput, tag);
                await this.page.keyboard.press('Enter').catch(() => {});
            }
        }
    }

    async clickCreateSubmit() {
        const submitBtn = this.page.locator(this.sel.submitBtn).first();
        await submitBtn.waitFor({ state: 'visible', timeout: 20000 });
        await Promise.allSettled([
            this.page.waitForLoadState('networkidle').catch(() => {}),
            submitBtn.click({ timeout: 20000 }),
        ]);
    }

    async waitForEditPage() {
        await this.waitForVisible(this.sel.criteria, 30000);
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
        await this.click(this.sel.CustomerPropertiesValueslevel1Btn);
    }


    async clickAddValuesBtn() {
        await this.click(this.sel.CustomerPropertiesValueslevel2Btn);
    }

    async enterUserIdValue(userId: string) {
        
        await this.pause(2000);
        const searchField = this.page.locator(this.sel.searchField).first();
        if (await searchField.isVisible().catch(() => false)) {
            await searchField.fill(userId);
            await this.page.keyboard.press('Enter').catch(() => {});
            await this.click(this.sel.addValuesBtn);
        }
    }

    async addExtraUserIds(userIds: string[]) {
        await this.click(this.sel.addValuesBtn);
        await this.pause(2000);
        const searchField = this.page.locator(this.sel.searchField).first();
        await searchField.waitFor({ state: 'visible', timeout: 20000 });

        for (const userId of userIds) {
            await searchField.fill(userId);
            await this.page.keyboard.press('Enter').catch(() => {});
        }
        await this.click(this.sel.addValuesBtn);
    }

    // ─── Preview ─────────────────────────────────────────────────────────────

    async clickPreview1() { await this.click(this.sel.preview1); }
    async clickPreview2() { await this.click(this.sel.preview2); }

    // ─── Save / Publish ──────────────────────────────────────────────────────

    async saveDraft() {
        await this.click(this.sel.saveDraftBtn);
        const confirmBtn = this.page.locator(this.sel.saveDraftConfirm).first();
        await confirmBtn.waitFor({ state: 'visible', timeout: 20000 });
        await Promise.allSettled([
            this.page.waitForLoadState('networkidle').catch(() => {}),
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
            this.page.waitForLoadState('networkidle').catch(() => {}),
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
            this.page.waitForLoadState('networkidle').catch(() => {}),
            confirmBtn.click(),
        ]);

        await this.page.locator(this.sel.publishSchedule).click();
        await this.click(this.sel.publishTypeConfirm);
    }

    // ─── Filter & Search ─────────────────────────────────────────────────────

    async applyActiveFilter() {
        await this.click(this.sel.filterBtn);
        await this.click(this.sel.filterActive);
        await this.click(this.sel.filterApplyBtn);
        await this.pause(2000);
    }

    async searchByName(name: string) {
        const searchField = this.page.locator(this.sel.mainSearchField).first();
        if (await searchField.isVisible().catch(() => false)) {
            await searchField.fill(name);
            await this.page.keyboard.press('Enter').catch(() => {});
            await this.pause(4000);
            await this.page.keyboard.press('Enter').catch(() => {});
        }
    }

    // ─── Edit Audience ───────────────────────────────────────────────────────

    async openEditForAudience(title: string) {
        const titleXPath = !title.includes("'") ? `'${title}'` : `"${title}"`;
        const menuSelector = `//tr[.//span[contains(normalize-space(.), ${titleXPath})]]//button[contains(@data-testid,'audience-listView-tableList-dropdownIcon')]`;
        await this.click(menuSelector);

        const editBtn = this.page.locator("//button[@data-testid='audience-listView-tableList-dropdownIcon-1-edit-audience']").first();
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
        const tooltipLocator = this.page.locator(
            "span[class*='group-hover:visible']",
            { hasText: expectedTitle }
        ).first();
        await tooltipLocator.waitFor({ state: 'attached', timeout: 20000 });
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
        await this.page.keyboard.press('Enter').catch(() => {});
    }

    // ─── Event Performed Criteria ─────────────────────────────────────────────

    async openEventPerformed() {
        await this.click(this.sel.criteria);
        await this.click(this.sel.criteriaEventPerformed);
    }

    async selectLoginEvent() {
        await this.click(this.sel.criteriaevent);
        await this.click(this.sel.eventLoginOption);
        await this.pause(500);
    }

    async setAtLeastOneTime() {
        await this.click(this.sel.eventOccurrenceExactlyOnce);
        await this.click(this.sel.eventOccurrenceAtLeast);
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

       if(await this.isVisible(this.sel.TimeWindowBtn)){ 
       for (let attempt = 0; attempt < 3; attempt++) {
            await this.click(this.sel.TimeWindowBtn);
            await this.click(this.sel.eventDateRangeToday);
            await this.page.locator(this.sel.eventDateRangeApply).first().click();
            await this.pause(500);
            if (await this.isVisible(this.sel.SlectedTimeWindowclose)) break;
        }}
        else{await this.pause(500);}
    }

    // ─── Customer Metric Criteria ─────────────────────────────────────────────

    async openCustomerMetric() {
        await this.page.locator(this.sel.criteria).last().click();
        await this.click(this.sel.criteriaCustomerMetric);
    }

    async selectTotalDepositedAmount() {
        await this.click(this.sel.criteriaCustomerMetricEvent);
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
        await this.page.keyboard.press('Enter').catch(() => {});
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
        await this.click(this.sel.criteria);
        await this.click(this.sel.criteriaPartOfAudience);
    }

    async selectExistingAudienceInCriteria(audienceName: string) {
        await this.click(this.sel.criteriaPartOfAudienceevent);
        await this.click(this.sel.partOfAudienceDropdown);
        await this.pause(500);
        const searchField = this.page.locator(this.sel.partOfAudienceSearch).first();
        if (await searchField.isVisible({ timeout: 5000 }).catch(() => false)) {
            await searchField.click();
            await searchField.fill(audienceName);
            await this.page.keyboard.press('Enter').catch(() => {});
            await this.pause(1500);
        }
        const option = this.page.locator(`//input[@id='${audienceName}']`).first();
        await option.click();
        await this.click(this.sel.AddAudienceBtn);
        await this.pause(500);
    }

    // ─── Customer Engagement Criteria ─────────────────────────────────────────

    async openCustomerEngagement() {
        await this.click(this.sel.criteria);
        await this.click(this.sel.criteriaCustomerEngagement);
    }

    async selectWorkflowEngagement() {
        await this.click(this.sel.criteriaCustomerEngagementevent);
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
        await this.click(this.sel.CustomerEngagementValueslevel1Btn);
        // const searchField = this.page.locator(this.sel.searchField).first();
        // await searchField.waitFor({ state: 'visible', timeout: 10000 });
        // await searchField.fill('Workflow');
        // await this.pause(2000);

        const results = this.page.locator("//button[@class='flex items-center']");
        const count = await results.count();
        if (count === 1) {
            await results.first().click();
        } else if (count > 1) {
            await results.first().click();
        }
        await this.click(this.sel.addValuesBtn);
        await this.pause(500);
    }

    async selectWorkflowActionValue() {
        await this.page.locator(this.sel.ConditionBtn).last().click();
        await this.click(this.sel.ConditionIsOneOfBtn);
        await this.click(this.sel.CustomerEngagementValueslevel2Btn);
        
        const results = this.page.locator("//button[@class='flex items-center']");
        await results.first().click();
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
}
