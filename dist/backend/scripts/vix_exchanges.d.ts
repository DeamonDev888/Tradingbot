import { EventEmitter } from 'events';
export interface CryptoData {
    symbol: string;
    exchange: string;
    lastPrice: number;
    bid: number;
    ask: number;
    volume: number;
    timestamp: Date;
    change: number;
    changePercent: number;
}
export declare class SierraChartExchangeClient extends EventEmitter {
    private ws;
    private isConnected;
    private isAuthenticated;
    constructor();
    connect(): Promise<void>;
    private authenticate;
    private sendMessage;
    private handleMessage;
    private processMessage;
    private handleMarketData;
    private detectExchange;
    private getExchangeIcon;
    private subscribeToExchanges;
    private subscribeToSymbol;
    private requestSnapshot;
    /**
     * Obtenir rapidement le prix d'un symbole
     */
    getPrice(symbol: string): Promise<number | null>;
    disconnect(): void;
}
export default SierraChartExchangeClient;
//# sourceMappingURL=vix_exchanges.d.ts.map