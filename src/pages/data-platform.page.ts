import { BasePage } from './base.page';

/**
 * DataPlatformPage — Data platform -> Customer Events: CSV import of customer events
 * and the events list used to confirm an imported event was accepted.
 */
export class DataPlatformPage extends BasePage {
    private readonly sel = {
        importEventsBtn: "//button[@data-testid='data-platform-import-customer-events-csv' or @data-test-id='data-platform-import-customer-events-csv']",
        // The dialog root reports hidden (only fixed-position children), so visibility is checked on its
        // title text and buttons, never on the root itself.
        uploadDialogTitle: "//*[@role='dialog']//*[normalize-space(text())='Upload Customer Events']",
        fileInput: "//*[@role='dialog'][.//*[normalize-space(text())='Upload Customer Events']]//input[@type='file']",
        uploadBtn: "//*[@role='dialog'][.//*[normalize-space(text())='Upload Customer Events']]//button[@data-testid='modal-submit-button' or @data-test-id='modal-submit-button']",
        searchInput: "//input[@data-testid='search-data' or @data-test-id='search-data' or @id='search-data']",
        noEvents: "//*[normalize-space()='No Events yet']",
    };

    private get baseUrl(): string {
        const base = process.env.BASE_URL;
        if (!base) throw new Error('BASE_URL is not set (.env)');
        return base.endsWith('/') ? base : `${base}/`;
    }

    async openCustomerEvents(): Promise<void> {
        await this.page.goto(`${this.baseUrl}data-platform/customer-events?page=1`, { waitUntil: 'domcontentloaded' });
        await this.waitForVisible(this.sel.importEventsBtn, 30000);
        await this.collapseSidebar();
    }

    /**
     * Uploads a Customer Events CSV and returns the upload response status/message.
     * Throws when the upload request fails or the dialog stays open with an error.
     */
    async importCustomerEventsCsv(csvPath: string): Promise<{ status: number; message: string }> {
        await this.click(this.sel.importEventsBtn);
        const title = this.page.locator(this.sel.uploadDialogTitle).filter({ visible: true }).first();
        await title.waitFor({ state: 'visible', timeout: 15000 });
        // The file input is hidden behind the drop zone; setInputFiles works on hidden inputs.
        await this.page.locator(this.sel.fileInput).first().setInputFiles(csvPath);
        const fileName = csvPath.split(/[\\/]/).pop() ?? '';
        // After attaching, the dialog lists the file with its size, shortening long names
        // ("deposit_event_user_005_amo..."), so match the start of the name. The button then reads "Upload".
        await this.page.locator("//*[@role='dialog']").getByText(fileName.slice(0, 20))
            .filter({ visible: true }).first().waitFor({ state: 'visible', timeout: 15000 })
            .catch(() => { throw new Error(`Upload dialog does not list the attached file ${fileName}`); });

        const upload = this.page.locator(this.sel.uploadBtn).filter({ visible: true }).first();
        await upload.waitFor({ state: 'visible', timeout: 10000 });
        if (await upload.isDisabled()) throw new Error(`"Upload" stays disabled after attaching ${fileName}`);
        const uploadResponse = this.page.waitForResponse(
            (r) => r.request().method() !== 'GET' && /upload|import|csv|file|customer-event/i.test(r.url()),
            { timeout: 60000 },
        );
        await upload.click();
        const res = await uploadResponse;
        const message = await res.text().catch(() => '');
        if (res.status() >= 400) {
            throw new Error(`Customer events upload failed: ${res.status()} ${res.url().split('?')[0]} ${message.slice(0, 300)}`);
        }
        await title.waitFor({ state: 'hidden', timeout: 30000 })
            .catch(async () => {
                const dialogText = await this.page.locator("//*[@role='dialog']").filter({ hasText: 'Upload Customer Events' }).first().innerText().catch(() => '');
                throw new Error(`Upload dialog is still open after Upload: ${dialogText.slice(0, 300)}`);
            });
        return { status: res.status(), message: `${res.url().split('?')[0]} ${message.slice(0, 250)}` };
    }

    /**
     * Searches the Customer Events list and returns the text of the persisted row that mentions
     * the value (event_id, transaction_id or user_id), or '' when no such row is listed.
     */
    async findEventRow(value: string): Promise<string> {
        await this.openCustomerEvents();
        await this.fill(this.sel.searchInput, value);
        await this.page.keyboard.press('Enter');
        await this.waitForNetworkIdle(10000);
        const row = `//tbody//tr[.//*[contains(normalize-space(),'${value}')]]`;
        if (!await this.isVisible(row, 5000)) return '';
        return (await this.page.locator(row).first().innerText()).replace(/\s+/g, ' ').trim();
    }

    /** Text of the first list row, for evidence when an event is not found. */
    async getFirstRowText(): Promise<string> {
        if (await this.isVisible(this.sel.noEvents, 1000)) return 'No Events yet';
        return this.page.locator('//tbody//tr').first().innerText().catch(() => '');
    }
}
