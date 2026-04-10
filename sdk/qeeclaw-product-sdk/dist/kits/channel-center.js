export class ChannelCenterKit {
    client;
    constructor(client) {
        this.client = client;
    }
    async loadHome(teamId) {
        const [overview, wechatWork, feishu, wechatPersonalPlugin] = await Promise.all([
            this.client.channels.getOverview(teamId),
            this.client.channels.getWechatWorkConfig(teamId),
            this.client.channels.getFeishuConfig(teamId),
            this.client.channels.getWechatPersonalPluginConfig(teamId),
        ]);
        return {
            overview,
            wechatWork,
            feishu,
            wechatPersonalPlugin,
        };
    }
    getOverview(teamId) {
        return this.client.channels.getOverview(teamId);
    }
    getWechatWorkConfig(teamId) {
        return this.client.channels.getWechatWorkConfig(teamId);
    }
    updateWechatWorkConfig(payload) {
        return this.client.channels.updateWechatWorkConfig(payload);
    }
    getFeishuConfig(teamId) {
        return this.client.channels.getFeishuConfig(teamId);
    }
    updateFeishuConfig(payload) {
        return this.client.channels.updateFeishuConfig(payload);
    }
    getWechatPersonalPluginConfig(teamId) {
        return this.client.channels.getWechatPersonalPluginConfig(teamId);
    }
    updateWechatPersonalPluginConfig(payload) {
        return this.client.channels.updateWechatPersonalPluginConfig(payload);
    }
    listChannelBindings(teamId, channelKey = "wechat_personal_plugin") {
        return this.client.channels.listChannelBindings(teamId, channelKey);
    }
    createChannelBinding(payload) {
        return this.client.channels.createChannelBinding(payload);
    }
    disableChannelBinding(bindingId) {
        return this.client.channels.disableChannelBinding(bindingId);
    }
    regenerateChannelBindingCode(bindingId, expiresInHours = 72) {
        return this.client.channels.regenerateChannelBindingCode(bindingId, expiresInHours);
    }
}
