#!/usr/bin/env ts-node
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();
class SimpleDataValidator {
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
            console.log('✅ Base de données accessible');
            return true;
        }
        catch (error) {
            console.log('❌ Base de données inaccessible:', error instanceof Error ? error.message : error);
            return false;
        }
    }
    async generateReport() {
        console.log('🔍 Génération du rapport de validation...');
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
            qualityScore: 100,
            issues: [],
            recommendations: [],
            timestamp: new Date(),
        };
        const client = await this.pool.connect();
        try {
            console.log('📊 Analyse des données générales...');
            // Statistiques générales
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
            console.log(`   • Total news: ${report.totalNews.toLocaleString()}`);
            console.log(`   • News 24h: ${report.recentNews24h.toLocaleString()}`);
            console.log(`   • Doublons: ${report.duplicates.toLocaleString()}`);
            // Qualité des données
            console.log('🔍 Validation de la qualité des données...');
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
            console.log(`   • Titres vides: ${report.emptyTitles}`);
            console.log(`   • URLs invalides: ${report.invalidUrls}`);
            console.log(`   • Sentiments invalides: ${report.invalidSentiments}`);
            console.log(`   • Dates futures: ${report.futureDates}`);
            console.log(`   • Très anciennes: ${report.veryOldDates}`);
            // Distribution par source
            console.log('📊 Analyse distribution par source...');
            const sourceStats = await client.query(`
        SELECT source, COUNT(*) as count
        FROM news_items
        GROUP BY source
        ORDER BY count DESC
      `);
            sourceStats.rows.forEach(row => {
                report.sourceDistribution[row.source] = parseInt(row.count);
            });
            console.log('   • Distribution:');
            Object.entries(report.sourceDistribution)
                .slice(0, 5)
                .forEach(([source, count]) => {
                const percentage = ((count / report.totalNews) * 100).toFixed(1);
                console.log(`     - ${source}: ${count.toLocaleString()} (${percentage}%)`);
            });
            // Distribution par sentiment
            console.log('💭 Analyse distribution par sentiment...');
            const sentimentStats = await client.query(`
        SELECT
          COALESCE(sentiment, 'unspecified') as sentiment,
          COUNT(*) as count
        FROM news_items
        GROUP BY COALESCE(sentiment, 'unspecified')
      `);
            sentimentStats.rows.forEach(row => {
                report.sentimentDistribution[row.sentiment] = parseInt(row.count);
            });
            console.log('   • Distribution:');
            Object.entries(report.sentimentDistribution).forEach(([sentiment, count]) => {
                const percentage = ((count / report.totalNews) * 100).toFixed(1);
                console.log(`     - ${sentiment}: ${count.toLocaleString()} (${percentage}%)`);
            });
            // Détection des problèmes
            this.detectIssues(report);
            // Calcul du score de qualité
            this.calculateQualityScore(report);
            // Génération des recommandations
            this.generateRecommendations(report);
        }
        catch (error) {
            console.error('❌ Erreur lors de la validation:', error);
            report.issues.push(`Erreur critique: ${error instanceof Error ? error.message : error}`);
            report.qualityScore = 0;
        }
        finally {
            client.release();
        }
        return report;
    }
    detectIssues(report) {
        console.log('⚠️ Détection des problèmes...');
        // Taux de duplication
        if (report.duplicates > 0) {
            const dupRate = (report.duplicates / report.totalNews) * 100;
            if (dupRate > 10) {
                report.issues.push(`Taux de duplication élevé: ${dupRate.toFixed(1)}%`);
            }
        }
        // Données récentes insuffisantes
        if (report.recentNews24h < 50) {
            report.issues.push(`Peu de données récentes: seulement ${report.recentNews24h} news dans les dernières 24h`);
        }
        // Qualité des données
        if (report.emptyTitles > 0) {
            report.issues.push(`${report.emptyTitles} news avec des titres vides`);
        }
        if (report.invalidUrls > 0) {
            report.issues.push(`${report.invalidUrls} news avec des URLs invalides`);
        }
        if (report.invalidSentiments > 0) {
            report.issues.push(`${report.invalidSentiments} news avec des valeurs de sentiment invalides`);
        }
        if (report.futureDates > 0) {
            report.issues.push(`${report.futureDates} news avec des dates dans le futur`);
        }
        // Données anciennes
        if (report.veryOldDates > report.totalNews * 0.1) {
            report.issues.push(`Trop d'anciennes news: ${report.veryOldDates} de plus de 90 jours`);
        }
        // Distribution par source
        const sources = Object.keys(report.sourceDistribution);
        if (sources.length < 3) {
            report.issues.push(`Peu de sources de données: seulement ${sources.length} sources`);
        }
        console.log(`   • ${report.issues.length} problèmes détectés`);
    }
    calculateQualityScore(report) {
        console.log('📈 Calcul du score de qualité...');
        let score = 100;
        // Pénalités pour les problèmes
        score -= Math.min(30, (report.duplicates / report.totalNews) * 100);
        score -= Math.min(20, (report.emptyTitles / report.totalNews) * 100);
        score -= Math.min(15, (report.invalidUrls / report.totalNews) * 100);
        score -= Math.min(15, (report.invalidSentiments / report.totalNews) * 100);
        score -= Math.min(10, (report.futureDates / report.totalNews) * 100);
        score -= Math.min(10, (report.veryOldDates / report.totalNews) * 100);
        // Bonus pour les données récentes
        if (report.recentNews24h > 100)
            score += 10;
        else if (report.recentNews24h > 50)
            score += 5;
        if (report.recentNews7d > 500)
            score += 5;
        else if (report.recentNews7d > 100)
            score += 2;
        // Bonus pour la diversité des sources
        const sourceCount = Object.keys(report.sourceDistribution).length;
        if (sourceCount >= 5)
            score += 5;
        else if (sourceCount >= 3)
            score += 2;
        report.qualityScore = Math.max(0, Math.min(100, score));
        console.log(`   • Score de qualité: ${report.qualityScore}/100`);
    }
    generateRecommendations(report) {
        console.log('💡 Génération des recommandations...');
        if (report.duplicates > 0) {
            report.recommendations.push('💡 Implémenter une déduplication robuste basée sur le hash du contenu');
            report.recommendations.push('💡 Ajouter des contraintes UNIQUE au niveau de la base de données');
        }
        if (report.emptyTitles > 0 || report.invalidUrls > 0) {
            report.recommendations.push('💡 Ajouter une validation des données avant insertion');
            report.recommendations.push('💡 Nettoyer les données corrompues existantes');
        }
        if (report.invalidSentiments > 0) {
            report.recommendations.push('💡 Corriger les valeurs de sentiment invalides');
            report.recommendations.push('💡 Ajouter des contraintes CHECK sur la colonne sentiment');
        }
        if (report.futureDates > 0) {
            report.recommendations.push('💡 Valider les dates de publication avant insertion');
            report.recommendations.push('💡 Corriger les fuseaux horaires des timestamps');
        }
        if (report.recentNews24h < 50) {
            report.recommendations.push('💡 Augmenter la fréquence de scraping des sources');
            report.recommendations.push('💡 Ajouter de nouvelles sources de données');
        }
        const sourceCount = Object.keys(report.sourceDistribution).length;
        if (sourceCount < 3) {
            report.recommendations.push('💡 Diversifier les sources de données pour réduire la dépendance');
        }
        console.log(`   • ${report.recommendations.length} recommandations générées`);
    }
    async printReport(report) {
        const lines = [];
        lines.push('='.repeat(80));
        lines.push('📊 RAPPORT DE VALIDATION DE LA QUALITÉ DES DONNÉES');
        lines.push('='.repeat(80));
        lines.push(`Généré le: ${report.timestamp.toLocaleString('fr-FR')}`);
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
        if (report.issues.length > 0) {
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
        }
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
            report.issues.slice(0, 10).forEach((issue, index) => {
                lines.push(`   ${index + 1}. ${issue}`);
            });
            if (report.issues.length > 10) {
                lines.push(`   • ... et ${report.issues.length - 10} autres problèmes`);
            }
            lines.push('');
        }
        // Recommandations
        if (report.recommendations.length > 0) {
            lines.push('💡 RECOMMANDATIONS:');
            report.recommendations.slice(0, 10).forEach((rec, index) => {
                lines.push(`   ${index + 1}. ${rec}`);
            });
            if (report.recommendations.length > 10) {
                lines.push(`   • ... et ${report.recommendations.length - 10} autres recommandations`);
            }
            lines.push('');
        }
        lines.push('='.repeat(80));
        return lines.join('\n');
    }
    async close() {
        await this.pool.end();
        console.log('🔌 Connexion à la base de données fermée');
    }
}
// Script principal
if (require.main === module) {
    const validator = new SimpleDataValidator();
    console.log('🚀 Démarrage de la validation des données...');
    // Test de connexion
    const isConnected = await validator.testConnection();
    if (!isConnected) {
        console.error('❌ Impossible de se connecter à la base de données');
        process.exit(1);
    }
    // Génération du rapport
    const report = await validator.generateReport();
    // Affichage du rapport
    const reportText = await validator.printReport(report);
    console.log(reportText);
    // Évaluation
    if (report.qualityScore >= 80) {
        console.log('🟢 État: EXCELLENT - Les données sont de très bonne qualité');
        process.exit(0);
    }
    else if (report.qualityScore >= 60) {
        console.log('🟡 État: BON - Les données sont de qualité acceptable');
        process.exit(0);
    }
    else {
        console.log('🔴 État: CRITIQUE - La qualité des données nécessite une attention immédiate');
        process.exit(1);
    }
}
export { SimpleDataValidator };
//# sourceMappingURL=validate_simple.js.map