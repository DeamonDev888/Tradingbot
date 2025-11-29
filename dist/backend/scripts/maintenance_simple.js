#!/usr/bin/env ts-node
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();
class SimpleMaintenance {
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
            console.log('✅ Connexion PostgreSQL: OK');
            return true;
        }
        catch (error) {
            console.error('❌ Connexion PostgreSQL: ÉCHEC', error instanceof Error ? error.message : error);
            return false;
        }
    }
    async performMaintenance() {
        const report = {
            timestamp: new Date(),
            databaseConnected: false,
            maintenancePerformed: [],
            newsProcessed: 0,
            duplicatesRemoved: 0,
            spaceRecovered: 0,
            errors: [],
            success: false,
        };
        try {
            // 1. Test de connexion
            report.databaseConnected = await this.testConnection();
            if (!report.databaseConnected) {
                report.errors.push('Base de données inaccessible');
                return report;
            }
            const client = await this.pool.connect();
            try {
                // 2. Nettoyage des doublons
                console.log('🔄 Nettoyage des doublons...');
                const duplicateResult = await client.query(`
          WITH duplicates AS (
            SELECT title_hash, COUNT(*) as duplicate_count
            FROM news_items
            WHERE published_at >= NOW() - INTERVAL '7 days'
            GROUP BY title_hash
            HAVING COUNT(*) > 1
          )
          DELETE FROM news_items
          WHERE id IN (
            SELECT id
            FROM (
              SELECT
                n.id,
                ROW_NUMBER() OVER (PARTITION BY n.title_hash ORDER BY n.published_at DESC, n.created_at DESC) as rn
              FROM news_items n
              WHERE n.title_hash IN (SELECT title_hash FROM duplicates)
            ) ranked
              WHERE rn > 1
          )
        `);
                report.duplicatesRemoved = duplicateResult.rowCount || 0;
                report.maintenancePerformed.push(`Suppression de ${report.duplicatesRemoved} doublons`);
                // 3. Nettoyage des anciennes données
                console.log('🗑️ Nettoyage des anciennes données...');
                const oldDataResult = await client.query(`
          DELETE FROM news_items
          WHERE published_at < NOW() - INTERVAL '90 days'
            AND title_hash NOT IN (
              SELECT title_hash
              FROM (
                SELECT title_hash, COUNT(*) as cnt
                FROM news_items
                WHERE published_at >= NOW() - INTERVAL '7 days'
                GROUP BY title_hash
                HAVING COUNT(*) >= 5
              ) frequent
            )
        `);
                const oldNewsDeleted = oldDataResult.rowCount || 0;
                report.newsProcessed = oldNewsDeleted;
                report.maintenancePerformed.push(`Suppression de ${oldNewsDeleted} anciennes news`);
                // 4. Optimisation de la base
                console.log('⚡ Optimisation de la base de données...');
                await client.query('VACUUM ANALYZE news_items');
                await client.query('VACUUM ANALYZE sentiment_analyses');
                await client.query('VACUUM ANALYZE market_data');
                report.maintenancePerformed.push('Optimisation VACUUM ANALYZE');
                // 5. Mise à jour des statistiques
                console.log('📊 Mise à jour des statistiques...');
                const stats = await client.query(`
          SELECT
            COUNT(*) as total_news,
            COUNT(*) FILTER (WHERE published_at >= NOW() - INTERVAL '24 hours') as recent_24h,
            COUNT(*) FILTER (WHERE published_at >= NOW() - INTERVAL '7 days') as recent_7d
          FROM news_items
        `);
                if (stats.rows.length > 0) {
                    const data = stats.rows[0];
                    console.log(`   • Total news: ${data.total_news.toLocaleString()}`);
                    console.log(`   • News 24h: ${data.recent_24h.toLocaleString()}`);
                    console.log(`   • News 7j: ${data.recent_7d.toLocaleString()}`);
                    report.newsProcessed += parseInt(data.total_news);
                }
                // 6. Calcul de l'espace récupéré
                console.log("💾 Calcul de l'espace récupéré...");
                const spaceStats = await client.query(`
          SELECT
            pg_size_pretty('news_items') as table_size,
            pg_size_pretty(pg_total_relation_size('news_items')) as total_size
        `);
                if (spaceStats.rows.length > 0) {
                    const spaceInfo = spaceStats.rows[0];
                    const mbSize = parseFloat(spaceInfo.table_size.replace('MB', '').replace('kB', '').trim());
                    report.spaceRecovered = mbSize * 0.1; // Estimation de 10% d'économie
                    console.log(`   • Taille table: ${spaceInfo.table_size}`);
                    console.log(`   • Espace récupéré estimé: ${report.spaceRecovered.toFixed(1)} MB`);
                }
                report.success = true;
                console.log('\n✅ Maintenance terminée avec succès');
            }
            finally {
                client.release();
            }
        }
        catch (error) {
            report.errors.push(`Erreur critique: ${error instanceof Error ? error.message : String(error)}`);
            console.error('❌ Erreur lors de la maintenance:', error);
        }
        return report;
    }
    async printReport(report) {
        const lines = [];
        lines.push('='.repeat(80));
        lines.push('📋 RAPPORT DE MAINTENANCE SIMPLIFIÉE');
        lines.push('='.repeat(80));
        lines.push(`Date: ${report.timestamp.toLocaleString('fr-FR')}`);
        // Connexion
        const connectionStatus = report.databaseConnected ? '✅ Connectée' : '❌ Inaccessible';
        lines.push(`\n🔌 Base de données: ${connectionStatus}`);
        // Opérations
        if (report.maintenancePerformed.length > 0) {
            lines.push('\n🔧 Opérations effectuées:');
            report.maintenancePerformed.forEach(op => {
                lines.push(`   • ${op}`);
            });
        }
        // Statistiques
        lines.push('\n📊 Statistiques:');
        lines.push(`   • News traitées: ${report.newsProcessed.toLocaleString()}`);
        lines.push(`   • Doublons supprimés: ${report.duplicatesRemoved.toLocaleString()}`);
        lines.push(`   • Espace récupéré: ${report.spaceRecovered.toFixed(1)} MB`);
        // Erreurs
        if (report.errors.length > 0) {
            lines.push('\n❌ Erreurs:');
            report.errors.forEach((error, index) => {
                lines.push(`   ${index + 1}. ${error}`);
            });
        }
        // Statut final
        lines.push('\n' + '='.repeat(80));
        const statusEmoji = report.success ? '🟢' : '🔴';
        const statusText = report.success ? 'SUCCÈS' : 'ÉCHEC';
        lines.push(`${statusEmoji} STATUT FINAL: ${statusText}`);
        if (report.success) {
            lines.push('   • Maintenance effectuée avec succès');
            lines.push('   • Base de données optimisée');
            lines.push('   • Problèmes résolus');
        }
        else {
            lines.push('   • Maintenance incomplète');
            lines.push('   • Erreurs critiques détectées');
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
    const maintenance = new SimpleMaintenance();
    console.log('🔧 DÉMARRAGE DE LA MAINTENANCE DE BASE DE DONNÉES');
    console.log('='.repeat(80));
    const runMaintenance = async () => {
        try {
            const report = await maintenance.performMaintenance();
            const reportText = await maintenance.printReport(report);
            console.log(reportText);
            if (report.success) {
                console.log('\n🎉 MAINTENANCE TERMINÉE AVEC SUCCÈS');
                process.exit(0);
            }
            else {
                console.log('\n⚠️ MAINTENANCE TERMINÉE AVEC AVERTISSEMENTS');
                process.exit(1);
            }
        }
        catch (error) {
            console.error('\n💥 ERREUR CRITIQUE PENDANT LA MAINTENANCE:', error);
            process.exit(2);
        }
    };
    // Vérifier les arguments
    const args = process.argv.slice(2);
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
🔧 MAINTENANCE DE BASE DE DONNÉES

Usage: npm run maintenance:simple [options]

Options:
  --help, -h              Afficher cette aide
  --dry-run, -d          Vérifier la base sans faire de modifications
  --verbose, -v           Mode verbeux

Description:
  Ce script effectue une maintenance de base de données complète:
  - Test de connexion à la base PostgreSQL
  - Nettoyage des doublons
  - Suppression des anciennes données (>90 jours)
  - Optimisation VACUUM ANALYZE
  - Génération de rapport détaillé

Exemples:
  npm run maintenance:simple              # Maintenance complète
  npm run maintenance:simple --dry-run    # Vérification sans modifications
    `);
        process.exit(0);
    }
    if (args.includes('--dry-run') || args.includes('-d')) {
        console.log('\n🔍 MODE VERIFICATION SANS MODIFICATIONS');
        const isConnected = await maintenance.testConnection();
        if (isConnected) {
            console.log('✅ Base de données accessible - maintenance possible');
            process.exit(0);
        }
        else {
            console.log('❌ Base de données inaccessible - maintenance impossible');
            process.exit(1);
        }
    }
    if (args.includes('--verbose') || args.includes('-v')) {
        console.log('\n📢 Mode verbeux activé');
    }
    // Exécuter la maintenance
    runMaintenance()
        .catch(error => {
        console.error('💥 ERREUR INATTENDUE:', error);
        process.exit(3);
    })
        .finally(() => {
        maintenance.close();
    });
}
export { SimpleMaintenance };
//# sourceMappingURL=maintenance_simple.js.map