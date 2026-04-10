export class DeviceCenterKit {
    client;
    constructor(client) {
        this.client = client;
    }
    async loadOverview() {
        const devices = await this.client.devices.list();
        const online = devices.filter((item) => item.status === "online").length;
        return {
            total: devices.length,
            online,
            offline: devices.length - online,
            devices,
        };
    }
    getAccountState(installationId) {
        return this.client.devices.getAccountState(installationId);
    }
    bootstrap(payload) {
        return this.client.devices.bootstrap(payload);
    }
}
