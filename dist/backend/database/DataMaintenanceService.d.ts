export interface MaintenanceConfig {
    rawNewsRetentionDays: number;
    processedNewsRetentionDays: number;
    analyzedNewsRetentionDays: number;
    minQualityScoreThreshold: number;
    duplicateThreshold: number;
    batchSize: number;
    preserveHistoricalPeriods: boolean;
    historicalPeriods: {
        name: string;
        startDate: Date;
        endDate: Date;
        description: string;
    }[];
}
export interface MaintenanceResult {
    timestamp: Date;
    operation: string;
    recordsAffected: number;
    duration: number;
    details: {
        newsProcessed: number;
        newsDeleted: number;
        newsArchived: number;
        duplicatesRemoved: number;
        lowQualityRemoved: number;
        spaceRecovered: number;
    };
    errors: string[];
    warnings: string[];
}
export interface BacktestDataSummary {
    totalNews: number;
    dateRange: {
        start: Date;
        end: Date;
    };
    sentimentDistribution: Record<string, number>;
    sourceDistribution: Record<string, number>;
    qualityScoreDistribution: {
        high: number;
        medium: number;
        low: number;
    };
    marketEvents: {
        date: Date;
        description: string;
        importance: 'low' | 'medium' | 'high' | 'critical';
    }[];
}
export declare class DataMaintenanceService {
    private pool;
    private config;
    constructor(config?: Partial<MaintenanceConfig>);
    /**
     * Exécute la maintenance complète des données
     */
    performMaintenance(): Promise<MaintenanceResult[]>;
    /**
     * Maintenance des news avec conservation intelligente
     */
    maintainNewsData(): Promise<MaintenanceResult>;
    /**
     * Marquer les périodes historiques importantes à conserver
     */
    private markHistoricalPeriods;
    /**
     * Archiver les données importantes pour backtesting
     */
    private archiveImportantData;
    /**
     * Nettoyage des doublons
     */
    private cleanupDuplicates;
    /**
     * Nettoyage des données de faible qualité
     */
    private cleanupLowQualityData;
    /**
     * Archivage des anciennes données
     */
    archiveOldData(): Promise<MaintenanceResult>;
    /**
     * Assurer l'existence des tables d'archive
     */
    private ensureArchiveTables;
    /**
     * Optimisation de la base de données
     */
    optimizeDatabase(): Promise<MaintenanceResult>;
    /**
     * Mise à jour des statistiques
     */
    private updateStatistics;
    /**
     * Calculer l'espace récupéré
     */
    private calculateSpaceRecovered;
    /**
     * Générer un rapport de backtesting
     */
    generateBacktestReport(): Promise<BacktestDataSummary>;
    /**
     * Fermer les connexions
     */
    close(): Promise<void>;
}
//# sourceMappingURL=DataMaintenanceService.d.ts.map