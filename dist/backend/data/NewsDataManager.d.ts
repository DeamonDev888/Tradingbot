export interface MarketAnalysisReport {
    period: {
        start_date: string;
        end_date: string;
        days_analyzed: number;
    };
    overall_sentiment: {
        bullish_percentage: number;
        bearish_percentage: number;
        neutral_percentage: number;
        dominant_sentiment: 'bullish' | 'bearish' | 'neutral';
    };
    market_activity: {
        total_news: number;
        average_news_per_day: number;
        peak_hours: Array<{
            hour: string;
            count: number;
        }>;
        market_hours_distribution: any;
    };
    top_trends: {
        keywords: Array<{
            keyword: string;
            count: number;
            trend: 'up' | 'down' | 'stable';
        }>;
        sources: Array<{
            source: string;
            count: number;
            percentage: number;
        }>;
    };
    daily_breakdown: Array<{
        date: string;
        news_count: number;
        sentiment: string;
        top_keywords: string[];
    }>;
}
export declare class NewsDataManager {
    private processor;
    private deduplicationService;
    constructor();
    /**
     * Exécute le pipeline complet de traitement des nouvelles
     */
    runDailyNewsPipeline(): Promise<void>;
    /**
     * Affiche les statistiques du jour
     */
    private displayTodayStats;
    /**
     * Retourne les heures avec le plus de news
     */
    private getPeakHours;
    /**
     * Génère un rapport d'analyse pour une période donnée
     */
    generateAnalysisReport(startDate: string, endDate: string): Promise<MarketAnalysisReport>;
    /**
     * Crée un rapport d'analyse à partir des résumés quotidiens
     */
    private createAnalysisReport;
    /**
     * Détermine le sentiment dominant d'une journée
     */
    private getDailySentiment;
    /**
     * Récupère les statistiques de déduplication
     */
    getDeduplicationStats(): Promise<{
        total_fingerprints: number;
        oldest_fingerprint: Date | null;
        newest_fingerprint: Date | null;
    }>;
    /**
     * Nettoie les anciens empreintes de déduplication
     */
    cleanOldFingerprints(daysToKeep?: number): Promise<number>;
    /**
     * Exporte les données en format CSV pour analyse externe
     */
    exportToCSV(startDate: string, endDate: string, outputPath?: string): Promise<string>;
}
//# sourceMappingURL=NewsDataManager.d.ts.map