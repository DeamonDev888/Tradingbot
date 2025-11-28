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
exports.NewsAggregator = void 0;
var axios_1 = require("axios");
var cheerio = require("cheerio");
var FredClient_1 = require("./FredClient");
var FinnhubClient_1 = require("./FinnhubClient");
var pg_1 = require("pg");
var dotenv = require("dotenv");
dotenv.config();
var NewsAggregator = /** @class */ (function () {
    function NewsAggregator() {
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
    NewsAggregator.prototype.fetchZeroHedgeHeadlines = function () {
        return __awaiter(this, void 0, void 0, function () {
            var data, $_1, news_1, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios_1.default.get('http://feeds.feedburner.com/zerohedge/feed', {
                                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NovaQuoteAgent/1.0)' },
                                timeout: 5000,
                            })];
                    case 1:
                        data = (_a.sent()).data;
                        $_1 = cheerio.load(data, { xmlMode: true });
                        news_1 = [];
                        $_1('item').each(function (_, el) {
                            var title = $_1(el).find('title').text().trim();
                            var link = $_1(el).find('link').text().trim();
                            var pubDate = $_1(el).find('pubDate').text();
                            if (title && link) {
                                news_1.push({
                                    title: title,
                                    source: 'ZeroHedge',
                                    url: link,
                                    timestamp: new Date(pubDate),
                                });
                            }
                        });
                        return [2 /*return*/, news_1.slice(0, 10)]; // Top 10 news
                    case 2:
                        error_1 = _a.sent();
                        console.error('Error fetching ZeroHedge RSS:', error_1 instanceof Error ? error_1.message : error_1);
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Récupère les news de CNBC (US Markets) via RSS
     * Plus pertinent pour le S&P 500 (ES Futures) que ZoneBourse.
     */
    NewsAggregator.prototype.fetchCNBCMarketNews = function () {
        return __awaiter(this, void 0, void 0, function () {
            var data, $_2, news_2, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios_1.default.get('https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664', {
                                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NovaQuoteAgent/1.0)' },
                                timeout: 5000,
                            })];
                    case 1:
                        data = (_a.sent()).data;
                        $_2 = cheerio.load(data, { xmlMode: true });
                        news_2 = [];
                        $_2('item').each(function (_, el) {
                            var title = $_2(el).find('title').text().trim();
                            var link = $_2(el).find('link').text().trim();
                            var pubDate = $_2(el).find('pubDate').text();
                            if (title && link) {
                                news_2.push({
                                    title: title,
                                    source: 'CNBC',
                                    url: link,
                                    timestamp: new Date(pubDate),
                                });
                            }
                        });
                        return [2 /*return*/, news_2.slice(0, 10)];
                    case 2:
                        error_2 = _a.sent();
                        console.error('Error fetching CNBC RSS:', error_2 instanceof Error ? error_2.message : error_2);
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Récupère les news de FinancialJuice via RSS
     * URL: https://www.financialjuice.com/feed.ashx?xy=rss
     */
    NewsAggregator.prototype.fetchFinancialJuice = function () {
        return __awaiter(this, void 0, void 0, function () {
            var data, $_3, news_3, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios_1.default.get('https://www.financialjuice.com/feed.ashx?xy=rss', {
                                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NovaQuoteAgent/1.0)' },
                                timeout: 5000,
                            })];
                    case 1:
                        data = (_a.sent()).data;
                        $_3 = cheerio.load(data, { xmlMode: true });
                        news_3 = [];
                        $_3('item').each(function (_, el) {
                            var title = $_3(el).find('title').text().trim();
                            var link = $_3(el).find('link').text().trim();
                            var pubDate = $_3(el).find('pubDate').text();
                            if (title && link) {
                                news_3.push({
                                    title: title,
                                    source: 'FinancialJuice',
                                    url: link,
                                    timestamp: new Date(pubDate),
                                });
                            }
                        });
                        return [2 /*return*/, news_3.slice(0, 20)]; // Top 20 news
                    case 2:
                        error_3 = _a.sent();
                        console.error('Error fetching FinancialJuice RSS:', error_3 instanceof Error ? error_3.message : error_3);
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Récupère les indicateurs économiques via FRED
     */
    NewsAggregator.prototype.fetchFredEconomicData = function () {
        return __awaiter(this, void 0, void 0, function () {
            var indicators, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.fredClient.fetchAllKeyIndicators()];
                    case 1:
                        indicators = _a.sent();
                        return [2 /*return*/, indicators.map(function (ind) { return ({
                                title: "[MACRO DATA] ".concat(ind.title, ": ").concat(ind.value, " (As of ").concat(ind.date, ")"),
                                source: 'FRED',
                                // URL unique par date pour éviter la déduplication abusive si la valeur change
                                url: "https://fred.stlouisfed.org/series/".concat(ind.id, "?date=").concat(ind.date),
                                timestamp: new Date(ind.date),
                                sentiment: 'neutral', // Le sentiment sera analysé par l'IA
                            }); })];
                    case 2:
                        error_4 = _a.sent();
                        console.error('Error fetching FRED data:', error_4);
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Récupère les news via Finnhub
     */
    NewsAggregator.prototype.fetchFinnhubNews = function () {
        return __awaiter(this, void 0, void 0, function () {
            var news, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.finnhubClient.fetchMarketNews()];
                    case 1:
                        news = _a.sent();
                        return [2 /*return*/, news.map(function (n) { return ({
                                title: n.headline,
                                source: 'Finnhub',
                                url: n.url,
                                timestamp: new Date(n.datetime * 1000), // Finnhub utilise des timestamps Unix
                                sentiment: 'neutral',
                            }); })];
                    case 2:
                        error_5 = _a.sent();
                        console.error('Error fetching Finnhub news:', error_5);
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Placeholder pour TradingEconomics
     */
    NewsAggregator.prototype.fetchTradingEconomicsCalendar = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, []];
            });
        });
    };
    /**
     * Sauvegarde les news dans la base de données
     */
    NewsAggregator.prototype.saveNewsToDatabase = function (news) {
        return __awaiter(this, void 0, void 0, function () {
            var client, savedCount, _i, news_4, item, e_1, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (news.length === 0)
                            return [2 /*return*/];
                        return [4 /*yield*/, this.pool.connect()];
                    case 1:
                        client = _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 10, 11, 12]);
                        // Créer la table si elle n'existe pas
                        return [4 /*yield*/, client.query("\n        CREATE TABLE IF NOT EXISTS news_items (\n            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n            title VARCHAR(1000) NOT NULL,\n            source VARCHAR(100) NOT NULL,\n            url TEXT,\n            content TEXT,\n            sentiment VARCHAR(20),\n            published_at TIMESTAMP WITH TIME ZONE,\n            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n            UNIQUE(title, source, published_at)\n        );\n      ")];
                    case 3:
                        // Créer la table si elle n'existe pas
                        _a.sent();
                        savedCount = 0;
                        _i = 0, news_4 = news;
                        _a.label = 4;
                    case 4:
                        if (!(_i < news_4.length)) return [3 /*break*/, 9];
                        item = news_4[_i];
                        _a.label = 5;
                    case 5:
                        _a.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, client.query("\n                INSERT INTO news_items (title, source, url, content, sentiment, published_at)\n                VALUES ($1, $2, $3, $4, $5, $6)\n                ON CONFLICT (title, source, published_at) DO NOTHING\n            ", [item.title, item.source, item.url, item.content, item.sentiment, item.timestamp])];
                    case 6:
                        _a.sent();
                        savedCount++;
                        return [3 /*break*/, 8];
                    case 7:
                        e_1 = _a.sent();
                        console.error("Failed to save news from ".concat(item.source, ":"), e_1);
                        return [3 /*break*/, 8];
                    case 8:
                        _i++;
                        return [3 /*break*/, 4];
                    case 9:
                        console.log("\uD83D\uDCBE Saved ".concat(savedCount, " news items to database from ").concat(news.length, " fetched"));
                        return [3 /*break*/, 12];
                    case 10:
                        error_6 = _a.sent();
                        console.error('❌ Database error saving news:', error_6);
                        return [3 /*break*/, 12];
                    case 11:
                        client.release();
                        return [7 /*endfinally*/];
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Récupère et sauvegarde toutes les news
     */
    NewsAggregator.prototype.fetchAndSaveAllNews = function () {
        return __awaiter(this, void 0, void 0, function () {
            var allNews, _a, zerohedge, cnbc, financialjuice, finnhub, error_7;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log('📰 Starting comprehensive news aggregation...');
                        allNews = [];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, Promise.allSettled([
                                this.fetchZeroHedgeHeadlines(),
                                this.fetchCNBCMarketNews(),
                                this.fetchFinancialJuice(),
                                this.fetchFinnhubNews(),
                            ])];
                    case 2:
                        _a = _b.sent(), zerohedge = _a[0], cnbc = _a[1], financialjuice = _a[2], finnhub = _a[3];
                        // Ajouter les résultats réussis
                        if (zerohedge.status === 'fulfilled') {
                            allNews.push.apply(allNews, zerohedge.value);
                            console.log("\u2705 ZeroHedge: ".concat(zerohedge.value.length, " news"));
                        }
                        if (cnbc.status === 'fulfilled') {
                            allNews.push.apply(allNews, cnbc.value);
                            console.log("\u2705 CNBC: ".concat(cnbc.value.length, " news"));
                        }
                        if (financialjuice.status === 'fulfilled') {
                            allNews.push.apply(allNews, financialjuice.value);
                            console.log("\u2705 FinancialJuice: ".concat(financialjuice.value.length, " news"));
                        }
                        if (finnhub.status === 'fulfilled') {
                            allNews.push.apply(allNews, finnhub.value);
                            console.log("\u2705 Finnhub: ".concat(finnhub.value.length, " news"));
                        }
                        // Sauvegarder toutes les news
                        return [4 /*yield*/, this.saveNewsToDatabase(allNews)];
                    case 3:
                        // Sauvegarder toutes les news
                        _b.sent();
                        console.log("\uD83C\uDF89 News aggregation completed: ".concat(allNews.length, " total news saved"));
                        return [2 /*return*/, allNews];
                    case 4:
                        error_7 = _b.sent();
                        console.error('❌ Error during news aggregation:', error_7);
                        return [2 /*return*/, allNews];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    return NewsAggregator;
}());
exports.NewsAggregator = NewsAggregator;
