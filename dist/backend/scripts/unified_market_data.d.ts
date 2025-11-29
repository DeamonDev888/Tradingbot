import { EventEmitter } from 'events';
interface MarketData {
    symbol: string;
    assetType: 'CRYPTO' | 'VIX' | 'INDEX';
    lastPrice: number;
    change: number;
    changePercent: number;
    volume?: number;
    timestamp: Date;
    source: string;
}
declare class UnifiedMarketDataCollector extends EventEmitter {
    private isRunning;
    private dbInitialized;
    constructor();
    private initializeDatabase;
    private collectCryptoData;
    private collectVIXData;
    private storeMarketData;
    private getMarketSummary;
    start(): Promise<void>;
    stop(): Promise<void>;
}
export { UnifiedMarketDataCollector, MarketData };
//# sourceMappingURL=unified_market_data.d.ts.map