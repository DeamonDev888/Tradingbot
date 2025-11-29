#!/usr/bin/env ts-node
interface TestResult {
    timestamp: Date;
    databaseConnected: boolean;
    tablesExist: boolean;
    totalNews: number;
    recentNews24h: number;
    duplicates: number;
    qualityScore: number;
    issues: string[];
    recommendations: string[];
    success: boolean;
}
declare class ValidationTester {
    private pool;
    constructor();
    testConnection(): Promise<boolean>;
    testTables(): Promise<boolean>;
    analyzeDataQuality(): Promise<{
        totalNews: number;
        recentNews24h: number;
        duplicates: number;
        qualityScore: number;
    }>;
    detectIssues(data: {
        totalNews: number;
        recentNews24h: number;
        duplicates: number;
        qualityScore: number;
    }): Promise<string[]>;
    generateRecommendations(data: {
        totalNews: number;
        recentNews24h: number;
        duplicates: number;
        qualityScore: number;
    }): string[];
    runValidationTest(): Promise<TestResult>;
    printReport(result: TestResult): void;
    close(): Promise<void>;
}
export { ValidationTester };
//# sourceMappingURL=run_validation_tests.d.ts.map