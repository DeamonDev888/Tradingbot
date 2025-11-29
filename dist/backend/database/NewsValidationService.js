import * as crypto from 'crypto';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();
export class NewsValidationService {
    pool;
    validationRules = [
        {
            name: 'title_length',
            critical: true,
            penalty: 0.4,
            description: 'Le titre doit avoir entre 10 et 500 caractères',
        },
        {
            name: 'title_quality',
            critical: false,
            penalty: 0.3,
            description: 'Le titre ne doit pas contenir trop de majuscules ou caractères spéciaux',
        },
        {
            name: 'url_format',
            critical: true,
            penalty: 0.5,
            description: "L'URL doit être valide et accessible",
        },
        {
            name: 'url_shortener',
            critical: false,
            penalty: 0.1,
            description: 'Les URL raccourcies sont moins fiables',
        },
        {
            name: 'source_reliability',
            critical: false,
            penalty: 0.2,
            description: 'Vérification de la fiabilité de la source',
        },
        {
            name: 'content_quality',
            critical: false,
            penalty: 0.2,
            description: 'Qualité du contenu si disponible',
        },
        {
            name: 'date_validity',
            critical: true,
            penalty: 0.5,
            description: 'La date de publication doit être dans une plage raisonnable',
        },
        {
            name: 'duplicate_detection',
            critical: false,
            penalty: 0.3,
            description: 'Détection des doublons basée sur le hash',
        },
        {
            name: 'spam_detection',
            critical: true,
            penalty: 0.8,
            description: 'Détection de spam et contenu suspect',
        },
        {
            name: 'financial_relevance',
            critical: false,
            penalty: 0.15,
            description: 'Pertinence financière du contenu',
        },
    ];
    // Sources fiables avec scores de confiance
    sourceReliability = {
        ZeroHedge: 0.85,
        CNBC: 0.9,
        FinancialJuice: 0.8,
        Finnhub: 0.95,
        FRED: 1.0,
        TradingEconomics: 0.85,
        Bloomberg: 0.95,
        Reuters: 0.9,
        MarketWatch: 0.8,
        'Yahoo Finance': 0.85,
        'Investing.com': 0.75,
        CBOE: 1.0,
        Twitter: 0.4,
        Reddit: 0.3,
        'Social Media': 0.25,
    };
    // Mots-clés financiers pour la pertinence
    financialKeywords = [
        'fed',
        'federal reserve',
        'inflation',
        'cpi',
        'interest rate',
        'market',
        'stock',
        'bond',
        'commodity',
        'currency',
        'trading',
        'investing',
        'portfolio',
        'dividend',
        'earnings',
        'revenue',
        'profit',
        'loss',
        'gdp',
        'volatility',
        'vix',
        'sp500',
        'nasdaq',
        'dow jones',
        'bullish',
        'bearish',
        'rally',
        'crash',
        'correction',
        'economy',
        'recession',
        'recovery',
        'unemployment',
    ];
    constructor() {
        this.pool = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'financial_analyst',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '9022',
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
    }
    /**
     * Valide un item de news avant insertion
     */
    async validateNewsItem(item) {
        const result = {
            isValid: true,
            qualityScore: 1.0,
            errors: [],
            warnings: [],
            appliedRules: [],
        };
        const processedItem = {
            ...item,
            title_hash: this.generateTitleHash(item.title),
            url_hash: this.generateUrlHash(item.url),
            data_quality_score: 1.0,
            processing_status: 'raw',
            market_hours: this.determineMarketHours(item.timestamp),
            duplicate_count: 1,
            keywords: this.extractKeywords(item.title),
            normalized_title: this.normalizeTitle(item.title),
            normalized_url: this.normalizeUrl(item.url),
            scraped_at: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
        };
        // Appliquer chaque règle de validation
        for (const rule of this.validationRules) {
            try {
                const ruleResult = await this.applyRule(rule, item, processedItem);
                if (!ruleResult.passed) {
                    result.appliedRules.push(rule.name);
                    if (rule.critical) {
                        result.errors.push(`Critique: ${rule.description}`);
                        result.isValid = false;
                    }
                    else {
                        result.warnings.push(`Attention: ${rule.description}`);
                        result.qualityScore -= rule.penalty;
                    }
                }
                if (ruleResult.enhancedData) {
                    Object.assign(processedItem, ruleResult.enhancedData);
                }
            }
            catch (error) {
                console.warn(`Erreur validation règle ${rule.name}:`, error);
                result.warnings.push(`Erreur validation ${rule.name}`);
            }
        }
        // Validation finale du score
        processedItem.data_quality_score = Math.max(0, result.qualityScore);
        processedItem.processing_status = result.isValid ? 'processed' : 'rejected';
        result.processedItem = processedItem;
        return result;
    }
    /**
     * Valide et traite un lot de news
     */
    async validateNewsBatch(items) {
        console.log(`🔍 Validation batch de ${items.length} items...`);
        // Détection de doublons dans le batch
        const batchDuplicates = this.detectBatchDuplicates(items);
        const results = [];
        const seenHashes = new Set();
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const itemHash = this.generateTitleHash(item.title);
            // Marquer comme doublon si détecté dans le batch
            if (batchDuplicates.has(itemHash) || seenHashes.has(itemHash)) {
                const duplicateResult = {
                    isValid: false,
                    qualityScore: 0,
                    errors: ['Doublon détecté dans le batch'],
                    warnings: [],
                    appliedRules: ['duplicate_detection'],
                };
                results.push(duplicateResult);
                seenHashes.add(itemHash);
                continue;
            }
            seenHashes.add(itemHash);
            const result = await this.validateNewsItem(item);
            results.push(result);
        }
        const validCount = results.filter(r => r.isValid).length;
        const duplicateCount = results.filter(r => r.errors.some(e => e.includes('Doublon'))).length;
        console.log(`✅ Validation terminée: ${validCount}/${items.length} valides, ${duplicateCount} doublons`);
        return results;
    }
    /**
     * Applique une règle de validation spécifique
     */
    async applyRule(rule, item, processedItem) {
        switch (rule.name) {
            case 'title_length':
                return this.validateTitleLength(item);
            case 'title_quality':
                return this.validateTitleQuality(item);
            case 'url_format':
                return this.validateUrlFormat(item);
            case 'url_shortener':
                return this.validateUrlShortener(item);
            case 'source_reliability':
                return this.validateSourceReliability(item);
            case 'content_quality':
                return this.validateContentQuality(item);
            case 'date_validity':
                return this.validateDateValidity(item);
            case 'duplicate_detection':
                return this.validateDuplicateDetection(item, processedItem);
            case 'spam_detection':
                return this.validateSpamDetection(item);
            case 'financial_relevance':
                return this.validateFinancialRelevance(item);
            default:
                return { passed: true };
        }
    }
    /**
     * Validation de la longueur du titre
     */
    validateTitleLength(item) {
        const title = item.title?.trim();
        const minLength = 10;
        const maxLength = 500;
        if (!title || title.length < minLength || title.length > maxLength) {
            return { passed: false };
        }
        return { passed: true };
    }
    /**
     * Validation de la qualité du titre
     */
    validateTitleQuality(item) {
        const title = item.title?.trim();
        if (!title)
            return { passed: false };
        // Trop de majuscules
        const uppercaseRatio = (title.match(/[A-Z]/g) || []).length / title.length;
        if (uppercaseRatio > 0.4) {
            return { passed: false };
        }
        // Trop de caractères spéciaux
        const specialCharRatio = (title.match(/[^a-zA-Z0-9\s\.\,\!\?\-]/g) || []).length / title.length;
        if (specialCharRatio > 0.2) {
            return { passed: false };
        }
        // Mots répétés
        const words = title.toLowerCase().split(/\s+/);
        const uniqueWords = new Set(words);
        if (uniqueWords.size < words.length * 0.7) {
            return { passed: false };
        }
        return { passed: true };
    }
    /**
     * Validation du format de l'URL
     */
    validateUrlFormat(item) {
        const url = item.url?.trim();
        if (!url)
            return { passed: false };
        const urlPattern = /^https?:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,}\/.*/;
        return { passed: urlPattern.test(url) };
    }
    /**
     * Validation des URL raccourcies
     */
    validateUrlShortener(item) {
        const url = item.url?.toLowerCase();
        if (!url)
            return { passed: false };
        const shorteners = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly'];
        const isShortener = shorteners.some(shortener => url.includes(shortener));
        return { passed: !isShortener };
    }
    /**
     * Validation de la fiabilité de la source
     */
    validateSourceReliability(item) {
        const source = item.source?.trim();
        if (!source)
            return { passed: false };
        const reliability = this.sourceReliability[source] || 0.5;
        return { passed: reliability >= 0.6 }; // Score minimum de 60%
    }
    /**
     * Validation de la qualité du contenu
     */
    validateContentQuality(item) {
        const content = item.content?.trim();
        if (!content)
            return { passed: true }; // Le contenu est optionnel
        // Longueur minimale
        if (content.length < 50) {
            return { passed: false };
        }
        // Trop de majuscules
        const uppercaseRatio = (content.match(/[A-Z]/g) || []).length / content.length;
        if (uppercaseRatio > 0.3) {
            return { passed: false };
        }
        return { passed: true };
    }
    /**
     * Validation de la validité de la date
     */
    validateDateValidity(item) {
        const now = new Date();
        const published = new Date(item.timestamp);
        // Date dans le futur (avec 1h de marge pour les fuseaux horaires)
        if (published > new Date(now.getTime() + 60 * 60 * 1000)) {
            return { passed: false };
        }
        // Date trop ancienne (plus de 90 jours)
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        if (published < ninetyDaysAgo) {
            return { passed: false };
        }
        return { passed: true };
    }
    /**
     * Validation de détection de doublons
     */
    async validateDuplicateDetection(item, processedItem) {
        const titleHash = processedItem.title_hash;
        const client = await this.pool.connect();
        try {
            // Vérifier si un titre similaire existe déjà
            const result = await client.query(`SELECT id, title, source, published_at
         FROM news_items
         WHERE title_hash = $1
         AND published_at >= NOW() - INTERVAL '7 days'
         LIMIT 1`, [titleHash]);
            return { passed: result.rows.length === 0 };
        }
        finally {
            client.release();
        }
    }
    /**
     * Validation de détection de spam
     */
    validateSpamDetection(item) {
        const title = item.title?.toLowerCase() || '';
        const content = item.content?.toLowerCase() || '';
        // Mots spam typiques
        const spamWords = [
            'click here',
            'buy now',
            'limited time',
            'act fast',
            'guaranteed',
            'miracle',
            'secret',
            'shocking',
            'you won',
            'congratulations',
            'winner',
        ];
        const hasSpamWords = spamWords.some(word => title.includes(word) || content.includes(word));
        if (hasSpamWords) {
            return { passed: false };
        }
        // Trop d'exclamations
        const exclamationCount = (title + content).match(/!/g) || [];
        if (exclamationCount.length > 3) {
            return { passed: false };
        }
        // Caractères répétés
        const repeatedChars = (title + content).match(/(.)\1{3,}/g) || [];
        if (repeatedChars.length > 2) {
            return { passed: false };
        }
        return { passed: true };
    }
    /**
     * Validation de la pertinence financière
     */
    validateFinancialRelevance(item) {
        const text = `${item.title} ${item.content || ''}`.toLowerCase();
        // Compter les mots-clés financiers
        const keywordCount = this.financialKeywords.filter(keyword => text.includes(keyword)).length;
        // Au moins 1 mot-clé financier pour être pertinent
        return { passed: keywordCount > 0 };
    }
    /**
     * Détecte les doublons dans un batch
     */
    detectBatchDuplicates(items) {
        const hashCounts = new Map();
        const duplicates = new Set();
        items.forEach(item => {
            const hash = this.generateTitleHash(item.title);
            const count = hashCounts.get(hash) || 0;
            hashCounts.set(hash, count + 1);
            if (count >= 1) {
                duplicates.add(hash);
            }
        });
        return duplicates;
    }
    /**
     * Génère un hash SHA256 pour un titre normalisé
     */
    generateTitleHash(title) {
        const normalized = this.normalizeTitle(title);
        return crypto.createHash('sha256').update(normalized).digest('hex');
    }
    /**
     * Génère un hash SHA256 pour une URL normalisée
     */
    generateUrlHash(url) {
        const normalized = this.normalizeUrl(url);
        return crypto.createHash('sha256').update(normalized).digest('hex');
    }
    /**
     * Normalise un titre pour le hashage
     */
    normalizeTitle(title) {
        return title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s]/g, '') // Garder seulement lettres, chiffres, espaces
            .replace(/\s+/g, ' ') // Unifier les espaces
            .trim();
    }
    /**
     * Normalise une URL pour le hashage
     */
    normalizeUrl(url) {
        try {
            const urlObj = new URL(url);
            // Normaliser : enlever les paramètres de tracking, minuscules, etc.
            return `${urlObj.protocol}//${urlObj.hostname.toLowerCase()}${urlObj.pathname}`
                .replace(/\/+$/, '') // Enlever les slashes finaux
                .toLowerCase();
        }
        catch {
            return url.toLowerCase().trim();
        }
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
     * Extrait les mots-clés pertinents
     */
    extractKeywords(text) {
        const words = text.toLowerCase().split(/\s+/);
        return this.financialKeywords.filter(keyword => words.some(word => word.includes(keyword) || keyword.includes(word)));
    }
    /**
     * Sauvegarde les news validées en base
     */
    async saveValidatedNews(results) {
        const stats = {
            saved: 0,
            duplicates: 0,
            rejected: 0,
            errors: [],
        };
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            for (const result of results) {
                if (!result.processedItem) {
                    stats.rejected++;
                    continue;
                }
                try {
                    if (result.isValid) {
                        const item = result.processedItem;
                        await client.query(`
              INSERT INTO news_items (
                title, title_hash, url, url_hash, source, content, author,
                published_at, scraped_at, sentiment, confidence, keywords,
                market_hours, processing_status, duplicate_count,
                data_quality_score, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
              ON CONFLICT (title_hash, DATE(published_at))
              DO UPDATE SET
                duplicate_count = news_items.duplicate_count + 1,
                updated_at = NOW()
            `, [
                            item.title,
                            item.title_hash,
                            item.url,
                            item.url_hash,
                            item.source,
                            item.content,
                            item.author,
                            item.timestamp,
                            item.scraped_at,
                            item.sentiment || 'neutral',
                            item.confidence || 0.5,
                            JSON.stringify(item.keywords),
                            item.market_hours,
                            item.processing_status,
                            item.duplicate_count,
                            item.data_quality_score,
                            item.created_at,
                            item.updated_at,
                        ]);
                        stats.saved++;
                    }
                    else if (result.errors.some(e => e.includes('Doublon'))) {
                        stats.duplicates++;
                    }
                    else {
                        stats.rejected++;
                    }
                }
                catch (error) {
                    stats.errors.push(`Erreur sauvegarde: ${error}`);
                    console.error('Erreur sauvegarde news:', error);
                }
            }
            await client.query('COMMIT');
            // Mettre à jour les métriques de qualité
            await this.updateQualityMetrics();
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
        console.log(`💾 Sauvegarde terminée: ${stats.saved} insérées, ${stats.duplicates} doublons, ${stats.rejected} rejetées`);
        if (stats.errors.length > 0) {
            console.warn(`⚠️ Erreurs: ${stats.errors.length}`);
            stats.errors.slice(0, 5).forEach(err => console.log(`   • ${err}`));
        }
        return stats;
    }
    /**
     * Met à jour les métriques de qualité
     */
    async updateQualityMetrics() {
        const client = await this.pool.connect();
        try {
            await client.query(`
        INSERT INTO data_quality_metrics (
          metric_date, total_news, unique_news, duplicate_news,
          avg_quality_score, sources_active, news_last_24h, news_last_7d
        )
        SELECT
          CURRENT_DATE,
          COUNT(*) as total_news,
          COUNT(DISTINCT title_hash) as unique_news,
          COUNT(*) - COUNT(DISTINCT title_hash) as duplicate_news,
          ROUND(AVG(data_quality_score), 2) as avg_quality_score,
          COUNT(DISTINCT source) as sources_active,
          COUNT(CASE WHEN scraped_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as news_last_24h,
          COUNT(CASE WHEN scraped_at >= NOW() - INTERVAL '7 days' THEN 1 END) as news_last_7d
        FROM news_items
        WHERE processing_status != 'rejected'
        ON CONFLICT (metric_date)
        DO UPDATE SET
          total_news = EXCLUDED.total_news,
          unique_news = EXCLUDED.unique_news,
          duplicate_news = EXCLUDED.duplicate_news,
          avg_quality_score = EXCLUDED.avg_quality_score,
          sources_active = EXCLUDED.sources_active,
          news_last_24h = EXCLUDED.news_last_24h,
          news_last_7d = EXCLUDED.news_last_7d,
          updated_at = NOW()
      `);
        }
        finally {
            client.release();
        }
    }
    /**
     * Ferme les connexions
     */
    async close() {
        await this.pool.end();
    }
}
//# sourceMappingURL=NewsValidationService.js.map