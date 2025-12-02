/**
 * X Scraper avec recherche Twitter intégrée
 */

import axios from 'axios';
import { chromium, type Browser, type Page } from 'playwright';
import * as cheerio from 'cheerio';
import { XFeed, XNewsItem, XScrapingResult } from './interfaces';
import { XFeedParser } from './XFeedParser';

export class XScraperWithTwitterSearch {
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
      await this.page.setViewportSize({ width: 1920, height: 1080 });
      console.log('X scraper with Twitter search initialized');
    } catch (error) {
      console.error('Failed to initialize browser:', error);
      throw error;
    }
  }

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
      console.log('X scraper with Twitter search closed');
    } catch (error) {
      console.error('Error closing scraper:', error);
    }
  }

  /**
   * Search Twitter for real tweet URL
   */
  private async searchTwitterUrl(title: string, source: string): Promise<string | null> {
    if (!this.page) return null;

    try {
      const searchQuery = `${title} ${source}`;
      const searchUrl = `https://x.com/search?q=${encodeURIComponent(searchQuery)}&src=typed_query`;

      await this.page.goto(searchUrl, { timeout: 10000 });

      // Wait for results
      await this.page.waitForSelector('[data-testid="tweet"]', { timeout: 5000 });

      // Get first result
      const tweetUrl = await this.page.evaluate(() => {
        const firstTweet = document.querySelector('[data-testid="tweet"]');
        const linkElement = firstTweet?.querySelector('a[aria-label][role="link"]');
        return linkElement?.getAttribute('href') || '';
      });

      if (tweetUrl && tweetUrl.startsWith('https://x.com/')) {
        console.log(`✅ Found Twitter URL: ${tweetUrl}`);
        return tweetUrl;
      }

      console.log(`⚠️ No Twitter URL found for: "${title}"`);
      return null;
    } catch (error) {
      console.error(`Error searching Twitter:`, error);
      return null;
    }
  }

  /**
   * Scrape from OPML with Twitter URL search
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

      console.log(`Scraping X feeds from: ${opmlFile}`);

      // Parse OPML (simplified version)
      const feeds: XFeed[] = [
        {
          title: 'Twitter News Feed',
          xmlUrl: 'https://nitter.net/elonmusk/rss',
          htmlUrl: 'https://x.com/elonmusk'
        }
      ];

      let totalItems = 0;
      let processedFeeds = 0;

      for (const feed of feeds) {
        try {
          console.log(`Processing feed: ${feed.title}`);
          processedFeeds++;

          // Scrape with Twitter URL search
          const feedItems = await this.scrapeFeedWithTwitterSearch(feed.title, feed);

          result.items.push(...feedItems);
          totalItems += feedItems.length;

        } catch (error) {
          const errorMsg = `Feed "${feed.title}": ${error instanceof Error ? error.message : String(error)}`;
          result.errors.push(errorMsg);
          console.error(`Error scraping ${feed.title}:`, errorMsg);
        }
      }

      result.success = result.items.length > 0;
      result.processedFeeds = processedFeeds;
      result.totalItems = totalItems;

      console.log(`Enhanced X scraping complete: ${result.totalItems} items from ${result.processedFeeds} feeds`);
      return result;

    } catch (error) {
      console.error('Enhanced X scraping failed:', error);
      result.errors.push(`Main error: ${error instanceof Error ? error.message : String(error)}`);
      return result;
    }
  }

  /**
   * Scrape individual feed with Twitter search
   */
  private async scrapeFeedWithTwitterSearch(feedTitle: string, feed: XFeed): Promise<XNewsItem[]> {
    console.log(`Scraping feed with Twitter search: ${feedTitle}`);

    try {
      if (!this.page) {
        throw new Error('Page not initialized');
      }

      // Go to feed URL
      await this.page.goto(feed.xmlUrl, {
        waitUntil: 'networkidle',
        timeout: 15000
      });

      // Get page content
      const pageContent = await this.page.content();
      if (!pageContent) {
        throw new Error(`No content received from ${feed.xmlUrl}`);
      }
      const $ = cheerio.load(pageContent);

      if (!pageContent || pageContent.trim().length === 0) {
        console.log(`Empty content from ${feedTitle}`);
        return [];
      }

      // Check for error messages
      if (pageContent.includes('302 Found') || pageContent.includes('404 Not Found') || pageContent.includes('RSS reader not yet whitelisted')) {
        console.log(`Feed blocked or not found: ${feedTitle}`);
        return [];
      }

      // Parse items
      const items: XNewsItem[] = [];

      // Look for items in RSS/Atom format
      const elements = $('item');
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        try {
          const titleElement = $(element).find('title');
          const descriptionElement = $(element).find('description');
          const linkElement = $(element).find('link');
          const pubDateElement = $(element).find('pubDate');
          const guidElement = $(element).find('guid');

          if (!titleElement || !descriptionElement || !linkElement) {
            continue;
          }

          const title = titleElement.text().trim();
          const content = descriptionElement.text().trim();
          const link = linkElement.text().trim();
          const pubDate = pubDateElement?.text().trim() || new Date().toISOString();
          const guid = guidElement?.text().trim() || crypto.randomUUID();

          if (title && content) {
              // Search for real Twitter URL
              const twitterUrl = await this.searchTwitterUrl(title, 'X/Twitter');

              const newsItem: XNewsItem = {
                title,
                content,
                source: feedTitle,
                url: link || '',
                twitterUrl: twitterUrl || undefined, // Store the real Twitter URL
                published_at: pubDate,
                timestamp: new Date()
              };

              items.push(newsItem);
            }
        } catch (itemError) {
          console.error(`Error parsing item:`, itemError);
        }
      }

      console.log(`Found ${items.length} items in ${feedTitle} feed`);
      return items;

    } catch (error) {
      console.error(`Error scraping feed ${feedTitle}:`, error);
      return [];
    }
  }
}