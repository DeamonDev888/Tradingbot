import { BaseAgentSimple } from './BaseAgentSimple';
export declare class NewsFilterAgent extends BaseAgentSimple {
    private pool;
    private xScraperService;
    constructor();
    runFilterCycle(): Promise<void>;
    /**
     * Step 1: Scrape and save fresh X/Twitter news
     */
    private scrapeAndSaveXNews;
    /**
     * Save X news items to the same database table as other news
     */
    private saveXNewsToDatabase;
    private fetchPendingItems;
    private processBatch;
    private buildPrompt;
    private executeAndParse;
    private updateDatabase;
    close(): Promise<void>;
}
//# sourceMappingURL=NewsFilterAgent.d.ts.map