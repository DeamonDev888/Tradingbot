#!/usr/bin/env ts-node

import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'financial_analyst',
  user: 'postgres',
  password: '9022',
});

async function checkNewsWithDates() {
  try {
    // D'abord vérifier les tables disponibles
    const tablesResult = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );

    console.log('📊 TABLES DISPONIBLES:');
    console.log('='.repeat(50));
    tablesResult.rows.forEach((row, i) => {
      console.log(`${i + 1}. ${row.table_name}`);
    });
    console.log('');

    // Chercher les news dans la table news_items
    try {
      const result = await pool.query(
        'SELECT title, published_at, created_at, source, url FROM news_items ORDER BY created_at DESC LIMIT 10'
      );

      if (result.rows.length > 0) {
        console.log('📰 DERNIÈRES NEWS AVEC DATES:');
        console.log('='.repeat(80));

        result.rows.forEach((row, i) => {
          console.log(`${i + 1}. ${row.title.substring(0, 80)}...`);
          console.log(`   📅 Date: ${row.published_at || row.created_at}`);
          console.log(`   🌐 Source: ${row.source || 'N/A'}`);
          console.log(`   🔗 URL: ${row.url ? row.url.substring(0, 60) + '...' : 'N/A'}`);
          console.log('');
        });

        console.log(`✅ Total news trouvées: ${result.rows.length}`);
      } else {
        console.log('❌ Aucune news trouvée dans la table news_items');
      }
    } catch (e) {
      console.error('❌ Erreur lors de la récupération des news:', e);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  checkNewsWithDates();
}