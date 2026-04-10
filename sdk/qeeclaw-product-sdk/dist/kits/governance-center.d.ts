import type { PaginatedResult, ProductApprovalRecord, ProductAuditEvent, ProductAuditSummary, ProductSdkClient } from "../types.js";
export interface GovernanceCenterHome {
    summary: ProductAuditSummary;
    pendingApprovals: ProductApprovalRecord[];
    recentEvents: ProductAuditEvent[];
}
export declare class GovernanceCenterKit {
    private readonly client;
    constructor(client: ProductSdkClient);
    loadHome(scope?: "mine" | "all"): Promise<GovernanceCenterHome>;
    listApprovals(params?: {
        scope?: "mine" | "all";
        status?: "pending" | "approved" | "rejected" | "expired";
        page?: number;
        pageSize?: number;
    }): Promise<PaginatedResult<ProductApprovalRecord>>;
    listAuditEvents(params?: {
        scope?: "mine" | "all";
        category?: "all" | "operation" | "approval";
        page?: number;
        pageSize?: number;
    }): Promise<PaginatedResult<ProductAuditEvent>>;
}
