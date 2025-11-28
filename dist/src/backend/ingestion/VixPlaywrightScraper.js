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
exports.VixPlaywrightScraper = void 0;
var playwright_1 = require("playwright");
var VixPlaywrightScraper = /** @class */ (function () {
    function VixPlaywrightScraper() {
        this.browser = null;
        this.cache = new Map();
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            sourceMetrics: new Map(),
            cacheHits: 0,
        };
    }
    VixPlaywrightScraper.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!!this.browser) return [3 /*break*/, 2];
                        _a = this;
                        return [4 /*yield*/, playwright_1.chromium.launch({
                                headless: true,
                                args: [
                                    '--no-sandbox',
                                    '--disable-setuid-sandbox',
                                    '--disable-dev-shm-usage',
                                    '--disable-accelerated-2d-canvas',
                                    '--no-first-run',
                                    '--no-zygote',
                                    '--disable-gpu',
                                ],
                            })];
                    case 1:
                        _a.browser = _b.sent();
                        _b.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    VixPlaywrightScraper.prototype.close = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.browser) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.browser.close()];
                    case 1:
                        _a.sent();
                        this.browser = null;
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    VixPlaywrightScraper.prototype.createStealthPage = function () {
        return __awaiter(this, void 0, void 0, function () {
            var context, page;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.browser)
                            throw new Error('Browser not initialized');
                        return [4 /*yield*/, this.browser.newContext({
                                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                                viewport: { width: 1920, height: 1080 },
                                extraHTTPHeaders: {
                                    'Accept-Language': 'en-US,en;q=0.9',
                                    'Accept-Encoding': 'gzip, deflate, br',
                                    'Upgrade-Insecure-Requests': '1',
                                    Referer: 'https://www.google.com/',
                                    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                                },
                            })];
                    case 1:
                        context = _a.sent();
                        return [4 /*yield*/, context.newPage()];
                    case 2:
                        page = _a.sent();
                        // Simuler comportement humain
                        return [4 /*yield*/, page.addInitScript(function () {
                                // @ts-ignore
                                Object.defineProperty(navigator, 'webdriver', { get: function () { return false; } });
                                // @ts-ignore
                                Object.defineProperty(navigator, 'plugins', { get: function () { return [1, 2, 3, 4, 5]; } });
                                // @ts-ignore
                                Object.defineProperty(navigator, 'languages', { get: function () { return ['en-US', 'en']; } });
                                // @ts-ignore
                                window.chrome = { runtime: {} };
                                // @ts-ignore
                                Object.defineProperty(navigator, 'permissions', {
                                    get: function () { return ({
                                        query: function () { return Promise.resolve({ state: 'granted' }); },
                                    }); },
                                });
                            })];
                    case 3:
                        // Simuler comportement humain
                        _a.sent();
                        return [2 /*return*/, page];
                }
            });
        });
    };
    VixPlaywrightScraper.prototype.humanDelay = function (page_1) {
        return __awaiter(this, arguments, void 0, function (page, min, max) {
            var delay;
            if (min === void 0) { min = 50; }
            if (max === void 0) { max = 200; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        delay = Math.random() * (max - min) + min;
                        return [4 /*yield*/, page.waitForTimeout(delay)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    VixPlaywrightScraper.prototype.getCacheKey = function (source) {
        return "vix_".concat(source, "_").concat(new Date().toDateString());
    };
    VixPlaywrightScraper.prototype.isCacheValid = function (cacheEntry) {
        return Date.now() - cacheEntry.timestamp < cacheEntry.ttl;
    };
    VixPlaywrightScraper.prototype.getCachedData = function (source) {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, cached;
            return __generator(this, function (_a) {
                cacheKey = this.getCacheKey(source);
                cached = this.cache.get(cacheKey);
                if (cached && this.isCacheValid(cached)) {
                    this.metrics.cacheHits++;
                    console.log("\uD83D\uDCBE Cache HIT pour ".concat(source, " (").concat(this.metrics.cacheHits, " hits total)"));
                    return [2 /*return*/, cached.data];
                }
                return [2 /*return*/, null];
            });
        });
    };
    VixPlaywrightScraper.prototype.setCachedData = function (source, data, ttl) {
        if (ttl === void 0) { ttl = 5 * 60 * 1000; }
        var cacheKey = this.getCacheKey(source);
        this.cache.set(cacheKey, {
            data: data,
            timestamp: Date.now(),
            ttl: ttl,
        });
        console.log("\uD83D\uDCBE Cache SET pour ".concat(source, " (TTL: ").concat(ttl / 1000, "s)"));
    };
    VixPlaywrightScraper.prototype.scrapeWithTimeout = function (source_1, scrapeFn_1) {
        return __awaiter(this, arguments, void 0, function (source, scrapeFn, timeout) {
            var cached, startTime, result, responseTime, error_1;
            if (timeout === void 0) { timeout = 60000; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCachedData(source)];
                    case 1:
                        cached = _a.sent();
                        if (cached) {
                            return [2 /*return*/, cached];
                        }
                        startTime = Date.now();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, Promise.race([
                                scrapeFn(),
                                new Promise(function (_, reject) {
                                    return setTimeout(function () { return reject(new Error("Timeout: ".concat(source, " scraping timeout"))); }, timeout);
                                }),
                            ])];
                    case 3:
                        result = _a.sent();
                        responseTime = Date.now() - startTime;
                        if (result && typeof result === 'object' && result.value !== null) {
                            // Mettre en cache si succès (5 minutes TTL)
                            this.setCachedData(source, result, 5 * 60 * 1000); // 5 minutes
                        }
                        return [2 /*return*/, result];
                    case 4:
                        error_1 = _a.sent();
                        console.warn("\u26A0\uFE0F Erreur scraping ".concat(source, ":"), error_1 instanceof Error ? error_1.message : error_1);
                        throw error_1;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    VixPlaywrightScraper.prototype.scrapeAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, primaryResults, sources, _i, sources_1, source, result, error_2, totalTime, finalResults;
            var _this = this;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        startTime = Date.now();
                        return [4 /*yield*/, this.init()];
                    case 1:
                        _d.sent();
                        console.log('🚀 Démarrage scraping VIX (MODE SÉQUENTIEL OPTIMISÉ)...');
                        primaryResults = [];
                        sources = [
                            { name: 'Investing.com', fn: function () { return _this.scrapeInvesting(); }, timeout: 30000 }, // Plus rapide - meta tag
                            { name: 'Yahoo Finance', fn: function () { return _this.scrapeYahoo(); }, timeout: 35000 }, // Réduit - optimisé
                            { name: 'MarketWatch', fn: function () { return _this.scrapeMarketWatch(); }, timeout: 25000 }, // Réduit - CSS optimisé
                        ];
                        _i = 0, sources_1 = sources;
                        _d.label = 2;
                    case 2:
                        if (!(_i < sources_1.length)) return [3 /*break*/, 9];
                        source = sources_1[_i];
                        console.log("\n\uD83C\uDFAF D\u00E9marrage ".concat(source.name, " (timeout: ").concat(source.timeout, "ms)..."));
                        _d.label = 3;
                    case 3:
                        _d.trys.push([3, 7, , 8]);
                        return [4 /*yield*/, this.scrapeWithTimeout(source.name, source.fn, source.timeout)];
                    case 4:
                        result = _d.sent();
                        primaryResults.push({ status: 'fulfilled', value: result });
                        console.log("\u2705 ".concat(source.name, " termin\u00E9 avec succ\u00E8s"));
                        if (!(sources.indexOf(source) < sources.length - 1)) return [3 /*break*/, 6];
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 3000); })];
                    case 5:
                        _d.sent();
                        _d.label = 6;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        error_2 = _d.sent();
                        console.log("\u274C ".concat(source.name, " \u00E9chou\u00E9:"), error_2 instanceof Error ? error_2.message : error_2);
                        primaryResults.push({ status: 'rejected', reason: error_2 });
                        return [3 /*break*/, 8];
                    case 8:
                        _i++;
                        return [3 /*break*/, 2];
                    case 9: return [4 /*yield*/, this.close()];
                    case 10:
                        _d.sent();
                        totalTime = Date.now() - startTime;
                        this.updateAverageResponseTime(totalTime);
                        console.log("\uD83D\uDCCA M\u00E9triques scraping - Total: ".concat(totalTime, "ms, Cache hits: ").concat(this.metrics.cacheHits, "/").concat(this.metrics.totalRequests));
                        console.log("   Investing.com: ".concat(((_a = this.metrics.sourceMetrics.get('Investing.com')) === null || _a === void 0 ? void 0 : _a.success) ? '✅' : '❌', ", Yahoo: ").concat(((_b = this.metrics.sourceMetrics.get('Yahoo Finance')) === null || _b === void 0 ? void 0 : _b.success) ? '✅' : '❌', ", MarketWatch: ").concat(((_c = this.metrics.sourceMetrics.get('MarketWatch')) === null || _c === void 0 ? void 0 : _c.success) ? '✅' : '❌'));
                        finalResults = primaryResults.map(function (result, index) {
                            // Must match the order in the 'sources' array above
                            var sourcesList = ['Investing.com', 'Yahoo Finance', 'MarketWatch'];
                            var sourceName = sourcesList[index];
                            _this.metrics.totalRequests++;
                            if (result.status === 'fulfilled') {
                                if (result.value.value !== null) {
                                    _this.metrics.successfulRequests++;
                                }
                                else {
                                    _this.metrics.failedRequests++;
                                }
                                return result.value;
                            }
                            else {
                                _this.metrics.failedRequests++;
                                _this.metrics.sourceMetrics.set(sourceName, {
                                    success: false,
                                    responseTime: 0,
                                    error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
                                });
                                return {
                                    source: sourceName,
                                    value: null,
                                    change_abs: null,
                                    change_pct: null,
                                    previous_close: null,
                                    open: null,
                                    high: null,
                                    low: null,
                                    last_update: null,
                                    news_headlines: [],
                                    error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
                                };
                            }
                        });
                        this.logMetrics(totalTime);
                        return [2 /*return*/, finalResults];
                }
            });
        });
    };
    VixPlaywrightScraper.prototype.scrapeWithMetrics = function (sourceName, scrapeFn) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, result, responseTime, error_3, responseTime, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        console.log("[PARALLEL] ".concat(sourceName, " - D\u00E9marrage..."));
                        return [4 /*yield*/, scrapeFn()];
                    case 2:
                        result = _a.sent();
                        responseTime = Date.now() - startTime;
                        this.metrics.sourceMetrics.set(sourceName, {
                            success: result.value !== null,
                            responseTime: responseTime,
                            error: result.error,
                        });
                        console.log("[PARALLEL] ".concat(sourceName, " - Termin\u00E9 en ").concat(responseTime, "ms - ").concat(result.value !== null ? '✅' : '❌'));
                        return [2 /*return*/, result];
                    case 3:
                        error_3 = _a.sent();
                        responseTime = Date.now() - startTime;
                        errorMessage = error_3 instanceof Error ? error_3.message : 'Unknown error';
                        this.metrics.sourceMetrics.set(sourceName, {
                            success: false,
                            responseTime: responseTime,
                            error: errorMessage,
                        });
                        console.log("[PARALLEL] ".concat(sourceName, " - Erreur en ").concat(responseTime, "ms: ").concat(errorMessage));
                        throw error_3;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    VixPlaywrightScraper.prototype.updateAverageResponseTime = function (totalTime) {
        var successfulMetrics = Array.from(this.metrics.sourceMetrics.values()).filter(function (metric) { return metric.success; });
        if (successfulMetrics.length > 0) {
            var avgTime = successfulMetrics.reduce(function (sum, metric) { return sum + metric.responseTime; }, 0) /
                successfulMetrics.length;
            this.metrics.averageResponseTime = Math.round(avgTime);
        }
    };
    VixPlaywrightScraper.prototype.logMetrics = function (totalTime) {
        console.log('\n📊 MÉTRIQUES DE SCRAPING:');
        console.log('='.repeat(50));
        console.log("\u23F1\uFE0F  Temps total: ".concat(totalTime, "ms"));
        console.log("\uD83D\uDCC8 Taux de r\u00E9ussite: ".concat(((this.metrics.successfulRequests / this.metrics.totalRequests) * 100).toFixed(1), "%"));
        console.log("\u2705 Succ\u00E8s: ".concat(this.metrics.successfulRequests, "/").concat(this.metrics.totalRequests));
        console.log("\u26A1 Temps moyen: ".concat(this.metrics.averageResponseTime, "ms"));
        console.log('\n📋 DÉTAIL PAR SOURCE:');
        this.metrics.sourceMetrics.forEach(function (metric, source) {
            var status = metric.success ? '✅' : '❌';
            console.log("   ".concat(status, " ").concat(source, ": ").concat(metric.responseTime, "ms ").concat(metric.error ? "- ".concat(metric.error) : ''));
        });
        console.log('');
    };
    VixPlaywrightScraper.prototype.getMetrics = function () {
        return __assign(__assign({}, this.metrics), { sourceMetrics: Object.fromEntries(this.metrics.sourceMetrics) });
    };
    VixPlaywrightScraper.prototype.resetMetrics = function () {
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            sourceMetrics: new Map(),
            cacheHits: 0,
        };
    };
    VixPlaywrightScraper.prototype.scrapeMarketWatch = function () {
        return __awaiter(this, void 0, void 0, function () {
            var page, value, changeAbs, changePct, prevClose, open_1, rangeText, _a, low, high, news, newsContainers, _i, _b, container, titleElement, linkElement, _c, title, href, cleanTitle, publishedAt, relativeTime, author, dateSelectors, _d, dateSelectors_1, dateSelector, dateElement, dateText, datetime, parsedDate, _e, authorSelectors, _f, authorSelectors_1, authorSelector, authorElement, _g, htmlContent, dateMatches, dateText, parsedDate, e_1, _h, fallbackElements, _j, _k, element, title, href, cleanTitle, _l, e_2, error_4;
            return __generator(this, function (_m) {
                switch (_m.label) {
                    case 0: return [4 /*yield*/, this.createStealthPage()];
                    case 1:
                        page = _m.sent();
                        _m.label = 2;
                    case 2:
                        _m.trys.push([2, 60, 61, 63]);
                        console.log('[MarketWatch] Navigation optimisée VIX...');
                        return [4 /*yield*/, page.goto('https://www.marketwatch.com/investing/index/vix', {
                                waitUntil: 'domcontentloaded', // Plus rapide
                                timeout: 20000, // Timeout plus court
                            })];
                    case 3:
                        _m.sent();
                        return [4 /*yield*/, this.humanDelay(page, 1500, 3000)];
                    case 4:
                        _m.sent();
                        // STRATÉGIE 1: Utiliser les sélecteurs CSS qui fonctionnent (selon debug)
                        console.log('[MarketWatch] Extraction avec sélecteurs CSS...');
                        return [4 /*yield*/, this.extractText(page, '.intraday__price .value', 8000)];
                    case 5:
                        value = _m.sent();
                        return [4 /*yield*/, this.extractText(page, '.intraday__price .change--point .value', 5000)];
                    case 6:
                        changeAbs = _m.sent();
                        return [4 /*yield*/, this.extractText(page, '.intraday__price .change--percent .value', 5000)];
                    case 7:
                        changePct = _m.sent();
                        return [4 /*yield*/, this.extractText(page, '.intraday__close .value', 4000)];
                    case 8:
                        prevClose = _m.sent();
                        return [4 /*yield*/, this.extractText(page, '.intraday__open .value', 4000)];
                    case 9:
                        open_1 = _m.sent();
                        return [4 /*yield*/, this.extractText(page, '.range__content', 4000)];
                    case 10:
                        rangeText = _m.sent();
                        _a = this.parseRange(rangeText), low = _a[0], high = _a[1];
                        news = [];
                        _m.label = 11;
                    case 11:
                        _m.trys.push([11, 58, , 59]);
                        console.log('[MarketWatch] Recherche des news avec dates...');
                        return [4 /*yield*/, page
                                .locator('article.article, .article-item, .news-item, .stream-item')
                                .all()];
                    case 12:
                        newsContainers = _m.sent();
                        _i = 0, _b = newsContainers.slice(0, 8);
                        _m.label = 13;
                    case 13:
                        if (!(_i < _b.length)) return [3 /*break*/, 49];
                        container = _b[_i];
                        _m.label = 14;
                    case 14:
                        _m.trys.push([14, 47, , 48]);
                        return [4 /*yield*/, container
                                .locator('a[href*="/story/"] h3, .headline, .title, h2')
                                .first()];
                    case 15:
                        titleElement = _m.sent();
                        return [4 /*yield*/, container.locator('a[href*="/story/"]').first()];
                    case 16:
                        linkElement = _m.sent();
                        return [4 /*yield*/, titleElement.isVisible()];
                    case 17:
                        _c = (_m.sent());
                        if (!_c) return [3 /*break*/, 19];
                        return [4 /*yield*/, linkElement.isVisible()];
                    case 18:
                        _c = (_m.sent());
                        _m.label = 19;
                    case 19:
                        if (!_c) return [3 /*break*/, 46];
                        return [4 /*yield*/, titleElement.textContent()];
                    case 20:
                        title = _m.sent();
                        return [4 /*yield*/, linkElement.getAttribute('href')];
                    case 21:
                        href = _m.sent();
                        if (!(title && href && title.trim().length > 15)) return [3 /*break*/, 46];
                        cleanTitle = title.replace(/^\d{1,2}:\d{2}\s*(AM|PM)\s*/i, '').trim();
                        publishedAt = new Date().toISOString();
                        relativeTime = '';
                        author = '';
                        _m.label = 22;
                    case 22:
                        _m.trys.push([22, 44, , 45]);
                        dateSelectors = [
                            '.timestamp',
                            '.date',
                            '.published',
                            'time[datetime]',
                            '.article-timestamp',
                            '[data-testid="timestamp"]',
                            'span.timestamp',
                        ];
                        _d = 0, dateSelectors_1 = dateSelectors;
                        _m.label = 23;
                    case 23:
                        if (!(_d < dateSelectors_1.length)) return [3 /*break*/, 32];
                        dateSelector = dateSelectors_1[_d];
                        _m.label = 24;
                    case 24:
                        _m.trys.push([24, 30, , 31]);
                        return [4 /*yield*/, container.locator(dateSelector).first()];
                    case 25:
                        dateElement = _m.sent();
                        return [4 /*yield*/, dateElement.isVisible()];
                    case 26:
                        if (!_m.sent()) return [3 /*break*/, 29];
                        return [4 /*yield*/, dateElement.textContent()];
                    case 27:
                        dateText = _m.sent();
                        return [4 /*yield*/, dateElement.getAttribute('datetime')];
                    case 28:
                        datetime = _m.sent();
                        if (datetime) {
                            publishedAt = new Date(datetime).toISOString();
                        }
                        else if (dateText) {
                            parsedDate = this.parseRelativeDate(dateText);
                            if (parsedDate) {
                                publishedAt = parsedDate.toISOString();
                                relativeTime = dateText.trim();
                            }
                        }
                        return [3 /*break*/, 32];
                    case 29: return [3 /*break*/, 31];
                    case 30:
                        _e = _m.sent();
                        return [3 /*break*/, 31];
                    case 31:
                        _d++;
                        return [3 /*break*/, 23];
                    case 32:
                        authorSelectors = ['.author', '.byline', '.reporter', 'span.author'];
                        _f = 0, authorSelectors_1 = authorSelectors;
                        _m.label = 33;
                    case 33:
                        if (!(_f < authorSelectors_1.length)) return [3 /*break*/, 41];
                        authorSelector = authorSelectors_1[_f];
                        _m.label = 34;
                    case 34:
                        _m.trys.push([34, 39, , 40]);
                        return [4 /*yield*/, container.locator(authorSelector).first()];
                    case 35:
                        authorElement = _m.sent();
                        return [4 /*yield*/, authorElement.isVisible()];
                    case 36:
                        if (!_m.sent()) return [3 /*break*/, 38];
                        return [4 /*yield*/, authorElement.textContent()];
                    case 37:
                        author = ((_m.sent()) || '').trim();
                        if (author && !author.includes('MarketWatch')) {
                            return [3 /*break*/, 41];
                        }
                        _m.label = 38;
                    case 38: return [3 /*break*/, 40];
                    case 39:
                        _g = _m.sent();
                        return [3 /*break*/, 40];
                    case 40:
                        _f++;
                        return [3 /*break*/, 33];
                    case 41:
                        if (!(publishedAt === new Date().toISOString())) return [3 /*break*/, 43];
                        return [4 /*yield*/, container.innerHTML()];
                    case 42:
                        htmlContent = _m.sent();
                        dateMatches = htmlContent.match(/\b\d{1,2}:\d{2}\s*(AM|PM)\s*ET\b/gi) ||
                            htmlContent.match(/\b\d{1,2}:\d{2}\s*[AP]M\b/gi) ||
                            htmlContent.match(/\b\d{4}-\d{1,2}-\d{1,2}\b/g) ||
                            htmlContent.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/g);
                        if (dateMatches) {
                            dateText = dateMatches[0];
                            parsedDate = this.parseRelativeDate(dateText);
                            if (parsedDate) {
                                publishedAt = parsedDate.toISOString();
                                relativeTime = dateText.trim();
                            }
                        }
                        _m.label = 43;
                    case 43: return [3 /*break*/, 45];
                    case 44:
                        e_1 = _m.sent();
                        console.log('[MarketWatch] Erreur extraction date/news:', e_1 instanceof Error ? e_1.message : e_1);
                        return [3 /*break*/, 45];
                    case 45:
                        news.push({
                            title: cleanTitle,
                            url: href.startsWith('http') ? href : "https://www.marketwatch.com".concat(href),
                            published_at: publishedAt,
                            source_date: new Date(publishedAt),
                            relative_time: relativeTime,
                            author: author || '',
                        });
                        _m.label = 46;
                    case 46: return [3 /*break*/, 48];
                    case 47:
                        _h = _m.sent();
                        return [3 /*break*/, 48];
                    case 48:
                        _i++;
                        return [3 /*break*/, 13];
                    case 49:
                        if (!(news.length < 5)) return [3 /*break*/, 57];
                        console.log('[MarketWatch] Approche alternative pour les news...');
                        return [4 /*yield*/, page.locator('a[href*="/story/"]').all()];
                    case 50:
                        fallbackElements = _m.sent();
                        _j = 0, _k = fallbackElements.slice(0, 10 - news.length);
                        _m.label = 51;
                    case 51:
                        if (!(_j < _k.length)) return [3 /*break*/, 57];
                        element = _k[_j];
                        _m.label = 52;
                    case 52:
                        _m.trys.push([52, 55, , 56]);
                        return [4 /*yield*/, element.textContent()];
                    case 53:
                        title = _m.sent();
                        return [4 /*yield*/, element.getAttribute('href')];
                    case 54:
                        href = _m.sent();
                        if (title && href && title.trim().length > 15) {
                            cleanTitle = title.replace(/^\d{1,2}:\d{2}\s*(AM|PM)\s*/i, '').trim();
                            news.push({
                                title: cleanTitle,
                                url: href.startsWith('http') ? href : "https://www.marketwatch.com".concat(href),
                                published_at: new Date().toISOString(),
                                source_date: new Date(),
                                relative_time: 'Recent',
                            });
                        }
                        return [3 /*break*/, 56];
                    case 55:
                        _l = _m.sent();
                        return [3 /*break*/, 56];
                    case 56:
                        _j++;
                        return [3 /*break*/, 51];
                    case 57:
                        // Trier les news par date (plus récentes en premier)
                        news.sort(function (a, b) {
                            var dateA = a.source_date ? a.source_date.getTime() : 0;
                            var dateB = b.source_date ? b.source_date.getTime() : 0;
                            return dateB - dateA; // Plus récent d'abord
                        });
                        console.log("[MarketWatch] News trouv\u00E9es: ".concat(news.length));
                        return [3 /*break*/, 59];
                    case 58:
                        e_2 = _m.sent();
                        console.log('[MarketWatch] Erreur extraction news:', e_2 instanceof Error ? e_2.message : e_2);
                        return [3 /*break*/, 59];
                    case 59: return [2 /*return*/, {
                            source: 'MarketWatch',
                            value: this.parseNumber(value),
                            change_abs: this.parseNumber(changeAbs),
                            change_pct: this.parseNumber(changePct === null || changePct === void 0 ? void 0 : changePct.replace('%', '')),
                            previous_close: this.parseNumber(prevClose),
                            open: this.parseNumber(open_1),
                            high: high,
                            low: low,
                            last_update: new Date().toISOString(),
                            news_headlines: news,
                        }];
                    case 60:
                        error_4 = _m.sent();
                        throw new Error("MarketWatch scrape failed: ".concat(error_4 instanceof Error ? error_4.message : error_4));
                    case 61: return [4 /*yield*/, page.close()];
                    case 62:
                        _m.sent();
                        return [7 /*endfinally*/];
                    case 63: return [2 /*return*/];
                }
            });
        });
    };
    VixPlaywrightScraper.prototype.scrapeInvesting = function () {
        return __awaiter(this, void 0, void 0, function () {
            var page, metaContent, cleanContent, data, news_1, e_3, cookieSelectors, _i, cookieSelectors_1, selector, e_4, value, changeAbs, changePct, prevClose, open_2, dayRange, _a, low, high, news, hasValue, error_5;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.createStealthPage()];
                    case 1:
                        page = _b.sent();
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 31, 32, 34]);
                        console.log('[Investing.com] Navigation pour Meta Tag extraction...');
                        // Utiliser waitUntil: 'domcontentloaded' pour un accès plus rapide au meta tag
                        return [4 /*yield*/, page.goto('https://www.investing.com/indices/volatility-s-p-500', {
                                waitUntil: 'domcontentloaded',
                                timeout: 15000,
                            })];
                    case 3:
                        // Utiliser waitUntil: 'domcontentloaded' pour un accès plus rapide au meta tag
                        _b.sent();
                        // Délai minimal pour charger le meta tag
                        return [4 /*yield*/, this.humanDelay(page, 500, 1500)];
                    case 4:
                        // Délai minimal pour charger le meta tag
                        _b.sent();
                        _b.label = 5;
                    case 5:
                        _b.trys.push([5, 12, , 13]);
                        return [4 /*yield*/, page.getAttribute('meta[name="global-translation-variables"]', 'content', { timeout: 8000 } // Timeout court pour le meta tag
                            )];
                    case 6:
                        metaContent = _b.sent();
                        if (!metaContent) return [3 /*break*/, 10];
                        console.log('[Investing.com] Meta Tag trouvé! Analyse en cours...');
                        cleanContent = metaContent.replace(/&quot;/g, '"');
                        data = JSON.parse(cleanContent);
                        // Double parsing si encodé doublement
                        if (typeof data === 'string') {
                            data = JSON.parse(data);
                        }
                        if (!(data && data.LAST_PRICE)) return [3 /*break*/, 8];
                        console.log("[Investing.com] \u2705 Succ\u00E8s Meta Tag: VIX ".concat(data.LAST_PRICE, " (extraction instantan\u00E9e!)"));
                        return [4 /*yield*/, this.extractInvestingNewsFast(page)];
                    case 7:
                        news_1 = _b.sent();
                        return [2 /*return*/, {
                                source: 'Investing.com',
                                value: parseFloat(data.LAST_PRICE.replace(/,/g, '')),
                                change_abs: data.daily_change ? parseFloat(data.daily_change) : null,
                                change_pct: data.daily_change_percent ? parseFloat(data.daily_change_percent) : null,
                                previous_close: data.PREV_CLOSE
                                    ? parseFloat(data.PREV_CLOSE.replace(/,/g, ''))
                                    : null,
                                open: data.OPEN_PRICE ? parseFloat(data.OPEN_PRICE.replace(/,/g, '')) : null,
                                high: data.DAY_RANGE_HIGH ? parseFloat(data.DAY_RANGE_HIGH.replace(/,/g, '')) : null,
                                low: data.DAY_RANGE_LOW ? parseFloat(data.DAY_RANGE_LOW.replace(/,/g, '')) : null,
                                last_update: new Date().toISOString(),
                                news_headlines: news_1,
                            }];
                    case 8:
                        console.log('[Investing.com] Meta Tag trouvé mais pas de données LAST_PRICE');
                        _b.label = 9;
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        console.log('[Investing.com] Meta Tag non trouvé - fallback nécessaire');
                        _b.label = 11;
                    case 11: return [3 /*break*/, 13];
                    case 12:
                        e_3 = _b.sent();
                        console.log('[Investing.com] Erreur Meta Tag:', e_3 instanceof Error ? e_3.message : e_3);
                        return [3 /*break*/, 13];
                    case 13:
                        // FALLBACK - seulement si Meta Tag a échoué
                        console.log('[Investing.com] Fallback vers DOM selectors...');
                        return [4 /*yield*/, page.waitForTimeout(2000)];
                    case 14:
                        _b.sent(); // Attendre le chargement complet
                        _b.label = 15;
                    case 15:
                        _b.trys.push([15, 22, , 23]);
                        cookieSelectors = [
                            '#onetrust-accept-btn-handler',
                            'button[data-testid="accept-btn"]',
                            '.js-accept-all-cookies',
                            'button:has-text("I Agree")',
                            'button:has-text("Accept")',
                        ];
                        _i = 0, cookieSelectors_1 = cookieSelectors;
                        _b.label = 16;
                    case 16:
                        if (!(_i < cookieSelectors_1.length)) return [3 /*break*/, 21];
                        selector = cookieSelectors_1[_i];
                        return [4 /*yield*/, page.locator(selector).first().isVisible({ timeout: 1000 })];
                    case 17:
                        if (!_b.sent()) return [3 /*break*/, 20];
                        return [4 /*yield*/, page.locator(selector).first().click()];
                    case 18:
                        _b.sent();
                        return [4 /*yield*/, page.waitForTimeout(500)];
                    case 19:
                        _b.sent();
                        return [3 /*break*/, 21];
                    case 20:
                        _i++;
                        return [3 /*break*/, 16];
                    case 21: return [3 /*break*/, 23];
                    case 22:
                        e_4 = _b.sent();
                        return [3 /*break*/, 23];
                    case 23: return [4 /*yield*/, this.extractText(page, '[data-test="instrument-price-last"]')];
                    case 24:
                        value = _b.sent();
                        return [4 /*yield*/, this.extractText(page, '[data-test="instrument-price-change"]')];
                    case 25:
                        changeAbs = _b.sent();
                        return [4 /*yield*/, this.extractText(page, '[data-test="instrument-price-change-percent"]')];
                    case 26:
                        changePct = _b.sent();
                        return [4 /*yield*/, this.extractText(page, '[data-test="prev-close-value"]')];
                    case 27:
                        prevClose = _b.sent();
                        return [4 /*yield*/, this.extractText(page, '[data-test="open-value"]')];
                    case 28:
                        open_2 = _b.sent();
                        return [4 /*yield*/, this.extractText(page, '[data-test="days-range-value"]')];
                    case 29:
                        dayRange = _b.sent();
                        _a = this.parseRange(dayRange), low = _a[0], high = _a[1];
                        return [4 /*yield*/, this.extractInvestingNewsFast(page)];
                    case 30:
                        news = _b.sent();
                        hasValue = value !== null && value !== '';
                        return [2 /*return*/, {
                                source: 'Investing.com',
                                value: this.parseNumber(value),
                                change_abs: hasValue ? this.parseNumber(changeAbs) : null,
                                change_pct: hasValue ? this.parseNumber(changePct === null || changePct === void 0 ? void 0 : changePct.replace(/[()%]/g, '')) : null,
                                previous_close: this.parseNumber(prevClose),
                                open: this.parseNumber(open_2),
                                high: high,
                                low: low,
                                last_update: new Date().toISOString(),
                                news_headlines: news,
                            }];
                    case 31:
                        error_5 = _b.sent();
                        throw new Error("Investing.com scrape failed: ".concat(error_5 instanceof Error ? error_5.message : error_5));
                    case 32: return [4 /*yield*/, page.close()];
                    case 33:
                        _b.sent();
                        return [7 /*endfinally*/];
                    case 34: return [2 /*return*/];
                }
            });
        });
    };
    // Méthode optimisée pour extraire les news rapidement
    VixPlaywrightScraper.prototype.extractInvestingNewsFast = function (page) {
        return __awaiter(this, void 0, void 0, function () {
            var news, newsSelectors, _i, newsSelectors_1, selector, links, _a, _b, link, title, href, cleanTitle, _c, _d, e_5;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        news = [];
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 15, , 16]);
                        console.log('[Investing.com] Extraction rapide des news...');
                        newsSelectors = [
                            'article[data-test="article-item"] a',
                            'div.articleItem a',
                            'div.textDiv a',
                            'div[data-test="news-article"] a',
                            'div.newsItem a',
                            'li.article-item a',
                            'div.newsStory a',
                        ];
                        _i = 0, newsSelectors_1 = newsSelectors;
                        _e.label = 2;
                    case 2:
                        if (!(_i < newsSelectors_1.length)) return [3 /*break*/, 14];
                        selector = newsSelectors_1[_i];
                        _e.label = 3;
                    case 3:
                        _e.trys.push([3, 12, , 13]);
                        return [4 /*yield*/, page.locator(selector).all()];
                    case 4:
                        links = _e.sent();
                        _a = 0, _b = links.slice(0, 8);
                        _e.label = 5;
                    case 5:
                        if (!(_a < _b.length)) return [3 /*break*/, 11];
                        link = _b[_a];
                        _e.label = 6;
                    case 6:
                        _e.trys.push([6, 9, , 10]);
                        return [4 /*yield*/, link.textContent()];
                    case 7:
                        title = _e.sent();
                        return [4 /*yield*/, link.getAttribute('href')];
                    case 8:
                        href = _e.sent();
                        if (title && href && title.trim().length > 15) {
                            cleanTitle = title
                                .replace(/\d+\s*(minutes?|hours?|days?)\s*ago/gi, '')
                                .trim();
                            news.push({
                                title: cleanTitle,
                                url: href.startsWith('http') ? href : "https://www.investing.com".concat(href),
                                published_at: new Date().toISOString(),
                                source_date: new Date(),
                                relative_time: 'Recent',
                                author: '',
                            });
                        }
                        if (news.length >= 6)
                            return [3 /*break*/, 11];
                        return [3 /*break*/, 10];
                    case 9:
                        _c = _e.sent();
                        return [3 /*break*/, 10];
                    case 10:
                        _a++;
                        return [3 /*break*/, 5];
                    case 11:
                        if (news.length >= 4)
                            return [3 /*break*/, 14];
                        return [3 /*break*/, 13];
                    case 12:
                        _d = _e.sent();
                        return [3 /*break*/, 13];
                    case 13:
                        _i++;
                        return [3 /*break*/, 2];
                    case 14:
                        console.log("[Investing.com] News extraites: ".concat(news.length));
                        return [3 /*break*/, 16];
                    case 15:
                        e_5 = _e.sent();
                        console.log('[Investing.com] Erreur extraction news rapide:', e_5 instanceof Error ? e_5.message : e_5);
                        return [3 /*break*/, 16];
                    case 16: return [2 /*return*/, news];
                }
            });
        });
    };
    VixPlaywrightScraper.prototype.scrapeYahoo = function () {
        return __awaiter(this, void 0, void 0, function () {
            var page, agreeButton, e_6, value, _a, changeAbs, changePct, prevClose, open_3, range, _b, low, high, news, error_6;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.createStealthPage()];
                    case 1:
                        page = _c.sent();
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 22, 23, 25]);
                        console.log('[Yahoo Finance] Navigation optimisée pour consentement...');
                        // Gestion simplifiée et rapide du consentement Yahoo
                        return [4 /*yield*/, page.goto('https://finance.yahoo.com/quote/%5EVIX', {
                                waitUntil: 'domcontentloaded',
                                timeout: 18000, // Timeout réduit
                            })];
                    case 3:
                        // Gestion simplifiée et rapide du consentement Yahoo
                        _c.sent();
                        return [4 /*yield*/, this.humanDelay(page, 800, 1500)];
                    case 4:
                        _c.sent(); // Délai réduit
                        if (!page.url().includes('consent.yahoo.com')) return [3 /*break*/, 12];
                        console.log('[Yahoo Finance] Gestion rapide consentement...');
                        _c.label = 5;
                    case 5:
                        _c.trys.push([5, 11, , 12]);
                        agreeButton = page.locator('button[name="agree"]').first();
                        return [4 /*yield*/, agreeButton.isVisible({ timeout: 2000 })];
                    case 6:
                        if (!_c.sent()) return [3 /*break*/, 10];
                        return [4 /*yield*/, agreeButton.click()];
                    case 7:
                        _c.sent();
                        return [4 /*yield*/, page.waitForTimeout(1500)];
                    case 8:
                        _c.sent(); // Attendre la redirection
                        if (!page.url().includes('consent.yahoo.com')) return [3 /*break*/, 10];
                        console.log('[Yahoo Finance] Rechargement direct...');
                        return [4 /*yield*/, page.goto('https://finance.yahoo.com/quote/%5EVIX', {
                                waitUntil: 'domcontentloaded',
                                timeout: 12000,
                            })];
                    case 9:
                        _c.sent();
                        _c.label = 10;
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        e_6 = _c.sent();
                        console.log('[Yahoo Finance] Erreur consentement, continuation...');
                        return [3 /*break*/, 12];
                    case 12:
                        // EXTRACTION RAPIDE avec les sélecteurs confirmés par le debug
                        console.log('[Yahoo Finance] Extraction rapide des données...');
                        return [4 /*yield*/, this.extractText(page, 'fin-streamer[data-field="regularMarketPrice"][data-symbol="^VIX"]', 6000)];
                    case 13:
                        _a = (_c.sent());
                        if (_a) return [3 /*break*/, 15];
                        return [4 /*yield*/, this.extractText(page, '[data-testid="qsp-price"]', 4000)];
                    case 14:
                        _a = (_c.sent());
                        _c.label = 15;
                    case 15:
                        value = _a;
                        return [4 /*yield*/, this.extractText(page, '[data-testid="qsp-price-change"]', 3000)];
                    case 16:
                        changeAbs = _c.sent();
                        return [4 /*yield*/, this.extractText(page, '[data-testid="qsp-price-change-percent"]', 3000)];
                    case 17:
                        changePct = _c.sent();
                        return [4 /*yield*/, this.extractText(page, '[data-test="PREV_CLOSE-value"]', 3000)];
                    case 18:
                        prevClose = _c.sent();
                        return [4 /*yield*/, this.extractText(page, '[data-test="OPEN-value"]', 3000)];
                    case 19:
                        open_3 = _c.sent();
                        return [4 /*yield*/, this.extractText(page, '[data-test="DAYS_RANGE-value"]', 3000)];
                    case 20:
                        range = _c.sent();
                        _b = this.parseRange(range), low = _b[0], high = _b[1];
                        return [4 /*yield*/, this.extractYahooNewsFast(page)];
                    case 21:
                        news = _c.sent();
                        console.log("[Yahoo Finance] \u2705 Extraction r\u00E9ussie: ".concat(value || 'NULL', " (change: ").concat(changePct, ")"));
                        return [2 /*return*/, {
                                source: 'Yahoo Finance',
                                value: this.parseNumber(value),
                                change_abs: this.parseNumber(changeAbs),
                                change_pct: this.parseNumber(changePct === null || changePct === void 0 ? void 0 : changePct.replace(/[()%]/g, '')),
                                previous_close: this.parseNumber(prevClose),
                                open: this.parseNumber(open_3),
                                high: high,
                                low: low,
                                last_update: new Date().toISOString(),
                                news_headlines: news,
                            }];
                    case 22:
                        error_6 = _c.sent();
                        console.log('[Yahoo Finance] Erreur:', error_6 instanceof Error ? error_6.message : error_6);
                        throw new Error("Yahoo Finance scrape failed: ".concat(error_6 instanceof Error ? error_6.message : error_6));
                    case 23: return [4 /*yield*/, page.close()];
                    case 24:
                        _c.sent();
                        return [7 /*endfinally*/];
                    case 25: return [2 /*return*/];
                }
            });
        });
    };
    // Gestion spécialisée de la redirection consent.yahoo.com
    VixPlaywrightScraper.prototype.handleYahooConsentRedirect = function (page) {
        return __awaiter(this, void 0, void 0, function () {
            var consentSelectors, _i, consentSelectors_1, selector, button, navError_1, _a, e_7;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 14, , 15]);
                        console.log('[Yahoo Finance] Gestion redirection consentement...');
                        // Attendre que les boutons apparaissent
                        return [4 /*yield*/, page.waitForTimeout(1500)];
                    case 1:
                        // Attendre que les boutons apparaissent
                        _b.sent();
                        consentSelectors = [
                            'button[name="agree"]',
                            'button.accept-all',
                            'button[name="consent-accept"]',
                            'form button[type="submit"]',
                            'button:has-text("Accept all")',
                            'button:has-text("Tout accepter")',
                            'button:has-text("Accept")',
                            'button:has-text("I agree")',
                        ];
                        _i = 0, consentSelectors_1 = consentSelectors;
                        _b.label = 2;
                    case 2:
                        if (!(_i < consentSelectors_1.length)) return [3 /*break*/, 13];
                        selector = consentSelectors_1[_i];
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 11, , 12]);
                        button = page.locator(selector).first();
                        return [4 /*yield*/, button.isVisible({ timeout: 2000 })];
                    case 4:
                        if (!_b.sent()) return [3 /*break*/, 10];
                        console.log("[Yahoo Finance] Click sur: ".concat(selector));
                        return [4 /*yield*/, button.click()];
                    case 5:
                        _b.sent();
                        return [4 /*yield*/, page.waitForTimeout(1000)];
                    case 6:
                        _b.sent();
                        _b.label = 7;
                    case 7:
                        _b.trys.push([7, 9, , 10]);
                        return [4 /*yield*/, page.waitForNavigation({
                                timeout: 10000,
                                waitUntil: 'domcontentloaded',
                            })];
                    case 8:
                        _b.sent();
                        console.log('[Yahoo Finance] Redirection réussie vers:', page.url());
                        return [3 /*break*/, 13];
                    case 9:
                        navError_1 = _b.sent();
                        // Continuer même si la redirection échoue
                        console.log('[Yahoo Finance] Navigation timeout, continuation...');
                        return [3 /*break*/, 10];
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        _a = _b.sent();
                        return [3 /*break*/, 12];
                    case 12:
                        _i++;
                        return [3 /*break*/, 2];
                    case 13: return [3 /*break*/, 15];
                    case 14:
                        e_7 = _b.sent();
                        console.log('[Yahoo Finance] Erreur gestion redirection:', e_7 instanceof Error ? e_7.message : e_7);
                        return [3 /*break*/, 15];
                    case 15: return [2 /*return*/];
                }
            });
        });
    };
    // Gestion du popup de consentement dans la page Yahoo
    VixPlaywrightScraper.prototype.handleYahooConsentPopup = function (page) {
        return __awaiter(this, void 0, void 0, function () {
            var popupSelectors, _i, popupSelectors_1, selector, button, _a, e_8;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 10, , 11]);
                        console.log('[Yahoo Finance] Vérification popup consentement...');
                        popupSelectors = [
                            'button[name="agree"]',
                            '.accept-all',
                            'button.btn.primary',
                            'button[value="agree"]',
                            'form[action*="consent"] button[type="submit"]',
                            'button:has-text("Accept all")',
                            'button:has-text("Tout accepter")',
                            'button:has-text("Accept")',
                            '#consent-page-submit',
                            '[data-testid="policy-submit-accept-all-button"]',
                        ];
                        _i = 0, popupSelectors_1 = popupSelectors;
                        _b.label = 1;
                    case 1:
                        if (!(_i < popupSelectors_1.length)) return [3 /*break*/, 9];
                        selector = popupSelectors_1[_i];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 7, , 8]);
                        button = page.locator(selector).first();
                        return [4 /*yield*/, button.isVisible({ timeout: 1500 })];
                    case 3:
                        if (!_b.sent()) return [3 /*break*/, 6];
                        console.log("[Yahoo Finance] Popup click sur: ".concat(selector));
                        return [4 /*yield*/, button.click()];
                    case 4:
                        _b.sent();
                        return [4 /*yield*/, page.waitForTimeout(2000)];
                    case 5:
                        _b.sent();
                        return [3 /*break*/, 9];
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        _a = _b.sent();
                        return [3 /*break*/, 8];
                    case 8:
                        _i++;
                        return [3 /*break*/, 1];
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        e_8 = _b.sent();
                        console.log('[Yahoo Finance] Erreur gestion popup:', e_8 instanceof Error ? e_8.message : e_8);
                        return [3 /*break*/, 11];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    // Extraction rapide des news Yahoo
    VixPlaywrightScraper.prototype.extractYahooNewsFast = function (page) {
        return __awaiter(this, void 0, void 0, function () {
            var news, newsLinks, _i, _a, link, title, href, cleanTitle, _b, e_9;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        news = [];
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 10, , 11]);
                        console.log('[Yahoo Finance] Extraction rapide des news...');
                        return [4 /*yield*/, page.locator('a[href*="/news/"], h3 a, .js-stream-content a').all()];
                    case 2:
                        newsLinks = _c.sent();
                        _i = 0, _a = newsLinks.slice(0, 6);
                        _c.label = 3;
                    case 3:
                        if (!(_i < _a.length)) return [3 /*break*/, 9];
                        link = _a[_i];
                        _c.label = 4;
                    case 4:
                        _c.trys.push([4, 7, , 8]);
                        return [4 /*yield*/, link.textContent()];
                    case 5:
                        title = _c.sent();
                        return [4 /*yield*/, link.getAttribute('href')];
                    case 6:
                        href = _c.sent();
                        if (title && href && title.trim().length > 15) {
                            cleanTitle = title.replace(/^\d+\s*(minutes?|hours?|days?)\s*ago/i, '').trim();
                            news.push({
                                title: cleanTitle,
                                url: href.startsWith('http') ? href : "https://finance.yahoo.com".concat(href),
                                published_at: new Date().toISOString(),
                                source_date: new Date(),
                                relative_time: 'Recent',
                                author: '',
                            });
                        }
                        return [3 /*break*/, 8];
                    case 7:
                        _b = _c.sent();
                        return [3 /*break*/, 8];
                    case 8:
                        _i++;
                        return [3 /*break*/, 3];
                    case 9:
                        console.log("[Yahoo Finance] News extraites: ".concat(news.length));
                        return [3 /*break*/, 11];
                    case 10:
                        e_9 = _c.sent();
                        console.log('[Yahoo Finance] Erreur extraction news:', e_9 instanceof Error ? e_9.message : e_9);
                        return [3 /*break*/, 11];
                    case 11: return [2 /*return*/, news];
                }
            });
        });
    };
    VixPlaywrightScraper.prototype.extractText = function (page, selector, customTimeout) {
        return __awaiter(this, void 0, void 0, function () {
            var e_10, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 6, , 7]);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, page.waitForSelector(selector, { timeout: customTimeout || 5000 })];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        e_10 = _b.sent();
                        return [3 /*break*/, 4];
                    case 4: return [4 /*yield*/, page.locator(selector).first().textContent()];
                    case 5: return [2 /*return*/, (_b.sent()) || ''];
                    case 6:
                        _a = _b.sent();
                        return [2 /*return*/, ''];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    VixPlaywrightScraper.prototype.parseNumber = function (str) {
        if (!str)
            return null;
        var cleaned = str.trim();
        // Gérer le format européen (23,43) vs américain (1,234.56)
        if (cleaned.includes(',') && !cleaned.includes('.')) {
            cleaned = cleaned.replace(',', '.');
        }
        else if (cleaned.includes(',') && cleaned.includes('.')) {
            cleaned = cleaned.replace(/,/g, '');
        }
        // Nettoyer les caractères non numériques
        cleaned = cleaned.replace(/[^\d.-]/g, '');
        var val = parseFloat(cleaned);
        return isNaN(val) ? null : val;
    };
    VixPlaywrightScraper.prototype.parseRange = function (str) {
        var _this = this;
        if (!str)
            return [null, null];
        var parts = str.split('-').map(function (s) { return _this.parseNumber(s); });
        if (parts.length === 2)
            return [parts[0], parts[1]];
        return [null, null];
    };
    VixPlaywrightScraper.prototype.saveToDatabase = function (pool, results) {
        return __awaiter(this, void 0, void 0, function () {
            var validResults, client, _i, validResults_1, result, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        validResults = results.filter(function (r) { return r.value !== null; });
                        if (!(validResults.length > 0)) return [3 /*break*/, 9];
                        return [4 /*yield*/, pool.connect()];
                    case 1:
                        client = _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 7, 8, 9]);
                        _i = 0, validResults_1 = validResults;
                        _a.label = 3;
                    case 3:
                        if (!(_i < validResults_1.length)) return [3 /*break*/, 6];
                        result = validResults_1[_i];
                        return [4 /*yield*/, client.query("\n                        INSERT INTO market_data\n                        (symbol, asset_type, price, change, change_percent, source, timestamp)\n                        VALUES ($1, $2, $3, $4, $5, $6, NOW())\n                    ", ['VIX', 'VIX', result.value, result.change_abs, result.change_pct, result.source])];
                    case 4:
                        _a.sent();
                        console.log("[VixPlaywrightScraper] Saved data from ".concat(result.source, " to DB: ").concat(result.value));
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6: return [3 /*break*/, 9];
                    case 7:
                        error_7 = _a.sent();
                        console.error('[VixPlaywrightScraper] Error saving market data to database:', error_7);
                        return [3 /*break*/, 9];
                    case 8:
                        client.release();
                        return [7 /*endfinally*/];
                    case 9: 
                    // Sauvegarder les news
                    return [4 /*yield*/, this.saveNewsToDatabase(pool, results)];
                    case 10:
                        // Sauvegarder les news
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    VixPlaywrightScraper.prototype.saveNewsToDatabase = function (pool, results) {
        return __awaiter(this, void 0, void 0, function () {
            var allNews, client, savedCount, _i, allNews_1, news, existing, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        allNews = results.flatMap(function (r) { return r.news_headlines.map(function (n) { return (__assign(__assign({}, n), { source: r.source })); }); });
                        if (allNews.length === 0)
                            return [2 /*return*/];
                        return [4 /*yield*/, pool.connect()];
                    case 1:
                        client = _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 8, 9, 10]);
                        savedCount = 0;
                        _i = 0, allNews_1 = allNews;
                        _a.label = 3;
                    case 3:
                        if (!(_i < allNews_1.length)) return [3 /*break*/, 7];
                        news = allNews_1[_i];
                        return [4 /*yield*/, client.query('SELECT id FROM news_items WHERE url = $1', [news.url])];
                    case 4:
                        existing = _a.sent();
                        if (!(existing.rows.length === 0)) return [3 /*break*/, 6];
                        return [4 /*yield*/, client.query("\n                        INSERT INTO news_items\n                        (title, url, source, published_at, scraped_at, processing_status, market_hours)\n                        VALUES ($1, $2, $3, NOW(), NOW(), 'raw', 'market')\n                    ", [news.title, news.url, news.source])];
                    case 5:
                        _a.sent();
                        savedCount++;
                        _a.label = 6;
                    case 6:
                        _i++;
                        return [3 /*break*/, 3];
                    case 7:
                        if (savedCount > 0)
                            console.log("[VixPlaywrightScraper] Saved ".concat(savedCount, " new VIX news items to DB"));
                        return [3 /*break*/, 10];
                    case 8:
                        error_8 = _a.sent();
                        console.error('[VixPlaywrightScraper] Error saving news to database:', error_8);
                        return [3 /*break*/, 10];
                    case 9:
                        client.release();
                        return [7 /*endfinally*/];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    VixPlaywrightScraper.prototype.parseRelativeDate = function (relativeText) {
        var now = new Date();
        var text = relativeText.toLowerCase().trim();
        // Patterns pour les temps relatifs
        var patterns = [
            { regex: /(\d+)\s*seconds?\s*ago/, multiplier: 1000 },
            { regex: /(\d+)\s*minutes?\s*ago/, multiplier: 60 * 1000 },
            { regex: /(\d+)\s*hours?\s*ago/, multiplier: 60 * 60 * 1000 },
            { regex: /(\d+)\s*days?\s*ago/, multiplier: 24 * 60 * 60 * 1000 },
            { regex: /(\d+)\s*weeks?\s*ago/, multiplier: 7 * 24 * 60 * 60 * 1000 },
            { regex: /(\d+)\s*months?\s*ago/, multiplier: 30 * 24 * 60 * 60 * 1000 },
            { regex: /yesterday/i, multiplier: 24 * 60 * 60 * 1000, value: 1 },
            { regex: /today/i, multiplier: 0, value: 0 },
            { regex: /just now/i, multiplier: 0, value: 0 },
            { regex: /a few minutes? ago/i, multiplier: 5 * 60 * 1000, value: 5 },
            { regex: /about an hour ago/i, multiplier: 60 * 60 * 1000, value: 1 },
            { regex: /a day ago/i, multiplier: 24 * 60 * 60 * 1000, value: 1 },
        ];
        for (var _i = 0, patterns_1 = patterns; _i < patterns_1.length; _i++) {
            var pattern = patterns_1[_i];
            var match = text.match(pattern.regex);
            if (match) {
                var value = pattern.value !== undefined ? pattern.value : parseInt(match[1]);
                if (pattern.multiplier === 0)
                    return now; // "today", "just now"
                return new Date(now.getTime() - value * pattern.multiplier);
            }
        }
        // Fallback: retourner maintenant
        return now;
    };
    return VixPlaywrightScraper;
}());
exports.VixPlaywrightScraper = VixPlaywrightScraper;
