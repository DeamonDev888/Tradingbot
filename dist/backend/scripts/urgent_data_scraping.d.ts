#!/usr/bin/env ts-node
interface UrgentScrapingResult {
    timestamp: Date;
    sourcesAttempted: string[];
    sourcesSuccessful: string[];
    itemsCollected: number;
    itemsInserted: number;
    errors: string[];
    duration: number;
    success: boolean;
}
declare class UrgentDataScraping {
    private newsAggregator;
    private dbService;
    constructor();
    testConnections(): Promise<{
        [source: string]: boolean;
    }>;
    executeUrgentScraping(): Promise<UrgentScrapingResult>;
    executeImmediateFollowUp(): Promise<{
        itemsAdded: number;
        finalCount: number;
    }>;
    formatReport(result: UrgentScrapingResult): string;
    close(): Promise<void>;
}
export { UrgentDataScraping };
//# sourceMappingURL=urgent_data_scraping.d.ts.map