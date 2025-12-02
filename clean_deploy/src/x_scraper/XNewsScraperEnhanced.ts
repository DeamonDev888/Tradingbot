// Import dynamique pour éviter les problèmes ESM
import axios from 'axios';
import { chromium, type Browser, type Page } from 'playwright';
import cheerio from 'cheerio';
import { XFeed, XNewsItem, XScrapingResult } from './interfaces';
import { XFeedParser } from './XFeedParser';

class XNewsScraperEnhanced {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async init(): Promise<void> {
    try {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        ]
      });

      this.page = await this.browser.newPage();

      // Set viewport size
      await this.page.setViewportSize({ width: 1920, height: 1080 });

      console.log('X scraper enhanced initialized for scraping with Twitter URL detection');
    } catch (error) {
      console.error('Failed to initialize Playwright browser:', error);
      throw error;
    }
  }

  /**
   * Search for real Twitter URL during scraping
   */
  async searchTwitterUrl(title: string, source: string): Promise<string | null> {
    if (!this.page) return null;

    try {
      console.log(`🔍 Searching Twitter for: "${title}" (${source})`);

      // Search for the tweet on X/Twitter
      const searchQuery = `${title} from:${source}`;
      const searchUrl = `https://x.com/search?q=${encodeURIComponent(searchQuery)}&src=typed_query&f=live`;

      await this.page.goto(searchUrl, {
        waitUntil: 'networkidle',
        timeout: 10000
      });

      // Wait for results
      await this.page.waitForSelector('[data-testid="tweet"]', { timeout: 10000 });

      // Get first tweet result
      const tweetUrl = await this.page.evaluate(() => {
        const firstTweet = document.querySelector('[data-testid="tweet"] a[href*="/status/"]');
        return firstTweet ? firstTweet.getAttribute('href') : null;
      });

      if (tweetUrl) {
        console.log(`✅ Found Twitter URL: ${tweetUrl}`);
        return tweetUrl.startsWith('http') ? tweetUrl : `https://x.com${tweetUrl}`;
      }

      console.log('⚠️ No Twitter URL found for this title');
      return null;

    } catch (error) {
      console.error('Error searching Twitter:', error);
      return null;
    }
  }

  /**
   * Fetch X/Twitter news from OPML file
   */
  async scrapeFromOpml(opmlPath?: string): Promise<XScrapingResult> {
    const result: XScrapingResult = {
      success: false,
      items: [],
      errors: [],
      processedFeeds: 0,
      totalItems: 0
    };

    try {
      if (!this.page) {
        throw new Error('Scraper not initialized');
      }

      // Use default OPML path if not provided
      const opmlFile = opmlPath || process.cwd() + '/ia.opml';
      console.log(`Scraping X feeds from OPML: ${opmlFile}`);

      const feeds = XFeedParser.parseOpml(opmlFile);
      console.log(`Found ${feeds.length} X feeds for scraping`);

      // Prioritize financial and tech feeds
      const prioritizedFeeds = XFeedParser.prioritizeFeeds(feeds);
      console.log(`Selected ${prioritizedFeeds.length} prioritized feeds for scraping`);

      let totalItems = 0;
      let processedFeeds = 0;

      for (const feed of prioritizedFeeds) {
        try {
          console.log(`Processing feed: ${feed.title} (${feed.xmlUrl})`);
          processedFeeds++;

          const feedItems = await this.scrapeFeed(feed);

          // Search for real Twitter URL for each item
          for (const item of feedItems) {
            const twitterUrl = await this.searchTwitterUrl(item.title, item.source);

            if (twitterUrl) {
              // Store the real Twitter URL
              item.twitterUrl = twitterUrl;
            }

            result.items.push(item);
            totalItems++;
          }

        } catch (error) {
          const errorMsg = `Failed to scrape feed ${feed.title}: ${error instanceof Error ? error.message : String(error)}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      result.success = result.items.length > 0;
      result.processedFeeds = processedFeeds;
      result.totalItems = totalItems;

      console.log(`Enhanced X scraping completed: ${result.items.length} items scraped`);
      return result;

    } catch (error) {
      console.error('X scraping failed:', error);
      result.errors.push(`Main scraping error: ${error instanceof Error ? error.message : String(error)}`);
      return result;
    }
  }

  /**
   * Scrape individual X feed
   */
  private async scrapeFeed(feed: XFeed): Promise<XNewsItem[]> {
    console.log(`Scraping feed: ${feed.title} (${feed.xmlUrl})`);

    if (!this.page) {
      throw new Error('Page not initialized');
    }

    await this.page.goto(feed.xmlUrl, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    const pageContent = await this.page.content();
    if (!pageContent) {
      throw new Error(`No content received from ${feed.xmlUrl}`);
    }

    const $ = cheerio.load(pageContent);
    const items: XNewsItem[] = [];

    // Extract items from RSS feed
    $('item').each((_, element) => {
      const title = $(element).find('title').text().trim();
      const description = $(element).find('description').text().trim();
      const link = $(element).find('link').text().trim();
      const pubDate = $(element).find('pubDate').text().trim();

      if (title && link) {
        const newsItem: XNewsItem = {
          title,
          content: description,
          source: feed.title,
          url: link,
          published_at: pubDate,
          timestamp: new Date()
        };

        items.push(newsItem);
      }
    });

    console.log(`Found ${items.length} items in feed ${feed.title}`);
    return items;
  }

  /**
   * Close browser
   */
  async close(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      console.log('X enhanced scraper browser closed');
    } catch (error) {
      console.error('Error closing enhanced scraper:', error);
    }
  }
}