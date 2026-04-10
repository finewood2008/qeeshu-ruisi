import type { ProductRuntimeKnowledgeScope, ProductSdkClient } from "../types.js";
export interface KnowledgeCenterHome {
    stats: Record<string, unknown>;
    config: Record<string, unknown>;
    assets: Record<string, unknown>;
}
export declare class KnowledgeCenterKit {
    private readonly client;
    constructor(client: ProductSdkClient);
    loadHome(payload: ProductRuntimeKnowledgeScope): Promise<KnowledgeCenterHome>;
    search(payload: ProductRuntimeKnowledgeScope & {
        query?: string;
        filename?: string;
        limit?: number;
    }): Promise<Record<string, unknown>>;
    ingest(payload: ProductRuntimeKnowledgeScope & {
        file?: Blob | Uint8Array | ArrayBuffer;
        filename?: string;
        contentType?: string;
        content?: string;
        sourceName?: string;
    }): Promise<Record<string, unknown>>;
    updateWatchDir(payload: ProductRuntimeKnowledgeScope & {
        watchDir: string;
    }): Promise<Record<string, unknown>>;
}
