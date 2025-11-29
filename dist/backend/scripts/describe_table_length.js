import { Pool } from 'pg';
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'financial_analyst',
    user: 'postgres',
    password: '9022',
});
async function describeTableLength() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'market_data';
    `);
        res.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type} (${r.character_maximum_length})`));
    }
    catch (e) {
        console.error(e);
    }
    finally {
        client.release();
        pool.end();
    }
}
describeTableLength();
//# sourceMappingURL=describe_table_length.js.map