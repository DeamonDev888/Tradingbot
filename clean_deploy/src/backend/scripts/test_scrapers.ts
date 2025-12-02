#!/usr/bin/env ts-node

// import { VixPlaywrightScraper, VixScrapeResult } from '../ingestion/VixPlaywrightScraper'; // File removed
import { NewsAggregator } from '../ingestion/NewsAggregator';
import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'financial_analyst',
  user: 'postgres',
  password: '9022',
});

async function testScrapers() {
  console.log('🧪 TEST DES SCRAPERS ET INGESTORS\n');

  // const vixScraper = new VixPlaywrightScraper(); // Commented out - file removed
  const newsAggregator = new NewsAggregator();

  // Test 1: VIX Scraper
  console.log('📊 1. TEST VIX SCRAPER');
  console.log('='.repeat(50));

  try {
    // const vixResults = await vixScraper.scrapeAll(); // Commented out - file removed
    const vixResults: any[] = []; // Empty array as fallback

    // vixResults.forEach((result: VixScrapeResult) => { // Commented out - file removed
    vixResults.forEach((result: any) => {
      if (result.error) {
        console.log(`❌ ${result.source}: ERREUR - ${result.error}`);
      } else {
        console.log(`✅ ${result.source}:`);
        console.log(`   • VIX Value: ${result.value}`);
        console.log(`   • Change: ${result.change_abs} (${result.change_pct}%)`);
        console.log(`   • News items: ${result.news_headlines.length}`);
        if (result.news_headlines.length > 0) {
          console.log(`   • Sample news: "${result.news_headlines[0].title.substring(0, 80)}..."`);
        }
      }
    });
    // }); // Commented out - file removed

    // Test sauvegarde en base (commenté pour éviter les doublons)
    // await vixScraper.saveToDatabase(pool, vixResults);
  } catch (error: unknown) {
    console.error('❌ Erreur VIX Scraper:', error instanceof Error ? error.message : String(error));
  }

  console.log('\n📰 2. TEST NEWS AGGREGATOR');
  console.log('='.repeat(50));

  const newsTests = [
    { name: 'ZeroHedge RSS', func: () => newsAggregator.fetchZeroHedgeHeadlines() },
    { name: 'CNBC RSS', func: () => newsAggregator.fetchCNBCMarketNews() },
    { name: 'FinancialJuice RSS', func: () => newsAggregator.fetchFinancialJuice() },
    { name: 'FRED Economic Data', func: () => newsAggregator.fetchFredEconomicData() },
    { name: 'Finnhub News', func: () => newsAggregator.fetchFinnhubNews() },
  ];

  for (const test of newsTests) {
    try {
      console.log(`\n🔍 Test ${test.name}...`);
      const news = await test.func();

      if (news.length > 0) {
        console.log(`✅ ${test.name}: ${news.length} articles récupérés`);
        console.log(`   • Dernier article: "${news[0].title.substring(0, 80)}..."`);
        console.log(`   • Source: ${news[0].source}`);
        console.log(`   • Date: ${news[0].timestamp.toISOString()}`);
      } else {
        console.log(`⚠️  ${test.name}: Aucun article récupéré`);
      }
    } catch (error: unknown) {
      console.error(
        `❌ Erreur ${test.name}:`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  console.log('\n📊 3. SYNTHÈSE DES TESTS');
  console.log('='.repeat(50));

  // Vérifier l'état des API keys
  const fredKey = process.env.FRED_API_KEY;
  const finnhubKey = process.env.FINNHUB_API_KEY;

  console.log(`🔑 API Keys Status:`);
  console.log(`   • FRED API Key: ${fredKey ? '✅ Configurée' : '❌ Manquante'}`);
  console.log(`   • Finnhub API Key: ${finnhubKey ? '✅ Configurée' : '❌ Manquante'}`);

  console.log(`\n📈 Recommandations:`);

  if (fredKey && finnhubKey) {
    console.log(`✅ Toutes les API keys sont configurées`);
  } else {
    console.log(`⚠️  Certaines API keys manquent - vérifiez le fichier .env`);
  }

  console.log(`🔧 Actions suggérées:`);
  console.log(`   • Si des scrapers échouent, vérifiez la connectivité internet`);
  console.log(
    `   • Si VIX scraper échoue, les sites utilisent probablement une protection anti-bot`
  );
  console.log(`   • Les sources RSS sont plus fiables que le scraping HTML`);
  console.log(`   • Considérez ajouter des proxies si nécessaire pour le scraping`);

  await pool.end();
}

if (require.main === module) {
  testScrapers()
    .then(() => console.log('\n✅ Tests terminés!'))
    .catch(error =>
      console.error('\n❌ Erreur:', error instanceof Error ? error.message : String(error))
    );
}

export { testScrapers };
