/**
 * Utilitaire de formatage TOON (Token-Oriented Object Notation)
 * Optimise la sérialisation des données pour les prompts LLM.
 */
export declare class ToonFormatter {
    /**
     * Convertit un tableau d'objets JSON en format TOON tabulaire.
     * @param keyName Le nom de la clé parente (ex: "users")
     * @param data Tableau d'objets uniformes
     */
    static arrayToToon(keyName: string, data: any[]): string;
    /**
     * Convertit un objet JSON complet en TOON (récursif simplifié ou hybride)
     */
    static jsonToToon(json: any): string;
}
//# sourceMappingURL=ToonFormatter.d.ts.map