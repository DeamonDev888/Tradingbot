import { NewsItem } from '../ingestion/NewsAggregator';
export interface ProcessedNewsData {
    date: string;
    hour: string;
    timestamp: Date;
    source: string;
    title: string;
    url: string;
    sentiment?: 'bullish' | 'bearish' | 'neutral';
    keywords: string[];
    market_hours: 'pre-market' | 'market' | 'after-hours' | 'extended';
}
export interface DailyNewsSummary {
    date: string;
    total_news: number;
    by_hour: Record<string, ProcessedNewsData[]>;
    by_source: Record<string, ProcessedNewsData[]>;
    sentiment_distribution: {
        bullish: number;
        bearish: number;
        neutral: number;
        unknown: number;
    };
    market_hours_distribution: {
        'pre-market': number;
        market: number;
        'after-hours': number;
        extended: number;
    };
    top_keywords: Array<{
        keyword: string;
        count: number;
    }>;
}
export declare class NewsDataProcessor {
    private dataDir;
    private processedDataDir;
    constructor();
    /**
     * Nettoie et traite les nouvelles brutes
     */
    processNews(newsItems: NewsItem[]): Promise<ProcessedNewsData[]>;
    /**
     * Nettoie une nouvelle et la classe par jour/heure
     */
    private cleanAndClassify;
    /**
     * Nettoie le titre du contenu superflu
     */
    private cleanTitle;
    /**
     * Extrait les mots-clés pertinents pour le marché
     */
    private extractKeywords;
    /**
     * Détermine si c'est en heures de marché US
     */
    private determineMarketHours;
    /**
     * Formate la date en YYYY-MM-DD
     */
    private formatDate;
    /**
     * Formate l'heure en HH:00
     */
    private formatHour;
    /**
     * Sauvegarde les données traitées
     */
    saveProcessedNews(data: ProcessedNewsData[]): Promise<void>;
    /**
     * Regroupe les nouvelles par date
     */
    private groupByDate;
    /**
     * Crée un résumé journalier
     */
    private createDailySummary;
    /**
     * Charge les données traitées pour une date spécifique
     */
    loadDailyData(date: string): Promise<DailyNewsSummary | null>;
    /**
     * Récupère les dates disponibles
     */
    getAvailableDates(): Promise<string[]>;
}
//# sourceMappingURL=NewsDataProcessor.d.ts.map