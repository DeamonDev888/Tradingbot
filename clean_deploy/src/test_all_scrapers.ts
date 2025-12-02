import { NewsAggregator } from './backend/ingestion/NewsAggregator';

async function testAll() {
  console.log('--- Testing NewsAggregator ---');
  const aggregator = new NewsAggregator();
  try {
    await aggregator.init();
    const count = await aggregator.fetchAndSaveAllNews();
    console.log(`Total news fetched and saved: ${count}`);
  } catch (e) {
    console.error('Aggregator Error:', e);
  } finally {
    await aggregator.close();
  }
}

testAll();
