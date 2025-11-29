#!/usr/bin/env ts-node
interface DataCrisisFixResult {
    timestamp: Date;
    initialStats: {
        totalNews: number;
        recentNews24h: number;
        recentNews48h: number;
    };
    actionsTaken: string[];
    finalStats: {
        totalNews: number;
        recentNews24h: number;
        recentNews48h: number;
    };
    success: boolean;
    issues: string[];
    recommendations: string[];
}
declare class DataCrisisFixer {
    private pool;
    constructor();
    testConnection(): Promise<boolean>;
    getCurrentStats(): Promise<{
        totalNews: number;
        recentNews24h: number;
        recentNews48h: number;
    }>;
    insertEmergencyData(): Promise<number>;
    fixTimestamps(): Promise<number>;
    executeCrisisFix(): Promise<DataCrisisFixResult>;
    formatReport(result: DataCrisisFixResult): string;
    close(): Promise<void>;
}
export { DataCrisisFixer };
//# sourceMappingURL=fix_data_crisis.d.ts.map