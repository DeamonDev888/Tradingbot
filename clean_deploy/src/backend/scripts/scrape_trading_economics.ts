import { TradingEconomicsScraper } from '../ingestion/TradingEconomicsScraper';

async function main() {
  console.log('📅 Starting Economic Calendar Scraping (US)...');

  const scraper = new TradingEconomicsScraper();

  try {
    // 1. Scrape
    const events = await scraper.scrapeUSCalendar();

    // 2. Save
    if (events.length > 0) {
      await scraper.saveEvents(events);
    } else {
      console.log('⚠️ No events found to save.');
    }

    console.log('✅ Scraping process completed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error in scraping script:', error);
    process.exit(1);
  }
}

main();
