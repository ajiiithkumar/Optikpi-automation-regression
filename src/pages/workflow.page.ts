import { BasePage } from './base.page';

/**
 * WorkflowPage — encapsulates all Workflow module selectors and actions.
 */
export class WorkflowPage extends BasePage {

    private readonly sel = {
        // Tabs
        activeTab:   "//button[@data-test-id='workflow-tab-active']",
        inactiveTab: "//button[@data-test-id='workflow-tab-inactive']",
        draftTab:    "//button[@data-test-id='workflow-tab-draft']",
        allTab:      "//button[@data-test-id='workflow-tab-all']",

        // Creation
        createNewBtn:       "//a[@data-testid='setup-new-workflow-btn']",
        createFromScratch:  "//div[@data-testid='workflow-create-card-scratch-btn']",
        nameInput:          "//input[@data-testid='workflow-name-input']",
        tagInput:           "//input[@data-testid='workflow-tag-input']",
        createBtn:          "//button[@data-testid='create-workflow-button']",
        editTitle:          "//h2[@title]",

        // Enrollment
        setupEnrollment:       "//button[@data-testid='node-setup-btn']",
        newAudienceBtn:        "//button[@data-testid='newAudience']",
        existingAudienceBtn:   "//button[@data-testid='existingAudience']",
        liveEventBtn:          "//button[@data-testid='liveEvent']",
        newAudienceCriteria:   "//button[@data-testid='Criteria']",
        audiencePreview:       "//button[@data-testid='audience-refresh-button']",
        addToEnrollmentBtn:    "//button[@data-testid='workflow-add-criteria-btn']",
        dashboardBackBtn:      "//button[@data-testid='dashboard-back-button']",
        existingAudienceDropdown:     "//button[@data-testid='workflow-existing-audience-dropdown']",
        existingAudiencePartOfBtn:    "//button[@data-testid='workflow-existing-audience-dropdown-part-of-an-audience']",
        existingAudienceOkBtn:        "//button[@data-testid='flyout-confirm-btn']",
        existingAudienceSearch:       "//input[@name='search-input-box']",

        // Node controls
        nodeApplyBtn:       "//button[@data-testid='workflow-node-apply-button']",
        cancelBtn:          "//button[@data-testid='close-node-flyout-btn']",
        addNodeDropdown:    "//button[@data-testid='add-node-dropdown']",
        addActionNode:      "//button[@data-testid='add-node-dropdown-add-action']",
        addDelayNode:       "//button[@data-testid='add-node-dropdown-add-delay']",
        addExitNode:        "//button[@data-testid='add-node-dropdown-exit-flow']",
       selectLiveEventOption:   "//button[@title='Add event']",
        liveEventOption:    "//button[@data-testid='liveEvent']",
        
        loginEventOption:   "//*[@data-testid='login']",
        librarySearch:      "//input[@data-testid='library-search-input' or @placeholder='Search']",
        libraryUseContent:  "//button[@data-testid='library-use-this-content-btn' or contains(normalize-space(),'Use this content')]",
        actionAddContent:   "//button[@data-testid='workflow-actions-communication-add-content-btn']",
        exitMarkAsGoal:     "//button[@role='switch']",
        nodeEditBtn:        "//button[@data-testid='node-operations-dropdown-edit']",
        headerThreeDotBtn:  "//button[@data-testid='workflow-header-operations-dropdown']",
        headerEditBtn:      "//button[@data-testid='workflow-operations-dropdown-edit']",

        // Publish & Draft
        saveDraftBtn:        "//button[@data-testid='workflow-save-draft-button']",
        saveDraftConfirm:    "//button[@data-testid='modal-submit-button']",
        publishBtn:          "//button[@data-testid='workflow-publish-button']",
        publishConfirm:      "//button[@data-testid='modal-submit-button']",

        // Panel
        zoomOutBtn:  "//button[@title='Zoom out']",

        // Dates
        startDate: "(//span[contains(@class,'text-primary') and contains(@class,'text-base') and contains(text(),'/')])[1]",
        endDate:   "(//span[contains(@class,'text-primary') and contains(@class,'text-base') and contains(text(),'/')])[2]",

        // Filter & Search
        filterBtn:       "//button[text()='Filters']",
        filterActive:    "//input[@id='active']",
        filterApplyBtn:  "//button[@data-testid='workflow-filters-apply-button']",
        filterSearch:    "//input[@name='search-input-box']",
    };

    // ─── Tabs ────────────────────────────────────────────────────────────────

    async clickActiveTab()   { await this.click(this.sel.activeTab); }
    async clickInactiveTab() { await this.click(this.sel.inactiveTab); }
    async clickDraftTab()    { await this.click(this.sel.draftTab); }
    async clickAllTab()      { await this.click(this.sel.allTab); }

    // ─── Creation ────────────────────────────────────────────────────────────

    async clickCreateNew()        { await this.click(this.sel.createNewBtn); }
    async clickCreateFromScratch() { await this.click(this.sel.createFromScratch); }

    async enterWorkflowName(name: string) {
        await this.fill(this.sel.nameInput, name);
    }

    async enterWorkflowTag(tag: string) {
        const visible = await this.isVisible(this.sel.tagInput);
        if (visible) {
            await this.fill(this.sel.tagInput, tag);
            await this.page.keyboard.press('Enter').catch(() => {});
        }
    }

    async clickCreateWorkflow() {
        const btn = this.page.locator(this.sel.createBtn).first();
        await btn.waitFor({ state: 'visible', timeout: 20000 });
        await Promise.allSettled([
            this.page.waitForLoadState('networkidle').catch(() => {}),
            btn.click(),
        ]);
    }

    async waitForEditPage(timeout = 30000) {
        await this.waitForVisible(this.sel.editTitle, timeout);
    }

    // ─── Panel ───────────────────────────────────────────────────────────────

    async zoomOut(times = 3) {
        const btn = this.page.locator(this.sel.zoomOutBtn).first();
        await btn.waitFor({ state: 'visible', timeout: 10000 });
        for (let i = 0; i < times; i++) {
            await btn.click();
            await this.pause(500);
        }
    }

    /** Pan the react-flow canvas upward to reveal nodes below the fold. */
    async panCanvasUp(pixels = 400) {
        const pane = this.page.locator('.react-flow__pane').first();
        const paneBox = await pane.boundingBox();
        if (paneBox) {
            const cx = paneBox.x + paneBox.width / 2;
            const cy = paneBox.y + paneBox.height / 2;
            await this.page.mouse.move(cx, cy);
            await this.page.mouse.down();
            await this.page.mouse.move(cx, cy - pixels, { steps: 20 });
            await this.page.mouse.up();
            await this.pause(1000);
        }
    }

    // ─── Enrollment ──────────────────────────────────────────────────────────

    async clickSetupEnrollment()  { await this.click(this.sel.setupEnrollment); }
    async clickNewAudience()      { await this.click(this.sel.newAudienceBtn); }
    async clickExistingAudience() { await this.click(this.sel.existingAudienceBtn); }

    async clickExistingAudienceDropdown(): Promise<void> {
        await this.click(this.sel.existingAudienceDropdown);
        await this.pause(1000);
    }

    async clickPartOfAudienceOption(): Promise<void> {
        await this.click(this.sel.existingAudiencePartOfBtn);
        await this.pause(1000);
    }

    async selectExistingAudienceByTitle(title: string): Promise<void> {
        const searchInput = this.page.locator(this.sel.existingAudienceSearch).first();
        await searchInput.waitFor({ state: 'visible', timeout: 20000 });
        await searchInput.fill(title);
        await this.page.keyboard.press('Enter');
        await this.pause(1500);

        // Prefer input[@id=title] (same pattern as audience.page.ts), fall back to input[@title=title]
        const checkbox = this.page.locator(`//label[text()='${title}']`).first();
        const usedCheckbox = await checkbox.isVisible({ timeout: 5000 }).catch(() => false);
        if (usedCheckbox) {
            await checkbox.click();
        } else {
            const option = this.page.locator(`//label[text()='${title}']`).first();
            await option.waitFor({ state: 'visible', timeout: 20000 });
            await option.click();
        }
        await this.pause(500);
    }

    async clickEnrollmentOk(): Promise<void> {
        await this.click(this.sel.existingAudienceOkBtn);
        await this.pause(1000);
    }

    async clickNewAudienceCriteria() { await this.click(this.sel.newAudienceCriteria); }
    async clickAddToEnrollment()     { await this.click(this.sel.addToEnrollmentBtn); }
    async clickDashboardBack()       { await this.click(this.sel.dashboardBackBtn); await this.pause(2000); }

    async clickAudiencePreview() {
        await this.click(this.sel.audiencePreview);
        await this.pause(20000); // Long wait for preview calculation
    }

    async getReachableCustomerCount(): Promise<number> {
        const locator = this.page.locator(
            "//div[preceding-sibling::div[normalize-space()='Total reachable customers']]//div[contains(@class,'text-4xl')]"
        ).first();
        await locator.waitFor({ state: 'visible', timeout: 15000 });
        const text = await locator.innerText().catch(() => '0');
        return parseInt(text.trim(), 10);
    }

    // ─── Node Actions ────────────────────────────────────────────────────────

    async clickNodeApply() {
        const btn = this.page.locator(this.sel.nodeApplyBtn).first();
        await btn.waitFor({ state: 'visible', timeout: 20000 });
        await Promise.allSettled([
            this.page.waitForLoadState('networkidle').catch(() => {}),
            btn.click(),
        ]);
        await this.pause(2000);
    }

    async clickAddNodeDropdown(nodeIndex: string) {
        const btn = this.page.locator(`(${this.sel.addNodeDropdown})[${nodeIndex}]`);

        // Pan canvas for nodes beyond the first
        if (parseInt(nodeIndex, 10) > 1) {
            await this.panCanvasUp();
        }

        await btn.scrollIntoViewIfNeeded().catch(() => {});
        await btn.waitFor({ state: 'visible', timeout: 20000 });
        await btn.hover();
        await this.pause(1000);
        await btn.click({ force: true });
    }

    async clickActionNode(): Promise<void> {
        await this.click(this.sel.addActionNode);
        await this.pause(2000);
    }

    async clickDelayNode(): Promise<void> {
        await this.click(this.sel.addDelayNode);
        await this.pause(2000);
    }

    async clickLiveEventOption(): Promise<void> {
        await this.click(this.sel.liveEventOption);
        await this.pause(1000);
    }

    async clickLoginLiveEvent(): Promise<void> {
        await this.click(this.sel.selectLiveEventOption);
        await this.click(this.sel.loginEventOption);
        await this.pause(1000);
    }

    async clickExitNode(): Promise<void> {
        await this.click(this.sel.addExitNode);
        await this.pause(2000);
    }

    async clickAddContent()   { await this.click(this.sel.actionAddContent); }

    async searchCommunication(name: string): Promise<void> {
        const searchInput = this.page.locator(this.sel.librarySearch).first();
        await searchInput.waitFor({ state: 'visible', timeout: 20000 });
        await searchInput.click();
        await searchInput.fill(name);
        await this.pause(2000);
        await this.page.keyboard.press('Enter');
    }

    async clickFirstCommunication(name: string): Promise<void> {
        const card = this.page.locator(`//div[@data-testid='${name}']`).first();
        await card.waitFor({ state: 'visible', timeout: 10000 });
        await this.pause(2000);
        await card.hover({ force: true });
        await this.pause(500);
        const useBtn = this.page.locator(this.sel.libraryUseContent).first();
        await useBtn.waitFor({ state: 'visible', timeout: 10000 });
        await useBtn.click();
        await this.pause(2000);
    }
    async clickCancel()       { await this.click(this.sel.cancelBtn); await this.pause(1000); }

    async clickNodeEdit(nodeIndex: string) {
        const nodeSelector = `(//button[@data-testid='node-operations-dropdown'])[${nodeIndex}]`;
        await this.click(nodeSelector);
        await this.click(this.sel.nodeEditBtn);
        await this.pause(2000);
    }

    async clickHeaderThreeDotMenu(): Promise<void> {
        await this.click(this.sel.headerThreeDotBtn);
        await this.pause(1000);
    }

    async clickHeaderEditWorkflow(): Promise<void> {
        await this.click(this.sel.headerEditBtn);
        await this.pause(2000);
    }

    async clickExitMarkAsGoal(): Promise<string | null> {
        await this.click(this.sel.exitMarkAsGoal);
        await this.pause(1000);
        return this.page.locator(this.sel.exitMarkAsGoal).first().getAttribute('aria-checked');
    }

    // ─── Save / Publish ──────────────────────────────────────────────────────

    async saveDraft() {
        await this.click(this.sel.saveDraftBtn);
    }

    async confirmSaveDraft() {
        const btn = this.page.locator(this.sel.saveDraftConfirm).first();
        await btn.waitFor({ state: 'visible', timeout: 20000 });
        await Promise.allSettled([
            this.page.waitForLoadState('networkidle').catch(() => {}),
            btn.click(),
        ]);
        await this.pause(2000);
    }

    async clickPublish() {
        await this.click(this.sel.publishBtn);
    }

    async confirmPublish() {
        const btn = this.page.locator(this.sel.publishConfirm).first();
        await btn.waitFor({ state: 'visible', timeout: 20000 });
        await Promise.allSettled([
            this.page.waitForLoadState('networkidle').catch(() => {}),
            btn.click(),
        ]);
        await this.pause(2000);
    }

    // ─── Error Handling ──────────────────────────────────────────────────────

    async checkAndCloseErrorPopup(): Promise<{ found: boolean; message: string }> {
        await this.pause(2000);
        const overlay = this.page.locator("//div[contains(@class,'fixed') and contains(@class,'inset-0') and contains(@class,'z-10')]").first();
        const isVisible = await overlay.isVisible().catch(() => false);

        if (!isVisible) return { found: false, message: '' };

        const errorText = await overlay.innerText().catch(() => 'Unknown error');
        const closeBtn = this.page.locator("//*[contains(@class,'top-4') and @role='button']").first();

        if (await closeBtn.isVisible().catch(() => false)) {
            await closeBtn.click({ force: true });
            await this.pause(1000);
        }

        if (await overlay.isVisible().catch(() => false)) {
            await this.page.keyboard.press('Escape');
            await this.pause(1000);
        }

        await overlay.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
        return { found: true, message: errorText.replace(/\n/g, ' ').trim() };
    }

    // ─── Dates ───────────────────────────────────────────────────────────────

    async clickStartDate() { await this.click(this.sel.startDate); await this.pause(1000); }
    async clickEndDate()   { await this.click(this.sel.endDate); await this.pause(1000); }

    // ─── Filter & Search ─────────────────────────────────────────────────────

    async clickFilterBtn()     { await this.click(this.sel.filterBtn); await this.pause(1000); }
    async clickFilterActive()  { await this.click(this.sel.filterActive); }
    async clickFilterApply()   { await this.click(this.sel.filterApplyBtn); await this.pause(2000); }

    async searchWorkflow(name: string) {
        await this.fill(this.sel.filterSearch, name);
        await this.pause(2000);
    }

    async verifyWorkflowInList(name: string): Promise<boolean> {
        const row = this.page.locator(`//tr[.//span[normalize-space()='${name}']]`).first();
        return row.isVisible().catch(() => false);
    }
}
