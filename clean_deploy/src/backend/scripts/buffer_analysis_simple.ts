#!/usr/bin/env ts-node

import { Pool } from 'pg';
import { Vortex500Agent } from '../agents/Vortex500Agent';
import { RougePulseAgent } from '../agents/RougePulseAgent';
import { NewsDatabaseService } from '../database/NewsDatabaseService';
import * as dotenv from 'dotenv';

dotenv.config();

interface SimpleBufferReport {
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
      newsItemsUsed: number;
      queryTime: number;
      source: string;
      efficiency: number; // items/seconde
    };
  };
  recommendations: string[];
}

class SimpleBufferAnalyzer {
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
          AVG(pg_column_size(title)) as avg_item_size
        FROM news_items
      `);

      const queryTime = Date.now() - startQuery;

      // Obtenir la taille de la table
      const tableSize = await client.query(`
        SELECT pg_total_relation_size('news_items') as table_size_bytes
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
    newsItemsUsed: number;
    queryTime: number;
    source: string;
    efficiency: number;
  }> {
    const startAnalysis = Date.now();

    try {
      console.log(`🔍 Analyse de l'agent ${agentName}...`);

      // Analyser l'utilisation du buffer par l'agent
      const analysisResult = await agent.analyzeMarketSentiment(false);

      const analysisTime = Date.now() - startAnalysis;

      // Extraire les métriques pertinentes
      const newsItemsUsed = analysisResult.news_count || 0;
      const source = analysisResult.data_source || 'unknown';
      const efficiency = newsItemsUsed > 0 ? newsItemsUsed / (analysisTime / 1000) : 0;

      console.log(`   • Items utilisés: ${newsItemsUsed}`);
      console.log(`   • Temps d'analyse: ${analysisTime}ms`);
      console.log(`   • Source: ${source}`);
      console.log(`   • Efficacité: ${efficiency.toFixed(2)} items/s`);

      return {
        newsItemsUsed,
        queryTime: analysisTime,
        source,
        efficiency,
      };
    } catch (error) {
      console.error(`❌ Erreur analyse ${agentName}:`, error);
      return {
        newsItemsUsed: 0,
        queryTime: 0,
        source: 'error',
        efficiency: 0,
      };
    }
  }

  async generateReport(): Promise<SimpleBufferReport> {
    console.log("🚀 Génération du rapport d'analyse du buffer...");

    const report: SimpleBufferReport = {
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
      recommendations: [],
    };

    // Test de connexion DB
    report.database.connected = await this.testConnection();
    if (!report.database.connected) {
      report.recommendations.push('🔧 Corriger la connexion à la base de données');
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

    try {
      const vortexAgent = new Vortex500Agent();
      report.agents['Vortex500Agent'] = await this.analyzeAgentBufferUsage(
        'Vortex500Agent',
        vortexAgent
      );
    } catch (error) {
      console.error('❌ Erreur Vortex500Agent:', error);
      report.agents['Vortex500Agent'] = {
        newsItemsUsed: 0,
        queryTime: 0,
        source: 'error',
        efficiency: 0,
      };
    }

    try {
      const rougeAgent = new RougePulseAgent();
      report.agents['RougePulseAgent'] = await this.analyzeAgentBufferUsage(
        'RougePulseAgent',
        rougeAgent
      );
    } catch (error) {
      console.error('❌ Erreur RougePulseAgent:', error);
      report.agents['RougePulseAgent'] = {
        newsItemsUsed: 0,
        queryTime: 0,
        source: 'error',
        efficiency: 0,
      };
    }

    // Générer les recommandations
    this.generateRecommendations(report);

    return report;
  }

  private generateRecommendations(report: SimpleBufferReport): void {
    const { database, agents } = report;

    // Recommandations liées au buffer
    if (database.recentNews24h < 50) {
      report.recommendations.push('📊 Augmenter la fréquence de scraping (moins de 50 news/24h)');
    }

    if (database.recentNews48h < 100) {
      report.recommendations.push('📊 Volume de données 48h faible (moins de 100 news/48h)');
    }

    if (database.bufferSize > 500) {
      // 500MB
      report.recommendations.push(
        "🗃️ Mettre en place l'archivage des anciennes données (buffer > 500MB)"
      );
    }

    // Efficacité des agents
    Object.entries(agents).forEach(([name, agent]) => {
      if (agent.efficiency < 10) {
        report.recommendations.push(
          `⚡ Optimiser ${name} (efficacité: ${agent.efficiency.toFixed(2)} items/s)`
        );
      }

      if (agent.newsItemsUsed < 50) {
        report.recommendations.push(
          `📊 ${name} utilise peu de données (${agent.newsItemsUsed} items)`
        );
      }

      if (agent.queryTime > 3000) {
        report.recommendations.push(`🐌 ${name} lent (temps: ${agent.queryTime}ms)`);
      }

      if (agent.source === 'error') {
        report.recommendations.push(`🔧 Corriger ${name} (erreur d'analyse)`);
      }
    });

    // Performance de la base de données
    if (database.avgQueryTime > 500) {
      report.recommendations.push('🗄️ Optimiser les requêtes à la base de données (>500ms)');
    }

    // Utilisation globale du buffer
    const avgNewsUsed =
      Object.values(agents).reduce((sum, agent) => sum + agent.newsItemsUsed, 0) /
      (Object.keys(agents).length || 1);

    if (avgNewsUsed < database.recentNews48h * 0.3) {
      report.recommendations.push('📈 Agents sous-utilisent le buffer de données 48h');
    } else if (avgNewsUsed > database.recentNews48h * 0.8) {
      report.recommendations.push('📉 Agents sur-utilisent le buffer de données 48h');
    }
  }

  formatReport(report: SimpleBufferReport): string {
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
      lines.push(`     • Items utilisés: ${agent.newsItemsUsed.toLocaleString()}`);
      lines.push(`     • Temps d'analyse: ${agent.queryTime}ms`);
      lines.push(`     • Source: ${agent.source}`);
      lines.push(`     • Efficacité: ${agent.efficiency.toFixed(2)} items/s`);
      lines.push('');
    });

    // Utilisation globale
    const avgNewsUsed =
      Object.values(report.agents).reduce((sum, agent) => sum + agent.newsItemsUsed, 0) /
      (Object.keys(report.agents).length || 1);
    const bufferUtilization =
      report.database.recentNews48h > 0 ? (avgNewsUsed / report.database.recentNews48h) * 100 : 0;

    lines.push('📈 UTILISATION GLOBALE DU BUFFER:');
    lines.push(`   • Items moyens utilisés: ${avgNewsUsed.toFixed(1)}`);
    lines.push(`   • Buffer disponible (48h): ${report.database.recentNews48h.toLocaleString()}`);
    lines.push(`   • Taux d'utilisation: ${bufferUtilization.toFixed(1)}%`);
    lines.push('');

    // Recommandations
    if (report.recommendations.length > 0) {
      lines.push('💡 RECOMMANDATIONS:');
      report.recommendations.slice(0, 15).forEach((rec, index) => {
        lines.push(`   ${index + 1}. ${rec}`);
      });
      if (report.recommendations.length > 15) {
        lines.push(`   • ... et ${report.recommendations.length - 15} autres recommandations`);
      }
      lines.push('');
    }

    // Évaluation finale
    lines.push('🎯 ÉVALUATION FINALE:');

    const hasCriticalIssues = report.recommendations.length > 8;
    const hasGoodUtilization = bufferUtilization >= 30 && bufferUtilization <= 80;
    const hasGoodPerformance = report.database.avgQueryTime < 500;

    if (!hasCriticalIssues && hasGoodUtilization && hasGoodPerformance) {
      lines.push('   • État: 🟢 OPTIMAL');
      lines.push('   • Les agents utilisent efficacement le buffer');
      lines.push('   • Performance de la base de données bonne');
    } else if (!hasCriticalIssues && hasGoodUtilization) {
      lines.push('   • État: 🟡 BON');
      lines.push('   • Utilisation du buffer acceptable');
      lines.push('   • Améliorations possibles');
    } else {
      lines.push('   • État: 🔴 À AMÉLIORER');
      lines.push('   • Optimisation requise');
      lines.push(`   • ${report.recommendations.length} actions recommandées`);
    }

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
    const analyzer = new SimpleBufferAnalyzer();

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
    const hasCriticalIssues = report.recommendations.length > 8;
    const avgNewsUsed =
      Object.values(report.agents).reduce((sum, agent) => sum + agent.newsItemsUsed, 0) /
      (Object.keys(report.agents).length || 1);
    const bufferUtilization =
      report.database.recentNews48h > 0 ? (avgNewsUsed / report.database.recentNews48h) * 100 : 0;

    console.log('\n🎯 ÉVALUATION:');

    if (
      !hasCriticalIssues &&
      bufferUtilization >= 30 &&
      bufferUtilization <= 80 &&
      report.database.avgQueryTime < 500
    ) {
      console.log('🟢 UTILISATION DU BUFFER OPTIMALE');
      console.log('   • Les agents utilisent efficacement le buffer');
      console.log('   • Performance acceptable');
      process.exit(0);
    } else if (!hasCriticalIssues && bufferUtilization >= 30) {
      console.log('🟡 UTILISATION DU BUFFER BONNE');
      console.log('   • Des améliorations sont possibles');
      console.log(`   • ${report.recommendations.length} recommandations optionnelles`);
      process.exit(1);
    } else {
      console.log('🔴 UTILISATION DU BUFFER CRITIQUE');
      console.log('   • Optimisation requise');
      console.log(`   • ${report.recommendations.length} recommandations à implémenter`);
      process.exit(2);
    }

    await analyzer.close();
  })().catch(error => {
    console.error("❌ Erreur critique de l'analyse:", error);
    process.exit(3);
  });
}

export { SimpleBufferAnalyzer };
