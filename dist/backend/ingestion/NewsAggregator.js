"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsAggregator = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const FredClient_1 = require("./FredClient");
const FinnhubClient_1 = require("./FinnhubClient");
const pg_1 = require("pg");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
class NewsAggregator {
    fredClient;
    finnhubClient;
    pool;
    constructor() {
        this.fredClient = new FredClient_1.FredClient();
        this.finnhubClient = new FinnhubClient_1.FinnhubClient();
        this.pool = new pg_1.Pool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'financial_analyst',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '9022',
        });
    }
    /**
     * Récupère les news via RSS pour ZeroHedge (Beaucoup plus fiable que le scraping HTML)
     */
    async fetchZeroHedgeHeadlines() {
        try {
            // Flux RSS officiel de ZeroHedge
            const { data } = await axios_1.default.get('http://feeds.feedburner.com/zerohedge/feed', {
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NovaQuoteAgent/1.0)' },
                timeout: 5000,
            });
            const $ = cheerio.load(data, { xmlMode: true });
            const news = [];
            $('item').each((_, el) => {
                const title = $(el).find('title').text().trim();
                const link = $(el).find('link').text().trim();
                const pubDate = $(el).find('pubDate').text();
                if (title && link) {
                    news.push({
                        title,
                        source: 'ZeroHedge',
                        url: link,
                        timestamp: new Date(pubDate),
                    });
                }
            });
            return news.slice(0, 10); // Top 10 news
        }
        catch (error) {
            console.error('Error fetching ZeroHedge RSS:', error instanceof Error ? error.message : error);
            return [];
        }
    }
    /**
     * Récupère les news de CNBC (US Markets) via RSS
     * Plus pertinent pour le S&P 500 (ES Futures) que ZoneBourse.
     */
    async fetchCNBCMarketNews() {
        try {
            // Flux RSS CNBC Finance
            const { data } = await axios_1.default.get('https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664', {
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NovaQuoteAgent/1.0)' },
                timeout: 5000,
            });
            const $ = cheerio.load(data, { xmlMode: true });
            const news = [];
            $('item').each((_, el) => {
                const title = $(el).find('title').text().trim();
                const link = $(el).find('link').text().trim();
                const pubDate = $(el).find('pubDate').text();
                if (title && link) {
                    news.push({
                        title,
                        source: 'CNBC',
                        url: link,
                        timestamp: new Date(pubDate),
                    });
                }
            });
            return news.slice(0, 10);
        }
        catch (error) {
            console.error('Error fetching CNBC RSS:', error instanceof Error ? error.message : error);
            return [];
        }
    }
    /**
     * Récupère les news de FinancialJuice via RSS
     * URL: https://www.financialjuice.com/feed.ashx?xy=rss
     */
    async fetchFinancialJuice() {
        try {
            const { data } = await axios_1.default.get('https://www.financialjuice.com/feed.ashx?xy=rss', {
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NovaQuoteAgent/1.0)' },
                timeout: 5000,
            });
            const $ = cheerio.load(data, { xmlMode: true });
            const news = [];
            $('item').each((_, el) => {
                const title = $(el).find('title').text().trim();
                const link = $(el).find('link').text().trim();
                const pubDate = $(el).find('pubDate').text();
                if (title && link) {
                    news.push({
                        title,
                        source: 'FinancialJuice',
                        url: link,
                        timestamp: new Date(pubDate),
                    });
                }
            });
            return news.slice(0, 20); // Top 20 news
        }
        catch (error) {
            console.error('Error fetching FinancialJuice RSS:', error instanceof Error ? error.message : error);
            return [];
        }
    }
    /**
     * Récupère les indicateurs économiques via FRED
     */
    async fetchFredEconomicData() {
        try {
            const indicators = await this.fredClient.fetchAllKeyIndicators();
            return indicators.map(ind => ({
                title: `[MACRO DATA] ${ind.title}: ${ind.value} (As of ${ind.date})`,
                source: 'FRED',
                // URL unique par date pour éviter la déduplication abusive si la valeur change
                url: `https://fred.stlouisfed.org/series/${ind.id}?date=${ind.date}`,
                timestamp: new Date(ind.date),
                sentiment: 'neutral', // Le sentiment sera analysé par l'IA
            }));
        }
        catch (error) {
            console.error('Error fetching FRED data:', error);
            return [];
        }
    }
    /**
     * Récupère les news via Finnhub
     */
    async fetchFinnhubNews() {
        try {
            const news = await this.finnhubClient.fetchMarketNews();
            return news.map(n => ({
                title: n.headline,
                source: 'Finnhub',
                url: n.url,
                timestamp: new Date(n.datetime * 1000), // Finnhub utilise des timestamps Unix
                sentiment: 'neutral',
            }));
        }
        catch (error) {
            console.error('Error fetching Finnhub news:', error);
            return [];
        }
    }
    /**
     * Placeholder pour TradingEconomics
     */
    async fetchTradingEconomicsCalendar() {
        return [];
    }
    /**
     * Sauvegarde les news dans la base de données
     */
    async saveNewsToDatabase(news) {
        if (news.length === 0)
            return;
        const client = await this.pool.connect();
        try {
            // Créer la table si elle n'existe pas
            await client.query(`
        CREATE TABLE IF NOT EXISTS news_items (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title VARCHAR(1000) NOT NULL,
            source VARCHAR(100) NOT NULL,
            url TEXT,
            content TEXT,
            sentiment VARCHAR(20),
            published_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(title, source, published_at)
        );
      `);
            let savedCount = 0;
            for (const item of news) {
                try {
                    await client.query(`
                INSERT INTO news_items (title, source, url, content, sentiment, published_at)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (title, source, published_at) DO NOTHING
            `, [item.title, item.source, item.url, item.content, item.sentiment, item.timestamp]);
                    savedCount++;
                }
                catch (e) {
                    console.error(`Failed to save news from ${item.source}:`, e);
                }
            }
            console.log(`💾 Saved ${savedCount} news items to database from ${news.length} fetched`);
        }
        catch (error) {
            console.error('❌ Database error saving news:', error);
        }
        finally {
            client.release();
        }
    }
    /**
     * Récupère et sauvegarde toutes les news
     */
    async fetchAndSaveAllNews() {
        console.log('📰 Starting comprehensive news aggregation...');
        const allNews = [];
        try {
            // Récupérer toutes les sources en parallèle
            const [zerohedge, cnbc, financialjuice, finnhub] = await Promise.allSettled([
                this.fetchZeroHedgeHeadlines(),
                this.fetchCNBCMarketNews(),
                this.fetchFinancialJuice(),
                this.fetchFinnhubNews(),
            ]);
            // Ajouter les résultats réussis
            if (zerohedge.status === 'fulfilled') {
                allNews.push(...zerohedge.value);
                console.log(`✅ ZeroHedge: ${zerohedge.value.length} news`);
            }
            if (cnbc.status === 'fulfilled') {
                allNews.push(...cnbc.value);
                console.log(`✅ CNBC: ${cnbc.value.length} news`);
            }
            if (financialjuice.status === 'fulfilled') {
                allNews.push(...financialjuice.value);
                console.log(`✅ FinancialJuice: ${financialjuice.value.length} news`);
            }
            if (finnhub.status === 'fulfilled') {
                allNews.push(...finnhub.value);
                console.log(`✅ Finnhub: ${finnhub.value.length} news`);
            }
            // Sauvegarder toutes les news
            await this.saveNewsToDatabase(allNews);
            console.log(`🎉 News aggregation completed: ${allNews.length} total news saved`);
            return allNews;
        }
        catch (error) {
            console.error('❌ Error during news aggregation:', error);
            return allNews;
        }
    }
}
exports.NewsAggregator = NewsAggregator;
