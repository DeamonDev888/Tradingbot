import axios from 'axios';
import * as cheerio from 'cheerio';
import { FredClient } from './FredClient';
import { FinnhubClient } from './FinnhubClient';
import { TradingEconomicsScraper } from './TradingEconomicsScraper';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();
export class NewsAggregator {
    fredClient;
    finnhubClient;
    teScraper;
    pool;
    constructor() {
        this.fredClient = new FredClient();
        this.finnhubClient = new FinnhubClient();
        this.teScraper = new TradingEconomicsScraper();
        this.pool = new Pool({
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
            const { data } = await axios.get('http://feeds.feedburner.com/zerohedge/feed', {
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
            const { data } = await axios.get('https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664', {
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
            const { data } = await axios.get('https://www.financialjuice.com/feed.ashx?xy=rss', {
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
     * Récupère le calendrier économique via TradingEconomics
     */
    async fetchTradingEconomicsCalendar() {
        try {
            const events = await this.teScraper.scrapeUSCalendar();
            // Sauvegarder les événements bruts dans leur propre table
            await this.teScraper.saveEvents(events);
            // Convertir en NewsItems pour le flux général
            return events.map(event => ({
                title: `[ECO CALENDAR] ${event.event} (${event.country}): Actual ${event.actual} vs Forecast ${event.forecast}`,
                source: 'TradingEconomics',
                url: 'https://tradingeconomics.com/united-states/calendar',
                timestamp: event.date,
                sentiment: 'neutral', // À analyser
                content: `Importance: ${event.importance}/3. Previous: ${event.previous}`,
            }));
        }
        catch (error) {
            console.error('Error fetching TradingEconomics calendar:', error);
            return [];
        }
    }
    /**
     * Récupère et sauvegarde les données de marché (ES Futures prioritaire)
     */
    async fetchAndSaveMarketData() {
        try {
            console.log('📈 Fetching market data (ES Futures priority)...');
            const stockData = await this.finnhubClient.fetchSP500Data();
            if (stockData) {
                const client = await this.pool.connect();
                try {
                    // Déterminer le type d'actif en fonction du symbole
                    let assetType = 'ETF';
                    let symbol = stockData.symbol;
                    if (stockData.symbol.includes('ES_FUTURES') ||
                        stockData.symbol.includes('ES_CONVERTED') ||
                        stockData.symbol.includes('ES_FROM_')) {
                        assetType = 'FUTURES';
                        symbol = 'ES'; // Standardiser pour ES Futures
                    }
                    else if (stockData.symbol === 'SPY') {
                        assetType = 'ETF';
                        symbol = 'SPY';
                    }
                    else if (stockData.symbol === 'QQQ') {
                        assetType = 'ETF';
                        symbol = 'QQQ';
                    }
                    await client.query(`INSERT INTO market_data
             (symbol, asset_type, price, change, change_percent, high, low, open, previous_close, source, timestamp)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Finnhub', NOW())`, [
                        symbol,
                        assetType,
                        stockData.current,
                        stockData.change,
                        stockData.percent_change,
                        stockData.high,
                        stockData.low,
                        stockData.open,
                        stockData.previous_close,
                    ]);
                    // Log détaillé pour comprendre la source des données
                    const sourceInfo = stockData.symbol.includes('ES_FUTURES')
                        ? ' (Futures directs)'
                        : stockData.symbol.includes('ES_FROM_SPY')
                            ? ' (via SPY)'
                            : stockData.symbol.includes('ES_FROM_QQQ')
                                ? ' (via QQQ)'
                                : ' (ETF)';
                    console.log(`✅ Market data saved for ${symbol}${sourceInfo}: ${stockData.current.toFixed(2)} (${stockData.change > 0 ? '+' : ''}${stockData.percent_change.toFixed(2)}%)`);
                }
                finally {
                    client.release();
                }
            }
            else {
                console.warn('⚠️ No market data returned from Finnhub');
            }
        }
        catch (error) {
            console.error('❌ Error fetching/saving market data:', error);
        }
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
            const [zerohedge, cnbc, financialjuice, finnhub, fred, te] = await Promise.allSettled([
                this.fetchZeroHedgeHeadlines(),
                this.fetchCNBCMarketNews(),
                this.fetchFinancialJuice(),
                this.fetchFinnhubNews(),
                this.fetchFredEconomicData(),
                this.fetchFredEconomicData(),
                this.fetchTradingEconomicsCalendar(),
                this.fetchAndSaveMarketData(),
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
            if (fred.status === 'fulfilled') {
                allNews.push(...fred.value);
                console.log(`✅ FRED: ${fred.value.length} indicators`);
            }
            if (te.status === 'fulfilled') {
                allNews.push(...te.value);
                console.log(`✅ TradingEconomics: ${te.value.length} events`);
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
//# sourceMappingURL=NewsAggregator.js.map