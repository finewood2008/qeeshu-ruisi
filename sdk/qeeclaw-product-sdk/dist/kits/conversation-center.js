export class ConversationCenterKit {
    client;
    constructor(client) {
        this.client = client;
    }
    loadHome(teamId, options) {
        return this.client.conversations.getHome(teamId, options?.groupLimit, options?.historyLimit);
    }
    getStats(teamId) {
        return this.client.conversations.getStats(teamId);
    }
    listGroups(teamId, limit) {
        return this.client.conversations.listGroups({ teamId, limit });
    }
    listGroupMessages(payload) {
        return this.client.conversations.listGroupMessages(payload);
    }
    listHistory(payload) {
        return this.client.conversations.listHistory(payload);
    }
    sendMessage(payload) {
        return this.client.conversations.sendMessage(payload);
    }
}
