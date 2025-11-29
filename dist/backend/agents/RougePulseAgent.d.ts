import { BaseAgentSimple } from './BaseAgentSimple';
export declare class RougePulseAgent extends BaseAgentSimple {
    private dbService;
    private rpDbService;
    constructor();
    /**
     * Analyse du calendrier économique avec scoring avancé
     */
    analyzeMarketSentiment(_forceRefresh?: boolean): Promise<Record<string, unknown>>;
    /**
     * Classification avancée des événements par impact avec scoring intelligent
     */
    private classifyEventsByImpact;
    /**
     * Vérifie si c'est un indicateur clé qui fait bouger le marché
     */
    private isKeyMarketIndicator;
    /**
     * Formatage avancé avec score et alertes
     */
    private formatEventAdvanced;
    /**
     * Étiquette d'importance avec mise en évidence
     */
    private getImportanceLabel;
    /**
     * Niveau d'impact textuel
     */
    private getImpactLevel;
    /**
     * Couleur d'alerte selon l'importance
     */
    private getAlertColor;
    /**
     * Détermine si un mouvement de marché est attendu
     */
    private expectMarketMovement;
    /**
     * Calcule le changement entre prévision et précédent
     */
    private calculateForecastChange;
    /**
     * Calcule le potentiel de surprise
     */
    private calculateSurprisePotential;
    /**
     * Identifie les événements qui vont vraiment faire bouger le marché
     */
    private identifyMarketMovers;
    /**
     * Explique pourquoi un événement est critique
     */
    private explainWhyCritical;
    /**
     * Génère les alertes critiques
     */
    private generateCriticalAlerts;
    /**
     * Niveau d'urgence
     */
    private getUrgencyLevel;
    /**
     * Recommandation basée sur l'événement
     */
    private getRecommendation;
    /**
     * Génère un résumé avancé avec mise en évidence
     */
    private generateAdvancedSummary;
    /**
     * Calcule un score de volatilité global
     */
    private calculateVolatilityScore;
    /**
     * Groupe les événements par importance et par jour
     */
    private groupEventsByImportance;
    /**
     * Alertes pour les prochaines 24h
     */
    private getNext24HoursAlerts;
    private generateCalendarSummary;
    close(): Promise<void>;
}
//# sourceMappingURL=RougePulseAgent.d.ts.map