import { chromium, Browser, Page } from 'playwright';
import { Pool } from 'pg';

export interface VixNewsItem {
  title: string;
  url: string;
  published_at?: string;
  source_date?: Date; // Date brute extraite
  relative_time?: string; // "2 hours ago", "1 day ago", etc.
  author?: string;
}

export interface VixScrapeResult {
  source: string;
  value: number | null;
  change_abs: number | null;
  change_pct: number | null;
  previous_close: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  last_update: string | null;
  news_headlines: VixNewsItem[];
  error?: string;
}

export class VixPlaywrightScraper {
  private browser: Browser | null = null;
  private cache: Map<string, { data: VixScrapeResult; timestamp: number; ttl: number }>;
  private metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    sourceMetrics: Map<string, { success: boolean; responseTime: number; error?: string }>;
    cacheHits: number;
  };

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

  async init(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({
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
      });
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private async createStealthPage(): Promise<Page> {
    if (!this.browser) throw new Error('Browser not initialized');

    const context = await this.browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Upgrade-Insecure-Requests': '1',
        Referer: 'https://www.google.com/',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      },
    });

    const page = await context.newPage();

    // Simuler comportement humain
    await page.addInitScript(() => {
      // @ts-ignore
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      // @ts-ignore
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      // @ts-ignore
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
      // @ts-ignore
      (window as any).chrome = { runtime: {} };
      // @ts-ignore
      Object.defineProperty(navigator, 'permissions', {
        get: () => ({
          query: () => Promise.resolve({ state: 'granted' }),
        }),
      });
    });

    return page;
  }

  private async humanDelay(page: Page, min = 50, max = 200): Promise<void> {
    const delay = Math.random() * (max - min) + min;
    await page.waitForTimeout(delay);
  }

  private getCacheKey(source: string): string {
    return `vix_${source}_${new Date().toDateString()}`;
  }

  private isCacheValid(cacheEntry: { timestamp: number; ttl: number }): boolean {
    return Date.now() - cacheEntry.timestamp < cacheEntry.ttl;
  }

  private async getCachedData(source: string): Promise<VixScrapeResult | null> {
    const cacheKey = this.getCacheKey(source);
    const cached = this.cache.get(cacheKey);

    if (cached && this.isCacheValid(cached)) {
      this.metrics.cacheHits++;
      console.log(`💾 Cache HIT pour ${source} (${this.metrics.cacheHits} hits total)`);
      return cached.data;
    }

    return null;
  }

  private setCachedData(source: string, data: VixScrapeResult, ttl: number = 5 * 60 * 1000): void {
    const cacheKey = this.getCacheKey(source);
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl,
    });
    console.log(`💾 Cache SET pour ${source} (TTL: ${ttl / 1000}s)`);
  }

  async scrapeWithTimeout(
    source: string,
    scrapeFn: () => Promise<VixScrapeResult>,
    timeout: number = 10000
  ): Promise<VixScrapeResult> {
    // Vérifier le cache d'abord
    const cached = await this.getCachedData(source);
    if (cached) {
      return cached;
    }

    const startTime = Date.now();

    try {
      const result = await Promise.race([
        scrapeFn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout: ${source} scraping timeout`)), timeout)
        ),
      ]);

      const responseTime = Date.now() - startTime;

      if (result && typeof result === 'object' && result.value !== null) {
        // Mettre en cache si succès (5 minutes TTL)
        this.setCachedData(source, result, 5 * 60 * 1000); // 5 minutes
      }

      return result;
    } catch (error) {
      console.warn(`⚠️ Erreur scraping ${source}:`, error instanceof Error ? error.message : error);
      throw error;
    }
  }

  async scrapeAll(): Promise<VixScrapeResult[]> {
    const startTime = Date.now();
    await this.init();

    console.log('🚀 Démarrage scraping VIX (3 sources en parallèle)...');

    // Exécution parallèle pour la vitesse
    const primaryResults = await Promise.allSettled([
      this.scrapeWithTimeout('MarketWatch', () => this.scrapeMarketWatch(), 35000),
      this.scrapeWithTimeout('Investing.com', () => this.scrapeInvesting(), 35000),
      this.scrapeWithTimeout('Yahoo Finance', () => this.scrapeYahoo(), 35000),
    ]);

    await this.close();

    const totalTime = Date.now() - startTime;
    this.updateAverageResponseTime(totalTime);

    console.log(
      `📊 Métriques scraping - Total: ${totalTime}ms, Cache hits: ${this.metrics.cacheHits}/${this.metrics.totalRequests}`
    );
    console.log(
      `   MarketWatch: ${this.metrics.sourceMetrics.get('MarketWatch')?.success ? '✅' : '❌'}, Investing.com: ${this.metrics.sourceMetrics.get('Investing.com')?.success ? '✅' : '❌'}`
    );

    const finalResults = primaryResults.map((result, index) => {
      const sources = ['MarketWatch', 'Investing.com', 'Yahoo Finance'];
      this.metrics.totalRequests++;

      if (result.status === 'fulfilled') {
        if (result.value.value !== null) {
          this.metrics.successfulRequests++;
        } else {
          this.metrics.failedRequests++;
        }
        return result.value;
      } else {
        this.metrics.failedRequests++;
        this.metrics.sourceMetrics.set(sources[index], {
          success: false,
          responseTime: 0,
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
        });

        return {
          source: sources[index],
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

  private async scrapeWithMetrics(
    sourceName: string,
    scrapeFn: () => Promise<VixScrapeResult>
  ): Promise<VixScrapeResult> {
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

      console.log(
        `[PARALLEL] ${sourceName} - Terminé en ${responseTime}ms - ${result.value !== null ? '✅' : '❌'}`
      );
      return result;
    } catch (error: unknown) {
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

  private updateAverageResponseTime(totalTime: number): void {
    const successfulMetrics = Array.from(this.metrics.sourceMetrics.values()).filter(
      metric => metric.success
    );

    if (successfulMetrics.length > 0) {
      const avgTime =
        successfulMetrics.reduce((sum, metric) => sum + metric.responseTime, 0) /
        successfulMetrics.length;
      this.metrics.averageResponseTime = Math.round(avgTime);
    }
  }

  private logMetrics(totalTime: number): void {
    console.log('\n📊 MÉTRIQUES DE SCRAPING:');
    console.log('='.repeat(50));
    console.log(`⏱️  Temps total: ${totalTime}ms`);
    console.log(
      `📈 Taux de réussite: ${((this.metrics.successfulRequests / this.metrics.totalRequests) * 100).toFixed(1)}%`
    );
    console.log(`✅ Succès: ${this.metrics.successfulRequests}/${this.metrics.totalRequests}`);
    console.log(`⚡ Temps moyen: ${this.metrics.averageResponseTime}ms`);

    console.log('\n📋 DÉTAIL PAR SOURCE:');
    this.metrics.sourceMetrics.forEach((metric, source) => {
      const status = metric.success ? '✅' : '❌';
      console.log(
        `   ${status} ${source}: ${metric.responseTime}ms ${metric.error ? `- ${metric.error}` : ''}`
      );
    });
    console.log('');
  }

  getMetrics() {
    return {
      ...this.metrics,
      sourceMetrics: Object.fromEntries(this.metrics.sourceMetrics),
    };
  }

  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      sourceMetrics: new Map(),
      cacheHits: 0,
    };
  }

  async scrapeMarketWatch(): Promise<VixScrapeResult> {
    const page = await this.createStealthPage();

    try {
      console.log('[MarketWatch] Navigating to VIX page...');
      await page.goto('https://www.marketwatch.com/investing/index/vix', {
        waitUntil: 'commit',
        timeout: 25000,
      });

      await this.humanDelay(page, 2000, 4000);

      // Strategy 1: Try to extract from meta tag (most reliable)
      try {
        const metaContent = await page.getAttribute(
          'meta[name="global-translation-variables"]',
          'content'
        );
        if (metaContent) {
          // The content is a JSON string, sometimes wrapped in quotes that need cleaning?
          // Usually it's just a JSON string.
          // It might be html encoded.
          const cleanContent = metaContent.replace(/&quot;/g, '"');
          const data = JSON.parse(cleanContent);

          if (data && data.LAST_PRICE) {
            console.log(`[Investing.com] Found data in meta tag: ${data.LAST_PRICE}`);
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
              news_headlines: [], // News extraction remains separate
            };
          }
        }
      } catch (e) {
        console.log('[Investing.com] Meta tag extraction failed, falling back to DOM selectors');
      }

      // Strategy 2: DOM Selectors (Fallback)
      // Attendre explicitement le chargement du prix
      try {
        await page.waitForSelector('.intraday__price .value, [data-test="instrument-price-last"]', {
          timeout: 10000,
        });
      } catch {
        // Ignore timeout
      }

      const value = await this.extractText(
        page,
        'bg-quote.value, .intraday__price .value, [data-test="instrument-price-last"]'
      );
      const changeAbs = await this.extractText(
        page,
        '.intraday__price .change--point .value, [data-test="instrument-price-change"]'
      );
      const changePct = await this.extractText(
        page,
        '.intraday__price .change--percent .value, [data-test="instrument-price-change-percent"]'
      );

      const prevClose = await this.extractText(
        page,
        '.intraday__close .value, [data-test="prev-close-value"]'
      );
      const open = await this.extractText(page, '.intraday__open .value, [data-test="open-value"]');

      const rangeText = await this.extractText(
        page,
        '.range__content, [data-test="days-range-value"]'
      );
      const [low, high] = this.parseRange(rangeText);

      // Extraire les news MarketWatch avec dates de parution
      const news: VixNewsItem[] = [];
      try {
        console.log('[MarketWatch] Recherche des news avec dates...');

        // Sélecteurs pour les articles avec métadonnées
        const newsContainers = await page
          .locator('article.article, .article-item, .news-item, .stream-item')
          .all();

        for (const container of newsContainers.slice(0, 8)) {
          try {
            // Extraire le titre et le lien
            const titleElement = await container
              .locator('a[href*="/story/"] h3, .headline, .title, h2')
              .first();
            const linkElement = await container.locator('a[href*="/story/"]').first();

            if ((await titleElement.isVisible()) && (await linkElement.isVisible())) {
              const title = await titleElement.textContent();
              const href = await linkElement.getAttribute('href');

              if (title && href && title.trim().length > 15) {
                // Nettoyer le titre
                const cleanTitle = title.replace(/^\d{1,2}:\d{2}\s*(AM|PM)\s*/i, '').trim();

                // Extraire la date de parution
                let publishedAt = new Date().toISOString();
                let relativeTime = '';
                let author = '';

                try {
                  // Essayer de trouver la date dans le conteneur
                  const dateSelectors = [
                    '.timestamp',
                    '.date',
                    '.published',
                    'time[datetime]',
                    '.article-timestamp',
                    '[data-testid="timestamp"]',
                    'span.timestamp',
                  ];

                  for (const dateSelector of dateSelectors) {
                    try {
                      const dateElement = await container.locator(dateSelector).first();
                      if (await dateElement.isVisible()) {
                        const dateText = await dateElement.textContent();
                        const datetime = await dateElement.getAttribute('datetime');

                        if (datetime) {
                          publishedAt = new Date(datetime).toISOString();
                        } else if (dateText) {
                          // Parser les formats de date relatifs
                          const parsedDate = this.parseRelativeDate(dateText);
                          if (parsedDate) {
                            publishedAt = parsedDate.toISOString();
                            relativeTime = dateText.trim();
                          }
                        }
                        break;
                      }
                    } catch {
                      continue;
                    }
                  }

                  // Essayer de trouver l'auteur
                  const authorSelectors = ['.author', '.byline', '.reporter', 'span.author'];

                  for (const authorSelector of authorSelectors) {
                    try {
                      const authorElement = await container.locator(authorSelector).first();
                      if (await authorElement.isVisible()) {
                        author = ((await authorElement.textContent()) || '').trim();
                        if (author && !author.includes('MarketWatch')) {
                          break;
                        }
                      }
                    } catch {
                      continue;
                    }
                  }

                  // Si pas de date trouvée dans le conteneur, essayer dans le contenu HTML
                  if (publishedAt === new Date().toISOString()) {
                    const htmlContent = await container.innerHTML();
                    const dateMatches =
                      htmlContent.match(/\b\d{1,2}:\d{2}\s*(AM|PM)\s*ET\b/gi) ||
                      htmlContent.match(/\b\d{1,2}:\d{2}\s*[AP]M\b/gi) ||
                      htmlContent.match(/\b\d{4}-\d{1,2}-\d{1,2}\b/g) ||
                      htmlContent.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/g);

                    if (dateMatches) {
                      const dateText = dateMatches[0];
                      const parsedDate = this.parseRelativeDate(dateText);
                      if (parsedDate) {
                        publishedAt = parsedDate.toISOString();
                        relativeTime = dateText.trim();
                      }
                    }
                  }
                } catch (e) {
                  console.log(
                    '[MarketWatch] Erreur extraction date/news:',
                    e instanceof Error ? e.message : e
                  );
                }

                news.push({
                  title: cleanTitle,
                  url: href.startsWith('http') ? href : `https://www.marketwatch.com${href}`,
                  published_at: publishedAt,
                  source_date: new Date(publishedAt),
                  relative_time: relativeTime,
                  author: author || '',
                });
              }
            }
          } catch {
            continue;
          }
        }

        // Si toujours pas assez de news, essayer l'approche plus simple
        if (news.length < 5) {
          console.log('[MarketWatch] Approche alternative pour les news...');
          const fallbackElements = await page.locator('a[href*="/story/"]').all();

          for (const element of fallbackElements.slice(0, 10 - news.length)) {
            try {
              const title = await element.textContent();
              const href = await element.getAttribute('href');

              if (title && href && title.trim().length > 15) {
                // Nettoyer le titre
                const cleanTitle = title.replace(/^\d{1,2}:\d{2}\s*(AM|PM)\s*/i, '').trim();

                news.push({
                  title: cleanTitle,
                  url: href.startsWith('http') ? href : `https://www.marketwatch.com${href}`,
                  published_at: new Date().toISOString(),
                  source_date: new Date(),
                  relative_time: 'Recent',
                });
              }
            } catch {
              continue;
            }
          }
        }

        // Trier les news par date (plus récentes en premier)
        news.sort((a, b) => {
          const dateA = a.source_date ? a.source_date.getTime() : 0;
          const dateB = b.source_date ? b.source_date.getTime() : 0;
          return dateB - dateA; // Plus récent d'abord
        });

        console.log(`[MarketWatch] News trouvées: ${news.length}`);
      } catch (e) {
        console.log('[MarketWatch] Erreur extraction news:', e instanceof Error ? e.message : e);
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
    } catch (error: unknown) {
      throw new Error(
        `MarketWatch scrape failed: ${error instanceof Error ? error.message : error}`
      );
    } finally {
      await page.close();
    }
  }

  async scrapeInvesting(): Promise<VixScrapeResult> {
    const page = await this.createStealthPage();

    try {
      console.log('[Investing.com] Navigating to VIX page...');
      await page.goto('https://www.investing.com/indices/volatility-s-p-500', {
        waitUntil: 'commit',
        timeout: 25000,
      });

      await this.humanDelay(page, 2000, 4000);

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
          if (await page.locator(selector).first().isVisible({ timeout: 2000 })) {
            await page.locator(selector).first().click();
            await page.waitForTimeout(1000);
            break;
          }
        }
      } catch (e) {
        // Pas de bouton cookies, c'est normal
      }

      // Strategy 1: Try to extract from meta tag (most reliable)
      try {
        const metaContent = await page.getAttribute(
          'meta[name="global-translation-variables"]',
          'content'
        );
        if (metaContent) {
          // The content is a JSON string, sometimes wrapped in quotes that need cleaning?
          // Usually it's just a JSON string.
          // It might be html encoded.
          const cleanContent = metaContent.replace(/&quot;/g, '"');
          const data = JSON.parse(cleanContent);

          if (data && data.LAST_PRICE) {
            console.log(`[Investing.com] Found data in meta tag: ${data.LAST_PRICE}`);
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
              news_headlines: [], // News extraction remains separate
            };
          }
        }
      } catch (e) {
        console.log('[Investing.com] Meta tag extraction failed, falling back to DOM selectors');
      }

      // Attendre les données de prix avec timeout plus court
      const value = await this.extractText(page, '[data-test="instrument-price-last"]');
      const changeAbs = await this.extractText(page, '[data-test="instrument-price-change"]');
      const changePct = await this.extractText(
        page,
        '[data-test="instrument-price-change-percent"]'
      );

      const prevClose = await this.extractText(page, '[data-test="prev-close-value"]');
      const open = await this.extractText(page, '[data-test="open-value"]');
      const dayRange = await this.extractText(page, '[data-test="days-range-value"]');
      const [low, high] = this.parseRange(dayRange);

      // Extraire les news Investing.com avec capture des dates
      const news: VixNewsItem[] = [];
      try {
        console.log('[Investing.com] Recherche des news...');

        // Approche améliorée avec capture des dates et métadonnées
        const newsContainersSelectors = [
          'article[data-test="article-item"]',
          'div.articleItem',
          'div.textDiv',
          'div[data-test="news-article"]',
          'div.newsItem',
          'li.article-item',
          'div.newsStory',
        ];

        let newsFound = false;
        for (const containerSelector of newsContainersSelectors) {
          try {
            const newsContainers = await page.locator(containerSelector).all();

            for (const container of newsContainers.slice(0, 15)) {
              try {
                // Extraire le titre et le lien
                const titleElement = await container.locator('a').first();
                const title = await titleElement.textContent();
                const href = await titleElement.getAttribute('href');

                if (!title || !href || title.trim().length < 15) continue;

                // Nettoyer le titre
                const cleanTitle = title
                  .replace(/\d+\s*(minutes?|hours?|days?)\s*ago/gi, '')
                  .trim();

                // Extraire la date de parution
                let publishedAt = new Date().toISOString();
                let relativeTime = '';
                const author = '';

                // Chercher les éléments de date dans le conteneur
                const dateSelectors = [
                  'time',
                  '.date',
                  '.timestamp',
                  '.published',
                  '.timeAgo',
                  '.newsDate',
                  '.article-date',
                  'span.date',
                  '[data-testid="timestamp"]',
                  '.meta-time',
                ];

                for (const dateSelector of dateSelectors) {
                  try {
                    const dateElement = await container.locator(dateSelector).first();
                    if (await dateElement.isVisible({ timeout: 1000 })) {
                      const dateText = (await dateElement.textContent()) || '';
                      if (dateText.trim()) {
                        relativeTime = dateText.trim();
                        publishedAt = this.parseRelativeDate(dateText).toISOString();
                        break;
                      }
                    }
                  } catch {
                    continue;
                  }
                }

                news.push({
                  title: cleanTitle,
                  url: href.startsWith('http') ? href : `https://www.investing.com${href}`,
                  published_at: publishedAt,
                  source_date: new Date(publishedAt),
                  relative_time: relativeTime,
                  author: author || '',
                });

                newsFound = true;
                if (news.length >= 10) break;
              } catch {
                continue;
              }
            }
            if (newsFound && news.length >= 8) break;
          } catch {
            continue;
          }
        }

        console.log(`[Investing.com] Total news trouvées: ${news.length}`);
      } catch (e) {
        console.log('[Investing.com] Erreur extraction news:', e instanceof Error ? e.message : e);
      }

      // Vérification des données manquantes
      const hasValue = value !== null && value !== '';
      const hasRange = dayRange !== null && dayRange !== '';

      return {
        source: 'Investing.com',
        value: this.parseNumber(value),
        change_abs: hasValue ? this.parseNumber(changeAbs) : null,
        change_pct: hasValue ? this.parseNumber(changePct?.replace(/[()%]/g, '')) : null,
        previous_close: this.parseNumber(prevClose),
        open: this.parseNumber(open),
        high: hasRange ? high : null,
        low: hasRange ? low : null,
        last_update: new Date().toISOString(),
        news_headlines: news,
      };
    } catch (error: unknown) {
      throw new Error(
        `Investing.com scrape failed: ${error instanceof Error ? error.message : error}`
      );
    } finally {
      await page.close();
    }
  }

  async scrapeYahoo(): Promise<VixScrapeResult> {
    const page = await this.createStealthPage();

    try {
      console.log('[Yahoo Finance] Navigating to VIX page...');
      await page.goto('https://finance.yahoo.com/quote/%5EVIX', {
        waitUntil: 'commit',
        timeout: 25000,
      });

      await this.humanDelay(page, 2000, 4000);

      // Handle consent popup if any (Yahoo redirects to consent.yahoo.com)
      if (page.url().includes('consent.yahoo.com') || (await page.$('button[name="agree"]'))) {
        console.log('[Yahoo Finance] Consent page detected');
        try {
          const agreeButton = page.locator('button[name="agree"], button.accept-all').first();
          if (await agreeButton.isVisible({ timeout: 5000 })) {
            await agreeButton.click();
            console.log('[Yahoo Finance] Clicked "agree"');
            await page.waitForNavigation({ timeout: 20000, waitUntil: 'domcontentloaded' });
          }
        } catch (e) {
          console.log('[Yahoo Finance] Error handling consent redirect:', e);
        }
      }

      // Handle in-page consent popup
      try {
        const consentSelectors = [
          'button[name="agree"]',
          '.accept-all',
          'button.btn.primary',
          'button[value="agree"]',
          'form[action*="consent"] button[type="submit"]',
          'button:has-text("Accept all")',
          'button:has-text("Tout accepter")',
        ];

        for (const selector of consentSelectors) {
          const button = await page.locator(selector).first();
          if (await button.isVisible({ timeout: 3000 })) {
            console.log(`[Yahoo Finance] Clicking consent button: ${selector}`);
            await button.click();
            await page.waitForTimeout(2000); // Wait for navigation/reload
            break;
          }
        }
      } catch (e) {
        // Ignore
      }

      // Wait for price with specific symbol to avoid wrong data
      const value = await this.extractText(
        page,
        'fin-streamer[data-field="regularMarketPrice"][data-symbol="^VIX"], [data-testid="qsp-price"]'
      );
      const changeAbs = await this.extractText(
        page,
        'fin-streamer[data-field="regularMarketChange"], [data-testid="qsp-price-change"]'
      );
      const changePct = await this.extractText(
        page,
        'fin-streamer[data-field="regularMarketChangePercent"], [data-testid="qsp-price-change-percent"]'
      );

      const prevClose = await this.extractText(page, '[data-test="PREV_CLOSE-value"]');
      const open = await this.extractText(page, '[data-test="OPEN-value"]');
      const range = await this.extractText(page, '[data-test="DAYS_RANGE-value"]');
      const [low, high] = this.parseRange(range);

      // Extract news
      const news: VixNewsItem[] = [];
      try {
        const newsElements = await page.locator('li.js-stream-content, .js-stream-content').all();
        for (const element of newsElements.slice(0, 5)) {
          const titleEl = await element.locator('h3').first();
          const linkEl = await element.locator('a').first();

          if (await titleEl.isVisible()) {
            const title = await titleEl.textContent();
            const href = await linkEl.getAttribute('href');
            if (title && href) {
              news.push({
                title: title.trim(),
                url: href.startsWith('http') ? href : `https://finance.yahoo.com${href}`,
                published_at: new Date().toISOString(),
                source_date: new Date(),
                relative_time: 'Recent',
              });
            }
          }
        }
      } catch {
        console.log('[Yahoo Finance] Error extracting news');
      }

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
    } catch (error: unknown) {
      throw new Error(
        `Yahoo Finance scrape failed: ${error instanceof Error ? error.message : error}`
      );
    } finally {
      await page.close();
    }
  }

  private async extractText(page: Page, selector: string): Promise<string> {
    try {
      // Try to wait for the selector first
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
      } catch (e) {
        // Ignore timeout, try to get content anyway
      }
      return (await page.locator(selector).first().textContent()) || '';
    } catch {
      return '';
    }
  }

  private parseNumber(str: string | undefined | null): number | null {
    if (!str) return null;
    let cleaned = str.trim();

    // Gérer le format européen (23,43) vs américain (1,234.56)
    if (cleaned.includes(',') && !cleaned.includes('.')) {
      cleaned = cleaned.replace(',', '.');
    } else if (cleaned.includes(',') && cleaned.includes('.')) {
      cleaned = cleaned.replace(/,/g, '');
    }

    // Nettoyer les caractères non numériques
    cleaned = cleaned.replace(/[^\d.-]/g, '');

    const val = parseFloat(cleaned);
    return isNaN(val) ? null : val;
  }

  private parseRange(str: string | undefined | null): [number | null, number | null] {
    if (!str) return [null, null];
    const parts = str.split('-').map(s => this.parseNumber(s));
    if (parts.length === 2) return [parts[0], parts[1]];
    return [null, null];
  }

  async saveToDatabase(pool: Pool, results: VixScrapeResult[]): Promise<void> {
    const validResults = results.filter(r => r.value !== null);

    if (validResults.length > 0) {
      const client = await pool.connect();
      try {
        for (const result of validResults) {
          await client.query(
            `
                        INSERT INTO market_data
                        (symbol, asset_type, price, change, change_percent, source, timestamp)
                        VALUES ($1, $2, $3, $4, $5, $6, NOW())
                    `,
            ['VIX', 'VIX', result.value, result.change_abs, result.change_pct, result.source]
          );
          console.log(
            `[VixPlaywrightScraper] Saved data from ${result.source} to DB: ${result.value}`
          );
        }
      } catch (error) {
        console.error('[VixPlaywrightScraper] Error saving market data to database:', error);
      } finally {
        client.release();
      }
    }

    // Sauvegarder les news
    await this.saveNewsToDatabase(pool, results);
  }

  async saveNewsToDatabase(pool: Pool, results: VixScrapeResult[]): Promise<void> {
    const allNews = results.flatMap(r => r.news_headlines.map(n => ({ ...n, source: r.source })));
    if (allNews.length === 0) return;

    const client = await pool.connect();
    try {
      let savedCount = 0;
      for (const news of allNews) {
        const existing = await client.query('SELECT id FROM news_items WHERE url = $1', [news.url]);

        if (existing.rows.length === 0) {
          await client.query(
            `
                        INSERT INTO news_items
                        (title, url, source, published_at, scraped_at, processing_status, market_hours)
                        VALUES ($1, $2, $3, NOW(), NOW(), 'raw', 'market')
                    `,
            [news.title, news.url, news.source]
          );
          savedCount++;
        }
      }

      if (savedCount > 0)
        console.log(`[VixPlaywrightScraper] Saved ${savedCount} new VIX news items to DB`);
    } catch (error) {
      console.error('[VixPlaywrightScraper] Error saving news to database:', error);
    } finally {
      client.release();
    }
  }

  private parseRelativeDate(relativeText: string): Date {
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
        if (pattern.multiplier === 0) return now; // "today", "just now"
        return new Date(now.getTime() - value * pattern.multiplier);
      }
    }

    // Fallback: retourner maintenant
    return now;
  }
}
