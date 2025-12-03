#!/usr/bin/env ts-node
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();
class ValidationTester {
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
            console.log('✅ Connexion à la base de données: OK');
            return true;
        }
        catch (error) {
            console.error('❌ Connexion à la base de données: ÉCHEC', error instanceof Error ? error.message : error);
            return false;
        }
    }
    async testTables() {
        try {
            const client = await this.pool.connect();
            const result = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN ('news_items', 'sentiment_analyses', 'market_data', 'news_sources')
      `);
            const tables = result.rows.map(row => row.table_name);
            const expectedTables = ['news_items', 'sentiment_analyses', 'market_data', 'news_sources'];
            const missingTables = expectedTables.filter(table => !tables.includes(table));
            if (missingTables.length > 0) {
                console.error('❌ Tables manquantes:', missingTables.join(', '));
                return false;
            }
            console.log('✅ Tables requises: Présentes');
            console.log('   • news_items');
            console.log('   • sentiment_analyses');
            console.log('   • market_data');
            console.log('   • news_sources');
            client.release();
            return true;
        }
        catch (error) {
            console.error('❌ Vérification des tables: ÉCHEC', error instanceof Error ? error.message : error);
            return false;
        }
    }
    async analyzeDataQuality() {
        const client = await this.pool.connect();
        try {
            // Statistiques générales
            const generalStats = await client.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE published_at >= NOW() - INTERVAL '24 hours') as recent_24h,
          COUNT(*) - COUNT(DISTINCT url) as duplicates
        FROM news_items
      `);
            // Qualité des données
            const qualityStats = await client.query(`
        SELECT
          COUNT(*) FILTER (WHERE title IS NULL OR TRIM(title) = '') as empty_titles,
          COUNT(*) FILTER (WHERE url IS NULL OR url NOT LIKE 'http%') as invalid_urls,
          COUNT(*) FILTER (WHERE published_at > NOW() + INTERVAL '1 hour') as future_dates,
          COUNT(*) FILTER (WHERE published_at < NOW() - INTERVAL '90 days') as very_old_dates
        FROM news_items
      `);
            const general = generalStats.rows[0];
            const quality = qualityStats.rows[0];
            // Calcul du score de qualité
            const total = parseInt(general.total);
            let score = 100;
            // Pénalités
            score -= Math.min(30, (general.duplicates / total) * 100);
            score -= Math.min(20, (quality.empty_titles / total) * 100);
            score -= Math.min(20, (quality.invalid_urls / total) * 100);
            score -= Math.min(15, (quality.future_dates / total) * 100);
            score -= Math.min(15, (quality.very_old_dates / total) * 100);
            const result = {
                totalNews: total,
                recentNews24h: parseInt(general.recent_24h),
                duplicates: parseInt(general.duplicates),
                qualityScore: Math.max(0, score),
            };
            console.log('📊 Analyse de la qualité des données:');
            console.log(`   • Total news: ${result.totalNews.toLocaleString()}`);
            console.log(`   • News 24h: ${result.recentNews24h.toLocaleString()}`);
            console.log(`   • Doublons: ${result.duplicates.toLocaleString()}`);
            console.log(`   • Score qualité: ${result.qualityScore}/100`);
            if (quality.empty_titles > 0) {
                console.log(`   • Titres vides: ${quality.empty_titles}`);
            }
            if (quality.invalid_urls > 0) {
                console.log(`   • URLs invalides: ${quality.invalid_urls}`);
            }
            if (quality.future_dates > 0) {
                console.log(`   • Dates futures: ${quality.future_dates}`);
            }
            return result;
        }
        finally {
            client.release();
        }
    }
    async detectIssues(data) {
        const issues = [];
        // Problèmes de connexion/données
        if (data.totalNews === 0) {
            issues.push('Base de données vide ou inaccessible');
        }
        // Problèmes de volume
        if (data.recentNews24h < 50) {
            issues.push(`Peu de données récentes: seulement ${data.recentNews24h} news dans les dernières 24h`);
        }
        // Problèmes de qualité
        if (data.duplicates > data.totalNews * 0.1) {
            issues.push(`Taux de duplication élevé: ${((data.duplicates / data.totalNews) * 100).toFixed(1)}%`);
        }
        // Problèmes de score
        if (data.qualityScore < 60) {
            issues.push(`Qualité des données faible: ${data.qualityScore}/100`);
        }
        else if (data.qualityScore < 80) {
            issues.push(`Qualité des données moyenne: ${data.qualityScore}/100`);
        }
        return issues;
    }
    generateRecommendations(data) {
        const recommendations = [];
        if (data.totalNews === 0) {
            recommendations.push('💡 Démarrer les scrapers pour peupler la base de données');
            recommendations.push('💡 Vérifier la configuration de la base de données');
            recommendations.push('💡 Exécuter les migrations de schéma');
        }
        if (data.recentNews24h < 50) {
            recommendations.push('💡 Augmenter la fréquence de scraping');
            recommendations.push('💡 Ajouter de nouvelles sources de données');
            recommendations.push('💡 Vérifier les connexions internet/API');
        }
        if (data.duplicates > 0) {
            recommendations.push('💡 Implémenter une déduplication robuste');
            recommendations.push('💡 Ajouter des contraintes UNIQUE en base de données');
            recommendations.push('💡 Utiliser des hash pour détecter les doublons');
        }
        if (data.qualityScore < 80) {
            recommendations.push('💡 Mettre en place une validation pré-insertion');
            recommendations.push('💡 Corriger les données existantes');
            recommendations.push('💡 Améliorer la qualité des sources');
            recommendations.push('💡 Filtrer le spam et les données de mauvaise qualité');
        }
        if (data.qualityScore < 60) {
            recommendations.push('🚨 Attention: Qualité critique - Action immédiate requise');
            recommendations.push('🚨 Nettoyer complètement la base de données');
            recommendations.push("🚨 Revoir l'ensemble du pipeline de données");
        }
        return recommendations;
    }
    async runValidationTest() {
        console.log('🔍 DÉMARRAGE DES TESTS DE VALIDATION COMPLETS');
        console.log('='.repeat(80));
        const result = {
            timestamp: new Date(),
            databaseConnected: false,
            tablesExist: false,
            totalNews: 0,
            recentNews24h: 0,
            duplicates: 0,
            qualityScore: 0,
            issues: [],
            recommendations: [],
            success: false,
        };
        try {
            // 1. Test de connexion
            console.log('\n1️⃣ Test de connexion à la base de données...');
            result.databaseConnected = await this.testConnection();
            if (!result.databaseConnected) {
                result.issues.push('Base de données inaccessible');
                result.recommendations.push('Vérifier la connexion PostgreSQL (.env)');
                result.recommendations.push('Démarrer le service PostgreSQL');
                return result;
            }
            // 2. Test des tables
            console.log('\n2️⃣ Vérification des tables requises...');
            result.tablesExist = await this.testTables();
            if (!result.tablesExist) {
                result.issues.push('Tables manquantes dans la base de données');
                result.recommendations.push('Exécuter les migrations: npm run db:init');
                return result;
            }
            // 3. Analyse de la qualité
            console.log('\n3️⃣ Analyse de la qualité des données...');
            const qualityData = await this.analyzeDataQuality();
            result.totalNews = qualityData.totalNews;
            result.recentNews24h = qualityData.recentNews24h;
            result.duplicates = qualityData.duplicates;
            result.qualityScore = qualityData.qualityScore;
            // 4. Détection des problèmes
            console.log('\n4️⃣ Détection des problèmes...');
            result.issues.push(...(await this.detectIssues(qualityData)));
            // 5. Génération des recommandations
            console.log('\n5️⃣ Génération des recommandations...');
            result.recommendations.push(...this.generateRecommendations(qualityData));
            // 6. Évaluation du succès
            result.success =
                result.databaseConnected &&
                    result.tablesExist &&
                    result.issues.length === 0 &&
                    result.qualityScore >= 80;
        }
        catch (error) {
            result.issues.push(`Erreur critique: ${error instanceof Error ? error.message : String(error)}`);
            console.error('❌ Erreur lors des tests:', error);
        }
        return result;
    }
    printReport(result) {
        console.log('\n' + '='.repeat(80));
        console.log('📋 RAPPORT FINAL DE VALIDATION');
        console.log('='.repeat(80));
        console.log(`Date: ${result.timestamp.toLocaleString('fr-FR')}`);
        // État global
        const statusEmoji = result.success ? '🟢' : result.qualityScore >= 60 ? '🟡' : '🔴';
        console.log(`${statusEmoji} État: ${result.success ? 'SUCCÈS' : result.qualityScore >= 60 ? 'CORRECTIONS NÉCESSAIRES' : 'ÉCHEC'}`);
        console.log('\n📊 MÉTRIQUES CLÉS:');
        console.log(`   • Base de données: ${result.databaseConnected ? 'Connectée ✅' : 'Inaccessible ❌'}`);
        console.log(`   • Tables requises: ${result.tablesExist ? 'Présentes ✅' : 'Manquantes ❌'}`);
        console.log(`   • Total news: ${result.totalNews.toLocaleString()}`);
        console.log(`   • News 24 dernières heures: ${result.recentNews24h.toLocaleString()}`);
        console.log(`   • Doublons détectés: ${result.duplicates.toLocaleString()}`);
        console.log(`   • Score de qualité: ${result.qualityScore}/100`);
        // Problèmes
        if (result.issues.length > 0) {
            console.log('\n⚠️ PROBLÈMES DÉTECTÉS:');
            result.issues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue}`);
            });
        }
        else {
            console.log('\n✅ AUCUN PROBLÈME DÉTECTÉ');
        }
        // Recommandations
        if (result.recommendations.length > 0) {
            console.log('\n💡 RECOMMANDATIONS:');
            result.recommendations.forEach((rec, index) => {
                console.log(`   ${index + 1}. ${rec}`);
            });
        }
        else {
            console.log('\n🎉 AUCUNE AMÉLIORATION REQUISE');
        }
        // Actions suggérées
        console.log('\n🚀 ACTIONS SUGGÉRÉES:');
        if (result.issues.length > 0) {
            console.log('   • Corriger les problèmes détectés');
        }
        if (result.qualityScore < 80) {
            console.log('   • Améliorer la qualité des données');
            console.log('   • npm run maintenance');
        }
        if (result.recentNews24h < 50) {
            console.log('   • Augmenter la fréquence de scraping');
            console.log('   • npm run pipeline');
        }
        if (result.duplicates > result.totalNews * 0.05) {
            console.log('   • Lancer la déduplication');
            console.log('   • npm run validate:data');
        }
        console.log('\n' + '='.repeat(80));
    }
    async close() {
        await this.pool.end();
        console.log('🔌 Connexion à la base de données fermée');
    }
}
// Script principal
if (import.meta.url === `file://${process.argv[1]}`) {
    const tester = new ValidationTester();
    console.log('🧪 VALIDATION DES SYSTÈMES DE DONNÉES FINANCIÈRES');
    console.log('='.repeat(80));
    const runTest = async () => {
        try {
            const result = await tester.runValidationTest();
            tester.printReport(result);
            // Code de sortie basé sur les résultats
            if (result.success) {
                console.log('\n🎉 VALIDATION TERMINÉE AVEC SUCCÈS - SYSTÈME OPÉRATIONNEL');
                process.exit(0);
            }
            else if (result.qualityScore >= 60 && result.databaseConnected && result.tablesExist) {
                console.log('\n🟡 VALIDATION TERMINÉE AVEC CORRECTIONS REQUISES');
                process.exit(1);
            }
            else {
                console.log('\n🔴 VALIDATION TERMINÉE AVEC ÉCHECS CRITIQUES');
                process.exit(2);
            }
        }
        catch (error) {
            console.error('\n❌ ERREUR CRITIQUE PENDANT LA VALIDATION:', error);
            process.exit(3);
        }
        finally {
            await tester.close();
        }
    };
    runTest().catch(error => {
        console.error('💥 ERREUR FATALE:', error);
        process.exit(4);
    });
}
export { ValidationTester };
//# sourceMappingURL=run_validation_tests.js.map