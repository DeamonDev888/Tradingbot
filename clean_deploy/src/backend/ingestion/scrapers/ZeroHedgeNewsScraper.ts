import axios from 'axios';
import * as cheerio from 'cheerio';
import { NewsScraper } from '../NewsScraper';
import { NewsItem } from '../NewsAggregator';

export class ZeroHedgeNewsScraper {
  private newsScraper: NewsScraper;

  constructor() {
    this.newsScraper = new NewsScraper();
  }

  async init(): Promise<void> {
    await this.newsScraper.init();
  }

  async close(): Promise<void> {
    await this.newsScraper.close();
  }

  /**
   * Scrapes the full content of an article from its URL.
   */
  private async scrapeArticleContent(url: string): Promise<string> {
    return this.newsScraper.scrapeArticle(url);
  }

  /**
   * Scores an RSS item based on financial keywords for better ranking.
   */
  private scoreItem(title: string, description: string): number {
    const keywords = [
      'market',
      'stock',
      'economy',
      'trading',
      'sp500',
      'nasdaq',
      'dow',
      'finance',
      'economic',
      'federal reserve',
      'fed',
      'interest rate',
      'inflation',
      'recession',
      'bull',
      'bear',
      'volatility',
      'earnings',
      'profit',
      'loss',
      'revenue',
      'growth',
      'decline',
      'crypto',
      'bitcoin',
      'ethereum',
      'bond',
      'yield',
      'treasury',
    ];
    const text = (title + ' ' + description).toLowerCase();
    let score = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) score++;
    }
    return score;
  }

  /**
   * Récupère les news via RSS pour ZeroHedge (Beaucoup plus fiable que le scraping HTML)
   */
  async fetchNews(): Promise<NewsItem[]> {
    try {
      // Flux RSS officiel de ZeroHedge - mis à jour vers la nouvelle URL
      const { data } = await axios.get('https://cms.zerohedge.com/fullrss2.xml', {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NovaQuoteAgent/1.0)' },
        timeout: 5000,
      });

      const $ = cheerio.load(data, { xmlMode: true });

      // Get all items and score them for better ranking
      const allItems = $('item').toArray();
      const scoredItems = allItems.map(el => {
        const title = $(el).find('title').text().trim();
        const description = $(el).find('description').text().trim();
        const score = this.scoreItem(title, description);
        return { el, score, title, description };
      });

      // Sort by score descending and take top 5
      scoredItems.sort((a, b) => b.score - a.score);
      const topItems = scoredItems.slice(0, 5);

      const newsPromises = topItems.map(async (item): Promise<NewsItem | null> => {
        const { el, title, description } = item;
        const link = $(el).find('link').text().trim();
        const pubDate = $(el).find('pubDate').text();

        if (title && link) {
          // Fetch full content with fallback to description
          let content = await this.scrapeArticleContent(link);

          if (!content || content.length < 50) {
            content = description;
          }

          // Return if we have sufficient content
          if (content && content.length >= 20) {
            return {
              title,
              source: 'ZeroHedge',
              url: link,
              timestamp: new Date(pubDate),
              content,
            };
          }
          console.log(
            `[ZeroHedgeNewsScraper] ⚠️ Skipping article due to insufficient content: ${title}`
          );
        }
        return null;
      });

      const results = await Promise.all(newsPromises);
      return results.filter((n): n is NewsItem => n !== null);
    } catch (error) {
      console.error(
        'Error fetching ZeroHedge RSS:',
        error instanceof Error ? error.message : error
      );
      return [];
    }
  }
}
