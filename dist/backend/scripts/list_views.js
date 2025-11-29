import { Pool } from 'pg';
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'financial_analyst',
    user: 'postgres',
    password: '9022',
});
async function listViews() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public';
    `);
        console.log('Views:', res.rows.map(r => r.table_name).join(', '));
    }
    catch (e) {
        console.error(e);
    }
    finally {
        client.release();
        pool.end();
    }
}
listViews();
//# sourceMappingURL=list_views.js.map