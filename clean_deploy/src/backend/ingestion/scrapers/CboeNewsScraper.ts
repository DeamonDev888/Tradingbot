import { CboeScraper, OexScrapeResult } from '../CboeScraper';
import { NewsItem } from '../NewsAggregator';

export class CboeNewsScraper {
  private cboeScraper: CboeScraper;

  constructor() {
    this.cboeScraper = new CboeScraper();
  }

  async init(): Promise<void> {
    await this.cboeScraper.init();
  }

  async close(): Promise<void> {
    await this.cboeScraper.close();
  }

  /**
   * Récupère le ratio Put/Call OEX via CBOE et le convertit en NewsItem
   */
  async fetchNews(): Promise<NewsItem[]> {
    try {
      const result = await this.cboeScraper.scrapeOexRatio();

      if (result.put_call_ratio !== null && result.timestamp) {
        return [
          {
            title: `[OPTIONS DATA] OEX Put/Call Ratio: ${result.put_call_ratio.toFixed(2)}`,
            source: 'CBOE',
            url: 'https://www.barchart.com/stocks/quotes/$CPCO/interactive-chart',
            timestamp: new Date(result.timestamp),
            sentiment: result.put_call_ratio > 1 ? 'bearish' : 'bullish', // Ratio > 1 souvent bearish
            content: `OEX Put/Call Ratio indicates market sentiment. Values above 1 typically suggest bearish sentiment.`,
          },
        ];
      }

      return [];
    } catch (error) {
      console.error('Error fetching CBOE OEX ratio:', error);
      return [];
    }
  }
}
