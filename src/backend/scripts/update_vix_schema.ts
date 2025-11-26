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

async function updateVixSchema() {
  const client = await pool.connect();
  try {
    console.log('🚀 Checking/Updating vix_analyses schema...');

    // Créer la table si elle n'existe pas
    await client.query(`
      CREATE TABLE IF NOT EXISTS vix_analyses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        analysis_data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    console.log('✅ Table vix_analyses checked/created.');
  } catch (error) {
    console.error('❌ Error updating schema:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

updateVixSchema();
