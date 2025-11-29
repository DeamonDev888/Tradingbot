export interface FinnhubNews {
    category: string;
    datetime: number;
    headline: string;
    id: number;
    image: string;
    related: string;
    source: string;
    summary: string;
    url: string;
}
export interface StockData {
    current: number;
    change: number;
    percent_change: number;
    high: number;
    low: number;
    open: number;
    previous_close: number;
    timestamp: number;
    symbol: string;
}
export declare class FinnhubClient {
    private apiKey;
    private baseUrl;
    private futuresScraper;
    constructor();
    /**
     * Récupère les news générales du marché
     */
    fetchMarketNews(): Promise<FinnhubNews[]>;
    /**
     * Récupère le sentiment des news (si disponible dans le plan gratuit)
     * Sinon, on se contente des news brutes
     */
    fetchNewsSentiment(): Promise<any>;
    /**
     * Récupère les données de marché d'un indice ou action en temps réel
     * Utilise l'endpoint /quote pour les données actuelles
     */
    fetchQuote(symbol: string): Promise<StockData | null>;
    /**
     * Récupère spécifiquement les données du contrat future ES (E-mini S&P 500)
     * Méthode améliorée avec scraping prioritaire pour obtenir le vrai prix du contrat future S&P500
     */
    fetchESFutures(): Promise<StockData | null>;
    /**
     * Récupère spécifiquement les données du S&P 500
     * Version corrigée qui essaie d'abord les vrais contrats futures
     */
    fetchSP500Data(): Promise<StockData | null>;
    /**
     * Récupère les données de plusieurs indices populaires en parallèle
     * Utilise les ETFs des indices car plus fiables que les indices bruts
     */
    fetchMultipleIndices(symbols?: string[]): Promise<StockData[]>;
    /**
     * Récupère les données des principaux indices boursiers avec des noms explicites
     */
    fetchMajorIndices(): Promise<{
        name: string;
        data: StockData;
    }[]>;
}
//# sourceMappingURL=FinnhubClient.d.ts.map