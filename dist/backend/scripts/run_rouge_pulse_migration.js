"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
async function runMigration() {
    console.log('🚀 Démarrage de la migration de la base de données RougePulse...\n');
    const pool = new pg_1.Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'financial_analyst',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '9022',
    });
    try {
        // Lire le fichier SQL simplifié
        const migrationPath = path.resolve(__dirname, 'simple_migration.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
        console.log('📖 Lecture du fichier de migration...');
        // Séparer les requêtes SQL en supprimant les commentaires et lignes vides
        const lines = migrationSQL.split('\n');
        const queries = [];
        let currentQuery = '';
        for (const line of lines) {
            const trimmedLine = line.trim();
            // Ignorer les commentaires et lignes vides
            if (trimmedLine.startsWith('--') || trimmedLine === '' ||
                trimmedLine.startsWith('Message de confirmation') ||
                trimmedLine.startsWith('SELECT') ||
                trimmedLine.startsWith('Vérifier la structure') ||
                trimmedLine.includes('status')) {
                continue;
            }
            // Ajouter la ligne à la requête actuelle
            currentQuery += ' ' + trimmedLine;
            // Si la ligne se termine par un point-virgule, terminer la requête
            if (trimmedLine.endsWith(';')) {
                currentQuery = currentQuery.trim();
                if (currentQuery) {
                    queries.push(currentQuery);
                }
                currentQuery = '';
            }
        }
        // Ajouter la dernière requête si elle n'a pas de point-virgule
        if (currentQuery.trim()) {
            queries.push(currentQuery.trim() + ';');
        }
        console.log(`📝 ${queries.length} requêtes à exécuter...`);
        const client = await pool.connect();
        try {
            for (let i = 0; i < queries.length; i++) {
                const query = queries[i];
                if (query.toLowerCase().includes('alter table') ||
                    query.toLowerCase().includes('create index')) {
                    console.log(`🔄 Exécution de la requête ${i + 1}/${queries.length}: ${query.substring(0, 50)}...`);
                    try {
                        await client.query(query);
                        console.log(`✅ Requête ${i + 1} exécutée avec succès`);
                    }
                    catch (error) {
                        // Ignorer les erreurs de type "colonne existe déjà"
                        if (error.code === '42701' || error.message.includes('already exists')) {
                            console.log(`⚠️ Requête ${i + 1} ignorée (colonne/index existe déjà)`);
                        }
                        else {
                            console.error(`❌ Erreur lors de la requête ${i + 1}:`, error.message);
                            throw error;
                        }
                    }
                }
            }
            // Vérifier la structure finale de la table
            console.log('\n📊 Vérification de la structure de la table...');
            const structureResult = await client.query(`
        SELECT
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = 'rouge_pulse_analyses'
        ORDER BY ordinal_position
      `);
            console.log('\n📋 Structure finale de la table rouge_pulse_analyses:');
            console.log('='.repeat(80));
            structureResult.rows.forEach((row, index) => {
                const nullable = row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
                const defaultValue = row.column_default ? ` DEFAULT ${row.column_default}` : '';
                console.log(`${index + 1}. ${row.column_name.padEnd(20)} | ${row.data_type.padEnd(15)} | ${nullable}${defaultValue}`);
            });
            console.log('\n🎉 Migration terminée avec succès !');
            console.log('\n✅ Nouvelles colonnes ajoutées:');
            console.log('  • sp500_price: Prix actuel du S&P 500');
            console.log('  • technical_levels: Niveaux techniques (JSONB)');
            console.log('  • bot_action: Action du bot (LONG/SHORT/WAIT)');
            console.log('  • bot_confidence: Score de confiance 0-100');
            console.log('  • market_regime: Régime de marché');
            console.log('  • sentiment_score: Score de sentiment -100 à 100');
            console.log('  • agent_message: Message pour autres agents');
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('❌ Erreur lors de la migration:', error);
        throw error;
    }
    finally {
        await pool.end();
    }
}
// Exécuter la migration
runMigration()
    .then(() => {
    console.log('\n🏁 Migration complétée avec succès');
    process.exit(0);
})
    .catch((error) => {
    console.error('💥 Erreur fatale lors de la migration:', error);
    process.exit(1);
});
