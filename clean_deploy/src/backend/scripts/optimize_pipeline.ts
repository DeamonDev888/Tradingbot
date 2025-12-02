#!/usr/bin/env ts-node

import { Pool } from 'pg';
import { NewsAggregator } from '../ingestion/NewsAggregator';
import { NewsDatabaseService } from '../database/NewsDatabaseService';
import { Vortex500Agent } from '../agents/Vortex500Agent';
import * as dotenv from 'dotenv';

dotenv.config();

interface OptimizationReport {
  timestamp: Date;
  current: {
    totalNews: number;
    recentNews24h: number;
    recentNews48h: number;
    bufferUtilization: number;
    avgAgentEfficiency: number;
  };
  target: {
    recentNews24h: number;
    recentNews48h: number;
    bufferUtilization: number;
    avgAgentEfficiency: number;
  };
  optimizations: {
    scraping: {
      frequency: string;
      sources: string[];
      priority: number;
    };
    database: {
      indexing: string[];
      cleanup: string[];
      optimization: string[];
    };
    agents: {
      [agentName: string]: {
        bufferWindow: number;
        caching: boolean;
        optimization: string[];
      };
    };
  };
  actions: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  impact: {
    dataVolume: string;
    performance: string;
    reliability: string;
  };
}

class PipelineOptimizer {
  private pool: Pool;
  private dbService: NewsDatabaseService;
  private newsAggregator: NewsAggregator;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'financial_analyst',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '9022',
      max: 20,
    });
    this.dbService = new NewsDatabaseService();
    this.newsAggregator = new NewsAggregator();
  }

  async testConnection(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      return true;
    } catch {
      return false;
    }
  }

  async analyzeCurrentState(): Promise<OptimizationReport['current']> {
    const client = await this.pool.connect();
    try {
      const stats = await client.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE published_at >= NOW() - INTERVAL '24 hours') as recent_24h,
          COUNT(*) FILTER (WHERE published_at >= NOW() - INTERVAL '48 hours') as recent_48h
        FROM news_items
      `);

      const row = stats.rows[0];
      return {
        totalNews: parseInt(row.total),
        recentNews24h: parseInt(row.recent_24h),
        recentNews48h: parseInt(row.recent_48h),
        bufferUtilization: 0, // calculé après analyse des agents
        avgAgentEfficiency: 0, // calculé après analyse des agents
      };
    } finally {
      client.release();
    }
  }

  async analyzeAgentPerformance(): Promise<{
    bufferUtilization: number;
    avgAgentEfficiency: number;
    agentStats: { [name: string]: { itemsUsed: number; efficiency: number } };
  }> {
    const agentStats: { [name: string]: { itemsUsed: number; efficiency: number } } = {};

    try {
      console.log('🔍 Analyse performance Vortex500Agent...');
      const vortexAgent = new Vortex500Agent();
      const startVortex = Date.now();
      const vortexResult = (await vortexAgent.analyzeMarketSentiment(false)) as any;
      const vortexTime = Date.now() - startVortex;

      agentStats['Vortex500Agent'] = {
        itemsUsed: vortexResult.news_count || 0,
        efficiency:
          (vortexResult.news_count || 0) > 0
            ? (vortexResult.news_count || 0) / (vortexTime / 1000)
            : 0,
      };
    } catch (error) {
      console.error('❌ Erreur Vortex500Agent:', error);
      agentStats['Vortex500Agent'] = { itemsUsed: 0, efficiency: 0 };
    }

    // Calculer les métriques moyennes
    const agents = Object.values(agentStats);
    const totalItems = agents.reduce((sum, agent) => sum + agent.itemsUsed, 0);
    const totalEfficiency = agents.reduce((sum, agent) => sum + agent.efficiency, 0);
    const avgAgentEfficiency = agents.length > 0 ? totalEfficiency / agents.length : 0;

    return {
      bufferUtilization: 0, // calculé après analyse du buffer DB
      avgAgentEfficiency,
      agentStats,
    };
  }

  async generateOptimizationPlan(): Promise<OptimizationReport> {
    console.log("🚀 Génération du plan d'optimisation du pipeline...");

    const report: OptimizationReport = {
      timestamp: new Date(),
      current: await this.analyzeCurrentState(),
      target: {
        recentNews24h: 100, // Objectif
        recentNews48h: 300,
        bufferUtilization: 50, // 50% d'utilisation optimale
        avgAgentEfficiency: 20, // 20 items/s
      },
      optimizations: {
        scraping: {
          frequency: '',
          sources: [],
          priority: 1,
        },
        database: {
          indexing: [],
          cleanup: [],
          optimization: [],
        },
        agents: {},
      },
      actions: {
        immediate: [],
        shortTerm: [],
        longTerm: [],
      },
      impact: {
        dataVolume: '',
        performance: '',
        reliability: '',
      },
    };

    // Analyser la performance des agents
    const agentPerf = await this.analyzeAgentPerformance();
    report.current.bufferUtilization = agentPerf.bufferUtilization;
    report.current.avgAgentEfficiency = agentPerf.avgAgentEfficiency;

    // Générer le plan d'optimisation
    this.generateScrapingOptimizations(report);
    this.generateDatabaseOptimizations(report);
    this.generateAgentOptimizations(report, agentPerf.agentStats);
    this.generateActionPlan(report);
    this.calculateImpact(report);

    return report;
  }

  private generateScrapingOptimizations(report: OptimizationReport): void {
    const current = report.current;
    const target = report.target;

    report.optimizations.scraping.frequency =
      current.recentNews24h < 50
        ? 'Every 15 minutes'
        : current.recentNews24h < 100
          ? 'Every 30 minutes'
          : 'Every hour';

    report.optimizations.scraping.sources = [
      'Finnhub (augmenter fréquence)',
      'Trading Economics (compléter)',
      'Reddit/WallStreetBets (ajouter)',
      'Twitter API (ajouter)',
    ];

    if (current.recentNews24h < target.recentNews24h) {
      report.optimizations.scraping.priority = 1; // Haute priorité
    } else {
      report.optimizations.scraping.priority = 2; // Moyenne priorité
    }
  }

  private generateDatabaseOptimizations(report: OptimizationReport): void {
    report.optimizations.database.indexing = [
      'CREATE INDEX CONCURRENTLY idx_news_items_published_at ON news_items(published_at DESC)',
      'CREATE INDEX CONCURRENTLY idx_news_items_source ON news_items(source)',
      'CREATE INDEX CONCURRENTLY idx_news_items_sentiment ON news_items(sentiment)',
      "PARTITION BY RANGE(published_at) INTERVAL '1 month'",
    ];

    report.optimizations.database.cleanup = [
      'Archiver news > 90 jours vers news_items_archive',
      'Nettoyer les doublons basés sur URL hash',
      'Supprimer items avec title NULL ou vide',
      'Supprimer items avec sentiment invalide',
    ];

    report.optimizations.database.optimization = [
      'VACUUM ANALYZE news_items (hebdomadaire)',
      'pg_repack news_items (mensuel)',
      'Augmenter shared_buffers à 25% RAM',
      'Configurer pg_stat_statements pour monitoring',
    ];
  }

  private generateAgentOptimizations(report: OptimizationReport, agentStats: any): void {
    Object.entries(agentStats).forEach(([name, stats]: [string, any]) => {
      report.optimizations.agents[name] = {
        bufferWindow: this.calculateOptimalBufferWindow(stats.itemsUsed),
        caching: stats.efficiency > 10,
        optimization: this.generateAgentOptimizationList(name, stats),
      };
    });

    // Optimisations spécifiques pour Vortex500Agent
    if (agentStats['Vortex500Agent']) {
      const vortex = agentStats['Vortex500Agent'];
      report.optimizations.agents['Vortex500Agent'].optimization.push(
        'Réduire fenêtre temporelle à 48h si données fraîches disponibles',
        "Implémenter cache des résultats d'analyse",
        'Optimiser taille du prompt KiloCode'
      );
    }
  }

  private calculateOptimalBufferWindow(itemsUsed: number): number {
    if (itemsUsed > 100) return 24; // 24h
    if (itemsUsed > 50) return 48; // 48h
    if (itemsUsed > 20) return 72; // 3j
    return 168; // 7j
  }

  private generateAgentOptimizationList(name: string, stats: any): string[] {
    const optimizations: string[] = [];

    if (stats.efficiency < 10) {
      optimizations.push("Optimiser algorithme d'analyse");
      optimizations.push('Réduire taille des données traitées');
    }

    if (stats.efficiency < 5) {
      optimizations.push('Implémenter parallélisation');
      optimizations.push('Optimiser accès base de données');
    }

    if (stats.itemsUsed < 20) {
      optimizations.push('Augmenter fenêtre temporelle');
    }

    if (stats.itemsUsed > 200) {
      optimizations.push('Réduire fenêtre temporelle');
      optimizations.push('Implémenter sampling intelligent');
    }

    return optimizations;
  }

  private generateActionPlan(report: OptimizationReport): void {
    const { current, target } = report;

    // Actions immédiates (aujourd'hui)
    report.actions.immediate = [
      'Lancer scraping immédiat (news-gather)',
      'Vérifier connexion APIs externes',
      'Démarrer scraping fréquent (chaque 15 min)',
    ];

    if (current.recentNews24h < 20) {
      report.actions.immediate.push('URGENT: Manque critique de données récentes');
    }

    // Actions court terme (cette semaine)
    report.actions.shortTerm = [
      'Appliquer indexation database',
      'Nettoyer données corrompues',
      'Optimiser configuration agents',
      'Implémenter monitoring continu',
    ];

    // Actions long terme (ce mois)
    report.actions.longTerm = [
      'Mettre en place partitionnement',
      'Archiver anciennes données',
      'Ajouter nouvelles sources de données',
      'Implémenter cache distribué',
    ];
  }

  private calculateImpact(report: OptimizationReport): void {
    const { current, target } = report;

    // Impact sur volume de données
    const dataIncrease = target.recentNews24h - current.recentNews24h;
    if (dataIncrease > 80) {
      report.impact.dataVolume = 'Massive (+80+ news/24h)';
    } else if (dataIncrease > 50) {
      report.impact.dataVolume = 'Significative (+50-80 news/24h)';
    } else if (dataIncrease > 20) {
      report.impact.dataVolume = 'Modérée (+20-50 news/24h)';
    } else {
      report.impact.dataVolume = 'Minimale (+<20 news/24h)';
    }

    // Impact sur performance
    const efficiencyIncrease = target.avgAgentEfficiency - current.avgAgentEfficiency;
    if (efficiencyIncrease > 15) {
      report.impact.performance = 'High (>15 items/s improvement)';
    } else if (efficiencyIncrease > 10) {
      report.impact.performance = 'Medium (10-15 items/s improvement)';
    } else if (efficiencyIncrease > 5) {
      report.impact.performance = 'Low (5-10 items/s improvement)';
    } else {
      report.impact.performance = 'Minimal (<5 items/s improvement)';
    }

    // Impact sur fiabilité
    const issues = report.actions.immediate.length + report.actions.shortTerm.length;
    if (issues > 10) {
      report.impact.reliability = 'High (system stability guaranteed)';
    } else if (issues > 6) {
      report.impact.reliability = 'Medium (most risks mitigated)';
    } else if (issues > 3) {
      report.impact.reliability = 'Low (some risks remain)';
    } else {
      report.impact.reliability = 'Minimal (critical risks remain)';
    }
  }

  formatReport(report: OptimizationReport): string {
    const lines: string[] = [];

    lines.push('='.repeat(80));
    lines.push("🚀 RAPPORT D'OPTIMISATION DU PIPELINE DE DONNÉES");
    lines.push('='.repeat(80));
    lines.push(`Timestamp: ${report.timestamp.toLocaleString('fr-FR')}`);
    lines.push('');

    // État actuel vs cible
    lines.push('📊 ÉTAT ACTUEL vs CIBLE:');
    lines.push(`                ACTUEL      CIBLE       ÉCART`);
    lines.push(
      `News 24h        ${report.current.recentNews24h.toString().padStart(4)}        ${report.target.recentNews24h.toString().padStart(4)}        ${Math.abs(
        report.target.recentNews24h - report.current.recentNews24h
      )
        .toString()
        .padStart(4)}`
    );
    lines.push(
      `News 48h        ${report.current.recentNews48h.toString().padStart(4)}        ${report.target.recentNews48h.toString().padStart(4)}        ${Math.abs(
        report.target.recentNews48h - report.current.recentNews48h
      )
        .toString()
        .padStart(4)}`
    );
    lines.push(
      `Buffer util.   ${report.current.bufferUtilization.toString().padStart(4)}%        ${report.target.bufferUtilization.toString().padStart(4)}%        ${Math.abs(
        report.target.bufferUtilization - report.current.bufferUtilization
      )
        .toString()
        .padStart(4)}%`
    );
    lines.push(
      `Efficacité       ${report.current.avgAgentEfficiency.toFixed(1).padStart(4)}        ${report.target.avgAgentEfficiency.toString().padStart(4)}        ${Math.abs(
        report.target.avgAgentEfficiency - report.current.avgAgentEfficiency
      )
        .toFixed(1)
        .padStart(4)}`
    );
    lines.push('');

    // Optimisations scraping
    lines.push('📡 OPTIMISATIONS SCRAPING:');
    lines.push(`   • Fréquence: ${report.optimizations.scraping.frequency}`);
    lines.push(
      `   • Priorité: ${report.optimizations.scraping.priority === 1 ? '🔴 Haute' : '🟡 Moyenne'}`
    );
    lines.push(`   • Sources à ajouter:`);
    report.optimizations.scraping.sources.slice(0, 5).forEach(source => {
      lines.push(`     - ${source}`);
    });
    lines.push('');

    // Optimisations database
    lines.push('🗄️ OPTIMISATIONS BASE DE DONNÉES:');
    lines.push('   • Indexation:');
    report.optimizations.database.indexing.slice(0, 3).forEach(index => {
      lines.push(`     - ${index}`);
    });
    lines.push('   • Nettoyage:');
    report.optimizations.database.cleanup.slice(0, 3).forEach(cleanup => {
      lines.push(`     - ${cleanup}`);
    });
    lines.push('   • Performance:');
    report.optimizations.database.optimization.slice(0, 3).forEach(optimization => {
      lines.push(`     - ${optimization}`);
    });
    lines.push('');

    // Optimisations agents
    lines.push('🤖 OPTIMISATIONS AGENTS:');
    Object.entries(report.optimizations.agents).forEach(([name, agent]) => {
      lines.push(`   • ${name}:`);
      lines.push(`     - Fenêtre buffer: ${agent.bufferWindow}h`);
      lines.push(`     - Cache: ${agent.caching ? '✅' : '❌'}`);
      lines.push(`     - Optimisations:`);
      agent.optimization.slice(0, 3).forEach(opt => {
        lines.push(`       * ${opt}`);
      });
      lines.push('');
    });

    // Plan d'action
    lines.push("📋 PLAN D'ACTION:");
    lines.push("   🔥 IMMÉDIAT (aujourd'hui):");
    report.actions.immediate.slice(0, 5).forEach((action, index) => {
      lines.push(`     ${index + 1}. ${action}`);
    });
    if (report.actions.immediate.length > 5) {
      lines.push(`     • ... et ${report.actions.immediate.length - 5} autres actions`);
    }
    lines.push('');

    lines.push('   📅 COURT TERME (cette semaine):');
    report.actions.shortTerm.slice(0, 5).forEach((action, index) => {
      lines.push(`     ${index + 1}. ${action}`);
    });
    if (report.actions.shortTerm.length > 5) {
      lines.push(`     • ... et ${report.actions.shortTerm.length - 5} autres actions`);
    }
    lines.push('');

    lines.push('   🎯 LONG TERME (ce mois):');
    report.actions.longTerm.slice(0, 5).forEach((action, index) => {
      lines.push(`     ${index + 1}. ${action}`);
    });
    if (report.actions.longTerm.length > 5) {
      lines.push(`     • ... et ${report.actions.longTerm.length - 5} autres actions`);
    }
    lines.push('');

    // Impact attendu
    lines.push('📈 IMPACT ATTENDU:');
    lines.push(`   • Volume données: ${report.impact.dataVolume}`);
    lines.push(`   • Performance: ${report.impact.performance}`);
    lines.push(`   • Fiabilité: ${report.impact.reliability}`);
    lines.push('');

    // Évaluation
    lines.push("🎯 ÉVALUATION DE L'OPTIMISATION:");

    const criticalIssues = report.actions.immediate.length;
    const complexity =
      report.actions.immediate.length +
      report.actions.shortTerm.length +
      report.actions.longTerm.length;

    if (criticalIssues > 5) {
      lines.push('   • Priorité: 🔴 CRITIQUE - Action immédiate requise');
    } else if (criticalIssues > 2) {
      lines.push('   • Priorité: 🟡 HAUTE - Planification semaine requise');
    } else {
      lines.push('   • Priorité: 🟢 MOYENNE - Améliorations progressives');
    }

    lines.push(
      `   • Complexité: ${complexity < 10 ? '🟢 Faible' : complexity < 20 ? '🟡 Moyenne' : '🔴 Élevée'} (${complexity} actions totales)`
    );
    lines.push(
      `   • ROI attendu: ${report.impact.performance === 'High' ? '🟢 Élevé' : report.impact.performance === 'Medium' ? '🟡 Moyen' : '�fa Faible'}`
    );

    lines.push('='.repeat(80));

    return lines.join('\n');
  }

  async executeImmediateActions(): Promise<{ success: string[]; failed: string[] }> {
    console.log('🚀 Exécution des actions immédiates...');

    const results = { success: [], failed: [] } as { success: string[]; failed: string[] };

    // Action 1: Lancer scraping immédiat
    try {
      console.log('📡 Démarrage scraping immédiat...');
      await this.newsAggregator.fetchAndSaveAllNews();
      results.success.push('Scraping immédiat terminé');
    } catch (error) {
      console.error('❌ Erreur scraping:', error);
      results.failed.push(`Scraping: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Action 2: Vérifier état database
    try {
      console.log('🔍 Vérification état database...');
      const isFresh = await this.dbService.isCacheFresh(2);
      results.success.push(`Database cache status: ${isFresh ? 'FRESH' : 'STALE'}`);
    } catch (error) {
      console.error('❌ Erreur vérification DB:', error);
      results.failed.push(
        `Vérification DB: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return results;
  }

  async close(): Promise<void> {
    await this.pool.end();
    await this.dbService.close();
    console.log('🔌 Connexions fermées');
  }
}

// Script principal
if (require.main === module) {
  (async () => {
    const optimizer = new PipelineOptimizer();

    console.log("🚀 Démarrage de l'optimisation du pipeline...");
    console.log('');

    // Test de connexion
    const isConnected = await optimizer.testConnection();
    if (!isConnected) {
      console.error('❌ Impossible de se connecter à la base de données');
      process.exit(1);
    }

    // Génération du plan
    const report = await optimizer.generateOptimizationPlan();
    const reportText = optimizer.formatReport(report);
    console.log(reportText);

    // Exécuter les actions immédiates si demandé
    const executeImmediate = process.argv.includes('--execute');

    if (executeImmediate) {
      console.log('\n🚀 EXÉCUTION DES ACTIONS IMMÉDIATES...');
      const results = await optimizer.executeImmediateActions();

      console.log('\n✅ Actions réussies:');
      results.success.forEach(success => console.log(`   • ${success}`));

      if (results.failed.length > 0) {
        console.log('\n❌ Actions échouées:');
        results.failed.forEach(failed => console.log(`   • ${failed}`));
      }

      process.exit(results.failed.length > 0 ? 1 : 0);
    } else {
      // Évaluation sans exécution
      const criticalIssues = report.actions.immediate.length;
      const hasPerformanceIssues =
        report.current.avgAgentEfficiency < report.target.avgAgentEfficiency;
      const hasDataIssues = report.current.recentNews24h < report.target.recentNews24h * 0.5;

      console.log('\n🎯 ÉVALUATION:');

      if (criticalIssues > 5 || hasDataIssues) {
        console.log('🔴 OPTIMISATION CRITIQUE REQUISE');
        console.log(`   • ${criticalIssues} actions critiques identifiées`);
        console.log('   • Exécutez avec --execute pour démarrer immédiatement');
        process.exit(2);
      } else if (criticalIssues > 2 || hasPerformanceIssues) {
        console.log('🟡 OPTIMISATION RECOMMANDÉE');
        console.log(`   • ${criticalIssues} actions importantes identifiées`);
        console.log('   • Planifiez pour cette semaine');
        process.exit(1);
      } else {
        console.log('🟢 ÉTAT OPTIMAL');
        console.log('   • Améliorations mineures seulement');
        process.exit(0);
      }
    }

    await optimizer.close();
  })().catch(error => {
    console.error("❌ Erreur critique de l'optimisation:", error);
    process.exit(3);
  });
}

export { PipelineOptimizer };
