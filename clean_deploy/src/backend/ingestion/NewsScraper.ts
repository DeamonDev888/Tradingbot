import { chromium, Browser, Page } from 'playwright';

export class NewsScraper {
  private browser: Browser | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.browser) return;

    if (!this.initPromise) {
      this.initPromise = (async () => {
        try {
          this.browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
          });
          console.log('NewsScraper: Browser launched');
        } catch (error) {
          console.error('NewsScraper: Failed to launch browser', error);
          this.initPromise = null; // Reset on failure so we can retry
        }
      })();
    }

    await this.initPromise;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async scrapeArticle(url: string): Promise<string> {
    if (!this.browser) await this.init();
    if (!this.browser) return '';

    let context;
    let page;

    try {
      context = await this.browser.newContext({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
      });

      page = await context.newPage();

      // Block images/fonts to speed up
      await page.route('**/*.{png,jpg,jpeg,gif,svg,woff,woff2}', route => route.abort());

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

      // Wait a bit for dynamic content
      await page.waitForTimeout(1000);

      // Extract content
      const content = await page.evaluate(() => {
        // Remove clutter
        const removeSelectors = [
          'script',
          'style',
          'nav',
          'header',
          'footer',
          '.ad',
          '.advertisement',
          '.social-share',
          '#cookie-banner',
          '.cookie-consent',
          '[role="complementary"]',
          '.sidebar',
        ];
        removeSelectors.forEach(sel => {
          document.querySelectorAll(sel).forEach(el => el.remove());
        });

        // Try to find main content
        const selectors = [
          '.node-body', // ZeroHedge
          '.ArticleBody-articleBody', // CNBC
          'article',
          '[role="main"]',
          '.article-body',
          '.post-content',
          '.entry-content',
          '.story-content',
          '#content',
          '.main-content',
        ];

        for (const selector of selectors) {
          const el = document.querySelector(selector);
          if (el) {
            return (el as HTMLElement).innerText;
          }
        }

        // Fallback: get all paragraphs with substantial text
        const paragraphs = Array.from(document.querySelectorAll('p'))
          .map(p => p.innerText.trim())
          .filter(text => text.length > 50);

        return paragraphs.join('\n\n');
      });

      return content.slice(0, 5000); // Limit length
    } catch (error) {
      console.warn(
        `NewsScraper: Failed to scrape ${url}:`,
        error instanceof Error ? error.message : error
      );
      return '';
    } finally {
      if (page) await page.close();
      if (context) await context.close();
    }
  }
  async fetchPageContent(url: string): Promise<string> {
    if (!this.browser) await this.init();
    if (!this.browser) return '';

    let context;
    let page;

    try {
      context = await this.browser.newContext({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      });

      page = await context.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

      // Return the full content (works for XML too if browser renders it or just source)
      return await page.content();
    } catch (error) {
      console.warn(
        `NewsScraper: Failed to fetch content from ${url}:`,
        error instanceof Error ? error.message : error
      );
      return '';
    } finally {
      if (page) await page.close();
      if (context) await context.close();
    }
  }
}
