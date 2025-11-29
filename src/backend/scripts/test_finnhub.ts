import { FinnhubClient } from '../ingestion/FinnhubClient';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('Testing FinnhubClient...');
  const client = new FinnhubClient();

  try {
    console.log('Fetching Market News...');
    const news = await client.fetchMarketNews();
    console.log(`News found: ${news.length}`);

    console.log('Fetching SPY Quote...');
    const spy = await client.fetchQuote('SPY');
    console.log('SPY Quote:', spy);

    console.log('Fetching Major Indices...');
    const indices = await client.fetchMajorIndices();
    console.log('Indices:', JSON.stringify(indices, null, 2));
  } catch (error) {
    console.error('Error running client:', error);
  }
}

main();
