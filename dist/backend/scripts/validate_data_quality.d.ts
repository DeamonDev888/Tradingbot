interface ValidationReport {
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
}
export declare class DataQualityValidator {
    private dbService;
    constructor();
    runFullValidation(): Promise<ValidationReport>;
    private detectIssues;
    private calculateQualityScore;
    private generateRecommendations;
    generateDetailedReport(): Promise<string>;
    fixCommonIssues(): Promise<void>;
}
export {};
//# sourceMappingURL=validate_data_quality.d.ts.map