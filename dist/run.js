"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialAnalystApp = void 0;
var Vortex500Agent_1 = require("./src/backend/agents/Vortex500Agent");
var VixombreAgent_1 = require("./src/backend/agents/VixombreAgent");
var NewsDatabaseService_1 = require("./src/backend/database/NewsDatabaseService");
var NewsAggregator_1 = require("./src/backend/ingestion/NewsAggregator");
var VixPlaywrightScraper_1 = require("./src/backend/ingestion/VixPlaywrightScraper");
var pg_1 = require("pg");
var dotenv = require("dotenv");
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
var FinancialAnalystApp = /** @class */ (function () {
    function FinancialAnalystApp() {
        this.sentimentAgent = new Vortex500Agent_1.Vortex500Agent();
        this.vixAgent = new VixombreAgent_1.VixombreAgent();
        this.dbService = new NewsDatabaseService_1.NewsDatabaseService();
        this.newsAggregator = new NewsAggregator_1.NewsAggregator();
        this.vixScraper = new VixPlaywrightScraper_1.VixPlaywrightScraper();
    }
    /**
     * Initialize database and verify connections
     */
    FinancialAnalystApp.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var dbConnected, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🚀 Initializing Financial Analyst Application...');
                        console.log('='.repeat(60));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.dbService.testConnection()];
                    case 2:
                        dbConnected = _a.sent();
                        if (!dbConnected) {
                            console.log('❌ Database connection failed');
                            return [2 /*return*/, false];
                        }
                        console.log('✅ Database connection successful');
                        return [2 /*return*/, true];
                    case 3:
                        error_1 = _a.sent();
                        console.error('❌ Initialization failed:', error_1 instanceof Error ? error_1.message : 'Unknown error');
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get latest news from database
     */
    FinancialAnalystApp.prototype.getNewsStatus = function () {
        return __awaiter(this, void 0, void 0, function () {
            var news, cacheFresh, sources;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.dbService.getRecentNews(48)];
                    case 1:
                        news = _a.sent();
                        return [4 /*yield*/, this.dbService.isCacheFresh(2)];
                    case 2:
                        cacheFresh = _a.sent();
                        console.log("\uD83D\uDCCA Database Status:");
                        console.log("   \u251C\u2500 News items: ".concat(news.length));
                        console.log("   \u251C\u2500 Cache: ".concat(cacheFresh ? 'FRESH' : 'STALE'));
                        console.log("   \u2514\u2500 Time range: Last 48 hours");
                        if (news.length > 0) {
                            sources = Array.from(new Set(news.map(function (n) { return n.source; })));
                            console.log("\n\uD83D\uDCF0 Sources: ".concat(sources.join(', ')));
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Refresh news data from sources
     */
    FinancialAnalystApp.prototype.refreshData = function () {
        return __awaiter(this, arguments, void 0, function (force) {
            var isFresh, sources_1, _a, zeroHedge, cnbc, financialJuice, fred, finnhub, allNews_1, results, savedCount, error_2;
            var _this = this;
            if (force === void 0) { force = false; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log('\n🔄 Starting Data Refresh...');
                        console.log('='.repeat(60));
                        if (!!force) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.dbService.isCacheFresh(2)];
                    case 1:
                        isFresh = _b.sent();
                        if (isFresh) {
                            console.log('✅ Cache is fresh (less than 2h old). No refresh needed.');
                            console.log('   Use --force to refresh anyway.');
                            return [2 /*return*/];
                        }
                        console.log('⚠️ Cache is stale. Refreshing...');
                        return [3 /*break*/, 3];
                    case 2:
                        console.log('⚡ Force refresh requested.');
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 8, , 9]);
                        sources_1 = ['ZeroHedge', 'CNBC', 'FinancialJuice', 'FRED', 'Finnhub'];
                        console.log("\n\uD83D\uDCE1 Fetching news from ".concat(sources_1.join(', '), "..."));
                        return [4 /*yield*/, Promise.allSettled([
                                this.newsAggregator.fetchZeroHedgeHeadlines(),
                                this.newsAggregator.fetchCNBCMarketNews(),
                                this.newsAggregator.fetchFinancialJuice(),
                                this.newsAggregator.fetchFredEconomicData(),
                                this.newsAggregator.fetchFinnhubNews(),
                            ])];
                    case 4:
                        _a = _b.sent(), zeroHedge = _a[0], cnbc = _a[1], financialJuice = _a[2], fred = _a[3], finnhub = _a[4];
                        allNews_1 = [];
                        results = [zeroHedge, cnbc, financialJuice, fred, finnhub];
                        results.forEach(function (result, index) {
                            if (result.status === 'fulfilled') {
                                allNews_1.push.apply(allNews_1, result.value);
                                _this.dbService.updateSourceStatus(sources_1[index], true);
                                console.log("   \u2705 ".concat(sources_1[index], ": ").concat(result.value.length, " items"));
                            }
                            else {
                                console.error("   \u274C ".concat(sources_1[index], " failed:"), result.reason);
                                _this.dbService.updateSourceStatus(sources_1[index], false, result.reason instanceof Error ? result.reason.message : 'Unknown error');
                            }
                        });
                        if (!(allNews_1.length > 0)) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.dbService.saveNewsItems(allNews_1)];
                    case 5:
                        savedCount = _b.sent();
                        console.log("\n\uD83D\uDCBE Saved ".concat(savedCount, " new items to database."));
                        return [3 /*break*/, 7];
                    case 6:
                        console.log('\n⚠️ No news fetched from any source.');
                        _b.label = 7;
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        error_2 = _b.sent();
                        console.error('\n❌ Refresh failed:', error_2 instanceof Error ? error_2.message : 'Unknown error');
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Run sentiment analysis
     */
    FinancialAnalystApp.prototype.analyzeMarketSentiment = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('\n🔍 Starting Market Sentiment Analysis...');
                        console.log('='.repeat(60));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.sentimentAgent.analyzeMarketSentiment(false)];
                    case 2:
                        result = _a.sent();
                        console.log('\n✅ ANALYSIS COMPLETED SUCCESSFULLY!');
                        console.log('='.repeat(60));
                        console.log('📈 MARKET SENTIMENT RESULT:');
                        console.log(JSON.stringify(result, null, 2));
                        console.log('\n🎯 KEY INSIGHTS:');
                        if (result.sentiment) {
                            console.log("   Sentiment: ".concat(result.sentiment, " ").concat(result.score ? "(".concat(result.score, "/100)") : ''));
                        }
                        if (result.risk_level) {
                            console.log("   Risk Level: ".concat(result.risk_level));
                        }
                        if (result.catalysts && Array.isArray(result.catalysts) && result.catalysts.length > 0) {
                            console.log("   Catalysts: ".concat(result.catalysts.slice(0, 5).join(', ')));
                        }
                        if (result.summary) {
                            console.log("   Summary: ".concat(result.summary));
                        }
                        console.log("   News Count: ".concat(result.news_count || 0, " items"));
                        console.log("   Data Source: ".concat(result.data_source || 'unknown'));
                        console.log("   Analysis Method: ".concat(result.analysis_method || 'unknown'));
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _a.sent();
                        console.error('\n❌ ANALYSIS FAILED:');
                        console.error("Error: ".concat(error_3 instanceof Error ? error_3.message : 'Unknown error'));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Run VIX Scraper standalone
     */
    FinancialAnalystApp.prototype.runVixScraper = function (source) {
        return __awaiter(this, void 0, void 0, function () {
            var pool, results, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\n\uD83D\uDD77\uFE0F Starting VIX Scraper (".concat(source ? (source === 'mw' ? 'MarketWatch Only' : 'Investing.com Only') : 'All Sources', ")..."));
                        console.log('='.repeat(60));
                        pool = new pg_1.Pool({
                            host: process.env.DB_HOST || 'localhost',
                            port: parseInt(process.env.DB_PORT || '5432'),
                            database: process.env.DB_NAME || 'financial_analyst',
                            user: process.env.DB_USER || 'postgres',
                            password: process.env.DB_PASSWORD || 'password',
                        });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 13, 14, 16]);
                        results = void 0;
                        if (!(source === 'mw')) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.vixScraper.init()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.vixScraper.scrapeMarketWatch()];
                    case 3:
                        results = [_a.sent()];
                        return [4 /*yield*/, this.vixScraper.close()];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 11];
                    case 5:
                        if (!(source === 'inv')) return [3 /*break*/, 9];
                        return [4 /*yield*/, this.vixScraper.init()];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, this.vixScraper.scrapeInvesting()];
                    case 7:
                        results = [_a.sent()];
                        return [4 /*yield*/, this.vixScraper.close()];
                    case 8:
                        _a.sent();
                        return [3 /*break*/, 11];
                    case 9: return [4 /*yield*/, this.vixScraper.scrapeAll()];
                    case 10:
                        results = _a.sent();
                        _a.label = 11;
                    case 11: return [4 /*yield*/, this.vixScraper.saveToDatabase(pool, results)];
                    case 12:
                        _a.sent();
                        console.log('\n✅ VIX Scraping Completed.');
                        console.log(JSON.stringify(results, null, 2));
                        return [3 /*break*/, 16];
                    case 13:
                        error_4 = _a.sent();
                        console.error('\n❌ VIX Scraping Failed:', error_4);
                        return [3 /*break*/, 16];
                    case 14: return [4 /*yield*/, pool.end()];
                    case 15:
                        _a.sent();
                        return [7 /*endfinally*/];
                    case 16: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Run VIX Agent Analysis
     */
    FinancialAnalystApp.prototype.runVixAgent = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('\n🕵️ Starting VIX Agent Analysis...');
                        console.log('='.repeat(60));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.vixAgent.analyzeVixStructure()];
                    case 2:
                        result = _a.sent();
                        console.log('\n✅ VIX Agent Analysis Completed.');
                        console.log(JSON.stringify(result, null, 2));
                        return [3 /*break*/, 4];
                    case 3:
                        error_5 = _a.sent();
                        console.error('\n❌ VIX Agent Failed:', error_5);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Run continuous monitoring
     */
    FinancialAnalystApp.prototype.runContinuousMode = function () {
        return __awaiter(this, void 0, void 0, function () {
            var analysisCount, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('\n🔄 Starting CONTINUOUS Monitoring Mode...');
                        console.log('Press Ctrl+C to stop at any time');
                        console.log('='.repeat(60));
                        analysisCount = 0;
                        _a.label = 1;
                    case 1:
                        if (!true) return [3 /*break*/, 10];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 7, , 9]);
                        analysisCount++;
                        console.log("\n\uD83D\uDD04 Analysis #".concat(analysisCount, " - ").concat(new Date().toLocaleString()));
                        console.log('-'.repeat(40));
                        // Auto-refresh if needed in continuous mode
                        return [4 /*yield*/, this.refreshData(false)];
                    case 3:
                        // Auto-refresh if needed in continuous mode
                        _a.sent();
                        return [4 /*yield*/, this.analyzeMarketSentiment()];
                    case 4:
                        _a.sent();
                        // Also run VIX analysis in continuous mode
                        console.log('\n📉 Running VIX Analysis...');
                        return [4 /*yield*/, this.runVixAgent()];
                    case 5:
                        _a.sent();
                        console.log("\n\u23F0 Waiting 12 hours before next analysis...");
                        console.log('   (Press Ctrl+C to stop)');
                        // Wait 12 hours (2 times per day)
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 12 * 60 * 60 * 1000); })];
                    case 6:
                        // Wait 12 hours (2 times per day)
                        _a.sent();
                        return [3 /*break*/, 9];
                    case 7:
                        error_6 = _a.sent();
                        console.error("\n\u274C Analysis #".concat(analysisCount, " failed:"), error_6 instanceof Error ? error_6.message : 'Unknown error');
                        console.log('⏰ Retrying in 1 minute...');
                        // Wait 1 minute before retry
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 60 * 1000); })];
                    case 8:
                        // Wait 1 minute before retry
                        _a.sent();
                        return [3 /*break*/, 9];
                    case 9: return [3 /*break*/, 1];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Display usage help
     */
    FinancialAnalystApp.prototype.displayHelp = function () {
        console.log("\n\uD83D\uDCCA Financial Analyst Application - Usage\n\nModes:\n  --analyze          Run single sentiment analysis\n  --refresh          Refresh news data from sources\n  --vix-scrape       Run VIX scraper only (standalone)\n  --scrape-mw        Run MarketWatch scraper only\n  --scrape-inv       Run Investing.com scraper only\n  --vix-analyze      Run VIX agent analysis (scrape + analyze)\n  --continuous       Run continuous monitoring (auto-refresh + analyze + VIX)\n  --status           Show database status only\n  --help             Show this help message\n\nOptions:\n  --force            Force refresh even if cache is fresh (use with --refresh)\n\nExamples:\n  pnpm analyze              # Single analysis\n  pnpm refresh              # Refresh data\n  pnpm vix-scrape           # Run VIX scraper\n  pnpm vix-analyze          # Run VIX analysis\n  pnpm continuous           # Continuous monitoring\n  pnpm status               # Database status\n        ");
    };
    return FinancialAnalystApp;
}());
exports.FinancialAnalystApp = FinancialAnalystApp;
/**
 * Main execution
 */
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var app, args, mode, force, _a, initialized, refreshInit, contInitialized, statusInitialized, error_7;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    app = new FinancialAnalystApp();
                    args = process.argv.slice(2);
                    mode = args[0] || '--help';
                    force = args.includes('--force');
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 31, , 32]);
                    _a = mode;
                    switch (_a) {
                        case '--analyze': return [3 /*break*/, 2];
                        case '-a': return [3 /*break*/, 2];
                        case '--refresh': return [3 /*break*/, 7];
                        case '-r': return [3 /*break*/, 7];
                        case '--vix-scrape': return [3 /*break*/, 12];
                        case '--scrape-mw': return [3 /*break*/, 14];
                        case '--scrape-inv': return [3 /*break*/, 16];
                        case '--vix-analyze': return [3 /*break*/, 18];
                        case '--continuous': return [3 /*break*/, 20];
                        case '-c': return [3 /*break*/, 20];
                        case '--status': return [3 /*break*/, 25];
                        case '-s': return [3 /*break*/, 25];
                        case '--help': return [3 /*break*/, 29];
                        case '-h': return [3 /*break*/, 29];
                    }
                    return [3 /*break*/, 29];
                case 2: return [4 /*yield*/, app.initialize()];
                case 3:
                    initialized = _b.sent();
                    if (!initialized) return [3 /*break*/, 6];
                    return [4 /*yield*/, app.getNewsStatus()];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, app.analyzeMarketSentiment()];
                case 5:
                    _b.sent();
                    _b.label = 6;
                case 6: return [3 /*break*/, 30];
                case 7: return [4 /*yield*/, app.initialize()];
                case 8:
                    refreshInit = _b.sent();
                    if (!refreshInit) return [3 /*break*/, 11];
                    return [4 /*yield*/, app.refreshData(force)];
                case 9:
                    _b.sent();
                    return [4 /*yield*/, app.getNewsStatus()];
                case 10:
                    _b.sent();
                    _b.label = 11;
                case 11: return [3 /*break*/, 30];
                case 12: return [4 /*yield*/, app.runVixScraper()];
                case 13:
                    _b.sent();
                    return [3 /*break*/, 30];
                case 14: return [4 /*yield*/, app.runVixScraper('mw')];
                case 15:
                    _b.sent();
                    return [3 /*break*/, 30];
                case 16: return [4 /*yield*/, app.runVixScraper('inv')];
                case 17:
                    _b.sent();
                    return [3 /*break*/, 30];
                case 18: return [4 /*yield*/, app.runVixAgent()];
                case 19:
                    _b.sent();
                    return [3 /*break*/, 30];
                case 20: return [4 /*yield*/, app.initialize()];
                case 21:
                    contInitialized = _b.sent();
                    if (!contInitialized) return [3 /*break*/, 24];
                    return [4 /*yield*/, app.getNewsStatus()];
                case 22:
                    _b.sent();
                    return [4 /*yield*/, app.runContinuousMode()];
                case 23:
                    _b.sent();
                    _b.label = 24;
                case 24: return [3 /*break*/, 30];
                case 25: return [4 /*yield*/, app.initialize()];
                case 26:
                    statusInitialized = _b.sent();
                    if (!statusInitialized) return [3 /*break*/, 28];
                    return [4 /*yield*/, app.getNewsStatus()];
                case 27:
                    _b.sent();
                    _b.label = 28;
                case 28: return [3 /*break*/, 30];
                case 29:
                    app.displayHelp();
                    return [3 /*break*/, 30];
                case 30: return [3 /*break*/, 32];
                case 31:
                    error_7 = _b.sent();
                    console.error('❌ Application error:', error_7 instanceof Error ? error_7.message : 'Unknown error');
                    process.exit(1);
                    return [3 /*break*/, 32];
                case 32: return [2 /*return*/];
            }
        });
    });
}
// Handle graceful shutdown
process.on('SIGINT', function () {
    console.log('\n\n🛑 Financial Analyst Application stopped by user');
    process.exit(0);
});
// Handle uncaught errors
process.on('unhandledRejection', function (reason, promise) {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', function (error) {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});
// Run the application
if (require.main === module) {
    main().catch(console.error);
}
