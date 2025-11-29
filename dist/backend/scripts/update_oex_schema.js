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
async function updateOexSchema() {
    const client = await pool.connect();
    try {
        console.log('🚀 Updating schema for OEX Sentiment Analysis...');
        // 1. Table for raw OEX Ratios
        await client.query(`
      CREATE TABLE IF NOT EXISTS oex_ratios (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        ratio DECIMAL(10, 4) NOT NULL,
        source VARCHAR(50) DEFAULT 'Barchart',
        scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_oex_ratios_scraped_at ON oex_ratios(scraped_at DESC);
    `);
        console.log('✅ Table oex_ratios created/verified.');
        // 2. Table for Agent Analyses
        await client.query(`
      CREATE TABLE IF NOT EXISTS oex_sentiment_analyses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        ratio_analyzed DECIMAL(10, 4) NOT NULL,
        sentiment_score INTEGER, -- 0 to 100 (0=Bearish, 100=Bullish)
        sentiment_label VARCHAR(20), -- BULLISH, BEARISH, NEUTRAL
        market_implication TEXT,
        trading_signal VARCHAR(50), -- BUY_CALLS, BUY_PUTS, WAIT
        raw_analysis JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_oex_analyses_created_at ON oex_sentiment_analyses(created_at DESC);
    `);
        console.log('✅ Table oex_sentiment_analyses created/verified.');
    }
    catch (error) {
        console.error('❌ Error updating schema:', error);
    }
    finally {
        client.release();
        await pool.end();
    }
}
updateOexSchema();
//# sourceMappingURL=update_oex_schema.js.map