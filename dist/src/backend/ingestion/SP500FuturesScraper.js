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
exports.SP500FuturesScraper = void 0;
var playwright_1 = require("playwright");
var SP500FuturesScraper = /** @class */ (function () {
    function SP500FuturesScraper() {
        this.browser = null;
    }
    SP500FuturesScraper.prototype.init = function () {
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
    SP500FuturesScraper.prototype.close = function () {
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
    SP500FuturesScraper.prototype.createStealthPage = function () {
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
    /**
     * Scrape les contrats futures E-mini S&P 500 depuis Investing.com
     * Source fiable pour les vrais prix des futures
     */
    SP500FuturesScraper.prototype.scrapeInvestingFutures = function () {
        return __awaiter(this, void 0, void 0, function () {
            var page, cookieButton, _a, price, changeAbs, changePct, prevClose, open_1, dayRange, metaContent, cleanContent, data, lastPrice, _b, low_1, high_1, _c, low, high, parsedPrice, error_1;
            var _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0: return [4 /*yield*/, this.createStealthPage()];
                    case 1:
                        page = _f.sent();
                        _f.label = 2;
                    case 2:
                        _f.trys.push([2, 20, 21, 23]);
                        console.log('[SP500Futures] Navigation vers Investing.com E-mini S&P 500 Futures...');
                        return [4 /*yield*/, page.goto('https://www.investing.com/indices/us-spx-500-futures', {
                                waitUntil: 'domcontentloaded',
                                timeout: 30000,
                            })];
                    case 3:
                        _f.sent();
                        // Délai pour charger les données
                        return [4 /*yield*/, page.waitForTimeout(2000)];
                    case 4:
                        // Délai pour charger les données
                        _f.sent();
                        _f.label = 5;
                    case 5:
                        _f.trys.push([5, 10, , 11]);
                        cookieButton = page.locator('#onetrust-accept-btn-handler').first();
                        return [4 /*yield*/, cookieButton.isVisible({ timeout: 2000 })];
                    case 6:
                        if (!_f.sent()) return [3 /*break*/, 9];
                        return [4 /*yield*/, cookieButton.click()];
                    case 7:
                        _f.sent();
                        return [4 /*yield*/, page.waitForTimeout(1000)];
                    case 8:
                        _f.sent();
                        _f.label = 9;
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        _a = _f.sent();
                        return [3 /*break*/, 11];
                    case 11:
                        console.log('[SP500Futures] Extraction des données des futures...');
                        return [4 /*yield*/, this.extractText(page, '[data-test="instrument-price-last"]')];
                    case 12:
                        price = _f.sent();
                        return [4 /*yield*/, this.extractText(page, '[data-test="instrument-price-change"]')];
                    case 13:
                        changeAbs = _f.sent();
                        return [4 /*yield*/, this.extractText(page, '[data-test="instrument-price-change-percent"]')];
                    case 14:
                        changePct = _f.sent();
                        return [4 /*yield*/, this.extractText(page, '[data-test="prev-close-value"]')];
                    case 15:
                        prevClose = _f.sent();
                        return [4 /*yield*/, this.extractText(page, '[data-test="open-value"]')];
                    case 16:
                        open_1 = _f.sent();
                        return [4 /*yield*/, this.extractText(page, '[data-test="days-range-value"]')];
                    case 17:
                        dayRange = _f.sent();
                        if (!!price) return [3 /*break*/, 19];
                        console.log('[SP500Futures] Prix non trouvé, tentative avec meta tags...');
                        return [4 /*yield*/, page.getAttribute('meta[name="global-translation-variables"]', 'content', { timeout: 5000 })];
                    case 18:
                        metaContent = _f.sent();
                        if (metaContent) {
                            console.log('[SP500Futures] Meta tag trouvé, parsing en cours...');
                            try {
                                cleanContent = metaContent.replace(/&quot;/g, '"');
                                data = JSON.parse(cleanContent);
                                // Double parsing si encodé doublement
                                if (typeof data === 'string') {
                                    data = JSON.parse(data);
                                }
                                if (data && data.LAST_PRICE) {
                                    lastPrice = this.parseNumber(data.LAST_PRICE);
                                    console.log("[SP500Futures] \u2705 Prix trouv\u00E9 via meta: ".concat(lastPrice === null || lastPrice === void 0 ? void 0 : lastPrice.toFixed(2), " (Investing.com - Futures Direct)"));
                                    _b = this.parseRange(data.DAY_RANGE || ''), low_1 = _b[0], high_1 = _b[1];
                                    return [2 /*return*/, {
                                            current: this.parseNumber(data.LAST_PRICE) || 0,
                                            change: this.parseNumber(data.daily_change),
                                            percent_change: this.parseNumber((_d = data.daily_change_percent) === null || _d === void 0 ? void 0 : _d.replace('%', '')),
                                            high: high_1 || this.parseNumber(data.DAY_RANGE_HIGH),
                                            low: low_1 || this.parseNumber(data.DAY_RANGE_LOW),
                                            open: this.parseNumber(data.OPEN_PRICE),
                                            previous_close: this.parseNumber((_e = data.PREV_CLOSE) === null || _e === void 0 ? void 0 : _e.replace(/,/g, '')),
                                            symbol: 'ES',
                                            source: 'Investing.com',
                                        }];
                                }
                            }
                            catch (e) {
                                console.log('[SP500Futures] Erreur parsing meta:', e instanceof Error ? e.message : e);
                            }
                        }
                        _f.label = 19;
                    case 19:
                        _c = this.parseRange(dayRange), low = _c[0], high = _c[1];
                        if (price) {
                            parsedPrice = this.parseNumber(price);
                            console.log("[SP500Futures] \u2705 Donn\u00E9es futures extraites: ".concat(parsedPrice === null || parsedPrice === void 0 ? void 0 : parsedPrice.toFixed(2), " (Investing.com - Scraping Direct)"));
                            return [2 /*return*/, {
                                    current: this.parseNumber(price) || 0,
                                    change: this.parseNumber(changeAbs),
                                    percent_change: this.parseNumber(changePct === null || changePct === void 0 ? void 0 : changePct.replace(/[()%]/g, '')),
                                    high: high,
                                    low: low,
                                    open: this.parseNumber(open_1),
                                    previous_close: this.parseNumber(prevClose),
                                    symbol: 'ES',
                                    source: 'Investing.com',
                                }];
                        }
                        console.log('[SP500Futures] ❌ Données futures non trouvées');
                        return [2 /*return*/, null];
                    case 20:
                        error_1 = _f.sent();
                        console.error('[SP500Futures] Erreur scraping:', error_1 instanceof Error ? error_1.message : error_1);
                        return [2 /*return*/, null];
                    case 21: return [4 /*yield*/, page.close()];
                    case 22:
                        _f.sent();
                        return [7 /*endfinally*/];
                    case 23: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Scrape les futures depuis Yahoo Finance (alternative)
     */
    SP500FuturesScraper.prototype.scrapeYahooFutures = function () {
        return __awaiter(this, void 0, void 0, function () {
            var page, agreeButton, _a, price, changeAbs, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.createStealthPage()];
                    case 1:
                        page = _b.sent();
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 15, 16, 18]);
                        console.log('[SP500Futures] Navigation vers Yahoo Finance ES=F...');
                        return [4 /*yield*/, page.goto('https://finance.yahoo.com/quote/ES=F', {
                                waitUntil: 'domcontentloaded',
                                timeout: 25000,
                            })];
                    case 3:
                        _b.sent();
                        return [4 /*yield*/, page.waitForTimeout(1500)];
                    case 4:
                        _b.sent();
                        if (!page.url().includes('consent.yahoo.com')) return [3 /*break*/, 12];
                        _b.label = 5;
                    case 5:
                        _b.trys.push([5, 11, , 12]);
                        agreeButton = page.locator('button[name="agree"]').first();
                        return [4 /*yield*/, agreeButton.isVisible({ timeout: 2000 })];
                    case 6:
                        if (!_b.sent()) return [3 /*break*/, 10];
                        return [4 /*yield*/, agreeButton.click()];
                    case 7:
                        _b.sent();
                        return [4 /*yield*/, page.waitForTimeout(2000)];
                    case 8:
                        _b.sent();
                        if (!page.url().includes('consent.yahoo.com')) return [3 /*break*/, 10];
                        return [4 /*yield*/, page.goto('https://finance.yahoo.com/quote/ES=F', {
                                waitUntil: 'domcontentloaded',
                                timeout: 15000,
                            })];
                    case 9:
                        _b.sent();
                        _b.label = 10;
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        _a = _b.sent();
                        return [3 /*break*/, 12];
                    case 12:
                        console.log('[SP500Futures] Extraction Yahoo Finance...');
                        return [4 /*yield*/, this.extractText(page, '[data-field="regularMarketPrice"] fin-streamer', 5000)];
                    case 13:
                        price = _b.sent();
                        return [4 /*yield*/, this.extractText(page, '[data-field="regularMarketChangePercent"] fin-streamer span', 3000)];
                    case 14:
                        changeAbs = _b.sent();
                        if (price) {
                            console.log("[SP500Futures] \u2705 Yahoo Finance: ".concat(price));
                            return [2 /*return*/, {
                                    current: this.parseNumber(price) || 0,
                                    change: this.parseNumber(changeAbs),
                                    percent_change: this.parseNumber(changeAbs === null || changeAbs === void 0 ? void 0 : changeAbs.replace(/[()%]/g, '')),
                                    high: null,
                                    low: null,
                                    open: null,
                                    previous_close: null,
                                    symbol: 'ES',
                                    source: 'Yahoo Finance',
                                }];
                        }
                        return [2 /*return*/, null];
                    case 15:
                        error_2 = _b.sent();
                        console.error('[SP500Futures] Erreur Yahoo Finance:', error_2 instanceof Error ? error_2.message : error_2);
                        return [2 /*return*/, null];
                    case 16: return [4 /*yield*/, page.close()];
                    case 17:
                        _b.sent();
                        return [7 /*endfinally*/];
                    case 18: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Scrape ZeroHedge pour les niveaux techniques ES Futures
     * ZeroHedge publie souvent des analyses techniques avec des niveaux précis
     */
    SP500FuturesScraper.prototype.scrapeZeroHedgeLevels = function () {
        return __awaiter(this, void 0, void 0, function () {
            var page, result, articles, _i, _a, article, titleElement, title, linkElement, link, levels, articlePage, content, fullContent, contentLevels, e_1, _b, uniqueSupports, uniqueResistances, error_3;
            var _c, _d, _e, _f;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0: return [4 /*yield*/, this.createStealthPage()];
                    case 1:
                        page = _g.sent();
                        _g.label = 2;
                    case 2:
                        _g.trys.push([2, 24, 25, 27]);
                        console.log('[SP500Futures] 🔍 Recherche des niveaux techniques sur ZeroHedge...');
                        // Visiter ZeroHedge
                        return [4 /*yield*/, page.goto('https://www.zerohedge.com/', {
                                waitUntil: 'domcontentloaded',
                                timeout: 25000,
                            })];
                    case 3:
                        // Visiter ZeroHedge
                        _g.sent();
                        return [4 /*yield*/, page.waitForTimeout(2000)];
                    case 4:
                        _g.sent();
                        result = {
                            support_levels: [],
                            resistance_levels: [],
                            key_messages: [],
                            sentiment: 'neutral',
                            technical_levels: []
                        };
                        // Chercher les articles récents avec des niveaux S&P 500/ES
                        console.log('[SP500Futures] Recherche des articles techniques...');
                        return [4 /*yield*/, page.locator('article, .post-item, .entry-item').all()];
                    case 5:
                        articles = _g.sent();
                        _i = 0, _a = articles.slice(0, 15);
                        _g.label = 6;
                    case 6:
                        if (!(_i < _a.length)) return [3 /*break*/, 23];
                        article = _a[_i];
                        _g.label = 7;
                    case 7:
                        _g.trys.push([7, 21, , 22]);
                        return [4 /*yield*/, article.locator('h1, h2, .title, a').first()];
                    case 8:
                        titleElement = _g.sent();
                        return [4 /*yield*/, titleElement.textContent()];
                    case 9:
                        title = _g.sent();
                        return [4 /*yield*/, article.locator('a').first()];
                    case 10:
                        linkElement = _g.sent();
                        return [4 /*yield*/, linkElement.getAttribute('href')];
                    case 11:
                        link = _g.sent();
                        if (!(title && link && this.containsTechnicalLevels(title))) return [3 /*break*/, 20];
                        console.log("[SP500Futures] \uD83D\uDCCA Article technique trouv\u00E9: ".concat(title.substring(0, 60), "..."));
                        levels = this.extractLevelsFromText(title);
                        (_c = result.support_levels).push.apply(_c, levels.supports);
                        (_d = result.resistance_levels).push.apply(_d, levels.resistances);
                        result.technical_levels.push(title);
                        result.key_messages.push(title);
                        _g.label = 12;
                    case 12:
                        _g.trys.push([12, 18, , 19]);
                        return [4 /*yield*/, this.createStealthPage()];
                    case 13:
                        articlePage = _g.sent();
                        return [4 /*yield*/, articlePage.goto(link.startsWith('http') ? link : "https://www.zerohedge.com".concat(link), {
                                waitUntil: 'domcontentloaded',
                                timeout: 10000,
                            })];
                    case 14:
                        _g.sent();
                        return [4 /*yield*/, articlePage.waitForTimeout(1500)];
                    case 15:
                        _g.sent();
                        return [4 /*yield*/, articlePage.locator('.entry-content, .post-content, article p').allTextContents()];
                    case 16:
                        content = _g.sent();
                        fullContent = content.join(' ');
                        contentLevels = this.extractLevelsFromText(fullContent);
                        (_e = result.support_levels).push.apply(_e, contentLevels.supports);
                        (_f = result.resistance_levels).push.apply(_f, contentLevels.resistances);
                        // Analyser le sentiment
                        result.sentiment = this.analyzeSentiment(title + ' ' + fullContent);
                        return [4 /*yield*/, articlePage.close()];
                    case 17:
                        _g.sent();
                        return [3 /*break*/, 19];
                    case 18:
                        e_1 = _g.sent();
                        // Continuer même si l'article ne se charge pas
                        console.log('[SP500Futures] Impossible de charger l\'article détaillé');
                        return [3 /*break*/, 19];
                    case 19: return [3 /*break*/, 23]; // Limiter à 1-2 articles pour éviter le sur-scraping
                    case 20: return [3 /*break*/, 22];
                    case 21:
                        _b = _g.sent();
                        return [3 /*break*/, 22];
                    case 22:
                        _i++;
                        return [3 /*break*/, 6];
                    case 23:
                        uniqueSupports = Array.from(new Set(result.support_levels));
                        uniqueResistances = Array.from(new Set(result.resistance_levels));
                        result.support_levels = uniqueSupports.sort(function (a, b) { return b - a; });
                        result.resistance_levels = uniqueResistances.sort(function (a, b) { return a - b; });
                        // Garder seulement les niveaux pertinents (autour du prix actuel)
                        result.support_levels = result.support_levels.filter(function (level) { return level >= 5000 && level <= 8000; });
                        result.resistance_levels = result.resistance_levels.filter(function (level) { return level >= 5000 && level <= 8000; });
                        if (result.support_levels.length > 0 || result.resistance_levels.length > 0) {
                            console.log("[SP500Futures] \u2705 Niveaux ZeroHedge extraits:");
                            console.log("   Supports: [".concat(result.support_levels.slice(0, 5).join(', ')).concat(result.support_levels.length > 5 ? '...' : '', "]"));
                            console.log("   R\u00E9sistances: [".concat(result.resistance_levels.slice(0, 5).join(', ')).concat(result.resistance_levels.length > 5 ? '...' : '', "]"));
                            console.log("   Sentiment: ".concat(result.sentiment));
                            return [2 /*return*/, result];
                        }
                        console.log('[SP500Futures] ℹ️ Aucun niveau technique trouvé sur ZeroHedge');
                        return [2 /*return*/, null];
                    case 24:
                        error_3 = _g.sent();
                        console.error('[SP500Futures] Erreur scraping ZeroHedge:', error_3 instanceof Error ? error_3.message : error_3);
                        return [2 /*return*/, null];
                    case 25: return [4 /*yield*/, page.close()];
                    case 26:
                        _g.sent();
                        return [7 /*endfinally*/];
                    case 27: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Vérifie si un texte contient des niveaux techniques S&P 500/ES
     */
    SP500FuturesScraper.prototype.containsTechnicalLevels = function (text) {
        var keywords = [
            'S&P 500', 'SPX', 'E-mini', 'ES', 'ES1', 'futures',
            'support', 'resistance', 'level', 'target', 'pivot', 'breakout',
            '5000', '5100', '5200', '5300', '5400', '5500', '5600', '5700', '5800', '5900', '6000',
            '6100', '6200', '6300', '6400', '6500', '6600', '6700', '6800', '6900', '7000'
        ];
        var upperText = text.toUpperCase();
        return keywords.some(function (keyword) { return upperText.includes(keyword.toUpperCase()); });
    };
    /**
     * Extrait les niveaux numériques d'un texte
     */
    SP500FuturesScraper.prototype.extractLevelsFromText = function (text) {
        var levels = text.match(/\b[5-7]\d{3}\b/g); // Niveaux entre 5000-7999
        if (!levels) {
            return { supports: [], resistances: [] };
        }
        var numbers = levels.map(function (l) { return parseInt(l); });
        var supports = [];
        var resistances = [];
        // Répartition simple basée sur le contexte (peut être amélioré)
        var supportKeywords = ['support', 'buy', 'long', 'bottom', 'floor'];
        var resistanceKeywords = ['resistance', 'sell', 'short', 'top', 'ceiling'];
        numbers.forEach(function (level) {
            var upperText = text.toUpperCase();
            var beforeText = text.substring(0, text.indexOf(level.toString())).toUpperCase();
            var afterText = text.substring(text.indexOf(level.toString()) + 4).toUpperCase();
            // Déterminer si c'est un support ou résistance
            if (resistanceKeywords.some(function (keyword) { return beforeText.includes(keyword) || afterText.includes(keyword); })) {
                resistances.push(level);
            }
            else if (supportKeywords.some(function (keyword) { return beforeText.includes(keyword) || afterText.includes(keyword); })) {
                supports.push(level);
            }
            else {
                // Par défaut, ajouter aux deux ou selon la position relative
                supports.push(level);
                resistances.push(level);
            }
        });
        return { supports: supports, resistances: resistances };
    };
    /**
     * Analyse le sentiment d'un texte
     */
    SP500FuturesScraper.prototype.analyzeSentiment = function (text) {
        var bullishWords = ['buy', 'rally', 'bull', 'up', 'rise', 'gain', 'bullish', 'momentum', 'breakout', 'higher'];
        var bearishWords = ['sell', 'crash', 'bear', 'down', 'fall', 'loss', 'bearish', 'correction', 'drop', 'lower'];
        var upperText = text.toUpperCase();
        var bullishCount = bullishWords.filter(function (word) { return upperText.includes(word.toUpperCase()); }).length;
        var bearishCount = bearishWords.filter(function (word) { return upperText.includes(word.toUpperCase()); }).length;
        if (bullishCount > bearishCount * 1.5)
            return 'bullish';
        if (bearishCount > bullishCount * 1.5)
            return 'bearish';
        return 'neutral';
    };
    /**
     * Point d'entrée principal pour récupérer les futures S&P500 avec niveaux ZeroHedge
     */
    SP500FuturesScraper.prototype.fetchSP500FuturesWithZeroHedge = function () {
        return __awaiter(this, void 0, void 0, function () {
            var futuresData, zeroHedgeLevels, yahooData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.init()];
                    case 1:
                        _a.sent();
                        console.log('[SP500Futures] 🎯 Démarrage récupération complète S&P500 (prix + niveaux)...');
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, , 7, 9]);
                        // Priorité 1: Investing.com (plus fiable pour les futures)
                        console.log('[SP500Futures] 1️⃣ Récupération prix Investing.com...');
                        return [4 /*yield*/, this.scrapeInvestingFutures()];
                    case 3:
                        futuresData = _a.sent();
                        if (!(futuresData && futuresData.current > 1000)) return [3 /*break*/, 5];
                        console.log("[SP500Futures] \u2705 Prix Investing.com: ".concat(futuresData.current.toFixed(2)));
                        // Ajouter les niveaux ZeroHedge
                        console.log('[SP500Futures] 2️⃣ Ajout des niveaux techniques ZeroHedge...');
                        return [4 /*yield*/, this.scrapeZeroHedgeLevels()];
                    case 4:
                        zeroHedgeLevels = _a.sent();
                        if (zeroHedgeLevels) {
                            futuresData.support_levels = zeroHedgeLevels.support_levels;
                            futuresData.resistance_levels = zeroHedgeLevels.resistance_levels;
                            futuresData.key_levels = __spreadArray(__spreadArray([], zeroHedgeLevels.technical_levels, true), zeroHedgeLevels.key_messages, true);
                            futuresData.zero_hedge_analysis = {
                                technical_levels: zeroHedgeLevels.technical_levels,
                                sentiment: zeroHedgeLevels.sentiment,
                                key_messages: zeroHedgeLevels.key_messages
                            };
                            console.log('[SP500Futures] ✅ Données complètes avec niveaux ZeroHedge');
                            return [2 /*return*/, futuresData];
                        }
                        console.log('[SP500Futures] ⚠️ Données de prix uniquement (pas de niveaux ZeroHedge)');
                        return [2 /*return*/, futuresData];
                    case 5:
                        // Priorité 2: Yahoo Finance (alternative)
                        console.log('[SP500Futures] 2️⃣ Tentative Yahoo Finance...');
                        return [4 /*yield*/, this.scrapeYahooFutures()];
                    case 6:
                        yahooData = _a.sent();
                        if (yahooData && yahooData.current > 1000) {
                            console.log("[SP500Futures] \u2705 Prix Yahoo Finance: ".concat(yahooData.current.toFixed(2)));
                            return [2 /*return*/, yahooData];
                        }
                        console.log('[SP500Futures] ❌ Toutes les sources de futures ont échoué');
                        return [2 /*return*/, null];
                    case 7: return [4 /*yield*/, this.close()];
                    case 8:
                        _a.sent();
                        return [7 /*endfinally*/];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Point d'entrée principal pour récupérer les futures S&P500 (version originale)
     */
    SP500FuturesScraper.prototype.fetchSP500Futures = function () {
        return __awaiter(this, void 0, void 0, function () {
            var investingData, yahooData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.init()];
                    case 1:
                        _a.sent();
                        console.log('[SP500Futures] 🎯 Démarrage récupération futures S&P500...');
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, , 5, 7]);
                        // Priorité 1: Investing.com (plus fiable pour les futures)
                        console.log('[SP500Futures] 1️⃣ Tentative Investing.com...');
                        return [4 /*yield*/, this.scrapeInvestingFutures()];
                    case 3:
                        investingData = _a.sent();
                        if (investingData && investingData.current > 1000) {
                            console.log("[SP500Futures] \u2705 Investing.com r\u00E9ussi: ".concat(investingData.current.toFixed(2)));
                            return [2 /*return*/, investingData];
                        }
                        // Priorité 2: Yahoo Finance (alternative)
                        console.log('[SP500Futures] 2️⃣ Tentative Yahoo Finance...');
                        return [4 /*yield*/, this.scrapeYahooFutures()];
                    case 4:
                        yahooData = _a.sent();
                        if (yahooData && yahooData.current > 1000) {
                            console.log("[SP500Futures] \u2705 Yahoo Finance r\u00E9ussi: ".concat(yahooData.current.toFixed(2)));
                            return [2 /*return*/, yahooData];
                        }
                        console.log('[SP500Futures] ❌ Toutes les sources de futures ont échoué');
                        return [2 /*return*/, null];
                    case 5: return [4 /*yield*/, this.close()];
                    case 6:
                        _a.sent();
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    SP500FuturesScraper.prototype.extractText = function (page_1, selector_1) {
        return __awaiter(this, arguments, void 0, function (page, selector, timeout) {
            var _a;
            if (timeout === void 0) { timeout = 5000; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, page.waitForSelector(selector, { timeout: timeout })];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, page.locator(selector).first().textContent()];
                    case 2: return [2 /*return*/, (_b.sent()) || ''];
                    case 3:
                        _a = _b.sent();
                        return [2 /*return*/, ''];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    SP500FuturesScraper.prototype.parseNumber = function (str) {
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
    SP500FuturesScraper.prototype.parseRange = function (str) {
        var _this = this;
        if (!str)
            return [null, null];
        var parts = str.split('-').map(function (s) { return _this.parseNumber(s.trim()); });
        if (parts.length === 2)
            return [parts[0], parts[1]];
        return [null, null];
    };
    return SP500FuturesScraper;
}());
exports.SP500FuturesScraper = SP500FuturesScraper;
