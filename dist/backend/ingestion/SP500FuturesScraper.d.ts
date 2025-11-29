export interface SP500FuturesData {
    current: number;
    change: number | null;
    percent_change: number | null;
    high: number | null;
    low: number | null;
    open: number | null;
    previous_close: number | null;
    symbol: string;
    source: string;
    support_levels?: number[];
    resistance_levels?: number[];
    key_levels?: string[];
    zero_hedge_analysis?: {
        technical_levels: string[];
        sentiment: string;
        key_messages: string[];
    };
}
export declare class SP500FuturesScraper {
    private browser;
    init(): Promise<void>;
    close(): Promise<void>;
    private createStealthPage;
    /**
     * Scrape ZeroHedge pour les niveaux techniques ET le prix (si mentionné)
     * Remplace les autres sources de prix (Investing/Yahoo)
     */
    scrapeZeroHedgeData(): Promise<SP500FuturesData | null>;
    /**
     * Scroll automatique pour charger le contenu dynamique
     */
    private autoScroll;
    /**
     * Vérifie si un texte contient des niveaux techniques S&P 500/ES
     */
    private containsTechnicalLevels;
    /**
     * Extrait les niveaux numériques d'un texte
     */
    private extractLevelsFromText;
    /**
     * Tente d'extraire un prix actuel du texte
     */
    private extractPriceFromText;
    /**
     * Analyse le sentiment d'un texte
     */
    private analyzeSentiment;
    /**
     * Point d'entrée principal - Focus ZeroHedge uniquement
     */
    fetchSP500FuturesWithZeroHedge(): Promise<SP500FuturesData | null>;
    /**
     * Alias pour compatibilité
     */
    fetchSP500Futures(): Promise<SP500FuturesData | null>;
}
//# sourceMappingURL=SP500FuturesScraper.d.ts.map