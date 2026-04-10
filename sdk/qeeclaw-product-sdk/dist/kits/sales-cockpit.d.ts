import type { ProductApprovalRecord, ProductSdkClient } from "../types.js";
export interface SalesCockpitSummary {
    pendingFollowUpCount: number;
    riskOpportunityCount: number;
    pendingApprovalCount: number;
    walletBalance: number;
    currentMonthSpend: number;
    workflowCount: number;
    knowledgeHitCount: number;
    enterpriseVerified: boolean;
}
export interface SalesFollowUpItem {
    roomId: string;
    roomName: string;
    lastActive?: string | null;
    msgCount: number;
    memberCount: number;
    priority: "high" | "medium" | "low";
    suggestedAction: string;
}
export interface SalesRiskOpportunity {
    approvalId: string;
    title: string;
    reason: string;
    riskLevel: ProductApprovalRecord["riskLevel"];
    status: ProductApprovalRecord["status"];
    actionHint: string;
}
export interface SalesConversationHighlight {
    id: number;
    direction: string;
    contentPreview: string;
    createdTime?: string | null;
}
export interface SalesKnowledgeRecommendation {
    title: string;
    source: string;
    type: "knowledge" | "document";
}
export interface SalesGovernanceSnapshot {
    auditTotal: number;
    totalSpent: number;
    totalRecharge: number;
    approvalCount: number;
    enterpriseVerified: boolean;
}
export interface SalesCockpitHome {
    summary: SalesCockpitSummary;
    followUps: SalesFollowUpItem[];
    riskOpportunities: SalesRiskOpportunity[];
    conversationHighlights: SalesConversationHighlight[];
    recommendedKnowledge: SalesKnowledgeRecommendation[];
    governanceSnapshot: SalesGovernanceSnapshot;
}
export interface SalesOpportunityBoard {
    stageDistribution: Array<{
        stage: string;
        count: number;
    }>;
    highRiskCustomers: Array<{
        roomId: string;
        roomName: string;
        riskLevel: "high" | "medium" | "low" | "critical";
        reason: string;
    }>;
    recentConversationHeat: Array<{
        roomId: string;
        roomName: string;
        heatScore: number;
    }>;
    recommendedActions: string[];
}
export declare class SalesCockpitKit {
    private readonly client;
    constructor(client: ProductSdkClient);
    loadHome(teamId: number, scope?: "mine" | "all"): Promise<SalesCockpitHome>;
    loadOpportunityBoard(teamId: number, scope?: "mine" | "all"): Promise<SalesOpportunityBoard>;
}
