
import { FinnhubClient } from '../ingestion/FinnhubClient';

async function testFinnhub() {
  console.log('Testing FinnhubClient...');
  const client = new FinnhubClient();
  try {
    console.log('Fetching SP500 Data...');
    const data = await client.fetchSP500Data();
    console.log('Result:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

testFinnhub();
