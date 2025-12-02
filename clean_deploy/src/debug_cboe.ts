import { CboeScraper } from './backend/ingestion/CboeScraper';
import * as fs from 'fs';

async function debugCboe() {
  console.log('--- Debugging CBOE ---');
  const cboeScraper = new CboeScraper();
  try {
    console.log('Initializing...');
    await cboeScraper.init();
    console.log('Scraping...');
    const result = await cboeScraper.scrapeOexRatio();
    console.log('CBOE Result:', result);
    fs.writeFileSync('cboe_result.json', JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('CBOE Error:', e);
    fs.writeFileSync('cboe_error.log', String(e) + '\n' + (e instanceof Error ? e.stack : ''));
  } finally {
    await cboeScraper.close();
  }
}

debugCboe();
