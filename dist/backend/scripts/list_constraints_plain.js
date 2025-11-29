import { Pool } from 'pg';
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'financial_analyst',
    user: 'postgres',
    password: '9022',
});
async function listConstraintsPlain() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
      SELECT conname, pg_get_constraintdef(c.oid) as def
      FROM pg_constraint c 
      JOIN pg_namespace n ON n.oid = c.connamespace 
      WHERE conrelid = 'market_data'::regclass;
    `);
        res.rows.forEach(r => console.log(`${r.conname}: ${r.def}`));
    }
    catch (e) {
        console.error(e);
    }
    finally {
        client.release();
        pool.end();
    }
}
listConstraintsPlain();
//# sourceMappingURL=list_constraints_plain.js.map