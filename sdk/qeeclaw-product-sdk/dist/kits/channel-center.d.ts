import type { ProductChannelBindingRecord, ProductChannelHome, ProductChannelOverview, ProductFeishuChannelConfig, ProductSdkClient, ProductWechatPersonalPluginChannelConfig, ProductWechatWorkChannelConfig } from "../types.js";
export declare class ChannelCenterKit {
    private readonly client;
    constructor(client: ProductSdkClient);
    loadHome(teamId: number): Promise<ProductChannelHome>;
    getOverview(teamId: number): Promise<ProductChannelOverview>;
    getWechatWorkConfig(teamId: number): Promise<ProductWechatWorkChannelConfig>;
    updateWechatWorkConfig(payload: {
        teamId: number;
        corpId: string;
        agentId: string;
        secret?: string;
    }): Promise<ProductWechatWorkChannelConfig>;
    getFeishuConfig(teamId: number): Promise<ProductFeishuChannelConfig>;
    updateFeishuConfig(payload: {
        teamId: number;
        appId: string;
        appSecret?: string;
        verificationToken?: string;
        encryptKey?: string;
    }): Promise<ProductFeishuChannelConfig>;
    getWechatPersonalPluginConfig(teamId: number): Promise<ProductWechatPersonalPluginChannelConfig>;
    updateWechatPersonalPluginConfig(payload: {
        teamId: number;
        displayName: string;
        assistantName?: string;
        welcomeMessage?: string;
        kernelCorpId?: string;
        kernelAgentId?: string;
        kernelSecret?: string;
        kernelVerifyToken?: string;
        kernelAesKey?: string;
        bindingEnabled?: boolean;
        enabled?: boolean;
    }): Promise<ProductWechatPersonalPluginChannelConfig>;
    listChannelBindings(teamId: number, channelKey?: "wechat_work" | "feishu" | "wechat_personal_plugin"): Promise<{
        items: ProductChannelBindingRecord[];
        total: number;
    }>;
    createChannelBinding(payload: {
        teamId: number;
        channelKey?: "wechat_work" | "feishu" | "wechat_personal_plugin";
        bindingType: string;
        bindingTargetId: string;
        bindingTargetName?: string;
        expiresInHours?: number;
        notes?: string;
    }): Promise<ProductChannelBindingRecord>;
    disableChannelBinding(bindingId: number): Promise<ProductChannelBindingRecord>;
    regenerateChannelBindingCode(bindingId: number, expiresInHours?: number): Promise<ProductChannelBindingRecord>;
}
