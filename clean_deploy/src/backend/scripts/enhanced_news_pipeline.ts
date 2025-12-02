#!/usr/bin/env ts-node

import { NewsAggregator, NewsItem } from '../ingestion/NewsAggregator';
import {
  NewsValidationService,
  ValidationResult,
  ProcessedNewsItem,
} from '../database/NewsValidationService';
import { NewsDatabaseService } from '../database/NewsDatabaseService';
import { DataMaintenanceService } from '../database/DataMaintenanceService';
// import { VixPlaywrightScraper } from '../ingestion/VixPlaywrightScraper'; // File removed
import { FinnhubClient } from '../ingestion/FinnhubClient';
import * as dotenv from 'dotenv';

dotenv.config();

interface PipelineConfig {
  enableValidation: boolean;
  enableDeduplication: boolean;
  enableQualityFiltering: boolean;
  enableMarketData: boolean;
  enableVIXData: boolean;
  minQualityScore: number;
  batchSize: number;
  maxParallelSources: number;
  enableBacktestData: boolean;
  preserveHistoricalEvents: boolean;
}

interface PipelineResult {
  timestamp: Date;
  duration: number;
  sources: {
    name: string;
    status: 'success' | 'partial' | 'failed';
    itemsFound: number;
    itemsValidated: number;
    itemsSaved: number;
    quality: {
      avg: number;
      min: number;
      max: number;
    };
    errors: string[];
  }[];
  total: {
    itemsFound: number;
    itemsValidated: number;
    itemsSaved: number;
    duplicatesRemoved: number;
    lowQualityRemoved: number;
    avgQualityScore: number;
    spaceRecovered: number; // MB
  };
  marketData: {
    vixValue?: number;
    sp500Value?: number;
    timestamp: Date;
  };
  errors: string[];
  warnings: string[];
}

export class EnhancedNewsPipeline {
  private newsAggregator: NewsAggregator;
  private validationService: NewsValidationService;
  private databaseService: NewsDatabaseService;
  private maintenanceService: DataMaintenanceService;
  // private vixScraper: VixPlaywrightScraper; // Commented out - file removed
  private finnhubClient: FinnhubClient;

  private config: PipelineConfig = {
    enableValidation: true,
    enableDeduplication: true,
    enableQualityFiltering: true,
    enableMarketData: true,
    enableVIXData: true,
    minQualityScore: 0.4, // Score minimum 40%
    batchSize: 100,
    maxParallelSources: 3,
    enableBacktestData: true,
    preserveHistoricalEvents: true,
  };

  constructor(config?: Partial<PipelineConfig>) {
    this.config = { ...this.config, ...config };

    this.newsAggregator = new NewsAggregator();
    this.validationService = new NewsValidationService();
    this.databaseService = new NewsDatabaseService();
    this.maintenanceService = new DataMaintenanceService();
    // this.vixScraper = new VixPlaywrightScraper(); // Commented out - file removed
    this.finnhubClient = new FinnhubClient();
  }

  /**
   * Exécute le pipeline complet avec validation et déduplication
   */
  async runPipeline(): Promise<PipelineResult> {
    const startTime = new Date();
    console.log('🚀 Démarrage du Pipeline Amélioré de News avec Validation et Déduplication');
    console.log(
      `⚙️ Configuration: Validation=${this.config.enableValidation}, Déduplication=${this.config.enableDeduplication}, Qualité=${this.config.enableQualityFiltering}`
    );
    console.log(`📊 Score qualité minimum: ${this.config.minQualityScore * 100}%\n`);

    const result: PipelineResult = {
      timestamp: startTime,
      duration: 0,
      sources: [],
      total: {
        itemsFound: 0,
        itemsValidated: 0,
        itemsSaved: 0,
        duplicatesRemoved: 0,
        lowQualityRemoved: 0,
        avgQualityScore: 0,
        spaceRecovered: 0,
      },
      marketData: {
        timestamp: new Date(),
      },
      errors: [],
      warnings: [],
    };

    try {
      // 1. Vérification de la connexion à la base de données
      console.log('1️⃣ Vérification de la base de données...');
      const dbConnected = await this.databaseService.testConnection();
      if (!dbConnected) {
        throw new Error('Impossible de se connecter à la base de données');
      }
      console.log('✅ Base de données connectée\n');

      // 2. Maintenance rapide si nécessaire
      if (this.config.enableDeduplication) {
        console.log('2️⃣ Maintenance rapide de la base de données...');
        const maintenanceResults = await this.maintenanceService.performMaintenance();
        const spaceRecovered = maintenanceResults.reduce(
          (sum, r) => sum + (r.details.spaceRecovered || 0),
          0
        );
        result.total.spaceRecovered = spaceRecovered;
        console.log(`✅ Maintenance terminée: ${spaceRecovered.toFixed(1)}MB récupérés\n`);
      }

      // 3. Récupération des données de marché
      if (this.config.enableMarketData || this.config.enableVIXData) {
        console.log('3️⃣ Récupération des données de marché...');
        await this.fetchMarketData(result);
        console.log(
          `✅ Données marché: VIX=${result.marketData.vixValue}, S&P500=${result.marketData.sp500Value}\n`
        );
      }

      // 4. Récupération des nouvelles depuis toutes les sources
      console.log('4️⃣ Récupération des nouvelles depuis les sources...');
      const allNews = await this.fetchAllNews();
      result.total.itemsFound = allNews.length;
      console.log(`✅ ${allNews.length} nouvelles récupérées depuis toutes les sources\n`);

      if (allNews.length === 0) {
        result.warnings.push('Aucune nouvelle récupérée depuis les sources');
        console.log('⚠️ Aucune nouvelle récupérée');
        return await this.finalizePipeline(result, startTime);
      }

      // 5. Validation et nettoyage des nouvelles
      if (this.config.enableValidation) {
        console.log('5️⃣ Validation et nettoyage des nouvelles...');
        const validationResults = await this.validateNewsBatch(allNews);
        result.total.itemsValidated = validationResults.filter(r => r.isValid).length;
        result.total.duplicatesRemoved = validationResults.filter(r =>
          r.errors.some(e => e.includes('Doublon'))
        ).length;
        result.total.lowQualityRemoved = validationResults.filter(
          r => !r.isValid && r.errors.some(e => e.includes('faible qualité'))
        ).length;

        console.log(
          `✅ Validation terminée: ${result.total.itemsValidated}/${allNews.length} valides`
        );
        console.log(`   🗑️ Doublons détectés: ${result.total.duplicatesRemoved}`);
        console.log(`   📉 Faible qualité: ${result.total.lowQualityRemoved}\n`);

        // Sauvegarder les nouvelles validées
        console.log('6️⃣ Sauvegarde des nouvelles validées...');
        const validResults = validationResults.filter(r => r.isValid && r.processedItem);
        const savedStats = await this.validationService.saveValidatedNews(validResults);
        result.total.itemsSaved = savedStats.saved;

        console.log(`✅ Sauvegarde terminée: ${savedStats.saved} nouvelles insérées`);
        if (savedStats.duplicates > 0) {
          console.log(`   🔄 Doublons mis à jour: ${savedStats.duplicates}`);
        }
        if (savedStats.rejected > 0) {
          console.log(`   ❌ Rejetées: ${savedStats.rejected}`);
        }

        // Calculer le score de qualité moyen
        const totalQuality = validResults.reduce(
          (sum, r) => sum + (r.processedItem?.data_quality_score || 0),
          0
        );
        result.total.avgQualityScore =
          validResults.length > 0 ? totalQuality / validResults.length : 0;
      } else {
        // Mode sans validation - sauvegarde directe
        console.log('5️⃣ Sauvegarde directe (sans validation)...');
        await this.newsAggregator.saveNewsToDatabase(allNews);
        result.total.itemsSaved = allNews.length;
        result.total.itemsValidated = allNews.length;
        result.total.avgQualityScore = 0.5; // Valeur par défaut
      }

      // 7. Archivage des données importantes pour backtesting
      if (this.config.enableBacktestData) {
        console.log('7️⃣ Archivage des données importantes pour backtesting...');
        const backtestReport = await this.maintenanceService.generateBacktestReport();
        console.log(
          `✅ Données backtesting disponibles: ${backtestReport.totalNews.toLocaleString()} items`
        );
        console.log(
          `   📅 Période: ${backtestReport.dateRange.start.toISOString().split('T')[0]} - ${backtestReport.dateRange.end.toISOString().split('T')[0]}`
        );
        console.log(`   🏛️ Événements historiques: ${backtestReport.marketEvents.length}\n`);
      }

      // 8. Mise à jour des statistiques
      console.log('8️⃣ Mise à jour des statistiques...');
      await this.updatePipelineStatistics(result);

      return await this.finalizePipeline(result, startTime);
    } catch (error) {
      result.errors.push(
        `Erreur critique du pipeline: ${error instanceof Error ? error.message : String(error)}`
      );
      console.error('❌ Erreur critique du pipeline:', error);
      return await this.finalizePipeline(result, startTime);
    } finally {
      // Nettoyer les ressources
      // if (this.vixScraper) {
      //   await this.vixScraper.close();
      // } // Commented out - file removed
      if (this.validationService) {
        await this.validationService.close();
      }
      if (this.databaseService) {
        await this.databaseService.close();
      }
    }
  }

  /**
   * Récupère les données de marché (VIX, S&P500)
   */
  private async fetchMarketData(result: PipelineResult): Promise<void> {
    const marketPromises: Promise<void>[] = [];

    // Données VIX
    if (this.config.enableVIXData) {
      marketPromises.push(this.fetchVIXData(result));
    }

    // Données S&P500
    if (this.config.enableMarketData) {
      marketPromises.push(this.fetchSP500Data(result));
    }

    await Promise.allSettled(marketPromises);
  }

  /**
   * Récupère les données VIX
   */
  private async fetchVIXData(result: PipelineResult): Promise<void> {
    try {
      console.log('   📈 Récupération VIX...');
      // const vixResults = await this.vixScraper.scrapeAll(); // Commented out - file removed
      const vixResults: any[] = []; // Empty array as fallback
      const validVIX = vixResults.find(r => r.value !== null && r.value > 0);

      if (validVIX && validVIX.value !== null) {
        result.marketData.vixValue = validVIX.value;
        console.log(`   ✅ VIX: ${validVIX.value} (source: ${validVIX.source})`);

        // Sauvegarder en base de données
        const pool = new (require('pg').Pool)({
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          database: process.env.DB_NAME || 'financial_analyst',
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || '9022',
        });

        const client = await pool.connect();
        try {
          await client.query(
            `
            INSERT INTO market_data (symbol, asset_type, price, change, change_percent, source, timestamp)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (symbol, timestamp::date) DO UPDATE SET
              price = EXCLUDED.price,
              change = EXCLUDED.change,
              change_percent = EXCLUDED.change_percent,
              timestamp = EXCLUDED.timestamp
          `,
            [
              'VIX',
              'VOLATILITY',
              validVIX.value,
              validVIX.change_abs,
              validVIX.change_pct,
              validVIX.source,
            ]
          );
        } finally {
          client.release();
          await pool.end();
        }
      } else {
        console.log('   ⚠️ Impossible de récupérer les données VIX');
      }
    } catch (error) {
      result.warnings.push(
        `Erreur récupération VIX: ${error instanceof Error ? error.message : error}`
      );
      console.warn('   ⚠️ Erreur VIX:', error);
    }
  }

  /**
   * Récupère les données S&P500
   */
  private async fetchSP500Data(result: PipelineResult): Promise<void> {
    try {
      console.log('   📊 Récupération S&P500...');
      const sp500Data = await this.finnhubClient.fetchSP500Data();

      if (sp500Data && sp500Data.current > 0) {
        result.marketData.sp500Value = sp500Data.current;
        console.log(
          `   ✅ S&P500: ${sp500Data.current.toFixed(2)} (${sp500Data.change > 0 ? '+' : ''}${sp500Data.percent_change.toFixed(2)}%)`
        );

        // Sauvegarder en base de données
        const pool = new (require('pg').Pool)({
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          database: process.env.DB_NAME || 'financial_analyst',
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || '9022',
        });

        const client = await pool.connect();
        try {
          await client.query(
            `
            INSERT INTO market_data (symbol, asset_type, price, change, change_percent, high, low, open, previous_close, source, timestamp)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
            ON CONFLICT (symbol, timestamp::date) DO UPDATE SET
              price = EXCLUDED.price,
              change = EXCLUDED.change,
              change_percent = EXCLUDED.change_percent,
              high = EXCLUDED.high,
              low = EXCLUDED.low,
              open = EXCLUDED.open,
              previous_close = EXCLUDED.previous_close,
              timestamp = EXCLUDED.timestamp
          `,
            [
              sp500Data.symbol || 'SP500',
              'INDEX',
              sp500Data.current,
              sp500Data.change,
              sp500Data.percent_change,
              sp500Data.high,
              sp500Data.low,
              sp500Data.open,
              sp500Data.previous_close,
              sp500Data.symbol || 'Finnhub',
            ]
          );
        } finally {
          client.release();
          await pool.end();
        }
      } else {
        console.log('   ⚠️ Impossible de récupérer les données S&P500');
      }
    } catch (error) {
      result.warnings.push(
        `Erreur récupération S&P500: ${error instanceof Error ? error.message : error}`
      );
      console.warn('   ⚠️ Erreur S&P500:', error);
    }
  }

  /**
   * Récupère les nouvelles depuis toutes les sources en parallèle
   */
  private async fetchAllNews(): Promise<NewsItem[]> {
    console.log('   📰 Récupération depuis les sources...');

    const sources = [
      { name: 'ZeroHedge', func: () => this.newsAggregator.fetchZeroHedgeHeadlines() },
      { name: 'CNBC', func: () => this.newsAggregator.fetchCNBCMarketNews() },
      { name: 'FinancialJuice', func: () => this.newsAggregator.fetchFinancialJuice() },
      { name: 'Finnhub', func: () => this.newsAggregator.fetchFinnhubNews() },
      { name: 'FRED Economic Data', func: () => this.newsAggregator.fetchFredEconomicData() },
      {
        name: 'Trading Economics',
        func: () => this.newsAggregator.fetchTradingEconomicsCalendar(),
      },
    ];

    // Exécuter en parallèle avec limite
    const results: { name: string; news: NewsItem[]; success: boolean; error?: string }[] = [];

    for (let i = 0; i < sources.length; i += this.config.maxParallelSources) {
      const batch = sources.slice(i, i + this.config.maxParallelSources);
      const batchPromises = batch.map(async source => {
        try {
          console.log(`     🔍 ${source.name}...`);
          const startTime = Date.now();
          const news = await source.func();
          const duration = Date.now() - startTime;
          console.log(`       ✅ ${source.name}: ${news.length} items (${duration}ms)`);
          return { name: source.name, news, success: true };
        } catch (error) {
          console.log(
            `       ❌ ${source.name}: ${error instanceof Error ? error.message : error}`
          );
          return {
            name: source.name,
            news: [],
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({ name: 'unknown', news: [], success: false, error: result.reason });
        }
      });
    }

    const allNews: NewsItem[] = [];
    results.forEach(result => {
      allNews.push(...result.news);
    });

    console.log(
      `   📊 Total récupéré: ${allNews.length} items de ${results.filter(r => r.success).length}/${sources.length} sources`
    );
    return allNews;
  }

  /**
   * Valide un lot de nouvelles
   */
  private async validateNewsBatch(news: NewsItem[]): Promise<ValidationResult[]> {
    // Traiter par lots
    const results: ValidationResult[] = [];
    for (let i = 0; i < news.length; i += this.config.batchSize) {
      const batch = news.slice(i, i + this.config.batchSize);
      console.log(
        `   🔍 Validation batch ${Math.floor(i / this.config.batchSize) + 1}/${Math.ceil(news.length / this.config.batchSize)} (${batch.length} items)...`
      );

      try {
        const batchResults = await this.validationService.validateNewsBatch(batch);
        results.push(...batchResults);

        const validInBatch = batchResults.filter(r => r.isValid).length;
        console.log(
          `       ✅ ${validInBatch}/${batch.length} valides (score moyen: ${((batchResults.reduce((sum, r) => sum + (r.qualityScore || 0), 0) / batchResults.length) * 100).toFixed(1)}%)`
        );
      } catch (error) {
        console.warn(`       ⚠️ Erreur validation batch:`, error);
        // Ajouter des résultats par défaut pour éviter la perte
        batch.forEach(item => {
          results.push({
            isValid: false,
            qualityScore: 0,
            errors: [error instanceof Error ? error.message : String(error)],
            warnings: [],
            appliedRules: [],
          });
        });
      }
    }

    return results;
  }

  /**
   * Met à jour les statistiques du pipeline
   */
  private async updatePipelineStatistics(result: PipelineResult): Promise<void> {
    try {
      const dbStats = await this.databaseService.getDatabaseStats();

      console.log('📊 STATISTIQUES FINALES:');
      console.log(
        `   • News totales en base: ${dbStats.news?.total_news?.toLocaleString() || 'N/A'}`
      );
      console.log(`   • News aujourd'hui: ${dbStats.news?.today_news?.toLocaleString() || 'N/A'}`);
      console.log(
        `   • Sources actives: ${dbStats.sources?.filter((s: any) => s.is_active).length || 'N/A'}`
      );
      console.log(`   • Analyses de sentiment: ${dbStats.analyses?.total_analyses || 'N/A'}`);

      if (result.marketData.vixValue) {
        console.log(`   • VIX actuel: ${result.marketData.vixValue}`);
      }
      if (result.marketData.sp500Value) {
        console.log(`   • S&P500 actuel: ${result.marketData.sp500Value}`);
      }

      console.log(`   • Score qualité moyen: ${(result.total.avgQualityScore * 100).toFixed(1)}%`);
      console.log(`   • Espace récupéré: ${result.total.spaceRecovered.toFixed(1)} MB`);
    } catch (error) {
      console.warn('⚠️ Erreur mise à jour statistiques:', error);
    }
  }

  /**
   * Finalise le pipeline et retourne le résultat
   */
  private async finalizePipeline(result: PipelineResult, startTime: Date): Promise<PipelineResult> {
    result.duration = Date.now() - startTime.getTime();

    console.log('\n' + '='.repeat(80));
    console.log('📋 RAPPORT FINAL DU PIPELINE AMÉLIORÉ');
    console.log('='.repeat(80));
    console.log(`⏰ Durée totale: ${(result.duration / 1000).toFixed(1)} secondes`);
    console.log(`📊 Nouvelles traitées: ${result.total.itemsFound.toLocaleString()}`);
    console.log(`✅ Nouvelles valides: ${result.total.itemsValidated.toLocaleString()}`);
    console.log(`💾 Nouvelles sauvegardées: ${result.total.itemsSaved.toLocaleString()}`);

    if (result.total.duplicatesRemoved > 0) {
      console.log(
        `🔄 Doublons détectés/retirés: ${result.total.duplicatesRemoved.toLocaleString()}`
      );
    }

    if (result.total.lowQualityRemoved > 0) {
      console.log(`📉 Faible qualité retirés: ${result.total.lowQualityRemoved.toLocaleString()}`);
    }

    console.log(`⭐ Score qualité moyen: ${(result.total.avgQualityScore * 100).toFixed(1)}%`);

    if (result.total.spaceRecovered > 0) {
      console.log(`💾 Espace récupéré: ${result.total.spaceRecovered.toFixed(1)} MB`);
    }

    if (result.marketData.vixValue) {
      console.log(`📈 VIX final: ${result.marketData.vixValue}`);
    }

    if (result.marketData.sp500Value) {
      console.log(`📊 S&P500 final: ${result.marketData.sp500Value}`);
    }

    if (result.errors.length > 0) {
      console.log(`\n❌ Erreurs (${result.errors.length}):`);
      result.errors.slice(0, 5).forEach(error => {
        console.log(`   • ${error}`);
      });
      if (result.errors.length > 5) {
        console.log(`   • ... et ${result.errors.length - 5} autres erreurs`);
      }
    }

    if (result.warnings.length > 0) {
      console.log(`\n⚠️ Avertissements (${result.warnings.length}):`);
      result.warnings.slice(0, 5).forEach(warning => {
        console.log(`   • ${warning}`);
      });
      if (result.warnings.length > 5) {
        console.log(`   • ... et ${result.warnings.length - 5} autres avertissements`);
      }
    }

    console.log('='.repeat(80));

    // Évaluation du succès
    const successRate =
      result.total.itemsFound > 0 ? result.total.itemsSaved / result.total.itemsFound : 0;
    const qualitySuccess = result.total.avgQualityScore >= this.config.minQualityScore;

    if (result.errors.length === 0 && successRate > 0.7 && qualitySuccess) {
      console.log('🎉 PIPELINE TERMINÉ AVEC SUCCÈS');
      console.log(`   • Taux de réussite: ${(successRate * 100).toFixed(1)}%`);
      console.log(
        `   • Qualité supérieure au seuil: ${(result.total.avgQualityScore * 100).toFixed(1)}% >= ${this.config.minQualityScore * 100}%`
      );
    } else if (result.errors.length === 0 && successRate > 0.4) {
      console.log('🟡 PIPELINE TERMINÉ AVEC RÉSULTATS PARTIELS');
      console.log(`   • Taux de réussite: ${(successRate * 100).toFixed(1)}% (objectif: >70%)`);
      if (!qualitySuccess) {
        console.log(
          `   • Qualité inférieure au seuil: ${(result.total.avgQualityScore * 100).toFixed(1)}% < ${this.config.minQualityScore * 100}%`
        );
      }
    } else {
      console.log('🔴 PIPELINE TERMINÉ AVEC DES PROBLÈMES');
      console.log(`   • Taux de réussite: ${(successRate * 100).toFixed(1)}%`);
      console.log(`   • Erreurs critiques: ${result.errors.length}`);
    }

    console.log('='.repeat(80));

    return result;
  }
}

// Script principal
if (require.main === module) {
  // Parser des arguments
  const args = process.argv.slice(2);
  const config: Partial<PipelineConfig> = {};

  if (args.includes('--disable-validation')) {
    config.enableValidation = false;
  }

  if (args.includes('--disable-deduplication')) {
    config.enableDeduplication = false;
  }

  if (args.includes('--disable-quality-filter')) {
    config.enableQualityFiltering = false;
  }

  if (args.includes('--disable-market-data')) {
    config.enableMarketData = false;
  }

  if (args.includes('--disable-vix-data')) {
    config.enableVIXData = false;
  }

  if (args.includes('--min-quality')) {
    const qualityIndex = args.indexOf('--min-quality');
    if (qualityIndex !== -1 && args[qualityIndex + 1]) {
      const quality = parseFloat(args[qualityIndex + 1]);
      if (quality >= 0 && quality <= 1) {
        config.minQualityScore = quality;
      }
    }
  }

  if (args.includes('--batch-size')) {
    const batchSizeIndex = args.indexOf('--batch-size');
    if (batchSizeIndex !== -1 && args[batchSizeIndex + 1]) {
      const batchSize = parseInt(args[batchSizeIndex + 1]);
      if (batchSize > 0 && batchSize <= 1000) {
        config.batchSize = batchSize;
      }
    }
  }

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🚀 PIPELINE AMÉLIORÉ DE NEWS

Usage: npm run pipeline [options]

Options:
  --disable-validation           Désactiver la validation des données
  --disable-deduplication      Désactiver la déduplication
  --disable-quality-filter      Désactiver le filtrage par qualité
  --disable-market-data         Désactiver la récupération des données de marché
  --disable-vix-data           Désactiver la récupération VIX
  --min-quality <0.0-1.0>      Score qualité minimum (défaut: 0.4)
  --batch-size <1-1000>         Taille des batches (défaut: 100)
  --help, -h                   Afficher cette aide

Exemples:
  npm run pipeline                              # Exécution par défaut
  npm run pipeline --min-quality 0.6         # Score minimum 60%
  npm run pipeline --disable-validation         # Sans validation
  npm run pipeline --batch-size 50             # Batches de 50 items
    `);
    process.exit(0);
  }

  // Démarrer le pipeline
  console.log('🔧 Démarrage du Pipeline Amélioré avec configuration:');
  console.log(`   Validation: ${(config.enableValidation ?? true) ? '✅' : '❌'}`);
  console.log(`   Déduplication: ${(config.enableDeduplication ?? true) ? '✅' : '❌'}`);
  console.log(`   Filtrage qualité: ${(config.enableQualityFiltering ?? true) ? '✅' : '❌'}`);
  console.log(`   Données marché: ${(config.enableMarketData ?? true) ? '✅' : '❌'}`);
  console.log(`   Données VIX: ${(config.enableVIXData ?? true) ? '✅' : '❌'}`);
  console.log(`   Score qualité minimum: ${(config.minQualityScore ?? 0.4) * 100}%`);
  console.log(`   Taille batch: ${config.batchSize ?? 100}\n`);

  const pipeline = new EnhancedNewsPipeline(config);

  pipeline
    .runPipeline()
    .then(result => {
      const successRate =
        result.total.itemsFound > 0 ? result.total.itemsSaved / result.total.itemsFound : 0;

      if (successRate > 0.8 && result.errors.length === 0) {
        console.log('\n🎉 PIPELINE AMÉLIORÉ TERMINÉ AVEC GRAND SUCCÈS');
        process.exit(0);
      } else if (successRate > 0.5 && result.errors.length === 0) {
        console.log('\n🟡 PIPELINE AMÉLIORÉ TERMINÉ AVEC SUCCÈS PARTIELS');
        process.exit(1);
      } else {
        console.log('\n🔴 PIPELINE AMÉLIORÉ TERMINÉ AVEC DES PROBLÈMES');
        process.exit(2);
      }
    })
    .catch(error => {
      console.error('\n❌ ERREUR CRITIQUE DU PIPELINE:', error);
      process.exit(3);
    });
}
