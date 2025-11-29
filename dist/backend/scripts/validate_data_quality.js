import { Pool } from 'pg';
import * as dotenv from 'dotenv';
// Simple service pour tester la validation sans dépendances complexes
class SimpleNewsDatabaseService {
    pool;
    constructor() {
        this.pool = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'financial_analyst',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '9022',
        });
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
    async getDatabaseStats() {
        const client = await this.pool.connect();
        try {
            const [newsStats, sources] = await Promise.all([
                client.query(`
          SELECT
            COUNT(*) as total_news,
            COUNT(CASE WHEN published_at >= CURRENT_DATE THEN 1 END) as today_news,
            COUNT(CASE WHEN published_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as recent_24h,
            COUNT(CASE WHEN published_at >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_7d,
            COUNT(CASE WHEN sentiment = 'bullish' THEN 1 END) as bullish,
            COUNT(CASE WHEN sentiment = 'bearish' THEN 1 END) as bearish,
            COUNT(CASE WHEN sentiment = 'neutral' THEN 1 END) as neutral,
            MAX(published_at) as latest_news
          FROM news_items
        `),
                client.query(`
          SELECT COUNT(DISTINCT source) as active_sources
          FROM news_items
          WHERE published_at >= NOW() - INTERVAL '7 days'
        `),
            ]);
            return {
                news: newsStats.rows[0],
                sources: sources.rows[0],
            };
        }
        finally {
            client.release();
        }
    }
    async close() {
        await this.pool.end();
    }
}
dotenv.config();
export class DataQualityValidator {
    dbService;
    constructor() {
        this.dbService = new SimpleNewsDatabaseService();
    }
    async runFullValidation() {
        console.log('🔍 Démarrage validation complète de la qualité des données...');
        const pool = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'financial_analyst',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '9022',
        });
        try {
            const report = {
                totalNews: 0,
                recentNews24h: 0,
                recentNews7d: 0,
                duplicates: 0,
                emptyTitles: 0,
                invalidUrls: 0,
                invalidSentiments: 0,
                futureDates: 0,
                veryOldDates: 0,
                sourceDistribution: {},
                sentimentDistribution: {},
                qualityScore: 0,
                issues: [],
                recommendations: [],
            };
            const client = await pool.connect();
            try {
                // 1. Validation des données générales
                console.log('📊 Analyse des données générales...');
                const generalStats = await client.query(`
          SELECT
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE published_at >= NOW() - INTERVAL '24 hours') as recent_24h,
            COUNT(*) FILTER (WHERE published_at >= NOW() - INTERVAL '7 days') as recent_7d,
            COUNT(DISTINCT url) as unique_urls
          FROM news_items
        `);
                report.totalNews = parseInt(generalStats.rows[0].total);
                report.recentNews24h = parseInt(generalStats.rows[0].recent_24h);
                report.recentNews7d = parseInt(generalStats.rows[0].recent_7d);
                report.duplicates = report.totalNews - parseInt(generalStats.rows[0].unique_urls);
                // 2. Validation de la qualité des champs
                console.log('🔍 Validation des champs...');
                const qualityChecks = await client.query(`
          SELECT
            COUNT(*) FILTER (WHERE title IS NULL OR TRIM(title) = '') as empty_titles,
            COUNT(*) FILTER (WHERE url IS NULL OR url NOT LIKE 'http%') as invalid_urls,
            COUNT(*) FILTER (WHERE sentiment NOT IN ('bullish', 'bearish', 'neutral', NULL)) as invalid_sentiments,
            COUNT(*) FILTER (WHERE published_at > NOW() + INTERVAL '1 hour') as future_dates,
            COUNT(*) FILTER (WHERE published_at < NOW() - INTERVAL '90 days') as very_old_dates
          FROM news_items
        `);
                const quality = qualityChecks.rows[0];
                report.emptyTitles = parseInt(quality.empty_titles);
                report.invalidUrls = parseInt(quality.invalid_urls);
                report.invalidSentiments = parseInt(quality.invalid_sentiments);
                report.futureDates = parseInt(quality.future_dates);
                report.veryOldDates = parseInt(quality.very_old_dates);
                // 3. Distribution par source
                console.log('📈 Analyse distribution par source...');
                const sourceStats = await client.query(`
          SELECT source, COUNT(*) as count
          FROM news_items
          GROUP BY source
          ORDER BY count DESC
        `);
                sourceStats.rows.forEach(row => {
                    report.sourceDistribution[row.source] = parseInt(row.count);
                });
                // 4. Distribution par sentiment
                console.log('💭 Analyse distribution par sentiment...');
                const sentimentStats = await client.query(`
          SELECT
            COALESCE(sentiment, 'unspecified') as sentiment,
            COUNT(*) as count
          FROM news_items
          GROUP BY COALESCE(sentiment, 'unspecified')
          ORDER BY count DESC
        `);
                sentimentStats.rows.forEach(row => {
                    report.sentimentDistribution[row.sentiment] = parseInt(row.count);
                });
                // 5. Détection des problèmes
                console.log('⚠️ Détection des problèmes...');
                this.detectIssues(report);
                // 6. Calcul du score de qualité
                report.qualityScore = this.calculateQualityScore(report);
                // 7. Génération des recommandations
                this.generateRecommendations(report);
            }
            finally {
                client.release();
            }
            return report;
        }
        catch (error) {
            console.error('❌ Erreur lors de la validation:', error);
            throw error;
        }
        finally {
            await pool.end();
        }
    }
    detectIssues(report) {
        // Taux de duplication élevé
        if (report.duplicates > 0) {
            const dupRate = (report.duplicates / report.totalNews) * 100;
            if (dupRate > 10) {
                report.issues.push(`Taux de duplication élevé: ${dupRate.toFixed(1)}% (${report.duplicates} doublons)`);
            }
        }
        // Données récentes insuffisantes
        if (report.recentNews24h < 50) {
            report.issues.push(`Peu de données récentes: seulement ${report.recentNews24h} news dans les dernières 24h`);
        }
        // Titres vides
        if (report.emptyTitles > 0) {
            report.issues.push(`${report.emptyTitles} news avec des titres vides ou NULL`);
        }
        // URLs invalides
        if (report.invalidUrls > 0) {
            report.issues.push(`${report.invalidUrls} news avec des URLs invalides`);
        }
        // Sentiments invalides
        if (report.invalidSentiments > 0) {
            report.issues.push(`${report.invalidSentiments} news avec des valeurs de sentiment invalides`);
        }
        // Dates futures
        if (report.futureDates > 0) {
            report.issues.push(`${report.futureDates} news avec des dates dans le futur`);
        }
        // Très anciennes
        if (report.veryOldDates > report.totalNews * 0.1) {
            report.issues.push(`Trop d'anciennes news: ${report.veryOldDates} news de plus de 90 jours`);
        }
        // Distribution par source déséquilibrée
        const sources = Object.keys(report.sourceDistribution);
        if (sources.length < 3) {
            report.issues.push(`Peu de sources de données: seulement ${sources.length} sources différentes`);
        }
        const maxSourceCount = Math.max(...Object.values(report.sourceDistribution));
        const totalFromOtherSources = report.totalNews - maxSourceCount;
        if (maxSourceCount > totalFromOtherSources * 3) {
            report.issues.push('Distribution très déséquilibrée entre les sources');
        }
    }
    calculateQualityScore(report) {
        let score = 100;
        // Pénalités pour les problèmes
        score -= Math.min(30, (report.duplicates / report.totalNews) * 100); // Max -30 pour doublons
        score -= Math.min(20, (report.emptyTitles / report.totalNews) * 100); // Max -20 pour titres vides
        score -= Math.min(15, (report.invalidUrls / report.totalNews) * 100); // Max -15 pour URLs invalides
        score -= Math.min(15, (report.invalidSentiments / report.totalNews) * 100); // Max -15 pour sentiments invalides
        score -= Math.min(10, (report.futureDates / report.totalNews) * 100); // Max -10 pour dates futures
        // Bonus pour les données récentes
        if (report.recentNews24h > 100)
            score += 5;
        if (report.recentNews7d > 500)
            score += 5;
        // Bonus pour la diversité des sources
        const sourceCount = Object.keys(report.sourceDistribution).length;
        if (sourceCount >= 5)
            score += 5;
        else if (sourceCount >= 3)
            score += 2;
        return Math.max(0, Math.min(100, score));
    }
    generateRecommendations(report) {
        const recommendations = [];
        // Recommandations basées sur les problèmes détectés
        if (report.duplicates > 0) {
            recommendations.push('💡 Implémenter une déduplication plus robuste basée sur le hash du contenu');
            recommendations.push('💡 Ajouter des contraintes UNIQUE au niveau de la base de données');
        }
        if (report.emptyTitles > 0 || report.invalidUrls > 0) {
            recommendations.push('💡 Ajouter une validation des données avant insertion en base');
            recommendations.push('💡 Nettoyer les données corrompues existantes');
        }
        if (report.invalidSentiments > 0) {
            recommendations.push('💡 Corriger les valeurs de sentiment invalides');
            recommendations.push('💡 Ajouter des contraintes CHECK sur la colonne sentiment');
        }
        if (report.futureDates > 0) {
            recommendations.push('💡 Valider les dates de publication avant insertion');
            recommendations.push('💡 Corriger les fuseaux horaires des timestamps');
        }
        if (report.recentNews24h < 50) {
            recommendations.push('💡 Augmenter la fréquence de scraping des sources');
            recommendations.push('💡 Ajouter de nouvelles sources de données');
        }
        const sourceCount = Object.keys(report.sourceDistribution).length;
        if (sourceCount < 3) {
            recommendations.push('💡 Diversifier les sources de données pour réduire la dépendance');
        }
        // Trier par priorité
        report.recommendations = recommendations.slice(0, 10);
    }
    async generateDetailedReport() {
        const report = await this.runFullValidation();
        const lines = [];
        lines.push('='.repeat(80));
        lines.push('📊 RAPPORT DE VALIDATION DE LA QUALITÉ DES DONNÉES');
        lines.push('='.repeat(80));
        lines.push(`Généré le: ${new Date().toLocaleString('fr-FR')}`);
        lines.push('');
        // Score global
        const scoreEmoji = report.qualityScore >= 80 ? '🟢' : report.qualityScore >= 60 ? '🟡' : '🔴';
        lines.push(`${scoreEmoji} SCORE DE QUALITÉ GLOBAL: ${report.qualityScore}/100`);
        lines.push('');
        // Statistiques générales
        lines.push('📈 STATISTIQUES GÉNÉRALES:');
        lines.push(`   • Total des news: ${report.totalNews.toLocaleString()}`);
        lines.push(`   • News 24 dernières heures: ${report.recentNews24h.toLocaleString()}`);
        lines.push(`   • News 7 derniers jours: ${report.recentNews7d.toLocaleString()}`);
        lines.push(`   • Doublons détectés: ${report.duplicates.toLocaleString()}`);
        lines.push('');
        // Problèmes de qualité
        lines.push('⚠️ PROBLÈMES DE QUALITÉ:');
        const qualityIssues = [
            `   • Titres vides: ${report.emptyTitles}`,
            `   • URLs invalides: ${report.invalidUrls}`,
            `   • Sentiments invalides: ${report.invalidSentiments}`,
            `   • Dates futures: ${report.futureDates}`,
            `   • Données anciennes (>90j): ${report.veryOldDates}`,
        ];
        qualityIssues.forEach(issue => {
            if (parseInt(issue.split(': ')[1]) > 0) {
                lines.push(issue);
            }
        });
        lines.push('');
        // Distribution par source
        lines.push('📰 DISTRIBUTION PAR SOURCE:');
        const sortedSources = Object.entries(report.sourceDistribution)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10);
        sortedSources.forEach(([source, count]) => {
            const percentage = ((count / report.totalNews) * 100).toFixed(1);
            lines.push(`   • ${source}: ${count.toLocaleString()} (${percentage}%)`);
        });
        lines.push('');
        // Distribution par sentiment
        lines.push('💭 DISTRIBUTION PAR SENTIMENT:');
        Object.entries(report.sentimentDistribution).forEach(([sentiment, count]) => {
            const percentage = ((count / report.totalNews) * 100).toFixed(1);
            lines.push(`   • ${sentiment}: ${count.toLocaleString()} (${percentage}%)`);
        });
        lines.push('');
        // Problèmes détectés
        if (report.issues.length > 0) {
            lines.push('🚨 PROBLÈMES DÉTECTÉS:');
            report.issues.forEach(issue => {
                lines.push(`   • ${issue}`);
            });
            lines.push('');
        }
        // Recommandations
        if (report.recommendations.length > 0) {
            lines.push('💡 RECOMMANDATIONS:');
            report.recommendations.forEach(rec => {
                lines.push(`   ${rec}`);
            });
            lines.push('');
        }
        lines.push('='.repeat(80));
        return lines.join('\n');
    }
    async fixCommonIssues() {
        console.log('🔧 Correction des problèmes courants...');
        const pool = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'financial_analyst',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '9022',
        });
        const client = await pool.connect();
        try {
            // 1. Supprimer les doublons en gardant le plus récent
            console.log('🗑️ Suppression des doublons...');
            await client.query(`
        DELETE FROM news_items
        WHERE id NOT IN (
          SELECT DISTINCT ON (url, DATE(published_at))
            id
          FROM news_items
          ORDER BY url, DATE(published_at), published_at DESC
        )
      `);
            // 2. Corriger les titres vides
            console.log('📝 Correction des titres vides...');
            await client.query(`
        UPDATE news_items
        SET title = 'Titre non disponible', processing_status = 'raw'
        WHERE title IS NULL OR TRIM(title) = ''
      `);
            // 3. Corriger les sentiments invalides
            console.log('💭 Correction des sentiments invalides...');
            await client.query(`
        UPDATE news_items
        SET sentiment = 'neutral', processing_status = 'raw'
        WHERE sentiment NOT IN ('bullish', 'bearish', 'neutral')
      `);
            // 4. Corriger les dates futures
            console.log('📅 Correction des dates futures...');
            await client.query(`
        UPDATE news_items
        SET published_at = NOW(), processing_status = 'raw'
        WHERE published_at > NOW() + INTERVAL '1 hour'
      `);
            // 5. Nettoyer les anciennes données (plus de 6 mois)
            console.log('🧹 Nettoyage des anciennes données...');
            const result = await client.query(`
        DELETE FROM news_items
        WHERE published_at < NOW() - INTERVAL '6 months'
      `);
            console.log(`✅ Corrections terminées. ${result.rowCount} anciennes news supprimées.`);
        }
        finally {
            client.release();
            await pool.end();
        }
    }
}
// Script principal
if (require.main === module) {
    const validator = new DataQualityValidator();
    validator
        .generateDetailedReport()
        .then(report => {
        console.log(report);
        // Demander si l'utilisateur veut corriger les problèmes
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question('\nVoulez-vous corriger automatiquement les problèmes détectés? (y/N): ', (answer) => {
            if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
                validator
                    .fixCommonIssues()
                    .then(() => {
                    console.log('✅ Corrections appliquées avec succès!');
                    process.exit(0);
                })
                    .catch(error => {
                    console.error('❌ Erreur lors des corrections:', error);
                    process.exit(1);
                });
            }
            else {
                console.log('👋 Terminé. Aucune correction appliquée.');
                process.exit(0);
            }
        });
    })
        .catch(error => {
        console.error('❌ Erreur lors de la validation:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=validate_data_quality.js.map