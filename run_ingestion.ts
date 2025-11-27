import { TradingEconomicsScraper } from './src/backend/ingestion/TradingEconomicsScraper';
import { NewsAggregator } from './src/backend/ingestion/NewsAggregator';

async function runDataIngestion() {
  console.log('🚀 Starting comprehensive data ingestion...');

  const scraper = new TradingEconomicsScraper();
  const newsAgg = new NewsAggregator();

  try {
    // 1. Récupérer et sauvegarder les événements économiques
    console.log('\n📅 Economic Events Ingestion...');
    const events = await scraper.scrapeUSCalendar();

    if (events.length > 0) {
      await scraper.saveEvents(events);
      console.log(`✅ Economic Events: ${events.length} events saved/updated`);
    } else {
      console.log('⚠️ No economic events found');
    }

    // 2. Récupérer et sauvegarder les news
    console.log('\n📰 News Ingestion...');
    const news = await newsAgg.fetchAndSaveAllNews();

    console.log(`✅ News: ${news.length} total news processed`);

    console.log('\n🎉 Data ingestion completed successfully!');
    console.log('The RougePulseAgent should now have access to fresh data.');
  } catch (error) {
    console.error('❌ Data ingestion failed:', error);
    process.exit(1);
  }
}

// Exécuter le script
runDataIngestion().catch(console.error);
