import { NewsItem } from '../ingestion/NewsAggregator';
export interface DatabaseNewsItem extends NewsItem {
    id?: string;
    content?: string;
    author?: string;
    scraped_at?: Date;
    sentiment?: 'bullish' | 'bearish' | 'neutral';
    confidence?: number;
    keywords?: string[];
    market_hours?: 'pre-market' | 'market' | 'after-hours' | 'extended';
    processing_status?: 'raw' | 'processed' | 'analyzed';
    created_at?: Date;
    updated_at?: Date;
}
export interface SentimentAnalysisRecord {
    id?: string;
    analysis_date: Date;
    overall_sentiment: 'bullish' | 'bearish' | 'neutral';
    score: number;
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
    confidence: number;
    catalysts: string[];
    summary: string;
    news_count: number;
    sources_analyzed: Record<string, number>;
    created_at?: Date;
}
export interface NewsSource {
    id?: string;
    name: string;
    base_url?: string;
    rss_url?: string;
    last_scraped_at?: Date;
    last_success_at?: Date;
    success_count: number;
    error_count: number;
    is_active: boolean;
    scrape_interval_minutes: number;
}
export declare class NewsDatabaseService {
    private pool;
    constructor(connectionString?: string);
    /**
     * Parse les instructions SQL en gérant correctement les fonctions PL/pgSQL
     */
    private parseSQLStatements;
    /**
     * Initialise la base de données avec le schéma
     */
    private initializeDatabase;
    /**
     * Teste la connexion à la base de données
     */
    testConnection(): Promise<boolean>;
    /**
     * Récupère les news récentes depuis la base de données
     */
    getRecentNews(hoursBack?: number, sources?: string[]): Promise<DatabaseNewsItem[]>;
    /**
     * Sauvegarde les news dans la base de données
     */
    saveNewsItems(newsItems: NewsItem[]): Promise<number>;
    /**
     * Récupère les news pour l'analyse de sentiment
     */
    getNewsForAnalysis(hoursBack?: number): Promise<DatabaseNewsItem[]>;
    /**
     * Sauvegarde une analyse de sentiment
     */
    saveSentimentAnalysis(analysis: any): Promise<string>;
    /**
     * Récupère la dernière analyse de sentiment
     */
    getLatestSentimentAnalysis(): Promise<SentimentAnalysisRecord | null>;
    /**
     * Vérifie si le cache de news est à jour
     */
    isCacheFresh(maxAgeHours?: number): Promise<boolean>;
    /**
     * Met à jour le statut d'une source
     */
    updateSourceStatus(sourceName: string, success: boolean, error?: string): Promise<void>;
    /**
     * Récupère les statistiques de la base de données
     */
    getDatabaseStats(): Promise<any>;
    /**
     * Nettoie les anciennes données
     */
    cleanupOldData(daysToKeep?: number): Promise<void>;
    /**
     * Mappe un résultat de base de données vers un NewsItem
     */
    private mapRowToNewsItem;
    /**
     * Extrait les mots-clés d'un titre (version simplifiée)
     */
    private extractKeywords;
    /**
     * Détermine les heures de marché
     */
    private determineMarketHours;
    /**
     * Sauvegarde une analyse de sentiment enrichie avec les nouvelles colonnes
     */
    saveEnhancedSentimentAnalysis(analysis: any): Promise<string>;
    /**
     * Ajouter les données à la série temporelle de marché
     */
    private addToTimeSeries;
    /**
     * Calculer un score d'impact des news
     */
    private calculateNewsImpactScore;
    /**
     * Estimer la tendance du volume de trading
     */
    private estimateTradingVolumeTrend;
    /**
     * Récupère les événements économiques
     */
    getEconomicEvents(startDate: Date, endDate: Date, minImportance?: number): Promise<any[]>;
    /**
     * Récupère les statistiques récentes (pour compatibilité)
     */
    getRecentStats(hours?: number): Promise<{
        totalNews: number;
        recentNews24h: number;
        recentNews48h: number;
        avgQueryTime: number;
    }>;
    /**
     * Ferme proprement la connexion à la base de données
     */
    close(): Promise<void>;
}
//# sourceMappingURL=NewsDatabaseService.d.ts.map