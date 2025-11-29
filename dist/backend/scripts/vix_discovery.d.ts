import { EventEmitter } from 'events';
interface SymbolInfo {
    symbol: string;
    exchange?: string;
    description?: string;
    hasData: boolean;
    price?: number;
}
export declare class SierraChartSymbolDiscovery extends EventEmitter {
    private ws;
    private isConnected;
    private isAuthenticated;
    private discoveredSymbols;
    private messageCount;
    constructor();
    connect(): Promise<void>;
    private authenticate;
    private sendMessage;
    private handleMessage;
    private processMessage;
    private handleMarketData;
    private handleMarketDataReject;
    private handleMarketDepth;
    private handleHistoricalData;
    private startDiscovery;
    private testStandardSymbols;
    private testExchangeFormats;
    private testPatternSymbols;
    private requestAvailableSymbols;
    private requestSymbol;
    private printDiscoveryStatus;
    getDiscoveredSymbols(): SymbolInfo[];
    getSymbolsWithData(): SymbolInfo[];
    disconnect(): void;
}
export default SierraChartSymbolDiscovery;
//# sourceMappingURL=vix_discovery.d.ts.map