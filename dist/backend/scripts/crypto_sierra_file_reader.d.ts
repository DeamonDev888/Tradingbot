import { EventEmitter } from 'events';
export interface CryptoData {
    symbol: string;
    lastPrice: number;
    timestamp: Date;
    change: number;
    changePercent: number;
    volume: number;
    source: string;
    exchange?: string;
}
export declare class CryptoFileReader extends EventEmitter {
    private sierraDataPath;
    private watchInterval;
    private lastPrices;
    constructor(dataPath?: string);
    /**
     * Liste les symboles crypto disponibles dans les fichiers Sierra Chart
     */
    getAvailableCryptoSymbols(): string[];
    /**
     * Tente de lire le prix actuel d'un symbole crypto
     */
    getCryptoPrice(symbol: string): Promise<CryptoData | null>;
    /**
     * Lit tous les symboles crypto disponibles
     */
    getAllCryptoPrices(): Promise<CryptoData[]>;
    /**
     * Lit un fichier SCID (intraday)
     */
    private readSCIDFile;
    /**
     * Lit un fichier DLY (daily)
     */
    private readDLYFile;
    /**
     * Extrait le prix d'un crypto depuis un buffer
     */
    private extractCryptoPrice;
    /**
     * Extrait l'exchange depuis le symbole
     */
    private extractExchange;
    /**
     * Démarre la surveillance continue des crypto-monnaies
     */
    startWatching(intervalMs?: number): void;
    /**
     * Arrête la surveillance
     */
    stopWatching(): void;
    /**
     * Vérifie et émet les données crypto
     */
    private checkAndEmitCrypto;
    /**
     * Obtenir l'emoji approprié pour chaque crypto
     */
    private getCryptoEmoji;
    /**
     * Vérifie l'état des fichiers
     */
    checkFilesStatus(): void;
    /**
     * Statistiques du lecteur
     */
    getStats(): any;
}
export default CryptoFileReader;
//# sourceMappingURL=crypto_sierra_file_reader.d.ts.map