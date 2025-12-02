const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'financial_analyst',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '9022',
});

async function checkVixData() {
  try {
    console.log('🔍 VÉRIFICATION DES DONNÉES VIX DANS LA BASE...');

    // Vérifier la table market_data
    const marketDataQuery = await pool.query(
      "SELECT * FROM market_data WHERE symbol = 'VIX' ORDER BY timestamp DESC LIMIT 10"
    );

    console.log(`📊 Market Data Results: ${marketDataQuery.rows.length} rows`);

    if (marketDataQuery.rows.length > 0) {
      marketDataQuery.rows.forEach((row, index) => {
        console.log(
          `   [${index + 1}] ${new Date(row.timestamp).toLocaleString('fr-FR')} - ${row.source}: ${row.price || 'NULL'} | ${row.asset_type || 'N/A'}`
        );
      });
    }

    // Vérifier la table news_items
    const newsQuery = await pool.query(
      "SELECT * FROM news_items WHERE source ILIKE '%VIX%' OR title ILIKE '%VIX%' OR title ILIKE '%volatilit%' ORDER BY published_at DESC LIMIT 10"
    );

    console.log(`📰 News Items Results: ${newsQuery.rows.length} rows`);

    if (newsQuery.rows.length > 0) {
      newsQuery.rows.forEach((row, index) => {
        console.log(
          `   [${index + 1}] ${new Date(row.published_at).toLocaleString('fr-FR')} - ${row.source}: ${row.title.substring(0, 60)}...`
        );
      });
    }

    console.log('✅ Vérification terminée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await pool.end();
  }
}

checkVixData().catch(console.error);
