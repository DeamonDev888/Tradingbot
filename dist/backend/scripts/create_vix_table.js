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
async function createTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS vix_analyses (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                analysis_date TIMESTAMP DEFAULT NOW(),
                analysis_data JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log("✅ Table 'vix_analyses' created successfully.");
    }
    catch (e) {
        console.error(e);
    }
    finally {
        await pool.end();
    }
}
createTable();
//# sourceMappingURL=create_vix_table.js.map