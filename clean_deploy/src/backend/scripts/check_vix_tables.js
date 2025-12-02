const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'financial_analyst',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '9022',
});

async function checkVixTables() {
  try {
    console.log('🔍 Vérification des tables VIX...');

    // Vérifier si les tables existent
    const tablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE '%vix%'
      ORDER BY table_name;
    `;

    const tablesResult = await pool.query(tablesQuery);

    if (tablesResult.rows.length === 0) {
      console.log('   Aucune table VIX trouvée');
    } else {
      console.log('   Tables VIX trouvées:');
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    }

    // Vérifier la table market_data pour le VIX
    const marketDataQuery = `
      SELECT COUNT(*) as count, MIN(timestamp) as oldest, MAX(timestamp) as newest
      FROM market_data
      WHERE symbol = 'VIX'
    `;

    const marketDataResult = await pool.query(marketDataQuery);
    const marketDataCount = parseInt(marketDataResult.rows[0].count);

    console.log(`\n📊 Données VIX dans market_data: ${marketDataCount} enregistrements`);
    if (marketDataCount > 0) {
      console.log(`   Plus ancien: ${marketDataResult.rows[0].oldest}`);
      console.log(`   Plus récent: ${marketDataResult.rows[0].newest}`);
    }

    // Vérifier si nous avons des analyses RougePulse
    const rougePulseQuery = `
      SELECT COUNT(*) as count
      FROM rouge_pulse_analyses
    `;

    const rougePulseResult = await pool.query(rougePulseQuery);
    const rougePulseCount = parseInt(rougePulseResult.rows[0].count);

    console.log(`\n📈 Analyses RougePulse: ${rougePulseCount} enregistrements`);

    console.log('\n✅ Vérification terminée');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

checkVixTables();
