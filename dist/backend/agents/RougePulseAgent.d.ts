import { BaseAgentSimple } from './BaseAgentSimple';
export interface NewsItem {
    id: string;
    title: string;
    content: string;
    source: string;
    url: string;
    published_at: Date;
}
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
     * Identifie les événements qui vont vraiment faire bouger le marché
     */
    private identifyMarketMovers;
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
     * Calcule le changement entre prévision et précédent
     */
    private calculateForecastChange;
    /**
     * Calcule le potentiel de surprise
     */
    private calculateSurprisePotential;
    /**
     * Explique pourquoi un événement est critique
     */
    private explainWhyCritical;
    /**
     * Calcule un score de volatilité global
     */
    private calculateVolatilityScore;
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
     * Génère un résumé avancé avec mise en évidence
     */
    private generateAdvancedSummary;
    /**
     * Génère un résumé pour un planning plus court
     */
    private generateCalendarSummary;
    /**
     * Groupe les événements par importance et par jour
     */
    private groupEventsByImportance;
    /**
     * Alertes pour les prochaines 24h
     */
    private getNext24HoursAlerts;
    close(): Promise<void>;
}
//# sourceMappingURL=RougePulseAgent.d.ts.map