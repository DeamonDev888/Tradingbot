"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsDatabaseService = void 0;
var pg_1 = require("pg");
var fs = require("fs/promises");
var path = require("path");
var dotenv = require("dotenv");
// Charger les variables d'environnement
dotenv.config();
var NewsDatabaseService = /** @class */ (function () {
    function NewsDatabaseService(connectionString) {
        // Vérifier si nous voulons utiliser la base de données
        var useDatabase = process.env.USE_DATABASE !== 'false';
        if (!useDatabase) {
            console.log('🔌 Database disabled - running in memory-only mode');
            this.pool = null;
            return;
        }
        try {
            // Utiliser les variables d'environnement ou une connexion par défaut
            var defaultConfig = {
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT || '5432'),
                database: process.env.DB_NAME || 'financial_analyst',
                user: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASSWORD || 'password',
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            };
            this.pool = new pg_1.Pool(connectionString ? { connectionString: connectionString } : defaultConfig);
            // L'initialisation sera faite lors de la première utilisation
        }
        catch (_a) {
            console.log('⚠️ Database initialization failed - running in memory-only mode');
            this.pool = null;
        }
    }
    /**
     * Parse les instructions SQL en gérant correctement les fonctions PL/pgSQL
     */
    NewsDatabaseService.prototype.parseSQLStatements = function (schemaSQL) {
        var statements = [];
        var currentStatement = '';
        var inDollarQuote = false;
        var dollarQuoteTag = '';
        var lines = schemaSQL.split('\n');
        for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
            var line = lines_1[_i];
            var trimmedLine = line.trim();
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
                var statement = currentStatement.trim();
                if (statement && !statement.startsWith('--')) {
                    statements.push(statement);
                }
                currentStatement = '';
            }
        }
        // Ajouter la dernière instruction si elle existe
        var remainingStatement = currentStatement.trim();
        if (remainingStatement && !remainingStatement.startsWith('--')) {
            statements.push(remainingStatement);
        }
        return statements;
    };
    /**
     * Initialise la base de données avec le schéma
     */
    NewsDatabaseService.prototype.initializeDatabase = function () {
        return __awaiter(this, void 0, void 0, function () {
            var schemaPath, schemaSQL, client, error_1, statements, _i, statements_1, statement, stmtError_1, error_2;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!this.pool) {
                            console.log('🔌 Database disabled - skipping initialization');
                            return [2 /*return*/];
                        }
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 15, , 16]);
                        schemaPath = path.join(__dirname, 'schema.sql');
                        console.log("\uD83D\uDCC4 Reading simplified schema from: ".concat(schemaPath));
                        return [4 /*yield*/, fs.readFile(schemaPath, 'utf-8')];
                    case 2:
                        schemaSQL = _c.sent();
                        return [4 /*yield*/, this.pool.connect()];
                    case 3:
                        client = _c.sent();
                        _c.label = 4;
                    case 4:
                        _c.trys.push([4, 6, , 14]);
                        return [4 /*yield*/, client.query(schemaSQL)];
                    case 5:
                        _c.sent();
                        console.log('✅ Database schema executed successfully');
                        return [3 /*break*/, 14];
                    case 6:
                        error_1 = _c.sent();
                        if (!(((_a = error_1.message) === null || _a === void 0 ? void 0 : _a.includes('already exists')) || error_1.code === '42P07')) return [3 /*break*/, 7];
                        console.log('⚡ Schema already exists, continuing...');
                        return [3 /*break*/, 13];
                    case 7:
                        console.warn('⚠️ Schema execution had issues, trying individual statements...');
                        statements = schemaSQL
                            .split(';\n')
                            .map(function (stmt) { return stmt.trim(); })
                            .filter(function (stmt) { return stmt.length > 0 && !stmt.startsWith('--'); });
                        _i = 0, statements_1 = statements;
                        _c.label = 8;
                    case 8:
                        if (!(_i < statements_1.length)) return [3 /*break*/, 13];
                        statement = statements_1[_i];
                        _c.label = 9;
                    case 9:
                        _c.trys.push([9, 11, , 12]);
                        return [4 /*yield*/, client.query(statement + ';')];
                    case 10:
                        _c.sent();
                        return [3 /*break*/, 12];
                    case 11:
                        stmtError_1 = _c.sent();
                        if (stmtError_1.code === '42P07' || ((_b = stmtError_1.message) === null || _b === void 0 ? void 0 : _b.includes('already exists'))) {
                            console.log("\u26A1 Object already exists: ".concat(statement.substring(0, 50), "..."));
                        }
                        else {
                            console.warn("\u26A0\uFE0F Statement failed: ".concat(statement.substring(0, 50), "..."));
                        }
                        return [3 /*break*/, 12];
                    case 12:
                        _i++;
                        return [3 /*break*/, 8];
                    case 13: return [3 /*break*/, 14];
                    case 14:
                        client.release();
                        console.log('✅ Database initialized successfully with simplified schema (no PL/pgSQL)');
                        return [3 /*break*/, 16];
                    case 15:
                        error_2 = _c.sent();
                        console.warn("\u26A0\uFE0F Database initialization failed: ".concat(error_2.message || error_2));
                        return [3 /*break*/, 16];
                    case 16: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Teste la connexion à la base de données
     */
    NewsDatabaseService.prototype.testConnection = function () {
        return __awaiter(this, void 0, void 0, function () {
            var client, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.pool) {
                            console.log('🔌 Database disabled - running in memory-only mode');
                            return [2 /*return*/, false];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.pool.connect()];
                    case 2:
                        client = _b.sent();
                        return [4 /*yield*/, client.query('SELECT NOW()')];
                    case 3:
                        _b.sent();
                        client.release();
                        console.log('✅ Database connection successful');
                        return [2 /*return*/, true];
                    case 4:
                        _a = _b.sent();
                        console.log('⚠️ Database connection failed - using memory-only mode');
                        return [2 /*return*/, false];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Récupère les news récentes depuis la base de données
     */
    NewsDatabaseService.prototype.getRecentNews = function () {
        return __awaiter(this, arguments, void 0, function (hoursBack, sources) {
            var client, query, params, result;
            if (hoursBack === void 0) { hoursBack = 24; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.pool) {
                            // Mode mémoire - retourne un tableau vide
                            return [2 /*return*/, []];
                        }
                        return [4 /*yield*/, this.pool.connect()];
                    case 1:
                        client = _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, , 4, 5]);
                        query = "\n                SELECT id, title, url, source, content, author, published_at, scraped_at,\n                       sentiment, confidence, keywords, market_hours, processing_status\n                FROM news_items\n                WHERE published_at >= NOW() - INTERVAL '".concat(hoursBack, " hours'\n            ");
                        params = [];
                        if (sources && sources.length > 0) {
                            query += " AND source = ANY($1)";
                            params.push(sources);
                        }
                        query += " ORDER BY published_at DESC";
                        return [4 /*yield*/, client.query(query, params.length > 0 ? params : undefined)];
                    case 3:
                        result = _a.sent();
                        return [2 /*return*/, result.rows.map(this.mapRowToNewsItem)];
                    case 4:
                        client.release();
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Sauvegarde les news dans la base de données
     */
    NewsDatabaseService.prototype.saveNewsItems = function (newsItems) {
        return __awaiter(this, void 0, void 0, function () {
            var client, savedCount, _i, newsItems_1, item, existingResult, insertQuery, keywords, marketHours, error_3, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.pool) {
                            // Mode mémoire - ne fait rien
                            console.log("\uD83D\uDCBE Memory-only mode: ".concat(newsItems.length, " news items processed but not saved"));
                            return [2 /*return*/, 0];
                        }
                        if (newsItems.length === 0)
                            return [2 /*return*/, 0];
                        // S'assurer que les tables existent
                        return [4 /*yield*/, this.initializeDatabase()];
                    case 1:
                        // S'assurer que les tables existent
                        _a.sent();
                        return [4 /*yield*/, this.pool.connect()];
                    case 2:
                        client = _a.sent();
                        savedCount = 0;
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 16, 18, 19]);
                        return [4 /*yield*/, client.query('BEGIN')];
                    case 4:
                        _a.sent();
                        _i = 0, newsItems_1 = newsItems;
                        _a.label = 5;
                    case 5:
                        if (!(_i < newsItems_1.length)) return [3 /*break*/, 14];
                        item = newsItems_1[_i];
                        _a.label = 6;
                    case 6:
                        _a.trys.push([6, 12, , 13]);
                        return [4 /*yield*/, client.query('SELECT id FROM news_items WHERE url = $1', [
                                item.url,
                            ])];
                    case 7:
                        existingResult = _a.sent();
                        if (!(existingResult.rows.length === 0)) return [3 /*break*/, 9];
                        insertQuery = "\n                            INSERT INTO news_items (\n                                title, url, source, published_at, scraped_at,\n                                processing_status, keywords, market_hours\n                            ) VALUES ($1, $2, $3, $4, $5, 'processed', $6, $7)\n                            RETURNING id\n                        ";
                        keywords = this.extractKeywords(item.title);
                        marketHours = this.determineMarketHours(item.timestamp);
                        return [4 /*yield*/, client.query(insertQuery, [
                                item.title,
                                item.url,
                                item.source,
                                item.timestamp,
                                new Date(),
                                JSON.stringify(keywords),
                                marketHours,
                            ])];
                    case 8:
                        _a.sent();
                        savedCount++;
                        return [3 /*break*/, 11];
                    case 9: 
                    // Mettre à jour la news existante si nécessaire
                    return [4 /*yield*/, client.query("UPDATE news_items\n                             SET scraped_at = $1, processing_status = 'processed'\n                             WHERE url = $2", [new Date(), item.url])];
                    case 10:
                        // Mettre à jour la news existante si nécessaire
                        _a.sent();
                        _a.label = 11;
                    case 11: return [3 /*break*/, 13];
                    case 12:
                        error_3 = _a.sent();
                        console.error("Error saving news item: ".concat(item.title), error_3);
                        return [3 /*break*/, 13];
                    case 13:
                        _i++;
                        return [3 /*break*/, 5];
                    case 14: return [4 /*yield*/, client.query('COMMIT')];
                    case 15:
                        _a.sent();
                        console.log("\uD83D\uDCBE Saved ".concat(savedCount, " new news items to database"));
                        return [3 /*break*/, 19];
                    case 16:
                        error_4 = _a.sent();
                        return [4 /*yield*/, client.query('ROLLBACK')];
                    case 17:
                        _a.sent();
                        console.error('Error saving news items:', error_4);
                        return [3 /*break*/, 19];
                    case 18:
                        client.release();
                        return [7 /*endfinally*/];
                    case 19: return [2 /*return*/, savedCount];
                }
            });
        });
    };
    /**
     * Récupère les news pour l'analyse de sentiment
     */
    NewsDatabaseService.prototype.getNewsForAnalysis = function () {
        return __awaiter(this, arguments, void 0, function (hoursBack) {
            var client, result;
            if (hoursBack === void 0) { hoursBack = 24; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.pool.connect()];
                    case 1:
                        client = _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, , 4, 5]);
                        return [4 /*yield*/, client.query("\n                SELECT id, title, url, source, published_at, scraped_at,\n                       sentiment, confidence, keywords, market_hours, processing_status\n                FROM news_items\n                WHERE published_at >= NOW() - INTERVAL '".concat(hoursBack, " hours'\n                  AND processing_status = 'processed'\n                ORDER BY published_at DESC\n                LIMIT 100\n            "))];
                    case 3:
                        result = _a.sent();
                        return [2 /*return*/, result.rows.map(this.mapRowToNewsItem)];
                    case 4:
                        client.release();
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Sauvegarde une analyse de sentiment
     */
    NewsDatabaseService.prototype.saveSentimentAnalysis = function (analysis) {
        return __awaiter(this, void 0, void 0, function () {
            var client, result, _a;
            var _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (!this.pool) {
                            console.log('🔌 Database disabled - skipping sentiment analysis save');
                            return [2 /*return*/, ''];
                        }
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 5, , 6]);
                        // S'assurer que les tables existent
                        return [4 /*yield*/, this.initializeDatabase()];
                    case 2:
                        // S'assurer que les tables existent
                        _d.sent();
                        return [4 /*yield*/, this.pool.connect()];
                    case 3:
                        client = _d.sent();
                        return [4 /*yield*/, client.query("\n                INSERT INTO sentiment_analyses (\n                    analysis_date, overall_sentiment, score, risk_level, confidence,\n                    catalysts, summary, news_count, sources_analyzed\n                ) VALUES (\n                    CURRENT_DATE, $1, $2, $3, $4, $5, $6, $7, $8\n                ) RETURNING id\n            ", [
                                (_b = analysis.sentiment) === null || _b === void 0 ? void 0 : _b.toLowerCase(), // Convertir en minuscules pour le CHECK constraint
                                analysis.score || 0,
                                (_c = analysis.risk_level) === null || _c === void 0 ? void 0 : _c.toLowerCase(), // Convertir en minuscules pour le CHECK constraint
                                0.8, // confidence par défaut
                                JSON.stringify(analysis.catalysts || []),
                                analysis.summary || '',
                                analysis.news_count || 0, // Utiliser le news_count réel
                                JSON.stringify(analysis.sources_analyzed || {}),
                            ])];
                    case 4:
                        result = _d.sent();
                        client.release();
                        return [2 /*return*/, result.rows[0].id];
                    case 5:
                        _a = _d.sent();
                        console.error('❌ Failed to save sentiment analysis');
                        console.error('   Analysis data:', JSON.stringify(analysis, null, 2));
                        return [2 /*return*/, ''];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Récupère la dernière analyse de sentiment
     */
    NewsDatabaseService.prototype.getLatestSentimentAnalysis = function () {
        return __awaiter(this, void 0, void 0, function () {
            var client, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.pool)
                            return [2 /*return*/, null];
                        return [4 /*yield*/, this.pool.connect()];
                    case 1:
                        client = _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, , 4, 5]);
                        return [4 /*yield*/, client.query("\n                SELECT * FROM sentiment_analyses\n                ORDER BY created_at DESC\n                LIMIT 1\n            ")];
                    case 3:
                        result = _a.sent();
                        return [2 /*return*/, result.rows.length > 0 ? result.rows[0] : null];
                    case 4:
                        client.release();
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Vérifie si le cache de news est à jour
     */
    NewsDatabaseService.prototype.isCacheFresh = function () {
        return __awaiter(this, arguments, void 0, function (maxAgeHours) {
            var client, result, _a;
            if (maxAgeHours === void 0) { maxAgeHours = 2; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.pool) {
                            // Mode mémoire - toujours considéré comme non frais
                            return [2 /*return*/, false];
                        }
                        return [4 /*yield*/, this.pool.connect()];
                    case 1:
                        client = _b.sent();
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, 5, 6]);
                        return [4 /*yield*/, client.query("\n                SELECT COUNT(*) as count\n                FROM news_items\n                WHERE scraped_at >= NOW() - INTERVAL '".concat(maxAgeHours, " hours'\n            "))];
                    case 3:
                        result = _b.sent();
                        return [2 /*return*/, parseInt(result.rows[0].count) > 0];
                    case 4:
                        _a = _b.sent();
                        console.log('⚠️ Cache freshness check failed - using memory-only mode');
                        return [2 /*return*/, false];
                    case 5:
                        client.release();
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Met à jour le statut d'une source
     */
    NewsDatabaseService.prototype.updateSourceStatus = function (sourceName, success, error) {
        return __awaiter(this, void 0, void 0, function () {
            var client, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.pool) {
                            console.log('🔌 Database disabled - skipping source status update');
                            return [2 /*return*/];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 10, , 11]);
                        return [4 /*yield*/, this.pool.connect()];
                    case 2:
                        client = _b.sent();
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, , 8, 9]);
                        if (!success) return [3 /*break*/, 5];
                        return [4 /*yield*/, client.query("\n                        UPDATE news_sources\n                        SET last_success_at = NOW(),\n                            last_scraped_at = NOW(),\n                            success_count = success_count + 1\n                        WHERE name = $1\n                    ", [sourceName])];
                    case 4:
                        _b.sent();
                        return [3 /*break*/, 7];
                    case 5: return [4 /*yield*/, client.query("\n                        UPDATE news_sources\n                        SET last_scraped_at = NOW(),\n                            error_count = error_count + 1\n                        WHERE name = $1\n                    ", [sourceName])];
                    case 6:
                        _b.sent();
                        _b.label = 7;
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        client.release();
                        return [7 /*endfinally*/];
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        _a = _b.sent();
                        console.log('⚠️ Failed to update source status - continuing without database');
                        return [3 /*break*/, 11];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Récupère les statistiques de la base de données
     */
    NewsDatabaseService.prototype.getDatabaseStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var client, _a, newsStats, sourceStats, analysisStats;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.pool)
                            return [2 /*return*/, { error: 'Database disabled' }];
                        return [4 /*yield*/, this.pool.connect()];
                    case 1:
                        client = _b.sent();
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, , 4, 5]);
                        return [4 /*yield*/, Promise.all([
                                client.query("\n                    SELECT\n                        COUNT(*) as total_news,\n                        COUNT(CASE WHEN published_at >= CURRENT_DATE THEN 1 END) as today_news,\n                        COUNT(CASE WHEN sentiment = 'bullish' THEN 1 END) as bullish,\n                        COUNT(CASE WHEN sentiment = 'bearish' THEN 1 END) as bearish,\n                        COUNT(CASE WHEN sentiment = 'neutral' THEN 1 END) as neutral,\n                        MAX(published_at) as latest_news\n                    FROM news_items\n                "),
                                client.query("\n                    SELECT name, last_scraped_at, success_count, error_count, is_active\n                    FROM news_sources\n                    ORDER BY last_scraped_at DESC\n                "),
                                client.query("\n                    SELECT COUNT(*) as total_analyses,\n                            MAX(created_at) as latest_analysis\n                    FROM sentiment_analyses\n                "),
                            ])];
                    case 3:
                        _a = _b.sent(), newsStats = _a[0], sourceStats = _a[1], analysisStats = _a[2];
                        return [2 /*return*/, {
                                news: newsStats.rows[0],
                                sources: sourceStats.rows,
                                analyses: analysisStats.rows[0],
                            }];
                    case 4:
                        client.release();
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Nettoie les anciennes données
     */
    NewsDatabaseService.prototype.cleanupOldData = function () {
        return __awaiter(this, arguments, void 0, function (daysToKeep) {
            var client, result;
            if (daysToKeep === void 0) { daysToKeep = 30; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.pool)
                            return [2 /*return*/];
                        return [4 /*yield*/, this.pool.connect()];
                    case 1:
                        client = _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, , 4, 5]);
                        return [4 /*yield*/, client.query("\n                DELETE FROM news_items\n                WHERE published_at < NOW() - INTERVAL '".concat(daysToKeep, " days'\n            "))];
                    case 3:
                        result = _a.sent();
                        console.log("\uD83E\uDDF9 Cleaned up ".concat(result.rowCount, " old news items"));
                        return [3 /*break*/, 5];
                    case 4:
                        client.release();
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Mappe un résultat de base de données vers un NewsItem
     */
    NewsDatabaseService.prototype.mapRowToNewsItem = function (row) {
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
    };
    /**
     * Extrait les mots-clés d'un titre (version simplifiée)
     */
    NewsDatabaseService.prototype.extractKeywords = function (title) {
        var marketKeywords = [
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
        var titleLower = title.toLowerCase();
        return marketKeywords.filter(function (keyword) { return titleLower.includes(keyword); });
    };
    /**
     * Détermine les heures de marché
     */
    NewsDatabaseService.prototype.determineMarketHours = function (timestamp) {
        var estTime = new Date(timestamp.toLocaleString('en-US', { timeZone: 'America/New_York' }));
        var hours = estTime.getHours();
        var day = estTime.getDay();
        if (day === 0 || day === 6)
            return 'extended';
        if (hours >= 4 && hours < 9)
            return 'pre-market';
        if (hours >= 9 && hours < 16)
            return 'market';
        if (hours >= 16 && hours < 20)
            return 'after-hours';
        return 'extended';
    };
    /**
     * Sauvegarde une analyse de sentiment enrichie avec les nouvelles colonnes
     */
    NewsDatabaseService.prototype.saveEnhancedSentimentAnalysis = function (analysis) {
        return __awaiter(this, void 0, void 0, function () {
            var client, result, error_5;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!this.pool) {
                            console.log('🔌 Database disabled - skipping enhanced sentiment analysis save');
                            return [2 /*return*/, ''];
                        }
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 6, , 7]);
                        // S'assurer que les tables existent
                        return [4 /*yield*/, this.initializeDatabase()];
                    case 2:
                        // S'assurer que les tables existent
                        _c.sent();
                        return [4 /*yield*/, this.pool.connect()];
                    case 3:
                        client = _c.sent();
                        return [4 /*yield*/, client.query("\n                INSERT INTO sentiment_analyses (\n                    analysis_date, analysis_time, overall_sentiment, score, risk_level, confidence,\n                    catalysts, summary, news_count, sources_analyzed,\n                    market_session, inference_duration_ms, volatility_estimate, market_regime,\n                    sentiment_strength, key_insights, trading_signals, technical_bias,\n                    news_impact_level, algorithm_confidence, metadata, validation_flags,\n                    performance_metrics, created_at\n                ) VALUES (\n                    $1, $2, $3, $4, $5, $6,\n                    $7, $8, $9, $10,\n                    $11, $12, $13, $14,\n                    $15, $16, $17, $18,\n                    $19, $20, $21, $22,\n                    $23, $24\n                ) RETURNING id\n            ", [
                                analysis.analysis_date || new Date().toISOString().split('T')[0],
                                analysis.analysis_time || new Date().toTimeString(),
                                (_a = analysis.overall_sentiment) === null || _a === void 0 ? void 0 : _a.toLowerCase(),
                                analysis.score,
                                (_b = analysis.risk_level) === null || _b === void 0 ? void 0 : _b.toLowerCase(),
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
                            ])];
                    case 4:
                        result = _c.sent();
                        // Ajouter à la série temporelle
                        return [4 /*yield*/, this.addToTimeSeries(analysis)];
                    case 5:
                        // Ajouter à la série temporelle
                        _c.sent();
                        client.release();
                        return [2 /*return*/, result.rows[0].id];
                    case 6:
                        error_5 = _c.sent();
                        console.error('Error saving enhanced sentiment analysis:', error_5);
                        throw error_5;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Ajouter les données à la série temporelle de marché
     */
    NewsDatabaseService.prototype.addToTimeSeries = function (analysis) {
        return __awaiter(this, void 0, void 0, function () {
            var client, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.pool)
                            return [2 /*return*/];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.pool.connect()];
                    case 2:
                        client = _a.sent();
                        return [4 /*yield*/, client.query("\n                INSERT INTO market_time_series (\n                    timestamp, sentiment_score, volatility_estimate, news_impact_score,\n                    market_session, trading_volume_trend, key_events,\n                    technical_indicators, correlation_metrics, created_at\n                ) VALUES (\n                    $1, $2, $3, $4,\n                    $5, $6, $7,\n                    $8, $9, $10\n                )\n            ", [
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
                            ])];
                    case 3:
                        _a.sent();
                        client.release();
                        return [3 /*break*/, 5];
                    case 4:
                        error_6 = _a.sent();
                        console.warn('Warning: Could not add to time series:', error_6);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Calculer un score d'impact des news
     */
    NewsDatabaseService.prototype.calculateNewsImpactScore = function (analysis) {
        var score = 0;
        if (analysis.news_count)
            score += Math.min(analysis.news_count * 2, 50);
        if (analysis.risk_level === 'high')
            score += 30;
        else if (analysis.risk_level === 'medium')
            score += 15;
        return Math.min(score, 100);
    };
    /**
     * Estimer la tendance du volume de trading
     */
    NewsDatabaseService.prototype.estimateTradingVolumeTrend = function (analysis) {
        var score = Math.abs(analysis.score || 0);
        if (score > 50)
            return 'high';
        if (score > 20)
            return 'normal';
        return 'low';
    };
    /**
     * Ferme proprement la connexion à la base de données
     */
    NewsDatabaseService.prototype.close = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.pool) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.pool.end()];
                    case 1:
                        _a.sent();
                        console.log('🔌 Database connection closed');
                        return [3 /*break*/, 3];
                    case 2:
                        console.log('🔌 Memory-only mode - no connection to close');
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return NewsDatabaseService;
}());
exports.NewsDatabaseService = NewsDatabaseService;
