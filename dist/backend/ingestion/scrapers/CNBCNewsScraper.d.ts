import { NewsItem } from '../NewsAggregator';
export declare class CNBCNewsScraper {
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
     * Récupère les news de CNBC (US Markets) via RSS
     * Plus pertinent pour le S&P 500 (ES Futures) que ZoneBourse.
     */
    fetchNews(): Promise<NewsItem[]>;
}
//# sourceMappingURL=CNBCNewsScraper.d.ts.map