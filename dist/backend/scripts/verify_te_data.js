import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();
async function verifyData() {
    const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'financial_analyst',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '9022',
    });
    try {
        const client = await pool.connect();
        console.log('🔍 Verifying economic_events table...');
        const res = await client.query(`
      SELECT event_date, country, event_name, importance, actual, forecast, previous 
      FROM economic_events 
      ORDER BY event_date ASC 
      LIMIT 10
    `);
        console.log(`📊 Found ${res.rowCount} events in database.`);
        console.table(res.rows.map(row => ({
            Date: new Date(row.event_date).toLocaleString(),
            Country: row.country,
            Event: row.event_name,
            Imp: row.importance,
            Actual: row.actual,
            Fcst: row.forecast,
        })));
        client.release();
    }
    catch (err) {
        console.error('❌ Error querying database:', err);
    }
    finally {
        await pool.end();
    }
}
verifyData();
//# sourceMappingURL=verify_te_data.js.map