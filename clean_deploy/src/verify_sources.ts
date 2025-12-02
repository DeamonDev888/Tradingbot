import { NewsAggregator } from './backend/ingestion/NewsAggregator';

async function verifyOnly() {
  console.log('--- Verifying Sources ---');
  const aggregator = new NewsAggregator();
  try {
    // We access the private method via 'any' cast for testing, or we can just call init() which calls verifySources()
    // But init() also connects to DB. Let's just call init() as it prints the verification logs.
    await (aggregator as any).verifySources();
  } catch (e) {
    console.error('Verification Error:', e);
  } finally {
    await aggregator.close();
  }
}

verifyOnly();
