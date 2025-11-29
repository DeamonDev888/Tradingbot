export interface NewsItem {
    title: string;
    source: string;
    url: string;
    sentiment?: 'bullish' | 'bearish' | 'neutral';
    timestamp: Date;
    content?: string;
}
export declare class NewsAggregator {
    private fredClient;
    private finnhubClient;
    private teScraper;
    private pool;
    constructor();
    /**
     * Récupère les news via RSS pour ZeroHedge (Beaucoup plus fiable que le scraping HTML)
     */
    fetchZeroHedgeHeadlines(): Promise<NewsItem[]>;
    /**
     * Récupère les news de CNBC (US Markets) via RSS
     * Plus pertinent pour le S&P 500 (ES Futures) que ZoneBourse.
     */
    fetchCNBCMarketNews(): Promise<NewsItem[]>;
    /**
     * Récupère les news de FinancialJuice via RSS
     * URL: https://www.financialjuice.com/feed.ashx?xy=rss
     */
    fetchFinancialJuice(): Promise<NewsItem[]>;
    /**
     * Récupère les indicateurs économiques via FRED
     */
    fetchFredEconomicData(): Promise<NewsItem[]>;
    /**
     * Récupère les news via Finnhub
     */
    fetchFinnhubNews(): Promise<NewsItem[]>;
    /**
     * Récupère le calendrier économique via TradingEconomics
     */
    fetchTradingEconomicsCalendar(): Promise<NewsItem[]>;
    /**
     * Récupère et sauvegarde les données de marché (ES Futures prioritaire)
     */
    fetchAndSaveMarketData(): Promise<void>;
    /**
     * Sauvegarde les news dans la base de données
     */
    saveNewsToDatabase(news: NewsItem[]): Promise<void>;
    /**
     * Récupère et sauvegarde toutes les news
     */
    fetchAndSaveAllNews(): Promise<NewsItem[]>;
}
//# sourceMappingURL=NewsAggregator.d.ts.map