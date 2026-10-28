import { BasePage } from './base.page';

/**
 * WorkflowPage â€” encapsulates all Workflow module selectors and actions.
 */
export class WorkflowPage extends BasePage {

    private readonly sel = {
        // Tabs
        activeTab:   "//button[@data-test-id='workflow-tab-active']",
        inactiveTab: "//button[@data-test-id='workflow-tab-inactive']",
        draftTab:    "//button[@data-test-id='workflow-tab-draft']",
        allTab:      "//button[@data-test-id='workflow-tab-all']",

        // Creation
        createNewBtn:       "//a[@data-testid='setup-new-workflow-btn' or @data-test-id='setup-new-workflow-btn']",
        createFromScratch:  "//div[@data-testid='workflow-create-card-scratch-btn' or @data-test-id='workflow-create-card-scratch-btn'] | //*[normalize-space()='Create from scratch' and not(ancestor::li)]",
        nameInput:          "//input[@data-testid='workflow-name-input' or @data-test-id='workflow-name-input']",
        tagInput:           "//input[@data-testid='workflow-tag-input' or @data-test-id='workflow-tag-input']",
        createBtn:          "//button[@data-testid='create-workflow-button' or @data-test-id='create-workflow-button']",
        editTitle:          "//h2[contains(@class,'text-2xl')]",


        // Enrollment
        setupEnrollment:       "//button[@data-testid='node-setup-btn' or @data-test-id='node-setup-btn']",
        newAudienceBtn:        "//button[@data-testid='newAudience' or @data-test-id='newAudience']",
        existingAudienceBtn:   "//button[@data-testid='existingAudience' or @data-test-id='existingAudience']",
        liveEventBtn:          "//button[@data-testid='liveEvent' or @data-test-id='liveEvent']",
        newAudienceCriteria:   "//button[@data-testid='Criteria' or @data-test-id='Criteria']",
        audiencePreview:       "//button[@data-testid='audience-refresh-button' or @data-test-id='audience-refresh-button']",
        addToEnrollmentBtn:    "//button[@data-testid='workflow-add-criteria-btn' or @data-test-id='workflow-add-criteria-btn']",
        dashboardBackBtn:      "//button[@data-testid='dashboard-back-button' or @data-test-id='dashboard-back-button']",
        existingAudienceDropdown:     "//button[@data-testid='workflow-existing-audience-dropdown' or @data-test-id='workflow-existing-audience-dropdown']",
        existingAudiencePartOfBtn:    "//button[@data-testid='workflow-existing-audience-dropdown-part-of-an-audience' or @data-test-id='workflow-existing-audience-dropdown-part-of-an-audience']",
        existingAudienceOkBtn:        "//button[@data-testid='flyout-confirm-btn' or @data-test-id='flyout-confirm-btn']",
        existingAudienceSearch:       "//input[@name='search-input-box']",

        // Node controls
        nodeApplyBtn:       "//*[@data-testid='workflow-node-apply-button' or @data-test-id='workflow-node-apply-button']",
        cancelBtn:          "//*[@data-testid='close-node-flyout-btn' or @data-test-id='close-node-flyout-btn']",
        addNodeDropdown:    "//*[@id='workflow-add-node-btn' or @data-testid='add-node-dropdown' or @data-test-id='add-node-dropdown']",
        addActionNode:      "//*[@data-testid='add-node-dropdown-add-action' or @data-test-id='add-node-dropdown-add-action'] | //*[@role='menuitem' and contains(.,'Action')] | //button[normalize-space()='Action' or contains(normalize-space(),'Action')]",
        addDelayNode:       "//*[@data-testid='add-node-dropdown-add-delay' or @data-test-id='add-node-dropdown-add-delay'] | //*[@role='menuitem' and contains(.,'Delay')] | //button[normalize-space()='Delay' or contains(normalize-space(),'Delay')]",
        addExitNode:        "//*[@data-testid='add-node-dropdown-exit-flow' or @data-test-id='add-node-dropdown-exit-flow'] | //*[@role='menuitem' and (contains(.,'Exit') or contains(.,'End'))] | //button[contains(normalize-space(),'Exit')]",
        selectLiveEventOption:   "//*[@data-testid='workflow-node-flyout-body']//button[.//text()[contains(.,'simple event')] or .//span[contains(.,'simple event')]] | //button[contains(normalize-space(),'simple event')]",
        liveEventOption:    "//*[@id='delay-live-event'] | //button[@data-testid='liveEvent' or @data-test-id='liveEvent']",
        addLiveEventConfirmBtn: "//*[@data-testid='add-system-event-btn']",
        loginEventOption:   "//*[@data-testid='login' or @data-test-id='login']",
        librarySearch:      "//*[@data-testid='library-search-input']",
        libraryUseContent:  "//*[@data-testid='campaign-communication-list-hover'] | //*[@data-testid='library-use-this-content-btn' or contains(normalize-space(),'Use this content')]",
        actionAddContent:   "//*[@data-testid='workflow-actions-communication-add-content-btn' or @data-test-id='workflow-actions-communication-add-content-btn'] | //button[contains(normalize-space(),'Add content') or contains(.,'Add Content')]",
        exitMarkAsGoal:     "//button[@role='switch']",
        nodeEditBtn:        "//*[@data-testid='node-edit-btn' or @data-testid='node-operations-dropdown-edit']",
        headerThreeDotBtn:  "//button[@data-testid='workflow-header-operations-dropdown' or @data-test-id='workflow-header-operations-dropdown']",
        headerEditBtn:      "//button[@data-testid='workflow-operations-dropdown-edit' or @data-test-id='workflow-operations-dropdown-edit']",

        // Publish & Draft
        saveDraftBtn:        "//button[@data-testid='workflow-save-draft-button' or @data-test-id='workflow-save-draft-button']",
        saveDraftConfirm:    "//button[@data-testid='modal-submit-button' or @data-test-id='modal-submit-button']",
        publishBtn:          "//button[@data-testid='workflow-publish-button' or @data-test-id='workflow-publish-button']",
        publishConfirm:      "//button[@data-testid='modal-submit-button' or @data-test-id='modal-submit-button']",

        // Panel
        zoomOutBtn:  "//button[@title='Zoom out']",

        // Dates
        startDate: "(//span[contains(@class,'text-primary') and contains(@class,'text-base') and contains(text(),'/')])[1]",
        endDate:   "(//span[contains(@class,'text-primary') and contains(@class,'text-base') and contains(text(),'/')])[2]",

        // Filter & Search
        filterBtn:       "//button[text()='Filters']",
        filterActive:    "//input[@id='active']",
        filterApplyBtn:  "//button[@data-testid='workflow-filters-apply-button' or @data-test-id='workflow-filters-apply-button']",
        filterSearch:    "//input[@name='search-input-box']",
    };

    // â”€â”€â”€ Tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    async clickActiveTab()   { await this.click(this.sel.activeTab); }
    async clickInactiveTab() { await this.click(this.sel.inactiveTab); }
    async clickDraftTab()    { await this.click(this.sel.draftTab); }
    async clickAllTab()      { await this.click(this.sel.allTab); }

    // â”€â”€â”€ Creation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    async clickCreateNew() {
        await this.click(this.sel.createNewBtn);
    }
    async clickCreateFromScratch() {
        await this.click(this.sel.createFromScratch);
    }

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

    // â”€â”€â”€ Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

    // â”€â”€â”€ Enrollment â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

    // â”€â”€â”€ Node Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    async clickNodeApply() {
        await this.pause(1000);

        // Clean up any empty event card in Delay flyout if present
        const emptyEventDeleteBtn = this.page.locator(
            "//*[@data-testid='workflow-node-flyout-body']//div[.//button[contains(.,'simple event')]]//button[@data-testid='criteria-delete-event-btn']"
        ).first();
        if (await emptyEventDeleteBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
            await emptyEventDeleteBtn.click();
            await this.pause(500);
        }

        const applyBtn = this.page.locator(
            "//button[@data-testid='workflow-node-apply-button' or @data-test-id='workflow-node-apply-button'] | " +
            "//div[contains(@class,'flyout') or contains(@class,'drawer') or @role='dialog']//button[normalize-space()='Apply' or normalize-space()='Save'] | " +
            "//button[normalize-space()='Apply' or normalize-space()='Save']"
        ).first();

        await applyBtn.waitFor({ state: 'visible', timeout: 15000 });
        for (let i = 0; i < 10; i++) {
            if (await applyBtn.isEnabled().catch(() => false)) break;
            await this.pause(500);
        }
        await applyBtn.click();
        await this.pause(2000);
    }

    async clickAddNodeDropdown(nodeIndex: string) {
        // Always fit view so all canvas nodes and connectors are visible and properly positioned
        const fitView = this.page.locator("//*[@data-testid='workflow-fit-view-btn']").first();
        if (await fitView.isVisible({ timeout: 2000 }).catch(() => false)) {
            await fitView.click().catch(() => {});
            await this.pause(800);
        } else if (parseInt(nodeIndex, 10) > 1) {
            await this.panCanvasUp();
            await this.pause(500);
        }

        // Find all add-node (+) connectors on the canvas
        const buttons = this.page.locator(this.sel.addNodeDropdown);
        const count = await buttons.count();

        let targetBtn = buttons.last();
        if (count > 1) {
            // Find the bottom-most connector on canvas (largest Y coordinate)
            // to ensure we click AFTER the delay/last node, NEVER in the middle between nodes
            let maxY = -1;
            for (let i = 0; i < count; i++) {
                const btn = buttons.nth(i);
                if (await btn.isVisible().catch(() => false)) {
                    const box = await btn.boundingBox().catch(() => null);
                    if (box && box.y > maxY) {
                        maxY = box.y;
                        targetBtn = btn;
                    }
                }
            }
        }

        await targetBtn.scrollIntoViewIfNeeded().catch(() => {});
        await targetBtn.waitFor({ state: 'visible', timeout: 15000 });
        await targetBtn.hover();
        await this.pause(500);
        await targetBtn.click({ force: true });
        await this.pause(1000);
    }

    async clickActionNode(): Promise<void> {
        const btn = this.page.locator(this.sel.addActionNode).first();
        await btn.waitFor({ state: 'visible', timeout: 10000 });
        await btn.click();
        await this.pause(2000);
    }

    async clickDelayNode(): Promise<void> {
        const btn = this.page.locator(this.sel.addDelayNode).first();
        await btn.waitFor({ state: 'visible', timeout: 10000 });
        await btn.click();
        await this.pause(2000);
    }

    async clickLiveEventOption(): Promise<void> {
        await this.pause(1000);

        // 1. Enable Live event toggle (#delay-live-event)
        const liveEventSwitch = this.page.locator("//*[@id='delay-live-event'] | //button[@data-testid='liveEvent']").first();
        if (await liveEventSwitch.isVisible({ timeout: 5000 }).catch(() => false)) {
            const isLiveChecked = (await liveEventSwitch.getAttribute('aria-checked').catch(() => null)) === 'true' ||
                                  (await liveEventSwitch.getAttribute('data-state').catch(() => null)) === 'checked';
            if (!isLiveChecked) {
                await liveEventSwitch.click();
                await this.pause(1000);
            }
        } else {
            const option = this.page.locator(this.sel.liveEventOption).first();
            await option.click().catch(() => {});
        }

        // 2. Disable "Amount of time" toggle (#delay-amount-of-time) so ONLY live event is enabled
        const amountOfTimeSwitch = this.page.locator("//*[@id='delay-amount-of-time']").first();
        if (await amountOfTimeSwitch.isVisible({ timeout: 3000 }).catch(() => false)) {
            const isTimeChecked = (await amountOfTimeSwitch.getAttribute('aria-checked').catch(() => null)) === 'true' ||
                                  (await amountOfTimeSwitch.getAttribute('data-state').catch(() => null)) === 'checked' ||
                                  (await amountOfTimeSwitch.getAttribute('class').catch(() => ''))?.includes('bg-brand') ||
                                  (await amountOfTimeSwitch.getAttribute('class').catch(() => ''))?.includes('bg-primary');
            // In OptiKPI V2, Amount of time is ON by default. If ON, click to disable it.
            if (isTimeChecked) {
                await amountOfTimeSwitch.click();
                await this.pause(1000);
            }
        }
        await this.pause(1000);
    }

    async clickLoginLiveEvent(): Promise<void> {
        await this.pause(1000);

        // 1. Click "+ simple event" (from Recorder)
        const eventTrigger = this.page.locator(this.sel.selectLiveEventOption).first();
        await eventTrigger.waitFor({ state: 'visible', timeout: 10000 });
        await eventTrigger.click();
        await this.pause(1000);

        // 2. Select Login radio ([data-testid='login'] from Recorder)
        const loginRadio = this.page.locator(this.sel.loginEventOption).first();
        await loginRadio.waitFor({ state: 'visible', timeout: 10000 });
        await loginRadio.click();
        await this.pause(1000);

        // Clean up any empty/extra event in the Delay flyout (do not add extra event)
        const emptyEventDeleteBtn = this.page.locator(
            "//*[@data-testid='workflow-node-flyout-body']//div[.//button[contains(.,'simple event')]]//button[@data-testid='criteria-delete-event-btn']"
        ).first();
        if (await emptyEventDeleteBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
            await emptyEventDeleteBtn.click();
            await this.pause(500);
        }
    }

    async clickExitNode(): Promise<void> {
        const btn = this.page.locator(this.sel.addExitNode).first();
        await btn.waitFor({ state: 'visible', timeout: 10000 });
        await btn.click();
        await this.pause(2000);
    }

    async clickAddContent(): Promise<void> {
        const btn = this.page.locator(this.sel.actionAddContent).first();
        if (await btn.isVisible({ timeout: 4000 }).catch(() => false)) {
            await btn.click();
            await this.pause(1000);
        }
    }

    async searchCommunication(name: string): Promise<void> {
        const searchInput = this.page.locator(this.sel.librarySearch).first();
        await searchInput.waitFor({ state: 'visible', timeout: 20000 });
        await searchInput.click();
        await searchInput.fill(name);
        await this.pause(2000);
        await this.page.keyboard.press('Enter');
    }

    async clickFirstCommunication(name: string): Promise<void> {
        let card = this.page.locator(
            `//div[contains(@class,'grid') or contains(@class,'flex-wrap') or contains(@class,'gap-')]//div[contains(@class,'border') and .//*[normalize-space()='${name}']] | ` +
            `//div[contains(@class,'border') and not(ancestor::header) and not(.//input) and .//*[normalize-space()='${name}']] | ` +
            `//div[contains(@class,'grid') or contains(@class,'flex-wrap')]//div[contains(@class,'border')][1]`
        ).first();

        if (!await card.isVisible({ timeout: 3000 }).catch(() => false)) {
            const clearBtn = this.page.locator("//*[@data-testid='clear-library-search-button']").first();
            if (await clearBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
                await clearBtn.click();
                await this.pause(1000);
            }
            card = this.page.locator("//div[contains(@class,'grid') or contains(@class,'flex-wrap')]//div[contains(@class,'border')][1]").first();
        }

        await card.waitFor({ state: 'visible', timeout: 10000 });
        await card.scrollIntoViewIfNeeded().catch(() => {});
        await card.hover({ force: true });
        await card.locator("img, div.relative, div[class*='preview']").first().hover({ force: true }).catch(() => {});
        await this.pause(800);

        const useBtn = this.page.locator(
            "//*[@data-testid='campaign-communication-list-hover']//p | " +
            "//*[@data-testid='campaign-communication-list-hover'] | " +
            "//*[contains(normalize-space(),'Use this content')]"
        ).first();

        try {
            await useBtn.click({ force: true, timeout: 5000 });
        } catch {
            await useBtn.dispatchEvent('click').catch(() => {});
        }

        await this.page.waitForURL((url) => !url.href.includes('setContent'), { timeout: 10000 }).catch(() => {});
        await this.pause(2000);

        if (this.page.url().includes('setContent')) {
            await card.click({ force: true }).catch(() => {});
            await this.pause(2000);
        }
    }

    async clickCancel()       { await this.click(this.sel.cancelBtn); await this.pause(1000); }

    async clickNodeEdit(nodeIndex: string) {
        // 1. Check for direct edit icon button or "Set up delay" button on node card (new UI)
        const nodeCard = this.page.locator(`(//div[contains(@class,'react-flow__node') or contains(@class,'workflow-node') or contains(@class,'relative') and .//div[contains(@class,'rounded')]])[${nodeIndex}]`).first();
        if (await nodeCard.isVisible({ timeout: 3000 }).catch(() => false)) {
            await nodeCard.hover({ force: true }).catch(() => {});
            await this.pause(300);

            // In new UI, top right has pencil icon button
            const directEditBtn = nodeCard.locator("button:has(svg):not(:has-text('Add')):not([role='switch'])").first();
            if (await directEditBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
                await directEditBtn.click();
                await this.pause(1500);
                return;
            }

            // Or "Set up delay" / "Set up" button inside card
            const setupBtn = nodeCard.locator("//button[contains(normalize-space(),'Set up') or contains(normalize-space(),'Edit')]").first();
            if (await setupBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
                await setupBtn.click();
                await this.pause(1500);
                return;
            }
        }

        // 2. Fallback to dropdown-based edit (older UI)
        const dropdownSel = `(//button[@data-testid='node-operations-dropdown' or @data-test-id='node-operations-dropdown' or contains(@class,'node-operations')])[${nodeIndex}]`;
        const dropdown = this.page.locator(dropdownSel).first();
        if (await dropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
            await dropdown.click();
            await this.pause(500);
            await this.click(this.sel.nodeEditBtn);
            await this.pause(1500);
            return;
        }

        // 3. Fallback: any edit button matching nodeIndex
        const fallbackEdit = this.page.locator(`(//button[contains(@data-testid,'edit') or @aria-label='Edit' or @title='Edit'])[${nodeIndex}]`).first();
        if (await fallbackEdit.isVisible({ timeout: 3000 }).catch(() => false)) {
            await fallbackEdit.click();
            await this.pause(1500);
        }
    }

    async clickHeaderThreeDotMenu(): Promise<void> {
        const rowMenu = this.page.locator("//tbody//tr[1]//button[contains(@data-testid, 'operations-dropdown') or contains(@class, 'dropdown')] | (//button[contains(@data-testid, 'operations-dropdown') and not(contains(@data-testid, 'header'))])[1]").first();
        if (await rowMenu.isVisible({ timeout: 3000 }).catch(() => false)) {
            await rowMenu.click();
        } else {
            await this.click(this.sel.headerThreeDotBtn);
        }
        await this.pause(1000);
    }

    async clickHeaderEditWorkflow(): Promise<void> {
        const editBtn = this.page.locator("//button[contains(@data-testid, 'dropdown-edit') or contains(normalize-space(), 'Edit')]").first();
        if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await editBtn.click();
        } else {
            await this.click(this.sel.headerEditBtn);
        }
        await this.pause(2000);
    }

    async clickExitMarkAsGoal(): Promise<string | null> {
        // Check if flyout switch is already visible (flyout opens automatically when Exit node is created)
        const switchBtn = this.page.locator(
            "//div[contains(@class,'flyout') or contains(@class,'drawer') or @role='dialog' or @id='headlessui-portal-root']//button[@role='switch'] | //button[@role='switch']"
        ).first();

        // If the flyout is NOT open yet, click 'Set up exit' on the canvas
        if (!await switchBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            const setupBtn = this.page.locator("//button[contains(.,'Set up exit') or @data-testid='node-setup-btn']").first();
            if (await setupBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
                await setupBtn.click({ force: true }).catch(() => {});
                await this.pause(1000);
            }
        }

        await switchBtn.waitFor({ state: 'visible', timeout: 10000 });
        const beforeChecked = await switchBtn.getAttribute('aria-checked').catch(() => null) ??
                              await switchBtn.getAttribute('data-state').catch(() => null);
        if (beforeChecked !== 'true' && beforeChecked !== 'checked') {
            await switchBtn.click();
            await this.pause(1000);
        }
        const afterChecked = await switchBtn.getAttribute('aria-checked').catch(() => null) ??
                             await switchBtn.getAttribute('data-state').catch(() => null);
        return (afterChecked === 'true' || afterChecked === 'checked') ? 'true' : 'false';
    }

    // â”€â”€â”€ Save / Publish â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

    // â”€â”€â”€ Error Handling â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

    // â”€â”€â”€ Dates â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    async clickStartDate() { await this.click(this.sel.startDate); await this.pause(1000); }
    async clickEndDate()   { await this.click(this.sel.endDate); await this.pause(1000); }

    // â”€â”€â”€ Filter & Search â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
