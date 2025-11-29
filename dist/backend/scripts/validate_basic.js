#!/usr/bin/env ts-node
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();
class BasicValidator {
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
    async generateReport() {
        const report = {
            connected: false,
            totalNews: 0,
            recentNews24h: 0,
            recentNews7d: 0,
            todayNews: 0,
            duplicates: 0,
            qualityIssues: 0,
            errors: [],
            warnings: [],
            timestamp: new Date(),
        };
        const client = await this.pool.connect();
        try {
            console.log('📊 Analyse des données...');
            // Test de connexion
            report.connected = true;
            // Statistiques générales
            const generalStats = await client.query(`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN published_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as recent_24h,
          COUNT(CASE WHEN published_at >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_7d,
          COUNT(CASE WHEN published_at >= CURRENT_DATE THEN 1 END) as today,
          COUNT(*) - COUNT(DISTINCT url) as duplicates
        FROM news_items
      `);
            if (generalStats.rows.length > 0) {
                const stats = generalStats.rows[0];
                report.totalNews = parseInt(stats.total);
                report.recentNews24h = parseInt(stats.recent_24h);
                report.recentNews7d = parseInt(stats.recent_7d);
                report.todayNews = parseInt(stats.today);
                report.duplicates = parseInt(stats.duplicates);
                console.log(`   • Total news: ${report.totalNews.toLocaleString()}`);
                console.log(`   • News 24 dernières heures: ${report.recentNews24h.toLocaleString()}`);
                console.log(`   • News 7 derniers jours: ${report.recentNews7d.toLocaleString()}`);
                console.log(`   • News aujourd'hui: ${report.todayNews.toLocaleString()}`);
                console.log(`   • Doublons: ${report.duplicates.toLocaleString()}`);
            }
            // Qualité des données
            console.log('🔍 Vérification de la qualité...');
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
                report.qualityIssues =
                    parseInt(quality.empty_titles) +
                        parseInt(quality.invalid_urls) +
                        parseInt(quality.invalid_sentiments) +
                        parseInt(quality.future_dates) +
                        parseInt(quality.very_old_dates);
                console.log(`   • Titres vides: ${parseInt(quality.empty_titles)}`);
                console.log(`   • URLs invalides: ${parseInt(quality.invalid_urls)}`);
                console.log(`   • Sentiments invalides: ${parseInt(quality.invalid_sentiments)}`);
                console.log(`   • Dates futures: ${parseInt(quality.future_dates)}`);
                console.log(`   • Données anciennes (>90j): ${parseInt(quality.very_old_dates)}`);
                console.log(`   • Total problèmes qualité: ${report.qualityIssues}`);
            }
            // Distribution par source
            console.log('📈 Analyse distribution par source...');
            const sourceStats = await client.query(`
        SELECT source, COUNT(*) as count
        FROM news_items
        WHERE published_at >= NOW() - INTERVAL '7 days'
        GROUP BY source
        ORDER BY count DESC
      `);
            if (sourceStats.rows.length > 0) {
                console.log('   • Sources actives (7 derniers jours):');
                sourceStats.rows.forEach(row => {
                    console.log(`     - ${row.source}: ${parseInt(row.count).toLocaleString()} items`);
                });
            }
            // Distribution par sentiment
            console.log('💭 Analyse distribution par sentiment...');
            const sentimentStats = await client.query(`
        SELECT
          COALESCE(sentiment, 'unspecified') as sentiment,
          COUNT(*) as count
        FROM news_items
        WHERE published_at >= NOW() - INTERVAL '7 days'
        GROUP BY COALESCE(sentiment, 'unspecified')
        ORDER BY count DESC
      `);
            if (sentimentStats.rows.length > 0) {
                console.log('   • Distribution:');
                sentimentStats.rows.forEach(row => {
                    console.log(`     - ${row.sentiment}: ${parseInt(row.count).toLocaleString()} items`);
                });
            }
            // Détection des problèmes
            this.detectIssues(report);
        }
        catch (error) {
            console.error("❌ Erreur lors de l'analyse:", error);
            report.errors.push(`Erreur critique: ${error instanceof Error ? error.message : String(error)}`);
        }
        finally {
            client.release();
        }
        return report;
    }
    detectIssues(report) {
        console.log('⚠️ Détection des problèmes...');
        if (!report.connected) {
            report.errors.push('Base de données inaccessible');
        }
        if (report.totalNews === 0) {
            report.warnings.push('Aucune news dans la base de données');
        }
        if (report.recentNews24h < 50) {
            report.warnings.push('Peu de news récentes (moins de 50 dans les dernières 24h)');
        }
        if (report.recentNews7d < 500) {
            report.warnings.push('Peu de news récentes (moins de 500 dans les 7 derniers jours)');
        }
        if (report.todayNews < 20) {
            report.warnings.push("Peu de news aujourd'hui");
        }
        if (report.duplicates > report.totalNews * 0.05) {
            report.errors.push('Taux de duplication élevé (>5%)');
        }
        if (report.qualityIssues > report.totalNews * 0.1) {
            report.warnings.push('Qualité des données problématique (>10%)');
        }
        if (report.errors.length > 0) {
            console.log(`   ❌ Erreurs critiques (${report.errors.length}):`);
            report.errors.forEach((error, index) => {
                console.log(`     ${index + 1}. ${error}`);
            });
        }
        if (report.warnings.length > 0) {
            console.log(`   ⚠️ Avertissements (${report.warnings.length}):`);
            report.warnings.forEach((warning, index) => {
                console.log(`     ${index + 1}. ${warning}`);
            });
        }
    }
    async printReport(report) {
        const lines = [];
        lines.push('='.repeat(80));
        lines.push('📊 RAPPORT DE VALIDATION DES DONNÉES FINANCIÈRES');
        lines.push('='.repeat(80));
        lines.push(`Généré le: ${report.timestamp.toLocaleString('fr-FR')}`);
        lines.push('');
        // État de la connexion
        const statusEmoji = report.connected ? '✅' : '❌';
        lines.push(`${statusEmoji} Connexion à la base de données: ${report.connected ? 'Établie' : 'Échouée'}`);
        lines.push('');
        // Statistiques
        lines.push('📈 STATISTIQUES GÉNÉRALES:');
        lines.push(`   • Total des news: ${report.totalNews.toLocaleString()}`);
        lines.push(`   • News 24 dernières heures: ${report.recentNews24h.toLocaleString()}`);
        lines.push(`   • News 7 derniers jours: ${report.recentNews7d.toLocaleString()}`);
        lines.push(`   • News aujourd'hui: ${report.todayNews.toLocaleString()}`);
        lines.push(`   • Doublons détectés: ${report.duplicates.toLocaleString()}`);
        lines.push(`   • Problèmes de qualité: ${report.qualityIssues}`);
        lines.push('');
        // Problèmes détectés
        if (report.errors.length > 0 || report.warnings.length > 0) {
            lines.push('⚠️ PROBLÈMES DÉTECTÉS:');
            if (report.errors.length > 0) {
                report.errors.forEach((error, index) => {
                    lines.push(`   ❌ ${index + 1}. ${error}`);
                });
            }
            if (report.warnings.length > 0) {
                report.warnings.forEach((warning, index) => {
                    lines.push(`   ⚠️  ${index + 1}. ${warning}`);
                });
            }
            lines.push('');
        }
        // Recommandations
        lines.push('💡 RECOMMANDATIONS:');
        if (!report.connected) {
            lines.push('   • Vérifier la connexion à la base de données');
            lines.push('   • Vérifier les identifiants de connexion (.env)');
        }
        if (report.recentNews24h < 50) {
            lines.push('   • Augmenter la fréquence de scraping');
            lines.push('   • Ajouter de nouvelles sources de données');
        }
        if (report.duplicates > 0) {
            lines.push('   • Implémenter la déduplication basée sur le hash du contenu');
            lines.push('   • Ajouter des contraintes UNIQUE au niveau de la base');
        }
        if (report.qualityIssues > report.totalNews * 0.05) {
            lines.push('   • Améliorer la validation des données avant insertion');
            lines.push('   • Nettoyer les données corrompues existantes');
        }
        lines.push('');
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
    const validator = new BasicValidator();
    console.log('🚀 Validation des données financières...');
    console.log('');
    // Test de connexion
    const isConnected = await validator.testConnection();
    if (!isConnected) {
        console.error('❌ Impossible de se connecter à la base de données');
        console.error('Vérifiez les identifiants de connexion dans .env:');
        console.error(`   • DB_HOST: ${process.env.DB_HOST || 'localhost'}`);
        console.error(`   • DB_PORT: ${process.env.DB_PORT || '5432'}`);
        console.error(`   • DB_NAME: ${process.env.DB_NAME || 'financial_analyst'}`);
        console.error(`   • DB_USER: ${process.env.DB_USER || 'postgres'}`);
        process.exit(1);
    }
    // Génération du rapport
    const report = await validator.generateReport();
    // Affichage du rapport
    const reportText = await validator.printReport(report);
    console.log(reportText);
    // Évaluation
    const hasErrors = report.errors.length > 0;
    const hasWarnings = report.warnings.length > 0;
    const hasLowRecentData = report.recentNews24h < 50;
    const hasHighDuplicates = report.duplicates > report.totalNews * 0.05;
    console.log('\n🎯 ÉVALUATION:');
    if (!hasErrors && !hasWarnings && !hasLowRecentData && !hasHighDuplicates) {
        console.log('🟢 État: EXCELLENT - Les données sont de très bonne qualité');
        console.log('   • Aucun problème critique détecté');
        console.log('   • Volume de données adéquat');
        console.log('   • Faible taux de duplication');
        process.exit(0);
    }
    else if (!hasErrors && (hasWarnings || hasLowRecentData || hasHighDuplicates)) {
        console.log('🟡 État: BON - Des améliorations possibles');
        console.log("   • Pas d'erreur critique");
        if (hasLowRecentData) {
            console.log('   • Données récentes insuffisantes');
        }
        if (hasHighDuplicates) {
            console.log('   • Taux de duplication à surveiller');
        }
        if (hasWarnings) {
            console.log('   • Quelques problèmes de qualité à corriger');
        }
        process.exit(0);
    }
    else {
        console.log('🔴 État: PROBLÈMES CRITIQUES DÉTECTÉS');
        console.log('   • Erreurs critiques trouvées');
        console.log('   • Actions correctives immédiates requises');
        process.exit(2);
    }
    await validator.close();
}
export { BasicValidator };
//# sourceMappingURL=validate_basic.js.map