import { Pool } from 'pg';
export interface VixNewsItem {
    title: string;
    url: string;
    published_at?: string;
    source_date?: Date;
    relative_time?: string;
    author?: string;
}
export interface VixInterpretation {
    level: 'VERY_LOW' | 'LOW' | 'NORMAL' | 'NERVOUS' | 'HIGH' | 'EXTREME';
    interpretation: string;
    sentiment: 'BULLISH_CALM' | 'BEARISH_NERVOUS' | 'NEUTRAL' | 'CRITICAL';
    expected_monthly_volatility: number;
    expected_weekly_volatility: number;
    expected_daily_move_range: number;
    alerts: VixAlert[];
    market_signal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL' | 'CAUTION';
    signal_strength: number;
}
export interface VixAlert {
    type: 'WARNING' | 'CRITICAL' | 'INFO';
    message: string;
    threshold: number;
    current_value: number;
    indicator: 'VIX' | 'VVIX' | 'RATIO';
}
export interface VvixScrapeResult {
    source: string;
    value: number | null;
    change_abs: number | null;
    change_pct: number | null;
    last_update: string | null;
    error?: string;
}
export interface VixScrapeResult {
    source: string;
    value: number | null;
    change_abs: number | null;
    change_pct: number | null;
    previous_close: number | null;
    open: number | null;
    high: number | null;
    low: number | null;
    last_update: string | null;
    news_headlines: VixNewsItem[];
    error?: string;
    vvix_data?: VvixScrapeResult;
    interpretation?: VixInterpretation;
}
export declare class VixPlaywrightScraper {
    private browser;
    private cache;
    private metrics;
    constructor();
    init(): Promise<void>;
    close(): Promise<void>;
    private createStealthPage;
    private humanDelay;
    private getCacheKey;
    private isCacheValid;
    private getCachedData;
    private setCachedData;
    scrapeWithTimeout(source: string, scrapeFn: () => Promise<VixScrapeResult>, timeout?: number): Promise<VixScrapeResult>;
    scrapeAll(): Promise<VixScrapeResult[]>;
    private scrapeWithMetrics;
    private updateAverageResponseTime;
    private logMetrics;
    getMetrics(): {
        sourceMetrics: {
            [k: string]: {
                success: boolean;
                responseTime: number;
                error?: string;
            };
        };
        totalRequests: number;
        successfulRequests: number;
        failedRequests: number;
        averageResponseTime: number;
        cacheHits: number;
    };
    resetMetrics(): void;
    scrapeMarketWatch(): Promise<VixScrapeResult>;
    scrapeInvesting(): Promise<VixScrapeResult>;
    private extractInvestingNewsFast;
    scrapeYahoo(): Promise<VixScrapeResult>;
    private handleYahooConsentRedirect;
    private handleYahooConsentPopup;
    private extractYahooNewsFast;
    private extractYahooNewsWithTimeout;
    private extractMarketWatchNewsWithTimeout;
    private processMarketWatchContainer;
    private extractText;
    private parseNumber;
    private parseRange;
    saveToDatabase(pool: Pool, results: VixScrapeResult[]): Promise<void>;
    saveNewsToDatabase(pool: Pool, results: VixScrapeResult[]): Promise<void>;
    private parseRelativeDate;
    scrapeVVIX(): Promise<VvixScrapeResult>;
    private extractVVIXValue;
    generateVixInterpretation(vixValue: number, vvixValue: number | null): VixInterpretation;
    private generateMarketSignal;
    formatInterpretationForDisplay(interpretation: VixInterpretation): string[];
}
//# sourceMappingURL=VixPlaywrightScraper.d.ts.map