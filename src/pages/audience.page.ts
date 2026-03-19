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
        customerPropsEvent:        "//button[@data-testid='audience-ruleBuilder-customer-properties-group-1-event-btn-1']",
        userIdInput:               "//input[@data-testid='user-id']",
        userIdCondition:           "//button[@data-testid='audience-ruleBuilder-customer-properties-group-1-condition-btn-1-1']",
        userIdConditionIsOneOf:    "//input[@data-testid='is-one-of']",
        userIdConditionValues:     "//button[@data-testid='audience-ruleBuilder-customer-properties-group-1-values-btn-1-1']",
        searchField:               "//input[@id='search-data']",
        addValuesBtn:              "//button[@data-testid='commonProfile-add-values-btn']",

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

    async clickCreateNew()       { await this.pause(1000);
        await this.click(this.sel.createNewBtn); }
    async clickCreateFromScratch() { await this.pause(1000);
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
        await this.click(this.sel.userIdCondition);
        await this.click(this.sel.userIdConditionIsOneOf);
    }

    async enterUserIdValue(userId: string) {
        await this.click(this.sel.userIdConditionValues);
        await this.pause(2000);
        const searchField = this.page.locator(this.sel.searchField).first();
        if (await searchField.isVisible().catch(() => false)) {
            await searchField.fill(userId);
            await this.page.keyboard.press('Enter').catch(() => {});
            await this.click(this.sel.addValuesBtn);
        }
    }

    async addExtraUserIds(userIds: string[]) {
        await this.click(this.sel.userIdConditionValues);
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
}
