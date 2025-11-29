import { Pool } from 'pg';
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'financial_analyst',
    user: 'postgres',
    password: '9022',
});
async function migrateMarketData() {
    const client = await pool.connect();
    try {
        console.log('Adding columns to market_data...');
        await client.query(`
      ALTER TABLE market_data 
      ADD COLUMN IF NOT EXISTS high NUMERIC,
      ADD COLUMN IF NOT EXISTS low NUMERIC,
      ADD COLUMN IF NOT EXISTS open NUMERIC,
      ADD COLUMN IF NOT EXISTS previous_close NUMERIC;
    `);
        console.log('✅ Columns added successfully.');
    }
    catch (e) {
        console.error('❌ Migration failed:', e);
    }
    finally {
        client.release();
        pool.end();
    }
}
migrateMarketData();
//# sourceMappingURL=migrate_market_data.js.map