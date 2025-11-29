export interface AgentRequest {
    prompt: string;
    inputFile?: string;
    outputFile: string;
    context?: unknown;
}
export declare abstract class BaseAgentSimple {
    protected agentName: string;
    protected dataDir: string;
    constructor(name: string);
    /**
     * Exécute KiloCode avec une approche robuste et simple
     */
    protected callKiloCode(req: AgentRequest): Promise<unknown>;
    /**
     * Exécute avec un fichier temporaire
     */
    private executeWithFile;
    /**
     * Exécute directement en ligne de commande
     */
    private executeDirect;
    /**
     * Parse le output KiloCode avec priorité aux metadata
     */
    private parseKiloCodeOutput;
    /**
     * Extrait le JSON d'un texte
     */
    private extractJson;
    /**
     * Valide et nettoie le JSON pour le SentimentAgent
     */
    private validateAndCleanJson;
}
//# sourceMappingURL=BaseAgentSimple.d.ts.map