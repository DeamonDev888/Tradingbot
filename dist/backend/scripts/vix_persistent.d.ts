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
export interface DTCMessage {
    Type: number;
    [key: string]: any;
}
export declare class SierraChartVIXPersistent extends EventEmitter {
    private ws;
    private host;
    private port;
    private isConnected;
    private isAuthenticated;
    private messageCount;
    private lastReceivedData;
    private heartbeatInterval;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private stayConnected;
    constructor(host?: string, port?: number);
    /**
     * Connexion persistante au serveur DTC
     */
    connect(): Promise<void>;
    /**
     * Gestion de la reconnexion automatique
     */
    private handleReconnect;
    /**
     * Envoyer un message DTC
     */
    private sendDTCMessage;
    /**
     * LOGON_REQUEST (Type 1)
     */
    private sendLogon;
    /**
     * LOGON_RESPONSE (Type 2)
     */
    private handleLogonResponse;
    /**
     * Démarrer la surveillance des symboles
     */
    private startSymbolMonitoring;
    /**
     * S'abonner à un symbole
     */
    private subscribeToSymbol;
    /**
     * Demander un snapshot
     */
    private requestSnapshot;
    /**
     * Heartbeat
     */
    private startHeartbeat;
    private sendHeartbeat;
    /**
     * Traitement des messages
     */
    private handleMessage;
    /**
     * Traitement des messages DTC
     */
    private processDTCMessage;
    /**
     * Données de marché
     */
    private handleMarketData;
    /**
     * Statistiques de connexion
     */
    getStats(): any;
    /**
     * Forcer l'arrêt
     */
    stop(): void;
    /**
     * Déconnexion
     */
    disconnect(): void;
}
export default SierraChartVIXPersistent;
//# sourceMappingURL=vix_persistent.d.ts.map