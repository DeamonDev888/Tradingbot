import { VixPlaywrightScraper } from '../ingestion/VixPlaywrightScraper';
import * as dotenv from 'dotenv';
dotenv.config();
async function main() {
    console.log('Testing VixPlaywrightScraper...');
    const scraper = new VixPlaywrightScraper();
    try {
        const results = await scraper.scrapeAll();
        console.log('Results:', JSON.stringify(results, null, 2));
        const metrics = scraper.getMetrics();
        console.log('Metrics:', metrics);
    }
    catch (error) {
        console.error('Error running scraper:', error);
    }
}
main();
//# sourceMappingURL=test_vix_playwright.js.map