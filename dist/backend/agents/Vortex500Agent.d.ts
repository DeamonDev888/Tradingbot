import { BaseAgentSimple } from './BaseAgentSimple';
export declare class Vortex500Agent extends BaseAgentSimple {
    private dbService;
    private readonly execAsync;
    constructor();
    /**
     * Analyse de sentiment robuste et finale
     */
    analyzeMarketSentiment(_forceRefresh?: boolean): Promise<Record<string, unknown>>;
    /**
     * Récupère les news pour l'analyse avec paramètre personnalisé
     */
    private getNewsForAnalysisExtended;
    /**
     * Récupère toutes les news traitées (sans limite de temps)
     */
    private getAllProcessedNews;
    /**
     * Crée un résultat N/A standard
     */
    private createNotAvailableResult;
    /**
     * Analyse finale robuste avec fallback multiples
     */
    private performRobustSentimentAnalysis;
    /**
     * Crée le prompt optimisé pour KiloCode avec nettoyage des accents
     */
    private createOptimizedPrompt;
    /**
     * KiloCode DIRECT - Pas de fallback, N/A si échoue
     */
    private tryKiloCodeDirect;
    /**
     * Approche 1: Fichier database.md buffer avec format TOON (le plus propre)
     */
    private tryKiloCodeWithFile;
    /**
     * Crée le fichier buffer database.md avec format Markdown + TOON
     */
    private createDatabaseBufferMarkdown;
    /**
     * Parsing robust avec nettoyage ANSI et fallback multiples
     */
    private parseRobustOutput;
    /**
     * Vérifie si un résultat de sentiment est valide
     */
    private isValidSentimentResult;
    /**
     * Extrait JSON du contenu avec multiples patterns
     */
    private extractJsonFromContent;
    /**
     * Valide et normalise le résultat pour le SentimentAgent avec nettoyage
     */
    private validateSentimentResult;
    /**
     * Strip ANSI escape codes from a string
     */
    private stripAnsiCodes;
    /**
     * Crée un résultat validé avec nettoyage des caractères pour Discord
     */
    private createValidatedResult;
}
//# sourceMappingURL=Vortex500Agent.d.ts.map