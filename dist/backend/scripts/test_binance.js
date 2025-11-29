import { BinanceScraper } from '../ingestion/BinanceScraper';
import * as dotenv from 'dotenv';
dotenv.config();
async function main() {
    console.log('Testing BinanceScraper...');
    const scraper = new BinanceScraper();
    try {
        const prices = await scraper.fetchPrices();
        console.log(`Found ${prices.length} crypto prices.`);
        if (prices.length > 0) {
            console.log('Sample price:', prices[0]);
        }
    }
    catch (error) {
        console.error('Error running scraper:', error);
    }
}
main();
//# sourceMappingURL=test_binance.js.map