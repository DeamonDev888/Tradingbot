"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VixombreAgent = void 0;
var BaseAgentSimple_1 = require("./BaseAgentSimple");
var VixPlaywrightScraper_1 = require("../ingestion/VixPlaywrightScraper");
var child_process_1 = require("child_process");
var util_1 = require("util");
var fs = require("fs/promises");
var path = require("path");
var dotenv = require("dotenv");
var pg_1 = require("pg");
dotenv.config();
var VixombreAgent = /** @class */ (function (_super) {
    __extends(VixombreAgent, _super);
    function VixombreAgent() {
        var _this = _super.call(this, 'vixombre-agent') || this;
        _this.scraper = new VixPlaywrightScraper_1.VixPlaywrightScraper();
        _this.execAsync = (0, util_1.promisify)(child_process_1.exec);
        _this.pool = new pg_1.Pool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'financial_analyst',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '9022',
        });
        return _this;
    }
    VixombreAgent.prototype.analyzeVixStructure = function () {
        return __awaiter(this, void 0, void 0, function () {
            var dbConnected, vixData, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("[".concat(this.agentName, "] Starting VIX Database Analysis (inspired by Vortex500)..."));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.testDatabaseConnection()];
                    case 2:
                        dbConnected = _a.sent();
                        if (!dbConnected) {
                            console.log("[".concat(this.agentName, "] Database not connected - trying scraping fallback"));
                            return [2 /*return*/, this.performScrapingFallback()];
                        }
                        console.log("[".concat(this.agentName, "] Using DATABASE-FIRST mode"));
                        return [4 /*yield*/, this.getVixDataFromDatabase()];
                    case 3:
                        vixData = _a.sent();
                        if (vixData && vixData.length > 0) {
                            console.log("[".concat(this.agentName, "] Found ").concat(vixData.length, " VIX records in DATABASE"));
                            return [2 /*return*/, this.performDatabaseAnalysis(vixData)];
                        }
                        console.log("[".concat(this.agentName, "] No VIX data in database - scraping fresh data"));
                        return [2 /*return*/, this.performScrapingFallback()];
                    case 4:
                        error_1 = _a.sent();
                        console.error("[".concat(this.agentName, "] Analysis failed:"), error_1);
                        return [2 /*return*/, {
                                error: "Analysis failed: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'),
                            }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Test la connexion à la base de données
     */
    VixombreAgent.prototype.testDatabaseConnection = function () {
        return __awaiter(this, void 0, void 0, function () {
            var client, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.pool.connect()];
                    case 1:
                        client = _a.sent();
                        return [4 /*yield*/, client.query('SELECT 1')];
                    case 2:
                        _a.sent();
                        client.release();
                        return [2 /*return*/, true];
                    case 3:
                        error_2 = _a.sent();
                        console.error("[".concat(this.agentName, "] Database connection failed:"), error_2);
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Récupère les données VIX depuis la base de données
     */
    VixombreAgent.prototype.getVixDataFromDatabase = function () {
        return __awaiter(this, void 0, void 0, function () {
            var query, result, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        query = "\n        SELECT\n          source,\n          value,\n          change_abs,\n          change_pct,\n          previous_close,\n          open,\n          high,\n          low,\n          last_update,\n          created_at\n        FROM vix_data\n        WHERE created_at >= NOW() - INTERVAL '2 hours'\n        ORDER BY created_at DESC\n        LIMIT 10\n      ";
                        return [4 /*yield*/, this.pool.query(query)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows];
                    case 2:
                        error_3 = _a.sent();
                        console.error("[".concat(this.agentName, "] Error getting VIX data from database:"), error_3);
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Analyse avec les données de la base de données
     */
    VixombreAgent.prototype.performDatabaseAnalysis = function (vixData) {
        return __awaiter(this, void 0, void 0, function () {
            var validValues, consensusValue, validChanges, avgChange, trend, regime, riskLevel, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("[".concat(this.agentName, "] Performing analysis with ").concat(vixData.length, " database records..."));
                        validValues = vixData.filter(function (r) { return r.value !== null; }).map(function (r) { return parseFloat(r.value); });
                        consensusValue = validValues.length > 0 ? validValues.reduce(function (a, b) { return a + b; }, 0) / validValues.length : 0;
                        validChanges = vixData
                            .filter(function (r) { return r.change_pct !== null; })
                            .map(function (r) { return parseFloat(r.change_pct); });
                        avgChange = validChanges.length > 0 ? validChanges.reduce(function (a, b) { return a + b; }, 0) / validChanges.length : 0;
                        trend = avgChange < -0.5 ? 'BEARISH' : avgChange > 0.5 ? 'BULLISH' : 'NEUTRAL';
                        regime = consensusValue > 30 ? 'CRISIS' : consensusValue > 20 ? 'ELEVATED' : 'NORMAL';
                        riskLevel = consensusValue > 25 ? 'HIGH' : consensusValue > 15 ? 'MEDIUM' : 'LOW';
                        result = {
                            metadata: {
                                analysis_timestamp: new Date().toISOString(),
                                markets_status: this.determineMarketStatus(),
                                sources_scraped: 0,
                                sources_failed: [],
                                analysis_type: 'DATABASE_VOLATILITY_ANALYSIS',
                                data_source: 'database',
                                record_count: vixData.length,
                            },
                            current_vix_data: {
                                consensus_value: parseFloat(consensusValue.toFixed(2)),
                                trend: trend,
                                sources: vixData.map(function (r) { return ({
                                    source: r.source,
                                    value: r.value,
                                    change_abs: r.change_abs,
                                    change_pct: r.change_pct,
                                    last_update: r.last_update,
                                }); }),
                            },
                            expert_volatility_analysis: {
                                current_vix: parseFloat(consensusValue.toFixed(2)),
                                vix_trend: trend,
                                volatility_regime: regime,
                                sentiment: trend === 'BEARISH' ? 'NEGATIVE' : trend === 'BULLISH' ? 'POSITIVE' : 'NEUTRAL',
                                sentiment_score: Math.round(avgChange * 10),
                                risk_level: riskLevel,
                                catalysts: [
                                    'Analyse basée sur données récentes',
                                    consensusValue > 25 ? 'Volatilité élevée détectée' : 'Volatilité normale',
                                    avgChange > 0 ? 'Pression haussière' : avgChange < 0 ? 'Pression baissière' : 'Stabilité',
                                ],
                                technical_signals: {
                                    signal_strength: consensusValue > 20 ? 'HIGH' : 'MEDIUM',
                                    direction: trend.toLowerCase(),
                                },
                                market_implications: {
                                    es_futures_bias: trend === 'BEARISH' ? 'BEARISH' : trend === 'BULLISH' ? 'BULLISH' : 'NEUTRAL',
                                    sp500_impact: consensusValue > 25 ? 'HIGH_VOLATILITY_EXPECTED' : 'NORMAL_CONDITIONS',
                                },
                                expert_summary: "Analyse VIX bas\u00E9e sur ".concat(vixData.length, " enregistrements r\u00E9cents. VIX actuel: ").concat(consensusValue.toFixed(2), ", tendance: ").concat(trend, ", r\u00E9gime: ").concat(regime, "."),
                                key_insights: [
                                    "VIX consensus: ".concat(consensusValue.toFixed(2)),
                                    "Tendance: ".concat(trend),
                                    "R\u00E9gime de volatilit\u00E9: ".concat(regime),
                                    "Niveau de risque: ".concat(riskLevel),
                                ],
                                trading_recommendations: {
                                    strategy: consensusValue > 25 ? 'DEFENSIVE' : consensusValue < 15 ? 'AGGRESSIVE' : 'NEUTRAL',
                                    target_vix_levels: [15, 25, 30],
                                },
                            },
                            historical_context: {
                                comparison_5day: null,
                                comparison_20day: null,
                                volatility_trend: avgChange > 0 ? 'RISING' : avgChange < 0 ? 'FALLING' : 'STABLE',
                                key_levels: {
                                    support: consensusValue > 20 ? 20 : 15,
                                    resistance: consensusValue < 25 ? 25 : 30,
                                },
                            },
                        };
                        // Sauvegarder l'analyse dans la base de données
                        return [4 /*yield*/, this.saveAnalysisToDatabase(result)];
                    case 1:
                        // Sauvegarder l'analyse dans la base de données
                        _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    };
    /**
     * Fallback: Scraper les données si la base de données est vide
     */
    VixombreAgent.prototype.performScrapingFallback = function () {
        return __awaiter(this, void 0, void 0, function () {
            var scrapeResults, successCount, failedSources, prompt_1, aiAnalysis, validValues, avg, validChanges, avgChange, historicalData, expertAnalysis, finalResult, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("[".concat(this.agentName, "] Using SCRAPING FALLBACK mode..."));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        return [4 /*yield*/, this.scraper.scrapeAll()];
                    case 2:
                        scrapeResults = _a.sent();
                        successCount = scrapeResults.filter(function (r) { return !r.error && r.value !== null; }).length;
                        failedSources = scrapeResults
                            .filter(function (r) { return r.error || r.value === null; })
                            .map(function (r) { return "".concat(r.source, " (").concat(r.error || 'No data', ")"); });
                        console.log("[".concat(this.agentName, "] Scraped ").concat(successCount, " sources successfully."));
                        // 2. Save to Database
                        return [4 /*yield*/, this.scraper.saveToDatabase(this.pool, scrapeResults)];
                    case 3:
                        // 2. Save to Database
                        _a.sent();
                        prompt_1 = this.createAnalysisPrompt(scrapeResults);
                        return [4 /*yield*/, this.tryKiloCodeWithFile(prompt_1)];
                    case 4:
                        aiAnalysis = _a.sent();
                        // Fallback if AI failed
                        if (!aiAnalysis) {
                            console.log("[".concat(this.agentName, "] AI Analysis failed, generating fallback stats..."));
                            validValues = scrapeResults
                                .filter(function (r) { return r.value !== null; })
                                .map(function (r) { return r.value; });
                            avg = validValues.length > 0
                                ? validValues.reduce(function (a, b) { return a + b; }, 0) / validValues.length
                                : 0;
                            validChanges = scrapeResults
                                .filter(function (r) { return r.change_pct !== null; })
                                .map(function (r) { return r.change_pct; });
                            avgChange = validChanges.length > 0
                                ? validChanges.reduce(function (a, b) { return a + b; }, 0) / validChanges.length
                                : 0;
                            // Calculate High/Low spread from available data
                            scrapeResults.flatMap(function (r) { return r.news_headlines; });
                            aiAnalysis = {
                                volatility_analysis: {
                                    current_vix: validValues.length > 0 ? parseFloat(avg.toFixed(2)) : 0,
                                    vix_trend: avgChange < 0 ? 'BEARISH' : 'BULLISH',
                                    volatility_regime: avg > 30 ? 'CRISIS' : avg > 20 ? 'ELEVATED' : 'NORMAL',
                                    sentiment: 'NEUTRAL',
                                    sentiment_score: 0,
                                    risk_level: avg > 20 ? 'HIGH' : 'MEDIUM',
                                    catalysts: ['Analyse IA indisponible', 'Données de marché uniquement'],
                                    expert_summary: "Analyse de secours automatisée. Le service d'IA n'était pas disponible pour fournir des informations détaillées.",
                                    key_insights: ['Données VIX récupérées avec succès', 'Analyse IA détaillée ignorée'],
                                    trading_recommendations: {
                                        strategy: 'NEUTRAL',
                                        target_vix_levels: [15, 25],
                                    },
                                },
                            };
                        }
                        return [4 /*yield*/, this.getVixHistoricalData()];
                    case 5:
                        historicalData = _a.sent();
                        expertAnalysis = aiAnalysis.volatility_analysis ||
                            {};
                        finalResult = {
                            metadata: {
                                analysis_timestamp: new Date().toISOString(),
                                markets_status: this.determineMarketStatus(),
                                sources_scraped: successCount,
                                sources_failed: failedSources,
                                analysis_type: 'EXPERT_VOLATILITY_ANALYSIS',
                            },
                            current_vix_data: {
                                consensus_value: expertAnalysis.current_vix || this.getConsensusValue(scrapeResults),
                                trend: expertAnalysis.vix_trend || 'NEUTRAL',
                                sources: scrapeResults.map(function (r) {
                                    return Object.fromEntries(Object.entries({
                                        source: r.source,
                                        value: r.value,
                                        change_abs: r.change_abs,
                                        change_pct: r.change_pct,
                                        previous_close: r.previous_close,
                                        open: r.open,
                                        high: r.high,
                                        low: r.low,
                                        last_update: r.last_update,
                                    }).filter(function (_a) {
                                        var v = _a[1];
                                        return v !== null;
                                    }));
                                }),
                            },
                            expert_volatility_analysis: {
                                current_vix: expertAnalysis.current_vix,
                                vix_trend: expertAnalysis.vix_trend,
                                volatility_regime: expertAnalysis.volatility_regime,
                                sentiment: expertAnalysis.sentiment,
                                sentiment_score: expertAnalysis.sentiment_score,
                                risk_level: expertAnalysis.risk_level,
                                catalysts: expertAnalysis.catalysts || [],
                                technical_signals: expertAnalysis.technical_signals || {},
                                market_implications: expertAnalysis.market_implications || {},
                                expert_summary: expertAnalysis.expert_summary,
                                key_insights: expertAnalysis.key_insights || [],
                                trading_recommendations: expertAnalysis.trading_recommendations || {},
                            },
                            historical_context: {
                                comparison_5day: historicalData.five_day_avg,
                                comparison_20day: historicalData.twenty_day_avg,
                                volatility_trend: this.calculateVolatilityTrend(historicalData),
                                key_levels: {
                                    support: historicalData.support_level,
                                    resistance: historicalData.resistance_level,
                                },
                            },
                            news_analysis: {
                                total_headlines: scrapeResults.reduce(function (sum, r) { return sum + r.news_headlines.length; }, 0),
                                key_themes: this.extractNewsThemes(scrapeResults),
                                volatility_catalysts: this.identifyVolatilityCatalysts(scrapeResults),
                            },
                        };
                        return [4 /*yield*/, this.saveAnalysisToDatabase(finalResult)];
                    case 6:
                        _a.sent();
                        return [2 /*return*/, finalResult];
                    case 7:
                        error_4 = _a.sent();
                        console.error("[".concat(this.agentName, "] Analysis failed:"), error_4);
                        return [2 /*return*/, {
                                error: "Analysis failed: ".concat(error_4 instanceof Error ? error_4.message : 'Unknown error'),
                            }];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Détermine le statut du marché
     */
    VixombreAgent.prototype.determineMarketStatus = function () {
        var now = new Date();
        var day = now.getDay();
        var hour = now.getHours();
        if (day === 0 || day === 6)
            return 'WEEKEND';
        if (hour >= 14 && hour < 21)
            return 'MARKET_OPEN';
        if (hour >= 12 && hour < 14)
            return 'PRE_MARKET';
        return 'AFTER_HOURS';
    };
    /**
     * Sauvegarde l'analyse dans la base de données
     */
    VixombreAgent.prototype.saveAnalysisToDatabase = function (analysis) {
        return __awaiter(this, void 0, void 0, function () {
            var query, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        query = "\n        INSERT INTO vix_analysis (analysis_data, created_at)\n        VALUES ($1, NOW())\n      ";
                        return [4 /*yield*/, this.pool.query(query, [JSON.stringify(analysis)])];
                    case 1:
                        _a.sent();
                        console.log("[".concat(this.agentName, "] \u2705 Analysis saved to database"));
                        return [3 /*break*/, 3];
                    case 2:
                        error_5 = _a.sent();
                        console.error("[".concat(this.agentName, "] Error saving analysis to database:"), error_5);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    VixombreAgent.prototype.createAnalysisPrompt = function (results) {
        return "\nYou are VIXOMBRE, a world-class volatility expert and market analyst.\n\n## \uD83E\uDD16 INSTRUCTIONS\nAnalyze the provided VIX data and news to deliver an EXPERT VOLATILITY ANALYSIS.\n\nCRITICAL RULES:\n1. Return ONLY valid JSON.\n2. NO conversational text.\n3. ALL text fields MUST be in FRENCH.\n\n## \uD83E\uDDE0 KNOWLEDGE BASE: VIX & VVIX INTERPRETATION\n1. **VIX LEVELS**:\n   - **10-15**: March\u00E9 confiant, faible volatilit\u00E9.\n   - **20-30**: March\u00E9 nerveux/volatile (peut \u00EAtre haussier mais agit\u00E9).\n   - **>30**: Peur \u00E9lev\u00E9e / Crise.\n\n2. **CALCUL DU MOUVEMENT ATTENDU (ES Futures)**:\n   - \"Le VIX te dit de combien ES peut bouger\".\n   - **Mouvement Mensuel**: VIX / 3.46 (ex: VIX 20 \u2192 ~5.8% / mois).\n   - **Mouvement Hebdo**: ~1.35% pour VIX 20.\n   - **Mouvement Quotidien (Rule of 16)**: VIX / 16.\n\n3. **CORR\u00C9LATION VVIX (Volatilit\u00E9 de la Volatilit\u00E9)**:\n   - **VIX > 20 & VVIX > 120**: \uD83D\uDEA8 GROS MOUVEMENT IMMINENT (g\u00E9n\u00E9ralement BAISSIER).\n   - **VIX Monte & VVIX < 100**: Panique non cr\u00E9dible, le march\u00E9 rebondit souvent.\n   - **VIX Bas (<15-17) & VVIX > 110**: Gros mouvement dans les 24-72h.\n   - **VVIX > 130**: DANGER, forte probabilit\u00E9 de volatilit\u00E9/chute.\n   - **VVIX < 85**: March\u00E9 calme, gros mouvement peu probable.\n\n## \uD83D\uDCCA VIX DATA\n".concat(JSON.stringify(this.simplifyResults(results), null, 2), "\n\nIMPORTANT DATA POINTS:\n- **Value**: Current VIX level.\n- **Change**: Daily change in points and percentage.\n- **Range (High/Low)**: Intraday volatility range.\n- **Open/Prev Close**: Gap analysis (Opening Gap).\n- **News**: Recent headlines for context.\n\nHISTORICAL CONTEXT:\n- VIX Long-Term Mean: ~19-20\n- VIX Crisis Levels: >30 (High Fear), >40 (Extreme Fear)\n- VIX Calm Levels: <15 (Low Volatility), <12 (Extreme Calm)\n- VIX Spike Reversal: Often signals market bottoms when spikes reverse\n\nREQUIRED EXPERT ANALYSIS FORMAT:\n{\n  \"volatility_analysis\": {\n    \"current_vix\": number,\n    \"vix_trend\": \"BULLISH|BEARISH|NEUTRAL\",\n    \"volatility_regime\": \"CRISIS|ELEVATED|NORMAL|CALM|EXTREME_CALM\",\n    \"sentiment\": \"EXTREME_FEAR|FEAR|NEUTRAL|GREED|EXTREME_GREED\",\n    \"sentiment_score\": number_between_-100_and_100,\n    \"risk_level\": \"CRITICAL|HIGH|MEDIUM|LOW\",\n    \"catalysts\": [\"List of 3-5 key volatility drivers from news (IN FRENCH)\"],\n    \"technical_signals\": {\n      \"vix_vs_mean\": \"string (IN FRENCH)\",\n      \"volatility_trend\": \"string (IN FRENCH)\",\n      \"pattern_recognition\": \"string (IN FRENCH)\",\n      \"gap_analysis\": \"GAP_UP|GAP_DOWN|NONE\",\n      \"intraday_range_analysis\": \"EXPANDING|CONTRACTING|STABLE\"\n    },\n    \"market_implications\": {\n      \"es_futures_bias\": \"BULLISH|BEARISH|NEUTRAL\",\n      \"volatility_expectation\": \"INCREASING|DECREASING|STABLE\",\n      \"confidence_level\": number_between_0_100,\n      \"time_horizon\": \"INTRADAY|SWING|POSITIONAL\"\n    },\n    \"expert_summary\": \"Professional volatility analysis summary (2-3 sentences) IN FRENCH\",\n    \"key_insights\": [\"3-5 bullet points of actionable volatility insights IN FRENCH\"],\n    \"trading_recommendations\": {\n      \"strategy\": \"VOLATILITY_BUY|VOLATILITY_SELL|NEUTRAL\",\n      \"entry_signals\": [\"Specific entry conditions IN FRENCH\"],\n      \"risk_management\": \"Risk management advice IN FRENCH\",\n      \"target_vix_levels\": [min_target, max_target]\n    }\n  }\n}\n\nANALYSIS METHODOLOGY:\n1. Compare current VIX to historical averages and recent trends.\n2. **Analyze the Intraday Range (High - Low) and Opening Gap (Open - Prev Close)** for immediate sentiment.\n3. Analyze news for volatility catalysts (geopolitical, economic, market events).\n4. Assess market sentiment from VIX levels and news tone.\n5. Provide ES Futures directional bias based on volatility expectations.\n6. Include risk assessment and confidence levels.\n7. Focus on actionable trading insights.\n\nRULES:\n1. Return ONLY valid JSON - no explanations outside JSON.\n2. Be decisive in your analysis - avoid \"may\" or \"might\".\n3. Provide specific, actionable recommendations.\n4. Base sentiment_score on: Negative = -50 to -100, Neutral = -49 to 49, Positive = 50 to 100.\n5. Include numerical VIX targets when providing recommendations.\n6. Consider both current conditions AND future volatility expectations.\n7. **IMPORTANT: ALL TEXT FIELDS (summary, insights, catalysts, recommendations) MUST BE IN FRENCH.**\n");
    };
    VixombreAgent.prototype.tryKiloCodeWithFile = function (prompt) {
        return __awaiter(this, void 0, void 0, function () {
            var bufferPath, content, isWindows, readCommand, command, stdout, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        bufferPath = path.resolve('vix_buffer.md');
                        content = "\n# Vixombre Analysis Buffer\n\n## \uD83D\uDCCA VIX Data\n```json\n".concat(prompt, "\n```\n\n## \uD83E\uDD16 Instructions\nAnalyze the data above and return ONLY the requested JSON.\n");
                        return [4 /*yield*/, fs.writeFile(bufferPath, content, 'utf-8')];
                    case 1:
                        _a.sent();
                        console.log("\n[".concat(this.agentName, "] \uD83D\uDD0D SYSTEM PROMPT (Buffer Content):"));
                        console.log('='.repeat(80));
                        console.log(content);
                        console.log('='.repeat(80));
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, 5, 6]);
                        isWindows = process.platform === 'win32';
                        readCommand = isWindows ? "type \"".concat(bufferPath, "\"") : "cat \"".concat(bufferPath, "\"");
                        command = "".concat(readCommand, " | kilocode -m ask --auto --json");
                        console.log("\n[".concat(this.agentName, "] \uD83D\uDE80 EXECUTING COMMAND:"));
                        console.log("> ".concat(command));
                        console.log('='.repeat(80));
                        return [4 /*yield*/, this.execAsync(command, {
                                timeout: 90000,
                                cwd: process.cwd(),
                            })];
                    case 3:
                        stdout = (_a.sent()).stdout;
                        return [2 /*return*/, this.parseOutput(stdout)];
                    case 4:
                        error_6 = _a.sent();
                        console.error("[".concat(this.agentName, "] KiloCode execution failed:"), error_6);
                        return [2 /*return*/, null];
                    case 5:
                        // await fs.unlink(bufferPath).catch(() => {});
                        console.log("[".concat(this.agentName, "] \uD83D\uDCC4 VIX buffer kept for inspection: ").concat(bufferPath));
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    VixombreAgent.prototype.parseOutput = function (stdout) {
        console.log("[".concat(this.agentName, "] Raw AI Output length:"), stdout.length);
        fs.writeFile('vix_debug_output.txt', stdout).catch(console.error);
        try {
            var clean = stdout
                .replace(/\\x1b\[[0-9;]*m/g, '')
                .replace(/\\x1b\[[0-9;]*[A-Z]/g, '')
                .replace(/\\x1b\[.*?[A-Za-z]/g, '');
            var lines = clean.split('\n').filter(function (line) { return line.trim() !== ''; });
            var finalJson = null;
            for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
                var line = lines_1[_i];
                try {
                    var event_1 = JSON.parse(line);
                    if (event_1.metadata && (event_1.metadata.comparisons || event_1.metadata.aggregated_news)) {
                        return event_1.metadata;
                    }
                    if (event_1.type === 'completion_result' && event_1.content) {
                        if (typeof event_1.content === 'string') {
                            var extracted = this.extractJsonFromContent(event_1.content);
                            if (extracted)
                                finalJson = extracted;
                        }
                        else {
                            finalJson = event_1.content;
                        }
                    }
                    if (event_1.type === 'say' && event_1.say !== 'reasoning' && event_1.content) {
                        var extracted = this.extractJsonFromContent(event_1.content);
                        if (extracted)
                            finalJson = extracted;
                    }
                }
                catch (_a) {
                    // Ignore JSON parsing errors
                }
            }
            if (finalJson)
                return finalJson;
            var fallbackParsed = this.extractJsonFromContent(clean);
            if (fallbackParsed)
                return fallbackParsed;
            throw new Error('No valid JSON found in stream');
        }
        catch (error) {
            console.error("[".concat(this.agentName, "] Parsing failed:"), error);
            return null;
        }
    };
    VixombreAgent.prototype.extractJsonFromContent = function (content) {
        var patterns = [
            /```json\s*(\{[\s\S]*?\})\s*```/,
            /```\s*(\{[\s\S]*?\})\s*```/,
            /\{[\s\S]*?"comparisons"[\s\S]*?\}/,
            /\{[\s\S]*?\}/,
        ];
        for (var _i = 0, patterns_1 = patterns; _i < patterns_1.length; _i++) {
            var pattern = patterns_1[_i];
            var match = content.match(pattern);
            if (match) {
                try {
                    var jsonStr = match[1] || match[0];
                    return JSON.parse(jsonStr);
                }
                catch (_a) {
                    continue;
                }
            }
        }
        return null;
    };
    VixombreAgent.prototype.extractNewsThemes = function (results) {
        var headlines = results.flatMap(function (r) { return r.news_headlines.map(function (h) { return h.title; }); });
        var themes = new Set();
        var keywords = [
            'inflation',
            'fed',
            'rate',
            'war',
            'earnings',
            'tech',
            'oil',
            'recession',
            'growth',
        ];
        headlines.forEach(function (h) {
            keywords.forEach(function (k) {
                if (h.toLowerCase().includes(k))
                    themes.add(k.toUpperCase());
            });
        });
        return Array.from(themes).slice(0, 5);
    };
    VixombreAgent.prototype.identifyVolatilityCatalysts = function (results) {
        var headlines = results.flatMap(function (r) { return r.news_headlines.map(function (h) { return h.title; }); });
        var catalysts = headlines.filter(function (h) {
            return h.toLowerCase().includes('spike') ||
                h.toLowerCase().includes('plunge') ||
                h.toLowerCase().includes('crash') ||
                h.toLowerCase().includes('surge') ||
                h.toLowerCase().includes('jump') ||
                h.toLowerCase().includes('drop');
        });
        return catalysts.slice(0, 3);
    };
    VixombreAgent.prototype.getVixHistoricalData = function () {
        return __awaiter(this, void 0, void 0, function () {
            var client, result, values, fiveDayAvg, twentyDayAvg, sortedValues, supportLevel, resistanceLevel, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.pool.connect()];
                    case 1:
                        client = _a.sent();
                        return [4 /*yield*/, client.query("\n                SELECT price as value, timestamp as created_at\n                FROM market_data\n                WHERE symbol = 'VIX'\n                AND timestamp >= NOW() - INTERVAL '20 days'\n                ORDER BY timestamp DESC\n                LIMIT 20\n            ")];
                    case 2:
                        result = _a.sent();
                        client.release();
                        if (result.rows.length === 0) {
                            return [2 /*return*/, {
                                    five_day_avg: 20,
                                    twenty_day_avg: 20,
                                    support_level: 15,
                                    resistance_level: 25,
                                    current_trend: 'NEUTRAL',
                                }];
                        }
                        values = result.rows.map(function (row) { return parseFloat(row.value); });
                        fiveDayAvg = values.slice(0, 5).reduce(function (a, b) { return a + b; }, 0) / Math.min(5, values.length);
                        twentyDayAvg = values.reduce(function (a, b) { return a + b; }, 0) / values.length;
                        sortedValues = __spreadArray([], values, true).sort(function (a, b) { return a - b; });
                        supportLevel = sortedValues[Math.floor(sortedValues.length * 0.2)] || 15;
                        resistanceLevel = sortedValues[Math.floor(sortedValues.length * 0.8)] || 25;
                        return [2 /*return*/, {
                                five_day_avg: parseFloat(fiveDayAvg.toFixed(2)),
                                twenty_day_avg: parseFloat(twentyDayAvg.toFixed(2)),
                                support_level: parseFloat(supportLevel.toFixed(2)),
                                resistance_level: parseFloat(resistanceLevel.toFixed(2)),
                                current_trend: this.calculateTrendDirection(values),
                            }];
                    case 3:
                        error_7 = _a.sent();
                        console.error('[VixombreAgent] Error fetching historical VIX data:', error_7);
                        return [2 /*return*/, {
                                five_day_avg: 20,
                                twenty_day_avg: 20,
                                support_level: 15,
                                resistance_level: 25,
                                current_trend: 'NEUTRAL',
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    VixombreAgent.prototype.getConsensusValue = function (results) {
        var validValues = results.filter(function (r) { return r.value !== null; }).map(function (r) { return r.value; });
        if (validValues.length === 0)
            return 20;
        var sum = validValues.reduce(function (a, b) { return a + b; }, 0);
        return parseFloat((sum / validValues.length).toFixed(2));
    };
    VixombreAgent.prototype.calculateVolatilityTrend = function (historicalData) {
        var fiveDayAvg = historicalData.five_day_avg;
        var twentyDayAvg = historicalData.twenty_day_avg;
        if (fiveDayAvg && twentyDayAvg) {
            if (fiveDayAvg > twentyDayAvg * 1.1)
                return 'BULLISH_VOLATILITY';
            if (fiveDayAvg < twentyDayAvg * 0.9)
                return 'BEARISH_VOLATILITY';
        }
        return 'NEUTRAL_VOLATILITY';
    };
    VixombreAgent.prototype.calculateTrendDirection = function (values) {
        if (values.length < 3)
            return 'NEUTRAL';
        var recent = values.slice(0, 3);
        var older = values.slice(3, 6);
        var recentAvg = recent.reduce(function (a, b) { return a + b; }, 0) / recent.length;
        var olderAvg = older.length > 0 ? older.reduce(function (a, b) { return a + b; }, 0) / older.length : recentAvg;
        if (recentAvg > olderAvg * 1.05)
            return 'BULLISH';
        if (recentAvg < olderAvg * 0.95)
            return 'BEARISH';
        return 'NEUTRAL';
    };
    VixombreAgent.prototype.simplifyResults = function (results) {
        return results.map(function (r) { return ({
            source: r.source,
            value: r.value,
            change_pct: r.change_pct,
            news: r.news_headlines.slice(0, 5).map(function (n) { return n.title; }), // Only top 5 titles
        }); });
    };
    return VixombreAgent;
}(BaseAgentSimple_1.BaseAgentSimple));
exports.VixombreAgent = VixombreAgent;
