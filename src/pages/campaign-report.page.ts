import { BasePage } from './base.page';
import { CONTROL_GROUP, EngagementRecord, toEngagementRecord } from '../utils/campaign-engagement';

/**
 * CampaignReportPage — the campaign Performance report (Overview / Variants / Engagement / Summary / Logs)
 * plus the report API it is built on. The API calls go through the logged-in browser context
 * (page.request), so they use the same session and permissions as the UI.
 */
export interface CampaignDetails {
    campaignId: string;
    versionId: string;
    name: string;
    status: string;
    startDateTime: string;
    endDateTime: string;
    /** Active customers of the audience set in the campaign's Audience section. */
    audienceActiveCustomers: number;
}

export interface EngagementTableRow {
    userId: string;
    channel: string;
    status: string;
    provider: string;
    group: string;
    comment: string;
    timestamp: string;
}

export class CampaignReportPage extends BasePage {
    private readonly sel = {
        variantsTab: "//button[@data-testid='campaign-performance-report-variants' or @data-test-id='campaign-performance-report-variants']",
        engagementTab: "//button[@data-testid='campaign-performance-report-engagement' or @data-test-id='campaign-performance-report-engagement']",
        logsTab: "//button[@data-testid='campaign-performance-report-logs' or @data-test-id='campaign-performance-report-logs']",
        engagementRow: "//*[@data-testid='campaign-performance-report-engagement-row']",
        engagementNext: "//button[@data-testid='campaign-engagement-table-next-button' or @data-test-id='campaign-engagement-table-next-button']",
        logsRow: "//*[@data-testid='campaign-stepper-form-logs']//tbody//tr | //table[.//th[normalize-space()='Message']]//tbody//tr",
        logsNext: "//button[@data-testid='library-pagination-next-button' or @data-test-id='library-pagination-next-button']",
    };

    private readonly pageSize = 100;

    private get baseUrl(): string {
        const base = process.env.BASE_URL;
        if (!base) throw new Error('BASE_URL is not set (.env)');
        return base.endsWith('/') ? base : `${base}/`;
    }

    reportUrl(campaignId: string, versionId?: string, tab = 'overview'): string {
        const version = versionId ? `&version=${versionId}` : '';
        return `${this.baseUrl}campaign/performance-report/${campaignId}?parent=list&tab=${tab}${version}`;
    }

    // ─── API reads ───────────────────────────────────────────────────────────

    private async getJson(url: string): Promise<any> {
        const res = await this.page.request.get(url);
        if (!res.ok()) throw new Error(`GET ${url.split('?')[0]} -> ${res.status()}`);
        return res.json();
    }

    /** Finds a campaign by exact name via the list API used by the Campaign list page. */
    async findCampaignIdByName(name: string): Promise<string> {
        const params = new URLSearchParams({ name, status: '', page: '1', pageSize: '20', sort: '' });
        const body = await this.getJson(`${this.baseUrl}api/campaign/filter?${params.toString()}`);
        const rows: any[] = body?.result?.data ?? [];
        const match = rows.find((r) => r?.name === name);
        if (!match?.id) {
            throw new Error(`Campaign "${name}" not found via campaign list API (got ${rows.length} rows: ${rows.map((r) => r?.name).join(', ')})`);
        }
        return String(match.id);
    }

    /** GET api/campaign/{id} returns { data: { campaign, overviewData } } (status values are lower case, e.g. "scheduled"). */
    async getCampaignDetails(campaignId: string): Promise<CampaignDetails> {
        const body = await this.getJson(`${this.baseUrl}api/campaign/${campaignId}`);
        const c = body?.data?.campaign;
        if (!c) throw new Error(`Campaign ${campaignId}: campaign API response has no campaign`);
        return {
            campaignId: String(c.campaignId ?? campaignId),
            versionId: String(c.recentCampaignVersionId ?? c.id ?? ''),
            name: String(c.name ?? ''),
            status: String(c.status ?? ''),
            startDateTime: String(c.startDateTime ?? ''),
            endDateTime: String(c.endDateTime ?? ''),
            audienceActiveCustomers: Number(c.audience?.activeCustomers ?? NaN),
        };
    }

    /**
     * All engagement log records for the campaign, across every version and every page.
     * controlGroupOnly=false mirrors the Engagement tab (control group excluded);
     * controlGroupOnly=true returns only control-group rows.
     */
    async getEngagementRecords(campaignId: string, controlGroupOnly = false): Promise<EngagementRecord[]> {
        const records: EngagementRecord[] = [];
        let from = 0;
        let total = Infinity;
        const groupTerm = { term: { group: CONTROL_GROUP } };
        for (let pageNo = 0; from < total && pageNo < 200; pageNo++) {
            const query = {
                from,
                size: this.pageSize,
                sort: [{ '@timestamp': 'asc' }],
                query: {
                    bool: {
                        must: [{ term: { campaign_id: { value: campaignId } } }, ...(controlGroupOnly ? [groupTerm] : [])],
                        must_not: controlGroupOnly ? [] : [groupTerm],
                    },
                },
                type: 'GET_CAMPAIGN_PERFORMANCE_ENGAGEMENT_DELIVERY_DATA',
            };
            const res = await this.page.request.post(`${this.baseUrl}api/campaign/${campaignId}/performance-report`, { data: query });
            if (!res.ok()) throw new Error(`Engagement API for ${campaignId} -> ${res.status()}`);
            const body = await res.json();
            const hits: any[] = body?.data ?? [];
            total = Number(body?.totalRecords ?? hits.length);
            records.push(...hits.map((h) => toEngagementRecord(h?._source ?? {})));
            if (hits.length === 0) break;
            from += hits.length;
        }
        return records;
    }

    // ─── UI reads ────────────────────────────────────────────────────────────

    async open(campaignId: string, versionId?: string): Promise<void> {
        await this.page.goto(this.reportUrl(campaignId, versionId), { waitUntil: 'domcontentloaded' });
        await this.waitForVisible(this.sel.engagementTab, 30000);
        await this.collapseSidebar();
    }

    /** Reads every page of the Engagement table (control group excluded, like the API default). */
    async readEngagementTable(maxPages = 100): Promise<EngagementTableRow[]> {
        await this.click(this.sel.engagementTab);
        await this.waitForNetworkIdle(10000);
        const rows: EngagementTableRow[] = [];
        for (let p = 0; p < maxPages; p++) {
            const pageRows = await this.page.locator(this.sel.engagementRow).evaluateAll((els) =>
                els.map((el) => Array.from(el.querySelectorAll('td')).map((td) => (td.textContent || '').trim())));
            for (const cells of pageRows) {
                // Columns: User Id | Communication Id (masked) | Channel | Status | Provider | Group | Comment | Timestamp
                rows.push({
                    userId: cells[0] ?? '', channel: cells[2] ?? '', status: cells[3] ?? '',
                    provider: cells[4] ?? '', group: cells[5] ?? '', comment: cells[6] ?? '', timestamp: cells[7] ?? '',
                });
            }
            const next = this.page.locator(this.sel.engagementNext).first();
            if (!await next.isVisible({ timeout: 2000 }).catch(() => false) || await next.isDisabled()) break;
            const firstBefore = pageRows[0]?.join('|') ?? '';
            await this.click(this.sel.engagementNext);
            await this.waitForNetworkIdle(10000);
            const firstAfter = await this.page.locator(this.sel.engagementRow).first().innerText().catch(() => '');
            if (!firstAfter || firstAfter.replace(/\s+/g, '|') === firstBefore) break;
        }
        return rows;
    }

    /** Reads every page of the Logs tab, newest first, as "timestamp | message" lines. */
    async readLogMessages(maxPages = 50): Promise<string[]> {
        await this.click(this.sel.logsTab);
        await this.waitForNetworkIdle(10000);
        const messages: string[] = [];
        for (let p = 0; p < maxPages; p++) {
            const lines = await this.page.locator(this.sel.logsRow).evaluateAll((els) =>
                els.map((el) => Array.from(el.querySelectorAll('td')).map((td) => (td.textContent || '').trim()).join(' | ')));
            messages.push(...lines.filter(Boolean));
            const next = this.page.locator(this.sel.logsNext).first();
            if (!await next.isVisible({ timeout: 2000 }).catch(() => false) || await next.isDisabled()) break;
            await this.click(this.sel.logsNext);
            await this.waitForNetworkIdle(10000);
        }
        return messages;
    }

    /** Sum of "Sent emails to N users" log lines. */
    static sentCountFromLogs(messages: string[]): number {
        return messages.reduce((sum, m) => {
            const match = m.match(/Sent \w+ to (\d+) users?/i);
            return sum + (match ? Number(match[1]) : 0);
        }, 0);
    }

    /** Variant allocation and the content shown under each variant on the Variants tab: { A: "Sendgrid_automation_test", ... }. */
    async readVariantContent(): Promise<Record<string, { percent: number; content: string }>> {
        await this.click(this.sel.variantsTab);
        await this.waitForNetworkIdle(10000);
        const text = await this.page.locator('main').first().innerText().catch(() => this.page.locator('body').innerText());
        const result: Record<string, { percent: number; content: string }> = {};
        const re = /^\s*([A-Z])\s*=\s*(\d+)%\s*\n+\s*([^\n]+)/gm;
        let m: RegExpExecArray | null;
        while ((m = re.exec(text)) !== null) result[m[1]] = { percent: Number(m[2]), content: m[3].trim() };
        return result;
    }
}
