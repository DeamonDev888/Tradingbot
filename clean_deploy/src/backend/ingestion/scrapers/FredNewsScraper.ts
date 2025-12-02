import { FredClient, FredSeriesData } from '../FredClient';
import { NewsItem } from '../NewsAggregator';

export class FredNewsScraper {
  private fredClient: FredClient;

  constructor() {
    this.fredClient = new FredClient();
  }

  async init(): Promise<void> {
    // FredClient doesn't need initialization
  }

  async close(): Promise<void> {
    // FredClient doesn't need cleanup
  }

  /**
   * Récupère les indicateurs économiques via FRED et les convertit en NewsItems
   */
  async fetchNews(): Promise<NewsItem[]> {
    try {
      const indicators = await this.fredClient.fetchAllKeyIndicators();

      return indicators.map(ind => ({
        title: `[MACRO DATA] ${ind.title}: ${ind.value} (As of ${ind.date})`,
        source: 'FRED',
        // URL unique par date pour éviter la déduplication abusive si la valeur change
        url: `https://fred.stlouisfed.org/series/${ind.id}?date=${ind.date}`,
        timestamp: new Date(ind.date),
        sentiment: 'neutral', // Le sentiment sera analysé par l'IA
      }));
    } catch (error) {
      console.error('Error fetching FRED data:', error);
      return [];
    }
  }
}
