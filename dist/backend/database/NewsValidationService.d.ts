import { NewsItem } from '../ingestion/NewsAggregator';
export interface ValidationRule {
    name: string;
    critical: boolean;
    penalty: number;
    description: string;
}
export interface ValidationResult {
    isValid: boolean;
    qualityScore: number;
    errors: string[];
    warnings: string[];
    appliedRules: string[];
    processedItem?: ProcessedNewsItem;
}
export interface ProcessedNewsItem extends NewsItem {
    id?: string;
    title_hash: string;
    url_hash: string;
    data_quality_score: number;
    processing_status: 'raw' | 'processed' | 'analyzed' | 'rejected';
    market_hours: 'pre-market' | 'market' | 'after-hours' | 'extended';
    duplicate_count: number;
    keywords: string[];
    normalized_title: string;
    normalized_url: string;
    content?: string;
    author?: string;
    scraped_at: Date;
    created_at: Date;
    updated_at: Date;
    sentiment?: 'bullish' | 'bearish' | 'neutral';
    confidence?: number;
}
export declare class NewsValidationService {
    private pool;
    private validationRules;
    private sourceReliability;
    private financialKeywords;
    constructor();
    /**
     * Valide un item de news avant insertion
     */
    validateNewsItem(item: NewsItem): Promise<ValidationResult>;
    /**
     * Valide et traite un lot de news
     */
    validateNewsBatch(items: NewsItem[]): Promise<ValidationResult[]>;
    /**
     * Applique une règle de validation spécifique
     */
    private applyRule;
    /**
     * Validation de la longueur du titre
     */
    private validateTitleLength;
    /**
     * Validation de la qualité du titre
     */
    private validateTitleQuality;
    /**
     * Validation du format de l'URL
     */
    private validateUrlFormat;
    /**
     * Validation des URL raccourcies
     */
    private validateUrlShortener;
    /**
     * Validation de la fiabilité de la source
     */
    private validateSourceReliability;
    /**
     * Validation de la qualité du contenu
     */
    private validateContentQuality;
    /**
     * Validation de la validité de la date
     */
    private validateDateValidity;
    /**
     * Validation de détection de doublons
     */
    private validateDuplicateDetection;
    /**
     * Validation de détection de spam
     */
    private validateSpamDetection;
    /**
     * Validation de la pertinence financière
     */
    private validateFinancialRelevance;
    /**
     * Détecte les doublons dans un batch
     */
    private detectBatchDuplicates;
    /**
     * Génère un hash SHA256 pour un titre normalisé
     */
    private generateTitleHash;
    /**
     * Génère un hash SHA256 pour une URL normalisée
     */
    private generateUrlHash;
    /**
     * Normalise un titre pour le hashage
     */
    private normalizeTitle;
    /**
     * Normalise une URL pour le hashage
     */
    private normalizeUrl;
    /**
     * Détermine les heures de marché
     */
    private determineMarketHours;
    /**
     * Extrait les mots-clés pertinents
     */
    private extractKeywords;
    /**
     * Sauvegarde les news validées en base
     */
    saveValidatedNews(results: ValidationResult[]): Promise<{
        saved: number;
        duplicates: number;
        rejected: number;
        errors: string[];
    }>;
    /**
     * Met à jour les métriques de qualité
     */
    private updateQualityMetrics;
    /**
     * Ferme les connexions
     */
    close(): Promise<void>;
}
//# sourceMappingURL=NewsValidationService.d.ts.map