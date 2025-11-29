import { EventEmitter } from 'events';
export interface VIXData {
    symbol: string;
    lastPrice: number;
    bid: number;
    ask: number;
    volume: number;
    timestamp: Date;
    change: number;
    changePercent: number;
    open: number;
    high: number;
    low: number;
}
export interface SierraChartConfig {
    host: string;
    port: number;
    symbol?: string;
    username?: string;
    password?: string;
}
export declare class SierraChartVIXClient extends EventEmitter {
    private ws;
    private config;
    private isConnected;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectDelay;
    constructor(config: SierraChartConfig);
    /**
     * Connexion au serveur Sierra Chart
     */
    connect(): Promise<void>;
    /**
     * Envoie la requête de connexion/authentification
     */
    private sendLoginRequest;
    /**
     * S'abonner aux données du VIX
     */
    subscribeToVIX(): void;
    /**
     * Construction des messages au format DTC de Sierra Chart
     */
    private buildDTCMessage;
    /**
     * Traitement des messages reçus
     */
    private handleMessage;
    /**
     * Traitement individuel des messages
     */
    private processMessage;
    /**
     * Gestion de la réponse de connexion
     */
    private handleLoginResponse;
    /**
     * Gestion des données de marché
     */
    private handleMarketData;
    /**
     * Gestion des messages d'erreur
     */
    private handleErrorResponse;
    /**
     * Gestion de la reconnexion automatique
     */
    private handleReconnect;
    /**
     * Demander les données historiques du VIX
     */
    requestHistoricalData(daysBack?: number): Promise<void>;
    /**
     * Déconnexion
     */
    disconnect(): void;
    /**
     * Vérifier le statut de connexion
     */
    isReady(): boolean;
}
export default SierraChartVIXClient;
//# sourceMappingURL=get_vix_data.d.ts.map