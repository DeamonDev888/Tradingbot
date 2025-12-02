#!/usr/bin/env ts-node

import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'financial_analyst',
  user: 'postgres',
  password: '9022',
});

async function databaseCleanup() {
  console.log('🧹 DÉMARRAGE DU NETTOYAGE DE LA BASE DE DONNÉES\n');

  const client = await pool.connect();

  try {
    // 1. Supprimer les doublons dans news_items
    console.log('🗑️  ÉTAPE 1: Suppression des doublons dans news_items...');

    const duplicatesQuery = `
      WITH duplicates AS (
        SELECT ctid, ROW_NUMBER() OVER (PARTITION BY title, source ORDER BY created_at DESC) as rn
        FROM news_items
        WHERE title IS NOT NULL AND source IS NOT NULL
      )
      DELETE FROM news_items
      WHERE ctid IN (SELECT ctid FROM duplicates WHERE rn > 1);
    `;

    const duplicateResult = await client.query(duplicatesQuery);
    console.log(`✅ ${duplicateResult.rowCount} doublons supprimés`);

    // 2. Nettoyer les données de test/inutiles
    console.log('\n🗑️  ÉTAPE 2: Nettoyage des données de test...');

    const testDataQuery = `
      DELETE FROM news_items
      WHERE source = 'TEST' OR source LIKE '%TEST%'
      OR title LIKE '%test%' OR title LIKE '%Test%';
    `;

    const testDataResult = await client.query(testDataQuery);
    console.log(`✅ ${testDataResult.rowCount} enregistrements de test supprimés`);

    // 3. Supprimer les anciennes données (plus de 6 mois pour news, plus de 1 an pour market_data)
    console.log('\n🗑️  ÉTAPE 3: Suppression des anciennes données...');

    const oldNewsQuery = `
      DELETE FROM news_items
      WHERE created_at < NOW() - INTERVAL '6 months';
    `;

    const oldNewsResult = await client.query(oldNewsQuery);
    console.log(`✅ ${oldNewsResult.rowCount} anciennes news supprimées (>6 mois)`);

    const oldMarketDataQuery = `
      DELETE FROM market_data
      WHERE timestamp < NOW() - INTERVAL '1 year';
    `;

    const oldMarketDataResult = await client.query(oldMarketDataQuery);
    console.log(`✅ ${oldMarketDataResult.rowCount} anciennes données marché supprimées (>1 an)`);

    // 4. Optimiser la base de données (VACUUM)
    console.log('\n🔧 ÉTAPE 4: Optimisation de la base de données...');

    await client.query('VACUUM ANALYZE news_items;');
    await client.query('VACUUM ANALYZE sentiment_analyses;');
    await client.query('VACUUM ANALYZE market_data;');
    console.log('✅ VACUUM ANALYZE complété');

    // 5. Créer les index recommandés
    console.log('\n📊 ÉTAPE 5: Création des index de performance...');

    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_news_items_created_at ON news_items(created_at DESC);',
      'CREATE INDEX IF NOT EXISTS idx_news_items_source ON news_items(source);',
      "CREATE INDEX IF NOT EXISTS idx_news_items_title_gin ON news_items USING gin(to_tsvector('english', title));",
      'CREATE INDEX IF NOT EXISTS idx_sentiment_analyses_created_at ON sentiment_analyses(created_at DESC);',
      'CREATE INDEX IF NOT EXISTS idx_sentiment_analyses_score ON sentiment_analyses(score);',
      'CREATE INDEX IF NOT EXISTS idx_market_data_timestamp ON market_data(timestamp DESC);',
      'CREATE INDEX IF NOT EXISTS idx_market_data_asset_type ON market_data(asset_type);',
      'CREATE INDEX IF NOT EXISTS idx_market_data_symbol ON market_data(symbol);',
      'CREATE INDEX IF NOT EXISTS idx_market_data_asset_time ON market_data(asset_type, timestamp DESC);',
      'CREATE INDEX IF NOT EXISTS idx_news_source_time ON news_items(source, created_at DESC);',
    ];

    for (const indexSql of indexes) {
      try {
        await client.query(indexSql);
        console.log(`✅ Index créé: ${indexSql.split('idx_')[1]?.split(' ')[0] || 'inconnu'}`);
      } catch (error: unknown) {
        console.log(
          `⚠️  Index déjà existant ou erreur: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // 6. Statistiques après nettoyage
    console.log('\n📊 STATISTIQUES APRÈS NETTOYAGE:');

    const finalStatsQuery = `
      SELECT
        'news_items' as table_name, COUNT(*) as total_rows, MAX(created_at) as last_update
      FROM news_items
      UNION ALL
      SELECT
        'sentiment_analyses' as table_name, COUNT(*) as total_rows, MAX(created_at) as last_update
      FROM sentiment_analyses
      UNION ALL
      SELECT
        'market_data' as table_name, COUNT(*) as total_rows, MAX(timestamp) as last_update
      FROM market_data;
    `;

    const finalStats = await client.query(finalStatsQuery);
    console.table(finalStats.rows);

    // 7. Vérification finale des doublons
    console.log('\n🔍 VÉRIFICATION FINALE DES DOUBLONS:');

    const finalDuplicatesQuery = `
      SELECT COUNT(*) as remaining_duplicates
      FROM (
        SELECT title, source
        FROM news_items
        WHERE title IS NOT NULL AND source IS NOT NULL
        GROUP BY title, source
        HAVING COUNT(*) > 1
      ) as dups;
    `;

    const finalDuplicatesResult = await client.query(finalDuplicatesQuery);
    const remainingDuplicates = parseInt(finalDuplicatesResult.rows[0].remaining_duplicates);

    if (remainingDuplicates === 0) {
      console.log('✅ Aucun doublon restant');
    } else {
      console.log(`⚠️  ${remainingDuplicates} doublons restants`);
    }

    console.log('\n📈 RECOMMANDATIONS DE MAINTENANCE FUTURE:');
    console.log('• Exécuter ce script de nettoyage chaque mois');
    console.log('• Surveiller les sources qui génèrent des doublons');
    console.log('• Mettre en place une validation en entrée pour éviter les doublons');
    console.log('• Configurer un job automatique pour nettoyer les anciennes données');
  } catch (error: unknown) {
    console.error(
      '❌ Erreur lors du nettoyage:',
      error instanceof Error ? error.message : String(error)
    );
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  databaseCleanup()
    .then(() => console.log('\n✅ Nettoyage terminé avec succès!'))
    .catch(error =>
      console.error('\n❌ Erreur:', error instanceof Error ? error.message : String(error))
    );
}

export { databaseCleanup };
