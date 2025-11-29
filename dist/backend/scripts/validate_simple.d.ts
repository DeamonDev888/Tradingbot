#!/usr/bin/env ts-node
interface SimpleValidationReport {
    totalNews: number;
    recentNews24h: number;
    recentNews7d: number;
    duplicates: number;
    emptyTitles: number;
    invalidUrls: number;
    invalidSentiments: number;
    futureDates: number;
    veryOldDates: number;
    sourceDistribution: Record<string, number>;
    sentimentDistribution: Record<string, number>;
    qualityScore: number;
    issues: string[];
    recommendations: string[];
    timestamp: Date;
}
declare class SimpleDataValidator {
    private pool;
    constructor();
    testConnection(): Promise<boolean>;
    generateReport(): Promise<SimpleValidationReport>;
    private detectIssues;
    private calculateQualityScore;
    private generateRecommendations;
    printReport(report: SimpleValidationReport): Promise<string>;
    close(): Promise<void>;
}
export { SimpleDataValidator };
//# sourceMappingURL=validate_simple.d.ts.map