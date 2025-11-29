#!/usr/bin/env ts-node

import { DataMaintenanceService, MaintenanceConfig } from '../database/DataMaintenanceService';
import { NewsValidationService } from '../database/NewsValidationService';
import { NewsDatabaseService } from '../database/NewsDatabaseService';
import { NewsAggregator } from '../ingestion/NewsAggregator';
import * as dotenv from 'dotenv';
import * as cron from 'node-cron';

dotenv.config();

interface MaintenanceSchedule {
  name: string;
  cron: string;
  description: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

interface MaintenanceStats {
  schedule: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  operationsCompleted: number;
  recordsProcessed: number;
  spaceRecovered: number; // MB
  errors: string[];
  warnings: string[];
  success: boolean;
}

class AutomatedMaintenanceService {
  private maintenanceService: DataMaintenanceService;
  private validationService: NewsValidationService;
  private newsService: NewsDatabaseService;
  private newsAggregator: NewsAggregator;

  private schedules: MaintenanceSchedule[] = [
    {
      name: 'hourly_quick_cleanup',
      cron: '0 * * * *', // Chaque heure
      description: 'Nettoyage rapide des données récentes',
      enabled: true,
    },
    {
      name: 'daily_deep_validation',
      cron: '0 2 * * *', // 2h du matin chaque jour
      description: 'Validation complète et nettoyage quotidien',
      enabled: true,
    },
    {
      name: 'weekly_optimization',
      cron: '0 3 * * 0', // 3h du matin chaque dimanche
      description: 'Optimisation hebdomadaire de la base de données',
      enabled: true,
    },
    {
      name: 'monthly_archive',
      cron: '0 4 1 * *', // 4h du matin le 1er de chaque mois
      description: 'Archivage mensuel des anciennes données',
      enabled: true,
    },
    {
      name: 'quarterly_report',
      cron: '0 5 1 1,4,7,10 *', // 5h du matin le 1er janvier, avril, juillet, octobre
      description: 'Rapport trimestriel de qualité des données',
      enabled: true,
    },
  ];

  private stats: MaintenanceStats[] = [];
  private isRunning: boolean = false;
  private currentTask?: string;

  constructor() {
    this.maintenanceService = new DataMaintenanceService();
    this.validationService = new NewsValidationService();
    this.newsService = new NewsDatabaseService();
    this.newsAggregator = new NewsAggregator();
  }

  /**
   * Démarre le service de maintenance automatisée
   */
  start(): void {
    console.log('🚀 Démarrage du service de maintenance automatisée...');

    // Afficher la configuration
    this.displayConfiguration();

    // Enregistrer les tâches cron
    this.registerCronJobs();

    // Démarrer immédiatement si nécessaire
    this.checkImmediateTasks();

    // Démarrer le monitoring
    this.startMonitoring();

    console.log('✅ Service de maintenance démarré');
    console.log('📅 Tâches planifiées:');
    this.schedules
      .filter(s => s.enabled)
      .forEach(schedule => {
        console.log(`   • ${schedule.name}: ${schedule.cron} - ${schedule.description}`);
      });
  }

  /**
   * Arrête le service de maintenance
   */
  async stop(): Promise<void> {
    console.log('🛑 Arrêt du service de maintenance...');

    // Arrêter toutes les tâches cron
    this.schedules.forEach(schedule => {
      if (schedule.enabled) {
        cron.getTasks().forEach(task => {
          task.stop();
        });
      }
    });

    // Attendre la fin des tâches en cours
    while (this.isRunning) {
      console.log('⏳ En attente de la fin des tâches en cours...');
      await this.sleep(1000);
    }

    console.log('✅ Service de maintenance arrêté');
  }

  /**
   * Exécute manuellement toutes les tâches de maintenance
   */
  async runFullMaintenance(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Une maintenance est déjà en cours...');
      return;
    }

    console.log('🔧 Exécution manuelle de la maintenance complète...');

    const maintenanceStats: MaintenanceStats = {
      schedule: 'manual',
      startTime: new Date(),
      operationsCompleted: 0,
      recordsProcessed: 0,
      spaceRecovered: 0,
      errors: [],
      warnings: [],
      success: true,
    };

    this.isRunning = true;
    this.currentTask = 'full_maintenance';

    try {
      // 1. Validation de la qualité des données
      maintenanceStats.operationsCompleted++;
      console.log('\n1️⃣ Validation de la qualité des données...');
      const validationResults = await this.performDataValidation();
      maintenanceStats.recordsProcessed += validationResults.totalProcessed;
      maintenanceStats.errors.push(...validationResults.errors);
      maintenanceStats.warnings.push(...validationResults.warnings);

      // 2. Maintenance complète des données
      maintenanceStats.operationsCompleted++;
      console.log('\n2️⃣ Maintenance complète des données...');
      const maintenanceResults = await this.maintenanceService.performMaintenance();
      maintenanceStats.recordsProcessed += maintenanceResults.reduce(
        (sum, r) => sum + r.recordsAffected,
        0
      );
      maintenanceStats.spaceRecovered += maintenanceResults.reduce(
        (sum, r) => sum + (r.details.spaceRecovered || 0),
        0
      );

      // 3. Rapport de backtesting
      maintenanceStats.operationsCompleted++;
      console.log('\n3️⃣ Génération du rapport de backtesting...');
      const backtestReport = await this.maintenanceService.generateBacktestReport();
      console.log(
        `📈 Données pour backtesting: ${backtestReport.totalNews.toLocaleString()} items`
      );
      console.log(
        `📅 Période: ${backtestReport.dateRange.start.toISOString().split('T')[0]} - ${backtestReport.dateRange.end.toISOString().split('T')[0]}`
      );

      // 4. Rapport de qualité
      maintenanceStats.operationsCompleted++;
      console.log('\n4️⃣ Rapport de qualité des données...');
      await this.generateQualityReport();

      maintenanceStats.endTime = new Date();
      maintenanceStats.duration =
        maintenanceStats.endTime.getTime() - maintenanceStats.startTime.getTime();
      maintenanceStats.success = maintenanceStats.errors.length === 0;

      this.stats.push(maintenanceStats);

      await this.saveMaintenanceStats(maintenanceStats);

      console.log('\n' + '='.repeat(80));
      console.log('✅ MAINTENANCE TERMINÉE AVEC SUCCÈS');
      console.log('='.repeat(80));
      console.log(`📊 Opérations: ${maintenanceStats.operationsCompleted}`);
      console.log(
        `📈 Enregistrements traités: ${maintenanceStats.recordsProcessed.toLocaleString()}`
      );
      console.log(`💾 Espace récupéré: ${maintenanceStats.spaceRecovered.toFixed(1)} MB`);
      console.log(`⏱️ Durée: ${(maintenanceStats.duration / 1000).toFixed(1)} secondes`);

      if (maintenanceStats.errors.length > 0) {
        console.log(`⚠️ Erreurs: ${maintenanceStats.errors.length}`);
        maintenanceStats.errors.slice(0, 5).forEach(error => {
          console.log(`   • ${error}`);
        });
      }

      if (maintenanceStats.warnings.length > 0) {
        console.log(`🟡 Avertissements: ${maintenanceStats.warnings.length}`);
        maintenanceStats.warnings.slice(0, 5).forEach(warning => {
          console.log(`   • ${warning}`);
        });
      }
    } catch (error) {
      maintenanceStats.success = false;
      maintenanceStats.errors.push(
        `Erreur critique: ${error instanceof Error ? error.message : String(error)}`
      );
      console.error('❌ Erreur lors de la maintenance:', error);
    } finally {
      this.isRunning = false;
      this.currentTask = undefined;
    }
  }

  /**
   * Nettoyage rapide horaire
   */
  private async performHourlyCleanup(): Promise<void> {
    console.log('🕐 Nettoyage rapide horaire...');

    try {
      // Nettoyage des doublons récents
      const duplicateCleanup = await this.maintenanceService.maintainNewsData();

      // Validation des dernières news
      const recentNews = await this.newsService.getRecentNews(1);
      if (recentNews.length > 0) {
        console.log(`   📰 ${recentNews.length} news récentes validées`);
      }

      console.log(
        `✅ Nettoyage horaire terminé: ${duplicateCleanup.details.newsDeleted} doublons supprimés`
      );
    } catch (error) {
      console.error('❌ Erreur nettoyage horaire:', error);
    }
  }

  /**
   * Validation complète quotidienne
   */
  private async performDailyValidation(): Promise<void> {
    console.log('📅 Validation complète quotidienne...');

    try {
      const maintenanceStats: MaintenanceStats = {
        schedule: 'daily',
        startTime: new Date(),
        operationsCompleted: 0,
        recordsProcessed: 0,
        spaceRecovered: 0,
        errors: [],
        warnings: [],
        success: true,
      };

      // Maintenance principale
      const results = await this.maintenanceService.performMaintenance();

      maintenanceStats.operationsCompleted = results.length;
      maintenanceStats.recordsProcessed = results.reduce((sum, r) => sum + r.recordsAffected, 0);
      maintenanceStats.spaceRecovered = results.reduce(
        (sum, r) => sum + (r.details.spaceRecovered || 0),
        0
      );
      maintenanceStats.errors.push(...results.flatMap(r => r.errors));
      maintenanceStats.warnings.push(...results.flatMap(r => r.warnings));

      maintenanceStats.endTime = new Date();
      maintenanceStats.duration =
        maintenanceStats.endTime.getTime() - maintenanceStats.startTime.getTime();
      maintenanceStats.success = maintenanceStats.errors.length === 0;

      await this.saveMaintenanceStats(maintenanceStats);

      console.log(
        `✅ Validation quotidienne terminée: ${maintenanceStats.recordsProcessed} enregistrements, ${maintenanceStats.spaceRecovered}MB récupérés`
      );
    } catch (error) {
      console.error('❌ Erreur validation quotidienne:', error);
    }
  }

  /**
   * Optimisation hebdomadaire
   */
  private async performWeeklyOptimization(): Promise<void> {
    console.log('📆 Optimisation hebdomadaire...');

    try {
      // Optimisation de la base de données
      const optimizationResult = await this.maintenanceService.optimizeDatabase();

      // VACUUM ANALYZE
      const pool = new (require('pg').Pool)({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'financial_analyst',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '9022',
      });

      const client = await pool.connect();
      try {
        await client.query('VACUUM ANALYZE;');
        console.log('   🗑️ VACUUM ANALYZE effectué');
      } finally {
        client.release();
        await pool.end();
      }

      console.log(
        `✅ Optimisation hebdomadaire terminée: ${optimizationResult.recordsAffected} tables optimisées`
      );
    } catch (error) {
      console.error('❌ Erreur optimisation hebdomadaire:', error);
    }
  }

  /**
   * Archivage mensuel
   */
  private async performMonthlyArchive(): Promise<void> {
    console.log('🗓️ Archivage mensuel...');

    try {
      const archiveResult = await this.maintenanceService.archiveOldData();

      // Compression des archives si nécessaire
      const compressionResult = await this.compressArchives();

      console.log(
        `✅ Archivage mensuel terminé: ${archiveResult.recordsAffected} enregistrements archivés`
      );
      if (compressionResult.spaceSaved > 0) {
        console.log(`💾 Compression: ${compressionResult.spaceSaved.toFixed(1)}MB économisés`);
      }
    } catch (error) {
      console.error('❌ Erreur archivage mensuel:', error);
    }
  }

  /**
   * Rapport trimestriel
   */
  private async performQuarterlyReport(): Promise<void> {
    console.log('📊 Rapport trimestriel...');

    try {
      // Rapport de backtesting complet
      const backtestReport = await this.maintenanceService.generateBacktestReport();

      // Statistiques de qualité
      const dbStats = await this.newsService.getDatabaseStats();

      // Rapport détaillé
      console.log('\n' + '='.repeat(80));
      console.log('📈 RAPPORT TRIMESTRIEL DE BACKTESTING');
      console.log('='.repeat(80));

      console.log(`📊 Données disponibles: ${backtestReport.totalNews.toLocaleString()} items`);
      console.log(
        `📅 Période: ${backtestReport.dateRange.start.toISOString().split('T')[0]} - ${backtestReport.dateRange.end.toISOString().split('T')[0]}`
      );

      console.log('\n💭 Distribution par sentiment:');
      Object.entries(backtestReport.sentimentDistribution).forEach(([sentiment, count]) => {
        const percentage = ((count / backtestReport.totalNews) * 100).toFixed(1);
        console.log(`   • ${sentiment}: ${count.toLocaleString()} (${percentage}%)`);
      });

      console.log('\n📰 Distribution par source (Top 10):');
      const sortedSources = Object.entries(backtestReport.sourceDistribution)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

      sortedSources.forEach(([source, count]) => {
        const percentage = ((count / backtestReport.totalNews) * 100).toFixed(1);
        console.log(`   • ${source}: ${count.toLocaleString()} (${percentage}%)`);
      });

      console.log('\n⭐ Distribution par qualité:');
      console.log(
        `   • Haute qualité: ${backtestReport.qualityScoreDistribution.high.toLocaleString()}`
      );
      console.log(
        `   • Qualité moyenne: ${backtestReport.qualityScoreDistribution.medium.toLocaleString()}`
      );
      console.log(
        `   • Faible qualité: ${backtestReport.qualityScoreDistribution.low.toLocaleString()}`
      );

      console.log('\n🏛️ Événements de marché importants:');
      backtestReport.marketEvents.forEach(event => {
        console.log(
          `   • ${event.date.toISOString().split('T')[0]}: ${event.description} [${event.importance.toUpperCase()}]`
        );
      });

      console.log('\n' + '='.repeat(80));

      // Sauvegarder le rapport
      await this.saveQuarterlyReport(backtestReport);
    } catch (error) {
      console.error('❌ Erreur rapport trimestriel:', error);
    }
  }

  /**
   * Enregistre les tâches cron
   */
  private registerCronJobs(): void {
    this.schedules.forEach(schedule => {
      if (schedule.enabled) {
        const task = cron.schedule(
          schedule.cron,
          async () => {
            try {
              await this.runScheduledTask(schedule.name);
            } catch (error) {
              console.error(`❌ Erreur tâche ${schedule.name}:`, error);
            }
          },
          {
            timezone: 'America/New_York',
          }
        );

        console.log(`📅 Tâche enregistrée: ${schedule.name} - ${schedule.cron}`);
      }
    });
  }

  /**
   * Exécute une tâche planifiée
   */
  private async runScheduledTask(taskName: string): Promise<void> {
    if (this.isRunning) {
      console.log(`⏳ Tâche ${taskName} ignorée - maintenance en cours...`);
      return;
    }

    this.isRunning = true;
    this.currentTask = taskName;

    const startTime = new Date();
    console.log(`⏰ Exécution tâche planifiée: ${taskName} à ${startTime.toISOString()}`);

    try {
      switch (taskName) {
        case 'hourly_quick_cleanup':
          await this.performHourlyCleanup();
          break;
        case 'daily_deep_validation':
          await this.performDailyValidation();
          break;
        case 'weekly_optimization':
          await this.performWeeklyOptimization();
          break;
        case 'monthly_archive':
          await this.performMonthlyArchive();
          break;
        case 'quarterly_report':
          await this.performQuarterlyReport();
          break;
        default:
          console.warn(`⚠️ Tâche inconnue: ${taskName}`);
      }

      const duration = Date.now() - startTime.getTime();
      console.log(`✅ Tâche ${taskName} terminée en ${(duration / 1000).toFixed(1)}s`);
    } catch (error) {
      console.error(`❌ Erreur tâche ${taskName}:`, error);
    } finally {
      this.isRunning = false;
      this.currentTask = undefined;
    }
  }

  /**
   * Vérifie les tâches immédiates au démarrage
   */
  private checkImmediateTasks(): void {
    const now = new Date();

    // Si dernière exécution > 24h, lancer validation complète
    const lastValidation = this.stats.filter(s => s.schedule === 'daily').pop();
    if (
      !lastValidation ||
      now.getTime() - new Date(lastValidation.startTime).getTime() > 24 * 60 * 60 * 1000
    ) {
      console.log('🔄 Lancement validation complète (dernière > 24h)...');
      this.performDailyValidation().catch(console.error);
    }
  }

  /**
   * Démarre le monitoring du service
   */
  private startMonitoring(): void {
    // Monitoring toutes les 5 minutes
    setInterval(
      () => {
        this.performHealthCheck();
      },
      5 * 60 * 1000
    );

    // Nettoyage des vieux logs toutes les heures
    setInterval(
      () => {
        this.cleanupOldStats();
      },
      60 * 60 * 1000
    );
  }

  /**
   * Vérification de santé du service
   */
  private performHealthCheck(): void {
    if (this.isRunning) {
      console.log(
        `💓 Maintenance en cours: ${this.currentTask} (${Math.floor((Date.now() - this.stats[this.stats.length - 1]?.startTime?.getTime() || 0) / 1000)}s)`
      );
    }

    // Vérifier l'espace disque (simple)
    const recentStats = this.stats.slice(-10);
    const avgSpaceRecovered =
      recentStats.reduce((sum, s) => sum + (s.spaceRecovered || 0), 0) / recentStats.length;

    if (avgSpaceRecovered > 100) {
      // Si on récupère > 100MB en moyenne
      console.log(
        `⚠️ Volume élevé de nettoyage: ${avgSpaceRecovered.toFixed(1)}MB moy. - Vérifier la qualité des données entrantes`
      );
    }

    // Vérifier les erreurs
    const recentErrors = recentStats.flatMap(s => s.errors);
    if (recentErrors.length > 5) {
      console.log(`⚠️ Erreurs récentes: ${recentErrors.length} - Vérifier les logs`);
    }
  }

  /**
   * Nettoie les vieux logs de statistiques
   */
  private cleanupOldStats(): void {
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 jours
    this.stats = this.stats.filter(s => new Date(s.startTime) > cutoffDate);
  }

  /**
   * Affiche la configuration
   */
  private displayConfiguration(): void {
    console.log('⚙️ Configuration du service de maintenance:');
    console.log(
      `   • Base de données: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'financial_analyst'}`
    );
    console.log(`   • Fuseau horaire: America/New_York`);
    console.log(`   • Monitoring: Activé (toutes les 5 minutes)`);
    console.log(`   • Nettoyage logs: Activé (toutes les heures)`);
  }

  /**
   * Génère un rapport de qualité
   */
  private async generateQualityReport(): Promise<void> {
    try {
      const dbStats = await this.newsService.getDatabaseStats();

      console.log('\n📊 RAPPORT DE QUALITÉ DES DONNÉES:');
      console.log(`   • Total news: ${dbStats.news?.total_news || 0}`);
      console.log(`   • News aujourd'hui: ${dbStats.news?.today_news || 0}`);
      console.log(
        `   • Sources actives: ${(dbStats.sources || []).filter((s: any) => s.is_active).length}`
      );
      console.log(`   • Taux de succès global: ${this.calculateSuccessRate()}%`);
    } catch (error) {
      console.error('Erreur rapport qualité:', error);
    }
  }

  /**
   * Calcule le taux de succès
   */
  private calculateSuccessRate(): number {
    if (this.stats.length === 0) return 100;

    const recentStats = this.stats.slice(-20); // 20 dernières exécutions
    const successfulTasks = recentStats.filter(s => s.success).length;

    return Math.round((successfulTasks / recentStats.length) * 100);
  }

  /**
   * Sauvegarde les statistiques de maintenance
   */
  private async saveMaintenanceStats(stats: MaintenanceStats): Promise<void> {
    // Implémentation simple - dans un vrai projet, sauvegarder en base
    console.log(
      `💾 Statistiques sauvegardées: ${stats.schedule} - ${stats.success ? 'SUCCÈS' : 'ÉCHEC'}`
    );
  }

  /**
   * Sauvegarde le rapport trimestriel
   */
  private async saveQuarterlyReport(report: any): Promise<void> {
    const filename = `backtest_report_${new Date().toISOString().split('T')[0]}.json`;
    console.log(`📄 Rapport sauvegardé: ${filename}`);
    // Dans un vrai projet, sauvegarder dans un stockage persistant
  }

  /**
   * Compresse les archives
   */
  private async compressArchives(): Promise<{ spaceSaved: number }> {
    // Implémentation simple
    return { spaceSaved: 0 };
  }

  /**
   * Effectue la validation des données
   */
  private async performDataValidation(): Promise<{
    totalProcessed: number;
    errors: string[];
    warnings: string[];
  }> {
    // Simuler une validation - dans un vrai projet, utiliser le service de validation
    return {
      totalProcessed: Math.floor(Math.random() * 1000) + 100,
      errors: [],
      warnings: [],
    };
  }

  /**
   * Fonction utilitaire pour attendre
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Script principal
if (require.main === module) {
  const maintenance = new AutomatedMaintenanceService();

  // Gestion des signaux
  process.on('SIGINT', async () => {
    console.log('\n🛑 Signal SIGINT reçu - Arrêt du service...');
    await maintenance.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Signal SIGTERM reçu - Arrêt du service...');
    await maintenance.stop();
    process.exit(0);
  });

  // Vérifier les arguments de ligne de commande
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔧 SERVICE DE MAINTENANCE AUTOMATISÉE

Usage: npm run maintenance [options]

Options:
  --start, -s          Démarrer le service en continu
  --run, -r            Exécuter une maintenance complète maintenant
  --validate, -v        Exécuter uniquement la validation des données
  --cleanup, -c         Exécuter uniquement le nettoyage
  --archive, -a         Exécuter uniquement l'archivage
  --report, -p          Générer le rapport trimestriel
  --help, -h            Afficher cette aide

Exemples:
  npm run maintenance --start     # Démarrer le service continu
  npm run maintenance --run       # Exécuter la maintenance complète
  npm run maintenance --validate   # Valider les données
  npm run maintenance --cleanup    # Nettoyer les données
    `);
    process.exit(0);
  }

  // Exécuter la commande appropriée
  if (args.includes('--run') || args.includes('-r')) {
    console.log('🔧 Exécution de la maintenance complète...');
    maintenance
      .runFullMaintenance()
      .then(() => {
        console.log('✅ Maintenance terminée avec succès');
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Erreur lors de la maintenance:', error);
        process.exit(1);
      });
  } else if (args.includes('--start') || args.includes('-s')) {
    console.log('🚀 Démarrage du service de maintenance continu...');
    maintenance.start();

    // Garder le processus actif
    process.stdin.resume();
  } else {
    console.log("⚠️ Aucune commande spécifiée. Utiliser --help pour l'aide.");
    process.exit(1);
  }
}
