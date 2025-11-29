import { chromium } from 'playwright';
export class VixPlaywrightScraper {
    browser = null;
    cache;
    metrics;
    constructor() {
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
    async init() {
        if (!this.browser) {
            try {
                // Attendre un court délai pour éviter les race conditions
                await new Promise(resolve => setTimeout(resolve, 100));
                this.browser = await chromium.launch({
                    headless: true,
                    args: ['--no-sandbox', '--disable-setuid-sandbox'],
                    timeout: 30000,
                });
                console.log('[VixPlaywrightScraper] Browser launched successfully');
            }
            catch (error) {
                console.error('[VixPlaywrightScraper] Failed to launch browser:', error);
                throw new Error(`Browser launch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    }
    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
    async createStealthPage() {
        // Vérifier si le navigateur est initialisé et connecté
        if (!this.browser || !this.browser.isConnected()) {
            console.log('[VixPlaywrightScraper] Browser disconnected or not initialized, (re)starting...');
            await this.close();
            await this.init();
        }
        if (!this.browser)
            throw new Error('Browser initialization failed');
        try {
            const context = await this.browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                viewport: { width: 1920, height: 1080 },
                extraHTTPHeaders: {
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Upgrade-Insecure-Requests': '1',
                    Referer: 'https://www.google.com/',
                    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                },
            });
            const page = await context.newPage();
            // Simuler comportement humain
            await page.addInitScript(() => {
                // Browser globals are available in page context
                Object.defineProperty(navigator, 'webdriver', { get: () => false });
                Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
                Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
                window.chrome = { runtime: {} };
                Object.defineProperty(navigator, 'permissions', {
                    get: () => ({
                        query: () => Promise.resolve({ state: 'granted' }),
                    }),
                });
            });
            return page;
        }
        catch (error) {
            console.warn('[VixPlaywrightScraper] Error creating page, attempting one restart...', error);
            // Tentative de récupération : redémarrer le navigateur
            await this.close();
            await this.init();
            if (!this.browser)
                throw new Error('Browser recovery failed');
            // Réessayer une fois
            const context = await this.browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                viewport: { width: 1920, height: 1080 },
            });
            const page = await context.newPage();
            return page;
        }
    }
    async humanDelay(page, min = 50, max = 200) {
        const delay = Math.random() * (max - min) + min;
        await page.waitForTimeout(delay);
    }
    getCacheKey(source) {
        return `vix_${source}_${new Date().toDateString()}`;
    }
    isCacheValid(cacheEntry) {
        return Date.now() - cacheEntry.timestamp < cacheEntry.ttl;
    }
    async getCachedData(source) {
        const cacheKey = this.getCacheKey(source);
        const cached = this.cache.get(cacheKey);
        if (cached && this.isCacheValid(cached)) {
            this.metrics.cacheHits++;
            console.log(`💾 Cache HIT pour ${source} (${this.metrics.cacheHits} hits total)`);
            return cached.data;
        }
        return null;
    }
    setCachedData(source, data, ttl = 5 * 60 * 1000) {
        const cacheKey = this.getCacheKey(source);
        this.cache.set(cacheKey, {
            data,
            timestamp: Date.now(),
            ttl,
        });
        console.log(`💾 Cache SET pour ${source} (TTL: ${ttl / 1000}s)`);
    }
    async scrapeWithTimeout(source, scrapeFn, timeout = 60000) {
        // Vérifier le cache d'abord
        const cached = await this.getCachedData(source);
        if (cached) {
            return cached;
        }
        const startTime = Date.now();
        try {
            const result = await Promise.race([
                scrapeFn(),
                new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout: ${source} scraping timeout`)), timeout)),
            ]);
            const responseTime = Date.now() - startTime;
            if (result && typeof result === 'object' && result.value !== null) {
                // Mettre en cache si succès (5 minutes TTL)
                this.setCachedData(source, result, 5 * 60 * 1000); // 5 minutes
            }
            return result;
        }
        catch (error) {
            console.warn(`⚠️ Erreur scraping ${source}:`, error instanceof Error ? error.message : error);
            throw error;
        }
    }
    async scrapeAll() {
        const startTime = Date.now();
        await this.init();
        console.log('🚀 Démarrage scraping VIX (MODE SÉQUENTIEL OPTIMISÉ)...');
        // Exécution SÉQUENTIELLE avec timeout plus long et gestion robuste
        const primaryResults = [];
        // Ordre de priorité : Investing (Meta tag ultra-rapide) -> Yahoo -> MarketWatch
        const sources = [
            { name: 'Investing.com', fn: () => this.scrapeInvesting(), timeout: 30000 }, // Plus rapide - meta tag
            // { name: 'Yahoo Finance', fn: () => this.scrapeYahoo(), timeout: 45000 }, // Désactivé - sélecteurs obsolètes
            // { name: 'MarketWatch', fn: () => this.scrapeMarketWatch(), timeout: 35000 }, // Désactivé - URL invalide
        ];
        // Scraper VVIX en parallèle
        console.log('\n🎯 Démarrage VVIX scraping...');
        const vvixResult = await this.scrapeVVIX();
        for (const source of sources) {
            console.log(`\n🎯 Démarrage ${source.name} (timeout: ${source.timeout}ms)...`);
            try {
                // Timeout adapté par source + délai entre sources
                const result = await this.scrapeWithTimeout(source.name, source.fn, source.timeout);
                // Ajouter les données VVIX et l'analyse intelligente
                result.vvix_data = vvixResult;
                // Générer l'interprétation si on a des données VIX valides
                if (result.value && vvixResult.value) {
                    result.interpretation = this.generateVixInterpretation(result.value, vvixResult.value);
                    console.log(`[ANALYSE] VIX=${result.value} + VVIX=${vvixResult.value} = ${result.interpretation.market_signal}`);
                }
                else if (result.value) {
                    result.interpretation = this.generateVixInterpretation(result.value, null);
                    console.log(`[ANALYSE] VIX=${result.value} (sans VVIX) = ${result.interpretation.market_signal}`);
                }
                primaryResults.push({ status: 'fulfilled', value: result });
                console.log(`✅ ${source.name} terminé avec succès`);
                // Délai plus long entre sources pour éviter détection
                if (sources.indexOf(source) < sources.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }
            catch (error) {
                console.log(`❌ ${source.name} échoué:`, error instanceof Error ? error.message : error);
                primaryResults.push({ status: 'rejected', reason: error });
            }
        }
        await this.close();
        const totalTime = Date.now() - startTime;
        this.updateAverageResponseTime(totalTime);
        console.log(`📊 Métriques scraping - Total: ${totalTime}ms, Cache hits: ${this.metrics.cacheHits}/${this.metrics.totalRequests}`);
        console.log(`   Investing.com: ${this.metrics.sourceMetrics.get('Investing.com')?.success ? '✅' : '❌'}, Yahoo: ${this.metrics.sourceMetrics.get('Yahoo Finance')?.success ? '✅' : '❌'}, MarketWatch: ${this.metrics.sourceMetrics.get('MarketWatch')?.success ? '✅' : '❌'}`);
        const finalResults = primaryResults.map((result, index) => {
            // Must match the order in the 'sources' array above
            const sourcesList = ['Investing.com', 'Yahoo Finance', 'MarketWatch'];
            const sourceName = sourcesList[index];
            this.metrics.totalRequests++;
            if (result.status === 'fulfilled') {
                if (result.value.value !== null) {
                    this.metrics.successfulRequests++;
                }
                else {
                    this.metrics.failedRequests++;
                }
                return result.value;
            }
            else {
                this.metrics.failedRequests++;
                this.metrics.sourceMetrics.set(sourceName, {
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
        return finalResults;
    }
    async scrapeWithMetrics(sourceName, scrapeFn) {
        const startTime = Date.now();
        try {
            console.log(`[PARALLEL] ${sourceName} - Démarrage...`);
            const result = await scrapeFn();
            const responseTime = Date.now() - startTime;
            this.metrics.sourceMetrics.set(sourceName, {
                success: result.value !== null,
                responseTime,
                error: result.error,
            });
            console.log(`[PARALLEL] ${sourceName} - Terminé en ${responseTime}ms - ${result.value !== null ? '✅' : '❌'}`);
            return result;
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.metrics.sourceMetrics.set(sourceName, {
                success: false,
                responseTime,
                error: errorMessage,
            });
            console.log(`[PARALLEL] ${sourceName} - Erreur en ${responseTime}ms: ${errorMessage}`);
            throw error;
        }
    }
    updateAverageResponseTime(totalTime) {
        const successfulMetrics = Array.from(this.metrics.sourceMetrics.values()).filter(metric => metric.success);
        if (successfulMetrics.length > 0) {
            const avgTime = successfulMetrics.reduce((sum, metric) => sum + metric.responseTime, 0) /
                successfulMetrics.length;
            this.metrics.averageResponseTime = Math.round(avgTime);
        }
    }
    logMetrics(totalTime) {
        console.log('\n📊 MÉTRIQUES DE SCRAPING:');
        console.log('='.repeat(50));
        console.log(`⏱️  Temps total: ${totalTime}ms`);
        console.log(`📈 Taux de réussite: ${((this.metrics.successfulRequests / this.metrics.totalRequests) * 100).toFixed(1)}%`);
        console.log(`✅ Succès: ${this.metrics.successfulRequests}/${this.metrics.totalRequests}`);
        console.log(`⚡ Temps moyen: ${this.metrics.averageResponseTime}ms`);
        console.log('\n📋 DÉTAIL PAR SOURCE:');
        this.metrics.sourceMetrics.forEach((metric, source) => {
            const status = metric.success ? '✅' : '❌';
            console.log(`   ${status} ${source}: ${metric.responseTime}ms ${metric.error ? `- ${metric.error}` : ''}`);
        });
        console.log('');
    }
    getMetrics() {
        return {
            ...this.metrics,
            sourceMetrics: Object.fromEntries(this.metrics.sourceMetrics),
        };
    }
    resetMetrics() {
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            sourceMetrics: new Map(),
            cacheHits: 0,
        };
    }
    async scrapeMarketWatch() {
        const page = await this.createStealthPage();
        try {
            console.log('[MarketWatch] Navigation optimisée VIX...');
            await page.goto('https://www.marketwatch.com/investing/index/vix', {
                waitUntil: 'domcontentloaded', // Plus rapide
                timeout: 35000, // Timeout ajusté selon la configuration
            });
            await this.humanDelay(page, 1500, 3000);
            // STRATÉGIE 1: Utiliser les sélecteurs CSS qui fonctionnent (selon debug)
            console.log('[MarketWatch] Extraction avec sélecteurs CSS...');
            // Le debug montre que .intraday__price .value fonctionne
            const value = await this.extractText(page, '.intraday__price .value', 8000);
            // Autres données avec fallbacks
            const changeAbs = await this.extractText(page, '.intraday__price .change--point .value', 5000);
            const changePct = await this.extractText(page, '.intraday__price .change--percent .value', 5000);
            const prevClose = await this.extractText(page, '.intraday__close .value', 4000);
            const open = await this.extractText(page, '.intraday__open .value', 4000);
            const rangeText = await this.extractText(page, '.range__content', 4000);
            const [low, high] = this.parseRange(rangeText);
            // Extraire les news MarketWatch avec timeout et gestion d'erreur robuste
            const news = [];
            try {
                console.log('[MarketWatch] Recherche des news avec timeout...');
                // Timeout global pour l'extraction des news
                const newsExtraction = this.extractMarketWatchNewsWithTimeout(page);
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('MarketWatch news extraction timeout')), 6000));
                const result = await Promise.race([newsExtraction, timeoutPromise]);
                news.push(...result);
                console.log(`[MarketWatch] News trouvées: ${news.length}`);
            }
            catch (e) {
                console.log('[MarketWatch] Erreur extraction news (ignorée):', e instanceof Error ? e.message : e);
                // Ne pas ajouter de news en cas d'erreur
            }
            return {
                source: 'MarketWatch',
                value: this.parseNumber(value),
                change_abs: this.parseNumber(changeAbs),
                change_pct: this.parseNumber(changePct?.replace('%', '')),
                previous_close: this.parseNumber(prevClose),
                open: this.parseNumber(open),
                high: high,
                low: low,
                last_update: new Date().toISOString(),
                news_headlines: news,
            };
        }
        catch (error) {
            throw new Error(`MarketWatch scrape failed: ${error instanceof Error ? error.message : error}`);
        }
        finally {
            const context = page.context();
            await page.close();
            if (context)
                await context.close();
        }
    }
    async scrapeInvesting() {
        const page = await this.createStealthPage();
        try {
            console.log('[Investing.com] Navigation pour Meta Tag extraction...');
            // Utiliser waitUntil: 'domcontentloaded' pour un accès plus rapide au meta tag
            await page.goto('https://www.investing.com/indices/volatility-s-p-500', {
                waitUntil: 'domcontentloaded',
                timeout: 15000,
            });
            // Délai minimal pour charger le meta tag
            await this.humanDelay(page, 500, 1500);
            // PRIORITÉ ABSOLUE : Meta Tag Method (très rapide et fiable)
            try {
                const metaContent = await page.getAttribute('meta[name="global-translation-variables"]', 'content', { timeout: 8000 } // Timeout court pour le meta tag
                );
                if (metaContent) {
                    console.log('[Investing.com] Meta Tag trouvé! Analyse en cours...');
                    const cleanContent = metaContent.replace(/&quot;/g, '"');
                    let data = JSON.parse(cleanContent);
                    // Double parsing si encodé doublement
                    if (typeof data === 'string') {
                        data = JSON.parse(data);
                    }
                    if (data && data.LAST_PRICE) {
                        console.log(`[Investing.com] ✅ Succès Meta Tag: VIX ${data.LAST_PRICE} (extraction instantanée!)`);
                        // Extraire les news rapidement après le succès du meta tag
                        const news = await this.extractInvestingNewsFast(page);
                        return {
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
                            news_headlines: news,
                        };
                    }
                    else {
                        console.log('[Investing.com] Meta Tag trouvé mais pas de données LAST_PRICE');
                    }
                }
                else {
                    console.log('[Investing.com] Meta Tag non trouvé - fallback nécessaire');
                }
            }
            catch (e) {
                console.log('[Investing.com] Erreur Meta Tag:', e instanceof Error ? e.message : e);
            }
            // FALLBACK - seulement si Meta Tag a échoué
            console.log('[Investing.com] Fallback vers DOM selectors...');
            await page.waitForTimeout(2000); // Attendre le chargement complet
            // Accepter les cookies si nécessaire
            try {
                const cookieSelectors = [
                    '#onetrust-accept-btn-handler',
                    'button[data-testid="accept-btn"]',
                    '.js-accept-all-cookies',
                    'button:has-text("I Agree")',
                    'button:has-text("Accept")',
                ];
                for (const selector of cookieSelectors) {
                    if (await page.locator(selector).first().isVisible({ timeout: 1000 })) {
                        await page.locator(selector).first().click();
                        await page.waitForTimeout(500);
                        break;
                    }
                }
            }
            catch (e) {
                // Pas de cookies
            }
            const value = await this.extractText(page, '[data-test="instrument-price-last"]');
            const changeAbs = await this.extractText(page, '[data-test="instrument-price-change"]');
            const changePct = await this.extractText(page, '[data-test="instrument-price-change-percent"]');
            const prevClose = await this.extractText(page, '[data-test="prev-close-value"]');
            const open = await this.extractText(page, '[data-test="open-value"]');
            const dayRange = await this.extractText(page, '[data-test="days-range-value"]');
            const [low, high] = this.parseRange(dayRange);
            // News extraction optimisée
            const news = await this.extractInvestingNewsFast(page);
            const hasValue = value !== null && value !== '';
            return {
                source: 'Investing.com',
                value: this.parseNumber(value),
                change_abs: hasValue ? this.parseNumber(changeAbs) : null,
                change_pct: hasValue ? this.parseNumber(changePct?.replace(/[()%]/g, '')) : null,
                previous_close: this.parseNumber(prevClose),
                open: this.parseNumber(open),
                high: high,
                low: low,
                last_update: new Date().toISOString(),
                news_headlines: news,
            };
        }
        catch (error) {
            throw new Error(`Investing.com scrape failed: ${error instanceof Error ? error.message : error}`);
        }
        finally {
            const context = page.context();
            await page.close();
            if (context)
                await context.close();
        }
    }
    // Méthode optimisée pour extraire les news rapidement
    async extractInvestingNewsFast(page) {
        const news = [];
        try {
            console.log('[Investing.com] Extraction rapide des news...');
            // Sélecteurs multiples pour les news
            const newsSelectors = [
                'article[data-test="article-item"] a',
                'div.articleItem a',
                'div.textDiv a',
                'div[data-test="news-article"] a',
                'div.newsItem a',
                'li.article-item a',
                'div.newsStory a',
            ];
            for (const selector of newsSelectors) {
                try {
                    const links = await page.locator(selector).all();
                    for (const link of links.slice(0, 8)) {
                        try {
                            const title = await link.textContent();
                            const href = await link.getAttribute('href');
                            if (title && href && title.trim().length > 15) {
                                const cleanTitle = title
                                    .replace(/\d+\s*(minutes?|hours?|days?)\s*ago/gi, '')
                                    .trim();
                                news.push({
                                    title: cleanTitle,
                                    url: href.startsWith('http') ? href : `https://www.investing.com${href}`,
                                    published_at: new Date().toISOString(),
                                    source_date: new Date(),
                                    relative_time: 'Recent',
                                    author: '',
                                });
                            }
                            if (news.length >= 6)
                                break;
                        }
                        catch {
                            continue;
                        }
                    }
                    if (news.length >= 4)
                        break;
                }
                catch {
                    continue;
                }
            }
            console.log(`[Investing.com] News extraites: ${news.length}`);
        }
        catch (e) {
            console.log('[Investing.com] Erreur extraction news rapide:', e instanceof Error ? e.message : e);
        }
        return news;
    }
    async scrapeYahoo() {
        const page = await this.createStealthPage();
        try {
            console.log('[Yahoo Finance] Navigation optimisée pour consentement...');
            // Gestion simplifiée et rapide du consentement Yahoo
            await page.goto('https://finance.yahoo.com/quote/%5EVIX', {
                waitUntil: 'domcontentloaded',
                timeout: 25000, // Timeout augmenté pour consent handling
            });
            await this.humanDelay(page, 800, 1500); // Délai réduit
            // GESTION RAPIDE : Si redirection consentement, cliquer sur agree
            if (page.url().includes('consent.yahoo.com')) {
                console.log('[Yahoo Finance] Gestion rapide consentement...');
                try {
                    // Cliquer sur le bouton agree (le debug montre qu'il fonctionne)
                    const agreeButton = page.locator('button[name="agree"]').first();
                    if (await agreeButton.isVisible({ timeout: 2000 })) {
                        await agreeButton.click();
                        await page.waitForTimeout(1500); // Attendre la redirection
                        // Vérifier si on a été redirigé
                        if (page.url().includes('consent.yahoo.com')) {
                            console.log('[Yahoo Finance] Rechargement direct...');
                            await page.goto('https://finance.yahoo.com/quote/%5EVIX', {
                                waitUntil: 'domcontentloaded',
                                timeout: 12000,
                            });
                        }
                    }
                }
                catch (e) {
                    console.log('[Yahoo Finance] Erreur consentement, continuation...');
                }
            }
            // EXTRACTION RAPIDE avec les sélecteurs confirmés par le debug
            console.log('[Yahoo Finance] Extraction rapide des données...');
            // Utiliser les sélecteurs qui fonctionnent selon le debug
            const value = (await this.extractText(page, 'fin-streamer[data-field="regularMarketPrice"][data-symbol="^VIX"]', 6000)) || (await this.extractText(page, '[data-testid="qsp-price"]', 4000));
            const changeAbs = await this.extractText(page, '[data-testid="qsp-price-change"]', 3000);
            const changePct = await this.extractText(page, '[data-testid="qsp-price-change-percent"]', 3000);
            // Autres données avec timeout courts
            const prevClose = await this.extractText(page, '[data-test="PREV_CLOSE-value"]', 3000);
            const open = await this.extractText(page, '[data-test="OPEN-value"]', 3000);
            const range = await this.extractText(page, '[data-test="DAYS_RANGE-value"]', 3000);
            const [low, high] = this.parseRange(range);
            // Extraction des news avec approche simplifiée
            const news = await this.extractYahooNewsFast(page);
            console.log(`[Yahoo Finance] ✅ Extraction réussie: ${value || 'NULL'} (change: ${changePct})`);
            return {
                source: 'Yahoo Finance',
                value: this.parseNumber(value),
                change_abs: this.parseNumber(changeAbs),
                change_pct: this.parseNumber(changePct?.replace(/[()%]/g, '')),
                previous_close: this.parseNumber(prevClose),
                open: this.parseNumber(open),
                high: high,
                low: low,
                last_update: new Date().toISOString(),
                news_headlines: news,
            };
        }
        catch (error) {
            console.log('[Yahoo Finance] Erreur:', error instanceof Error ? error.message : error);
            throw new Error(`Yahoo Finance scrape failed: ${error instanceof Error ? error.message : error}`);
        }
        finally {
            const context = page.context();
            await page.close();
            if (context)
                await context.close();
        }
    }
    // Gestion spécialisée de la redirection consent.yahoo.com
    async handleYahooConsentRedirect(page) {
        try {
            console.log('[Yahoo Finance] Gestion redirection consentement...');
            // Attendre que les boutons apparaissent
            await page.waitForTimeout(1500);
            // Sélecteurs prioritaires pour la page de redirection
            const consentSelectors = [
                'button[name="agree"]',
                'button.accept-all',
                'button[name="consent-accept"]',
                'form button[type="submit"]',
                'button:has-text("Accept all")',
                'button:has-text("Tout accepter")',
                'button:has-text("Accept")',
                'button:has-text("I agree")',
            ];
            for (const selector of consentSelectors) {
                try {
                    const button = page.locator(selector).first();
                    if (await button.isVisible({ timeout: 2000 })) {
                        console.log(`[Yahoo Finance] Click sur: ${selector}`);
                        await button.click();
                        await page.waitForTimeout(1000);
                        // Attendre la redirection
                        try {
                            await page.waitForNavigation({
                                timeout: 10000,
                                waitUntil: 'domcontentloaded',
                            });
                            console.log('[Yahoo Finance] Redirection réussie vers:', page.url());
                            break;
                        }
                        catch (navError) {
                            // Continuer même si la redirection échoue
                            console.log('[Yahoo Finance] Navigation timeout, continuation...');
                        }
                    }
                }
                catch {
                    continue;
                }
            }
        }
        catch (e) {
            console.log('[Yahoo Finance] Erreur gestion redirection:', e instanceof Error ? e.message : e);
        }
    }
    // Gestion du popup de consentement dans la page Yahoo
    async handleYahooConsentPopup(page) {
        try {
            console.log('[Yahoo Finance] Vérification popup consentement...');
            // Sélecteurs pour les popups dans la page
            const popupSelectors = [
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
            for (const selector of popupSelectors) {
                try {
                    const button = page.locator(selector).first();
                    if (await button.isVisible({ timeout: 1500 })) {
                        console.log(`[Yahoo Finance] Popup click sur: ${selector}`);
                        await button.click();
                        await page.waitForTimeout(2000);
                        break;
                    }
                }
                catch {
                    continue;
                }
            }
        }
        catch (e) {
            console.log('[Yahoo Finance] Erreur gestion popup:', e instanceof Error ? e.message : e);
        }
    }
    // Extraction rapide des news Yahoo avec timeout
    async extractYahooNewsFast(page) {
        const news = [];
        try {
            console.log('[Yahoo Finance] Extraction rapide des news (avec timeout)...');
            // Utiliser un timeout global pour l'extraction des news
            const newsPromise = this.extractYahooNewsWithTimeout(page);
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Yahoo news extraction timeout')), 8000));
            const result = await Promise.race([newsPromise, timeoutPromise]);
            console.log(`[Yahoo Finance] News extraites: ${result.length}`);
            return result;
        }
        catch (e) {
            console.log('[Yahoo Finance] Erreur extraction news (ignorée):', e instanceof Error ? e.message : e);
            return []; // Retourner un tableau vide en cas d'erreur
        }
    }
    // Méthode d'extraction avec timeout individuel
    async extractYahooNewsWithTimeout(page) {
        const news = [];
        try {
            // Approche directe avec les liens et timeout court
            const newsLinks = await Promise.race([
                page.locator('a[href*="/news/"], h3 a, .js-stream-content a').all(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Links timeout')), 3000)),
            ]);
            for (const link of newsLinks.slice(0, 6)) {
                try {
                    // Timeout individuel pour chaque lien
                    const title = await Promise.race([
                        link.textContent(),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Title timeout')), 500)),
                    ]);
                    const href = await Promise.race([
                        link.getAttribute('href'),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Href timeout')), 500)),
                    ]);
                    if (title && href && title.trim().length > 15) {
                        const cleanTitle = title.replace(/^\d+\s*(minutes?|hours?|days?)\s*ago/i, '').trim();
                        news.push({
                            title: cleanTitle,
                            url: href.startsWith('http') ? href : `https://finance.yahoo.com${href}`,
                            published_at: new Date().toISOString(),
                            source_date: new Date(),
                            relative_time: 'Recent',
                            author: '',
                        });
                    }
                }
                catch {
                    continue; // Ignorer les erreurs individuelles
                }
            }
        }
        catch (e) {
            console.log('[Yahoo Finance] Erreur extraction liens:', e instanceof Error ? e.message : e);
        }
        return news;
    }
    // Méthode d'extraction des news MarketWatch avec timeout
    async extractMarketWatchNewsWithTimeout(page) {
        const news = [];
        try {
            // Approche simplifiée avec timeout pour les articles
            const newsContainers = await Promise.race([
                page.locator('article.article, .article-item, .news-item, .stream-item').all(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Containers timeout')), 2000)),
            ]);
            for (const container of newsContainers.slice(0, 4)) {
                // Réduit à 4 pour le timeout
                try {
                    // Timeout individuel pour chaque container
                    const containerTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Container processing timeout')), 800));
                    const newsProcessing = this.processMarketWatchContainer(container);
                    const newsItem = await Promise.race([newsProcessing, containerTimeout]);
                    if (newsItem) {
                        news.push(newsItem);
                    }
                }
                catch {
                    continue; // Ignorer les erreurs individuelles
                }
            }
            // Approche alternative simple si pas assez de news
            if (news.length < 2) {
                try {
                    const fallbackLinks = await Promise.race([
                        page.locator('a[href*="/story/"]').all(),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Fallback timeout')), 1500)),
                    ]);
                    for (const element of fallbackLinks.slice(0, 3 - news.length)) {
                        try {
                            const title = await Promise.race([
                                element.textContent(),
                                new Promise((_, reject) => setTimeout(() => reject(new Error('Title timeout')), 300)),
                            ]);
                            const href = await Promise.race([
                                element.getAttribute('href'),
                                new Promise((_, reject) => setTimeout(() => reject(new Error('Href timeout')), 300)),
                            ]);
                            if (title && href && title.trim().length > 15) {
                                const cleanTitle = title.replace(/^\d{1,2}:\d{2}\s*(AM|PM)\s*/i, '').trim();
                                news.push({
                                    title: cleanTitle,
                                    url: href.startsWith('http') ? href : `https://www.marketwatch.com${href}`,
                                    published_at: new Date().toISOString(),
                                    source_date: new Date(),
                                    relative_time: 'Recent',
                                    author: '',
                                });
                            }
                        }
                        catch {
                            continue;
                        }
                    }
                }
                catch {
                    // Ignorer les erreurs de fallback
                }
            }
        }
        catch (e) {
            console.log('[MarketWatch] Erreur extraction containers:', e instanceof Error ? e.message : e);
        }
        return news;
    }
    // Méthode pour traiter un container MarketWatch individuellement
    async processMarketWatchContainer(container) {
        try {
            const titleElement = await container
                .locator('a[href*="/story/"] h3, .headline, .title, h2')
                .first();
            const linkElement = await container.locator('a[href*="/story/"]').first();
            if ((await titleElement.isVisible()) && (await linkElement.isVisible())) {
                const title = await titleElement.textContent();
                const href = await linkElement.getAttribute('href');
                if (title && href && title.trim().length > 15) {
                    const cleanTitle = title.replace(/^\d{1,2}:\d{2}\s*(AM|PM)\s*/i, '').trim();
                    return {
                        title: cleanTitle,
                        url: href.startsWith('http') ? href : `https://www.marketwatch.com${href}`,
                        published_at: new Date().toISOString(),
                        source_date: new Date(),
                        relative_time: 'Recent',
                        author: '',
                    };
                }
            }
        }
        catch {
            // Ignorer les erreurs de traitement individuel
        }
        return null;
    }
    async extractText(page, selector, customTimeout) {
        try {
            // Try to wait for the selector first with custom timeout
            try {
                await page.waitForSelector(selector, { timeout: customTimeout || 5000 });
            }
            catch (e) {
                // Ignore timeout, try to get content anyway
            }
            return (await page.locator(selector).first().textContent()) || '';
        }
        catch {
            return '';
        }
    }
    parseNumber(str) {
        if (!str)
            return null;
        let cleaned = str.trim();
        // Gérer le format européen (23,43) vs américain (1,234.56)
        if (cleaned.includes(',') && !cleaned.includes('.')) {
            cleaned = cleaned.replace(',', '.');
        }
        else if (cleaned.includes(',') && cleaned.includes('.')) {
            cleaned = cleaned.replace(/,/g, '');
        }
        // Nettoyer les caractères non numériques
        cleaned = cleaned.replace(/[^\d.-]/g, '');
        const val = parseFloat(cleaned);
        return isNaN(val) ? null : val;
    }
    parseRange(str) {
        if (!str)
            return [null, null];
        const parts = str.split('-').map(s => this.parseNumber(s));
        if (parts.length === 2)
            return [parts[0], parts[1]];
        return [null, null];
    }
    async saveToDatabase(pool, results) {
        const validResults = results.filter(r => r.value !== null);
        if (validResults.length > 0) {
            const client = await pool.connect();
            try {
                for (const result of validResults) {
                    await client.query(`
                        INSERT INTO market_data
                        (symbol, asset_type, price, change, change_percent, source, timestamp)
                        VALUES ($1, $2, $3, $4, $5, $6, NOW())
                    `, ['VIX', 'VIX', result.value, result.change_abs, result.change_pct, result.source]);
                    console.log(`[VixPlaywrightScraper] Saved data from ${result.source} to DB: ${result.value}`);
                }
            }
            catch (error) {
                console.error('[VixPlaywrightScraper] Error saving market data to database:', error);
            }
            finally {
                client.release();
            }
        }
        // Sauvegarder les news
        await this.saveNewsToDatabase(pool, results);
    }
    async saveNewsToDatabase(pool, results) {
        const allNews = results.flatMap(r => r.news_headlines.map(n => ({ ...n, source: r.source })));
        if (allNews.length === 0)
            return;
        const client = await pool.connect();
        try {
            let savedCount = 0;
            for (const news of allNews) {
                const existing = await client.query('SELECT id FROM news_items WHERE url = $1', [news.url]);
                if (existing.rows.length === 0) {
                    await client.query(`
                        INSERT INTO news_items
                        (title, url, source, published_at, scraped_at, processing_status, market_hours)
                        VALUES ($1, $2, $3, NOW(), NOW(), 'raw', 'market')
                    `, [news.title, news.url, news.source]);
                    savedCount++;
                }
            }
            if (savedCount > 0)
                console.log(`[VixPlaywrightScraper] Saved ${savedCount} new VIX news items to DB`);
        }
        catch (error) {
            console.error('[VixPlaywrightScraper] Error saving news to database:', error);
        }
        finally {
            client.release();
        }
    }
    parseRelativeDate(relativeText) {
        const now = new Date();
        const text = relativeText.toLowerCase().trim();
        // Patterns pour les temps relatifs
        const patterns = [
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
        for (const pattern of patterns) {
            const match = text.match(pattern.regex);
            if (match) {
                const value = pattern.value !== undefined ? pattern.value : parseInt(match[1]);
                if (pattern.multiplier === 0)
                    return now; // "today", "just now"
                return new Date(now.getTime() - value * pattern.multiplier);
            }
        }
        // Fallback: retourner maintenant
        return now;
    }
    // ===== NOUVELLES FONCTIONNALITÉS VIX/VVIX ANALYSE INTELLIGENTE =====
    async scrapeVVIX() {
        console.log('[VVIX] Début du scraping VVIX (volatilité de la volatilité)...');
        const page = await this.createStealthPage();
        try {
            // VVIX est moins disponible, essayons plusieurs sources
            const sources = [
                { url: 'https://finance.yahoo.com/quote/%5EVVIX', name: 'Yahoo VVIX' },
                { url: 'https://www.marketwatch.com/investing/future/vvix', name: 'MarketWatch VVIX' },
                {
                    url: 'https://www.investing.com/indices/cboe-volatility-index-vvix',
                    name: 'Investing VVIX',
                },
            ];
            for (const source of sources) {
                try {
                    console.log(`[VVIX] Tentative source: ${source.name}`);
                    await page.goto(source.url, {
                        waitUntil: 'domcontentloaded',
                        timeout: 15000,
                    });
                    await this.humanDelay(page, 500, 1000);
                    // Gérer consentement Yahoo si nécessaire
                    if (source.url.includes('yahoo') && page.url().includes('consent')) {
                        const agreeButton = page.locator('button[name="agree"]').first();
                        if (await agreeButton.isVisible({ timeout: 2000 })) {
                            await agreeButton.click();
                            await page.waitForTimeout(1000);
                            await page.goto(source.url, { waitUntil: 'domcontentloaded', timeout: 10000 });
                        }
                    }
                    // Extraire la valeur VVIX avec différents sélecteurs
                    const vvixValue = await this.extractVVIXValue(page);
                    if (vvixValue) {
                        console.log(`[VVIX] ✅ Succès depuis ${source.name}: ${vvixValue}`);
                        return {
                            source: source.name,
                            value: vvixValue,
                            change_abs: null,
                            change_pct: null,
                            last_update: new Date().toISOString(),
                        };
                    }
                }
                catch (e) {
                    console.log(`[VVIX] ❌ Échec ${source.name}:`, e instanceof Error ? e.message : e);
                    continue;
                }
            }
            console.log("[VVIX] ❌ Aucune source n'a pu fournir de données VVIX");
            return {
                source: 'VVIX_Fallback',
                value: null,
                change_abs: null,
                change_pct: null,
                last_update: new Date().toISOString(),
                error: 'VVIX data unavailable from all sources',
            };
        }
        catch (error) {
            console.log('[VVIX] Erreur critique:', error instanceof Error ? error.message : error);
            return {
                source: 'VVIX_Error',
                value: null,
                change_abs: null,
                change_pct: null,
                last_update: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown VVIX error',
            };
        }
        finally {
            const context = page.context();
            await page.close();
            if (context)
                await context.close();
        }
    }
    async extractVVIXValue(page) {
        const selectors = [
            // Sélecteurs Yahoo Finance
            'fin-streamer[data-field="regularMarketPrice"][data-symbol="^VVIX"]',
            '[data-testid="qsp-price"]',
            // Sélecteurs génériques
            '[data-test="instrument-price-last"]',
            '.instrument-price_last',
            // Sélecteurs Investing.com
            '[data-test="instrument-price-last"]',
            '.text-5xl',
            '.font-bold',
        ];
        for (const selector of selectors) {
            try {
                const text = await this.extractText(page, selector, 2000);
                const value = this.parseNumber(text);
                if (value && value > 50 && value < 200) {
                    // VVIX typiquement entre 50-200
                    return value;
                }
            }
            catch {
                continue;
            }
        }
        return null;
    }
    // Méthode principale d'analyse intelligente VIX/VVIX
    generateVixInterpretation(vixValue, vvixValue) {
        const alerts = [];
        // 1. Analyse du niveau VIX
        let level;
        let sentiment;
        let interpretation;
        if (vixValue <= 12) {
            level = 'VERY_LOW';
            sentiment = 'BULLISH_CALM';
            interpretation = 'Marché extrêmement calme et confiant. Faible volatilité attendue.';
        }
        else if (vixValue <= 15) {
            level = 'LOW';
            sentiment = 'BULLISH_CALM';
            interpretation = 'Marché confiant avec faible volatilité. Climat de confiance établi.';
        }
        else if (vixValue <= 20) {
            level = 'NORMAL';
            sentiment = 'NEUTRAL';
            interpretation = 'Marché dans la normale. Volatilité modérée attendue.';
        }
        else if (vixValue <= 25) {
            level = 'NERVOUS';
            sentiment = 'BEARISH_NERVOUS';
            interpretation = 'Marché nerveux mais peut être haussier. Volatilité augmentée.';
        }
        else if (vixValue <= 35) {
            level = 'HIGH';
            sentiment = 'BEARISH_NERVOUS';
            interpretation = 'Marché très nerveux. Forte volatilité et crainte.';
        }
        else {
            level = 'EXTREME';
            sentiment = 'CRITICAL';
            interpretation = 'Marché en panique. Volatilité extrême et risque élevé.';
        }
        // 2. Calculs de volatilité attendue
        const sqrt252 = Math.sqrt(252); // ~15.87 pour annualisation
        const sqrt52 = Math.sqrt(52); // ~7.21 pour mensuelle
        const sqrt12 = Math.sqrt(12); // ~3.46 pour hebdomadaire
        const expected_monthly_volatility = vixValue / sqrt12;
        const expected_weekly_volatility = vixValue / sqrt52;
        const expected_daily_move_range = (vixValue / sqrt252) * 2; // 2 écart-types
        // 3. Alertes VIX
        if (vixValue >= 30) {
            alerts.push({
                type: 'CRITICAL',
                message: `VIX extrêmement élevé (${vixValue.toFixed(1)}) - Marché en état de panique`,
                threshold: 30,
                current_value: vixValue,
                indicator: 'VIX',
            });
        }
        else if (vixValue >= 25) {
            alerts.push({
                type: 'WARNING',
                message: `VIX élevé (${vixValue.toFixed(1)}) - Marché très nerveux`,
                threshold: 25,
                current_value: vixValue,
                indicator: 'VIX',
            });
        }
        else if (vixValue <= 12) {
            alerts.push({
                type: 'INFO',
                message: `VIX très bas (${vixValue.toFixed(1)}) - Marché extrêmement calme`,
                threshold: 12,
                current_value: vixValue,
                indicator: 'VIX',
            });
        }
        // 4. Analyse VVIX si disponible
        if (vvixValue) {
            const ratio = vvixValue / vixValue;
            // Alertes VVIX
            if (vvixValue >= 130) {
                alerts.push({
                    type: 'CRITICAL',
                    message: `VVIX critique (${vvixValue.toFixed(1)}) - Danger imminent de forte volatilité`,
                    threshold: 130,
                    current_value: vvixValue,
                    indicator: 'VVIX',
                });
            }
            else if (vvixValue >= 110) {
                alerts.push({
                    type: 'WARNING',
                    message: `VVIX élevé (${vvixValue.toFixed(1)}) - Volatilité de la volatilité importante`,
                    threshold: 110,
                    current_value: vvixValue,
                    indicator: 'VVIX',
                });
            }
            else if (vvixValue <= 85) {
                alerts.push({
                    type: 'INFO',
                    message: `VVIX faible (${vvixValue.toFixed(1)}) - Volatilité stable et prévisible`,
                    threshold: 85,
                    current_value: vvixValue,
                    indicator: 'VVIX',
                });
            }
            // Analyse combinée VIX/VVIX
            if (vixValue > 20 && vvixValue > 120) {
                alerts.push({
                    type: 'CRITICAL',
                    message: `Signal baissier critique: VIX=${vixValue.toFixed(1)} avec VVIX=${vvixValue.toFixed(1)}`,
                    threshold: 120,
                    current_value: vvixValue,
                    indicator: 'RATIO',
                });
                sentiment = 'CRITICAL';
                interpretation += ' SIGNAL BAISSIER CRITIQUE détecté par VVIX élevé.';
            }
            else if (vixValue > 20 && vvixValue < 100) {
                alerts.push({
                    type: 'WARNING',
                    message: `Incohérence VIX/VVIX: VIX=${vixValue.toFixed(1)} mais VVIX=${vvixValue.toFixed(1)} faible`,
                    threshold: 100,
                    current_value: vvixValue,
                    indicator: 'RATIO',
                });
                interpretation += ' Panique probablement non crédible - rebond possible.';
            }
            else if (vixValue <= 17 && vvixValue >= 110) {
                alerts.push({
                    type: 'WARNING',
                    message: `Volatilité imminente: VIX bas (${vixValue.toFixed(1)}) mais VVIX élevé (${vvixValue.toFixed(1)})`,
                    threshold: 110,
                    current_value: vvixValue,
                    indicator: 'RATIO',
                });
                interpretation += ' Attention: mouvement important attendu dans 24-72h.';
            }
            // Ratio VVIX/VIX
            if (ratio > 5.5) {
                alerts.push({
                    type: 'WARNING',
                    message: `Ratio VVIX/VIX élevé (${ratio.toFixed(1)}) - Volatilité excessivement volatile`,
                    threshold: 5.5,
                    current_value: ratio,
                    indicator: 'RATIO',
                });
            }
        }
        // 5. Génération du signal de marché
        const signal = this.generateMarketSignal(level, sentiment, vixValue, vvixValue);
        return {
            level,
            sentiment,
            interpretation,
            expected_monthly_volatility: Math.round(expected_monthly_volatility * 100) / 100,
            expected_weekly_volatility: Math.round(expected_weekly_volatility * 100) / 100,
            expected_daily_move_range: Math.round(expected_daily_move_range * 100) / 100,
            alerts,
            market_signal: signal.signal,
            signal_strength: signal.strength,
        };
    }
    generateMarketSignal(level, sentiment, vixValue, vvixValue) {
        let signal;
        let strength;
        switch (sentiment) {
            case 'BULLISH_CALM':
                signal = level === 'VERY_LOW' ? 'CAUTION' : 'STRONG_BUY';
                strength = level === 'VERY_LOW' ? 60 : 85;
                break;
            case 'NEUTRAL':
                signal = 'HOLD';
                strength = 50;
                break;
            case 'BEARISH_NERVOUS':
                if (vvixValue && vvixValue > 110) {
                    signal = 'STRONG_SELL';
                    strength = 90;
                }
                else {
                    signal = 'SELL';
                    strength = 70;
                }
                break;
            case 'CRITICAL':
                signal = 'STRONG_SELL';
                strength = 95;
                break;
            default:
                signal = 'HOLD';
                strength = 50;
        }
        // Ajustements fins basés sur VVIX
        if (vvixValue) {
            if (vvixValue > 130) {
                strength = Math.min(95, strength + 10); // Danger extrême
            }
            else if (vvixValue < 85) {
                strength = Math.max(40, strength - 10); // Calme excessif
            }
        }
        return { signal, strength };
    }
    // Méthode utilitaire pour formater les résultats
    formatInterpretationForDisplay(interpretation) {
        const lines = [];
        lines.push(`📊 NIVEAU VIX: ${interpretation.level}`);
        lines.push(`💭 Sentiment: ${interpretation.sentiment.replace('_', ' ')}`);
        lines.push(`📝 Analyse: ${interpretation.interpretation}`);
        lines.push('');
        lines.push('📈 VOLATILITÉ ATTENDUE:');
        lines.push(`   • Mensuelle: ±${interpretation.expected_monthly_volatility}%`);
        lines.push(`   • Hebdomadaire: ±${interpretation.expected_weekly_volatility}%`);
        lines.push(`   • Journalière: ±${interpretation.expected_daily_move_range}%`);
        lines.push('');
        lines.push(`🎯 Signal Marché: ${interpretation.market_signal.replace('_', ' ')} (force: ${interpretation.signal_strength}/100)`);
        if (interpretation.alerts.length > 0) {
            lines.push('');
            lines.push('🚨 ALERTES:');
            interpretation.alerts.forEach(alert => {
                const emoji = alert.type === 'CRITICAL' ? '🔴' : alert.type === 'WARNING' ? '🟡' : '🔵';
                lines.push(`   ${emoji} ${alert.message}`);
            });
        }
        return lines;
    }
}
//# sourceMappingURL=VixPlaywrightScraper.js.map