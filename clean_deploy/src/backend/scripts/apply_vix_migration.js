const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'financial_analyst',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '9022',
});

async function applyVixMigration() {
  console.log('🚀 Application de la migration VIX...');

  try {
    // Extension UUID
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✅ Extension UUID-ossp activée');

    // Table vix_data
    const createVixData = `
      CREATE TABLE IF NOT EXISTS vix_data (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          symbol VARCHAR(10) NOT NULL DEFAULT 'VIX',
          value DECIMAL(10,2) NOT NULL,
          change_abs DECIMAL(8,2),
          change_pct DECIMAL(8,2),
          previous_close DECIMAL(10,2),
          open DECIMAL(10,2),
          high DECIMAL(10,2),
          low DECIMAL(10,2),
          source VARCHAR(100) NOT NULL,
          last_update TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await pool.query(createVixData);
    console.log('✅ Table vix_data créée');

    // Table vix_analysis
    const createVixAnalysis = `
      CREATE TABLE IF NOT EXISTS vix_analysis (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          analysis_data JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await pool.query(createVixAnalysis);
    console.log('✅ Table vix_analysis créée');

    // Index
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_vix_data_symbol ON vix_data(symbol)',
      'CREATE INDEX IF NOT EXISTS idx_vix_data_source ON vix_data(source)',
      'CREATE INDEX IF NOT EXISTS idx_vix_data_created_at ON vix_data(created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_vix_data_last_update ON vix_data(last_update DESC)',
      'CREATE INDEX IF NOT EXISTS idx_vix_analysis_created_at ON vix_analysis(created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_vix_analysis_data_gin ON vix_analysis USING GIN (analysis_data)',
    ];

    for (const index of indexes) {
      await pool.query(index);
    }
    console.log('✅ Index créés');

    // Vues
    const createLatestView = `
      CREATE OR REPLACE VIEW latest_vix_data AS
      SELECT
          id,
          symbol,
          value,
          change_abs,
          change_pct,
          previous_close,
          open,
          high,
          low,
          source,
          last_update,
          created_at
      FROM vix_data
      WHERE created_at >= NOW() - INTERVAL '7 days'
      ORDER BY created_at DESC
    `;
    await pool.query(createLatestView);
    console.log('✅ Vue latest_vix_data créée');

    const createSourceView = `
      CREATE OR REPLACE VIEW vix_data_by_source AS
      SELECT
          source,
          COUNT(*) as data_count,
          AVG(value) as avg_value,
          MAX(value) as max_value,
          MIN(value) as min_value,
          MAX(created_at) as last_update
      FROM vix_data
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY source
      ORDER BY last_update DESC
    `;
    await pool.query(createSourceView);
    console.log('✅ Vue vix_data_by_source créée');

    // Insérer des données de test si la table est vide
    const testData = await pool.query('SELECT COUNT(*) as count FROM vix_data');
    if (parseInt(testData.rows[0].count) === 0) {
      const insertTest = `
        INSERT INTO vix_data (symbol, value, change_abs, change_pct, source, last_update)
        VALUES
          ('VIX', 17.19, -0.45, -2.55, 'Investing.com', NOW()),
          ('VIX', 17.25, -0.39, -2.21, 'Yahoo Finance', NOW() - INTERVAL '5 minutes'),
          ('VIX', 17.31, -0.33, -1.87, 'MarketWatch', NOW() - INTERVAL '10 minutes')
      `;
      await pool.query(insertTest);
      console.log('✅ Données de test insérées');
    }

    console.log('\n🎉 Migration VIX terminée avec succès !');
    console.log('   - Tables vix_data et vix_analysis créées');
    console.log('   - Index optimisés');
    console.log('   - Vues de données créées');
    console.log('   - Données de test disponibles');
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

applyVixMigration().catch(console.error);
