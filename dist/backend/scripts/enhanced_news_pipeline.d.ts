#!/usr/bin/env ts-node
interface PipelineConfig {
    enableValidation: boolean;
    enableDeduplication: boolean;
    enableQualityFiltering: boolean;
    enableMarketData: boolean;
    enableVIXData: boolean;
    minQualityScore: number;
    batchSize: number;
    maxParallelSources: number;
    enableBacktestData: boolean;
    preserveHistoricalEvents: boolean;
}
interface PipelineResult {
    timestamp: Date;
    duration: number;
    sources: {
        name: string;
        status: 'success' | 'partial' | 'failed';
        itemsFound: number;
        itemsValidated: number;
        itemsSaved: number;
        quality: {
            avg: number;
            min: number;
            max: number;
        };
        errors: string[];
    }[];
    total: {
        itemsFound: number;
        itemsValidated: number;
        itemsSaved: number;
        duplicatesRemoved: number;
        lowQualityRemoved: number;
        avgQualityScore: number;
        spaceRecovered: number;
    };
    marketData: {
        vixValue?: number;
        sp500Value?: number;
        timestamp: Date;
    };
    errors: string[];
    warnings: string[];
}
export declare class EnhancedNewsPipeline {
    private newsAggregator;
    private validationService;
    private databaseService;
    private maintenanceService;
    private vixScraper;
    private finnhubClient;
    private config;
    constructor(config?: Partial<PipelineConfig>);
    /**
     * Exécute le pipeline complet avec validation et déduplication
     */
    runPipeline(): Promise<PipelineResult>;
    /**
     * Récupère les données de marché (VIX, S&P500)
     */
    private fetchMarketData;
    /**
     * Récupère les données VIX
     */
    private fetchVIXData;
    /**
     * Récupère les données S&P500
     */
    private fetchSP500Data;
    /**
     * Récupère les nouvelles depuis toutes les sources en parallèle
     */
    private fetchAllNews;
    /**
     * Valide un lot de nouvelles
     */
    private validateNewsBatch;
    /**
     * Met à jour les statistiques du pipeline
     */
    private updatePipelineStatistics;
    /**
     * Finalise le pipeline et retourne le résultat
     */
    private finalizePipeline;
}
export {};
//# sourceMappingURL=enhanced_news_pipeline.d.ts.map