import { Pool } from 'pg';
import { TradingEconomicsScraper } from '../ingestion/TradingEconomicsScraper';
import { NewsAggregator } from '../ingestion/NewsAggregator';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'financial_analyst',
  user: 'postgres',
  password: '9022',
});

async function compareScrapeVsDb() {
  console.log('🔍 STARTING COMPARISON: SCRAPED DATA vs DATABASE\n');
  const client = await pool.connect();

  try {
    // --- 1. TRADING ECONOMICS ---
    console.log('📊 1. TRADING ECONOMICS COMPARISON');
    const teScraper = new TradingEconomicsScraper();
    console.log('   Running scraper...');
    const scrapedEvents = await teScraper.scrapeUSCalendar();
    console.log(`   > Scraped: ${scrapedEvents.length} events`);

    if (scrapedEvents.length > 0) {
      // Check DB for these specific events
      // We'll check the last few events to see if they exist
      const sampleEvents = scrapedEvents.slice(0, 5);
      let matchCount = 0;
      let mismatchCount = 0;

      for (const event of sampleEvents) {
        const res = await client.query(
          `SELECT * FROM economic_events 
           WHERE event_name = $1 AND country = $2 AND event_date = $3`,
          [event.event, event.country, event.date]
        );

        if (res.rows.length > 0) {
          const dbEvent = res.rows[0];
          if (dbEvent.actual === event.actual && dbEvent.forecast === event.forecast) {
            matchCount++;
          } else {
            mismatchCount++;
          }
        }
      }
      console.log(
        `   > Sample Check (5 items): ${matchCount} matches, ${mismatchCount} mismatches`
      );

      // Check total count in DB for today/future
      const dbCountRes = await client.query('SELECT COUNT(*) FROM economic_events');
      console.log(`   > Database Total: ${dbCountRes.rows[0].count} events`);

      // Check for duplicates
      const dupRes = await client.query(`
        SELECT event_name, event_date, COUNT(*) 
        FROM economic_events 
        GROUP BY event_name, event_date 
        HAVING COUNT(*) > 1
      `);
      if (dupRes.rows.length > 0) {
        console.log(`   ❌ DUPLICATES FOUND: ${dupRes.rows.length} duplicate events!`);
      } else {
        console.log(`   ✅ No duplicates found.`);
      }
    }

    // --- 2. NEWS AGGREGATOR ---
    console.log('\n📰 2. NEWS AGGREGATOR COMPARISON');
    const newsAggregator = new NewsAggregator();

    // Fetch a sample from one source to be quick (e.g., CNBC)
    console.log('   Fetching CNBC news (live)...');
    const cnbcNews = await newsAggregator.fetchCNBCMarketNews();
    console.log(`   > Scraped: ${cnbcNews.length} items`);

    if (cnbcNews.length > 0) {
      let foundInDb = 0;
      for (const item of cnbcNews) {
        const res = await client.query(
          'SELECT * FROM news_items WHERE title = $1 AND source = $2',
          [item.title, item.source]
        );
        if (res.rows.length > 0) foundInDb++;
      }
      console.log(
        `   > Found in DB: ${foundInDb}/${cnbcNews.length} (This is good if you ran the pipeline recently)`
      );

      if (foundInDb < cnbcNews.length) {
        console.log(
          '   ℹ️ Some items are new and not yet in DB (Normal if pipeline not running continuously)'
        );
      }
    }

    // Check for duplicates in News
    const newsDup = await client.query(`
        SELECT title, source, COUNT(*) 
        FROM news_items 
        GROUP BY title, source 
        HAVING COUNT(*) > 1
    `);
    if (newsDup.rows.length > 0) {
      console.log(`   ❌ DUPLICATES FOUND: ${newsDup.rows.length} duplicate news items!`);
      console.log('   Optimization Tip: Ensure "ON CONFLICT" clause is used in INSERTs.');
    } else {
      console.log(`   ✅ No duplicates found in News.`);
    }

    // --- 3. VIX DATA ---
    console.log('\n📉 3. VIX DATA COMPARISON');
    // We won't run the full scraper as it takes time, but we'll check the DB structure
    const vixData = await client.query(`
        SELECT * FROM market_data 
        WHERE symbol = 'VIX' OR symbol = '^VIX' 
        ORDER BY timestamp DESC LIMIT 5
    `);
    console.log(`   > Recent VIX entries in DB: ${vixData.rows.length}`);
    if (vixData.rows.length > 0) {
      vixData.rows.forEach(r => console.log(`     [${r.timestamp.toISOString()}] ${r.price}`));
    } else {
      console.log('   ⚠️ No VIX data found in market_data table.');
    }
  } catch (error) {
    console.error('❌ Error during comparison:', error);
  } finally {
    client.release();
    pool.end();
  }
}

compareScrapeVsDb();
