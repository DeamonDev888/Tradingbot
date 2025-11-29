import { Pool } from 'pg';
export interface VixScrapeResult {
    source: string;
    value: number | null;
    change_abs: number | null;
    change_pct: number | null;
    last_update: string | null;
    error?: string;
}
export declare class VixCboeScraper {
    private pool;
    constructor(pool: Pool);
    /**
     * Scrape depuis CBOE (source officielle VIX)
     * Alternative fiable quand les sites web sont bloqués
     */
    scrapeCboeVix(): Promise<VixScrapeResult>;
    /**
     * Alternative: utiliser Alpha Vantage API si disponible
     */
    scrapeAlphaVantage(): Promise<VixScrapeResult>;
    /**
     * Sauvegarder les résultats en base de données
     */
    saveToDatabase(results: VixScrapeResult[]): Promise<void>;
}
//# sourceMappingURL=VixCboeScraper.d.ts.map