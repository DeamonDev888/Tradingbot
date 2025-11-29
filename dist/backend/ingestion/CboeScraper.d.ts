import { Pool } from 'pg';
export interface OexScrapeResult {
    source: string;
    put_call_ratio: number | null;
    timestamp: string | null;
    error?: string;
}
export declare class CboeScraper {
    private browser;
    init(): Promise<void>;
    close(): Promise<void>;
    private createStealthPage;
    scrapeOexRatio(): Promise<OexScrapeResult>;
    saveToDatabase(pool: Pool, result: OexScrapeResult): Promise<void>;
}
//# sourceMappingURL=CboeScraper.d.ts.map