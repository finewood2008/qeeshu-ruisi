import type { ProductConversationGroup, ProductConversationGroupMessage, ProductConversationHistoryMessage, ProductConversationHome, ProductConversationStats, ProductSdkClient } from "../types.js";
export declare class ConversationCenterKit {
    private readonly client;
    constructor(client: ProductSdkClient);
    loadHome(teamId: number, options?: {
        groupLimit?: number;
        historyLimit?: number;
    }): Promise<ProductConversationHome>;
    getStats(teamId: number): Promise<ProductConversationStats>;
    listGroups(teamId: number, limit?: number): Promise<ProductConversationGroup[]>;
    listGroupMessages(payload: {
        teamId: number;
        roomId: string;
        limit?: number;
    }): Promise<ProductConversationGroupMessage[]>;
    listHistory(payload: {
        teamId: number;
        channelId?: string;
        limit?: number;
    }): Promise<ProductConversationHistoryMessage[]>;
    sendMessage(payload: {
        teamId: number;
        content: string;
        agentId?: number;
        channelId?: string;
        direction?: string;
    }): Promise<ProductConversationHistoryMessage>;
}
