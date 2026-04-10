import type { ProductSdkClient } from "../types.js";
export interface SalesCoachingTask {
    title: string;
    type: "workflow" | "agent-template" | "governance";
    status: "ready" | "attention" | "planned";
    hint: string;
}
export interface SalesReviewSummary {
    id: number;
    contentPreview: string;
    direction: string;
    createdTime?: string | null;
}
export interface SalesCommonMistake {
    title: string;
    level: "high" | "medium" | "low";
    suggestion: string;
}
export interface SalesBestPractice {
    title: string;
    reason: string;
}
export interface SalesCoachingOverview {
    trainingTasks: SalesCoachingTask[];
    reviewSummaries: SalesReviewSummary[];
    commonMistakes: SalesCommonMistake[];
    bestPractices: SalesBestPractice[];
    assistantTemplates: Array<{
        code: string;
        name: string;
        allowedTools: string[];
    }>;
}
export declare class SalesCoachingKit {
    private readonly client;
    constructor(client: ProductSdkClient);
    loadTrainingOverview(teamId: number, scope?: "mine" | "all"): Promise<SalesCoachingOverview>;
}
