const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'financial_analyst',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '9022',
});

async function checkVixDataStructure() {
  try {
    console.log('🔍 Vérification structure tables VIX...');

    // Vérifier la structure de vix_data
    const vixDataColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'vix_data'
      ORDER BY ordinal_position
    `);

    if (vixDataColumns.rows.length === 0) {
      console.log('❌ Table vix_data non trouvée');
    } else {
      console.log('\n📋 Structure table vix_data:');
      vixDataColumns.rows.forEach(col => {
        console.log(
          `   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`
        );
      });
    }

    // Vérifier la structure de market_data pour comparaison
    const marketDataColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'market_data'
      AND table_name IN ('market_data', 'vix_data')
      ORDER BY table_name, ordinal_position
    `);

    console.log('\n📋 Structure tables disponibles:');
    marketDataColumns.rows.forEach(col => {
      console.log(
        `   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`
      );
    });

    // Vérifier les données récentes
    console.log('\n📊 Données VIX récentes:');

    // Essayer vix_data
    try {
      const vixData = await pool.query(`
        SELECT * FROM vix_data
        ORDER BY created_at DESC
        LIMIT 3
      `);

      console.log(`   vix_data: ${vixData.rows.length} enregistrements`);
      vixData.rows.forEach((row, i) => {
        console.log(
          `     [${i + 1}] ${row.source || 'N/A'}: ${row.value || row.price || 'N/A'} (${row.created_at})`
        );
      });
    } catch (error) {
      console.log(`   vix_data: Erreur - ${error.message}`);
    }

    // Essayer market_data avec VIX
    try {
      const marketData = await pool.query(`
        SELECT * FROM market_data
        WHERE symbol = 'VIX'
        ORDER BY created_at DESC
        LIMIT 3
      `);

      console.log(`   market_data (VIX): ${marketData.rows.length} enregistrements`);
      marketData.rows.forEach((row, i) => {
        console.log(`     [${i + 1}] ${row.source}: ${row.price} (${row.created_at})`);
      });
    } catch (error) {
      console.log(`   market_data: Erreur - ${error.message}`);
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

checkVixDataStructure();
