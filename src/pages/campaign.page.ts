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
        editTitle:       "//h2[@title]",

        // Goal
        goalClick:       "//div[@data-testid='campaign-goal-Engagement-Click-undefined']",
        goalOpen:        "//div[@data-testid='campaign-goal-Engagement-Open-undefined']",
        setGoalBtn:      "//button[@data-testid='campaign-stepper-set-goal-button']",
        editGoal:        "//span[text()='Edit goal']",
        financialTab:    "//button[@data-test-id='campaign-tab-financial')]",
        goalFinancial:   "//div[contains(@data-testid,'campaign-goal-Financial-Deposit-Click')]",
        goalSummary:     "//button[@data-testid,'campaign-goal-preview-click')]",

        // Audience
        newAudienceTab:       "//button[@data-test-id='campaign-tab-new-audience']",
        existingAudienceTab:  "//button[@data-test-id='campaign-tab-existing-audience']",
        selectExistingBtn:    "//button[text()='Select existing audience']",
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
        eventBasedOption:  "//button[@data-testid='campaign-tab-event-trigger']",
        systemEventOption: "//button[@data-testid='campaign-tab-systemevent']",
        eventList:         "//div[contains(@data-testid,'trigger-event-list') or contains(@class,'event-list')]",
        loginEvent:        "//*[@data-testid='trigger-event-login' or contains(normalize-space(),'Login')]",
        applyTriggerBtn:   "//button[@data-testid='trigger-apply-btn' or contains(normalize-space(),'Apply')]",
        triggerValidationError: "//*[contains(@class,'bg-warning') or contains(@class,'error') or contains(@class,'text-red')][string-length(normalize-space()) > 0]",
        editTriggerBtn:    "//button[contains(@data-testid,'edit-trigger') or (contains(@class,'edit') and ancestor::*[contains(@class,'trigger')])]",
        reenrollToggle:    "//button[contains(@data-testid,'reenroll-toggle') or contains(@aria-label,'Re-enroll')]",
        reenrollDaysInput: "//input[contains(@data-testid,'reenroll-days') or contains(@placeholder,'days')]",
  
        // Communication
        chooseContentBtn:     "//button[@data-testid='campaign-choose-content-btn']",
        setCommunicationBtn:  "//button[@data-testid='campaign-stepper-set-communication-button']",
        contentSummary:       "//*[contains(@data-testid,'communication-summary') or contains(@class,'communication-summary')]",
        addVariantBtn:        "//button[contains(@data-testid,'add-variant') or contains(normalize-space(),'Add Variant')]",
        chooseContentVariant: "//button[contains(@data-testid,'choose-content-variant') or contains(@data-testid,'campaign-choose-content-btn')]",
        variantA:             "//*[contains(@data-testid,'variant-a') or contains(normalize-space(),'Variant A')]",
        variantB:             "//*[contains(@data-testid,'variant-b') or contains(normalize-space(),'Variant B')]",
        staticAllocation:     "//button[contains(@data-testid,'allocation-static') or contains(normalize-space(),'Static')]",
        criteriaAllocation:   "//button[contains(@data-testid,'allocation-criteria') or contains(normalize-space(),'Criteria')]",
        variantAInput:        "//input[contains(@data-testid,'variant-a-percentage')]",
        variantBInput:        "//input[contains(@data-testid,'variant-b-percentage')]",
        totalAllocation:      "//*[contains(@data-testid,'total-allocation')]",
        addCriteriaBtn:       "//button[contains(@data-testid,'add-criteria') or contains(normalize-space(),'Add Criteria')]",

        // Publish / Draft
        publishBtn:        "//button[@data-testid='campaign-publish-button']",
        publishConfirm:    "//button[@data-testid='modal-submit-button']",
        saveDraftBtn:      "//button[@data-testid='campaign-save-draft-button']",
        saveDraftConfirm:  "//button[@data-testid='modal-submit-button']",
        headlessModal:     "//*[@id='headlessui-portal-root']//form",

        // Search
        searchBar:  "//input[@id='campaign-listView-table-search-icon']",

        // Campaign Details / Edit Name
        campaignDetailsTitle: "//h1[contains(@data-testid,'campaign-detail-title') or contains(@class,'campaign-title')] | //h2[@title]",
        editNameBtn:          "//button[contains(@data-testid,'edit-name') or contains(@aria-label,'Edit name') or contains(normalize-space(),'Edit name')]",
        nameEditInput:        "//input[@data-testid='campaign-name-input' or contains(@data-testid,'edit-name-input')]",
        saveNameBtn:          "//button[contains(@data-testid,'save-name') or contains(normalize-space(),'Save')]",
        backToListBtn:        "//button[contains(@data-testid,'back-to-list') or contains(@aria-label,'Back')] | //a[contains(@href,'/campaign')]",

        // Campaign row / list
        campaignRow:          "//tr[contains(@class,'campaign-row')] | //div[contains(@class,'campaign-card')]",
        dropdownIcon:         "//button[@data-testid='campaign-list-view-table-dropdown-icon']",
        dropdownEditSettings: "//button[@data-testid='campaign-list-view-table-dropdown-icon-edit-settings']",
        threeDotMenu:         "//button[contains(@data-testid,'campaign-action-menu') or contains(@aria-label,'Actions') or contains(@class,'action-menu')]",
        duplicateOption:  "//button[contains(normalize-space(),'Duplicate')] | //li[contains(normalize-space(),'Duplicate')]",
        deleteOption:     "//button[contains(normalize-space(),'Delete')] | //li[contains(normalize-space(),'Delete')]",
        duplicateConfirm: "//button[@data-testid='modal-submit-button' or contains(normalize-space(),'Confirm')]",
        deleteConfirm:    "//button[@data-testid='modal-submit-button' or contains(normalize-space(),'Confirm') or contains(normalize-space(),'Delete')]",
        successToast:     "//*[contains(@class,'toast') or contains(@class,'notification') or contains(@class,'Toastify')][string-length(normalize-space()) > 0]",

        // Pagination
        nextPageBtn:     "//button[@data-testid='campaign-pagination-next-btn']",
        prevPageBtn:     "//button[@data-testid='campaign-pagination-previous-btn']",

        // Filter
        filterBtn:       "//button[@data-testid='campaign-listView-table-filter-icon']",
        clearFilterBtn:  "//button[@data-testid='campaign-filters-reset-button']",

        // History Log
        historyLogBtn:   "//button[contains(@data-testid,'history-log') or contains(normalize-space(),'History')] | //tab[contains(normalize-space(),'History')]",
        historyLogEntry: "//div[contains(@data-testid,'history-entry') or contains(@class,'history-log-entry') or contains(@class,'activity')]",

        // Report
        viewReportBtn:   "//button[contains(@data-testid,'view-report') or contains(normalize-space(),'View Report')]",
        reportPage:      "//*[contains(@data-testid,'campaign-report') or contains(@class,'report')]",
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
            await this.page.keyboard.press('Enter').catch(() => {});
        }
    }

    async clickCreateCampaign() {
        await this.click(this.sel.createBtn);
        await this.waitForNetworkIdle();
    }

    async waitForEditPage(timeout = 30000) {
        await this.waitForVisible(this.sel.editTitle, timeout);
    }

    async getEditTitle(timeout = 30000): Promise<string> {
        await this.waitForVisible(this.sel.editTitle, timeout);
        return this.page.locator(this.sel.editTitle).first().innerText();
    }

    // ─── Campaign Details / Edit Name ────────────────────────────────────────

    async clickCampaignFromList(name: string) {
        const row = this.page.locator(`//*[contains(normalize-space(),'${name}')]`).first();
        await row.waitFor({ state: 'visible', timeout: 15000 });
        await row.click();
        await this.pause(2000);
    }

    async enterCampaignEditPage(name: string) {
        const row = this.page.locator(`//*[contains(normalize-space(),'${name}')]`).first();
        await row.waitFor({ state: 'visible', timeout: 15000 });
        await row.hover();
        await this.click(this.sel.dropdownIcon);
        await this.pause(500);
        await this.click(this.sel.dropdownEditSettings);
        await this.pause(2000);
    }

    async waitForDetailsPage(timeout = 20000) {
        await this.waitForVisible(this.sel.campaignDetailsTitle, timeout);
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
        await this.click(this.sel.saveNameBtn);
        await this.pause(1000);
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

    async clickFinancialGoal() {
        await this.click(this.sel.goalFinancial);
    }

    async clickSetGoal() {
        await this.click(this.sel.setGoalBtn);
        await this.pause(1000);
    }

    async verifyGoalIsSet() {
        await this.waitForVisible(this.sel.editGoal);
    }

    async getGoalSummaryText(): Promise<string> {
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
        return this.isVisible(this.sel.audienceSummary, 10000);
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
        return this.isVisible(this.sel.triggerSummary, 10000);
    }

    async clickEventBasedOption() {
        await this.click(this.sel.eventBasedOption);
        await this.pause(1000);
    }

    async clickSystemEventOption() {
        await this.click(this.sel.systemEventOption);
        await this.pause(1000);
    }

    async selectLoginEvent() {
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
        return this.isVisible(this.sel.contentSummary, 10000);
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

    async selectStaticAllocation() {
        await this.click(this.sel.staticAllocation);
        await this.pause(500);
    }

    async selectCriteriaAllocation() {
        await this.click(this.sel.criteriaAllocation);
        await this.pause(500);
    }

    async setVariantAPercentage(value: string) {
        const input = this.page.locator(this.sel.variantAInput).first();
        await input.waitFor({ state: 'visible', timeout: 10000 });
        await input.fill(value);
    }

    async setVariantBPercentage(value: string) {
        const input = this.page.locator(this.sel.variantBInput).first();
        await input.waitFor({ state: 'visible', timeout: 10000 });
        await input.fill(value);
    }

    async getTotalAllocationText(): Promise<string> {
        return this.getText(this.sel.totalAllocation);
    }

    async clickAddCriteria() {
        await this.click(this.sel.addCriteriaBtn);
        await this.pause(1000);
    }

    // ─── Publish ─────────────────────────────────────────────────────────────

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
        await this.click(this.sel.searchBar);
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

    async clickDuplicateOption() {
        await this.click(this.sel.duplicateOption);
        await this.pause(1000);
    }

    async clickDeleteOption() {
        await this.click(this.sel.deleteOption);
        await this.pause(500);
    }

    async clickDuplicateConfirm() {
        await this.click(this.sel.duplicateConfirm);
        await this.pause(2000);
    }

    async clickDeleteConfirm() {
        await this.click(this.sel.deleteConfirm);
        await this.pause(2000);
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
        await this.click(this.sel.clearFilterBtn);
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

    async isReportPageVisible(): Promise<boolean> {
        return this.isVisible(this.sel.reportPage, 15000);
    }
}
