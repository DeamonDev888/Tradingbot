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
}
/**
 * Client DTC binaire pour Sierra Chart
 * Utilise le protocole natif Sierra Chart au lieu de WebSocket
 */
export declare class SierraChartDTCClient extends EventEmitter {
    private socket;
    private config;
    private isConnected;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectDelay;
    constructor(config: SierraChartConfig);
    /**
     * Connexion au serveur Sierra Chart via TCP
     */
    connect(): Promise<void>;
    /**
     * Construction des messages DTC (format simplifié)
     */
    private buildDTCMessage;
    /**
     * Envoyer l'authentification
     */
    private sendAuthentication;
    /**
     * S'abonner aux données du VIX
     */
    subscribeToVIX(): void;
    /**
     * Traitement des données reçues
     */
    private handleData;
    /**
     * Extraire des données de marché d'une chaîne de caractères
     */
    private extractMarketData;
    /**
     * Traitement des messages structurés
     */
    private processMessage;
    /**
     * Gestion des données de marché
     */
    private handleMarketData;
    /**
     * Gestion de la reconnexion
     */
    private handleReconnect;
    /**
     * Déconnexion
     */
    disconnect(): void;
}
export default SierraChartDTCClient;
//# sourceMappingURL=vix_dtc_binary.d.ts.map