import { Pool } from 'pg';
export interface CryptoPrice {
    symbol: string;
    price: number;
    change_24h: number;
    volume_24h: number;
    market_cap?: number;
}
export declare class BinanceScraper {
    private baseUrl;
    private targetSymbols;
    constructor();
    /**
     * Fetch 24hr ticker data for target symbols
     */
    fetchPrices(): Promise<CryptoPrice[]>;
    /**
     * Save prices to database
     */
    saveToDatabase(pool: Pool, prices: CryptoPrice[]): Promise<void>;
}
//# sourceMappingURL=BinanceScraper.d.ts.map