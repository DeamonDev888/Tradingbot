import { SentimentAgentFinal } from './src/backend/agents/SentimentAgentFinal';
import { VixombreAgent } from './src/backend/agents/VixombreAgent';
import { NewsDatabaseService } from './src/backend/database/NewsDatabaseService';
import { NewsAggregator, NewsItem } from './src/backend/ingestion/NewsAggregator';
import { VixPlaywrightScraper } from './src/backend/ingestion/VixPlaywrightScraper';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

/**
 * Financial Analyst Application - Main Entry Point
 *
 * Features:
 * - Database-driven sentiment analysis
 * - KiloCode AI integration
 * - Robust error handling (N/A when analysis fails)
 * - No fallback to simulated data
 * - Real-time market sentiment monitoring
 * - VIX Volatility Analysis (Vixombre)
 */

class FinancialAnalystApp {
    private sentimentAgent: SentimentAgentFinal;
    private vixAgent: VixombreAgent;
    private dbService: NewsDatabaseService;
    private newsAggregator: NewsAggregator;
    private vixScraper: VixPlaywrightScraper;

    constructor() {
        this.sentimentAgent = new SentimentAgentFinal();
        this.vixAgent = new VixombreAgent();
        this.dbService = new NewsDatabaseService();
        this.newsAggregator = new NewsAggregator();
        this.vixScraper = new VixPlaywrightScraper();
    }

    /**
     * Initialize database and verify connections
     */
    async initialize(): Promise<boolean> {
        console.log("🚀 Initializing Financial Analyst Application...");
        console.log("=".repeat(60));

        try {
            // Test database connection
            const dbConnected = await this.dbService.testConnection();
            if (!dbConnected) {
                console.log("❌ Database connection failed");
                return false;
            }

            console.log("✅ Database connection successful");
            return true;

        } catch (error) {
            console.error("❌ Initialization failed:", error instanceof Error ? error.message : 'Unknown error');
            return false;
        }
    }

    /**
     * Get latest news from database
     */
    async getNewsStatus(): Promise<void> {
        const news = await this.dbService.getRecentNews(48); // Last 48 hours
        const cacheFresh = await this.dbService.isCacheFresh(2); // 2 hours

        console.log(`📊 Database Status:`);
        console.log(`   ├─ News items: ${news.length}`);
        console.log(`   ├─ Cache: ${cacheFresh ? 'FRESH' : 'STALE'}`);
        console.log(`   └─ Time range: Last 48 hours`);

        if (news.length > 0) {
            const sources = Array.from(new Set(news.map(n => n.source)));
            console.log(`\n📰 Sources: ${sources.join(', ')}`);
        }
    }

    /**
     * Refresh news data from sources
     */
    async refreshData(force: boolean = false): Promise<void> {
        console.log("\n🔄 Starting Data Refresh...");
        console.log("=".repeat(60));

        // Check cache first unless forced
        if (!force) {
            const isFresh = await this.dbService.isCacheFresh(2);
            if (isFresh) {
                console.log("✅ Cache is fresh (less than 2h old). No refresh needed.");
                console.log("   Use --force to refresh anyway.");
                return;
            }
            console.log("⚠️ Cache is stale. Refreshing...");
        } else {
            console.log("⚡ Force refresh requested.");
        }

        try {
            const sources = ['ZeroHedge', 'CNBC', 'FinancialJuice', 'FRED', 'Finnhub'];
            console.log(`\n📡 Fetching news from ${sources.join(', ')}...`);

            const [zeroHedge, cnbc, financialJuice, fred, finnhub] = await Promise.allSettled([
                this.newsAggregator.fetchZeroHedgeHeadlines(),
                this.newsAggregator.fetchCNBCMarketNews(),
                this.newsAggregator.fetchFinancialJuice(),
                this.newsAggregator.fetchFredEconomicData(),
                this.newsAggregator.fetchFinnhubNews()
            ]);

            const allNews: NewsItem[] = [];
            const results = [zeroHedge, cnbc, financialJuice, fred, finnhub];

            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    allNews.push(...result.value);
                    this.dbService.updateSourceStatus(sources[index], true);
                    console.log(`   ✅ ${sources[index]}: ${result.value.length} items`);
                } else {
                    console.error(`   ❌ ${sources[index]} failed:`, result.reason);
                    this.dbService.updateSourceStatus(sources[index], false, result.reason instanceof Error ? result.reason.message : 'Unknown error');
                }
            });

            if (allNews.length > 0) {
                const savedCount = await this.dbService.saveNewsItems(allNews);
                console.log(`\n💾 Saved ${savedCount} new items to database.`);
            } else {
                console.log("\n⚠️ No news fetched from any source.");
            }

        } catch (error) {
            console.error("\n❌ Refresh failed:", error instanceof Error ? error.message : 'Unknown error');
        }
    }

    /**
     * Run sentiment analysis
     */
    async analyzeMarketSentiment(): Promise<void> {
        console.log("\n🔍 Starting Market Sentiment Analysis...");
        console.log("=".repeat(60));

        try {
            const result = await this.sentimentAgent.analyzeMarketSentiment(false);

            console.log("\n✅ ANALYSIS COMPLETED SUCCESSFULLY!");
            console.log("=".repeat(60));
            console.log("📈 MARKET SENTIMENT RESULT:");
            console.log(JSON.stringify(result, null, 2));

            console.log("\n🎯 KEY INSIGHTS:");
            if (result.sentiment) {
                console.log(`   Sentiment: ${result.sentiment} ${result.score ? `(${result.score}/100)` : ''}`);
            }
            if (result.risk_level) {
                console.log(`   Risk Level: ${result.risk_level}`);
            }
            if (result.catalysts && Array.isArray(result.catalysts) && result.catalysts.length > 0) {
                console.log(`   Catalysts: ${result.catalysts.slice(0, 5).join(', ')}`);
            }
            if (result.summary) {
                console.log(`   Summary: ${result.summary}`);
            }
            console.log(`   News Count: ${result.news_count || 0} items`);
            console.log(`   Data Source: ${result.data_source || 'unknown'}`);
            console.log(`   Analysis Method: ${result.analysis_method || 'unknown'}`);

        } catch (error) {
            console.error("\n❌ ANALYSIS FAILED:");
            console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Run VIX Scraper standalone
     */
    async runVixScraper(source?: 'mw' | 'inv'): Promise<void> {
        console.log(`\n🕷️ Starting VIX Scraper (${source ? (source === 'mw' ? 'MarketWatch Only' : 'Investing.com Only') : 'All Sources'})...`);
        console.log("=".repeat(60));

        const pool = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'financial_analyst',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'password',
        });

        try {
            let results;
            if (source === 'mw') {
                await this.vixScraper.init();
                results = [await this.vixScraper.scrapeMarketWatch()];
                await this.vixScraper.close();
            } else if (source === 'inv') {
                await this.vixScraper.init();
                results = [await this.vixScraper.scrapeInvesting()];
                await this.vixScraper.close();
            } else {
                results = await this.vixScraper.scrapeAll();
            }
            
            await this.vixScraper.saveToDatabase(pool, results);
            console.log("\n✅ VIX Scraping Completed.");
            console.log(JSON.stringify(results, null, 2));
        } catch (error) {
            console.error("\n❌ VIX Scraping Failed:", error);
        } finally {
            await pool.end();
        }
    }

    /**
     * Run VIX Agent Analysis
     */
    async runVixAgent(): Promise<void> {
        console.log("\n🕵️ Starting VIX Agent Analysis...");
        console.log("=".repeat(60));
        
        try {
            const result = await this.vixAgent.analyzeVixStructure();
            console.log("\n✅ VIX Agent Analysis Completed.");
            console.log(JSON.stringify(result, null, 2));
        } catch (error) {
             console.error("\n❌ VIX Agent Failed:", error);
        }
    }

    /**
     * Run continuous monitoring
     */
    async runContinuousMode(): Promise<void> {
        console.log("\n🔄 Starting CONTINUOUS Monitoring Mode...");
        console.log("Press Ctrl+C to stop at any time");
        console.log("=".repeat(60));

        let analysisCount = 0;

        while (true) {
            try {
                analysisCount++;
                console.log(`\n🔄 Analysis #${analysisCount} - ${new Date().toLocaleString()}`);
                console.log("-".repeat(40));

                // Auto-refresh if needed in continuous mode
                await this.refreshData(false);
                await this.analyzeMarketSentiment();
                
                // Also run VIX analysis in continuous mode
                console.log("\n📉 Running VIX Analysis...");
                await this.runVixAgent();

                console.log(`\n⏰ Waiting 12 hours before next analysis...`);
                console.log("   (Press Ctrl+C to stop)");

                // Wait 12 hours (2 times per day)
                await new Promise(resolve => setTimeout(resolve, 12 * 60 * 60 * 1000));

            } catch (error) {
                console.error(`\n❌ Analysis #${analysisCount} failed:`, error instanceof Error ? error.message : 'Unknown error');
                console.log("⏰ Retrying in 1 minute...");

                // Wait 1 minute before retry
                await new Promise(resolve => setTimeout(resolve, 60 * 1000));
            }
        }
    }

    /**
     * Display usage help
     */
    displayHelp(): void {
        console.log(`
📊 Financial Analyst Application - Usage

Modes:
  --analyze          Run single sentiment analysis
  --refresh          Refresh news data from sources
  --vix-scrape       Run VIX scraper only (standalone)
  --scrape-mw        Run MarketWatch scraper only
  --scrape-inv       Run Investing.com scraper only
  --vix-analyze      Run VIX agent analysis (scrape + analyze)
  --continuous       Run continuous monitoring (auto-refresh + analyze + VIX)
  --status           Show database status only
  --help             Show this help message

Options:
  --force            Force refresh even if cache is fresh (use with --refresh)

Examples:
  pnpm analyze              # Single analysis
  pnpm refresh              # Refresh data
  pnpm vix-scrape           # Run VIX scraper
  pnpm vix-analyze          # Run VIX analysis
  pnpm continuous           # Continuous monitoring
  pnpm status               # Database status
        `);
    }
}

/**
 * Main execution
 */
async function main() {
    const app = new FinancialAnalystApp();

    // Parse command line arguments
    const args = process.argv.slice(2);
    const mode = args[0] || '--help';
    const force = args.includes('--force');

    try {
        switch (mode) {
            case '--analyze':
            case '-a':
                const initialized = await app.initialize();
                if (initialized) {
                    await app.getNewsStatus();
                    await app.analyzeMarketSentiment();
                }
                break;

            case '--refresh':
            case '-r':
                const refreshInit = await app.initialize();
                if (refreshInit) {
                    await app.refreshData(force);
                    await app.getNewsStatus();
                }
                break;

            case '--vix-scrape':
                await app.runVixScraper();
                break;

            case '--scrape-mw':
                await app.runVixScraper('mw');
                break;

            case '--scrape-inv':
                await app.runVixScraper('inv');
                break;

            case '--vix-analyze':
                await app.runVixAgent();
                break;

            case '--continuous':
            case '-c':
                const contInitialized = await app.initialize();
                if (contInitialized) {
                    await app.getNewsStatus();
                    await app.runContinuousMode();
                }
                break;

            case '--status':
            case '-s':
                const statusInitialized = await app.initialize();
                if (statusInitialized) {
                    await app.getNewsStatus();
                }
                break;

            case '--help':
            case '-h':
            default:
                app.displayHelp();
                break;
        }

    } catch (error) {
        console.error("❌ Application error:", error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n🛑 Financial Analyst Application stopped by user');
    process.exit(0);
});

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

// Run the application
if (require.main === module) {
    main().catch(console.error);
}

export { FinancialAnalystApp };