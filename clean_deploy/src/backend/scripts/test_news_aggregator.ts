import { NewsAggregator } from '../ingestion/NewsAggregator';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('Testing NewsAggregator...');
  const aggregator = new NewsAggregator();

  try {
    // Test individual sources first
    console.log('Fetching ZeroHedge...');
    const zh = await aggregator.fetchZeroHedgeHeadlines();
    console.log(`ZeroHedge: ${zh.length} items`);

    console.log('Fetching CNBC...');
    const cnbc = await aggregator.fetchCNBCMarketNews();
    console.log(`CNBC: ${cnbc.length} items`);

    // Test full aggregation
    console.log('Fetching All News...');
    const totalNews = await aggregator.fetchAndSaveAllNews();
    console.log(`Total News Fetched: ${totalNews}`);
  } catch (error) {
    console.error('Error running aggregator:', error);
  }
}

main();
