import { NewsAggregator } from '../ingestion/NewsAggregator';

async function testMarketDataFetch() {
  console.log('Testing fetchAndSaveMarketData...');
  const aggregator = new NewsAggregator();
  await aggregator.fetchAndSaveMarketData();
  console.log('Done.');
}

testMarketDataFetch();
