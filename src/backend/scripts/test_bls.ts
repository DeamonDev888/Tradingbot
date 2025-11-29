import { BlsScraper } from '../ingestion/BlsScraper';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('Testing BlsScraper...');
  const scraper = new BlsScraper();

  try {
    const events = await scraper.scrapeLatestNumbers();
    console.log(`Found ${events.length} BLS events.`);
    if (events.length > 0) {
      console.log('Sample event:', events[0]);
    }
  } catch (error) {
    console.error('Error running scraper:', error);
  } finally {
    await scraper.close();
  }
}

main();
