import { Pool } from 'pg';
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'financial_analyst',
    user: 'postgres',
    password: '9022',
});
async function checkSymbolsPlain() {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT DISTINCT symbol FROM market_data');
        console.log('Symbols found:', res.rows.map(r => r.symbol).join(', '));
        const count = await client.query('SELECT COUNT(*) FROM market_data');
        console.log('Total rows:', count.rows[0].count);
        const spy = await client.query("SELECT * FROM market_data WHERE symbol = 'SPY' ORDER BY timestamp DESC LIMIT 1");
        if (spy.rows.length > 0) {
            console.log('Latest SPY:', spy.rows[0]);
        }
        else {
            console.log('No SPY data found.');
        }
    }
    catch (e) {
        console.error(e);
    }
    finally {
        client.release();
        pool.end();
    }
}
checkSymbolsPlain();
//# sourceMappingURL=check_symbols_plain.js.map