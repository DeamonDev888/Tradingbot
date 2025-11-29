export interface VIXData {
    symbol: string;
    lastPrice: number;
    timestamp: Date;
    change: number;
    changePercent: number;
    volume: number;
    source: string;
}
export declare class VIXSetupAndGetter {
    private sierraPath;
    private dataPath;
    constructor();
    /**
     * Vérifie si le dossier de données existe
     */
    private ensureDataFolderExists;
    /**
     * Lance Sierra Chart avec les paramètres VIX
     */
    launchSierraChartWithVIX(): Promise<boolean>;
    /**
     * Vérifie quels fichiers VIX existent
     */
    checkVIXFiles(): string[];
    /**
     * Crée un fichier VIX de démonstration si nécessaire
     */
    createDemoVIXFile(): void;
    /**
     * Lit le prix VIX depuis les fichiers
     */
    getCurrentVIXPrice(): Promise<VIXData | null>;
    /**
     * Processus complet: démarrer Sierra Chart et obtenir VIX
     */
    setupAndGetVIX(): Promise<void>;
}
export default VIXSetupAndGetter;
//# sourceMappingURL=vix_setup_and_get.d.ts.map