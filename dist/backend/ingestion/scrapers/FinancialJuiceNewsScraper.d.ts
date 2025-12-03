import { NewsItem } from '../NewsAggregator';
export declare class FinancialJuiceNewsScraper {
    private newsScraper;
    constructor();
    init(): Promise<void>;
    close(): Promise<void>;
    /**
     * Scrapes the full content of an article from its URL.
     */
    private scrapeArticleContent;
    /**
     * Scores an RSS item based on financial keywords for better ranking.
     */
    private scoreItem;
    /**
     * Récupère les news de FinancialJuice via RSS
     * URL: https://www.financialjuice.com/feed.ashx?xy=rss
     */
    fetchNews(): Promise<NewsItem[]>;
}
//# sourceMappingURL=FinancialJuiceNewsScraper.d.ts.map