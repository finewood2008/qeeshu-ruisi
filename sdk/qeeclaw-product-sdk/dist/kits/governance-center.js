export class GovernanceCenterKit {
    client;
    constructor(client) {
        this.client = client;
    }
    async loadHome(scope = "mine") {
        const [summary, approvals, events] = await Promise.all([
            this.client.audit.getSummary({ scope }),
            this.client.approval.list({ scope, status: "pending", page: 1, pageSize: 10 }),
            this.client.audit.listEvents({ scope, category: "all", page: 1, pageSize: 10 }),
        ]);
        return {
            summary,
            pendingApprovals: approvals.items,
            recentEvents: events.items,
        };
    }
    listApprovals(params) {
        return this.client.approval.list(params);
    }
    listAuditEvents(params) {
        return this.client.audit.listEvents(params);
    }
}
