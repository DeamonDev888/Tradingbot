import { SP500FuturesScraper } from '../ingestion/SP500FuturesScraper';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('Testing SP500FuturesScraper...');
  const scraper = new SP500FuturesScraper();

  try {
    const data = await scraper.fetchSP500FuturesWithZeroHedge();
    console.log('SP500 Futures Data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error running scraper:', error);
  }
}

main();
