import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

export interface MaintenanceConfig {
  // Périodes de rétention
  rawNewsRetentionDays: number; // News brutes (peu pertinentes)
  processedNewsRetentionDays: number; // News traitées
  analyzedNewsRetentionDays: number; // News analysées (conservées pour backtesting)

  // Qualités de données
  minQualityScoreThreshold: number; // Score minimum pour garder
  duplicateThreshold: number; // Nb max de doublons autorisés

  // Paramètres de maintenance
  batchSize: number; // Taille des batchs de traitement
  preserveHistoricalPeriods: boolean; // Garder périodes historiques importantes

  // Périodes importantes à conserver (pour backtesting)
  historicalPeriods: {
    name: string;
    startDate: Date;
    endDate: Date;
    description: string;
  }[];
}

export interface MaintenanceResult {
  timestamp: Date;
  operation: string;
  recordsAffected: number;
  duration: number;
  details: {
    newsProcessed: number;
    newsDeleted: number;
    newsArchived: number;
    duplicatesRemoved: number;
    lowQualityRemoved: number;
    spaceRecovered: number; // en MB
  };
  errors: string[];
  warnings: string[];
}

export interface BacktestDataSummary {
  totalNews: number;
  dateRange: { start: Date; end: Date };
  sentimentDistribution: Record<string, number>;
  sourceDistribution: Record<string, number>;
  qualityScoreDistribution: {
    high: number; // > 0.8
    medium: number; // 0.6-0.8
    low: number; // < 0.6
  };
  marketEvents: {
    date: Date;
    description: string;
    importance: 'low' | 'medium' | 'high' | 'critical';
  }[];
}

export class DataMaintenanceService {
  private pool: Pool;
  private config: MaintenanceConfig;

  constructor(config?: Partial<MaintenanceConfig>) {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'financial_analyst',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '9022',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Configuration par défaut optimisée pour le backtesting
    this.config = {
      rawNewsRetentionDays: 7, // Garder 7 jours de news brutes
      processedNewsRetentionDays: 30, // Garder 30 jours de news traitées
      analyzedNewsRetentionDays: 365, // Garder 1 an de news analysées
      minQualityScoreThreshold: 0.3, // Score minimum 30%
      duplicateThreshold: 3, // Max 3 doublons
      batchSize: 1000, // Batch de 1000 enregistrements
      preserveHistoricalPeriods: true, // Garder périodes importantes
      historicalPeriods: [
        {
          name: 'COVID-19 Market Crash',
          startDate: new Date('2020-02-19'),
          endDate: new Date('2020-03-23'),
          description: 'Crash de marché lié au COVID-19',
        },
        {
          name: 'GameStop Short Squeeze',
          startDate: new Date('2021-01-13'),
          endDate: new Date('2021-02-02'),
          description: 'Short squeeze GameStop et actions meme',
        },
        {
          name: '2022 Inflation Crisis',
          startDate: new Date('2022-01-01'),
          endDate: new Date('2022-12-31'),
          description: 'Crise inflationniste de 2022',
        },
        {
          name: '2023 Banking Crisis',
          startDate: new Date('2023-03-08'),
          endDate: new Date('2023-03-31'),
          description: 'Crise bancaire SVB/CS',
        },
        {
          name: '2024 Election Year',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          description: 'Année électorale américaine 2024',
        },
      ],
      ...config,
    };
  }

  /**
   * Exécute la maintenance complète des données
   */
  async performMaintenance(): Promise<MaintenanceResult[]> {
    console.log('🧹 Démarrage maintenance complète des données...');
    const startTime = Date.now();
    const results: MaintenanceResult[] = [];

    try {
      // 1. Maintenance des news (avec conservation pour backtesting)
      results.push(await this.maintainNewsData());

      // 2. Nettoyage des doublons
      results.push(await this.cleanupDuplicates());

      // 3. Suppression des données de faible qualité
      results.push(await this.cleanupLowQualityData());

      // 4. Archivage des anciennes données
      results.push(await this.archiveOldData());

      // 5. Optimisation de la base de données
      results.push(await this.optimizeDatabase());

      // 6. Mise à jour des statistiques
      results.push(await this.updateStatistics());

      const totalTime = Date.now() - startTime;
      const totalRecords = results.reduce((sum, r) => sum + r.recordsAffected, 0);

      console.log(
        `✅ Maintenance terminée en ${totalTime}ms, ${totalRecords} enregistrements traités`
      );

      return results;
    } catch (error) {
      const errorResult: MaintenanceResult = {
        timestamp: new Date(),
        operation: 'MAINTENANCE_ERROR',
        recordsAffected: 0,
        duration: Date.now() - startTime,
        details: {
          newsProcessed: 0,
          newsDeleted: 0,
          newsArchived: 0,
          duplicatesRemoved: 0,
          lowQualityRemoved: 0,
          spaceRecovered: 0,
        },
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: [],
      };

      console.error('❌ Erreur critique lors de la maintenance:', error);
      return [...results, errorResult];
    }
  }

  /**
   * Maintenance des news avec conservation intelligente
   */
  public async maintainNewsData(): Promise<MaintenanceResult> {
    const startTime = Date.now();
    const client = await this.pool.connect();

    try {
      console.log('📰 Maintenance des données news...');

      // Marquer les données dans les périodes historiques importantes
      if (this.config.preserveHistoricalPeriods) {
        await this.markHistoricalPeriods(client);
      }

      // Calculer les seuils de rétention
      const rawThreshold = new Date(
        Date.now() - this.config.rawNewsRetentionDays * 24 * 60 * 60 * 1000
      );
      const processedThreshold = new Date(
        Date.now() - this.config.processedNewsRetentionDays * 24 * 60 * 60 * 1000
      );
      const analyzedThreshold = new Date(
        Date.now() - this.config.analyzedNewsRetentionDays * 24 * 60 * 60 * 1000
      );

      const result = await client.query(
        `
        -- News à supprimer (brutes, anciennes, non pertinentes)
        WITH news_to_delete AS (
          SELECT id
          FROM news_items
          WHERE
            (processing_status = 'raw' AND published_at < $1) OR
            (processing_status = 'processed' AND published_at < $2 AND data_quality_score < $3) OR
            (processing_status = 'processed' AND published_at < $4) OR
            (duplicate_count > $5) OR
            (is_historical_preservation = false AND published_at < $4)
        ),

        -- Statistiques avant suppression
        stats AS (
          SELECT
            COUNT(*) as total_before,
            COUNT(*) FILTER (WHERE processing_status = 'raw') as raw_before,
            COUNT(*) FILTER (WHERE processing_status = 'processed') as processed_before,
            COUNT(*) FILTER (WHERE processing_status = 'analyzed') as analyzed_before,
            AVG(data_quality_score) as avg_quality_before
          FROM news_items
        )

        -- Supprimer en lots
        DELETE FROM news_items
        WHERE id IN (SELECT id FROM news_to_delete)
        RETURNING id
      `,
        [
          rawThreshold,
          processedThreshold,
          this.config.minQualityScoreThreshold,
          analyzedThreshold,
          this.config.duplicateThreshold,
        ]
      );

      // Archivage des données importantes pour backtesting
      const archiveResult = await this.archiveImportantData(client);

      const stats = await client.query('SELECT * FROM stats');
      const beforeStats = stats.rows[0];

      const resultCount = result.rowCount || 0;
      const archiveCount = archiveResult.recordsAffected || 0;

      const maintenanceResult: MaintenanceResult = {
        timestamp: new Date(),
        operation: 'MAINTAIN_NEWS_DATA',
        recordsAffected: resultCount + archiveCount,
        duration: Date.now() - startTime,
        details: {
          newsProcessed: parseInt(beforeStats.total_before) || 0,
          newsDeleted: resultCount,
          newsArchived: archiveCount,
          duplicatesRemoved: 0, // Traité séparément
          lowQualityRemoved: resultCount,
          spaceRecovered: await this.calculateSpaceRecovered(client, 'news_items', resultCount),
        },
        errors: [],
        warnings: [],
      };

      console.log(
        `✅ Maintenance news terminée: ${resultCount} supprimées, ${archiveCount} archivées`
      );
      return maintenanceResult;
    } finally {
      client.release();
    }
  }

  /**
   * Marquer les périodes historiques importantes à conserver
   */
  private async markHistoricalPeriods(client: any): Promise<void> {
    console.log('🏛️ Marquage des périodes historiques importantes...');

    // Ajouter une colonne pour marquer la conservation historique
    await client.query(`
      ALTER TABLE news_items
      ADD COLUMN IF NOT EXISTS is_historical_preservation BOOLEAN DEFAULT false
    `);

    // Marquer les données dans les périodes importantes
    for (const period of this.config.historicalPeriods) {
      await client.query(
        `
        UPDATE news_items
        SET is_historical_preservation = true,
            processing_status = 'analyzed',
            data_quality_score = GREATEST(data_quality_score, 0.8)
        WHERE published_at BETWEEN $1 AND $2
          AND data_quality_score >= 0.6
      `,
        [period.startDate, period.endDate]
      );

      console.log(
        `   📍 Période conservée: ${period.name} (${period.startDate.toISOString().split('T')[0]} - ${period.endDate.toISOString().split('T')[0]})`
      );
    }
  }

  /**
   * Archiver les données importantes pour backtesting
   */
  private async archiveImportantData(client: any): Promise<{ recordsAffected: number }> {
    console.log('📦 Archivage des données importantes pour backtesting...');

    // Créer la table d'archive si elle n'existe pas
    await client.query(`
      CREATE TABLE IF NOT EXISTS news_archive (
        LIKE news_items INCLUDING ALL
      );

      CREATE INDEX IF NOT EXISTS idx_news_archive_published_at ON news_archive(published_at DESC);
      CREATE INDEX IF NOT EXISTS idx_news_archive_sentiment ON news_archive(sentiment);
      CREATE INDEX IF NOT EXISTS idx_news_archive_source ON news_archive(source);
    `);

    // Archiver les données de haute qualité pertinentes
    const archiveResult = await client.query(`
      INSERT INTO news_archive
      SELECT *, NOW() as archived_at
      FROM news_items
      WHERE
        data_quality_score >= 0.8 AND
        processing_status = 'analyzed' AND
        (published_at >= NOW() - INTERVAL '2 years' OR is_historical_preservation = true)
      ON CONFLICT (title_hash, DATE(published_at))
      DO UPDATE SET
        archived_at = NOW(),
        data_quality_score = GREATEST(news_archive.data_quality_score, EXCLUDED.data_quality_score)
      RETURNING id
    `);

    const archiveCount = archiveResult.rowCount || 0;
    console.log(`   📦 ${archiveCount} données archivées pour backtesting`);
    return { recordsAffected: archiveCount };
  }

  /**
   * Nettoyage des doublons
   */
  private async cleanupDuplicates(): Promise<MaintenanceResult> {
    const startTime = Date.now();
    const client = await this.pool.connect();

    try {
      console.log('🔄 Nettoyage des doublons...');

      // Identifier les groupes de doublons
      const duplicateGroups = await client.query(`
        WITH duplicate_groups AS (
          SELECT
            title_hash,
            published_at::date as pub_date,
            COUNT(*) as duplicate_count,
            STRING_AGG(DISTINCT source, ', ') as sources,
            MAX(data_quality_score) as max_quality,
            ARRAY_AGG(id ORDER BY data_quality_score DESC, published_at DESC) as ordered_ids
          FROM news_items
          WHERE title_hash IS NOT NULL
          GROUP BY title_hash, published_at::date
          HAVING COUNT(*) > 1
        )
        SELECT * FROM duplicate_groups
      `);

      let totalRemoved = 0;

      for (const group of duplicateGroups.rows) {
        // Garder le meilleur élément (premier du tableau déjà trié)
        const idsToKeep = group.ordered_ids.slice(0, 1);
        const idsToRemove = group.ordered_ids.slice(1);

        if (idsToRemove.length > 0) {
          const result = await client.query(`DELETE FROM news_items WHERE id = ANY($1)`, [
            idsToRemove,
          ]);
          totalRemoved += result.rowCount || 0;
        }
      }

      const maintenanceResult: MaintenanceResult = {
        timestamp: new Date(),
        operation: 'CLEANUP_DUPLICATES',
        recordsAffected: totalRemoved,
        duration: Date.now() - startTime,
        details: {
          newsProcessed: duplicateGroups.rowCount || 0,
          newsDeleted: totalRemoved,
          newsArchived: 0,
          duplicatesRemoved: totalRemoved,
          lowQualityRemoved: 0,
          spaceRecovered: await this.calculateSpaceRecovered(client, 'news_items', totalRemoved),
        },
        errors: [],
        warnings: [],
      };

      console.log(`✅ Nettoyage doublons terminé: ${totalRemoved} doublons supprimés`);
      return maintenanceResult;
    } finally {
      client.release();
    }
  }

  /**
   * Nettoyage des données de faible qualité
   */
  private async cleanupLowQualityData(): Promise<MaintenanceResult> {
    const startTime = Date.now();
    const client = await this.pool.connect();

    try {
      console.log('🗑️ Nettoyage des données de faible qualité...');

      // Supprimer les données de très faible qualité
      const result = await client.query(
        `
        DELETE FROM news_items
        WHERE
          data_quality_score < $1 OR
          (LENGTH(TRIM(title)) < 15 OR title ~ '[A-Z]{4,}') OR
          (url ~ 'bit\.ly|tinyurl|t\.co|goo\.gl' AND data_quality_score < 0.7)
        RETURNING id
      `,
        [this.config.minQualityScoreThreshold]
      );

      const resultCount = result.rowCount || 0;
      const maintenanceResult: MaintenanceResult = {
        timestamp: new Date(),
        operation: 'CLEANUP_LOW_QUALITY',
        recordsAffected: resultCount,
        duration: Date.now() - startTime,
        details: {
          newsProcessed: resultCount,
          newsDeleted: resultCount,
          newsArchived: 0,
          duplicatesRemoved: 0,
          lowQualityRemoved: resultCount,
          spaceRecovered: await this.calculateSpaceRecovered(client, 'news_items', resultCount),
        },
        errors: [],
        warnings: [],
      };

      console.log(`✅ Nettoyage faible qualité terminé: ${resultCount} enregistrements supprimés`);
      return maintenanceResult;
    } finally {
      client.release();
    }
  }

  /**
   * Archivage des anciennes données
   */
  public async archiveOldData(): Promise<MaintenanceResult> {
    const startTime = Date.now();
    const client = await this.pool.connect();

    try {
      console.log('📦 Archivage des anciennes données...');

      // Créer les tables d'archive si nécessaire
      await this.ensureArchiveTables(client);

      // Archiver les anciennes analyses de sentiment
      const sentimentResult = await client.query(`
        INSERT INTO sentiment_analyses_archive
        SELECT *, NOW() as archived_at
        FROM sentiment_analyses
        WHERE created_at < NOW() - INTERVAL '1 year'
        ON CONFLICT (id) DO NOTHING
        RETURNING id
      `);

      // Archiver les anciennes données de marché
      const marketResult = await client.query(`
        INSERT INTO market_data_archive
        SELECT *, NOW() as archived_at
        FROM market_data
        WHERE timestamp < NOW() - INTERVAL '1 year'
        ON CONFLICT DO NOTHING
        RETURNING id
      `);

      const totalArchived = (sentimentResult.rowCount || 0) + (marketResult.rowCount || 0);

      const maintenanceResult: MaintenanceResult = {
        timestamp: new Date(),
        operation: 'ARCHIVE_OLD_DATA',
        recordsAffected: totalArchived,
        duration: Date.now() - startTime,
        details: {
          newsProcessed: 0,
          newsDeleted: 0,
          newsArchived: totalArchived,
          duplicatesRemoved: 0,
          lowQualityRemoved: 0,
          spaceRecovered: 0, // Archive doesn't recover space immediately
        },
        errors: [],
        warnings: [],
      };

      console.log(`✅ Archivage terminé: ${totalArchived} enregistrements archivés`);
      return maintenanceResult;
    } finally {
      client.release();
    }
  }

  /**
   * Assurer l'existence des tables d'archive
   */
  private async ensureArchiveTables(client: any): Promise<void> {
    await client.query(`
      CREATE TABLE IF NOT EXISTS sentiment_analyses_archive (
        LIKE sentiment_analyses INCLUDING ALL
      );

      CREATE TABLE IF NOT EXISTS market_data_archive (
        LIKE market_data INCLUDING ALL
      );

      CREATE TABLE IF NOT EXISTS news_archive (
        LIKE news_items INCLUDING ALL
      );

      CREATE INDEX IF NOT EXISTS idx_sentiment_archive_created_at ON sentiment_analyses_archive(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_market_archive_timestamp ON market_data_archive(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_news_archive_published_at ON news_archive(published_at DESC);
    `);
  }

  /**
   * Optimisation de la base de données
   */
  public async optimizeDatabase(): Promise<MaintenanceResult> {
    const startTime = Date.now();
    const client = await this.pool.connect();

    try {
      console.log('⚡ Optimisation de la base de données...');

      // VACUUM ANALYZE pour optimiser les tables
      const tables = ['news_items', 'news_archive', 'sentiment_analyses', 'market_data'];
      let optimizedTables = 0;

      for (const table of tables) {
        try {
          await client.query(`VACUUM ANALYZE ${table}`);
          optimizedTables++;
          console.log(`   ✅ Table ${table} optimisée`);
        } catch (error) {
          console.warn(`   ⚠️ Erreur optimisation ${table}:`, error);
        }
      }

      // Mettre à jour les statistiques des tables
      await client.query(`
        UPDATE data_quality_metrics
        SET table_sizes = (
          SELECT jsonb_agg(
            jsonb_build_object(
              schemaname || '.' || tablename,
              pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
            )
          )
          FROM pg_tables
          WHERE schemaname = 'public'
            AND tablename IN ('news_items', 'news_archive', 'sentiment_analyses', 'market_data')
        ),
        updated_at = NOW()
      `);

      const maintenanceResult: MaintenanceResult = {
        timestamp: new Date(),
        operation: 'OPTIMIZE_DATABASE',
        recordsAffected: optimizedTables,
        duration: Date.now() - startTime,
        details: {
          newsProcessed: 0,
          newsDeleted: 0,
          newsArchived: 0,
          duplicatesRemoved: 0,
          lowQualityRemoved: 0,
          spaceRecovered: 0, // Optimization doesn't immediately recover space
        },
        errors: [],
        warnings: [],
      };

      console.log(`✅ Optimisation terminée: ${optimizedTables} tables optimisées`);
      return maintenanceResult;
    } finally {
      client.release();
    }
  }

  /**
   * Mise à jour des statistiques
   */
  private async updateStatistics(): Promise<MaintenanceResult> {
    const startTime = Date.now();
    const client = await this.pool.connect();

    try {
      console.log('📊 Mise à jour des statistiques...');

      // Mettre à jour les métriques de qualité
      await client.query(`
        INSERT INTO data_quality_metrics (
          metric_date, total_news, unique_news, duplicate_news,
          avg_quality_score, high_quality_news, medium_quality_news, low_quality_news,
          sources_active, news_last_24h, news_last_7d, archive_size
        )
        SELECT
          CURRENT_DATE,
          COUNT(*) as total_news,
          COUNT(DISTINCT title_hash) as unique_news,
          COUNT(*) - COUNT(DISTINCT title_hash) as duplicate_news,
          ROUND(AVG(data_quality_score), 2) as avg_quality_score,
          COUNT(CASE WHEN data_quality_score >= 0.8 THEN 1 END) as high_quality_news,
          COUNT(CASE WHEN data_quality_score >= 0.6 AND data_quality_score < 0.8 THEN 1 END) as medium_quality_news,
          COUNT(CASE WHEN data_quality_score < 0.6 THEN 1 END) as low_quality_news,
          COUNT(DISTINCT source) as sources_active,
          COUNT(CASE WHEN scraped_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as news_last_24h,
          COUNT(CASE WHEN scraped_at >= NOW() - INTERVAL '7 days' THEN 1 END) as news_last_7d,
          pg_size_pretty(pg_total_relation_size('news_archive'))
        FROM news_items
        WHERE processing_status != 'rejected'
        ON CONFLICT (metric_date)
        DO UPDATE SET
          total_news = EXCLUDED.total_news,
          unique_news = EXCLUDED.unique_news,
          duplicate_news = EXCLUDED.duplicate_news,
          avg_quality_score = EXCLUDED.avg_quality_score,
          high_quality_news = EXCLUDED.high_quality_news,
          medium_quality_news = EXCLUDED.medium_quality_news,
          low_quality_news = EXCLUDED.low_quality_news,
          sources_active = EXCLUDED.sources_active,
          news_last_24h = EXCLUDED.news_last_24h,
          news_last_7d = EXCLUDED.news_last_7d,
          archive_size = EXCLUDED.archive_size,
          updated_at = NOW()
      `);

      const maintenanceResult: MaintenanceResult = {
        timestamp: new Date(),
        operation: 'UPDATE_STATISTICS',
        recordsAffected: 1,
        duration: Date.now() - startTime,
        details: {
          newsProcessed: 0,
          newsDeleted: 0,
          newsArchived: 0,
          duplicatesRemoved: 0,
          lowQualityRemoved: 0,
          spaceRecovered: 0,
        },
        errors: [],
        warnings: [],
      };

      console.log('✅ Statistiques mises à jour');
      return maintenanceResult;
    } finally {
      client.release();
    }
  }

  /**
   * Calculer l'espace récupéré
   */
  private async calculateSpaceRecovered(
    client: any,
    table: string,
    rowsDeleted: number
  ): Promise<number> {
    try {
      const result = await client.query(`
        SELECT pg_relation_size('${table}') as table_size,
               (SELECT AVG(LENGTH(title::text) + COALESCE(LENGTH(content::text), 0) + 1000)
                FROM ${table} LIMIT 100) as avg_row_size
      `);

      if (result.rows.length > 0 && result.rows[0].avg_row_size) {
        const avgRowSize = result.rows[0].avg_row_size;
        return Math.round(((rowsDeleted * avgRowSize) / (1024 * 1024)) * 100) / 100; // MB
      }
      return 0;
    } catch {
      return 0;
    }
  }

  /**
   * Générer un rapport de backtesting
   */
  async generateBacktestReport(): Promise<BacktestDataSummary> {
    const client = await this.pool.connect();
    try {
      console.log('📈 Génération rapport backtesting...');

      // Données globales
      const globalStats = await client.query(`
        SELECT
          COUNT(*) as total_news,
          MIN(published_at) as earliest_date,
          MAX(published_at) as latest_date
        FROM news_archive
        WHERE processing_status = 'analyzed'
      `);

      // Distribution par sentiment
      const sentimentStats = await client.query(`
        SELECT
          COALESCE(sentiment, 'neutral') as sentiment,
          COUNT(*) as count
        FROM news_archive
        WHERE processing_status = 'analyzed'
        GROUP BY sentiment
      `);

      // Distribution par source
      const sourceStats = await client.query(`
        SELECT
          source,
          COUNT(*) as count
        FROM news_archive
        WHERE processing_status = 'analyzed'
        GROUP BY source
        ORDER BY count DESC
      `);

      // Distribution par qualité
      const qualityStats = await client.query(`
        SELECT
          COUNT(CASE WHEN data_quality_score >= 0.8 THEN 1 END) as high,
          COUNT(CASE WHEN data_quality_score >= 0.6 AND data_quality_score < 0.8 THEN 1 END) as medium,
          COUNT(CASE WHEN data_quality_score < 0.6 THEN 1 END) as low
        FROM news_archive
        WHERE processing_status = 'analyzed'
      `);

      // Événements de marché importants
      const marketEvents = this.config.historicalPeriods.map(period => ({
        date: period.startDate,
        description: period.description,
        importance: 'critical' as const,
      }));

      const global = globalStats.rows[0];

      const summary: BacktestDataSummary = {
        totalNews: parseInt(global.total_news),
        dateRange: {
          start: new Date(global.earliest_date),
          end: new Date(global.latest_date),
        },
        sentimentDistribution: {},
        sourceDistribution: {},
        qualityScoreDistribution: {
          high: parseInt(qualityStats.rows[0]?.high || 0),
          medium: parseInt(qualityStats.rows[0]?.medium || 0),
          low: parseInt(qualityStats.rows[0]?.low || 0),
        },
        marketEvents,
      };

      // Remplir les distributions
      sentimentStats.rows.forEach(row => {
        summary.sentimentDistribution[row.sentiment] = parseInt(row.count);
      });

      sourceStats.rows.forEach(row => {
        summary.sourceDistribution[row.source] = parseInt(row.count);
      });

      return summary;
    } finally {
      client.release();
    }
  }

  /**
   * Fermer les connexions
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}
