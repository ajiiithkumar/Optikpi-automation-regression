import { BasePage } from '../base.page';

/**
 * DateTimePicker — shared component for date/time selection used
 * in Audience schedule, Campaign trigger, and Workflow start/end dates.
 */
export class DateTimePicker extends BasePage {

    private readonly sel = {
        startingAt:       "//div[@data-testid='schedule-audience-modal-dateTimeSelection']",
        timeDropdown:     "//button[@data-testid='audience-dateTimeUtil-dropdown-btn']",
        monthLabel:       "//div[contains(@class,'text-tertiary') and contains(@class,'font-semibold')]",
        nextMonthBtn:     "//button[@data-testid='audience-dateTimeSelection-modal-nextMonth-btn']",
        prevMonthBtn:     "//button[@data-testid='audience-dateTimeSelection-modal-previousMonth-btn']",
        applyBtn:         "//button[@data-testid='audience-dateTimeUtil-modal-apply-btn']",
        validationError:  "//*[normalize-space()='Please select a valid date in the future.']",
        updateScheduleBtn: "//button[@data-testid='schedule-audience-modal-confirm-btn']",
    };

    /** Open the "Starting at" date picker. */
    async openPicker() {
        await this.click(this.sel.startingAt);
        await this.pause(1000);
    }

    /** Navigate the calendar to a specific month/year. */
    async navigateToMonth(targetMonth: number, targetYear: number, monthLabelIndex = 1) {
        const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const targetMonthYear = `${monthNames[targetMonth]} ${targetYear}`;

        for (let m = 0; m < 12; m++) {
            const label = await this.page.locator(this.sel.monthLabel).nth(monthLabelIndex).innerText().catch(() => '');
            if (label.trim().toLowerCase() === targetMonthYear.toLowerCase()) break;

            if (new Date(`${label.trim()} 1`) < new Date(`${targetMonthYear} 1`)) {
                await this.click(this.sel.nextMonthBtn);
            } else {
                await this.click(this.sel.prevMonthBtn);
            }
            await this.pause(500);
        }
    }

    /** Click a specific date by data-testid. */
    async selectDate(year: number, month: number, day: number) {
        const mm = String(month + 1).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        const testId = `audience-dateTimeSelection-modal-date-${year}-${mm}-${dd}`;
        const dateBtn = this.page.locator(`//button[@data-testid='${testId}']`).first();

        const visible = await dateBtn.isVisible({ timeout: 5000 }).catch(() => false);
        if (visible) {
            await dateBtn.click({ force: true });
        } else {
            // Fallback: click by day number text
            const dayBtn = this.page.locator(`//button[normalize-space()='${day}']`).first();
            await dayBtn.waitFor({ state: 'visible', timeout: 10000 });
            await dayBtn.click({ force: true });
        }
        await this.pause(500);
    }

    /** Open the time dropdown and select the next available 5-min slot. Returns the Date of the selected time. */
    async selectNextAvailableTime(baseTime?: Date): Promise<Date> {
        await this.click(this.sel.timeDropdown);
        await this.pause(1000);

        // Approach: scan ALL visible time options in the dropdown and click a future one.
        // This is timezone-agnostic — works in any container timezone.
        const timeOptionSel = "//li[contains(@class,'cursor-pointer')] | //div[contains(@class,'cursor-pointer')]//span | //*[matches(normalize-space(),'^\\d{2}:\\d{2}\\s*(AM|PM)$')]";
        
        // Fallback: try to find time options by pattern matching in the dropdown
        const allOptions = this.page.locator('[class*="dropdown"] [class*="cursor-pointer"], [role="listbox"] [role="option"], li[class*="cursor-pointer"]');
        let optionCount = await allOptions.count();

        // If specific selectors don't work, try broader text matching
        if (optionCount === 0) {
            // Look for any clickable element with time text pattern (HH:MM AM/PM)
            const timePattern = this.page.locator('//*[matches(normalize-space(), "^[0-9]{1,2}:[0-9]{2}\\s*(AM|PM)$")]');
            optionCount = await timePattern.count().catch(() => 0);
        }

        // Strategy: generate time strings and try to find+click them
        // Use the page's own time context by reading any visible time, or try multiple candidates
        const now = baseTime || new Date();
        const minutesRounded = Math.ceil(now.getMinutes() / 5) * 5 + 5;
        const futureTime = new Date(now);
        futureTime.setMinutes(minutesRounded);
        futureTime.setSeconds(0);

        // Try up to 48 slots (4 hours of 5-min intervals) to handle timezone offsets
        for (let t = 0; t < 48; t++) {
            const tryTime = new Date(futureTime.getTime() + t * 5 * 60000);
            let hours = tryTime.getHours();
            const mins = tryTime.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            if (hours === 0) hours = 12;
            const timeStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${ampm}`;

            const timeOption = this.page.locator(`//*[normalize-space()='${timeStr}']`).first();
            if (await timeOption.isVisible({ timeout: 500 }).catch(() => false)) {
                await timeOption.click();
                console.log(`[DateTimePicker] Selected time: ${timeStr}`);
                return tryTime;
            }
        }

        // Last resort: also try IST offset times (UTC+5:30)
        const istOffset = 5.5 * 60 * 60000; // 5h30m in ms
        const nowIST = new Date(now.getTime() + istOffset);
        const minutesRoundedIST = Math.ceil(nowIST.getMinutes() / 5) * 5 + 5;
        const futureTimeIST = new Date(nowIST);
        futureTimeIST.setMinutes(minutesRoundedIST);
        futureTimeIST.setSeconds(0);

        for (let t = 0; t < 24; t++) {
            const tryTime = new Date(futureTimeIST.getTime() + t * 5 * 60000);
            let hours = tryTime.getHours();
            const mins = tryTime.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            if (hours === 0) hours = 12;
            const timeStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${ampm}`;

            const timeOption = this.page.locator(`//*[normalize-space()='${timeStr}']`).first();
            if (await timeOption.isVisible({ timeout: 500 }).catch(() => false)) {
                await timeOption.click();
                console.log(`[DateTimePicker] Selected time (IST fallback): ${timeStr}`);
                return tryTime;
            }
        }

        throw new Error('[DateTimePicker] Could not find any available time slot.');
    }

    /** Click the Apply button. */
    async clickApply() {
        await this.click(this.sel.applyBtn);
        await this.pause(1000);
    }

    /** Click the Update Schedule button. */
    async clickUpdateSchedule() {
        await this.click(this.sel.updateScheduleBtn);
        await this.pause(2000);
    }

    /** Check if the validation error is shown. */
    async hasValidationError(): Promise<boolean> {
        return this.page.locator(this.sel.validationError).first().isVisible().catch(() => false);
    }

    /**
     * Full flow: select today's date + next available time + apply.
     * Retries up to 3 times if validation error occurs.
     */
    async selectTodayWithRetry(openStartingAt = true): Promise<Date> {
        let selectedTime = new Date();

        for (let attempt = 0; attempt < 3; attempt++) {
            if (openStartingAt) await this.openPicker();

            const now = new Date();
            await this.selectDate(now.getFullYear(), now.getMonth(), now.getDate());
            selectedTime = await this.selectNextAvailableTime();
            await this.clickApply();

            const hasError = await this.hasValidationError();
            if (!hasError) {
                console.log(`[DateTimePicker] Schedule set on attempt ${attempt + 1}`);
                return selectedTime;
            }

            console.log(`[DateTimePicker] Attempt ${attempt + 1}: validation error. Retrying...`);
            if (attempt === 2) {
                throw new Error('Failed to set schedule after 3 attempts due to date validation error.');
            }
        }
        return selectedTime;
    }
}
