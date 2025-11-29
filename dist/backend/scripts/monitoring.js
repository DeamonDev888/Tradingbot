#!/usr/bin/env ts-node
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
dotenv.config();
export class MonitoringService {
    pool;
    logFile;
    metricsHistory = [];
    maxHistorySize = 1440; // 24h of minutes
    constructor() {
        this.pool = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'financial_analyst',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '9022',
        });
        this.logFile = path.join(process.cwd(), 'monitoring.log');
    }
    async testConnection() {
        try {
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();
            return true;
        }
        catch {
            return false;
        }
    }
    alertRules = [
        {
            name: 'database_connection',
            condition: m => !m.database.connected,
            severity: 'critical',
            message: 'Base de données inaccessible',
            enabled: true,
        },
        {
            name: 'no_recent_data',
            condition: m => m.database.connected && m.database.recentNews24h < 10,
            severity: 'critical',
            message: 'Aucune donnée récente (moins de 10 news/24h)',
            enabled: true,
        },
        {
            name: 'high_duplication_rate',
            condition: m => {
                const dupRate = m.database.totalNews > 0 ? m.database.duplicates / m.database.totalNews : 0;
                return dupRate > 0.1; // 10%
            },
            severity: 'warning',
            message: 'Taux de duplication élevé (>10%)',
            enabled: true,
        },
        {
            name: 'quality_issues',
            condition: m => {
                const qualityRate = m.database.totalNews > 0 ? m.database.qualityIssues / m.database.totalNews : 0;
                return qualityRate > 0.15; // 15%
            },
            severity: 'warning',
            message: 'Qualité des données problématique (>15%)',
            enabled: true,
        },
        {
            name: 'slow_queries',
            condition: m => m.performance.slowQueries > 5,
            severity: 'warning',
            message: 'Requêtes lentes détectées',
            enabled: true,
        },
        {
            name: 'connection_pool_exhaustion',
            condition: m => m.performance.connectionPoolActive > 15,
            severity: 'critical',
            message: 'Pool de connexions presque épuisé',
            enabled: true,
        },
        {
            name: 'low_data_volume',
            condition: m => m.database.connected && m.database.recentNews7d < 100,
            severity: 'warning',
            message: 'Faible volume de données (moins de 100 news/7j)',
            enabled: true,
        },
    ];
    async collectMetrics() {
        const metrics = {
            timestamp: new Date(),
            database: {
                connected: false,
                totalNews: 0,
                recentNews24h: 0,
                recentNews7d: 0,
                duplicates: 0,
                qualityIssues: 0,
            },
            performance: {
                avgQueryTime: 0,
                slowQueries: 0,
                connectionPoolActive: 0,
                connectionPoolIdle: 0,
            },
            alerts: {
                critical: [],
                warnings: [],
                info: [],
            },
            health: {
                score: 100,
                status: 'healthy',
                issues: [],
            },
        };
        const client = await this.pool.connect();
        try {
            // Test de connexion et statistiques DB
            metrics.database.connected = true;
            // Statistiques générales
            const startQuery = Date.now();
            const generalStats = await client.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE published_at >= NOW() - INTERVAL '24 hours') as recent_24h,
          COUNT(*) FILTER (WHERE published_at >= NOW() - INTERVAL '7 days') as recent_7d,
          COUNT(*) - COUNT(DISTINCT url) as duplicates
        FROM news_items
      `);
            metrics.performance.avgQueryTime = Date.now() - startQuery;
            if (generalStats.rows.length > 0) {
                const stats = generalStats.rows[0];
                metrics.database.totalNews = parseInt(stats.total);
                metrics.database.recentNews24h = parseInt(stats.recent_24h);
                metrics.database.recentNews7d = parseInt(stats.recent_7d);
                metrics.database.duplicates = parseInt(stats.duplicates);
            }
            // Qualité des données
            const qualityChecks = await client.query(`
        SELECT
          COUNT(*) FILTER (WHERE title IS NULL OR TRIM(title) = '') as empty_titles,
          COUNT(*) FILTER (WHERE url IS NULL OR url NOT LIKE 'http%') as invalid_urls,
          COUNT(*) FILTER (WHERE sentiment NOT IN ('bullish', 'bearish', 'neutral', NULL)) as invalid_sentiments,
          COUNT(*) FILTER (WHERE published_at > NOW() + INTERVAL '1 hour') as future_dates,
          COUNT(*) FILTER (WHERE published_at < NOW() - INTERVAL '90 days') as very_old_dates
        FROM news_items
      `);
            if (qualityChecks.rows.length > 0) {
                const quality = qualityChecks.rows[0];
                metrics.database.qualityIssues =
                    parseInt(quality.empty_titles) +
                        parseInt(quality.invalid_urls) +
                        parseInt(quality.invalid_sentiments) +
                        parseInt(quality.future_dates) +
                        parseInt(quality.very_old_dates);
            }
            // Statistiques de performance
            const poolStats = await client.query(`
        SELECT
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity
        WHERE datname = current_database()
      `);
            if (poolStats.rows.length > 0) {
                const pool = poolStats.rows[0];
                metrics.performance.connectionPoolActive = parseInt(pool.active_connections);
                metrics.performance.connectionPoolIdle = parseInt(pool.idle_connections);
            }
            // Requêtes lentes (simplifié)
            const slowQueryStats = await client
                .query(`
        SELECT COUNT(*) as slow_queries
        FROM pg_stat_statements
        WHERE mean_exec_time > 1000
        AND calls > 10
      `)
                .catch(() => ({ rows: [{ slow_queries: 0 }] }));
            metrics.performance.slowQueries = parseInt(slowQueryStats.rows[0].slow_queries);
            // Évaluation des alertes
            this.evaluateAlerts(metrics);
            // Calcul du score de santé
            this.calculateHealthScore(metrics);
        }
        catch (error) {
            console.error('Erreur lors de la collecte des métriques:', error);
            metrics.database.connected = false;
            metrics.health.score = 0;
            metrics.health.status = 'critical';
            metrics.health.issues.push(`Erreur de collecte: ${error instanceof Error ? error.message : error}`);
        }
        finally {
            client.release();
        }
        // Ajouter à l'historique
        this.metricsHistory.push(metrics);
        if (this.metricsHistory.length > this.maxHistorySize) {
            this.metricsHistory.shift();
        }
        return metrics;
    }
    evaluateAlerts(metrics) {
        for (const rule of this.alertRules.filter(r => r.enabled)) {
            if (rule.condition(metrics)) {
                switch (rule.severity) {
                    case 'critical':
                        metrics.alerts.critical.push(`${rule.name}: ${rule.message}`);
                        break;
                    case 'warning':
                        metrics.alerts.warnings.push(`${rule.name}: ${rule.message}`);
                        break;
                    case 'info':
                        metrics.alerts.info.push(`${rule.name}: ${rule.message}`);
                        break;
                }
            }
        }
    }
    calculateHealthScore(metrics) {
        let score = 100;
        // Pénalités pour les alertes critiques
        score -= metrics.alerts.critical.length * 25;
        // Pénalités pour les alertes de warning
        score -= metrics.alerts.warnings.length * 10;
        // Bonus pour les bonnes métriques
        if (metrics.database.recentNews24h > 100)
            score += 5;
        if (metrics.database.recentNews7d > 1000)
            score += 5;
        if (metrics.database.duplicates === 0)
            score += 5;
        if (metrics.database.qualityIssues === 0)
            score += 5;
        metrics.health.score = Math.max(0, Math.min(100, score));
        if (metrics.health.score >= 80) {
            metrics.health.status = 'healthy';
        }
        else if (metrics.health.score >= 60) {
            metrics.health.status = 'warning';
        }
        else {
            metrics.health.status = 'critical';
        }
        // Générer les problèmes
        if (metrics.alerts.critical.length > 0) {
            metrics.health.issues.push(...metrics.alerts.critical);
        }
        if (metrics.alerts.warnings.length > 0) {
            metrics.health.issues.push(...metrics.alerts.warnings);
        }
    }
    async logToFile(metrics) {
        const logEntry = {
            timestamp: metrics.timestamp.toISOString(),
            health_score: metrics.health.score,
            status: metrics.health.status,
            database: metrics.database,
            performance: {
                avg_query_time: metrics.performance.avgQueryTime,
                slow_queries: metrics.performance.slowQueries,
                active_connections: metrics.performance.connectionPoolActive,
            },
            alerts: {
                critical_count: metrics.alerts.critical.length,
                warning_count: metrics.alerts.warnings.length,
                info_count: metrics.alerts.info.length,
            },
        };
        const logLine = JSON.stringify(logEntry) + '\n';
        try {
            await fs.promises.appendFile(this.logFile, logLine);
        }
        catch (error) {
            console.error("Erreur lors de l'écriture du log:", error);
        }
    }
    formatMetricsReport(metrics) {
        const lines = [];
        lines.push('='.repeat(80));
        lines.push('📊 RAPPORT DE MONITORING SYSTÈME');
        lines.push('='.repeat(80));
        lines.push(`Timestamp: ${metrics.timestamp.toLocaleString('fr-FR')}`);
        lines.push('');
        // Score de santé
        const scoreEmoji = metrics.health.status === 'healthy'
            ? '🟢'
            : metrics.health.status === 'warning'
                ? '🟡'
                : '🔴';
        lines.push(`${scoreEmoji} SANTÉ GLOBALE: ${metrics.health.score}/100 (${metrics.health.status.toUpperCase()})`);
        lines.push('');
        // Statistiques database
        lines.push('🗄️ BASE DE DONNÉES:');
        lines.push(`   • Connexion: ${metrics.database.connected ? '✅ Connectée' : '❌ Déconnectée'}`);
        lines.push(`   • Total news: ${metrics.database.totalNews.toLocaleString()}`);
        lines.push(`   • News 24h: ${metrics.database.recentNews24h.toLocaleString()}`);
        lines.push(`   • News 7j: ${metrics.database.recentNews7d.toLocaleString()}`);
        lines.push(`   • Doublons: ${metrics.database.duplicates.toLocaleString()}`);
        lines.push(`   • Problèmes qualité: ${metrics.database.qualityIssues.toLocaleString()}`);
        lines.push('');
        // Performance
        lines.push('⚡ PERFORMANCE:');
        lines.push(`   • Temps moyen requête: ${metrics.performance.avgQueryTime}ms`);
        lines.push(`   • Requêtes lentes: ${metrics.performance.slowQueries}`);
        lines.push(`   • Connexions actives: ${metrics.performance.connectionPoolActive}`);
        lines.push(`   • Connexions inactives: ${metrics.performance.connectionPoolIdle}`);
        lines.push('');
        // Alertes
        if (metrics.alerts.critical.length > 0 ||
            metrics.alerts.warnings.length > 0 ||
            metrics.alerts.info.length > 0) {
            lines.push('🚨 ALERTES:');
            if (metrics.alerts.critical.length > 0) {
                lines.push(`   ❌ CRITIQUES (${metrics.alerts.critical.length}):`);
                metrics.alerts.critical.slice(0, 5).forEach(alert => {
                    lines.push(`     • ${alert}`);
                });
            }
            if (metrics.alerts.warnings.length > 0) {
                lines.push(`   ⚠️ WARNINGS (${metrics.alerts.warnings.length}):`);
                metrics.alerts.warnings.slice(0, 5).forEach(alert => {
                    lines.push(`     • ${alert}`);
                });
            }
            if (metrics.alerts.info.length > 0) {
                lines.push(`   ℹ️ INFOS (${metrics.alerts.info.length}):`);
                metrics.alerts.info.slice(0, 3).forEach(alert => {
                    lines.push(`     • ${alert}`);
                });
            }
            lines.push('');
        }
        // Problèmes de santé
        if (metrics.health.issues.length > 0) {
            lines.push('🔍 PROBLÈMES DÉTECTÉS:');
            metrics.health.issues.slice(0, 10).forEach((issue, index) => {
                lines.push(`   ${index + 1}. ${issue}`);
            });
            if (metrics.health.issues.length > 10) {
                lines.push(`   • ... et ${metrics.health.issues.length - 10} autres problèmes`);
            }
            lines.push('');
        }
        // Tendances (si historique disponible)
        if (this.metricsHistory.length > 10) {
            const recentMetrics = this.metricsHistory.slice(-10);
            const avgHealthScore = recentMetrics.reduce((sum, m) => sum + m.health.score, 0) / recentMetrics.length;
            const trend = metrics.health.score > avgHealthScore
                ? '↗️ Amélioration'
                : metrics.health.score < avgHealthScore
                    ? '↘️ Dégradation'
                    : '➡️ Stable';
            lines.push('📈 TENDANCES (10 dernières mesures):');
            lines.push(`   • Score moyen: ${avgHealthScore.toFixed(1)}/100`);
            lines.push(`   • Tendance: ${trend}`);
            lines.push('');
        }
        lines.push('='.repeat(80));
        return lines.join('\n');
    }
    getMetricsHistory(minutes = 60) {
        const cutoff = new Date(Date.now() - minutes * 60 * 1000);
        return this.metricsHistory.filter(m => m.timestamp >= cutoff);
    }
    async startContinuousMonitoring(intervalMinutes = 5) {
        console.log(`🚀 Démarrage du monitoring continu (intervalle: ${intervalMinutes} minutes)...`);
        const monitor = async () => {
            try {
                const metrics = await this.collectMetrics();
                await this.logToFile(metrics);
                console.log(`📊 [${new Date().toLocaleTimeString()}] Score: ${metrics.health.score}/100 (${metrics.health.status})`);
                if (metrics.alerts.critical.length > 0) {
                    console.error(`🚨 ALERTES CRITIQUES: ${metrics.alerts.critical.length}`);
                    metrics.alerts.critical.forEach(alert => console.error(`   • ${alert}`));
                }
                if (metrics.alerts.warnings.length > 0) {
                    console.warn(`⚠️ WARNINGS: ${metrics.alerts.warnings.length}`);
                    metrics.alerts.warnings.forEach(warning => console.warn(`   • ${warning}`));
                }
            }
            catch (error) {
                console.error('❌ Erreur lors du monitoring:', error);
            }
        };
        // Première exécution immédiate
        await monitor();
        // Configuration de l'intervalle
        setInterval(monitor, intervalMinutes * 60 * 1000);
    }
    async close() {
        await this.pool.end();
        console.log('🔌 Connexion monitoring fermée');
    }
}
// Script principal
if (require.main === module) {
    (async () => {
        const monitoring = new MonitoringService();
        console.log('🚀 Démarrage du monitoring...');
        // Test de connexion
        const isConnected = await monitoring.testConnection();
        if (!isConnected) {
            console.error('❌ Impossible de se connecter à la base de données');
            process.exit(1);
        }
        // Collecte et affichage des métriques
        const metrics = await monitoring.collectMetrics();
        const report = monitoring.formatMetricsReport(metrics);
        console.log(report);
        // Évaluation
        if (metrics.health.status === 'critical') {
            console.log('\n🔴 ÉTAT CRITIQUE - Action immédiate requise');
            process.exit(2);
        }
        else if (metrics.health.status === 'warning') {
            console.log('\n🟡 ÉTAT ATTENTION - Surveillance recommandée');
            process.exit(1);
        }
        else {
            console.log('\n🟢 ÉTAT SAIN - Système fonctionnel');
            // Démarrer le monitoring continu si demandé
            if (process.argv.includes('--continuous')) {
                const interval = parseInt(process.argv.find(arg => arg.startsWith('--interval='))?.split('=')[1] || '5');
                await monitoring.startContinuousMonitoring(interval);
                // Garder le processus en vie
                process.on('SIGINT', async () => {
                    console.log('\n🛑 Arrêt du monitoring...');
                    await monitoring.close();
                    process.exit(0);
                });
            }
            else {
                process.exit(0);
            }
        }
    })().catch(error => {
        console.error('❌ Erreur critique du monitoring:', error);
        process.exit(3);
    });
}
//# sourceMappingURL=monitoring.js.map