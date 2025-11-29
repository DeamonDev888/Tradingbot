import { EventEmitter } from 'events';
export interface VIXData {
    symbol: string;
    lastPrice: number;
    timestamp: Date;
    change: number;
    changePercent: number;
    volume: number;
    source: string;
}
export declare class VIXFileReader extends EventEmitter {
    private sierraDataPath;
    private watchInterval;
    private lastPrice;
    constructor(dataPath?: string);
    /**
     * Vérifie si les fichiers VIX existent
     */
    private checkVIXFiles;
    /**
     * Tente de lire le prix actuel du VIX depuis les fichiers Sierra Chart
     */
    getCurrentVIXPrice(): Promise<VIXData | null>;
    /**
     * Lit un fichier SCID (intraday)
     */
    private readSCIDFile;
    /**
     * Lit un fichier DLY (daily)
     */
    private readDLYFile;
    /**
     * Extrait le dernier prix depuis un buffer binaire
     */
    private extractLastPrice;
    /**
     * Démarre la surveillance continue des fichiers VIX
     */
    startWatching(intervalMs?: number): void;
    /**
     * Arrête la surveillance
     */
    stopWatching(): void;
    /**
     * Vérifie et émet les données VIX
     */
    private checkAndEmitVIX;
    /**
     * Vérifie l'état des fichiers
     */
    checkFilesStatus(): void;
    /**
     * Statistiques du lecteur
     */
    getStats(): any;
}
export default VIXFileReader;
//# sourceMappingURL=vix_sierra_file_reader.d.ts.map