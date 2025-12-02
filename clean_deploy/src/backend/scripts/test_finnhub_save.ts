import { FinnhubClient } from '../ingestion/FinnhubClient';
import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'financial_analyst',
  user: 'postgres',
  password: '9022',
});

async function testFinnhubSaveUnique() {
  console.log('Testing FinnhubClient and DB Save...');
  const client = new FinnhubClient();
  const dbClient = await pool.connect();

  try {
    console.log('Fetching SP500 Data...');
    const stockData = await client.fetchSP500Data();
    console.log('Result:', stockData);

    if (stockData) {
      console.log('Attempting to save to DB...');
      await dbClient.query(
        `INSERT INTO market_data 
             (symbol, price, change, change_percent, high, low, open, previous_close, source, timestamp)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Finnhub', NOW())`,
        [
          'ES',
          stockData.current,
          stockData.change,
          stockData.percent_change,
          stockData.high,
          stockData.low,
          stockData.open,
          stockData.previous_close,
        ]
      );
      console.log('✅ Saved successfully!');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    dbClient.release();
    pool.end();
  }
}

testFinnhubSaveUnique();
