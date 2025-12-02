import { CboeScraper } from '../ingestion/CboeScraper';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('Testing CboeScraper (OEX)...');
  const scraper = new CboeScraper();

  try {
    const result = await scraper.scrapeOexRatio();
    console.log('OEX Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error running scraper:', error);
  }
}

main();
