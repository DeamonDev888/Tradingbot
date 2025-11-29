import { TradingEconomicsScraper } from '../ingestion/TradingEconomicsScraper';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('Testing TradingEconomicsScraper...');
  const scraper = new TradingEconomicsScraper();

  try {
    const events = await scraper.scrapeUSCalendar();
    console.log(`Found ${events.length} events.`);
    if (events.length > 0) {
      console.log('Sample event:', events[0]);
    }
  } catch (error) {
    console.error('Error running scraper:', error);
  }
}

main();
