import { FredClient } from '../ingestion/FredClient';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('Testing FredClient...');
  const client = new FredClient();

  try {
    const data = await client.fetchAllKeyIndicators();
    console.log('FRED Data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error running client:', error);
  }
}

main();
