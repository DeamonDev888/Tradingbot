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

async function updateRougePulseSchema() {
  const client = await pool.connect();
  try {
    console.log('🚀 Updating rouge_pulse_analyses schema...');

    // Ajouter les nouvelles colonnes si elles n'existent pas
    await client.query(`
      ALTER TABLE rouge_pulse_analyses 
      ADD COLUMN IF NOT EXISTS sp500_price DECIMAL(10, 2),
      ADD COLUMN IF NOT EXISTS technical_levels JSONB,
      ADD COLUMN IF NOT EXISTS es_futures_analysis JSONB,
      ADD COLUMN IF NOT EXISTS bot_signal JSONB,
      ADD COLUMN IF NOT EXISTS agent_state JSONB,
      ADD COLUMN IF NOT EXISTS next_session_levels JSONB;
    `);

    console.log('✅ Schema updated successfully.');
  } catch (error) {
    console.error('❌ Error updating schema:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

updateRougePulseSchema();
