import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { XFeed } from './interfaces';

export class XFeedParser {
  /**
   * Parse OPML file to extract X/Twitter RSS feeds
   */
  static parseOpml(filePath: string): XFeed[] {
    if (!fs.existsSync(filePath)) {
      throw new Error(`OPML file not found: ${filePath}`);
    }

    const xml = fs.readFileSync(filePath, 'utf8');
    const $ = cheerio.load(xml, { xmlMode: true });
    const feeds: XFeed[] = [];

    $('outline[type="rss"]').each((_, element) => {
      const title = $(element).attr('text') || '';
      let xmlUrl = $(element).attr('xmlUrl') || '';
      const htmlUrl = $(element).attr('htmlUrl') || '';

      if (xmlUrl && this.isXFeed(xmlUrl)) {
        // Force use of working Nitter instance
        try {
          const urlObj = new URL(xmlUrl);
          urlObj.hostname = 'nitter.lucabased.xyz';
          xmlUrl = urlObj.toString();
        } catch (e) {
          // If URL parsing fails, try simple string replacement if it looks like a URL
          if (xmlUrl.startsWith('http')) {
             xmlUrl = xmlUrl.replace(/:\/\/[^\/]+/, '://nitter.lucabased.xyz');
          }
        }
        feeds.push({ title, xmlUrl, htmlUrl });
      }
    });

    return feeds;
  }

  /**
   * Check if a feed URL is an X/Twitter RSS feed
   */
  private static isXFeed(url: string): boolean {
    const xDomains = ['lightbrd.com', 'xcancel.com', 'nitter', 'x.com', 'twitter.com'];
    return xDomains.some(domain => url.includes(domain));
  }

  /**
   * Prioritize feeds
   */
  static prioritizeFeeds(feeds: XFeed[]): XFeed[] {
    // Since we normalized all domains, just take the top 20 feeds
    // We can shuffle them or just take the first ones. 
    // For now, let's take the first 25 to ensure we get enough data.
    return feeds.slice(0, 25);
  }
}
