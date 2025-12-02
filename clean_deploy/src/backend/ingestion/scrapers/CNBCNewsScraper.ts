import axios from 'axios';
import * as cheerio from 'cheerio';
import { NewsScraper } from '../NewsScraper';
import { NewsItem } from '../NewsAggregator';

export class CNBCNewsScraper {
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
   * Récupère les news de CNBC (US Markets) via RSS
   * Plus pertinent pour le S&P 500 (ES Futures) que ZoneBourse.
   */
  async fetchNews(): Promise<NewsItem[]> {
    try {
      // Flux RSS CNBC Finance
      const { data } = await axios.get(
        'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664',
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            Accept: 'application/rss+xml, application/xml, text/xml, */*',
          },
          timeout: 10000,
        }
      );

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
          let content = await this.scrapeArticleContent(link);

          if (!content || content.length < 50) {
            content = description;
          }

          // Ensure we have sufficient content
          if (content && content.length >= 20) {
            return {
              title,
              source: 'CNBC',
              url: link,
              timestamp: new Date(pubDate),
              content: content || title,
            };
          }
          console.log(
            `[CNBCNewsScraper] ⚠️ Skipping article due to insufficient content: ${title}`
          );
        }
        return null;
      });

      const results = await Promise.all(newsPromises);
      return results.filter((n): n is NewsItem => n !== null);
    } catch (error) {
      console.error('Error fetching CNBC RSS:', error instanceof Error ? error.message : error);
      return [];
    }
  }
}
