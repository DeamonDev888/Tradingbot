#!/usr/bin/env ts-node
interface SimpleMaintenanceReport {
    timestamp: Date;
    databaseConnected: boolean;
    maintenancePerformed: string[];
    newsProcessed: number;
    duplicatesRemoved: number;
    spaceRecovered: number;
    errors: string[];
    success: boolean;
}
declare class SimpleMaintenance {
    private pool;
    constructor();
    testConnection(): Promise<boolean>;
    performMaintenance(): Promise<SimpleMaintenanceReport>;
    printReport(report: SimpleMaintenanceReport): Promise<string>;
    close(): Promise<void>;
}
export { SimpleMaintenance };
//# sourceMappingURL=maintenance_simple.d.ts.map