import axios from 'axios';
import * as cheerio from 'cheerio';
import { NewsScraper } from '../NewsScraper';
import { NewsItem } from '../NewsAggregator';

export class FinancialJuiceNewsScraper {
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
   * Récupère les news de FinancialJuice via RSS
   * URL: https://www.financialjuice.com/feed.ashx?xy=rss
   */
  async fetchNews(): Promise<NewsItem[]> {
    let retries = 3;
    let delay = 2000;

    while (retries > 0) {
      try {
        const { data } = await axios.get('https://www.financialjuice.com/feed.ashx?xy=rss', {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            Accept: 'application/rss+xml, application/xml, text/xml, */*',
          },
          timeout: 10000,
        });

        const $ = cheerio.load(data, { xmlMode: true });

        const allItems = $('item').toArray();
        const scoredItems = allItems.map(el => {
          const title = $(el).find('title').text().trim();
          const description = $(el).find('description').text().trim();
          const score = this.scoreItem(title, description);
          return { el, score, title, description };
        });

        scoredItems.sort((a, b) => b.score - a.score);
        const topItems = scoredItems.slice(0, 10);

        const newsPromises = topItems.map(async (item): Promise<NewsItem | null> => {
          const { el, title, description } = item;
          const link = $(el).find('link').text().trim();
          const pubDate = $(el).find('pubDate').text();

          if (title && link) {
            let content = await this.scrapeArticleContent(link);

            if (!content || content.length < 20) {
              content = description;
            }

            if (content && content.length >= 10) {
              return {
                title,
                source: 'FinancialJuice',
                url: link,
                timestamp: new Date(pubDate),
                content: content || title,
              };
            }
            console.log(
              `[FinancialJuiceNewsScraper] ⚠️ Skipping article due to insufficient content: ${title}`
            );
          }
          return null;
        });

        const results = await Promise.all(newsPromises);
        return results.filter((n): n is NewsItem => n !== null);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 429) {
          console.warn(
            `[FinancialJuice] Rate limited (429). Retrying in ${delay}ms... (${retries} retries left)`
          );
          await new Promise(resolve => setTimeout(resolve, delay));
          retries--;
          delay *= 2; // Exponential backoff
        } else {
          console.error(
            'Error fetching FinancialJuice RSS:',
            error instanceof Error ? error.message : error
          );
          return [];
        }
      }
    }
    console.error('[FinancialJuice] Max retries exceeded.');
    return [];
  }
}
