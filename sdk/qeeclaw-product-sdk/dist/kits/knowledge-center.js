export class KnowledgeCenterKit {
    client;
    constructor(client) {
        this.client = client;
    }
    async loadHome(payload) {
        const [stats, config, assets] = await Promise.all([
            this.client.knowledge.stats(payload),
            this.client.knowledge.getConfig(payload),
            this.client.knowledge.list({ ...payload, page: 1, pageSize: 20 }),
        ]);
        return { stats, config, assets };
    }
    search(payload) {
        return this.client.knowledge.search(payload);
    }
    ingest(payload) {
        return this.client.knowledge.ingest(payload);
    }
    updateWatchDir(payload) {
        return this.client.knowledge.updateConfig(payload);
    }
}
