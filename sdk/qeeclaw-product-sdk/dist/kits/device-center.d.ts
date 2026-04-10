import type { ProductDeviceAccountState, ProductDeviceConnectionConfig, ProductDeviceInfo, ProductSdkClient } from "../types.js";
export interface DeviceCenterOverview {
    total: number;
    online: number;
    offline: number;
    devices: ProductDeviceInfo[];
}
export declare class DeviceCenterKit {
    private readonly client;
    constructor(client: ProductSdkClient);
    loadOverview(): Promise<DeviceCenterOverview>;
    getAccountState(installationId: string): Promise<ProductDeviceAccountState>;
    bootstrap(payload: {
        installationId: string;
        deviceName: string;
        hostname?: string;
        osInfo?: string;
    }): Promise<ProductDeviceConnectionConfig>;
}
