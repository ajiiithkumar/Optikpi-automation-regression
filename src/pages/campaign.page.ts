import { BasePage } from './base.page';

/**
 * CampaignPage — encapsulates all Campaign module selectors and actions.
 */
export class CampaignPage extends BasePage {

    // ─── Private Selectors ───────────────────────────────────────────────────
    private readonly sel = {
        // Tabs
        activeTab:       "//button[@data-test-id='campaign-tab-active']",
        completedTab:    "//button[@data-test-id='campaign-tab-completed']",
        draftTab:        "//button[@data-test-id='campaign-tab-draft']",
        allTab:          "//button[@data-test-id='campaign-tab-all']",

        // Creation
        createNewBtn:    "//button[@data-testid='create-new-campaign-button']",
        nameInput:       "//input[@data-testid='campaign-name-input']",
        tagInput:        "//input[@data-testid='campaign-tag-input']",
        createBtn:       "//button[@data-testid='create-campaign-button']",
        editTitle:       "//h2[contains(@class,'text-2xl')]",

        // Goal
        goalClick:       "//div[@data-testid='campaign-goal-Engagement-Click-undefined']",
        goalOpen:        "//div[@data-testid='campaign-goal-Engagement-Open-undefined']",
        setGoalBtn:      "//button[@data-testid='campaign-stepper-set-goal-button']",
        editGoal:        "//button[normalize-space()='Edit goal'] | //span[normalize-space()='Edit goal']",
        financialTab:    "//button[@data-test-id='campaign-tab-financial']",
        goalDeposit_not_selected:   "//div[contains(@data-testid,'campaign-goal-Financial-Deposit-undefined')]",
        goalSummary:     "//button[@data-testid='campaign-goal-preview-click']",
        /** Goal set — Engagement Open shows inline preview (post–goal-picker UI). */
        goalPreviewOpen: "//button[@data-testid='campaign-goal-preview-open']",
        goalPreviewOpenSummary: "//div[contains(@class,'bg-disabledBackground')][.//span[contains(normalize-space(),'Your campaign goal is')] and .//button[@data-testid='campaign-goal-preview-open']]",

        // Audience
        newAudienceTab:       "//button[@data-test-id='campaign-tab-new-audience']",
        existingAudienceTab:  "//button[@data-test-id='campaign-tab-existing-audience']",
        selectExistingBtn:    "//button[contains(normalize-space(),'Select existing audience')]",
        existingAudienceOk:   "//button[@data-testid='flyout-confirm-btn']",
        setAudienceBtn:       "//button[@data-testid='campaign-stepper-set-audience-button']",
        audienceSummary:      "//div[@class='flex items-center flex-wrap justify-start p-2.5 rounded text-tertiary bg-disabledBackground']",
        estimatedReach:       "//*[contains(@data-testid,'estimated-reach') or contains(normalize-space(),'Estimated reach') or contains(normalize-space(),'estimated')]",
        controlGroupInput:    "//input[@data-testid='workflow-control-group-percentage']",
        controlGroupSummary:  "//*[contains(@data-testid,'control-group') or contains(normalize-space(),'Control group')]",
        editAudienceBtn:      "//span[contains(@class,'flex justify-center items-center gap-1 rounded-lg group') and normalize-space()='Edit audience']",

        // Trigger
        triggerStartDate:  "//button[@data-testid='campaign-timer-trigger-startDate-select']",
        setTriggerBtn:     "//button[@data-testid='campaign-stepper-set-trigger-button']",
        triggerSummary:    "//div[@class='flex items-center flex-wrap justify-start p-2.5 rounded text-tertiary border border-warningDark bg-warning gap-1 text-sm whitespace-pre']",
        eventBasedOption:  "//button[@data-test-id='campaign-tab-event-trigger']",
        systemEventOption: "//button[@data-test-id='campaign-tab-systemevent']",
        eventList:         "//div[contains(@data-testid,'trigger-event-list') or contains(@class,'event-list')]",
        loginEvent:        "//input[@data-testid='login']",
        addSimpleEvent:    "//button[@title='Add event' and contains(normalize-space(),'simple event')]",
        Add_live_event_Btn: "//button[@data-testid='add-system-event-btn']",
        applyTriggerBtn:   "//button[@data-testid='trigger-apply-btn' or contains(normalize-space(),'Apply')]",
        triggerValidationError: "//*[contains(normalize-space(),'Trigger dates or Event rules are not set properly. Please update the dates or rules to finish campaign setup.') or contains(normalize-space(),'Trigger dates are not set properly. Please update the dates to finish campaign setup.')]",
        editTriggerBtn:    "//button[contains(@data-testid,'edit-trigger') or (contains(@class,'edit') and ancestor::*[contains(@class,'trigger')])]",
        reenrollToggle:    "//button[contains(@data-testid,'reenroll-toggle') or contains(@aria-label,'Re-enroll')] | //div[contains(normalize-space(),'Re-enroll')]//button[@role='switch'] | //button[following-sibling::*[contains(normalize-space(),'Re-enroll')]]",
        reenrollDaysInput: "//input[contains(@data-testid,'reenroll-days') or contains(@placeholder,'days') or @placeholder='Value']",
  
        // Communication
        chooseContentBtn:     "//button[@data-testid='campaign-choose-content-btn']",
        setCommunicationBtn:  "//button[@data-testid='campaign-stepper-set-communication-button']",
        contentSummary:       "//div[contains(@class,'bg-disabledBackground') and contains(@class,'items-center') and contains(@class,'flex-wrap')]",
        addVariantBtn:        "//button[@data-testid='campaign-add-content-variant-button']",
        chooseContentVariant: "//button[contains(@data-testid,'choose-content-variant') or contains(@data-testid,'campaign-choose-content-btn')]",
        variantA:             "//button[contains(normalize-space(),'Version A') or contains(normalize-space(),'Variant A')]",
        variantB:             "//button[contains(normalize-space(),'Version B') or contains(normalize-space(),'Variant B')]",
        staticAllocation:     "//button[contains(@data-test-id,'campaign-tab-a-b-testing-with-static-allocation') or contains(normalize-space(),'A/B testing with Static Allocation')]",
        criteriaAllocation:   "//button[contains(@data-test-id,'campaign-tab-criteriabasedallocation') or contains(normalize-space(),'Criteria-based Allocation')]",
        variantAInput:        "//input[@data-testid='campaign-version-percentage']",
        variantBInput:        "//input[@data-testid='campaign-version-percentage']",
        totalAllocationSummary: "//div[contains(@class,'bg-disabledBackground') and .//button[normalize-space()='Static allocation'] and .//button[contains(normalize-space(),'Version A')] and .//button[contains(normalize-space(),'Version B')]]",
        addCriteriaBtn:       "//button[contains(@data-testid,'add-criteria') or contains(normalize-space(),'Add Criteria')]",
        addCriteriaBtnVariantA:       "//button[@data-testid='add-criteria-dropdown-A']",
        addCriteriaCustomerProperties: "//button[@data-testid='add-criteria-dropdown-A-customer-properties']",
        criteriaCustomerPropertyBtn:   "//button[@data-testid='audience-ruleBuilder-customer-properties--customer property-btn-1']",
        criteriaConditionBtn:          "//button[@data-testid='audience-ruleBuilder-customer-properties--condition-btn-1']",
        criteriaValuesBtn:             "//button[@data-testid='audience-ruleBuilder-customer-properties--values-btn-1-1']",
        criteriaUserIdInput:           "//input[@data-testid='user_id']",
        criteriaIsOneOfBtn:            "//input[@data-testid='is-one-of']",
        criteriaSearchField:           "//input[@id='search-data']",
        criteriaAddValuesBtn:          "//button[@data-testid='commonProfile-add-values-btn']",
        defaultVariantRadioB:          "//input[@data-testid='default-variant-radio-B']",
        criteriaSummary:               "//div[contains(@class,'bg-disabledBackground') and .//button[normalize-space()='Criteria-based Allocation']]",

        // Publish / Draft
        publishBtn:        "//button[@data-testid='campaign-publish-button']",
        publishConfirm:    "//button[@data-testid='modal-submit-button']",
        saveDraftBtn:      "//button[@data-testid='campaign-save-draft-button']",
        saveDraftConfirm:  "//button[@data-testid='modal-submit-button']",
        headlessModal:     "//*[@id='headlessui-portal-root']//form",

        // Search
        searchIcon: "//button[@data-testid='campaign-listView-table-search-icon']",
        searchBar:  "//input[@id='campaign-listView-table-search-icon']",
        

        // Campaign Details / Edit Name
        campaignEditbtn: "//button[@data-testid='campaign-edit-settings-btn'] | //*[contains(@data-testid,'campaign-performance-report')]",

        editNameBtn:          "//button[contains(@data-testid,'edit-name') or contains(@aria-label,'Edit name') or contains(normalize-space(),'Edit name')]",
        nameEditInput:        "//input[@data-testid='campaign-name-input' or contains(@data-testid,'edit-name-input')]",
        saveNameBtn:          "//button[@data-testid='create-campaign-button' and contains(normalize-space(),'Update campaign')]",
        backToListBtn:        "//button[contains(@data-testid,'back-to-list') or contains(@aria-label,'Back')] | //a[contains(@href,'/campaign')]",

        // Campaign row / list
        campaignRow:          "//tr[contains(@class,'campaign-row')] | //div[contains(@class,'campaign-card')]",
        dropdownIcon:         "//button[@data-testid='campaign-list-view-table-dropdown-icon']",
        dropdownEditSettings: "//button[@data-testid='campaign-list-view-table-dropdown-icon-edit-settings']",
        threeDotMenu:         "//button[contains(@data-testid,'campaign-action-menu') or contains(@aria-label,'Actions') or contains(@class,'action-menu')]",
        duplicateOption:  "//button[@data-testid='campaign-list-view-table-dropdown-icon-duplicate']",
        /** Duplicate modal — campaign name field (portal / dialog). */
        duplicateModalNameInput : "//input[@data-testid='campaign-name-input' or contains(@data-testid,'edit-name-input')]",
        deleteOption:     "//button[@data-testid='campaign-list-view-table-dropdown-icon-delete-campaign']",
        duplicateConfirm: "//button[@data-testid='workflow-action-button']",
        deleteConfirm:    "//button[@data-testid='workflow-action-button']",
        deleteConfirmInput: "//*[@id='headlessui-portal-root']//input[@type='text' or not(@type)]",
        successToast:     "//*[contains(@class,'toast') or contains(@class,'notification') or contains(@class,'Toastify')][string-length(normalize-space()) > 0]",

        // Pagination
        nextPageBtn:     "//button[@data-testid='campaign-pagination-next-btn']",
        prevPageBtn:     "//button[@data-testid='campaign-pagination-previous-btn']",

        // Filter
        filterBtn:       "//button[@data-testid='campaign-listView-table-filter-icon']",
        clearFilterBtn:  "//button[@data-testid='campaign-filters-reset-button']",
        clearFilterChip: "//*[contains(@data-testid,'-clear-button')]",

        // History Log — option in the 3-dot dropdown on the campaign list row
        historyLogBtn:   "//button[@data-testid='campaign-list-view-table-dropdown-icon-view-history-log']",
        historyLogEntry: "//form//tbody//tr",

        // Report — option in the 3-dot dropdown on the campaign list row
        viewReportBtn:   "//button[@data-testid='campaign-list-view-table-dropdown-icon-view-full-report']",
        reportPage:      "//*[contains(@data-testid,'campaign-performance-report')]",
        reportSummaryTab: "//button[@data-testid='campaign-performance-report-summary']",
    };

    // ─── Tab Actions ─────────────────────────────────────────────────────────

    async clickActiveTab() {
        await this.click(this.sel.activeTab);
    }

    async clickCompletedTab() {
        await this.click(this.sel.completedTab);
    }

    async clickDraftTab() {
        await this.click(this.sel.draftTab);
    }

    async clickAllTab() {
        await this.click(this.sel.allTab);
    }

    // ─── Campaign Creation ───────────────────────────────────────────────────

    async clickCreateNew() {
        await this.click(this.sel.createNewBtn);
    }

    async enterCampaignName(name: string) {
        await this.fill(this.sel.nameInput, name);
    }

    async enterCampaignTag(tag: string) {
        const visible = await this.isVisible(this.sel.tagInput);
        if (visible) {
            await this.fill(this.sel.tagInput, tag);
            await this.page.waitForTimeout(300); // Wait for React to register the text
            await this.page.keyboard.press('Enter').catch(() => {});
            await this.page.waitForTimeout(500); // Wait for the tag chip to render before clicking Create
        }
    }

    async clickCreateCampaign() {
        await this.click(this.sel.createBtn);
        await this.waitForNetworkIdle();
        
        // Immediately check if the red error text appears in the modal
        const errorText = this.page.locator("text=/An unexpected error/i").first();
        if (await errorText.isVisible({ timeout: 1000 }).catch(() => false)) {
            // Retry once after 1s for transient server spikes under parallel load
            await this.page.waitForTimeout(1000);
            await this.click(this.sel.createBtn).catch(() => {});
            await this.waitForNetworkIdle();

            if (await errorText.isVisible({ timeout: 1000 }).catch(() => false)) {
                throw new Error('Failed to create campaign: "An unexpected error occurred" is displayed in the modal.');
            }
        }
    }

    async waitForEditPage(timeout = 30000) {
        await this.waitForVisible(this.sel.editTitle, timeout);
    }

    async getEditTitle(timeout = 30000): Promise<string> {
        await this.waitForVisible(this.sel.editTitle, timeout);
        return this.page.locator(this.sel.editTitle).first().innerText();
    }

    async verifyNameUpdated(expectedName: string, timeout = 20000) {
        // Wait for the edit-name input to disappear (panel closed after save)
        await this.page.locator(this.sel.nameEditInput)
            .first().waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
        await this.pause(1000);
        // Read whatever title the h2 currently has — useful for diagnostics
        const currentTitle = await this.page.locator("//h2[contains(@class,'text-2xl')]").first()
            .innerText().catch(() => '<no h2 found>');
        // The <h2> in the page header should now reflect the new name
        const h2 = this.page.locator(`//h2[contains(@class,'text-2xl') and contains(normalize-space(),'${expectedName.trim()}')]`);
        await h2.first().waitFor({ state: 'visible', timeout }).catch(() => {
            throw new Error(
                `Campaign name NOT updated in DOM.\n` +
                `  Expected h2 title to contain: "${expectedName}"\n` +
                `  Actual h2 title found:        "${currentTitle}"\n` +
                `  → The Save button likely clicked the wrong element or save API failed.`
            );
        });
    }

    // ─── Campaign Details / Edit Name ────────────────────────────────────────

    async clickCampaignFromList(name: string) {
        // Target the campaign name cell in the table body to avoid matching nav/sidebar text
        const nameCell = this.page.locator(
            `//tbody[contains(@class,'divide-y')]//tr//td//span[normalize-space()='${name}']`
        ).first();
        const nameCellVisible = await nameCell.isVisible({ timeout: 10000 }).catch(() => false);

        if (nameCellVisible) {
            await nameCell.click();
        } else {
            // Fallback: broader match within tbody rows only
            const row = this.page.locator(
                `//tbody[contains(@class,'divide-y')]//tr[.//*[normalize-space()='${name}']]`
            ).first();
            await row.waitFor({ state: 'visible', timeout: 10000 });
            await row.click();
        }
        await this.pause(2000);
    }

    async enterCampaignEditPage(name: string) {
        const row = this.page.locator(
            `//tbody[contains(@class,'divide-y')]//tr[.//*[normalize-space()='${name}']]`
        ).first();
        await row.waitFor({ state: 'visible', timeout: 15000 });
        await row.hover();
        await this.click(this.sel.dropdownIcon);
        await this.pause(500);
        await this.click(this.sel.dropdownEditSettings);
        await this.pause(2000);
    }

    async campaignEditbtn(timeout = 20000) {
        await this.waitForVisible(this.sel.campaignEditbtn, timeout);
    }

    async clickEditName() {
        await this.click(this.sel.editNameBtn);
    }

    async clearAndEnterNewName(newName: string) {
        const input = this.page.locator(this.sel.nameEditInput).first();
        await input.waitFor({ state: 'visible', timeout: 10000 });
        await input.fill('');
        await input.fill(newName);
    }

    async clickSaveName() {
        await this.pause(500);
        const btn = this.page.locator(this.sel.saveNameBtn).first();
        await btn.waitFor({ state: 'visible', timeout: 10000 });
        await btn.click();
        await this.pause(1500);
    }

    async navigateBackToList() {
        await this.click(this.sel.backToListBtn);
        await this.pause(2000);
    }

    // ─── Goal ────────────────────────────────────────────────────────────────

    async clickGoalClick() {
        await this.click(this.sel.goalClick);
    }

    async clickGoalOpen() {
        await this.click(this.sel.goalOpen);
    }

    async clickFinancialTab() {
        await this.click(this.sel.financialTab);
    }

    async clickDepositGoal() {
        await this.click(this.sel.goalDeposit_not_selected);
    }

    async clickSetGoal() {
        await this.click(this.sel.setGoalBtn);
        await this.pause(1000);
    }

    async verifyGoalIsSet() {
        await this.waitForVisible(this.sel.editGoal);
    }

    /**
     * After choosing Engagement → Open and Set Goal, the stepper shows an inline summary
     * (“Your campaign goal is” … Open) instead of the legacy “Edit goal” chip alone.
     */
    async verifyOpenGoalSet(): Promise<void> {
        await this.waitForVisible(this.sel.goalPreviewOpen, 20000);
        const summary = this.page.locator(this.sel.goalPreviewOpenSummary).first();
        await summary.waitFor({ state: 'visible', timeout: 10000 });
        const text = (await summary.innerText().catch(() => '')).trim();
        if (!/Your campaign goal is/i.test(text)) {
            throw new Error(`Open goal summary missing expected copy. Got: "${text}"`);
        }
        // innerText() often concatenates span + button with no space → "Your campaign goal isOpen."
        const hasOpenLabel =
            /\bis\s+Open\b/i.test(text) ||
            /\bisOpen\b/i.test(text);
        if (!hasOpenLabel) {
            throw new Error(`Open goal summary does not show Open goal. Got: "${text}"`);
        }
    }

    async getGoalSummaryText(): Promise<string> {
        const previewOpen = this.page.locator(this.sel.goalPreviewOpenSummary).first();
        if (await previewOpen.isVisible({ timeout: 3000 }).catch(() => false)) {
            return (await previewOpen.innerText().catch(() => '')).trim();
        }
        const previewClick = this.page.locator(
            "//div[contains(@class,'bg-disabledBackground')][.//span[contains(normalize-space(),'Your campaign goal is')] and .//button[@data-testid='campaign-goal-preview-click']]"
        ).first();
        if (await previewClick.isVisible({ timeout: 2000 }).catch(() => false)) {
            return (await previewClick.innerText().catch(() => '')).trim();
        }
        const el = this.page.locator(this.sel.editGoal).first();
        const visible = await el.isVisible().catch(() => false);
        if (visible) {
            const parent = el.locator('xpath=ancestor::*[contains(@class,"stepper") or contains(@class,"goal")]').first();
            const text = await parent.innerText().catch(() => '');
            return text;
        }
        return '';
    }

    // ─── Audience ────────────────────────────────────────────────────────────

    async clickNewAudienceTab() {
        await this.click(this.sel.newAudienceTab);
    }

    async clickExistingAudienceTab() {
        await this.click(this.sel.existingAudienceTab);
    }

    async clickSelectExistingAudience() {
        await this.click(this.sel.selectExistingBtn);
        await this.pause(1000);
    }

    async selectAudienceByName(name: string) {
        const audienceXPath = `//*[normalize-space()='${name}']`;
        await this.click(audienceXPath);
        await this.pause(1000);
    }

    async confirmAudienceSelection() {
        await this.click(this.sel.existingAudienceOk);
        await this.pause(1000);
    }

    async clickSetAudience() {
        await this.click(this.sel.setAudienceBtn);
    }

    async isAudienceSummaryVisible(): Promise<boolean> {
        const el = this.page.locator(this.sel.contentSummary).nth(1);
        await el.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
        return el.isVisible();
    }

    async isEstimatedReachVisible(): Promise<boolean> {
        return this.isVisible(this.sel.estimatedReach, 10000);
    }

    async isControlGroupInputVisible(): Promise<boolean> {
        return this.isVisible(this.sel.controlGroupInput, 5000);
    }

    async enterControlGroupPercentage(value: string) {
        const input = this.page.locator(this.sel.controlGroupInput).first();
        await input.waitFor({ state: 'visible', timeout: 10000 });
        await input.fill('');
        await input.fill(value);
    }

    async isControlGroupSummaryVisible(): Promise<boolean> {
        return this.isVisible(this.sel.controlGroupSummary, 10000);
    }

    async isAudienceEditDisabled(): Promise<boolean> {
        const btn = this.page.locator(this.sel.editAudienceBtn).first();
        const visible = await btn.isVisible({ timeout: 5000 }).catch(() => false);
        if (!visible) return true;
        return btn.isDisabled();
    }

    // ─── Trigger ─────────────────────────────────────────────────────────────

    async clickTriggerStartDate() {
        await this.click(this.sel.triggerStartDate);
    }

    async clickSetTrigger() {
        await this.click(this.sel.setTriggerBtn);
        await this.pause(1000);
    }

    async isTriggerSummaryVisible(): Promise<boolean> {
        const el = this.page.locator(this.sel.contentSummary).nth(2);
        return el.isVisible({ timeout: 10000 }).catch(() => false);
    }

    async clickEventBasedOption() {
        if (await this.isVisible(this.sel.setTriggerBtn)) {
        await this.click(this.sel.eventBasedOption);
        await this.pause(1000);
        }else{
            await this.clickSetTrigger();
            await this.click(this.sel.eventBasedOption);
            await this.pause(1000);
        }
    }

    async clickSystemEventOption() {
        await this.click(this.sel.systemEventOption);
        await this.pause(1000);
    }
    async clickAddLiveSystemEventBtn() {
        await this.click(this.sel.Add_live_event_Btn);
        await this.pause(500);
    }
    async selectLoginEvent() {
        await this.click(this.sel.addSimpleEvent);
        await this.click(this.sel.loginEvent);
        await this.pause(500);
    }

    async selectFirstSystemEvent() {
        const items = this.page.locator(`${this.sel.eventList}//li | ${this.sel.eventList}//button | ${this.sel.eventList}//*[@role='option']`);
        const count = await items.count();
        if (count > 0) {
            await items.first().click();
            await this.pause(500);
        } else {
            const fallback = this.page.locator("//*[contains(@data-testid,'system-event')]").first();
            await fallback.click();
            await this.pause(500);
        }
    }

    async applyTriggerConfig() {
        await this.click(this.sel.applyTriggerBtn);
        await this.pause(1000);
    }

    async isTriggerValidationErrorVisible(): Promise<boolean> {
        return this.isVisible(this.sel.triggerValidationError, 5000);
    }

    async isTriggerEditDisabled(): Promise<boolean> {
        const btn = this.page.locator(this.sel.editTriggerBtn).first();
        const visible = await btn.isVisible({ timeout: 5000 }).catch(() => false);
        if (!visible) return true;
        return btn.isDisabled();
    }

    async isReenrollToggleVisible(): Promise<boolean> {
        return this.isVisible(this.sel.reenrollToggle, 5000);
    }

    async enableReenrollToggle() {
        await this.click(this.sel.reenrollToggle);
        await this.pause(500);
    }

    async enterReenrollDays(days: string) {
        const input = this.page.locator(this.sel.reenrollDaysInput).first();
        await input.waitFor({ state: 'visible', timeout: 10000 });
        await input.fill(days);
    }



    async setTriggerBtnVisible(): Promise<boolean> {
        const btn = this.page.locator(this.sel.setTriggerBtn).first();
        const visible = await btn.isVisible({ timeout: 5000 }).catch(() => false);
        if (!visible) return true;
        return btn.isDisabled();
    }
    // ─── Communication ───────────────────────────────────────────────────────

    async clickChooseContent() {
        await this.click(this.sel.chooseContentBtn);
        await this.pause(2000);
    }

    async clickSetCommunication() {
        await this.click(this.sel.setCommunicationBtn);
        await this.pause(1000);
    }

    async isContentSummaryVisible(): Promise<boolean> {
        const el = this.page.locator(this.sel.contentSummary).last();
        return el.isVisible({ timeout: 10000 }).catch(() => false);
    }

    async clickAddVariant() {
        await this.click(this.sel.addVariantBtn);
        await this.pause(1000);
    }

    async clickChooseContentForVariant() {
        const btns = this.page.locator(this.sel.chooseContentVariant);
        const count = await btns.count();
        if (count > 1) {
            await btns.nth(count - 1).click();
        } else {
            await btns.first().click();
        }
        await this.pause(2000);
    }

    async isVariantAVisible(): Promise<boolean> {
        return this.isVisible(this.sel.variantA, 5000);
    }

    async isVariantBVisible(): Promise<boolean> {
        return this.isVisible(this.sel.variantB, 5000);
    }

    async selectStaticAllocation(): Promise<boolean> {
        const btn = this.page.locator(this.sel.staticAllocation).first();
        const visible = await btn.isVisible({ timeout: 5000 }).catch(() => false);
        if (!visible) return true;
        await this.click(this.sel.staticAllocation);
        await this.pause(500);
        return true;
    }

    async selectCriteriaAllocation() {
        await this.click(this.sel.criteriaAllocation);
        await this.pause(500);
    }

    async setVariantAPercentage(value: string) {
        const input = this.page.locator(this.sel.variantAInput).nth(0);
        await input.waitFor({ state: 'visible', timeout: 10000 });
        await input.fill(value);
    }

    async setVariantBPercentage(value: string) {
        const input = this.page.locator(this.sel.variantBInput).nth(1);
        await input.waitFor({ state: 'visible', timeout: 10000 });
        await input.fill(value);
    }

    async getTotalAllocationText(): Promise<string> {
        const inputValues = await this.getVisibleAllocationInputValues();
        if (inputValues.length > 0) {
            const total = inputValues.reduce((sum, value) => sum + value, 0);
            return `${total}%`;
        }

        const summary = this.page.locator(this.sel.totalAllocationSummary).last();
        await summary.waitFor({ state: 'visible', timeout: 10000 });
        const summaryText = await summary.innerText();
        const values = Array.from(summaryText.matchAll(/(\d+(?:\.\d+)?)%/g), match => Number(match[1]));
        const total = values.reduce((sum, value) => sum + value, 0);
        return `${total}%`;
    }

    private async getVisibleAllocationInputValues(): Promise<number[]> {
        const inputs = this.page.locator(this.sel.variantAInput);
        const count = await inputs.count();
        const values: number[] = [];

        for (let i = 0; i < count; i++) {
            const input = inputs.nth(i);
            const visible = await input.isVisible().catch(() => false);
            if (!visible) continue;

            const rawValue = await input.inputValue().catch(() => '');
            const parsedValue = Number(rawValue.replace('%', '').trim());
            if (!Number.isNaN(parsedValue)) values.push(parsedValue);
        }

        return values;
    }

    async clickAddCriteria() {
        await this.click(this.sel.addCriteriaBtn);
        await this.pause(1000);
    }

    async clickAddCriteriaForVariantA() {
        await this.click(this.sel.addCriteriaBtnVariantA);
        await this.pause(1000);
    }

    async selectCustomerPropertyCriteria() {
        await this.click(this.sel.addCriteriaCustomerProperties);
        await this.pause(1000);
        await this.click(this.sel.criteriaCustomerPropertyBtn);
        await this.pause(500);
    }

    async setCriteriaConditionAndValue() {
        await this.click(this.sel.criteriaUserIdInput);
        await this.pause(500);
        await this.click(this.sel.criteriaConditionBtn);
        await this.pause(500);
        await this.click(this.sel.criteriaIsOneOfBtn);
        await this.pause(500);
        await this.click(this.sel.criteriaValuesBtn);
        await this.pause(1000);
        const searchField = this.page.locator(this.sel.criteriaSearchField).first();
        if (await searchField.isVisible({ timeout: 5000 }).catch(() => false)) {
            await searchField.fill('test');
            await this.page.keyboard.press('Enter').catch(() => {});
            await this.pause(500);
        }
        const addValuesBtn = this.page.locator(this.sel.criteriaAddValuesBtn).first();
        if (await addValuesBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await addValuesBtn.click();
            await this.pause(500);
        }
    }

    async selectDefaultVariantB() {
        const radio = this.page.locator(this.sel.defaultVariantRadioB).first();
        await radio.waitFor({ state: 'visible', timeout: 10000 });
        await radio.click();
        await this.pause(500);
    }

    async isCriteriaSummaryVisible(): Promise<boolean> {
        const criteriaSummary = this.page.locator(this.sel.criteriaSummary).first();
        const genericSummary = this.page.locator(this.sel.contentSummary).last();
        const criteriaVisible = await criteriaSummary.isVisible({ timeout: 10000 }).catch(() => false);
        if (criteriaVisible) return true;
        return genericSummary.isVisible({ timeout: 5000 }).catch(() => false);
    }

    // ─── Publish ─────────────────────────────────────────────────────────────

    async isPublishButtonVisible(): Promise<boolean> {
        return this.isVisible(this.sel.publishBtn, 15000);
    }

    async clickPublish() {
        await this.click(this.sel.publishBtn);
    }

    async confirmPublish() {
        await this.click(this.sel.publishConfirm);
        await this.pause(3000);
    }

    async saveDraft() {
        await this.click(this.sel.saveDraftBtn);
        await this.pause(1000);

        // If a confirmation modal appears, confirm it
        const confirmBtn = this.page.locator(this.sel.saveDraftConfirm).first();
        const confirmVisible = await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false);
        if (confirmVisible) {
            await confirmBtn.click().catch(() => {});
            await this.pause(1000);
        }

        // Wait for any HeadlessUI modal to fully close before returning
        const modal = this.page.locator(this.sel.headlessModal).first();
        await modal.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
        await this.pause(1000);
    }

    // ─── Search ──────────────────────────────────────────────────────────────

    async searchCampaign(name: string) {
        const searchIconVisible = await this.isVisible(this.sel.searchIcon, 5000);
        if (searchIconVisible) {
            await this.click(this.sel.searchIcon);
        }
        await this.fill(this.sel.searchBar, name);
        await this.page.keyboard.press('Enter').catch(() => {});
        await this.pause(2000);
    }

    async clearSearch() {
        const searchField = this.page.locator(this.sel.searchBar).first();
        await searchField.click();
        await searchField.fill('');
        await this.page.keyboard.press('Enter').catch(() => {});
        await this.pause(2000);
    }

    async verifyCampaignVisible(name: string, timeout = 30000) {
        await this.page.getByText(name, { exact: false }).first()
            .waitFor({ state: 'attached', timeout });
    }

    async isCampaignVisible(name: string, timeout = 5000): Promise<boolean> {
        return this.page.getByText(name, { exact: false }).first()
            .isVisible({ timeout }).catch(() => false);
    }

    async getCampaignListTexts(): Promise<string[]> {
        const rows = this.page.locator("//tr[contains(@class,'campaign')] | //div[contains(@class,'campaign-card')]");
        const count = await rows.count();
        const texts: string[] = [];
        for (let i = 0; i < count; i++) {
            const text = await rows.nth(i).innerText().catch(() => '');
            if (text.trim()) texts.push(text.trim());
        }
        return texts;
    }

    // ─── Three-dot menu / Actions ────────────────────────────────────────────

    async clickThreeDotMenu() {
        await this.click(this.sel.dropdownIcon);
        await this.pause(500);
    }

    async clickEditSettings() {
        await this.click(this.sel.dropdownEditSettings);
        await this.pause(2000);
    }

    async clickDuplicateOption() {
        await this.click(this.sel.duplicateOption);
        await this.pause(1000);
    }

    async enterDuplicateCampaignName(name: string) {
        await this.waitForVisible(this.sel.duplicateModalNameInput, 15000);
        await this.fill(this.sel.duplicateModalNameInput, name);
        await this.pause(300);
    }

    async clickDeleteOption() {
        await this.click(this.sel.deleteOption);
        await this.pause(500);
    }

    async clickDuplicateConfirm() {
        await this.click(this.sel.duplicateConfirm);
        await this.pause(2000);
    }

    async clickDeleteConfirm(campaignName?: string) {
        // The delete modal requires typing the campaign name to enable the Delete button
        const confirmInput = this.page.locator(this.sel.deleteConfirmInput).first();
        await confirmInput.waitFor({ state: 'visible', timeout: 10000 });
        
        if (!campaignName) {
            throw new Error('[Delete Confirm] No campaign name provided — cannot confirm deletion.');
        }

        await confirmInput.click();
        await confirmInput.fill(campaignName);
        console.log(`[Delete Confirm] Typed campaign name: ${campaignName}`);
        await this.pause(500);

        // Wait for button to naturally enable after typing the correct name
        const btn = this.page.locator(this.sel.deleteConfirm).first();
        await btn.waitFor({ state: 'visible', timeout: 10000 });
        await btn.click(); // NO force — button must be enabled by the app after typing

        // Wait for headlessui portal to fully close before next step
        await this.page.waitForFunction(
            () => {
                const portal = document.querySelector('#headlessui-portal-root');
                return !portal || portal.children.length === 0;
            },
            { timeout: 10000 }
        ).catch(() => {});
        await this.pause(500);
    }

    async isSuccessToastVisible(): Promise<boolean> {
        return this.isVisible(this.sel.successToast, 10000);
    }

    // ─── Pagination ──────────────────────────────────────────────────────────

    async clickNextPage() {
        await this.click(this.sel.nextPageBtn);
        await this.pause(2000);
    }

    async clickPreviousPage() {
        await this.click(this.sel.prevPageBtn);
        await this.pause(2000);
    }

    async hasMultiplePages(): Promise<boolean> {
        const nextBtn = this.page.locator(this.sel.nextPageBtn).first();
        const visible = await nextBtn.isVisible({ timeout: 5000 }).catch(() => false);
        if (!visible) return false;
        return !(await nextBtn.isDisabled());
    }

    // ─── Filter ──────────────────────────────────────────────────────────────

    async clickFilterBtn() {
        await this.click(this.sel.filterBtn);
        await this.pause(1000);
    }

    async clickClearFilter() {
        const btn = this.page.locator(this.sel.clearFilterBtn).first();
        if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await btn.click();
        } else {
            const clearText = this.page.locator("//button[contains(normalize-space(),'Clear all') or contains(normalize-space(),'Clear Filter')]").first();
            if (await clearText.isVisible({ timeout: 3000 }).catch(() => false)) {
                await clearText.click();
            }
        }
        await this.pause(1000);
    }

    // ─── History Log ─────────────────────────────────────────────────────────

    async clickHistoryLog() {
        await this.click(this.sel.historyLogBtn);
        await this.pause(2000);
    }

    async isHistoryLogVisible(): Promise<boolean> {
        return this.isVisible(this.sel.historyLogEntry, 10000);
    }

    async getHistoryLogEntryCount(): Promise<number> {
        const entries = this.page.locator(this.sel.historyLogEntry);
        return entries.count();
    }

    // ─── Report ──────────────────────────────────────────────────────────────

    async clickViewReport() {
        await this.click(this.sel.viewReportBtn);
        await this.pause(3000);
    }

    async clickPerformanceReportSummaryTab() {
        await this.click(this.sel.reportSummaryTab);
        await this.pause(1500);
    }

    async isReportPageVisible(): Promise<boolean> {
        return this.isVisible(this.sel.reportPage, 15000);
    }
}
