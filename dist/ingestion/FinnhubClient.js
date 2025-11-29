"use strict";
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
exports.FinnhubClient = void 0;
var axios_1 = require("axios");
var dotenv = require("dotenv");
var SP500FuturesScraper_1 = require("./SP500FuturesScraper");
dotenv.config();
var FinnhubClient = /** @class */ (function () {
    function FinnhubClient() {
        this.baseUrl = 'https://finnhub.io/api/v1';
        this.apiKey = process.env.FINNHUB_API_KEY || '';
        this.futuresScraper = new SP500FuturesScraper_1.SP500FuturesScraper();
        if (!this.apiKey) {
            console.warn('⚠️ FINNHUB_API_KEY is missing. Finnhub data will not be fetched.');
        }
    }
    /**
     * Récupère les news générales du marché
     */
    FinnhubClient.prototype.fetchMarketNews = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.apiKey)
                            return [2 /*return*/, []];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, axios_1.default.get("".concat(this.baseUrl, "/news"), {
                                params: {
                                    category: 'general',
                                    token: this.apiKey,
                                },
                                timeout: 5000,
                            })];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, response.data.slice(0, 10)]; // Top 10 news
                    case 3:
                        error_1 = _a.sent();
                        console.error('❌ Error fetching Finnhub news:', error_1 instanceof Error ? error_1.message : error_1);
                        return [2 /*return*/, []];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Récupère le sentiment des news (si disponible dans le plan gratuit)
     * Sinon, on se contente des news brutes
     */
    FinnhubClient.prototype.fetchNewsSentiment = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Note: L'endpoint sentiment est souvent Premium.
                // On se concentre sur les news brutes pour l'instant.
                return [2 /*return*/, null];
            });
        });
    };
    /**
     * Récupère les données de marché d'un indice ou action en temps réel
     * Utilise l'endpoint /quote pour les données actuelles
     */
    FinnhubClient.prototype.fetchQuote = function (symbol) {
        return __awaiter(this, void 0, void 0, function () {
            var response, data, stockData, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.apiKey)
                            return [2 /*return*/, null];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        console.log("[Finnhub] R\u00E9cup\u00E9ration des donn\u00E9es pour ".concat(symbol, "..."));
                        return [4 /*yield*/, axios_1.default.get("".concat(this.baseUrl, "/quote"), {
                                params: {
                                    symbol: symbol,
                                    token: this.apiKey,
                                },
                                timeout: 5000,
                            })];
                    case 2:
                        response = _a.sent();
                        data = response.data;
                        if (data.c === null || data.c === undefined) {
                            console.warn("[Finnhub] Pas de donn\u00E9es valides pour ".concat(symbol));
                            return [2 /*return*/, null];
                        }
                        // Récupérer aussi les métadonnées de base
                        return [4 /*yield*/, axios_1.default
                                .get("".concat(this.baseUrl, "/stock/profile2"), {
                                params: {
                                    symbol: symbol,
                                    token: this.apiKey,
                                },
                                timeout: 3000,
                            })
                                .catch(function () { return ({ data: { name: symbol } }); })];
                    case 3:
                        // Récupérer aussi les métadonnées de base
                        _a.sent();
                        stockData = {
                            current: data.c, // Current price
                            change: data.d, // Change
                            percent_change: data.dp, // Percent change
                            high: data.h, // High price of the day
                            low: data.l, // Low price of the day
                            open: data.o, // Open price of the day
                            previous_close: data.pc, // Previous close price
                            timestamp: data.t || Math.floor(Date.now() / 1000), // Timestamp
                            symbol: symbol,
                        };
                        console.log("[Finnhub] \u2705 Donn\u00E9es r\u00E9cup\u00E9r\u00E9es pour ".concat(symbol, ": ").concat(stockData.current, " (").concat(stockData.change > 0 ? '+' : '').concat(stockData.percent_change, "%)"));
                        return [2 /*return*/, stockData];
                    case 4:
                        error_2 = _a.sent();
                        console.error("\u274C [Finnhub] Erreur lors de la r\u00E9cup\u00E9ration des donn\u00E9es pour ".concat(symbol, ":"), error_2 instanceof Error ? error_2.message : error_2);
                        return [2 /*return*/, null];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Récupère spécifiquement les données du contrat future ES (E-mini S&P 500)
     * Méthode améliorée avec scraping prioritaire pour obtenir le vrai prix du contrat future S&P500
     */
    FinnhubClient.prototype.fetchESFutures = function () {
        return __awaiter(this, void 0, void 0, function () {
            var futuresData, error_3, futuresData, error_4, futureSymbols, _i, futureSymbols_1, symbol, data, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("[Finnhub] \uD83D\uDD04 R\u00E9cup\u00E9ration ES Futures (S&P500) - Sources multiples...");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        console.log("[Finnhub] 1\uFE0F\u20E3 Tentative scraping direct des futures avec niveaux ZeroHedge...");
                        return [4 /*yield*/, this.futuresScraper.fetchSP500FuturesWithZeroHedge()];
                    case 2:
                        futuresData = _a.sent();
                        if (futuresData && futuresData.current && futuresData.current > 1000) {
                            console.log("[Finnhub] \u2705 ES Futures via scraping (".concat(futuresData.source, "): ").concat(futuresData.current.toFixed(2), " (").concat((futuresData.change || 0) > 0 ? '+' : '').concat((futuresData.percent_change || 0).toFixed(2), "%)"));
                            // Afficher les niveaux techniques si disponibles
                            if (futuresData.zero_hedge_analysis) {
                                console.log("[Finnhub] \uD83D\uDCCA Niveaux ZeroHedge:");
                                if (futuresData.support_levels && futuresData.support_levels.length > 0) {
                                    console.log("[Finnhub]   Supports: [".concat(futuresData.support_levels.slice(0, 5).join(', ')).concat(futuresData.support_levels.length > 5 ? '...' : '', "]"));
                                }
                                if (futuresData.resistance_levels && futuresData.resistance_levels.length > 0) {
                                    console.log("[Finnhub]   R\u00E9sistances: [".concat(futuresData.resistance_levels.slice(0, 5).join(', ')).concat(futuresData.resistance_levels.length > 5 ? '...' : '', "]"));
                                }
                                console.log("[Finnhub]   Sentiment ZeroHedge: ".concat(futuresData.zero_hedge_analysis.sentiment));
                                if (futuresData.zero_hedge_analysis.key_messages.length > 0) {
                                    console.log("[Finnhub]   Messages cl\u00E9s: ".concat(futuresData.zero_hedge_analysis.key_messages.slice(0, 2).join(' | ')));
                                }
                            }
                            return [2 /*return*/, {
                                    current: futuresData.current,
                                    change: futuresData.change || 0,
                                    percent_change: futuresData.percent_change || 0,
                                    high: futuresData.high || futuresData.current,
                                    low: futuresData.low || futuresData.current,
                                    open: futuresData.open || futuresData.current,
                                    previous_close: futuresData.previous_close || futuresData.current,
                                    timestamp: Math.floor(Date.now() / 1000),
                                    symbol: "ES_".concat(futuresData.source.replace(/\s+/g, '_')),
                                }];
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _a.sent();
                        console.log("[Finnhub] \u00C9chec scraping futures:", error_3 instanceof Error ? error_3.message : error_3);
                        return [3 /*break*/, 4];
                    case 4:
                        _a.trys.push([4, 6, , 7]);
                        console.log("[Finnhub] 1\uFE0F\u20E3B Tentative scraping direct des futures (sans ZeroHedge)...");
                        return [4 /*yield*/, this.futuresScraper.fetchSP500Futures()];
                    case 5:
                        futuresData = _a.sent();
                        if (futuresData && futuresData.current && futuresData.current > 1000) {
                            console.log("[Finnhub] \u2705 ES Futures via scraping (".concat(futuresData.source, "): ").concat(futuresData.current.toFixed(2), " (").concat((futuresData.change || 0) > 0 ? '+' : '').concat((futuresData.percent_change || 0).toFixed(2), "%)"));
                            return [2 /*return*/, {
                                    current: futuresData.current,
                                    change: futuresData.change || 0,
                                    percent_change: futuresData.percent_change || 0,
                                    high: futuresData.high || futuresData.current,
                                    low: futuresData.low || futuresData.current,
                                    open: futuresData.open || futuresData.current,
                                    previous_close: futuresData.previous_close || futuresData.current,
                                    timestamp: Math.floor(Date.now() / 1000),
                                    symbol: "ES_".concat(futuresData.source.replace(/\s+/g, '_')),
                                }];
                        }
                        return [3 /*break*/, 7];
                    case 6:
                        error_4 = _a.sent();
                        console.log("[Finnhub] \u00C9chec scraping futures backup:", error_4 instanceof Error ? error_4.message : error_4);
                        return [3 /*break*/, 7];
                    case 7:
                        // PRIORITÉ 2: API Finnhub avec symboles futures
                        console.log("[Finnhub] 2\uFE0F\u20E3 Tentative API Finnhub avec symboles futures...");
                        futureSymbols = [
                            'ES=F', // Yahoo Finance format
                            'ES1!', // Interactive Brokers format
                            '@ES.1', // TD Ameritrade format
                            'E-mini S&P 500', // Descriptif
                        ];
                        _i = 0, futureSymbols_1 = futureSymbols;
                        _a.label = 8;
                    case 8:
                        if (!(_i < futureSymbols_1.length)) return [3 /*break*/, 13];
                        symbol = futureSymbols_1[_i];
                        _a.label = 9;
                    case 9:
                        _a.trys.push([9, 11, , 12]);
                        console.log("[Finnhub] Tentative API avec symbole: ".concat(symbol));
                        return [4 /*yield*/, this.fetchQuote(symbol)];
                    case 10:
                        data = _a.sent();
                        if (data && data.current && data.current > 0) {
                            // Vérifier si le prix semble correct pour les ES Futures (généralement > 4000)
                            if (data.current > 1000) {
                                // Les ES futures sont autour de 4000-5000
                                console.log("[Finnhub] \u2705 ES Futures r\u00E9ussi via API ".concat(symbol, ": ").concat(data.current.toFixed(2), " (").concat(data.change > 0 ? '+' : '').concat(data.percent_change.toFixed(2), "%)"));
                                return [2 /*return*/, __assign(__assign({}, data), { symbol: 'ES_FUTURES_API' })];
                            }
                            else {
                                console.log("[Finnhub] \u26A0\uFE0F Prix incorrect pour ".concat(symbol, ": ").concat(data.current, " (trop bas pour ES Futures)"));
                            }
                        }
                        return [3 /*break*/, 12];
                    case 11:
                        error_5 = _a.sent();
                        console.log("[Finnhub] \u00C9chec API avec ".concat(symbol, ":"), error_5 instanceof Error ? error_5.message : error_5);
                        return [3 /*break*/, 12];
                    case 12:
                        _i++;
                        return [3 /*break*/, 8];
                    case 13:
                        console.log("[Finnhub] \u274C Toutes les sources ES Futures ont \u00E9chou\u00E9");
                        return [2 /*return*/, null];
                }
            });
        });
    };
    /**
     * Récupère spécifiquement les données du S&P 500
     * Version corrigée qui essaie d'abord les vrais contrats futures
     */
    FinnhubClient.prototype.fetchSP500Data = function () {
        return __awaiter(this, void 0, void 0, function () {
            var esData, spyData, estimatedESPrice, esData_1, error_6, qqqData, multiplier, esData, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("[Finnhub] \uD83D\uDD04 R\u00E9cup\u00E9ration des donn\u00E9es S&P 500 (priorit\u00E9 Futures)...");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.fetchESFutures()];
                    case 2:
                        esData = _a.sent();
                        if (esData) {
                            return [2 /*return*/, esData];
                        }
                        console.log("[Finnhub] \u26A0\uFE0F ES Futures indisponible, fallback vers SPY ETF...");
                        return [4 /*yield*/, this.fetchQuote('SPY')];
                    case 3:
                        spyData = _a.sent();
                        if (spyData) {
                            estimatedESPrice = spyData.current * 10.0;
                            esData_1 = __assign(__assign({}, spyData), { current: Math.round(estimatedESPrice * 100) / 100, high: Math.round(spyData.high * 10.0 * 100) / 100, low: Math.round(spyData.low * 10.0 * 100) / 100, open: Math.round(spyData.open * 10.0 * 100) / 100, previous_close: Math.round(spyData.previous_close * 10.0 * 100) / 100, change: Math.round(spyData.change * 10.0 * 100) / 100, symbol: 'ES_FROM_SPY' });
                            console.log("[Finnhub] \u26A1 ES Futures (estim\u00E9 via SPY): ".concat(esData_1.current.toFixed(2), " (").concat(esData_1.change > 0 ? '+' : '').concat(esData_1.percent_change.toFixed(2), "%)"));
                            return [2 /*return*/, esData_1];
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        error_6 = _a.sent();
                        console.error("[Finnhub] Erreur r\u00E9cup\u00E9ration S&P 500:", error_6);
                        return [3 /*break*/, 5];
                    case 5:
                        // PRIORITÉ 3: Dernier fallback avec QQQ si SPY échoue
                        console.warn("[Finnhub] \u26A0\uFE0F SPY indisponible, tentative finale avec QQQ...");
                        _a.label = 6;
                    case 6:
                        _a.trys.push([6, 8, , 9]);
                        return [4 /*yield*/, this.fetchQuote('QQQ')];
                    case 7:
                        qqqData = _a.sent();
                        if (qqqData) {
                            multiplier = 12.0;
                            esData = __assign(__assign({}, qqqData), { current: Math.round(qqqData.current * multiplier * 100) / 100, high: Math.round(qqqData.high * multiplier * 100) / 100, low: Math.round(qqqData.low * multiplier * 100) / 100, open: Math.round(qqqData.open * multiplier * 100) / 100, previous_close: Math.round(qqqData.previous_close * multiplier * 100) / 100, change: Math.round(qqqData.change * multiplier * 100) / 100, symbol: 'ES_FROM_QQQ' });
                            console.log("[Finnhub] \uD83D\uDD25 ES Futures (via QQQ fallback): ".concat(esData.current.toFixed(2), " (").concat(esData.change > 0 ? '+' : '').concat(esData.percent_change.toFixed(2), "%)"));
                            return [2 /*return*/, esData];
                        }
                        return [3 /*break*/, 9];
                    case 8:
                        error_7 = _a.sent();
                        console.error("[Finnhub] Erreur r\u00E9cup\u00E9ration QQQ:", error_7);
                        return [3 /*break*/, 9];
                    case 9:
                        console.error("[Finnhub] \u274C Impossible de r\u00E9cup\u00E9rer les donn\u00E9es S&P 500 avec toutes les m\u00E9thodes");
                        return [2 /*return*/, null];
                }
            });
        });
    };
    /**
     * Récupère les données de plusieurs indices populaires en parallèle
     * Utilise les ETFs des indices car plus fiables que les indices bruts
     */
    FinnhubClient.prototype.fetchMultipleIndices = function () {
        return __awaiter(this, arguments, void 0, function (symbols) {
            var promises, results, validResults;
            var _this = this;
            if (symbols === void 0) { symbols = ['SPY', 'QQQ', 'DIA']; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.apiKey)
                            return [2 /*return*/, []];
                        console.log("[Finnhub] R\u00E9cup\u00E9ration parall\u00E8le des indices: ".concat(symbols.join(', ')));
                        promises = symbols.map(function (symbol) { return _this.fetchQuote(symbol); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        results = _a.sent();
                        validResults = results.filter(function (item) { return item !== null; });
                        console.log("[Finnhub] ".concat(validResults.length, "/").concat(symbols.length, " indices r\u00E9cup\u00E9r\u00E9s avec succ\u00E8s"));
                        return [2 /*return*/, validResults];
                }
            });
        });
    };
    /**
     * Récupère les données des principaux indices boursiers avec des noms explicites
     */
    FinnhubClient.prototype.fetchMajorIndices = function () {
        return __awaiter(this, void 0, void 0, function () {
            var indicesMapping, results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        indicesMapping = [
                            { name: 'S&P 500', symbol: 'SPY' },
                            { name: 'NASDAQ', symbol: 'QQQ' },
                            { name: 'Dow Jones', symbol: 'DIA' },
                        ];
                        return [4 /*yield*/, this.fetchMultipleIndices(indicesMapping.map(function (i) { return i.symbol; }))];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results.map(function (data, index) { return ({
                                name: indicesMapping[index].name,
                                data: data,
                            }); })];
                }
            });
        });
    };
    return FinnhubClient;
}());
exports.FinnhubClient = FinnhubClient;
