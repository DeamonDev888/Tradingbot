import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'financial_analyst',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '9022',
});

async function createCryptoTable() {
  const client = await pool.connect();
  try {
    console.log('🚀 Creating crypto_prices table...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS crypto_prices (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        symbol VARCHAR(20) NOT NULL,
        price DECIMAL(20, 8) NOT NULL,
        change_24h DECIMAL(10, 2),
        volume_24h DECIMAL(20, 2),
        market_cap DECIMAL(20, 2),
        source VARCHAR(50) DEFAULT 'Binance',
        scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_crypto_prices_symbol ON crypto_prices(symbol);
      CREATE INDEX IF NOT EXISTS idx_crypto_prices_scraped_at ON crypto_prices(scraped_at DESC);
    `);

    console.log('✅ Table crypto_prices created successfully.');
  } catch (error) {
    console.error('❌ Error creating table:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createCryptoTable();
