// Import dynamique pour éviter les problèmes ESM
import axios from 'axios';
import { chromium, type Browser, type Page } from 'playwright';
import * as cheerio from 'cheerio';
import { XFeed, XNewsItem, XScrapingResult } from './interfaces.js';
import { XFeedParser } from './XFeedParser.js';
import { NitterManager } from './NitterManager.js';

export class XNewsScraper {
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
          '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        ],
      });
      this.page = await this.browser.newPage();

      // Set viewport size
      await this.page.setViewportSize({ width: 1920, height: 1080 });

      console.log('Playwright browser initialized for X scraping');
    } catch (error) {
      console.error('Failed to initialize Playwright browser:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
      }
      if (this.browser) {
        await this.browser.close();
      }
      console.log('Playwright browser closed');
    } catch (error) {
      console.error('Error closing browser:', error);
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
      totalItems: 0,
    };

    try {
      if (!this.page) {
        throw new Error('Scraper not initialized');
      }

      // Use default OPML path if not provided
      const opmlFile = opmlPath || 'ia.opml';
      console.log(`Scraping X feeds from OPML: ${opmlFile}`);

      const feeds = XFeedParser.parseOpml(opmlFile);
      const prioritizedFeeds = XFeedParser.prioritizeFeeds(feeds);

      console.log(
        `Found ${feeds.length} X feeds, selected ${prioritizedFeeds.length} for scraping`
      );
      console.log(
        `Selection: ${prioritizedFeeds.filter(f => f.xmlUrl.includes('lightbrd.com')).length} lightbrd, ${prioritizedFeeds.filter(f => f.xmlUrl.includes('xcancel.com')).length} xcancel, ${prioritizedFeeds.filter(f => !f.xmlUrl.includes('lightbrd.com') && !f.xmlUrl.includes('xcancel.com')).length} other`
      );

      for (const feed of prioritizedFeeds) {
        try {
          const feedItems = await this.scrapeFeed(feed);
          result.items.push(...feedItems);
          result.processedFeeds++;
          console.log(`✓ Scraped ${feedItems.length} items from ${feed.title}`);
        } catch (error) {
          const errorMsg = `Failed to scrape feed ${feed.title}: ${error instanceof Error ? error.message : String(error)}`;
          result.errors.push(errorMsg);
          console.error(`✗ ${errorMsg}`);
        }
      }

      result.success = result.processedFeeds > 0;
      result.totalItems = result.items.length;

      console.log(
        `X scraping complete: ${result.totalItems} items from ${result.processedFeeds} feeds`
      );
      return result;
    } catch (error) {
      result.success = false;
      result.errors.push(
        `Main scraping error: ${error instanceof Error ? error.message : String(error)}`
      );
      console.error('X scraping failed:', error);
      return result;
    }
  }

  /**
   * Scrape individual X/Twitter RSS feed
   */
  private async scrapeFeed(feed: XFeed): Promise<XNewsItem[]> {
    if (!this.page) {
      throw new Error('Scraper not initialized');
    }

    // Get list of working instances to try
    const instances = await NitterManager.getWorkingInstances();
    let lastError: Error | null = null;

    // Extract username to construct URLs for different instances
    let username = '';
    try {
        const urlObj = new URL(feed.xmlUrl);
        const parts = urlObj.pathname.split('/').filter(p => p);
        username = parts[0];
    } catch {
        // Fallback regex
        const match = feed.xmlUrl.match(/(?:x\.com|twitter\.com|nitter\.[^/]+)\/([^/]+)/);
        if (match) username = match[1];
    }

    if (!username) {
        console.warn(`Could not extract username from ${feed.xmlUrl}, skipping`);
        return [];
    }

    // Try up to 3 instances
    const attempts = Math.min(instances.length, 3);
    
    for (let i = 0; i < attempts; i++) {
        const instance = instances[i];
        const targetUrl = `${instance}/${username}/rss`;
        
        console.log(`Scraping X feed: ${feed.title} (${targetUrl}) [Attempt ${i+1}/${attempts}]`);

        try {
            // Navigate to feed URL with timeout
            await this.page.goto(targetUrl, {
                waitUntil: 'networkidle',
                timeout: 30000,
            });

            // Get page content
            const pageContent = await this.page.content();

            if (!pageContent || pageContent.trim().length === 0) {
                throw new Error('Empty content received');
            }

            // Check for redirects or error pages
            if (pageContent.includes('302 Found') || pageContent.includes('<title>302')) {
                throw new Error('Feed redirected or blocked');
            }

            const items = await this.parseFeedContent(pageContent, feed);
            if (items.length > 0) {
                return items; // Success!
            } else {
                console.warn(`No items found on ${instance}, trying next...`);
            }
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            console.warn(`Failed to scrape from ${instance}: ${lastError.message}`);
        }
    }

    throw new Error(`All attempts failed. Last error: ${lastError?.message}`);
  }

  /**
   * Parse RSS/Atom feed content and extract items
   */
  private async parseFeedContent(content: string, feed: XFeed): Promise<XNewsItem[]> {
    const items: XNewsItem[] = [];

    try {
      // Try XML parsing first
      let $ = cheerio.load(content, { xmlMode: true });
      let entries = $('item').toArray();

      // If no entries in XML mode, try HTML parsing
      if (entries.length === 0) {
        $ = cheerio.load(content);
        entries = $('item').toArray();

        // If still no entries, look for content in <pre> tag (common with Playwright)
        if (entries.length === 0) {
          const preText = $('pre').text();
          if (preText) {
            const $xml = cheerio.load(preText, { xmlMode: true });
            entries = $xml('item').toArray();
            $ = $xml; // Use XML context
          }
        }
      }

      if (entries.length === 0) {
        console.warn(`No entries found in feed ${feed.title}`);
        return [];
      }

      console.log(`Found ${entries.length} entries in ${feed.title}`);

      // Limit to top 5 entries per feed
      entries = entries.slice(0, 5);

      for (const element of entries) {
        try {
          const title = $(element).find('title').text().trim();
          const link = $(element).find('link').text().trim();
          const pubDate = $(element).find('pubDate').text().trim();
          const description = $(element).find('description').text().trim();

          // Skip if missing essential fields
          if (!title && !description) {
            continue;
          }

          // For X/Twitter RSS, the description is usually the tweet content
          const content = description || title;

          const newsItem: XNewsItem = {
            title: (title || description).substring(0, 200),
            source: `X - ${feed.title}`,
            url: link,
            published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
            content: content,
            sentiment: 'neutral',
            timestamp: pubDate ? new Date(pubDate) : new Date(),
          };

          items.push(newsItem);
        } catch (error) {
          console.warn(`Error parsing entry in ${feed.title}:`, error);
        }
      }

      return items;
    } catch (error) {
      throw new Error(
        `Content parsing failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Fallback method using axios for simple HTTP requests
   */
  private async fetchWithAxcess(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'application/rss+xml, application/xml, text/xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 15000,
      });

      return response.data;
    } catch (error) {
      throw new Error(
        `Axios request failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
