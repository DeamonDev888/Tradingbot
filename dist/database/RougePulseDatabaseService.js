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
exports.RougePulseDatabaseService = void 0;
var pg_1 = require("pg");
var dotenv = require("dotenv");
dotenv.config();
var RougePulseDatabaseService = /** @class */ (function () {
    function RougePulseDatabaseService() {
        this.pool = new pg_1.Pool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'financial_analyst',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '9022',
        });
    }
    RougePulseDatabaseService.prototype.testConnection = function () {
        return __awaiter(this, void 0, void 0, function () {
            var client, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.pool.connect()];
                    case 1:
                        client = _a.sent();
                        return [4 /*yield*/, client.query('SELECT 1')];
                    case 2:
                        _a.sent();
                        client.release();
                        console.log('✅ RougePulse Database connection successful');
                        return [2 /*return*/, true];
                    case 3:
                        error_1 = _a.sent();
                        console.error('❌ RougePulse Database connection failed:', error_1);
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    RougePulseDatabaseService.prototype.saveAnalysis = function (analysis) {
        return __awaiter(this, void 0, void 0, function () {
            var client, result, analysisId, error_2;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.pool) {
                            console.log('🔌 Database disabled - skipping save');
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, this.pool.connect()];
                    case 1:
                        client = _b.sent();
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 5, 6, 7]);
                        // Créer la table si elle n'existe pas
                        return [4 /*yield*/, client.query("\n        CREATE TABLE IF NOT EXISTS rouge_pulse_analyses_v2 (\n            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n            analysis_date TIMESTAMP WITH TIME ZONE,\n            volatility_score DECIMAL(3,1),\n            critical_count INTEGER,\n            high_count INTEGER,\n            medium_count INTEGER,\n            low_count INTEGER,\n            critical_alerts JSONB,\n            market_movers JSONB,\n            critical_events JSONB,\n            high_impact_events JSONB,\n            medium_impact_events JSONB,\n            low_impact_events JSONB,\n            next_24h_alerts JSONB,\n            next_24h_alerts JSONB,\n            summary TEXT,\n            upcoming_schedule JSONB,\n            data_source VARCHAR(100),\n            status VARCHAR(50),\n            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n            UNIQUE(analysis_date)\n        );\n      ")];
                    case 3:
                        // Créer la table si elle n'existe pas
                        _b.sent();
                        return [4 /*yield*/, client.query("\n          INSERT INTO rouge_pulse_analyses_v2 (\n            volatility_score,\n            critical_count,\n            high_count,\n            medium_count,\n            low_count,\n            critical_alerts,\n            market_movers,\n            critical_events,\n            high_impact_events,\n            medium_impact_events,\n            low_impact_events,\n            next_24h_alerts,\n            summary,\n            upcoming_schedule,\n            data_source,\n            status\n          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)\n          ON CONFLICT (analysis_date)\n          DO UPDATE SET\n            volatility_score = EXCLUDED.volatility_score,\n            critical_count = EXCLUDED.critical_count,\n            high_count = EXCLUDED.high_count,\n            medium_count = EXCLUDED.medium_count,\n            low_count = EXCLUDED.low_count,\n            critical_alerts = EXCLUDED.critical_alerts,\n            market_movers = EXCLUDED.market_movers,\n            critical_events = EXCLUDED.critical_events,\n            high_impact_events = EXCLUDED.high_impact_events,\n            medium_impact_events = EXCLUDED.medium_impact_events,\n            low_impact_events = EXCLUDED.low_impact_events,\n            next_24h_alerts = EXCLUDED.next_24h_alerts,\n            summary = EXCLUDED.summary,\n            upcoming_schedule = EXCLUDED.upcoming_schedule,\n            data_source = EXCLUDED.data_source,\n            status = EXCLUDED.status,\n            created_at = NOW()\n          RETURNING id\n        ", [
                                analysis.volatility_score,
                                analysis.critical_count,
                                analysis.high_count,
                                analysis.medium_count,
                                analysis.low_count,
                                JSON.stringify(analysis.critical_alerts || []),
                                JSON.stringify(analysis.market_movers || []),
                                JSON.stringify(analysis.critical_events || []),
                                JSON.stringify(analysis.high_impact_events || []),
                                JSON.stringify(analysis.medium_impact_events || []),
                                JSON.stringify(analysis.low_impact_events || []),
                                JSON.stringify(analysis.next_24h_alerts || []),
                                analysis.summary,
                                JSON.stringify(analysis.upcoming_schedule || {}),
                                analysis.data_source,
                                analysis.status || 'success',
                            ])];
                    case 4:
                        result = _b.sent();
                        analysisId = (_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.id;
                        console.log("\uD83D\uDCBE Analysis saved to database with ID: ".concat(analysisId));
                        return [2 /*return*/, analysisId];
                    case 5:
                        error_2 = _b.sent();
                        console.error('❌ Error saving RougePulse analysis:', error_2);
                        return [2 /*return*/, null];
                    case 6:
                        client.release();
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    RougePulseDatabaseService.prototype.getLatestAnalysis = function () {
        return __awaiter(this, void 0, void 0, function () {
            var client, result, row, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.pool) {
                            console.log('🔌 Database disabled - returning null');
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, this.pool.connect()];
                    case 1:
                        client = _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, 5, 6]);
                        return [4 /*yield*/, client.query("SELECT * FROM rouge_pulse_analyses_v2\n         ORDER BY analysis_date DESC\n         LIMIT 1")];
                    case 3:
                        result = _a.sent();
                        if (result.rows.length > 0) {
                            row = result.rows[0];
                            return [2 /*return*/, {
                                    id: row.id,
                                    analysis_date: row.analysis_date,
                                    volatility_score: parseFloat(row.volatility_score),
                                    critical_count: row.critical_count,
                                    high_count: row.high_count,
                                    medium_count: row.medium_count,
                                    low_count: row.low_count,
                                    critical_alerts: JSON.parse(row.critical_alerts || '[]'),
                                    market_movers: JSON.parse(row.market_movers || '[]'),
                                    critical_events: JSON.parse(row.critical_events || '[]'),
                                    high_impact_events: JSON.parse(row.high_impact_events || '[]'),
                                    medium_impact_events: JSON.parse(row.medium_impact_events || '[]'),
                                    low_impact_events: JSON.parse(row.low_impact_events || '[]'),
                                    next_24h_alerts: JSON.parse(row.next_24h_alerts || '[]'),
                                    summary: row.summary,
                                    upcoming_schedule: JSON.parse(row.upcoming_schedule || '{}'),
                                    data_source: row.data_source,
                                    status: row.status,
                                }];
                        }
                        return [2 /*return*/, null];
                    case 4:
                        error_3 = _a.sent();
                        console.error('❌ Error fetching latest RougePulse analysis:', error_3);
                        return [2 /*return*/, null];
                    case 5:
                        client.release();
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    RougePulseDatabaseService.prototype.getAnalysisById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var client, result, row, error_4;
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
                        _a.trys.push([2, 4, 5, 6]);
                        return [4 /*yield*/, client.query('SELECT * FROM rouge_pulse_analyses_v2 WHERE id = $1', [
                                id,
                            ])];
                    case 3:
                        result = _a.sent();
                        if (result.rows.length > 0) {
                            row = result.rows[0];
                            return [2 /*return*/, {
                                    id: row.id,
                                    analysis_date: row.analysis_date,
                                    volatility_score: parseFloat(row.volatility_score),
                                    critical_count: row.critical_count,
                                    high_count: row.high_count,
                                    medium_count: row.medium_count,
                                    low_count: row.low_count,
                                    critical_alerts: JSON.parse(row.critical_alerts || '[]'),
                                    market_movers: JSON.parse(row.market_movers || '[]'),
                                    critical_events: JSON.parse(row.critical_events || '[]'),
                                    high_impact_events: JSON.parse(row.high_impact_events || '[]'),
                                    medium_impact_events: JSON.parse(row.medium_impact_events || '[]'),
                                    low_impact_events: JSON.parse(row.low_impact_events || '[]'),
                                    next_24h_alerts: JSON.parse(row.next_24h_alerts || '[]'),
                                    summary: row.summary,
                                    upcoming_schedule: JSON.parse(row.upcoming_schedule || '{}'),
                                    data_source: row.data_source,
                                    status: row.status,
                                }];
                        }
                        return [2 /*return*/, null];
                    case 4:
                        error_4 = _a.sent();
                        console.error('❌ Error fetching RougePulse analysis by ID:', error_4);
                        return [2 /*return*/, null];
                    case 5:
                        client.release();
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    RougePulseDatabaseService.prototype.getRecentAnalyses = function () {
        return __awaiter(this, arguments, void 0, function (daysBack) {
            var client, result, error_5;
            if (daysBack === void 0) { daysBack = 7; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.pool)
                            return [2 /*return*/, []];
                        return [4 /*yield*/, this.pool.connect()];
                    case 1:
                        client = _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, 5, 6]);
                        return [4 /*yield*/, client.query("SELECT * FROM rouge_pulse_analyses_v2\n         WHERE analysis_date >= NOW() - INTERVAL '".concat(daysBack, " days'\n         ORDER BY analysis_date DESC\n         LIMIT 10"), [daysBack])];
                    case 3:
                        result = _a.sent();
                        return [2 /*return*/, result.rows.map(function (row) { return ({
                                id: row.id,
                                analysis_date: row.analysis_date,
                                volatility_score: parseFloat(row.volatility_score),
                                critical_count: row.critical_count,
                                high_count: row.high_count,
                                medium_count: row.medium_count,
                                low_count: row.low_count,
                                critical_alerts: JSON.parse(row.critical_alerts || '[]'),
                                market_movers: JSON.parse(row.market_movers || '[]'),
                                critical_events: JSON.parse(row.critical_events || '[]'),
                                high_impact_events: JSON.parse(row.high_impact_events || '[]'),
                                medium_impact_events: JSON.parse(row.medium_impact_events || '[]'),
                                low_impact_events: JSON.parse(row.low_impact_events || '[]'),
                                next_24h_alerts: JSON.parse(row.next_24h_alerts || '[]'),
                                summary: row.summary,
                                upcoming_schedule: JSON.parse(row.upcoming_schedule || '{}'),
                                data_source: row.data_source,
                                status: row.status,
                            }); })];
                    case 4:
                        error_5 = _a.sent();
                        console.error('❌ Error fetching recent RougePulse analyses:', error_5);
                        return [2 /*return*/, []];
                    case 5:
                        client.release();
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    RougePulseDatabaseService.prototype.close = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.pool) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.pool.end()];
                    case 1:
                        _a.sent();
                        console.log('🔌 RougePulse Database connection closed');
                        return [3 /*break*/, 3];
                    case 2:
                        console.log('🔌 RougePulse Memory-only mode - no connection to close');
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return RougePulseDatabaseService;
}());
exports.RougePulseDatabaseService = RougePulseDatabaseService;
