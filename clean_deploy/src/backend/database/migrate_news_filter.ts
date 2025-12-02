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

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Migrating database...');

    // Add processing_status column
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='news_items' AND column_name='processing_status') THEN
          ALTER TABLE news_items ADD COLUMN processing_status VARCHAR(20) DEFAULT 'PENDING';
        END IF;
      END
      $$;
    `);

    // Add relevance_score column
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='news_items' AND column_name='relevance_score') THEN
          ALTER TABLE news_items ADD COLUMN relevance_score INTEGER DEFAULT 0;
        END IF;
      END
      $$;
    `);

    // Add category column
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='news_items' AND column_name='category') THEN
          ALTER TABLE news_items ADD COLUMN category VARCHAR(50);
        END IF;
      END
      $$;
    `);

    // Add is_sent column (for Discord distribution)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='news_items' AND column_name='is_sent') THEN
          ALTER TABLE news_items ADD COLUMN is_sent BOOLEAN DEFAULT FALSE;
        END IF;
      END
      $$;
    `);

    console.log('Migration complete.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
