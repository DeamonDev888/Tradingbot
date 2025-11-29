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
exports.NewsDatabaseService = void 0;
const pg_1 = require("pg");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
// Charger les variables d'environnement
dotenv.config();
class NewsDatabaseService {
    constructor(connectionString) {
        // Vérifier si nous voulons utiliser la base de données
        const useDatabase = process.env.USE_DATABASE !== 'false';
        if (!useDatabase) {
            console.log('🔌 Database disabled - running in memory-only mode');
            this.pool = null;
            return;
        }
        try {
            // Utiliser les variables d'environnement ou une connexion par défaut
            const defaultConfig = {
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT || '5432'),
                database: process.env.DB_NAME || 'financial_analyst',
                user: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASSWORD || 'password',
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            };
            this.pool = new pg_1.Pool(connectionString ? { connectionString } : defaultConfig);
            // L'initialisation sera faite lors de la première utilisation
        }
        catch {
            console.log('⚠️ Database initialization failed - running in memory-only mode');
            this.pool = null;
        }
    }
    /**
     * Parse les instructions SQL en gérant correctement les fonctions PL/pgSQL
     */
    parseSQLStatements(schemaSQL) {
        const statements = [];
        let currentStatement = '';
        let inDollarQuote = false;
        let dollarQuoteTag = '';
        const lines = schemaSQL.split('\n');
        for (const line of lines) {
            const trimmedLine = line.trim();
            // Ignorer les lignes vides et les commentaires simples
            if (!trimmedLine || trimmedLine.startsWith('--')) {
                continue;
            }
            // Gérer les délimiteurs de dollars pour PL/pgSQL
            if (trimmedLine.startsWith('$$') && !inDollarQuote) {
                inDollarQuote = true;
                dollarQuoteTag = '$$';
                currentStatement += line + '\n';
                continue;
            }
            if (inDollarQuote && trimmedLine.startsWith(dollarQuoteTag)) {
                currentStatement += line;
                inDollarQuote = false;
                dollarQuoteTag = '';
                // Ajouter l'instruction complète
                if (currentStatement.trim()) {
                    statements.push(currentStatement.trim());
                }
                currentStatement = '';
                continue;
            }
            // Si on est dans une fonction PL/pgSQL
            if (inDollarQuote) {
                currentStatement += line + '\n';
                continue;
            }
            // Instructions régulières terminées par ;
            currentStatement += line + ' ';
            if (trimmedLine.endsWith(';')) {
                const statement = currentStatement.trim();
                if (statement && !statement.startsWith('--')) {
                    statements.push(statement);
                }
                currentStatement = '';
            }
        }
        // Ajouter la dernière instruction si elle existe
        const remainingStatement = currentStatement.trim();
        if (remainingStatement && !remainingStatement.startsWith('--')) {
            statements.push(remainingStatement);
        }
        return statements;
    }
    /**
     * Initialise la base de données avec le schéma
     */
    async initializeDatabase() {
        if (!this.pool) {
            console.log('🔌 Database disabled - skipping initialization');
            return;
        }
        try {
            // Utiliser le schéma simplifié sans PL/pgSQL
            const schemaPath = path.join(__dirname, 'schema.sql');
            console.log(`📄 Reading simplified schema from: ${schemaPath}`);
            const schemaSQL = await fs.readFile(schemaPath, 'utf-8');
            const client = await this.pool.connect();
            // Exécuter le schema en entier avec gestion d'erreurs simple
            try {
                await client.query(schemaSQL);
                console.log('✅ Database schema executed successfully');
            }
            catch (error) {
                // Si l'exécution complète échoue, essayer instruction par instruction
                if (error.message?.includes('already exists') || error.code === '42P07') {
                    console.log('⚡ Schema already exists, continuing...');
                }
                else {
                    console.warn('⚠️ Schema execution had issues, trying individual statements...');
                    const statements = schemaSQL
                        .split(';\n')
                        .map(stmt => stmt.trim())
                        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
                    for (const statement of statements) {
                        try {
                            await client.query(statement + ';');
                        }
                        catch (stmtError) {
                            if (stmtError.code === '42P07' || stmtError.message?.includes('already exists')) {
                                console.log(`⚡ Object already exists: ${statement.substring(0, 50)}...`);
                            }
                            else {
                                console.warn(`⚠️ Statement failed: ${statement.substring(0, 50)}...`);
                            }
                        }
                    }
                }
            }
            client.release();
            console.log('✅ Database initialized successfully with simplified schema (no PL/pgSQL)');
        }
        catch (error) {
            console.warn(`⚠️ Database initialization failed: ${error.message || error}`);
            // Ne pas lancer d'erreur pour permettre à l'application de démarrer
        }
    }
    /**
     * Teste la connexion à la base de données
     */
    async testConnection() {
        if (!this.pool) {
            console.log('🔌 Database disabled - running in memory-only mode');
            return false;
        }
        try {
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();
            console.log('✅ Database connection successful');
            return true;
        }
        catch {
            console.log('⚠️ Database connection failed - using memory-only mode');
            return false;
        }
    }
    /**
     * Récupère les news récentes depuis la base de données
     */
    async getRecentNews(hoursBack = 24, sources) {
        if (!this.pool) {
            // Mode mémoire - retourne un tableau vide
            return [];
        }
        const client = await this.pool.connect();
        try {
            let query = `
                SELECT id, title, url, source, content, author, published_at, scraped_at,
                       sentiment, confidence, keywords, market_hours, processing_status
                FROM news_items
                WHERE published_at >= NOW() - INTERVAL '${hoursBack} hours'
            `;
            const params = [];
            if (sources && sources.length > 0) {
                query += ` AND source = ANY($1)`;
                params.push(sources);
            }
            query += ` ORDER BY published_at DESC`;
            const result = await client.query(query, params.length > 0 ? params : undefined);
            return result.rows.map(this.mapRowToNewsItem);
        }
        finally {
            client.release();
        }
    }
    /**
     * Sauvegarde les news dans la base de données
     */
    async saveNewsItems(newsItems) {
        if (!this.pool) {
            // Mode mémoire - ne fait rien
            console.log(`💾 Memory-only mode: ${newsItems.length} news items processed but not saved`);
            return 0;
        }
        if (newsItems.length === 0)
            return 0;
        // S'assurer que les tables existent
        await this.initializeDatabase();
        const client = await this.pool.connect();
        let savedCount = 0;
        try {
            await client.query('BEGIN');
            for (const item of newsItems) {
                try {
                    // Vérifier si l'URL existe déjà
                    const existingResult = await client.query('SELECT id FROM news_items WHERE url = $1', [
                        item.url,
                    ]);
                    if (existingResult.rows.length === 0) {
                        // Insérer la nouvelle news
                        const insertQuery = `
                            INSERT INTO news_items (
                                title, url, source, published_at, scraped_at,
                                processing_status, keywords, market_hours
                            ) VALUES ($1, $2, $3, $4, $5, 'processed', $6, $7)
                            RETURNING id
                        `;
                        const keywords = this.extractKeywords(item.title);
                        const marketHours = this.determineMarketHours(item.timestamp);
                        await client.query(insertQuery, [
                            item.title,
                            item.url,
                            item.source,
                            item.timestamp,
                            new Date(),
                            JSON.stringify(keywords),
                            marketHours,
                        ]);
                        savedCount++;
                    }
                    else {
                        // Mettre à jour la news existante si nécessaire
                        await client.query(`UPDATE news_items
                             SET scraped_at = $1, processing_status = 'processed'
                             WHERE url = $2`, [new Date(), item.url]);
                    }
                }
                catch (error) {
                    console.error(`Error saving news item: ${item.title}`, error);
                }
            }
            await client.query('COMMIT');
            console.log(`💾 Saved ${savedCount} new news items to database`);
        }
        catch (error) {
            await client.query('ROLLBACK');
            console.error('Error saving news items:', error);
            // Ne pas lancer d'erreur pour permettre à l'application de continuer
        }
        finally {
            client.release();
        }
        return savedCount;
    }
    /**
     * Récupère les news pour l'analyse de sentiment
     */
    async getNewsForAnalysis(hoursBack = 24) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
                SELECT id, title, url, source, published_at, scraped_at,
                       sentiment, confidence, keywords, market_hours, processing_status
                FROM news_items
                WHERE published_at >= NOW() - INTERVAL '${hoursBack} hours'
                  AND processing_status = 'processed'
                ORDER BY published_at DESC
                LIMIT 100
            `);
            return result.rows.map(this.mapRowToNewsItem);
        }
        finally {
            client.release();
        }
    }
    /**
     * Sauvegarde une analyse de sentiment
     */
    async saveSentimentAnalysis(analysis) {
        if (!this.pool) {
            console.log('🔌 Database disabled - skipping sentiment analysis save');
            return '';
        }
        try {
            // S'assurer que les tables existent
            await this.initializeDatabase();
            const client = await this.pool.connect();
            const result = await client.query(`
                INSERT INTO sentiment_analyses (
                    analysis_date, overall_sentiment, score, risk_level, confidence,
                    catalysts, summary, news_count, sources_analyzed
                ) VALUES (
                    CURRENT_DATE, $1, $2, $3, $4, $5, $6, $7, $8
                ) RETURNING id
            `, [
                analysis.sentiment?.toLowerCase(), // Convertir en minuscules pour le CHECK constraint
                analysis.score || 0,
                analysis.risk_level?.toLowerCase(), // Convertir en minuscules pour le CHECK constraint
                0.8, // confidence par défaut
                JSON.stringify(analysis.catalysts || []),
                analysis.summary || '',
                analysis.news_count || 0, // Utiliser le news_count réel
                JSON.stringify(analysis.sources_analyzed || {}),
            ]);
            client.release();
            return result.rows[0].id;
        }
        catch {
            console.error('❌ Failed to save sentiment analysis');
            console.error('   Analysis data:', JSON.stringify(analysis, null, 2));
            return '';
        }
    }
    /**
     * Récupère la dernière analyse de sentiment
     */
    async getLatestSentimentAnalysis() {
        if (!this.pool)
            return null;
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
                SELECT * FROM sentiment_analyses
                ORDER BY created_at DESC
                LIMIT 1
            `);
            return result.rows.length > 0 ? result.rows[0] : null;
        }
        finally {
            client.release();
        }
    }
    /**
     * Vérifie si le cache de news est à jour
     */
    async isCacheFresh(maxAgeHours = 2) {
        if (!this.pool) {
            // Mode mémoire - toujours considéré comme non frais
            return false;
        }
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
                SELECT COUNT(*) as count
                FROM news_items
                WHERE scraped_at >= NOW() - INTERVAL '${maxAgeHours} hours'
            `);
            return parseInt(result.rows[0].count) > 0;
        }
        catch {
            console.log('⚠️ Cache freshness check failed - using memory-only mode');
            return false;
        }
        finally {
            client.release();
        }
    }
    /**
     * Met à jour le statut d'une source
     */
    async updateSourceStatus(sourceName, success, error) {
        if (!this.pool) {
            console.log('🔌 Database disabled - skipping source status update');
            return;
        }
        try {
            const client = await this.pool.connect();
            try {
                if (success) {
                    await client.query(`
                        UPDATE news_sources
                        SET last_success_at = NOW(),
                            last_scraped_at = NOW(),
                            success_count = success_count + 1
                        WHERE name = $1
                    `, [sourceName]);
                }
                else {
                    await client.query(`
                        UPDATE news_sources
                        SET last_scraped_at = NOW(),
                            error_count = error_count + 1
                        WHERE name = $1
                    `, [sourceName]);
                }
            }
            finally {
                client.release();
            }
        }
        catch (_error) {
            console.log('⚠️ Failed to update source status - continuing without database');
        }
    }
    /**
     * Récupère les statistiques de la base de données
     */
    async getDatabaseStats() {
        if (!this.pool)
            return { error: 'Database disabled' };
        const client = await this.pool.connect();
        try {
            const [newsStats, sourceStats, analysisStats] = await Promise.all([
                client.query(`
                    SELECT
                        COUNT(*) as total_news,
                        COUNT(CASE WHEN published_at >= CURRENT_DATE THEN 1 END) as today_news,
                        COUNT(CASE WHEN sentiment = 'bullish' THEN 1 END) as bullish,
                        COUNT(CASE WHEN sentiment = 'bearish' THEN 1 END) as bearish,
                        COUNT(CASE WHEN sentiment = 'neutral' THEN 1 END) as neutral,
                        MAX(published_at) as latest_news
                    FROM news_items
                `),
                client.query(`
                    SELECT name, last_scraped_at, success_count, error_count, is_active
                    FROM news_sources
                    ORDER BY last_scraped_at DESC
                `),
                client.query(`
                    SELECT COUNT(*) as total_analyses,
                            MAX(created_at) as latest_analysis
                    FROM sentiment_analyses
                `),
            ]);
            return {
                news: newsStats.rows[0],
                sources: sourceStats.rows,
                analyses: analysisStats.rows[0],
            };
        }
        finally {
            client.release();
        }
    }
    /**
     * Nettoie les anciennes données
     */
    async cleanupOldData(daysToKeep = 30) {
        if (!this.pool)
            return;
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
                DELETE FROM news_items
                WHERE published_at < NOW() - INTERVAL '${daysToKeep} days'
            `);
            console.log(`🧹 Cleaned up ${result.rowCount} old news items`);
        }
        finally {
            client.release();
        }
    }
    /**
     * Mappe un résultat de base de données vers un NewsItem
     */
    mapRowToNewsItem(row) {
        return {
            id: row.id,
            title: row.title,
            url: row.url,
            source: row.source,
            content: row.content,
            author: row.author,
            timestamp: row.published_at,
            scraped_at: row.scraped_at,
            sentiment: row.sentiment,
            confidence: row.confidence,
            keywords: Array.isArray(row.keywords) ? row.keywords : JSON.parse(row.keywords || '[]'),
            market_hours: row.market_hours,
            processing_status: row.processing_status,
            created_at: row.created_at,
            updated_at: row.updated_at,
        };
    }
    /**
     * Extrait les mots-clés d'un titre (version simplifiée)
     */
    extractKeywords(title) {
        const marketKeywords = [
            'fed',
            'rate',
            'inflation',
            'cpi',
            'market',
            'stock',
            'trade',
            'bull',
            'bear',
            'rally',
            'crash',
            'volatile',
            'economy',
        ];
        const titleLower = title.toLowerCase();
        return marketKeywords.filter(keyword => titleLower.includes(keyword));
    }
    /**
     * Détermine les heures de marché
     */
    determineMarketHours(timestamp) {
        const estTime = new Date(timestamp.toLocaleString('en-US', { timeZone: 'America/New_York' }));
        const hours = estTime.getHours();
        const day = estTime.getDay();
        if (day === 0 || day === 6)
            return 'extended';
        if (hours >= 4 && hours < 9)
            return 'pre-market';
        if (hours >= 9 && hours < 16)
            return 'market';
        if (hours >= 16 && hours < 20)
            return 'after-hours';
        return 'extended';
    }
    /**
     * Sauvegarde une analyse de sentiment enrichie avec les nouvelles colonnes
     */
    async saveEnhancedSentimentAnalysis(analysis) {
        if (!this.pool) {
            console.log('🔌 Database disabled - skipping enhanced sentiment analysis save');
            return '';
        }
        try {
            // S'assurer que les tables existent
            await this.initializeDatabase();
            const client = await this.pool.connect();
            const result = await client.query(`
                INSERT INTO sentiment_analyses (
                    analysis_date, analysis_time, overall_sentiment, score, risk_level, confidence,
                    catalysts, summary, news_count, sources_analyzed,
                    market_session, inference_duration_ms, volatility_estimate, market_regime,
                    sentiment_strength, key_insights, trading_signals, technical_bias,
                    news_impact_level, algorithm_confidence, metadata, validation_flags,
                    performance_metrics, created_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6,
                    $7, $8, $9, $10,
                    $11, $12, $13, $14,
                    $15, $16, $17, $18,
                    $19, $20, $21, $22,
                    $23, $24
                ) RETURNING id
            `, [
                analysis.analysis_date || new Date().toISOString().split('T')[0],
                analysis.analysis_time || new Date().toTimeString(),
                analysis.overall_sentiment?.toLowerCase(),
                analysis.score,
                analysis.risk_level?.toLowerCase(),
                analysis.confidence || 0.8,
                JSON.stringify(analysis.catalysts || []),
                analysis.summary,
                analysis.news_count || 0,
                JSON.stringify(analysis.sources_analyzed || {}),
                analysis.market_session || 'regular',
                analysis.inference_duration_ms,
                analysis.volatility_estimate || 25.0,
                analysis.market_regime || 'transitional',
                analysis.sentiment_strength || 'moderate',
                JSON.stringify(analysis.key_insights || []),
                JSON.stringify(analysis.trading_signals || {}),
                analysis.technical_bias || 'neutral',
                analysis.news_impact_level || 'medium',
                analysis.algorithm_confidence || 0.8,
                JSON.stringify(analysis.metadata || {}),
                JSON.stringify(analysis.validation_flags || {}),
                JSON.stringify(analysis.performance_metrics || {}),
                new Date(),
            ]);
            // Ajouter à la série temporelle
            await this.addToTimeSeries(analysis);
            client.release();
            return result.rows[0].id;
        }
        catch (error) {
            console.error('Error saving enhanced sentiment analysis:', error);
            throw error;
        }
    }
    /**
     * Ajouter les données à la série temporelle de marché
     */
    async addToTimeSeries(analysis) {
        if (!this.pool)
            return;
        try {
            const client = await this.pool.connect();
            await client.query(`
                INSERT INTO market_time_series (
                    timestamp, sentiment_score, volatility_estimate, news_impact_score,
                    market_session, trading_volume_trend, key_events,
                    technical_indicators, correlation_metrics, created_at
                ) VALUES (
                    $1, $2, $3, $4,
                    $5, $6, $7,
                    $8, $9, $10
                )
            `, [
                new Date(),
                analysis.score || 0,
                analysis.volatility_estimate || 25.0,
                this.calculateNewsImpactScore(analysis),
                analysis.market_session || 'regular',
                this.estimateTradingVolumeTrend(analysis),
                JSON.stringify(analysis.key_insights || []),
                JSON.stringify(analysis.technical_indicators || {}),
                JSON.stringify(analysis.correlation_metrics || {}),
                new Date(),
            ]);
            client.release();
        }
        catch (error) {
            console.warn('Warning: Could not add to time series:', error);
            // Ne pas lancer d'erreur, c'est une fonctionnalité additionnelle
        }
    }
    /**
     * Calculer un score d'impact des news
     */
    calculateNewsImpactScore(analysis) {
        let score = 0;
        if (analysis.news_count)
            score += Math.min(analysis.news_count * 2, 50);
        if (analysis.risk_level === 'high')
            score += 30;
        else if (analysis.risk_level === 'medium')
            score += 15;
        return Math.min(score, 100);
    }
    /**
     * Estimer la tendance du volume de trading
     */
    estimateTradingVolumeTrend(analysis) {
        const score = Math.abs(analysis.score || 0);
        if (score > 50)
            return 'high';
        if (score > 20)
            return 'normal';
        return 'low';
    }
    /**
     * Récupère les événements économiques
     */
    async getEconomicEvents(startDate, endDate, minImportance = 1) {
        if (!this.pool)
            return [];
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
        SELECT * FROM economic_events
        WHERE event_date >= $1 AND event_date <= $2
        AND importance >= $3
        ORDER BY event_date ASC
      `, [startDate, endDate, minImportance]);
            return result.rows;
        }
        catch (error) {
            console.error('Error fetching economic events:', error);
            return [];
        }
        finally {
            client.release();
        }
    }
    /**
     * Ferme proprement la connexion à la base de données
     */
    async close() {
        if (this.pool) {
            await this.pool.end();
            console.log('🔌 Database connection closed');
        }
        else {
            console.log('🔌 Memory-only mode - no connection to close');
        }
    }
}
exports.NewsDatabaseService = NewsDatabaseService;
