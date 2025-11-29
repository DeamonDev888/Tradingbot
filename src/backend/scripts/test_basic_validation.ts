#!/usr/bin/env ts-node

import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

class SimpleValidationTest {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'financial_analyst',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '9022',
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      console.log('✅ Base de données accessible');
      return true;
    } catch (error) {
      console.log(
        '❌ Base de données inaccessible:',
        error instanceof Error ? error.message : error
      );
      return false;
    }
  }

  async basicAnalysis(): Promise<number> {
    console.log('📊 Analyse basique de la base de données...');

    const client = await this.pool.connect();
    try {
      // Statistiques générales
      const stats = await client.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE published_at >= NOW() - INTERVAL '24 hours') as recent_24h,
          COUNT(*) FILTER (WHERE published_at >= NOW() - INTERVAL '7 days') as recent_7d,
          COUNT(DISTINCT source) as sources_count
        FROM news_items
      `);

      if (stats.rows.length > 0) {
        const data = stats.rows[0];
        console.log(`   • Total news: ${parseInt(data.total).toLocaleString()}`);
        console.log(`   • News 24 dernières heures: ${parseInt(data.recent_24h).toLocaleString()}`);
        console.log(`   • News 7 derniers jours: ${parseInt(data.recent_7d).toLocaleString()}`);
        console.log(`   • Sources uniques: ${parseInt(data.sources_count).toLocaleString()}`);

        // Analyse par source
        const sourceStats = await client.query(`
          SELECT source, COUNT(*) as count
          FROM news_items
          WHERE published_at >= NOW() - INTERVAL '7 days'
          GROUP BY source
          ORDER BY count DESC
          LIMIT 10
        `);

        console.log('\n📈 Top 10 sources (7 derniers jours):');
        sourceStats.rows.forEach((row, index) => {
          console.log(
            `   ${index + 1}. ${row.source}: ${parseInt(row.count).toLocaleString()} items`
          );
        });

        // Analyse par sentiment
        const sentimentStats = await client.query(`
          SELECT
            COALESCE(sentiment, 'unspecified') as sentiment,
            COUNT(*) as count
          FROM news_items
          WHERE published_at >= NOW() - INTERVAL '7 days'
          GROUP BY COALESCE(sentiment, 'unspecified')
          ORDER BY count DESC
        `);

        console.log('\n💭 Distribution par sentiment (7 derniers jours):');
        sentimentStats.rows.forEach(row => {
          console.log(`   • ${row.sentiment}: ${parseInt(row.count).toLocaleString()} items`);
        });

        // Qualité des données
        console.log('\n🔍 Qualité des données:');

        // Titres vides
        const emptyTitles = await client.query(`
          SELECT COUNT(*) as count
          FROM news_items
          WHERE title IS NULL OR TRIM(title) = ''
        `);

        const emptyCount = parseInt(emptyTitles.rows[0].count);
        if (emptyCount > 0) {
          console.log(`   • Titres vides: ${emptyCount} ⚠️`);
        } else {
          console.log(`   • Titres vides: ${emptyCount} ✅`);
        }

        // URLs invalides
        const invalidUrls = await client.query(`
          SELECT COUNT(*) as count
          FROM news_items
          WHERE url IS NULL OR url NOT LIKE 'http%'
        `);

        const invalidCount = parseInt(invalidUrls.rows[0].count);
        if (invalidCount > 0) {
          console.log(`   • URLs invalides: ${invalidCount} ⚠️`);
        } else {
          console.log(`   • URLs invalides: ${invalidCount} ✅`);
        }

        // Doublons
        const duplicates = await client.query(`
          SELECT COUNT(*) - COUNT(DISTINCT url) as duplicates
          FROM news_items
          WHERE published_at >= NOW() - INTERVAL '7 days'
        `);

        const duplicateCount = parseInt(duplicates.rows[0].duplicates);
        const totalRecent = parseInt(data.recent_7d);
        const duplicateRate =
          totalRecent > 0 ? ((duplicateCount / totalRecent) * 100).toFixed(1) : 0;

        if (duplicateCount > 0) {
          console.log(`   • Doublons: ${duplicateCount} (${duplicateRate}%) ⚠️`);
        } else {
          console.log(`   • Doublons: ${duplicateCount} (${duplicateRate}%) ✅`);
        }

        // Score global
        let score = 100;
        if (emptyCount > 0) score -= Math.min(20, (emptyCount / totalRecent) * 100);
        if (invalidCount > 0) score -= Math.min(20, (invalidCount / totalRecent) * 100);
        if (duplicateCount > totalRecent * 0.05)
          score -= Math.min(15, (duplicateCount / totalRecent) * 100);

        const scoreEmoji = score >= 80 ? '🟢' : score >= 60 ? '🟡' : '🔴';
        console.log(`\n${scoreEmoji} SCORE DE QUALITÉ GLOBAL: ${score}/100`);

        return score;
      } else {
        console.log('   ⚠️ Aucune donnée trouvée');
        return 0;
      }
    } finally {
      client.release();
    }
  }

  async checkTables(): Promise<void> {
    console.log('🗄️ Vérification des tables de la base de données...');

    const client = await this.pool.connect();
    try {
      const tables = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);

      const expectedTables = [
        'news_items',
        'sentiment_analyses',
        'news_sources',
        'market_data',
        'scraping_sessions',
        'economic_events',
        'rouge_pulse_analyses',
      ];

      console.log('\n📋 Tables trouvées:');
      tables.rows.forEach(row => {
        const status = expectedTables.includes(row.table_name) ? '✅' : '❓';
        console.log(`   ${status} ${row.table_name}`);
      });

      const missingTables = expectedTables.filter(
        table => !tables.rows.some(row => row.table_name === table)
      );

      if (missingTables.length > 0) {
        console.log('\n⚠️ Tables manquantes:');
        missingTables.forEach(table => {
          console.log(`   ❌ ${table}`);
        });
      }
    } finally {
      client.release();
    }
  }

  async checkIndexes(): Promise<void> {
    console.log('📇 Vérification des index...');

    const client = await this.pool.connect();
    try {
      const indexes = await client.query(`
        SELECT
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname
      `);

      const indexInfo: Record<string, string[]> = {};

      indexes.rows.forEach(row => {
        if (!indexInfo[row.tablename]) {
          indexInfo[row.tablename] = [];
        }
        indexInfo[row.tablename].push(row.indexname);
      });

      console.log('\n📊 Tables avec index:');
      Object.entries(indexInfo).forEach(([table, indexes]) => {
        console.log(`   📋 ${table}: ${indexes.length} index(es)`);
        indexes.slice(0, 3).forEach(index => {
          console.log(`      • ${index}`);
        });
        if (indexes.length > 3) {
          console.log(`      • ... et ${indexes.length - 3} autres`);
        }
      });
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
    console.log('🔌 Connexion à la base de données fermée');
  }
}

// Script principal
if (require.main === module) {
  const validator = new SimpleValidationTest();

  console.log('🧪 VALIDATION DE BASE SIMPLE POUR SYSTÈME DE SCRAPING');
  console.log('='.repeat(80));

  try {
    // Test de connexion
    console.log('\n1️⃣ Test de connexion à la base de données...');
    const isConnected = await validator.testConnection();

    if (!isConnected) {
      console.log('\n❌ IMPOSSIBLE DE CONTINUER - Connexion à la base de données échouée');
      console.log('Vérifiez:');
      console.log('   • Que PostgreSQL est démarré');
      console.log(
        '   • Les identifiants dans .env (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)'
      );
      console.log('   • Que la base de données "financial_analyst" existe');
      process.exit(1);
    }

    // Vérification des tables
    await validator.checkTables();

    // Analyse basique
    const score = await validator.basicAnalysis();

    // Vérification des index
    await validator.checkIndexes();

    // Évaluation finale
    console.log('\n' + '='.repeat(80));
    console.log('📋 RÉSULTATS FINAUX DE LA VALIDATION');
    console.log('='.repeat(80));

    if (score >= 80) {
      console.log('🟢 SYSTÈME DE TRÈS BONNE QUALITÉ');
      console.log('   • La base de données est bien structurée');
      console.log('   • Les données sont de bonne qualité');
      console.log('   • Le scraping fonctionne correctement');
      console.log('\n💡 Recommandations:');
      console.log('   • Continuer la maintenance régulière');
      console.log('   • Mettre en place des alertes automatiques');
      console.log('   • Démarrer le service de maintenance automatisée');
    } else if (score >= 60) {
      console.log('🟡 SYSTÈME DE QUALITÉ ACCEPTABLE');
      console.log('   • Quelques améliorations possibles');
      console.log('\n💡 Recommandations:');
      console.log('   • Corriger les problèmes de qualité identifiés');
      console.log('   • Améliorer la déduplication');
      console.log('   • Optimiser les requêtes de scraping');
    } else {
      console.log('🔴 SYSTÈME NÉCESSITE DES AMÉLIORATIONS');
      console.log('   • Problèmes importants détectés');
      console.log('\n💡 Actions immédiates requises:');
      console.log('   • Nettoyer les données corrompues');
      console.log('   • Corriger la déduplication');
      console.log('   • Améliorer la validation des données');
      console.log('   • Réviser la configuration des scrapers');
    }

    console.log(`\n📊 SCORE FINAL: ${score}/100`);
  } catch (error) {
    console.error('\n❌ ERREUR CRITIQUE PENDANT LA VALIDATION:', error);
    console.log('Vérifiez:');
    console.log('   • La configuration de la base de données');
    console.log('   • Les permissions utilisateur');
    console.log("   • L'état du service PostgreSQL");
    process.exit(2);
  } finally {
    await validator.close();
  }
}

export { SimpleValidationTest };
