import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'financial_analyst',
  user: 'postgres',
  password: '9022',
});

async function verify() {
  const client = await pool.connect();
  try {
    console.log('--- DB VERIFICATION ---');

    const tables = ['news_items', 'economic_events', 'market_data'];
    for (const table of tables) {
      const res = await client.query(`SELECT COUNT(*) as c FROM ${table}`);
      console.log(`${table}: ${res.rows[0].c} rows`);
    }

    console.log('\n--- RECENT ECONOMIC EVENTS ---');
    const events = await client.query(
      `SELECT event_name, country, actual, forecast FROM economic_events ORDER BY created_at DESC LIMIT 5`
    );
    events.rows.forEach(r =>
      console.log(`[${r.country}] ${r.event_name}: ${r.actual} (Fcst: ${r.forecast})`)
    );

    console.log('\n--- RECENT NEWS ---');
    const news = await client.query(
      `SELECT source, title FROM news_items ORDER BY created_at DESC LIMIT 5`
    );
    news.rows.forEach(r => console.log(`[${r.source}] ${r.title.substring(0, 50)}...`));
  } catch (e) {
    console.error(e);
  } finally {
    client.release();
    pool.end();
  }
}

verify();
