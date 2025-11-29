import { VixCboeScraper } from '../ingestion/VixCboeScraper';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();
async function main() {
    console.log('Testing VixCboeScraper...');
    const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'financial_analyst',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '9022',
    });
    const scraper = new VixCboeScraper(pool);
    try {
        console.log('1. Testing CBOE Official Scraper...');
        const cboeResult = await scraper.scrapeCboeVix();
        console.log('CBOE Result:', JSON.stringify(cboeResult, null, 2));
        console.log('\n2. Testing Alpha Vantage Scraper...');
        const avResult = await scraper.scrapeAlphaVantage();
        console.log('Alpha Vantage Result:', JSON.stringify(avResult, null, 2));
    }
    catch (error) {
        console.error('Error running scraper:', error);
    }
    finally {
        await pool.end();
    }
}
main();
//# sourceMappingURL=test_vix_cboe.js.map