#!/usr/bin/env ts-node

import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'financial_analyst',
  user: 'postgres',
  password: '9022',
});

async function quickDatabaseAnalysis() {
  console.log('🔍 ANALYSE RAPIDE DE LA BASE DE DONNÉES FINANCIAL ANALYST\n');

  const client = await pool.connect();

  try {
    // 1. Statistiques générales
    console.log('📊 STATISTIQUES GÉNÉRALES:\n');
    const statsQuery = `
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
      FROM market_data
      UNION ALL
      SELECT
        'economic_events' as table_name, COUNT(*) as total_rows, MAX(created_at) as last_update
      FROM economic_events;
    `;

    const statsResult = await client.query(statsQuery);
    console.table(statsResult.rows);

    // 2. Doublons dans news_items
    console.log('\n🚨 DOUBLONS DÉTECTÉS:\n');
    const duplicatesQuery = `
      SELECT title, source, COUNT(*) as count
      FROM news_items
      WHERE title IS NOT NULL
      GROUP BY title, source
      HAVING COUNT(*) > 1
      ORDER BY count DESC
      LIMIT 10;
    `;

    const duplicatesResult = await client.query(duplicatesQuery);
    if (duplicatesResult.rows.length > 0) {
      console.table(duplicatesResult.rows);
    } else {
      console.log('✅ Aucun doublon trouvé dans les 10 premiers résultats');
    }

    // 3. Données manquantes
    console.log('\n📝 DONNÉES MANQUANTES:\n');
    const missingDataQuery = `
      SELECT
        'news_items - URL NULL' as issue, COUNT(*) as count
      FROM news_items WHERE url IS NULL OR url = ''
      UNION ALL
      SELECT
        'news_items - Titre NULL' as issue, COUNT(*) as count
      FROM news_items WHERE title IS NULL OR title = ''
      UNION ALL
      SELECT
        'sentiment_analyses - Score NULL' as issue, COUNT(*) as count
      FROM sentiment_analyses WHERE score IS NULL
      UNION ALL
      SELECT
        'market_data - Prix NULL' as issue, COUNT(*) as count
      FROM market_data WHERE price IS NULL OR price <= 0;
    `;

    const missingResult = await client.query(missingDataQuery);
    console.table(missingResult.rows);

    // 4. Incohérences dans sentiment_analyses
    console.log('\n⚠️ INCOHÉRENCES DANS SENTIMENT_ANALYSES:\n');
    const inconsistencyQuery = `
      SELECT
        overall_sentiment,
        score,
        CASE
          WHEN overall_sentiment = 'Bullish' AND score < 0 THEN 'Bullish avec score négatif'
          WHEN overall_sentiment = 'Bearish' AND score > 0 THEN 'Bearish avec score positif'
          WHEN overall_sentiment = 'Neutral' AND ABS(score) > 20 THEN 'Neutral avec score extrême'
          ELSE 'OK'
        END as coherence_check,
        created_at
      FROM sentiment_analyses
      WHERE (overall_sentiment = 'Bullish' AND score < 0)
         OR (overall_sentiment = 'Bearish' AND score > 0)
         OR (overall_sentiment = 'Neutral' AND ABS(score) > 20)
      ORDER BY created_at DESC
      LIMIT 10;
    `;

    const inconsistencyResult = await client.query(inconsistencyQuery);
    if (inconsistencyResult.rows.length > 0) {
      console.table(inconsistencyResult.rows);
    } else {
      console.log('✅ Aucune incohérence trouvée dans les analyses de sentiment');
    }

    // 5. Problèmes dans market_data
    console.log('\n📈 PROBLÈMES DANS MARKET_DATA:\n');
    const marketIssuesQuery = `
      SELECT
        asset_type,
        symbol,
        price,
        change_percent,
        CASE
          WHEN price IS NULL OR price <= 0 THEN 'Prix invalide'
          WHEN change_percent IS NULL THEN 'Pourcentage manquant'
          WHEN timestamp > NOW() THEN 'Timestamp futur'
          WHEN timestamp < NOW() - INTERVAL '7 days' THEN 'Donnée ancienne'
          ELSE 'OK'
        END as issue_type,
        timestamp
      FROM market_data
      WHERE (price IS NULL OR price <= 0)
         OR change_percent IS NULL
         OR timestamp > NOW()
         OR timestamp < NOW() - INTERVAL '7 days'
      ORDER BY timestamp DESC
      LIMIT 10;
    `;

    const marketIssuesResult = await client.query(marketIssuesQuery);
    if (marketIssuesResult.rows.length > 0) {
      console.table(marketIssuesResult.rows);
    } else {
      console.log('✅ Aucun problème trouvé dans market_data (limité aux 7 derniers jours)');
    }

    // 6. Activité des sources
    console.log('\n📡 ACTIVITÉ DES SOURCES:\n');
    const sourcesQuery = `
      SELECT
        source,
        COUNT(*) as total_news,
        MAX(created_at) as last_activity,
        EXTRACT(EPOCH FROM (NOW() - MAX(created_at)))/3600 as hours_inactive
      FROM news_items
      GROUP BY source
      ORDER BY last_activity DESC;
    `;

    const sourcesResult = await client.query(sourcesQuery);
    console.table(sourcesResult.rows);

    // 7. Synthèse et recommandations
    console.log('\n📋 SYNTHÈSE ET RECOMMANDATIONS:\n');

    const totalNews = parseInt(
      statsResult.rows.find(r => r.table_name === 'news_items')?.total_rows || '0'
    );
    const totalSentiments = parseInt(
      statsResult.rows.find(r => r.table_name === 'sentiment_analyses')?.total_rows || '0'
    );
    const totalMarketData = parseInt(
      statsResult.rows.find(r => r.table_name === 'market_data')?.total_rows || '0'
    );

    const hasMissingData = missingResult.rows.some(row => parseInt(row.count) > 0);
    const hasInconsistencies = inconsistencyResult.rows.length > 0;
    const hasMarketIssues = marketIssuesResult.rows.length > 0;
    const hasDuplicates = duplicatesResult.rows.length > 0;

    console.log(`📊 STATISTIQUES GLOBALES:`);
    console.log(`   • News: ${totalNews} articles`);
    console.log(`   • Sentiments: ${totalSentiments} analyses`);
    console.log(`   • Market Data: ${totalMarketData} points`);

    console.log(`\n🚨 PROBLÈMES IDENTIFIÉS:`);

    if (hasMissingData) {
      console.log(`   ❌ Données manquantes détectées`);
    }
    if (hasDuplicates) {
      console.log(`   ❌ Doublons détectés`);
    }
    if (hasInconsistencies) {
      console.log(`   ❌ Incohérences dans les analyses de sentiment`);
    }
    if (hasMarketIssues) {
      console.log(`   ❌ Problèmes dans les données de marché`);
    }

    if (!hasMissingData && !hasDuplicates && !hasInconsistencies && !hasMarketIssues) {
      console.log(`   ✅ Aucun problème critique détecté`);
    }

    console.log(`\n🔧 ACTIONS RECOMMANDÉES:`);
    if (hasMissingData) {
      console.log(`   • Nettoyer les enregistrements avec des valeurs NULL`);
    }
    if (hasDuplicates) {
      console.log(`   • Supprimer les doublons dans news_items`);
    }
    if (hasInconsistencies) {
      console.log(`   • Corriger les incohérences sentiment/score`);
    }
    if (hasMarketIssues) {
      console.log(`   • Valider les timestamps et prix dans market_data`);
    }

    const inactiveSources = sourcesResult.rows.filter(row => parseFloat(row.hours_inactive) > 24);
    if (inactiveSources.length > 0) {
      console.log(
        `   • Vérifier les sources inactives: ${inactiveSources.map(s => s.source).join(', ')}`
      );
    }

    console.log(`\n🚀 AMÉLIORATIONS DE PERFORMANCE:`);
    console.log(`   • Ajouter des index sur created_at, source, symbol`);
    console.log(`   • Nettoyer les données anciennes (>1 an)`);
    console.log(`   • Mettre en place un monitoring des sources`);
  } catch (error: unknown) {
    console.error(
      "❌ Erreur lors de l'analyse:",
      error instanceof Error ? error.message : String(error)
    );
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  quickDatabaseAnalysis()
    .then(() => console.log('\n✅ Analyse terminée avec succès!'))
    .catch(error =>
      console.error('\n❌ Erreur:', error instanceof Error ? error.message : String(error))
    );
}

export { quickDatabaseAnalysis };
