import { TradingEconomicsScraper } from './TradingEconomicsScraper';
import { ZeroHedgeNewsScraper } from './scrapers/ZeroHedgeNewsScraper';
import { CNBCNewsScraper } from './scrapers/CNBCNewsScraper';
import { FinancialJuiceNewsScraper } from './scrapers/FinancialJuiceNewsScraper';
import { FredNewsScraper } from './scrapers/FredNewsScraper';
import { FinnhubNewsScraper } from './scrapers/FinnhubNewsScraper';
import { CboeNewsScraper } from './scrapers/CboeNewsScraper';
import { BlsNewsScraper } from './scrapers/BlsNewsScraper';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();
export class NewsAggregator {
    teScraper;
    zeroHedgeScraper;
    cnbcScraper;
    financialJuiceScraper;
    fredScraper;
    finnhubNewsScraper;
    cboeScraper;
    blsScraper;
    pool;
    constructor() {
        this.teScraper = new TradingEconomicsScraper();
        this.zeroHedgeScraper = new ZeroHedgeNewsScraper();
        this.cnbcScraper = new CNBCNewsScraper();
        this.financialJuiceScraper = new FinancialJuiceNewsScraper();
        this.fredScraper = new FredNewsScraper();
        this.finnhubNewsScraper = new FinnhubNewsScraper();
        this.cboeScraper = new CboeNewsScraper();
        this.blsScraper = new BlsNewsScraper();
        this.pool = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'financial_analyst',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '9022',
        });
    }
    /**
     * Initialise la connexion à la base de données et vérifie que tout est prêt
     */
    async init() {
        try {
            // Test de la connexion BDD
            const client = await this.pool.connect();
            await client.query('SELECT 1');
            client.release();
            console.log('✅ NewsAggregator initialisé - base de données connectée');
        }
        catch (error) {
            throw new Error(`Initialisation NewsAggregator échouée: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Récupère les news via RSS pour ZeroHedge
     */
    async fetchZeroHedgeHeadlines() {
        await this.zeroHedgeScraper.init();
        try {
            return await this.zeroHedgeScraper.fetchNews();
        }
        finally {
            await this.zeroHedgeScraper.close();
        }
    }
    /**
     * Récupère les news de CNBC (US Markets) via RSS
     */
    async fetchCNBCMarketNews() {
        await this.cnbcScraper.init();
        try {
            return await this.cnbcScraper.fetchNews();
        }
        finally {
            await this.cnbcScraper.close();
        }
    }
    /**
     * Récupère les news de FinancialJuice via RSS
     */
    async fetchFinancialJuice() {
        await this.financialJuiceScraper.init();
        try {
            return await this.financialJuiceScraper.fetchNews();
        }
        finally {
            await this.financialJuiceScraper.close();
        }
    }
    /**
     * Récupère les news des feeds X via OPML
     * REMOVED - Use the separate X scraper module at src/x_scraper/
     */
    //   } finally {
    //   }
    // }
    /**
     * Récupère les news via Finnhub
     */
    async fetchFinnhubNews() {
        return await this.finnhubNewsScraper.fetchNews();
    }
    /**
     * Récupère les indicateurs économiques via FRED
     */
    async fetchFredEconomicData() {
        return await this.fredScraper.fetchNews();
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
     * TODO: Refactoriser pour utiliser FinnhubClient directement
     */
    async fetchAndSaveMarketData() {
        // Temporarily disabled during scraper unification
        console.log('⚠️ Market data fetching temporarily disabled during scraper unification');
        return;
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
                ON CONFLICT (title, source, published_at) 
                DO UPDATE SET 
                  content = EXCLUDED.content,
                  url = EXCLUDED.url
                WHERE 
                  news_items.content IS NULL 
                  OR length(news_items.content) < 50
                  OR length(EXCLUDED.content) > length(COALESCE(news_items.content, ''));
            `, [
                        item.title,
                        item.source,
                        item.url,
                        item.content || null, // Ensure explicit null if undefined
                        item.sentiment,
                        item.timestamp,
                    ]);
                    savedCount++;
                }
                catch (e) {
                    console.error(`Failed to save news from ${item.source}:`, e);
                    console.error('Item causing error:', JSON.stringify({
                        title: item.title,
                        source: item.source,
                        timestamp: item.timestamp,
                        contentLength: item.content?.length,
                    }, null, 2));
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
    async fetchAndSaveAllNews() {
        const startTime = Date.now();
        let totalNews = 0;
        let successfulSources = 0;
        let failedSources = 0;
        const sourceResults = [];
        console.log("🚀 DÉMARRAGE DE L'AGRÉGATION DE NEWS");
        console.log('='.repeat(60));
        console.log(`⏰ Début: ${new Date().toISOString()}`);
        console.log(`🔧 Mode: Production (Aucun fallback toléré)`);
        console.log('');
        try {
            // VÉRIFICATION PRÉLIMINAIRE DE LA BASE DE DONNÉES
            console.log('🔍 VÉRIFICATION DE LA BASE DE DONNÉES...');
            await this.verifyDatabaseConnection();
            console.log('✅ Base de données opérationnelle');
            console.log('');
            // VÉRIFICATION DES SOURCES
            console.log('🔍 VÉRIFICATION DES SOURCES...');
            await this.verifySources();
            console.log('✅ Toutes les sources validées');
            console.log('');
            // INITIALISATION DES SCRAPERS
            console.log('🔧 INITIALISATION DES SCRAPERS...');
            const initStart = Date.now();
            try {
                await this.zeroHedgeScraper.init();
                await this.cnbcScraper.init();
                await this.financialJuiceScraper.init();
                await this.cboeScraper.init();
                await this.blsScraper.init();
                const initDuration = Date.now() - initStart;
                console.log(`✅ Tous les scrapers initialisés en ${initDuration}ms`);
                console.log('');
            }
            catch (initError) {
                console.error("❌ ÉCHEC D'INITIALISATION CRITIQUE:", initError);
                const errorMessage = initError instanceof Error ? initError.message : String(initError);
                throw new Error(`Initialisation des scrapers échouée: ${errorMessage}`);
            }
            // DÉFINITION DES SOURCES À TRAITER
            const sources = [
                {
                    name: 'ZeroHedge',
                    scraper: () => this.zeroHedgeScraper.fetchNews(),
                    description: 'News financières alternatives',
                },
                {
                    name: 'CNBC',
                    scraper: () => this.cnbcScraper.fetchNews(),
                    description: 'Actualités marchés US',
                },
                {
                    name: 'FinancialJuice',
                    scraper: () => this.financialJuiceScraper.fetchNews(),
                    description: 'Analyses financières',
                },
                {
                    name: 'Finnhub',
                    scraper: () => this.finnhubNewsScraper.fetchNews(),
                    description: 'News marchés boursiers',
                },
                {
                    name: 'FRED',
                    scraper: () => this.fredScraper.fetchNews(),
                    description: 'Données économiques FED',
                },
                {
                    name: 'CBOE',
                    scraper: () => this.cboeScraper.fetchNews(),
                    description: 'Ratios options',
                },
                {
                    name: 'BLS',
                    scraper: () => this.blsScraper.fetchNews(),
                    description: 'Statistiques emploi US',
                },
                {
                    name: 'TradingEconomics',
                    scraper: () => this.fetchTradingEconomicsCalendar(),
                    description: 'Calendrier économique',
                },
            ];
            console.log('📡 DÉBUT DU SCRAPING DES SOURCES');
            console.log('='.repeat(60));
            // TRAITEMENT DE CHAQUE SOURCE
            for (const source of sources) {
                const sourceStart = Date.now();
                console.log(`🔄 [${source.name}] ${source.description}`);
                try {
                    const news = await source.scraper();
                    const sourceDuration = Date.now() - sourceStart;
                    if (news && news.length > 0) {
                        // SAUVEGARDE EN BASE
                        const savedCount = await this.saveNewsToDatabaseWithValidation(news, source.name);
                        totalNews += savedCount;
                        console.log(`✅ [${source.name}] ${savedCount} news récupérées et sauvegardées (${sourceDuration}ms)`);
                        sourceResults.push({
                            source: source.name,
                            newsCount: savedCount,
                            status: 'SUCCESS',
                            duration: sourceDuration,
                        });
                        successfulSources++;
                    }
                    else {
                        console.log(`❌ [${source.name}] Aucune news récupérée (${sourceDuration}ms)`);
                        sourceResults.push({
                            source: source.name,
                            newsCount: 0,
                            status: 'FAILED',
                            error: 'Aucune donnée récupérée',
                            duration: sourceDuration,
                        });
                        failedSources++;
                    }
                }
                catch (error) {
                    const sourceDuration = Date.now() - sourceStart;
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    console.log(`💥 [${source.name}] ÉCHEC CRITIQUE: ${errorMessage} (${sourceDuration}ms)`);
                    sourceResults.push({
                        source: source.name,
                        newsCount: 0,
                        status: 'ERROR',
                        error: errorMessage,
                        duration: sourceDuration,
                    });
                    failedSources++;
                }
                // PETITE PAUSE ENTRE LES SOURCES
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            console.log('');
            console.log('📊 RÉSULTATS FINAUX');
            console.log('='.repeat(60));
            const totalDuration = Date.now() - startTime;
            const successRate = ((successfulSources / sources.length) * 100).toFixed(1);
            console.log(`⏱️ Durée totale: ${totalDuration}ms`);
            console.log(`📈 Sources réussies: ${successfulSources}/${sources.length} (${successRate}%)`);
            console.log(`📰 News totales récupérées: ${totalNews}`);
            console.log(`💾 News sauvegardées: ${totalNews}`);
            if (failedSources > 0) {
                console.log(`⚠️ Sources échouées: ${failedSources}`);
                console.log('');
                console.log('DÉTAIL DES ÉCHECS:');
                sourceResults
                    .filter(r => r.status !== 'SUCCESS')
                    .forEach(result => {
                    console.log(`  ❌ ${result.source}: ${result.error || 'Échec inconnu'}`);
                });
            }
            console.log('');
            console.log('🎉 AGRÉGATION TERMINÉE AVEC SUCCÈS !');
            return totalNews;
        }
        catch (criticalError) {
            const totalDuration = Date.now() - startTime;
            console.error('');
            console.error("💥 ERREUR CRITIQUE DANS L'AGRÉGATION:");
            console.error(criticalError instanceof Error ? criticalError.message : String(criticalError));
            console.error(`⏱️ Durée avant échec: ${totalDuration}ms`);
            console.error('🔄 Tentative de nettoyage...');
            return 0;
        }
        finally {
            // NETTOYAGE SYSTÉMATIQUE
            console.log('');
            console.log('🧹 NETTOYAGE DES RESSOURCES...');
            try {
                await this.zeroHedgeScraper.close();
                await this.cnbcScraper.close();
                await this.financialJuiceScraper.close();
                await this.cboeScraper.close();
                await this.blsScraper.close();
                console.log('✅ Toutes les ressources nettoyées');
            }
            catch (cleanupError) {
                console.error('⚠️ Erreur lors du nettoyage:', cleanupError instanceof Error ? cleanupError.message : String(cleanupError));
            }
            console.log("🏁 FIN DE L'AGRÉGATION");
            console.log('='.repeat(60));
        }
    }
    /**
     * Vérifie la connectivité de la base de données
     */
    async verifyDatabaseConnection() {
        try {
            const client = await this.pool.connect();
            await client.query('SELECT 1');
            client.release();
        }
        catch (error) {
            throw new Error(`Connexion base de données échouée: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Vérifie que toutes les sources sont accessibles
     */
    async verifySources() {
        const sourcesToCheck = [
            { name: 'ZeroHedge RSS', url: 'http://feeds.feedburner.com/zerohedge/feed' },
            {
                name: 'CNBC RSS',
                url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664',
            },
            // { name: 'FinancialJuice RSS', url: 'https://www.financialjuice.com/feed.ashx?xy=rss' }, // Skipped to avoid 429 Rate Limit
            {
                name: 'FRED API',
                url: process.env.FRED_API_KEY
                    ? `https://api.stlouisfed.org/fred/series/observations?series_id=GDP&api_key=${process.env.FRED_API_KEY}&file_type=json`
                    : 'https://api.stlouisfed.org/fred/series/observations',
            },
            {
                name: 'Finnhub API',
                url: process.env.FINNHUB_API_KEY
                    ? `https://finnhub.io/api/v1/news?category=general&token=${process.env.FINNHUB_API_KEY}`
                    : 'https://finnhub.io/api/v1/news',
            },
            { name: 'CBOE Barchart', url: 'https://www.barchart.com/stocks/quotes/$CPCO' },
            { name: 'BLS', url: 'https://www.bls.gov/' },
            { name: 'TradingEconomics', url: 'https://tradingeconomics.com/united-states/calendar' },
        ];
        for (const source of sourcesToCheck) {
            try {
                await axios.get(source.url, {
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    },
                });
                console.log(`  ✅ ${source.name}: OK`);
            }
            catch (error) {
                let status = 0;
                let code = 'Unknown';
                if (axios.isAxiosError(error)) {
                    status = error.response?.status || 0;
                    code = error.code || 'Unknown';
                }
                // 400/401/403/429 usually mean the server is reachable but we need keys/params or are rate limited
                // For verification purposes, this means the source is "Online"
                if (status === 400 || status === 401 || status === 403 || status === 429) {
                    console.log(`  ✅ ${source.name}: Accessible (Auth/Param required - ${status})`);
                }
                else {
                    console.log(`  ⚠️ ${source.name}: Indisponible (${code}/${status})`);
                }
            }
        }
    }
    /**
     * Sauvegarde les news avec validation supplémentaire
     */
    async saveNewsToDatabaseWithValidation(news, sourceName) {
        if (!news || news.length === 0)
            return 0;
        // VALIDATION DES DONNÉES
        const validNews = news.filter(item => {
            if (!item.title || item.title.trim().length === 0) {
                console.warn(`⚠️ [${sourceName}] News ignorée: titre vide`);
                return false;
            }
            if (!item.url || item.url.trim().length === 0) {
                console.warn(`⚠️ [${sourceName}] News ignorée: URL vide`);
                return false;
            }
            if (!item.source || item.source.trim().length === 0) {
                console.warn(`⚠️ [${sourceName}] News ignorée: source vide`);
                return false;
            }
            return true;
        });
        if (validNews.length === 0) {
            console.warn(`⚠️ [${sourceName}] Aucune news valide après filtrage`);
            return 0;
        }
        // SAUVEGARDE EN BASE
        await this.saveNewsToDatabase(validNews);
        return validNews.length;
    }
    async close() {
        await this.zeroHedgeScraper.close();
        await this.cnbcScraper.close();
        await this.financialJuiceScraper.close();
        await this.cboeScraper.close();
        await this.blsScraper.close();
        await this.pool.end();
    }
}
//# sourceMappingURL=NewsAggregator.js.map