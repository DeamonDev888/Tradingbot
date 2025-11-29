import { chromium, Browser, Page } from 'playwright';

export interface SP500FuturesData {
  current: number;
  change: number | null;
  percent_change: number | null;
  high: number | null;
  low: number | null;
  open: number | null;
  previous_close: number | null;
  symbol: string;
  source: string;
  support_levels?: number[];
  resistance_levels?: number[];
  key_levels?: string[];
  zero_hedge_analysis?: {
    technical_levels: string[];
    sentiment: string;
    key_messages: string[];
  };
}

export class SP500FuturesScraper {
  private browser: Browser | null = null;

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
      // Browser globals are available in page context
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
      (window as any).chrome = { runtime: {} };
      Object.defineProperty(navigator, 'permissions', {
        get: () => ({
          query: () => Promise.resolve({ state: 'granted' }),
        }),
      });
    });

    return page;
  }

  /**
   * Scrape ZeroHedge pour les niveaux techniques ET le prix (si mentionné)
   * Remplace les autres sources de prix (Investing/Yahoo)
   */
  async scrapeZeroHedgeData(): Promise<SP500FuturesData | null> {
    const page = await this.createStealthPage();

    try {
      console.log('[SP500Futures] 🔍 Recherche des niveaux et prix sur ZeroHedge...');

      // Visiter ZeroHedge
      await page.goto('https://www.zerohedge.com/', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      await page.waitForTimeout(2000);

      // Optimisation: Scroll pour charger plus d'articles (navigation active)
      console.log('[SP500Futures] 📜 Navigation et scroll sur la page...');
      await this.autoScroll(page);

      const result: SP500FuturesData = {
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

      const articles = await page.locator('article, .post-item, .entry-item').all();
      let priceFound = false;

      for (const article of articles.slice(0, 20)) {
        // Limiter aux 20 premiers articles
        try {
          const titleElement = await article.locator('h1, h2, .title, a').first();
          const title = await titleElement.textContent();
          const linkElement = await article.locator('a').first();
          const link = await linkElement.getAttribute('href');

          if (title && link && this.containsTechnicalLevels(title)) {
            console.log(`[SP500Futures] 📊 Article technique trouvé: ${title.substring(0, 60)}...`);

            // Extraire les niveaux du titre
            const levels = this.extractLevelsFromText(title);
            result.support_levels?.push(...levels.supports);
            result.resistance_levels?.push(...levels.resistances);
            result.zero_hedge_analysis?.technical_levels.push(title);
            result.zero_hedge_analysis?.key_messages.push(title);

            // Essayer d'extraire le prix du titre
            if (!priceFound) {
              const extractedPrice = this.extractPriceFromText(title);
              if (extractedPrice) {
                result.current = extractedPrice;
                priceFound = true;
                console.log(`[SP500Futures] 💰 Prix extrait du titre: ${extractedPrice}`);
              }
            }

            // Essayer de visiter l'article pour plus de détails
            try {
              const articlePage = await this.createStealthPage();
              await articlePage.goto(
                link.startsWith('http') ? link : `https://www.zerohedge.com${link}`,
                {
                  waitUntil: 'domcontentloaded',
                  timeout: 15000,
                }
              );

              await articlePage.waitForTimeout(1500);

              // Scroll sur l'article aussi
              await this.autoScroll(articlePage, 2);

              // Extraire le contenu de l'article
              const content = await articlePage
                .locator('.entry-content, .post-content, article p')
                .allTextContents();
              const fullContent = content.join(' ');

              // Extraire les niveaux du contenu
              const contentLevels = this.extractLevelsFromText(fullContent);
              result.support_levels?.push(...contentLevels.supports);
              result.resistance_levels?.push(...contentLevels.resistances);

              // Extraire le prix du contenu si pas encore trouvé
              if (!priceFound) {
                const extractedPrice = this.extractPriceFromText(fullContent);
                if (extractedPrice) {
                  result.current = extractedPrice;
                  priceFound = true;
                  console.log(`[SP500Futures] 💰 Prix extrait du contenu: ${extractedPrice}`);
                }
              }

              // Analyser le sentiment
              if (result.zero_hedge_analysis) {
                result.zero_hedge_analysis.sentiment = this.analyzeSentiment(
                  title + ' ' + fullContent
                );
              }

              await articlePage.close();
            } catch (e) {
              console.log("[SP500Futures] Impossible de charger l'article détaillé");
            }

            // Si on a trouvé des niveaux et un prix, on peut s'arrêter ou continuer un peu
            if (priceFound && (result.support_levels?.length || 0) > 2) break;
          }
        } catch {
          continue;
        }
      }

      // Dédupliquer et trier les niveaux
      if (result.support_levels) {
        result.support_levels = Array.from(new Set(result.support_levels))
          .sort((a, b) => b - a)
          .filter(level => level >= 4000 && level <= 8000);
      }
      if (result.resistance_levels) {
        result.resistance_levels = Array.from(new Set(result.resistance_levels))
          .sort((a, b) => a - b)
          .filter(level => level >= 4000 && level <= 8000);
      }

      if (
        (result.support_levels && result.support_levels.length > 0) ||
        (result.resistance_levels && result.resistance_levels.length > 0)
      ) {
        console.log(`[SP500Futures] ✅ Données ZeroHedge extraites:`);
        console.log(`   Prix estimé: ${result.current || 'Non trouvé'}`);
        console.log(
          `   Supports: [${result.support_levels?.slice(0, 5).join(', ')}${(result.support_levels?.length || 0) > 5 ? '...' : ''}]`
        );
        console.log(
          `   Résistances: [${result.resistance_levels?.slice(0, 5).join(', ')}${(result.resistance_levels?.length || 0) > 5 ? '...' : ''}]`
        );
        return result;
      }

      console.log('[SP500Futures] ℹ️ Aucune donnée pertinente trouvée sur ZeroHedge');
      return null;
    } catch (error) {
      console.error(
        '[SP500Futures] Erreur scraping ZeroHedge:',
        error instanceof Error ? error.message : error
      );
      return null;
    } finally {
      await page.close();
    }
  }

  /**
   * Scroll automatique pour charger le contenu dynamique
   */
  private async autoScroll(page: Page, maxScrolls: number = 5): Promise<void> {
    try {
      let scrolls = 0;
      let previousHeight = 0;

      while (scrolls < maxScrolls) {
        const currentHeight = await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
          return document.body.scrollHeight;
        });

        if (currentHeight === previousHeight) break;

        previousHeight = currentHeight;
        await page.waitForTimeout(1000);
        scrolls++;
      }
    } catch (e) {
      // Ignorer les erreurs de scroll
    }
  }

  /**
   * Vérifie si un texte contient des niveaux techniques S&P 500/ES
   */
  private containsTechnicalLevels(text: string): boolean {
    const keywords = [
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

    const upperText = text.toUpperCase();
    return keywords.some(keyword => upperText.includes(keyword.toUpperCase()));
  }

  /**
   * Extrait les niveaux numériques d'un texte
   */
  private extractLevelsFromText(text: string): {
    supports: number[];
    resistances: number[];
  } {
    const levels = text.match(/\b[4-7]\d{3}\b/g); // Niveaux entre 4000-7999

    if (!levels) {
      return { supports: [], resistances: [] };
    }

    const numbers = levels.map(l => parseInt(l));
    const supports: number[] = [];
    const resistances: number[] = [];

    // Répartition simple basée sur le contexte
    const supportKeywords = ['support', 'buy', 'long', 'bottom', 'floor', 'bid'];
    const resistanceKeywords = ['resistance', 'sell', 'short', 'top', 'ceiling', 'ask', 'offer'];

    numbers.forEach(level => {
      const index = text.indexOf(level.toString());
      const context = text
        .substring(Math.max(0, index - 30), Math.min(text.length, index + 30))
        .toUpperCase();

      if (resistanceKeywords.some(k => context.includes(k.toUpperCase()))) {
        resistances.push(level);
      } else if (supportKeywords.some(k => context.includes(k.toUpperCase()))) {
        supports.push(level);
      } else {
        // Par défaut, ajouter aux deux
        supports.push(level);
        resistances.push(level);
      }
    });

    return { supports, resistances };
  }

  /**
   * Tente d'extraire un prix actuel du texte
   */
  private extractPriceFromText(text: string): number | null {
    // Patterns: "trading at 5500", "currently 5500", "ES at 5500", "SPX 5500"
    const patterns = [
      /(?:trading at|currently|price|spot|now|last)[\s:]*([4-7]\d{3}(?:\.\d{1,2})?)/i,
      /(?:S&P 500|SPX|ES)[\s]*(?:is)?[\s]*at[\s]*([4-7]\d{3}(?:\.\d{1,2})?)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return parseFloat(match[1]);
      }
    }
    return null;
  }

  /**
   * Analyse le sentiment d'un texte
   */
  private analyzeSentiment(text: string): 'bullish' | 'bearish' | 'neutral' {
    const bullishWords = [
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
    const bearishWords = [
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

    const upperText = text.toUpperCase();
    const bullishCount = bullishWords.filter(word => upperText.includes(word.toUpperCase())).length;
    const bearishCount = bearishWords.filter(word => upperText.includes(word.toUpperCase())).length;

    if (bullishCount > bearishCount * 1.5) return 'bullish';
    if (bearishCount > bullishCount * 1.5) return 'bearish';
    return 'neutral';
  }

  /**
   * Point d'entrée principal - Focus ZeroHedge uniquement
   */
  async fetchSP500FuturesWithZeroHedge(): Promise<SP500FuturesData | null> {
    await this.init();

    console.log('[SP500Futures] 🎯 Démarrage récupération S&P500 (Focus ZeroHedge)...');

    try {
      // Uniquement ZeroHedge
      const zhData = await this.scrapeZeroHedgeData();

      if (zhData) {
        return zhData;
      }

      console.log('[SP500Futures] ❌ Aucune donnée trouvée sur ZeroHedge');
      return null;
    } finally {
      await this.close();
    }
  }

  /**
   * Alias pour compatibilité
   */
  async fetchSP500Futures(): Promise<SP500FuturesData | null> {
    return this.fetchSP500FuturesWithZeroHedge();
  }
}
