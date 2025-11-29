import { BinanceScraper } from '../ingestion/BinanceScraper';
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
async function main() {
    console.log('🚀 Starting Binance Crypto Scraper...');
    const scraper = new BinanceScraper();
    try {
        // 1. Fetch
        const prices = await scraper.fetchPrices();
        // 2. Display
        console.log('\n📊 Current Crypto Prices:');
        prices.forEach(p => {
            const icon = p.change_24h >= 0 ? '🟢' : '🔴';
            console.log(`${icon} ${p.symbol.padEnd(10)} $${p.price.toFixed(2)} (${p.change_24h.toFixed(2)}%)`);
        });
        // 3. Save
        if (prices.length > 0) {
            await scraper.saveToDatabase(pool, prices);
        }
        console.log('\n✅ Process completed.');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
    finally {
        await pool.end();
    }
}
main();
//# sourceMappingURL=scrape_binance.js.map