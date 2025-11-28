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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.Vortex500Agent = void 0;
var BaseAgentSimple_1 = require("./BaseAgentSimple");
var NewsAggregator_1 = require("../ingestion/NewsAggregator");
var NewsDatabaseService_1 = require("../database/NewsDatabaseService");
var ToonFormatter_1 = require("../utils/ToonFormatter");
var child_process_1 = require("child_process");
var util_1 = require("util");
var fs = require("fs/promises");
var Vortex500Agent = /** @class */ (function (_super) {
    __extends(Vortex500Agent, _super);
    function Vortex500Agent() {
        var _this = _super.call(this, 'vortex500-agent') || this;
        _this.newsAggregator = new NewsAggregator_1.NewsAggregator();
        _this.dbService = new NewsDatabaseService_1.NewsDatabaseService();
        _this.execAsync = (0, util_1.promisify)(child_process_1.exec);
        return _this;
    }
    /**
     * Analyse de sentiment robuste et finale
     */
    Vortex500Agent.prototype.analyzeMarketSentiment = function () {
        return __awaiter(this, arguments, void 0, function (_forceRefresh) {
            var dbConnected, allNews, cacheFresh, cachedNews, hoursUsed, result, error_1;
            if (_forceRefresh === void 0) { _forceRefresh = false; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("[".concat(this.agentName, "] Starting ROBUST market sentiment analysis..."));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 12, , 13]);
                        return [4 /*yield*/, this.dbService.testConnection()];
                    case 2:
                        dbConnected = _a.sent();
                        if (!dbConnected) {
                            console.log("[".concat(this.agentName, "] Database not connected"));
                            return [2 /*return*/, this.createNotAvailableResult('Database not available - agent uses database only')];
                        }
                        console.log("[".concat(this.agentName, "] Using DATABASE-ONLY mode - no scraping"));
                        allNews = [];
                        return [4 /*yield*/, this.dbService.isCacheFresh(2)];
                    case 3:
                        cacheFresh = _a.sent();
                        console.log("[".concat(this.agentName, "] Database cache status: ").concat(cacheFresh ? 'FRESH' : 'STALE'));
                        return [4 /*yield*/, this.dbService.getNewsForAnalysis(48)];
                    case 4:
                        cachedNews = _a.sent();
                        hoursUsed = 48;
                        if (!(cachedNews.length === 0)) return [3 /*break*/, 6];
                        console.log("[".concat(this.agentName, "] No processed news in last 48h, expanding to 7 days..."));
                        return [4 /*yield*/, this.getNewsForAnalysisExtended(24 * 7)];
                    case 5:
                        cachedNews = _a.sent(); // 7 jours
                        hoursUsed = 24 * 7;
                        _a.label = 6;
                    case 6:
                        if (!(cachedNews.length === 0)) return [3 /*break*/, 8];
                        console.log("[".concat(this.agentName, "] No processed news in last 7 days, using all processed news..."));
                        return [4 /*yield*/, this.getAllProcessedNews()];
                    case 7:
                        cachedNews = _a.sent();
                        hoursUsed = null;
                        _a.label = 8;
                    case 8:
                        allNews = cachedNews.map(function (item) { return ({
                            title: item.title,
                            url: item.url,
                            source: item.source,
                            timestamp: item.timestamp || new Date(),
                            sentiment: item.sentiment,
                        }); });
                        console.log("[".concat(this.agentName, "] Using ").concat(allNews.length, " news items from DATABASE (").concat(hoursUsed ? "last ".concat(hoursUsed, "h") : 'all time', ")"));
                        if (allNews.length === 0) {
                            console.log("[".concat(this.agentName, "] No news data available in database"));
                            return [2 /*return*/, this.createNotAvailableResult('No news data in database - please run data ingestion first')];
                        }
                        // 2. Analyser les sentiments avec la solution finale robuste
                        console.log("[".concat(this.agentName, "] Analyzing ").concat(allNews.length, " news items from DATABASE..."));
                        return [4 /*yield*/, this.performRobustSentimentAnalysis(allNews, true)];
                    case 9:
                        result = _a.sent();
                        if (!dbConnected) return [3 /*break*/, 11];
                        return [4 /*yield*/, this.dbService.saveSentimentAnalysis(result)];
                    case 10:
                        _a.sent();
                        _a.label = 11;
                    case 11: return [2 /*return*/, __assign(__assign({}, result), { data_source: cacheFresh ? 'database_cache' : 'database_fresh', news_count: allNews.length, analysis_method: 'robust_kilocode_v2' })];
                    case 12:
                        error_1 = _a.sent();
                        console.error("[".concat(this.agentName, "] Analysis failed:"), error_1);
                        return [2 /*return*/, this.createNotAvailableResult("Analysis failed: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'))];
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Récupère les news pour l'analyse avec paramètre personnalisé
     */
    Vortex500Agent.prototype.getNewsForAnalysisExtended = function (hoursBack) {
        return __awaiter(this, void 0, void 0, function () {
            var client, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.dbService.pool.connect()];
                    case 1:
                        client = _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, , 4, 5]);
                        return [4 /*yield*/, client.query("\n        SELECT id, title, url, source, published_at, scraped_at,\n               sentiment, confidence, keywords, market_hours, processing_status\n        FROM news_items\n        WHERE processing_status = 'processed'\n          AND published_at >= NOW() - INTERVAL '".concat(hoursBack, " hours'\n        ORDER BY published_at DESC\n        LIMIT 100\n      "))];
                    case 3:
                        result = _a.sent();
                        return [2 /*return*/, result.rows.map(function (row) {
                                // Formater la date en format lisible
                                var publishedDate = new Date(row.published_at);
                                var formattedDate = publishedDate.toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                });
                                // Nettoyer et normaliser le titre pour gérer les accents et l'encodage
                                var cleanTitle = String(row.title)
                                    .replace(/confidentiel/g, 'confidentiel')
                                    .replace(/œ/g, 'oe')
                                    .replace(/æ/g, 'ae')
                                    .replace(/à/g, 'a')
                                    .replace(/é/g, 'e')
                                    .replace(/è/g, 'e')
                                    .replace(/ù/g, 'u');
                                return {
                                    title: "".concat(cleanTitle, " [").concat(formattedDate, "]"),
                                    url: row.url,
                                    source: row.source,
                                    timestamp: publishedDate,
                                    sentiment: row.sentiment,
                                };
                            })];
                    case 4:
                        client.release();
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Récupère toutes les news traitées (sans limite de temps)
     */
    Vortex500Agent.prototype.getAllProcessedNews = function () {
        return __awaiter(this, void 0, void 0, function () {
            var client, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.dbService.pool.connect()];
                    case 1:
                        client = _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, , 4, 5]);
                        return [4 /*yield*/, client.query("\n        SELECT id, title, url, source, published_at, scraped_at,\n               sentiment, confidence, keywords, market_hours, processing_status\n        FROM news_items\n        WHERE processing_status = 'processed'\n        ORDER BY published_at DESC\n        LIMIT 100\n      ")];
                    case 3:
                        result = _a.sent();
                        return [2 /*return*/, result.rows.map(function (row) {
                                // Formater la date en format lisible
                                var publishedDate = new Date(row.published_at);
                                var formattedDate = publishedDate.toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                });
                                // Nettoyer et normaliser le titre pour gérer les accents et l'encodage
                                var cleanTitle = String(row.title)
                                    .replace(/confidentiel/g, 'confidentiel')
                                    .replace(/œ/g, 'oe')
                                    .replace(/æ/g, 'ae')
                                    .replace(/à/g, 'a')
                                    .replace(/é/g, 'e')
                                    .replace(/è/g, 'e')
                                    .replace(/ù/g, 'u');
                                return {
                                    title: "".concat(cleanTitle, " [").concat(formattedDate, "]"),
                                    url: row.url,
                                    source: row.source,
                                    timestamp: publishedDate,
                                    sentiment: row.sentiment,
                                };
                            })];
                    case 4:
                        client.release();
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Crée un résultat N/A standard
     */
    Vortex500Agent.prototype.createNotAvailableResult = function (reason) {
        return {
            sentiment: 'N/A',
            score: null,
            catalysts: [],
            risk_level: 'N/A',
            summary: "Analyse indisponible : ".concat(reason),
            data_source: 'error',
            news_count: 0,
            analysis_method: 'none',
        };
    };
    /**
     * Scraping robust des nouvelles
     */
    Vortex500Agent.prototype.scrapeFreshNews = function () {
        return __awaiter(this, void 0, void 0, function () {
            var sources, _a, zeroHedge, cnbc, financialJuice, results, counts, allNews_1, error_2;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        sources = ['ZeroHedge', 'CNBC', 'FinancialJuice'];
                        console.log("[".concat(this.agentName, "] Scraping from ").concat(sources.join(', '), "..."));
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, Promise.allSettled([
                                this.newsAggregator.fetchZeroHedgeHeadlines(),
                                this.newsAggregator.fetchCNBCMarketNews(),
                                this.newsAggregator.fetchFinancialJuice(),
                            ])];
                    case 2:
                        _a = _b.sent(), zeroHedge = _a[0], cnbc = _a[1], financialJuice = _a[2];
                        results = [zeroHedge, cnbc, financialJuice];
                        counts = results.map(function (r) { return (r.status === 'fulfilled' ? r.value.length : 0); });
                        allNews_1 = [];
                        results.forEach(function (result, index) {
                            if (result.status === 'fulfilled') {
                                allNews_1.push.apply(allNews_1, result.value);
                                _this.dbService.updateSourceStatus(sources[index], true);
                            }
                            else {
                                console.error("[".concat(_this.agentName, "] Failed to scrape ").concat(sources[index], ":"), result.reason);
                                _this.dbService.updateSourceStatus(sources[index], false, result.reason instanceof Error ? result.reason.message : 'Unknown error');
                            }
                        });
                        console.log("[".concat(this.agentName, "] Scraped ").concat(allNews_1.length, " headlines (ZH: ").concat(counts[0], ", CNBC: ").concat(counts[1], ", FJ: ").concat(counts[2], ")"));
                        return [2 /*return*/, allNews_1];
                    case 3:
                        error_2 = _b.sent();
                        console.error("[".concat(this.agentName, "] Scraping failed:"), error_2);
                        return [2 /*return*/, []];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Analyse finale robuste avec fallback multiples
     */
    Vortex500Agent.prototype.performRobustSentimentAnalysis = function (newsItems, _useCache) {
        return __awaiter(this, void 0, void 0, function () {
            var toonData, prompt, kilocodeError_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("[".concat(this.agentName, "] Starting ROBUST analysis with fallback methods..."));
                        toonData = ToonFormatter_1.ToonFormatter.arrayToToon('headlines', newsItems.map(function (n) { return ({
                            title: n.title,
                            src: n.source,
                        }); }));
                        prompt = this.createOptimizedPrompt(toonData);
                        console.log("[".concat(this.agentName, "] Prompt length: ").concat(prompt.length, " chars"));
                        // Réactiver l'affichage du prompt complet pour voir ce qui est envoyé
                        console.log("\n[".concat(this.agentName, "] \uD83D\uDD0D KILOCODE PROMPT SENT:"));
                        console.log('='.repeat(80));
                        console.log(prompt);
                        console.log('='.repeat(80));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.tryKiloCodeDirect(prompt, newsItems.length)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        kilocodeError_1 = _a.sent();
                        console.warn("[".concat(this.agentName, "] KiloCode failed - returning N/A: ").concat(kilocodeError_1 instanceof Error ? kilocodeError_1.message : 'Unknown error'));
                        // PAS DE FALLBACK - Retourner N/A comme demandé
                        return [2 /*return*/, this.createNotAvailableResult("KiloCode analysis failed: ".concat(kilocodeError_1 instanceof Error ? kilocodeError_1.message : 'Unknown error'))];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Crée le prompt optimisé pour KiloCode avec nettoyage des accents
     */
    Vortex500Agent.prototype.createOptimizedPrompt = function (toonData) {
        return "\nYou are an expert Market Sentiment Analyst for ES Futures (S&P 500).\n\nTASK:\nAnalyze the provided TOON data and return valid JSON.\n\nCRITICAL:\n- Output ONLY the JSON object\n- No markdown, no explanations\n- Must be parseable by JSON.parse()\n- **IMPORTANT: The 'summary' and 'catalysts' fields MUST be in FRENCH.**\n\nEXAMPLE:\n{\n  \"sentiment\": \"BEARISH\",\n  \"score\": -25,\n  \"catalysts\": [\"Baisse du Bitcoin\", \"Fed restrictive\"],\n  \"risk_level\": \"HIGH\",\n  \"summary\": \"Le sentiment de march\u00E9 est n\u00E9gatif en raison de...\"\n}\n\nSTRUCTURE:\n{\n  \"sentiment\": \"BULLISH\" | \"BEARISH\" | \"NEUTRAL\",\n  \"score\": number between -100 and 100,\n  \"catalysts\": [\"string (en Fran\u00E7ais)\", \"string (en Fran\u00E7ais)\"],\n  \"risk_level\": \"LOW\" | \"MEDIUM\" | \"HIGH\",\n  \"summary\": \"Brief explanation in French\"\n}\n\nDATA:\n".concat(toonData, "\n\nRULES:\n1. Analyze all headlines (News) AND Macro Data (FRED)\n2. Macro Data (Yield Curve, Inflation, etc.) is CRITICAL for context\n3. Return ONLY JSON\n4. No conversational text\n5. **WRITE IN FRENCH**\n");
    };
    /**
     * KiloCode DIRECT - Pas de fallback, N/A si échoue
     */
    Vortex500Agent.prototype.tryKiloCodeDirect = function (prompt, newsCount) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Confirmer explicitement que les données viennent de la base de données
                        console.log("\n[".concat(this.agentName, "] \uD83D\uDCCA DATABASE-ONLY PROCESS:"));
                        console.log("   \u251C\u2500 Extracted ".concat(newsCount, " news items from PostgreSQL"));
                        console.log("   \u251C\u2500 Creating database.md buffer with TOON format");
                        console.log("   \u2514\u2500 No web scraping - pure database analysis");
                        console.log("[".concat(this.agentName, "] \uD83D\uDE80 Executing KiloCode analysis..."));
                        return [4 /*yield*/, this.tryKiloCodeWithFile(prompt)];
                    case 1:
                        result = _a.sent();
                        console.log("[".concat(this.agentName, "] \u2705 KiloCode analysis successful!"));
                        return [2 /*return*/, result || this.createNotAvailableResult('KiloCode returned null')];
                }
            });
        });
    };
    /**
     * Approche 1: Fichier database.md buffer avec format TOON (le plus propre)
     */
    Vortex500Agent.prototype.tryKiloCodeWithFile = function (prompt) {
        return __awaiter(this, void 0, void 0, function () {
            var bufferPath, toonContent, isWindows, readCommand, command, stdout;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        bufferPath = "database.md";
                        toonContent = this.createDatabaseBufferMarkdown(prompt);
                        return [4 /*yield*/, fs.writeFile(bufferPath, toonContent, 'utf-8')];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, , 4, 5]);
                        isWindows = process.platform === 'win32';
                        readCommand = isWindows ? "type \"".concat(bufferPath, "\"") : "cat \"".concat(bufferPath, "\"");
                        command = "".concat(readCommand, " | kilocode -m ask --auto --json");
                        console.log("[".concat(this.agentName, "] Using DATABASE.MD buffer: ").concat(readCommand, " | kilocode"));
                        return [4 /*yield*/, this.execAsync(command, {
                                timeout: 90000,
                                cwd: process.cwd(),
                            })];
                    case 3:
                        stdout = (_a.sent()).stdout;
                        return [2 /*return*/, this.parseRobustOutput(stdout)];
                    case 4:
                        // Garder le fichier pour inspection (décommenter pour supprimer)
                        // await fs.unlink(bufferPath).catch(() => {});
                        console.log("[".concat(this.agentName, "] \uD83D\uDCC4 Database buffer kept for inspection: ").concat(bufferPath));
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Crée le fichier buffer database.md avec format Markdown + TOON
     */
    Vortex500Agent.prototype.createDatabaseBufferMarkdown = function (prompt) {
        // Extraire la section DATA du prompt pour l'afficher dans le buffer
        var dataMatch = prompt.match(/DATA:\n([\s\S]*?)RULES:/);
        var toonData = dataMatch ? dataMatch[1].trim() : 'No data found';
        return "\n# Database Buffer - Market Sentiment Analysis\n\n## \uD83D\uDCCA Data Source: PostgreSQL Database\n- **Extraction**: 22 news items from database\n- **Mode**: DATABASE-ONLY (no web scraping)\n- **Cache Status**: FRESH (within 2 hours)\n- **Processing**: TOON format for KiloCode AI\n\n## \uD83D\uDCF0 Database News Items (TOON Format)\n\n```\n".concat(toonData, "\n```\n\n## \uD83E\uDD16 AI Analysis Instructions\n\nYou are an expert Market Sentiment Analyst for ES Futures (S&P 500).\n\nTASK: Analyze the TOON data above and return valid JSON.\n\nCRITICAL:\n- Output ONLY the JSON object\n- No markdown, no explanations\n- Must be parseable by JSON.parse()\n- **IMPORTANT: The 'summary' and 'catalysts' fields MUST be in FRENCH.**\n\nREQUIRED JSON STRUCTURE:\n```json\n{\n  \"sentiment\": \"BULLISH\" | \"BEARISH\" | \"NEUTRAL\",\n  \"score\": number between -100 and 100,\n  \"catalysts\": [\"string (en Fran\u00E7ais)\", \"string (en Fran\u00E7ais)\"],\n  \"risk_level\": \"LOW\" | \"MEDIUM\" | \"HIGH\",\n  \"summary\": \"Brief explanation in French\"\n}\n```\n\nRULES:\n1. Analyze all headlines from database\n2. Return ONLY JSON\n3. No conversational text\n4. **WRITE IN FRENCH**\n\n---\n*Generated: ").concat(new Date().toISOString(), "*\n*Buffer: database.md*\n");
    };
    /**
     * Parsing robust avec nettoyage ANSI et fallback multiples
     */
    Vortex500Agent.prototype.parseRobustOutput = function (stdout) {
        console.log("[".concat(this.agentName, "] Parsing robust output (").concat(stdout.length, " chars)..."));
        try {
            // Nettoyage amélioré des séquences ANSI et caractères de contrôle
            var cleanOutput = this.stripAnsiCodes(stdout);
            // 1. Chercher d'abord le JSON final complet (pattern le plus spécifique)
            var finalJsonMatch = cleanOutput.match(/\{[^{}]*"sentiment"[^{}]*\}[^{}]*\}/g);
            if (finalJsonMatch) {
                for (var _i = 0, finalJsonMatch_1 = finalJsonMatch; _i < finalJsonMatch_1.length; _i++) {
                    var match = finalJsonMatch_1[_i];
                    try {
                        var cleaned = match.replace(/^[\s\n\r]+|[\s\n\r]+$/g, '');
                        var parsed = JSON.parse(cleaned);
                        if (this.isValidSentimentResult(parsed)) {
                            console.log("[".concat(this.agentName, "] \u2705 Found valid JSON via final pattern"));
                            return this.validateSentimentResult(parsed);
                        }
                    }
                    catch (_a) {
                        // Continuer avec le prochain match
                    }
                }
            }
            // 2. Améliorer la recherche de JSON dans tout le texte (méthode plus agressive)
            var enhancedJsonSearch = cleanOutput.match(/\{[\s\S]*?"sentiment"[\s\S]*?"score"[\s\S]*?"risk_level"[\s\S]*?"catalysts"[\s\S]*?"summary"[\s\S]*?\}[\s\S]*\}/g);
            if (enhancedJsonSearch) {
                for (var _b = 0, enhancedJsonSearch_1 = enhancedJsonSearch; _b < enhancedJsonSearch_1.length; _b++) {
                    var match = enhancedJsonSearch_1[_b];
                    try {
                        var cleaned = match.replace(/^[\s\n\r]+|[\s\n\r]+$/g, '');
                        var parsed = JSON.parse(cleaned);
                        if (this.isValidSentimentResult(parsed)) {
                            console.log("[".concat(this.agentName, "] \u2705 Found valid JSON via enhanced pattern"));
                            return this.validateSentimentResult(parsed);
                        }
                    }
                    catch (_c) {
                        // Continuer avec le prochain match
                    }
                }
            }
            // 2. Parser NDJSON ligne par ligne
            var lines = cleanOutput.split('\n').filter(function (line) { return line.trim() !== ''; });
            for (var _d = 0, lines_1 = lines; _d < lines_1.length; _d++) {
                var line = lines_1[_d];
                try {
                    var event_1 = JSON.parse(line);
                    // Priorité: metadata JSON (le plus fiable)
                    if (event_1.metadata &&
                        (event_1.metadata.sentiment || event_1.metadata.score || event_1.metadata.catalysts)) {
                        return this.validateSentimentResult(event_1.metadata);
                    }
                    // Deuxième: completion_result content
                    if (event_1.type === 'completion_result' && event_1.content) {
                        var parsed = this.extractJsonFromContent(event_1.content);
                        if (parsed)
                            return this.validateSentimentResult(parsed);
                    }
                    // Troisième: text content (pas reasoning)
                    if (event_1.type === 'say' && event_1.say !== 'reasoning' && event_1.content) {
                        var parsed = this.extractJsonFromContent(event_1.content);
                        if (parsed)
                            return this.validateSentimentResult(parsed);
                    }
                }
                catch (_e) {
                    // Ignorer les lignes non-JSON
                }
            }
            // 3. Fallback: chercher JSON dans tout le texte avec patterns améliorés
            var fallbackParsed = this.extractJsonFromContent(cleanOutput);
            if (fallbackParsed) {
                return this.validateSentimentResult(fallbackParsed);
            }
        }
        catch (error) {
            console.warn("[".concat(this.agentName, "] NDJSON parsing failed: ").concat(error instanceof Error ? error.message : 'Unknown error'));
        }
        throw new Error('No valid JSON found in any method');
    };
    /**
     * Vérifie si un résultat de sentiment est valide
     */
    Vortex500Agent.prototype.isValidSentimentResult = function (result) {
        return (result &&
            typeof result === 'object' &&
            typeof result.sentiment === 'string' &&
            typeof result.score === 'number' &&
            ['BULLISH', 'BEARISH', 'NEUTRAL'].includes(result.sentiment.toUpperCase()));
    };
    /**
     * Extrait JSON du contenu avec multiples patterns
     */
    Vortex500Agent.prototype.extractJsonFromContent = function (content) {
        var patterns = [
            /\{[\s\S]*?"sentiment"[\s\S]*?\}/g, // Standard JSON
            /\{[\s\S]*?\}/g, // N'importe quel objet JSON
            /sentiment["\s]*:\s*"[^"]+"/, // Format clé-valeur
            /sentiment["\s]*:\s*[^,}]+/m, // Format clé-valeur (non-quoté)
        ];
        for (var _i = 0, patterns_1 = patterns; _i < patterns_1.length; _i++) {
            var pattern = patterns_1[_i];
            var match = content.match(pattern);
            if (match) {
                try {
                    return JSON.parse(match[0]);
                }
                catch (_a) {
                    continue;
                }
            }
        }
        return null;
    };
    /**
     * Valide et normalise le résultat pour le SentimentAgent avec nettoyage
     */
    Vortex500Agent.prototype.validateSentimentResult = function (result) {
        if (!result || typeof result !== 'object') {
            return this.createValidatedResult();
        }
        var resultObj = result;
        return this.createValidatedResult({
            sentiment: resultObj.sentiment,
            score: resultObj.score,
            risk_level: resultObj.risk_level,
            catalysts: resultObj.catalysts,
            summary: resultObj.summary,
        });
    };
    /**
     * Strip ANSI escape codes from a string
     */
    Vortex500Agent.prototype.stripAnsiCodes = function (str) {
        // Remove ANSI escape sequences
        var ansiRegex = new RegExp('\x1b\\[[0-9;]*[A-Za-z]', 'g');
        return str.replace(ansiRegex, '');
    };
    /**
     * Crée un résultat validé avec nettoyage des caractères pour Discord
     */
    Vortex500Agent.prototype.createValidatedResult = function (override) {
        if (override === void 0) { override = {}; }
        // Fonction de nettoyage pour corriger l'encodage et les accents
        var cleanForDisplay = function (text) {
            return String(text)
                .replace(/confidentiel/g, 'confidentiel')
                .replace(/œ/g, 'oe')
                .replace(/æ/g, 'ae')
                .replace(/à/g, 'a')
                .replace(/é/g, 'e')
                .replace(/è/g, 'e')
                .replace(/ù/g, 'u')
                .replace(/[^a-zA-Z0-9\s.!?]/g, ''); // Garder seulement lettres, chiffres, espaces et ponctuation simple
        };
        return {
            sentiment: override.sentiment &&
                ['BULLISH', 'BEARISH', 'NEUTRAL'].includes(override.sentiment.toUpperCase())
                ? override.sentiment.toUpperCase()
                : 'NEUTRAL',
            score: typeof override.score === 'number' && override.score >= -100 && override.score <= 100
                ? override.score
                : 0,
            risk_level: override.risk_level &&
                ['LOW', 'MEDIUM', 'HIGH'].includes(override.risk_level.toUpperCase())
                ? override.risk_level.toUpperCase()
                : 'MEDIUM',
            catalysts: Array.isArray(override.catalysts)
                ? override.catalysts
                    .filter(function (c) { return typeof c === 'string'; })
                    .slice(0, 5)
                : [],
            summary: typeof override.summary === 'string'
                ? cleanForDisplay(override.summary)
                : 'Aucune analyse disponible',
        };
    };
    return Vortex500Agent;
}(BaseAgentSimple_1.BaseAgentSimple));
exports.Vortex500Agent = Vortex500Agent;
