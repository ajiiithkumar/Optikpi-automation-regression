import { BasePage } from './base.page';

/**
 * WorkflowReportPage — workflow performance report (Overview canvas with per-node customer lists, Logs tab)
 * and the APIs behind it. API reads use the logged-in session (page.request), like CampaignReportPage.
 */

export interface WorkflowSummary {
    id: string;
    name: string;
    status: string;
    startDateTime?: string;
    endDateTime?: string;
}

export interface WorkflowNode {
    id: string;
    /** delay | action | exitFlow | enrollmentTrigger ... */
    type: string;
    name: string;
    subType?: string;
    description?: string;
    nodeData?: any;
    /** Ids the report may use for an Action node (outer node and inner action ids). */
    reportIds: string[];
}

export interface WorkflowDetail extends WorkflowSummary {
    enrolled?: number;
    inProgress?: number;
    exited?: number;
    nodes: WorkflowNode[];
    /** Canvas links between nodes (source -> target node id). */
    edges: { source: string; target: string }[];
}

export interface WorkflowNodeEvent {
    userId: string;
    eventType: string;
    nodeType: string;
    nodeId: string;
    timestamp: string;
}

export interface WorkflowNodeLogCount {
    at: string;
    count: number;
    live: boolean;
    message: string;
}

export interface WorkflowLogEntry {
    message: string;
    nodeId: string;
    timestamp: string;
}

export class WorkflowReportPage extends BasePage {
    private readonly sel = {
        overviewTab: "//*[@data-testid='Overview']",
        logsTab: "//*[@data-testid='Logs']",
        nodeCard: "//*[@data-testid='report-node-{id}']",
        nodeViewCustomers: "//*[@data-testid='report-node-{id}']//*[@data-testid='report-node-view-customers-btn']",
        nodeUsersTable: "//*[@data-testid='workflow-node-users-table-area']",
        flyoutClose: "//*[@data-testid='flyout-close-btn' or @data-testid='common-flyout-close-btn']",
        logsRow: "//table//tbody//tr",
    };

    private readonly pageSize = 100;

    private get baseUrl(): string {
        const base = process.env.BASE_URL || 'https://demo.optikpi.com/en';
        return base.endsWith('/') ? base : `${base}/`;
    }

    reportUrl(workflowId: string, tab: 'overview' | 'logs' = 'overview'): string {
        return `${this.baseUrl}workflow/performance-report/${workflowId}/${tab}`;
    }

    // ─── API reads ───────────────────────────────────────────────────────────

    private async getJson(url: string): Promise<any> {
        const res = await this.page.request.get(url);
        if (!res.ok()) throw new Error(`GET ${url.split('?')[0]} -> ${res.status()}`);
        return res.json();
    }

    private async postJson(url: string, data: unknown): Promise<any> {
        const res = await this.page.request.post(url, { data });
        if (!res.ok()) throw new Error(`POST ${url} -> ${res.status()}`);
        return res.json();
    }

    /** Workflow with this exact name (most recent first), or undefined. */
    async findWorkflowByName(name: string): Promise<WorkflowSummary | undefined> {
        const params = new URLSearchParams({ name, status: 'all', page: '1', pageSize: '20' });
        const body = await this.getJson(`${this.baseUrl}api/workflow?${params.toString()}`);
        const list: any[] = body?.result?.data ?? [];
        const w = list.find((x) => x.name === name);
        return w ? { id: w.id, name: w.name, status: w.status, startDateTime: w.startDateTime, endDateTime: w.endDateTime } : undefined;
    }

    async getWorkflow(workflowId: string): Promise<WorkflowDetail> {
        const body = await this.getJson(`${this.baseUrl}api/workflow/${workflowId}?omitFields=&resolveNodeReport=true`);
        const w = body?.result?.data ?? body?.result;
        if (!w?.id) throw new Error(`Workflow ${workflowId} not found`);
        const nodes: WorkflowNode[] = (w.code?.nodes ?? []).map((n: any) => {
            const isAction = n.type === 'action' || n.data?.type === 'action';
            const inner = (n.data?.actions ?? []).map((a: any) => String(a.id));
            return {
                id: String(n.id),
                type: isAction ? 'action' : String(n.data?.type ?? n.type),
                name: String(n.data?.name ?? n.data?.actions?.[0]?.data?.name ?? ''),
                subType: n.data?.subType,
                description: n.data?.description,
                nodeData: n.data?.nodeData,
                reportIds: [String(n.id), ...inner],
            };
        });
        return {
            id: w.id, name: w.name, status: w.status, startDateTime: w.startDateTime, endDateTime: w.endDateTime,
            enrolled: w.enrolled, inProgress: w.inProgress, exited: w.exited, nodes,
            edges: (w.code?.edges ?? []).map((e: any) => ({ source: String(e.source), target: String(e.target) })),
        };
    }

    /** Every customer event recorded for a node (all pages), oldest first. */
    async getNodeEvents(workflowId: string, nodeId: string): Promise<WorkflowNodeEvent[]> {
        const events: WorkflowNodeEvent[] = [];
        for (let page = 1; page <= 50; page++) {
            const body = await this.postJson(`${this.baseUrl}api/workflow/${workflowId}/${nodeId}`, {
                sort: { timestamp: 'desc' },
                queryParams: [{ fieldName: 'workflow_id', value: workflowId }, { fieldName: 'node_id', value: nodeId }],
                pageSize: this.pageSize, currentPage: page, type: 'WORKFLOW_NODE_USERS_VIEW',
            });
            const data = body?.result?.data;
            const hits: any[] = data?.data ?? [];
            for (const h of hits) {
                const s = h._source ?? {};
                events.push({
                    userId: String(s.user_id ?? ''), eventType: String(s.event_type ?? ''), nodeType: String(s.node_type ?? ''),
                    nodeId: String(s.node_id ?? nodeId), timestamp: String(s.timestamp ?? s['@timestamp'] ?? ''),
                });
            }
            if (hits.length < this.pageSize || events.length >= Number(data?.totalRecords ?? 0)) break;
        }
        return events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    }

    /** Events for a node, merged over all ids the report may use for it (Action nodes have an inner id). */
    async getEventsForNode(workflowId: string, node: WorkflowNode): Promise<WorkflowNodeEvent[]> {
        const seen = new Set<string>();
        const all: WorkflowNodeEvent[] = [];
        for (const id of node.reportIds) {
            for (const e of await this.getNodeEvents(workflowId, id)) {
                const key = `${e.userId}|${e.eventType}|${e.timestamp}`;
                if (!seen.has(key)) { seen.add(key); all.push(e); }
            }
        }
        return all.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    }

    /** Every Logs tab entry (all pages), oldest first. */
    async getLogs(workflowId: string): Promise<WorkflowLogEntry[]> {
        const logs: WorkflowLogEntry[] = [];
        for (let page = 1; page <= 50; page++) {
            const body = await this.postJson(`${this.baseUrl}api/workflow/${workflowId}/logs`, {
                pageSize: this.pageSize, currentPage: page,
                queryParams: [{ fieldName: 'workflow_id', value: workflowId }], sort: { timestamp: 'desc' },
            });
            const hits: any[] = body?.data ?? body?.result?.data?.data ?? [];
            for (const h of hits) {
                const s = h._source ?? {};
                logs.push({ message: String(s.activity_log ?? ''), nodeId: String(s.node_id ?? ''), timestamp: String(s.timestamp ?? s['@timestamp'] ?? '') });
            }
            if (hits.length < this.pageSize) break;
        }
        return logs.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    }

    /**
     * Logs entries of one node as counts, oldest first. Logs carry counts, not user ids
     * ("The delay node has successfully processed 3 users."); a Delay released by a live event logs
     * "Live delay node event <name> has successfully processed N users" (live = true).
     */
    async getNodeLogCounts(workflowId: string, node: WorkflowNode): Promise<WorkflowNodeLogCount[]> {
        return (await this.getLogs(workflowId))
            .filter((l) => node.reportIds.includes(l.nodeId))
            .map((l) => ({
                at: l.timestamp,
                count: Number(/processed\s+(\d+)\s+user/i.exec(l.message)?.[1] ?? 0),
                live: /^live\b/i.test(l.message.trim()),
                message: l.message,
            }))
            .filter((l) => l.count > 0);
    }

    // ─── UI (evidence) ───────────────────────────────────────────────────────

    async open(workflowId: string): Promise<void> {
        await this.page.goto(this.reportUrl(workflowId), { waitUntil: 'domcontentloaded' });
        await this.waitForVisible(this.sel.overviewTab, 30000);
        await this.collapseSidebar();
        await this.waitForNetworkIdle(10000);
    }

    /** Opens a node's customer list flyout; returns false when the node is not on the report canvas. */
    async openNodeCustomers(node: WorkflowNode): Promise<boolean> {
        for (const id of node.reportIds) {
            const btn = this.sel.nodeViewCustomers.replace('{id}', id);
            if (await this.isVisible(btn, 3000)) {
                await this.click(btn);
                // The flyout shows a table area when it has rows; its close button is always there.
                await this.waitForVisible(`${this.sel.nodeUsersTable} | ${this.sel.flyoutClose}`, 15000);
                await this.waitForNetworkIdle(10000);
                return true;
            }
        }
        return false;
    }

    async closeNodeCustomers(): Promise<void> {
        if (await this.isVisible(this.sel.flyoutClose, 3000)) await this.click(this.sel.flyoutClose);
        await this.pause(800);
    }

    async openLogsTab(): Promise<void> {
        await this.click(this.sel.logsTab);
        await this.waitForNetworkIdle(10000);
        await this.isVisible(this.sel.logsRow, 10000);
    }
}
