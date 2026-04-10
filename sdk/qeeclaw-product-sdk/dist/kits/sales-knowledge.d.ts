import type { ProductRuntimeKnowledgeScope, ProductSdkClient } from "../types.js";
export interface SalesKnowledgeCard {
    title: string;
    summary: string;
    source: string;
}
export interface SalesKnowledgeAssistantContext {
    assistant: {
        username: string;
        role: string;
        enterpriseVerified: boolean;
        workspaceCount: number;
    };
    talkTracks: SalesKnowledgeCard[];
    productKnowledge: SalesKnowledgeCard[];
    competitorResponses: SalesKnowledgeCard[];
    successCases: SalesKnowledgeCard[];
    configSummary: {
        watchDir?: string;
        indexedAssetCount?: number;
    };
}
export declare class SalesKnowledgeKit {
    private readonly client;
    constructor(client: ProductSdkClient);
    loadAssistantContext(payload: ProductRuntimeKnowledgeScope): Promise<SalesKnowledgeAssistantContext>;
}
