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
                                // Browser globals are available in page context
                                Object.defineProperty(navigator, 'webdriver', { get: function () { return false; } });
                                Object.defineProperty(navigator, 'plugins', { get: function () { return [1, 2, 3, 4, 5]; } });
                                Object.defineProperty(navigator, 'languages', { get: function () { return ['en-US', 'en']; } });
                                window.chrome = { runtime: {} };
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
     * Scrape ZeroHedge pour les niveaux techniques ET le prix (si mentionné)
     * Remplace les autres sources de prix (Investing/Yahoo)
     */
    SP500FuturesScraper.prototype.scrapeZeroHedgeData = function () {
        return __awaiter(this, void 0, void 0, function () {
            var page, result, articles, priceFound, _i, _a, article, titleElement, title, linkElement, link, levels, extractedPrice, articlePage, content, fullContent, contentLevels, extractedPrice, e_1, _b, error_1;
            var _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
            return __generator(this, function (_p) {
                switch (_p.label) {
                    case 0: return [4 /*yield*/, this.createStealthPage()];
                    case 1:
                        page = _p.sent();
                        _p.label = 2;
                    case 2:
                        _p.trys.push([2, 26, 27, 29]);
                        console.log('[SP500Futures] 🔍 Recherche des niveaux et prix sur ZeroHedge...');
                        // Visiter ZeroHedge
                        return [4 /*yield*/, page.goto('https://www.zerohedge.com/', {
                                waitUntil: 'domcontentloaded',
                                timeout: 30000,
                            })];
                    case 3:
                        // Visiter ZeroHedge
                        _p.sent();
                        return [4 /*yield*/, page.waitForTimeout(2000)];
                    case 4:
                        _p.sent();
                        // Optimisation: Scroll pour charger plus d'articles (navigation active)
                        console.log('[SP500Futures] 📜 Navigation et scroll sur la page...');
                        return [4 /*yield*/, this.autoScroll(page)];
                    case 5:
                        _p.sent();
                        result = {
                            current: 0,
                            change: null,
                            percent_change: null,
                            high: null,
                            low: null,
                            open: null,
                            previous_close: null,
                            symbol: 'ES_ZH',
                            source: 'ZeroHedge',
                            support_levels: [],
                            resistance_levels: [],
                            key_levels: [],
                            zero_hedge_analysis: {
                                technical_levels: [],
                                sentiment: 'neutral',
                                key_messages: [],
                            },
                        };
                        // Chercher les articles récents avec des niveaux S&P 500/ES
                        console.log('[SP500Futures] Recherche des articles techniques...');
                        return [4 /*yield*/, page.locator('article, .post-item, .entry-item').all()];
                    case 6:
                        articles = _p.sent();
                        priceFound = false;
                        _i = 0, _a = articles.slice(0, 20);
                        _p.label = 7;
                    case 7:
                        if (!(_i < _a.length)) return [3 /*break*/, 25];
                        article = _a[_i];
                        _p.label = 8;
                    case 8:
                        _p.trys.push([8, 23, , 24]);
                        return [4 /*yield*/, article.locator('h1, h2, .title, a').first()];
                    case 9:
                        titleElement = _p.sent();
                        return [4 /*yield*/, titleElement.textContent()];
                    case 10:
                        title = _p.sent();
                        return [4 /*yield*/, article.locator('a').first()];
                    case 11:
                        linkElement = _p.sent();
                        return [4 /*yield*/, linkElement.getAttribute('href')];
                    case 12:
                        link = _p.sent();
                        if (!(title && link && this.containsTechnicalLevels(title))) return [3 /*break*/, 22];
                        console.log("[SP500Futures] \uD83D\uDCCA Article technique trouv\u00E9: ".concat(title.substring(0, 60), "..."));
                        levels = this.extractLevelsFromText(title);
                        (_c = result.support_levels) === null || _c === void 0 ? void 0 : _c.push.apply(_c, levels.supports);
                        (_d = result.resistance_levels) === null || _d === void 0 ? void 0 : _d.push.apply(_d, levels.resistances);
                        (_e = result.zero_hedge_analysis) === null || _e === void 0 ? void 0 : _e.technical_levels.push(title);
                        (_f = result.zero_hedge_analysis) === null || _f === void 0 ? void 0 : _f.key_messages.push(title);
                        // Essayer d'extraire le prix du titre
                        if (!priceFound) {
                            extractedPrice = this.extractPriceFromText(title);
                            if (extractedPrice) {
                                result.current = extractedPrice;
                                priceFound = true;
                                console.log("[SP500Futures] \uD83D\uDCB0 Prix extrait du titre: ".concat(extractedPrice));
                            }
                        }
                        _p.label = 13;
                    case 13:
                        _p.trys.push([13, 20, , 21]);
                        return [4 /*yield*/, this.createStealthPage()];
                    case 14:
                        articlePage = _p.sent();
                        return [4 /*yield*/, articlePage.goto(link.startsWith('http') ? link : "https://www.zerohedge.com".concat(link), {
                                waitUntil: 'domcontentloaded',
                                timeout: 15000,
                            })];
                    case 15:
                        _p.sent();
                        return [4 /*yield*/, articlePage.waitForTimeout(1500)];
                    case 16:
                        _p.sent();
                        // Scroll sur l'article aussi
                        return [4 /*yield*/, this.autoScroll(articlePage, 2)];
                    case 17:
                        // Scroll sur l'article aussi
                        _p.sent();
                        return [4 /*yield*/, articlePage
                                .locator('.entry-content, .post-content, article p')
                                .allTextContents()];
                    case 18:
                        content = _p.sent();
                        fullContent = content.join(' ');
                        contentLevels = this.extractLevelsFromText(fullContent);
                        (_g = result.support_levels) === null || _g === void 0 ? void 0 : _g.push.apply(_g, contentLevels.supports);
                        (_h = result.resistance_levels) === null || _h === void 0 ? void 0 : _h.push.apply(_h, contentLevels.resistances);
                        // Extraire le prix du contenu si pas encore trouvé
                        if (!priceFound) {
                            extractedPrice = this.extractPriceFromText(fullContent);
                            if (extractedPrice) {
                                result.current = extractedPrice;
                                priceFound = true;
                                console.log("[SP500Futures] \uD83D\uDCB0 Prix extrait du contenu: ".concat(extractedPrice));
                            }
                        }
                        // Analyser le sentiment
                        if (result.zero_hedge_analysis) {
                            result.zero_hedge_analysis.sentiment = this.analyzeSentiment(title + ' ' + fullContent);
                        }
                        return [4 /*yield*/, articlePage.close()];
                    case 19:
                        _p.sent();
                        return [3 /*break*/, 21];
                    case 20:
                        e_1 = _p.sent();
                        console.log("[SP500Futures] Impossible de charger l'article détaillé");
                        return [3 /*break*/, 21];
                    case 21:
                        // Si on a trouvé des niveaux et un prix, on peut s'arrêter ou continuer un peu
                        if (priceFound && (((_j = result.support_levels) === null || _j === void 0 ? void 0 : _j.length) || 0) > 2)
                            return [3 /*break*/, 25];
                        _p.label = 22;
                    case 22: return [3 /*break*/, 24];
                    case 23:
                        _b = _p.sent();
                        return [3 /*break*/, 24];
                    case 24:
                        _i++;
                        return [3 /*break*/, 7];
                    case 25:
                        // Dédupliquer et trier les niveaux
                        if (result.support_levels) {
                            result.support_levels = Array.from(new Set(result.support_levels))
                                .sort(function (a, b) { return b - a; })
                                .filter(function (level) { return level >= 4000 && level <= 8000; });
                        }
                        if (result.resistance_levels) {
                            result.resistance_levels = Array.from(new Set(result.resistance_levels))
                                .sort(function (a, b) { return a - b; })
                                .filter(function (level) { return level >= 4000 && level <= 8000; });
                        }
                        if ((result.support_levels && result.support_levels.length > 0) ||
                            (result.resistance_levels && result.resistance_levels.length > 0)) {
                            console.log("[SP500Futures] \u2705 Donn\u00E9es ZeroHedge extraites:");
                            console.log("   Prix estim\u00E9: ".concat(result.current || 'Non trouvé'));
                            console.log("   Supports: [".concat((_k = result.support_levels) === null || _k === void 0 ? void 0 : _k.slice(0, 5).join(', ')).concat((((_l = result.support_levels) === null || _l === void 0 ? void 0 : _l.length) || 0) > 5 ? '...' : '', "]"));
                            console.log("   R\u00E9sistances: [".concat((_m = result.resistance_levels) === null || _m === void 0 ? void 0 : _m.slice(0, 5).join(', ')).concat((((_o = result.resistance_levels) === null || _o === void 0 ? void 0 : _o.length) || 0) > 5 ? '...' : '', "]"));
                            return [2 /*return*/, result];
                        }
                        console.log('[SP500Futures] ℹ️ Aucune donnée pertinente trouvée sur ZeroHedge');
                        return [2 /*return*/, null];
                    case 26:
                        error_1 = _p.sent();
                        console.error('[SP500Futures] Erreur scraping ZeroHedge:', error_1 instanceof Error ? error_1.message : error_1);
                        return [2 /*return*/, null];
                    case 27: return [4 /*yield*/, page.close()];
                    case 28:
                        _p.sent();
                        return [7 /*endfinally*/];
                    case 29: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Scroll automatique pour charger le contenu dynamique
     */
    SP500FuturesScraper.prototype.autoScroll = function (page_1) {
        return __awaiter(this, arguments, void 0, function (page, maxScrolls) {
            var scrolls, previousHeight, currentHeight, e_2;
            if (maxScrolls === void 0) { maxScrolls = 5; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        scrolls = 0;
                        previousHeight = 0;
                        _a.label = 1;
                    case 1:
                        if (!(scrolls < maxScrolls)) return [3 /*break*/, 4];
                        return [4 /*yield*/, page.evaluate(function () {
                                window.scrollTo(0, document.body.scrollHeight);
                                return document.body.scrollHeight;
                            })];
                    case 2:
                        currentHeight = _a.sent();
                        if (currentHeight === previousHeight)
                            return [3 /*break*/, 4];
                        previousHeight = currentHeight;
                        return [4 /*yield*/, page.waitForTimeout(1000)];
                    case 3:
                        _a.sent();
                        scrolls++;
                        return [3 /*break*/, 1];
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        e_2 = _a.sent();
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Vérifie si un texte contient des niveaux techniques S&P 500/ES
     */
    SP500FuturesScraper.prototype.containsTechnicalLevels = function (text) {
        var keywords = [
            'S&P 500',
            'SPX',
            'E-mini',
            'ES',
            'ES1',
            'futures',
            'support',
            'resistance',
            'level',
            'target',
            'pivot',
            'breakout',
            '5000',
            '5100',
            '5200',
            '5300',
            '5400',
            '5500',
            '5600',
            '5700',
            '5800',
            '5900',
            '6000',
            '6100',
            '6200',
            '6300',
            '6400',
            '6500',
            '6600',
            '6700',
            '6800',
            '6900',
            '7000',
        ];
        var upperText = text.toUpperCase();
        return keywords.some(function (keyword) { return upperText.includes(keyword.toUpperCase()); });
    };
    /**
     * Extrait les niveaux numériques d'un texte
     */
    SP500FuturesScraper.prototype.extractLevelsFromText = function (text) {
        var levels = text.match(/\b[4-7]\d{3}\b/g); // Niveaux entre 4000-7999
        if (!levels) {
            return { supports: [], resistances: [] };
        }
        var numbers = levels.map(function (l) { return parseInt(l); });
        var supports = [];
        var resistances = [];
        // Répartition simple basée sur le contexte
        var supportKeywords = ['support', 'buy', 'long', 'bottom', 'floor', 'bid'];
        var resistanceKeywords = ['resistance', 'sell', 'short', 'top', 'ceiling', 'ask', 'offer'];
        numbers.forEach(function (level) {
            var index = text.indexOf(level.toString());
            var context = text
                .substring(Math.max(0, index - 30), Math.min(text.length, index + 30))
                .toUpperCase();
            if (resistanceKeywords.some(function (k) { return context.includes(k.toUpperCase()); })) {
                resistances.push(level);
            }
            else if (supportKeywords.some(function (k) { return context.includes(k.toUpperCase()); })) {
                supports.push(level);
            }
            else {
                // Par défaut, ajouter aux deux
                supports.push(level);
                resistances.push(level);
            }
        });
        return { supports: supports, resistances: resistances };
    };
    /**
     * Tente d'extraire un prix actuel du texte
     */
    SP500FuturesScraper.prototype.extractPriceFromText = function (text) {
        // Patterns: "trading at 5500", "currently 5500", "ES at 5500", "SPX 5500"
        var patterns = [
            /(?:trading at|currently|price|spot|now|last)[\s:]*([4-7]\d{3}(?:\.\d{1,2})?)/i,
            /(?:S&P 500|SPX|ES)[\s]*(?:is)?[\s]*at[\s]*([4-7]\d{3}(?:\.\d{1,2})?)/i,
        ];
        for (var _i = 0, patterns_1 = patterns; _i < patterns_1.length; _i++) {
            var pattern = patterns_1[_i];
            var match = text.match(pattern);
            if (match && match[1]) {
                return parseFloat(match[1]);
            }
        }
        return null;
    };
    /**
     * Analyse le sentiment d'un texte
     */
    SP500FuturesScraper.prototype.analyzeSentiment = function (text) {
        var bullishWords = [
            'buy',
            'rally',
            'bull',
            'up',
            'rise',
            'gain',
            'bullish',
            'momentum',
            'breakout',
            'higher',
        ];
        var bearishWords = [
            'sell',
            'crash',
            'bear',
            'down',
            'fall',
            'loss',
            'bearish',
            'correction',
            'drop',
            'lower',
        ];
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
     * Point d'entrée principal - Focus ZeroHedge uniquement
     */
    SP500FuturesScraper.prototype.fetchSP500FuturesWithZeroHedge = function () {
        return __awaiter(this, void 0, void 0, function () {
            var zhData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.init()];
                    case 1:
                        _a.sent();
                        console.log('[SP500Futures] 🎯 Démarrage récupération S&P500 (Focus ZeroHedge)...');
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, , 4, 6]);
                        return [4 /*yield*/, this.scrapeZeroHedgeData()];
                    case 3:
                        zhData = _a.sent();
                        if (zhData) {
                            return [2 /*return*/, zhData];
                        }
                        console.log('[SP500Futures] ❌ Aucune donnée trouvée sur ZeroHedge');
                        return [2 /*return*/, null];
                    case 4: return [4 /*yield*/, this.close()];
                    case 5:
                        _a.sent();
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Alias pour compatibilité
     */
    SP500FuturesScraper.prototype.fetchSP500Futures = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.fetchSP500FuturesWithZeroHedge()];
            });
        });
    };
    return SP500FuturesScraper;
}());
exports.SP500FuturesScraper = SP500FuturesScraper;
