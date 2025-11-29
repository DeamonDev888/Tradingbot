/**
 * Script pour enrichir le Vortex500Agent avec capture de données détaillées
 * à chaque inference pour algorithmes avancés
 */
import { Vortex500Agent } from '../agents/Vortex500Agent';
/**
 * Agent de sentiment enrichi avec capture de données détaillées
 */
declare class EnhancedVortex500Agent extends Vortex500Agent {
    private analysisStartTime;
    private newsItemsData;
    /**
     * Enrichir l'analyse avec des données avancées
     */
    private enrichAnalysisData;
    /**
     * Déterminer la session de marché actuelle
     */
    private determineMarketSession;
    /**
     * Calculer une estimation de volatilité basée sur les données
     */
    private calculateVolatility;
    /**
     * Déterminer le régime de marché
     */
    private determineMarketRegime;
    /**
     * Calculer la force du sentiment
     */
    private calculateSentimentStrength;
    /**
     * Générer les insights clés pour algorithmes
     */
    private generateKeyInsights;
    /**
     * Générer les signaux de trading
     */
    private generateTradingSignals;
    /**
     * Déterminer le biais technique
     */
    private determineTechnicalBias;
    /**
     * Évaluer l'impact des news
     */
    private evaluateNewsImpact;
    /**
     * Calculer la confiance de l'algorithme
     */
    private calculateAlgorithmConfidence;
    /**
     * Créer les métadonnées
     */
    private createMetadata;
    /**
     * Créer les flags de validation
     */
    private createValidationFlags;
    /**
     * Créer les métriques de performance
     */
    private createPerformanceMetrics;
    /**
     * Calculer la qualité des données
     */
    private calculateDataQuality;
    /**
     * Surcharge pour capturer les données enrichies
     */
    analyzeMarketSentiment(forceRefresh?: boolean): Promise<any>;
    /**
     * Créer une réponse N/A enrichie
     */
    private createNotAvailableEnhancedResult;
}
/**
 * Script pour tester l'agent enrichi
 */
declare function testEnhancedAgent(): Promise<void>;
export { EnhancedVortex500Agent, testEnhancedAgent };
//# sourceMappingURL=enhance_sentiment_agent.d.ts.map