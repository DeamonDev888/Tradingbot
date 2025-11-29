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
async function applySchema() {
    try {
        console.log('Applying specific schema update for RougePulse...');
        const client = await pool.connect();
        try {
            await client.query(`
        CREATE TABLE IF NOT EXISTS rouge_pulse_analyses (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            impact_score INTEGER,
            market_narrative TEXT,
            high_impact_events JSONB,
            asset_analysis JSONB,
            trading_recommendation TEXT,
            raw_analysis JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_rouge_pulse_created_at ON rouge_pulse_analyses(created_at DESC);
      `);
            console.log('RougePulse table created successfully!');
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('Failed to apply schema:', error);
    }
    finally {
        await pool.end();
    }
}
applySchema();
//# sourceMappingURL=apply_schema.js.map