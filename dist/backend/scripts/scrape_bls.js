import * as dotenv from 'dotenv';
dotenv.config();
import { BlsScraper } from '../ingestion/BlsScraper';
process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at:', p, 'reason:', reason);
    process.exit(1);
});
process.on('uncaughtException', error => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
async function main() {
    console.log('Starting BLS Scraper...');
    const scraper = new BlsScraper();
    try {
        console.log('Calling scrapeLatestNumbers...');
        const data = await scraper.scrapeLatestNumbers();
        console.log('Scrape finished. Data length:', data.length);
        console.log('Scraped Data:', JSON.stringify(data, null, 2));
        if (data.length > 0) {
            console.log('Saving to database...');
            await scraper.saveToDatabase(data);
            console.log('Successfully saved data to database.');
        }
        else {
            console.log('No data found to save.');
        }
    }
    catch (error) {
        console.error('Script failed:', error);
        process.exit(1);
    }
    finally {
        console.log('Closing scraper...');
        await scraper.close();
        console.log('Scraper closed.');
    }
}
main();
//# sourceMappingURL=scrape_bls.js.map