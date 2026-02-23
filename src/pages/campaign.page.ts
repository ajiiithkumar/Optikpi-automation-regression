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

        // Audience
        newAudienceTab:       "//button[@data-test-id='campaign-tab-new-audience']",
        existingAudienceTab:  "//button[@data-test-id='campaign-tab-existing-audience']",
        selectExistingBtn:    "//button[text()='Select existing audience']",
        existingAudienceOk:   "//button[@data-testid='flyout-confirm-btn']",
        setAudienceBtn:       "//button[@data-testid='campaign-stepper-set-audience-button']",

        // Trigger
        triggerStartDate:  "//button[@data-testid='campaign-timer-trigger-startDate-select']",
        setTriggerBtn:     "//button[@data-testid='campaign-stepper-set-trigger-button']",

        // Communication
        chooseContentBtn:     "//button[@data-testid='campaign-choose-content-btn']",
        setCommunicationBtn:  "//button[@data-testid='campaign-stepper-set-communication-button']",

        // Publish
        publishBtn:        "//button[@data-testid='campaign-publish-button']",
        publishConfirm:    "//button[@data-testid='modal-submit-button']",
        saveDraftBtn:      "//button[@data-testid='campaign-save-draft-button']",

        // Search
        searchBar:  "//input[@id='campaign-listView-table-search-icon']",
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

    // ─── Goal ────────────────────────────────────────────────────────────────

    async clickGoalClick() {
        await this.click(this.sel.goalClick);
    }

    async clickGoalOpen() {
        await this.click(this.sel.goalOpen);
    }

    async clickSetGoal() {
        await this.click(this.sel.setGoalBtn);
        await this.pause(1000);
    }

    async verifyGoalIsSet() {
        await this.waitForVisible(this.sel.editGoal);
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

    // ─── Trigger ─────────────────────────────────────────────────────────────

    async clickTriggerStartDate() {
        await this.click(this.sel.triggerStartDate);
    }

    async clickSetTrigger() {
        await this.click(this.sel.setTriggerBtn);
        await this.pause(1000);
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
    }

    // ─── Search ──────────────────────────────────────────────────────────────

    async searchCampaign(name: string) {
        await this.click(this.sel.searchBar);
        await this.fill(this.sel.searchBar, name);
        await this.page.keyboard.press('Enter').catch(() => {});
        await this.pause(2000);
    }

    async verifyCampaignVisible(name: string, timeout = 30000) {
        await this.page.getByText(name, { exact: false }).first()
            .waitFor({ state: 'attached', timeout });
    }
}
