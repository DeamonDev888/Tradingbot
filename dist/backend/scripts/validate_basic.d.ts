#!/usr/bin/env ts-node
interface BasicValidationReport {
    connected: boolean;
    totalNews: number;
    recentNews24h: number;
    recentNews7d: number;
    todayNews: number;
    duplicates: number;
    qualityIssues: number;
    errors: string[];
    warnings: string[];
    timestamp: Date;
}
declare class BasicValidator {
    private pool;
    constructor();
    testConnection(): Promise<boolean>;
    generateReport(): Promise<BasicValidationReport>;
    private detectIssues;
    printReport(report: BasicValidationReport): Promise<string>;
    close(): Promise<void>;
}
export { BasicValidator };
//# sourceMappingURL=validate_basic.d.ts.map