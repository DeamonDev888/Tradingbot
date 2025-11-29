#!/usr/bin/env ts-node

import { Pool } from 'pg';
import { Vortex500Agent } from '../agents/Vortex500Agent';
import { RougePulseAgent } from '../agents/RougePulseAgent';
import { NewsDatabaseService } from '../database/NewsDatabaseService';
import * as dotenv from 'dotenv';

dotenv.config();

interface BufferUsageReport {
  timestamp: Date;
  database: {
    connected: boolean;
    totalNews: number;
    recentNews24h: number;
    recentNews48h: number;
    recentNews7d: number;
    avgQueryTime: number;
    bufferSize: number; // MB
  };
  agents: {
    [agentName: string]: {
      bufferTimeWindow: number; // heures
      newsItemsUsed: number;
      queryTime: number;
      cacheHit: boolean;
      source: 'database_cache' | 'database_fresh' | 'no_data';
      efficiency: number; // items/seconde
    };
  };
  analysis: {
    overallEfficiency: number;
    bufferUtilization: number; // pourcentage
    recommendations: string[];
    bottlenecks: string[];
  };
}

export class BufferUsageAnalyzer {
  private pool: Pool;
  private dbService: NewsDatabaseService;

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

  async analyzeDatabaseBuffer(): Promise<{
    totalNews: number;
    recentNews24h: number;
    recentNews48h: number;
    recentNews7d: number;
    avgQueryTime: number;
    bufferSize: number;
  }> {
    const client = await this.pool.connect();
    try {
      const startQuery = Date.now();

      // Obtenir les statistiques temporelles
      const timeStats = await client.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE published_at >= NOW() - INTERVAL '24 hours') as recent_24h,
          COUNT(*) FILTER (WHERE published_at >= NOW() - INTERVAL '48 hours') as recent_48h,
          COUNT(*) FILTER (WHERE published_at >= NOW() - INTERVAL '7 days') as recent_7d,
          AVG(pg_column_size(title) + pg_column_size(content)) as avg_item_size
        FROM news_items
      `);

      const queryTime = Date.now() - startQuery;

      // Obtenir la taille de la table
      const tableSize = await client.query(`
        SELECT
          pg_size_pretty(pg_total_relation_size('news_items')) as table_size_pretty,
          pg_total_relation_size('news_items') as table_size_bytes
      `);

      const stats = timeStats.rows[0];
      const size = tableSize.rows[0];

      return {
        totalNews: parseInt(stats.total),
        recentNews24h: parseInt(stats.recent_24h),
        recentNews48h: parseInt(stats.recent_48h),
        recentNews7d: parseInt(stats.recent_7d),
        avgQueryTime: queryTime,
        bufferSize: Math.round(parseInt(size.table_size_bytes) / (1024 * 1024)), // MB
      };
    } finally {
      client.release();
    }
  }

  async analyzeAgentBufferUsage(
    agentName: string,
    agent: any
  ): Promise<{
    bufferTimeWindow: number;
    newsItemsUsed: number;
    queryTime: number;
    cacheHit: boolean;
    source: 'database_cache' | 'database_fresh' | 'no_data';
    efficiency: number;
  }> {
    const startAnalysis = Date.now();

    try {
      console.log(`🔍 Analyse de l'agent ${agentName}...`);

      // Analyser l'utilisation du buffer par l'agent
      const analysisResult = await agent.analyzeMarketSentiment(false);

      const analysisTime = Date.now() - startAnalysis;

      // Extraire les métriques pertinentes
      const bufferTimeWindow = this.extractBufferTimeWindow(agent, analysisResult);
      const newsItemsUsed = analysisResult.news_count || 0;
      const cacheHit = analysisResult.data_source === 'database_cache';
      const source =
        analysisResult.data_source === 'database_cache' ||
        analysisResult.data_source === 'database_fresh' ||
        analysisResult.data_source === 'no_data'
          ? analysisResult.data_source
          : ('no_data' as const);
      const efficiency = newsItemsUsed > 0 ? newsItemsUsed / (analysisTime / 1000) : 0;

      console.log(`   • Fenêtre temporelle: ${bufferTimeWindow}h`);
      console.log(`   • Items utilisés: ${newsItemsUsed}`);
      console.log(`   • Temps d'analyse: ${analysisTime}ms`);
      console.log(`   • Source: ${source}`);
      console.log(`   • Efficacité: ${efficiency.toFixed(2)} items/s`);

      return {
        bufferTimeWindow,
        newsItemsUsed,
        queryTime: analysisTime,
        cacheHit,
        source,
        efficiency,
      };
    } catch (error) {
      console.error(`❌ Erreur analyse ${agentName}:`, error);
      return {
        bufferTimeWindow: 0,
        newsItemsUsed: 0,
        queryTime: 0,
        cacheHit: false,
        source: 'no_data',
        efficiency: 0,
      };
    }
  }

  private extractBufferTimeWindow(agent: any, analysisResult: any): number {
    // Analyser le comportement de l'agent pour déterminer la fenêtre temporelle
    const source = analysisResult.data_source;

    if (source === 'database_cache') {
      // Cache fraîch -> probablement 48h ou moins
      return 48;
    } else if (source === 'database_fresh') {
      // Données fraîches -> peut être 7 jours ou plus
      return 168; // 7 jours
    } else {
      return 0;
    }
  }

  async generateReport(): Promise<BufferUsageReport> {
    console.log("🚀 Génération du rapport d'analyse du buffer...");

    const report: BufferUsageReport = {
      timestamp: new Date(),
      database: {
        connected: false,
        totalNews: 0,
        recentNews24h: 0,
        recentNews48h: 0,
        recentNews7d: 0,
        avgQueryTime: 0,
        bufferSize: 0,
      },
      agents: {},
      analysis: {
        overallEfficiency: 0,
        bufferUtilization: 0,
        recommendations: [],
        bottlenecks: [],
      },
    };

    // Test de connexion DB
    report.database.connected = await this.testConnection();
    if (!report.database.connected) {
      report.analysis.recommendations.push('🔧 Corriger la connexion à la base de données');
      return report;
    }

    // Analyser le buffer de la base de données
    console.log('📊 Analyse du buffer de la base de données...');
    const dbStats = await this.analyzeDatabaseBuffer();
    report.database = { ...dbStats, connected: true };

    console.log(`   • Total news: ${report.database.totalNews.toLocaleString()}`);
    console.log(`   • News 24h: ${report.database.recentNews24h.toLocaleString()}`);
    console.log(`   • News 48h: ${report.database.recentNews48h.toLocaleString()}`);
    console.log(`   • News 7j: ${report.database.recentNews7d.toLocaleString()}`);
    console.log(`   • Taille du buffer: ${report.database.bufferSize} MB`);
    console.log(`   • Temps requête moyen: ${report.database.avgQueryTime}ms`);

    // Analyser chaque agent
    console.log("\n🤖 Analyse de l'utilisation du buffer par les agents...");

    const agents = [
      { name: 'Vortex500Agent', instance: new Vortex500Agent() },
      { name: 'RougePulseAgent', instance: new RougePulseAgent() },
    ];

    for (const { name, instance } of agents) {
      report.agents[name] = await this.analyzeAgentBufferUsage(name, instance);
    }

    // Analyser l'efficacité globale
    console.log("\n📈 Analyse de l'efficacité globale...");
    this.analyzeOverallEfficiency(report);

    return report;
  }

  private analyzeOverallEfficiency(report: BufferUsageReport): void {
    const agents = Object.values(report.agents);

    // Efficacité globale moyenne
    const totalEfficiency = agents.reduce((sum, agent) => sum + agent.efficiency, 0);
    report.analysis.overallEfficiency = agents.length > 0 ? totalEfficiency / agents.length : 0;

    // Utilisation du buffer
    const optimalBufferSize = report.database.recentNews48h; // Idéal: utiliser les 48h récentes
    const usedBufferSize =
      agents.reduce((sum, agent) => sum + agent.newsItemsUsed, 0) / agents.length;
    report.analysis.bufferUtilization =
      optimalBufferSize > 0 ? (usedBufferSize / optimalBufferSize) * 100 : 0;

    // Recommandations
    this.generateRecommendations(report);

    // Goulots d'étranglement
    this.identifyBottlenecks(report);
  }

  private generateRecommendations(report: BufferUsageReport): void {
    const { database, agents, analysis } = report;

    // Recommandations liées au buffer
    if (analysis.bufferUtilization < 30) {
      report.analysis.recommendations.push(
        '🔧 Augmenter la fenêtre temporelle du buffer (agents sous-utilisent les données)'
      );
    }

    if (analysis.bufferUtilization > 100) {
      report.analysis.recommendations.push(
        '🔧 Réduire la fenêtre temporelle du buffer (agents sur-utilisent les données)'
      );
    }

    if (database.recentNews24h < 50) {
      report.analysis.recommendations.push(
        '📊 Augmenter la fréquence de scraping pour maintenir le buffer à jour'
      );
    }

    // Efficacité des agents
    Object.entries(agents).forEach(([name, agent]) => {
      if (agent.efficiency < 10) {
        report.analysis.recommendations.push(
          `⚡ Optimiser ${name} (efficacité: ${agent.efficiency.toFixed(2)} items/s)`
        );
      }

      if (!agent.cacheHit) {
        report.analysis.recommendations.push(
          `💾 Activer le cache pour ${name} (requête directe à la base)`
        );
      }
    });

    // Performance de la base de données
    if (database.avgQueryTime > 500) {
      report.analysis.recommendations.push(
        '🗄️ Optimiser les requêtes à la base de données (indexation manquante?)'
      );
    }

    if (database.bufferSize > 1000) {
      // 1GB
      report.analysis.recommendations.push(
        "🗃️ Mettre en place l'archivage des anciennes données (buffer > 1GB)"
      );
    }

    if (database.bufferSize > 100) {
      // 100MB
      report.analysis.recommendations.push(
        '🔄 Implémenter la rotation des données (buffer > 100MB)'
      );
    }
  }

  private identifyBottlenecks(report: BufferUsageReport): void {
    const { database, agents, analysis } = report;

    // Goulots d'étranglement liés aux données
    if (database.recentNews24h < 20) {
      report.analysis.bottlenecks.push(
        '📉 Volume de données récentes insuffisant (moins de 20 news/24h)'
      );
    }

    if (database.recentNews48h < 100) {
      report.analysis.bottlenecks.push(
        '📉 Volume de données sur 48h faible (moins de 100 news/48h)'
      );
    }

    // Goulots d'étranglement liés aux agents
    Object.entries(agents).forEach(([name, agent]) => {
      if (agent.queryTime > 5000) {
        report.analysis.bottlenecks.push(`🐌 ${name} lent (temps d'analyse: ${agent.queryTime}ms)`);
      }

      if (agent.newsItemsUsed < 50) {
        report.analysis.bottlenecks.push(
          `📊 ${name} utilise peu de données (${agent.newsItemsUsed} items)`
        );
      }
    });

    // Goulots d'étranglement liés à l'efficacité
    if (analysis.overallEfficiency < 20) {
      report.analysis.bottlenecks.push(
        `⚡ Efficacité globale faible (${analysis.overallEfficiency.toFixed(2)} items/s)`
      );
    }

    if (database.avgQueryTime > 1000) {
      report.analysis.bottlenecks.push('🗄️ Requêtes base de données lentes (>1s)');
    }
  }

  formatReport(report: BufferUsageReport): string {
    const lines: string[] = [];

    lines.push('='.repeat(80));
    lines.push("📊 RAPPORT D'ANALYSE DU BUFFER DES AGENTS");
    lines.push('='.repeat(80));
    lines.push(`Timestamp: ${report.timestamp.toLocaleString('fr-FR')}`);
    lines.push('');

    // État de la base de données
    lines.push('🗄️ ÉTAT DU BUFFER DE LA BASE DE DONNÉES:');
    lines.push(`   • Connexion: ${report.database.connected ? '✅ Active' : '❌ Inactive'}`);
    lines.push(`   • Total news: ${report.database.totalNews.toLocaleString()}`);
    lines.push(`   • News 24h: ${report.database.recentNews24h.toLocaleString()}`);
    lines.push(`   • News 48h: ${report.database.recentNews48h.toLocaleString()}`);
    lines.push(`   • News 7j: ${report.database.recentNews7d.toLocaleString()}`);
    lines.push(`   • Taille buffer: ${report.database.bufferSize} MB`);
    lines.push(`   • Temps requête: ${report.database.avgQueryTime}ms`);
    lines.push('');

    // Analyse des agents
    lines.push('🤖 UTILISATION DU BUFFER PAR LES AGENTS:');
    Object.entries(report.agents).forEach(([name, agent]) => {
      lines.push(`   📊 ${name}:`);
      lines.push(`     • Fenêtre temporelle: ${agent.bufferTimeWindow}h`);
      lines.push(`     • Items utilisés: ${agent.newsItemsUsed.toLocaleString()}`);
      lines.push(`     • Temps d'analyse: ${agent.queryTime}ms`);
      lines.push(`     • Source: ${agent.source}`);
      lines.push(`     • Cache hit: ${agent.cacheHit ? '✅' : '❌'}`);
      lines.push(`     • Efficacité: ${agent.efficiency.toFixed(2)} items/s`);
      lines.push('');
    });

    // Analyse globale
    lines.push('📈 ANALYSE GLOBALE:');
    lines.push(`   • Efficacité globale: ${report.analysis.overallEfficiency.toFixed(2)} items/s`);
    lines.push(`   • Utilisation buffer: ${report.analysis.bufferUtilization.toFixed(1)}%`);
    lines.push('');

    // Recommandations
    if (report.analysis.recommendations.length > 0) {
      lines.push('💡 RECOMMANDATIONS:');
      report.analysis.recommendations.slice(0, 10).forEach((rec, index) => {
        lines.push(`   ${index + 1}. ${rec}`);
      });
      if (report.analysis.recommendations.length > 10) {
        lines.push(
          `   • ... et ${report.analysis.recommendations.length - 10} autres recommandations`
        );
      }
      lines.push('');
    }

    // Goulots d'étranglement
    if (report.analysis.bottlenecks.length > 0) {
      lines.push("🚨 GOULETS D'ÉTRANGLEMENT DÉTECTÉS:");
      report.analysis.bottlenecks.slice(0, 10).forEach((bottleneck, index) => {
        lines.push(`   ${index + 1}. ${bottleneck}`);
      });
      if (report.analysis.bottlenecks.length > 10) {
        lines.push(`   • ... et ${report.analysis.bottlenecks.length - 10} autres goulots`);
      }
      lines.push('');
    }

    // Évaluation finale
    lines.push('🎯 ÉVALUATION FINALE:');
    const score =
      report.analysis.overallEfficiency > 50 && report.analysis.bufferUtilization > 70
        ? '🟢 OPTIMALE'
        : report.analysis.overallEfficiency > 20 && report.analysis.bufferUtilization > 40
          ? '🟡 BONNE'
          : '🔴 À AMÉLIORER';

    lines.push(`   • Score global: ${score}`);
    lines.push(`   • Actions requises: ${report.analysis.recommendations.length}`);
    lines.push(`   • Problèmes critiques: ${report.analysis.bottlenecks.length}`);

    lines.push('='.repeat(80));

    return lines.join('\n');
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
    const analyzer = new BufferUsageAnalyzer();

    console.log("🚀 Démarrage de l'analyse du buffer des agents...");
    console.log('');

    // Test de connexion
    const isConnected = await analyzer.testConnection();
    if (!isConnected) {
      console.error('❌ Impossible de se connecter à la base de données');
      process.exit(1);
    }

    // Génération du rapport
    const report = await analyzer.generateReport();
    const reportText = analyzer.formatReport(report);
    console.log(reportText);

    // Évaluation
    const hasCriticalBottlenecks = report.analysis.bottlenecks.length > 3;
    const hasLowEfficiency = report.analysis.overallEfficiency < 20;
    const hasPoorBufferUtilization = report.analysis.bufferUtilization < 30;

    console.log('\n🎯 ÉVALUATION:');

    if (!hasCriticalBottlenecks && !hasLowEfficiency && !hasPoorBufferUtilization) {
      console.log('🟢 UTILISATION DU BUFFER OPTIMALE');
      console.log('   • Les agents utilisent efficacement le buffer de données');
      console.log('   • Volume de données adéquat');
      console.log('   • Performance acceptable');
      process.exit(0);
    } else if (hasCriticalBottlenecks || hasLowEfficiency) {
      console.log('🔴 UTILISATION DU BUFFER CRITIQUE');
      console.log('   • Optimisation requise');
      console.log(`   • ${report.analysis.recommendations.length} recommandations à implémenter`);
      process.exit(2);
    } else {
      console.log('🟡 UTILISATION DU BUFFER ACCEPTABLE');
      console.log('   • Des améliorations sont possibles');
      console.log(`   • ${report.analysis.recommendations.length} recommandations optionnelles`);
      process.exit(1);
    }

    await analyzer.close();
  })().catch(error => {
    console.error("❌ Erreur critique de l'analyse:", error);
    process.exit(3);
  });
}
