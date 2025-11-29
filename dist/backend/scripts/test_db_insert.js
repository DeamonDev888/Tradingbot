import { Pool } from 'pg';
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'financial_analyst',
    user: 'postgres',
    password: '9022',
});
async function testSimpleInsert() {
    const client = await pool.connect();
    try {
        console.log('Testing simple insert...');
        await client.query(`INSERT INTO market_data (symbol, price, timestamp) VALUES ($1, $2, NOW())`, ['TEST', 100.0]);
        console.log('✅ Simple insert success');
        console.log('Testing full insert...');
        await client.query(`INSERT INTO market_data 
         (symbol, price, change, change_percent, high, low, open, previous_close, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`, ['ES_CONVERTED', 6000.5, 10.5, 0.5, 6010.0, 5990.0, 6000.0, 5990.0]);
        console.log('✅ Full insert success');
    }
    catch (e) {
        console.error('❌ Insert failed:', e);
    }
    finally {
        client.release();
        pool.end();
    }
}
testSimpleInsert();
//# sourceMappingURL=test_db_insert.js.map