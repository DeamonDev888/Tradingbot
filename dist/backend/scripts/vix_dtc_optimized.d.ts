import { EventEmitter } from 'events';
export interface VIXRealTimeData {
    symbol: string;
    lastPrice: number;
    bid: number;
    ask: number;
    bidSize: number;
    askSize: number;
    volume: number;
    timestamp: Date;
    change: number;
    changePercent: number;
    sessionDate: string;
}
export interface VIXHistoricalData {
    symbol: string;
    date: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    barInterval: number;
}
export interface DTCMessage {
    Type: number;
    [key: string]: any;
}
export declare class SierraChartDTCOptimized extends EventEmitter {
    private ws;
    private host;
    private port;
    private isConnected;
    private isAuthenticated;
    private heartbeatInterval;
    private messageCount;
    private lastReceivedData;
    constructor(host?: string, port?: number);
    /**
     * Connexion au serveur DTC de Sierra Chart
     */
    connect(): Promise<void>;
    /**
     * Envoyer un message DTC au bon format
     */
    private sendDTCMessage;
    /**
     * LOGON_REQUEST (Type 1)
     */
    private sendLogon;
    /**
     * LOGON_RESPONSE (Type 1)
     */
    private handleLogonResponse;
    /**
     * Démarrer le heartbeat
     */
    private startHeartbeat;
    /**
     * Envoyer un heartbeat
     */
    private sendHeartbeat;
    /**
     * Souscrire au VIX en temps réel (Type 2002)
     */
    subscribeToVIXRealTime(symbol?: string): void;
    /**
     * Demander un snapshot des données VIX (Type 2003)
     */
    requestVIXSnapshot(symbol?: string): void;
    /**
     * Demander les données historiques du VIX (Type 2006)
     */
    requestVIXHistoricalData(symbol?: string, startDate?: Date, // 30 jours par défaut
    endDate?: Date, barInterval?: number): void;
    /**
     * Traitement des messages reçus
     */
    private handleMessage;
    /**
     * Traitement individuel des messages DTC
     */
    private processDTCMessage;
    /**
     * MARKET_DATA (Type 3001) - Données temps réel
     */
    private handleMarketData;
    /**
     * HISTORICAL_PRICE_DATA (Type 3006) - Données historiques
     */
    private handleHistoricalData;
    /**
     * Méthode utilitaire pour obtenir rapidement le prix actuel du VIX
     */
    getCurrentVIXPrice(): Promise<number>;
    /**
     * Déconnexion propre
     */
    disconnect(): void;
    /**
     * Vérifier le statut
     */
    getStatus(): {
        connected: boolean;
        authenticated: boolean;
    };
}
export default SierraChartDTCOptimized;
//# sourceMappingURL=vix_dtc_optimized.d.ts.map