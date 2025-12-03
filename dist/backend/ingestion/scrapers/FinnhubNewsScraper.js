import axios from 'axios';
export class FinnhubNewsScraper {
    apiKey;
    constructor() {
        this.apiKey = process.env.FINNHUB_API_KEY || '';
        if (!this.apiKey) {
            console.warn('[FinnhubNewsScraper] No API key found in environment');
        }
    }
    async init() {
        // No initialization needed for API calls
    }
    async close() {
        // No cleanup needed
    }
    /**
     * Récupère les news via l'API Finnhub (100% fonctionnel)
     */
    async fetchNews() {
        if (!this.apiKey) {
            console.error('[FinnhubNewsScraper] No API key configured');
            return [];
        }
        try {
            console.log('[FinnhubNewsScraper] Fetching financial news from Finnhub...');
            // Categories disponibles: general, forex, crypto, merger
            const categories = ['general', 'forex', 'crypto'];
            let allNews = [];
            for (const category of categories) {
                try {
                    const url = `https://finnhub.io/api/v1/news?category=${category}&token=${this.apiKey}`;
                    const response = await axios.get(url, {
                        timeout: 10000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (compatible; NovaQuoteAgent/1.0)',
                        },
                    });
                    if (response.data && Array.isArray(response.data)) {
                        allNews = [...allNews, ...response.data];
                        console.log(`[FinnhubNewsScraper] Fetched ${response.data.length} items from ${category} category`);
                    }
                }
                catch (categoryError) {
                    console.warn(`[FinnhubNewsScraper] Failed to fetch ${category}:`, categoryError instanceof Error ? categoryError.message : categoryError);
                }
            }
            // Dédupliquer par ID
            const uniqueNews = Array.from(new Map(allNews.map(item => [item.id, item])).values());
            // Limiter aux 50 articles les plus récents
            const limitedNews = uniqueNews.slice(0, 50);
            // Convertir au format NewsItem
            const newsItems = limitedNews
                .filter(item => item.headline && item.url)
                .map(item => ({
                title: item.headline.substring(0, 200),
                source: item.source || 'Finnhub',
                url: item.url,
                published_at: new Date(item.datetime * 1000).toISOString(),
                content: item.summary || item.headline,
                sentiment: 'neutral',
                timestamp: new Date(item.datetime * 1000),
            }));
            console.log(`[FinnhubNewsScraper] Processed ${newsItems.length} unique news items`);
            return newsItems;
        }
        catch (error) {
            console.error('[FinnhubNewsScraper] Error fetching news:', error instanceof Error ? error.message : error);
            return [];
        }
    }
}
//# sourceMappingURL=FinnhubNewsScraper.js.map