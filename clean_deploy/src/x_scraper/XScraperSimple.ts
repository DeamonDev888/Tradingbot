/**
 * X Scraper Simple avec recherche Twitter inline
 */

import axios from 'axios';
import { chromium, type Browser, type Page } from 'playwright';
import * as cheerio from 'cheerio';
import { XFeed, XNewsItem, XScrapingResult } from './interfaces';

export class XScraperSimple {
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
      console.log('X simple scraper initialized');
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
      console.log('X simple scraper closed');
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
      console.log(`Searching Twitter for: "${title}" (${source})`);

      // Search for the tweet
      const searchQuery = `${title} ${source}`;
      const searchUrl = `https://x.com/search?q=${encodeURIComponent(searchQuery)}&src=typed_query`;

      await this.page.goto(searchUrl, {
        waitUntil: 'networkidle',
        timeout: 10000
      });

      // Wait for search results
      await this.page.waitForSelector('[data-testid="tweet"]', { timeout: 5000 });

      // Get first tweet result
      const twitterUrl = await this.page.evaluate(() => {
        const firstTweet = document.querySelector('[data-testid="tweet"] a[href*="/status/"]');
        return firstTweet ? firstTweet.getAttribute('href') : null;
      });

      if (twitterUrl && twitterUrl.startsWith('https://x.com/')) {
        console.log(`✅ Found Twitter URL: ${twitterUrl}`);
        return twitterUrl;
      }

      console.log('⚠️ No valid Twitter URL found');
      return null;
    } catch (error) {
      console.error('Error searching Twitter:', error);
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

      // Simple test with hardcoded X account
      const feeds: XFeed[] = [
        {
          title: 'Test Twitter Feed',
          xmlUrl: 'https://x.com/search?q=from%3Aelonmusk%20crypto&src=typed_query&f=live',
          htmlUrl: 'https://x.com/elonmusk'
        }
      ];

      let processedFeeds = 0;
      const allItems: XNewsItem[] = [];

      for (const feed of feeds) {
        processedFeeds++;
        console.log(`Processing feed ${processedFeeds}/${feeds.length}: ${feed.title}`);

        try {
          await this.page.goto(feed.htmlUrl, {
            waitUntil: 'networkidle',
            timeout: 15000
          });

          // Check for errors
          const errorSelector = '[data-testid="error-detail"]';
          const hasError = await this.page.$(errorSelector);

          if (hasError) {
            const errorText = await this.page.$eval(errorSelector, el => el.textContent);
            console.log(`Feed error: ${errorText}`);
            result.errors.push(`Feed ${feed.title}: ${errorText}`);
            continue;
          }

          // Get page content
          const content = await this.page.content();

          if (!content || content.trim().length === 0) {
            console.log(`No content in feed: ${feed.title}`);
            result.errors.push(`No content in feed: ${feed.title}`);
            continue;
          }

          const $ = cheerio.load(content);

          // Look for tweet elements
          const tweets = $('article');
          console.log(`Found ${tweets.length} items in feed`);

          let feedItems = 0;
          for (let i = 0; i < tweets.length && i < 5; i++) {
            const tweetEl = tweets.eq(i);
            const titleEl = tweetEl.find('h2, h3, .tweet-text');
            const linkEl = tweetEl.find('a[href*="/status/"]');
            const timeEl = tweetEl.find('time');

            if (titleEl && linkEl) {
              const title = titleEl.text().trim();
              const link = linkEl.attr('href');
              const pubDate = timeEl ? timeEl.attr('datetime') : new Date().toISOString();

              // Search for the real Twitter URL
              const twitterUrl = await this.searchTwitterUrl(title, feed.title);

              const newsItem: XNewsItem = {
                title,
                content: title, // Use title as content for simplicity
                source: feed.title,
                url: link || '',
                published_at: pubDate || new Date().toISOString(),
                timestamp: new Date(),
                twitterUrl: twitterUrl || undefined // Handle null case
              };

              allItems.push(newsItem);
              feedItems++;
            }
          }

          console.log(`Scraped ${feedItems} items from ${feed.title}`);
        } catch (error) {
          console.error(`Error scraping feed ${feed.title}:`, error);
          result.errors.push(`Feed ${feed.title}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      result.success = allItems.length > 0;
      result.items = allItems;
      result.processedFeeds = processedFeeds;
      result.totalItems = allItems.length;

      console.log(`Simple scraping complete: ${result.items.length} items found`);

      return result;

    } catch (error) {
      console.error('Simple scraping failed:', error);
      result.errors.push(`Main error: ${error instanceof Error ? error.message : String(error)}`);
      return result;
    }
  }
}