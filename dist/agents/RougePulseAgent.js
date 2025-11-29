"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RougePulseAgent = void 0;
var BaseAgentSimple_1 = require("./BaseAgentSimple");
var NewsDatabaseService_1 = require("../database/NewsDatabaseService");
var RougePulseDatabaseService_1 = require("../database/RougePulseDatabaseService");
var dotenv = require("dotenv");
dotenv.config();
var RougePulseAgent = /** @class */ (function (_super) {
    __extends(RougePulseAgent, _super);
    function RougePulseAgent() {
        var _this = _super.call(this, 'rouge-pulse-agent') || this;
        _this.dbService = new NewsDatabaseService_1.NewsDatabaseService();
        _this.rpDbService = new RougePulseDatabaseService_1.RougePulseDatabaseService();
        return _this;
    }
    /**
     * Analyse du calendrier économique avec scoring avancé
     */
    RougePulseAgent.prototype.analyzeMarketSentiment = function () {
        return __awaiter(this, arguments, void 0, function (_forceRefresh) {
            var dbConnected, startDate, endDate, events, classifiedEvents, marketMovers, criticalAlerts, summary, error_1;
            if (_forceRefresh === void 0) { _forceRefresh = false; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("[".concat(this.agentName, "] Starting Rouge Pulse Calendar analysis..."));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.dbService.testConnection()];
                    case 2:
                        dbConnected = _a.sent();
                        if (!dbConnected) {
                            return [2 /*return*/, {
                                    error: 'Database not available for Calendar data',
                                    status: 'unavailable',
                                    analysis_date: new Date(),
                                    data_source: 'trading_economics_calendar',
                                }];
                        }
                        startDate = new Date();
                        startDate.setHours(0, 0, 0, 0);
                        endDate = new Date();
                        endDate.setDate(endDate.getDate() + 7); // 7 jours pour meilleure planification
                        return [4 /*yield*/, this.dbService.getEconomicEvents(startDate, endDate, 1)];
                    case 3:
                        events = _a.sent();
                        if (events.length === 0) {
                            return [2 /*return*/, {
                                    summary: '📅 **Calendrier Économique**\n\nAucun événement économique prévu pour les 7 prochains jours.',
                                    events: [],
                                    high_impact_events: [],
                                    market_movers: [],
                                    critical_alerts: [],
                                    analysis_date: new Date(),
                                    status: 'no_data',
                                    data_source: 'trading_economics_calendar',
                                }];
                        }
                        classifiedEvents = this.classifyEventsByImpact(events);
                        marketMovers = this.identifyMarketMovers(classifiedEvents.critical);
                        criticalAlerts = this.generateCriticalAlerts(classifiedEvents.critical);
                        summary = this.generateAdvancedSummary(classifiedEvents, criticalAlerts);
                        return [2 /*return*/, {
                                summary: summary,
                                // Statistiques
                                total_events: events.length,
                                critical_count: classifiedEvents.critical.length,
                                high_count: classifiedEvents.high.length,
                                medium_count: classifiedEvents.medium.length,
                                low_count: classifiedEvents.low.length,
                                // Événements structurés
                                critical_events: classifiedEvents.critical.map(this.formatEventAdvanced.bind(this)),
                                high_impact_events: classifiedEvents.high.map(this.formatEventAdvanced.bind(this)),
                                medium_impact_events: classifiedEvents.medium.map(this.formatEventAdvanced.bind(this)),
                                low_impact_events: classifiedEvents.low.map(this.formatEventAdvanced.bind(this)),
                                // Market movers et alertes
                                market_movers: marketMovers,
                                critical_alerts: criticalAlerts,
                                // Planning par jour
                                upcoming_schedule: this.groupEventsByImportance(classifiedEvents),
                                // Score de volatilité global
                                volatility_score: this.calculateVolatilityScore(classifiedEvents),
                                analysis_date: new Date(),
                                data_source: 'trading_economics_calendar',
                                next_24h_alerts: this.getNext24HoursAlerts(classifiedEvents),
                            }];
                    case 4:
                        error_1 = _a.sent();
                        console.error("[".concat(this.agentName, "] Analysis failed:"), error_1);
                        return [2 /*return*/, {
                                error: "Analysis failed: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'),
                                status: 'error',
                                analysis_date: new Date(),
                                data_source: 'trading_economics_calendar',
                            }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Classification avancée des événements par impact avec scoring intelligent
     */
    RougePulseAgent.prototype.classifyEventsByImpact = function (events) {
        var _this = this;
        var now = new Date();
        var next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        var classified = {
            critical: [], // Rouge + gras = change vraiment le marché
            high: [], // Rouge = impact fort
            medium: [], // Jaune/Orange = impact moyen
            low: [], // Normal = faible impact
        };
        events.forEach(function (event) {
            var eventDate = new Date(event.event_date);
            var isNext24h = eventDate <= next24h;
            // Scoring basé sur l'importance, le timing et le type d'événement
            var score = event.importance || 1;
            // Boost pour les événements des prochaines 24h
            if (isNext24h)
                score += 0.5;
            // Boost pour les indicateurs clés (FED, PIB, Chômage, Inflation)
            var isKeyIndicator = _this.isKeyMarketIndicator(event.event_name);
            if (isKeyIndicator)
                score += 1;
            // Classification basée sur le score
            if (score >= 3.5) {
                classified.critical.push(__assign(__assign({}, event), { calculated_score: score }));
            }
            else if (score >= 2.5) {
                classified.high.push(__assign(__assign({}, event), { calculated_score: score }));
            }
            else if (score >= 1.5) {
                classified.medium.push(__assign(__assign({}, event), { calculated_score: score }));
            }
            else {
                classified.low.push(__assign(__assign({}, event), { calculated_score: score }));
            }
        });
        // Trier par score et date
        Object.keys(classified).forEach(function (key) {
            classified[key].sort(function (a, b) {
                // D'abord par score décroissant, puis par date croissante
                if (b.calculated_score !== a.calculated_score) {
                    return b.calculated_score - a.calculated_score;
                }
                return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
            });
        });
        return classified;
    };
    /**
     * Vérifie si c'est un indicateur clé qui fait bouger le marché
     */
    RougePulseAgent.prototype.isKeyMarketIndicator = function (eventName) {
        var keyIndicators = [
            'fomc',
            'fed',
            'federal reserve',
            'interest rate',
            'taux directeur',
            'gdp',
            'pib',
            'inflation',
            'cpi',
            'ipc',
            'ppi',
            'employment',
            'unemployment',
            'nonfarm payrolls',
            'nfp',
            'retail sales',
            'consumer confidence',
            'consumer sentiment',
            'ISM',
            'PMI',
            'manufacturing',
            'services',
        ].map(function (indicator) { return indicator.toLowerCase(); });
        return keyIndicators.some(function (indicator) { return eventName.toLowerCase().includes(indicator); });
    };
    /**
     * Formatage avancé avec score et alertes
     */
    RougePulseAgent.prototype.formatEventAdvanced = function (e) {
        var eventDate = new Date(e.event_date);
        var isNext24h = eventDate <= new Date(Date.now() + 24 * 60 * 60 * 1000);
        var isKeyIndicator = this.isKeyMarketIndicator(e.event_name);
        return {
            date: eventDate,
            time: eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            event: e.event_name,
            importance: this.getImportanceLabel(e),
            importance_score: e.calculated_score || e.importance || 1,
            actual: e.actual,
            forecast: e.forecast,
            previous: e.previous,
            currency: e.currency,
            // Méta-données avancées
            is_next_24h: isNext24h,
            is_key_indicator: isKeyIndicator,
            impact_level: this.getImpactLevel(e),
            alert_color: this.getAlertColor(e),
            market_movement_expected: this.expectMarketMovement(e),
            // Données de changement
            forecast_change: this.calculateForecastChange(e.forecast, e.previous),
            surprise_potential: this.calculateSurprisePotential(e),
        };
    };
    /**
     * Étiquette d'importance avec mise en évidence
     */
    RougePulseAgent.prototype.getImportanceLabel = function (e) {
        var score = e.calculated_score || e.importance || 1;
        if (score >= 3.5)
            return '🔴 **CRITIQUE**';
        if (score >= 2.5)
            return '🔴 **FORT**';
        if (score >= 1.5)
            return '🟡 MOYEN';
        return '⚪ FAIBLE';
    };
    /**
     * Niveau d'impact textuel
     */
    RougePulseAgent.prototype.getImpactLevel = function (e) {
        var score = e.calculated_score || e.importance || 1;
        if (score >= 3.5)
            return 'Volatilité extrême attendue';
        if (score >= 2.5)
            return 'Forte volatilité attendue';
        if (score >= 1.5)
            return 'Volatilité modérée possible';
        return 'Impact limité attendu';
    };
    /**
     * Couleur d'alerte selon l'importance
     */
    RougePulseAgent.prototype.getAlertColor = function (e) {
        var score = e.calculated_score || e.importance || 1;
        if (score >= 3.5)
            return '🚨';
        if (score >= 2.5)
            return '🔴';
        if (score >= 1.5)
            return '🟡';
        return '⚪';
    };
    /**
     * Détermine si un mouvement de marché est attendu
     */
    RougePulseAgent.prototype.expectMarketMovement = function (e) {
        var score = e.calculated_score || e.importance || 1;
        var isKeyIndicator = this.isKeyMarketIndicator(e.event_name);
        return score >= 2.5 || isKeyIndicator;
    };
    /**
     * Calcule le changement entre prévision et précédent
     */
    RougePulseAgent.prototype.calculateForecastChange = function (forecast, previous) {
        if (!forecast || !previous)
            return 'N/A';
        // Tenter de parser les valeurs numériques
        var forecastNum = parseFloat(forecast.replace(/[^0-9.-]/g, ''));
        var previousNum = parseFloat(previous.replace(/[^0-9.-]/g, ''));
        if (isNaN(forecastNum) || isNaN(previousNum))
            return 'N/A';
        var change = forecastNum - previousNum;
        var changePercent = previousNum !== 0 ? (change / Math.abs(previousNum)) * 100 : 0;
        return "".concat(change >= 0 ? '+' : '').concat(change.toFixed(1), " (").concat(changePercent >= 0 ? '+' : '').concat(changePercent.toFixed(1), "%)");
    };
    /**
     * Calcule le potentiel de surprise
     */
    RougePulseAgent.prototype.calculateSurprisePotential = function (e) {
        var score = e.calculated_score || e.importance || 1;
        if (score >= 3.5)
            return 'HIGH';
        if (score >= 2)
            return 'MEDIUM';
        return 'LOW';
    };
    /**
     * Identifie les événements qui vont vraiment faire bouger le marché
     */
    RougePulseAgent.prototype.identifyMarketMovers = function (criticalEvents) {
        var _this = this;
        return criticalEvents.slice(0, 5).map(function (e) { return ({
            event: e.event_name,
            date: new Date(e.event_date),
            time: new Date(e.event_date).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
            }),
            forecast: e.forecast,
            previous: e.previous,
            change: _this.calculateForecastChange(e.forecast, e.previous),
            impact_score: e.calculated_score,
            market_expected_impact: '🔥 **FORT MOUVEMENT ATTENDU**',
            why_critical: _this.explainWhyCritical(e),
        }); });
    };
    /**
     * Explique pourquoi un événement est critique
     */
    RougePulseAgent.prototype.explainWhyCritical = function (e) {
        var reasons = [];
        if (this.isKeyMarketIndicator(e.event_name)) {
            reasons.push('Indicateur économique majeur');
        }
        var score = e.calculated_score || e.importance || 1;
        if (score >= 4) {
            reasons.push("Score maximum d'impact");
        }
        var eventDate = new Date(e.event_date);
        var isNext24h = eventDate <= new Date(Date.now() + 24 * 60 * 60 * 1000);
        if (isNext24h) {
            reasons.push('Prochaine publication < 24h');
        }
        if (e.importance === 3) {
            reasons.push('Importance maximale Trading Economics');
        }
        return reasons.length > 0 ? reasons.join(' • ') : 'Impact significatif attendu';
    };
    /**
     * Génère les alertes critiques
     */
    RougePulseAgent.prototype.generateCriticalAlerts = function (criticalEvents) {
        var _this = this;
        var now = new Date();
        var next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        return criticalEvents
            .filter(function (e) { return new Date(e.event_date) <= next24h; })
            .map(function (e) { return ({
            alert_type: 'CRITICAL',
            icon: '🚨',
            event: e.event_name,
            time: new Date(e.event_date).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
            }),
            urgency: _this.getUrgencyLevel(e),
            market_impact: '⚡ Volatilité extrême attendue',
            recommendation: _this.getRecommendation(e),
        }); });
    };
    /**
     * Niveau d'urgence
     */
    RougePulseAgent.prototype.getUrgencyLevel = function (e) {
        var eventDate = new Date(e.event_date);
        var hoursUntil = (eventDate.getTime() - Date.now()) / (1000 * 60 * 60);
        if (hoursUntil <= 1)
            return '🔥 **IMMÉDIAT**';
        if (hoursUntil <= 6)
            return '⚡ **TRÈS URGENT**';
        if (hoursUntil <= 24)
            return '⏰ **URGENT**';
        return '📅 **IMPORTANT**';
    };
    /**
     * Recommandation basée sur l'événement
     */
    RougePulseAgent.prototype.getRecommendation = function (e) {
        var eventName = e.event_name.toLowerCase();
        if (eventName.includes('fed') || eventName.includes('taux directeur')) {
            return 'Surveillez les paires de devises USD et les indices américains';
        }
        if (eventName.includes('emploi') || eventName.includes('nfp')) {
            return 'Impact majeur sur le Dow Jones, S&P 500 et USD';
        }
        if (eventName.includes('inflation') || eventName.includes('cpi')) {
            return 'Volatilité attendue sur les obligations et les marchés actions';
        }
        if (eventName.includes('pib') || eventName.includes('gdp')) {
            return "Impact sur l'ensemble des marchés américains";
        }
        return 'Surveillez les mouvements de marché lors de la publication';
    };
    /**
     * Génère un résumé avancé avec mise en évidence
     */
    RougePulseAgent.prototype.generateAdvancedSummary = function (classified, criticalAlerts) {
        var summary = '📅 **Calendrier Économique - Vue Stratégique**\n\n';
        // Alertes critiques en premier
        if (criticalAlerts.length > 0) {
            summary += '🚨 **ALERTES CRITIQUES - 24 PROCHAINES HEURES** 🚨\n';
            criticalAlerts.forEach(function (alert) {
                summary += "".concat(alert.icon, " **").concat(alert.time, "** : ").concat(alert.event, "\n");
                summary += "   ".concat(alert.market_impact, "\n");
                summary += "   \uD83D\uDCA1 ".concat(alert.recommendation, "\n\n");
            });
            summary += '\n';
        }
        // Résumé des événements par importance
        var totalCritical = classified.critical.length;
        var totalHigh = classified.high.length;
        var totalMedium = classified.medium.length;
        var totalLow = classified.low.length;
        summary += "**Vue d'ensemble (7 prochains jours) :**\n";
        if (totalCritical > 0) {
            summary += "\uD83D\uDD34 **".concat(totalCritical, " \u00E9v\u00E9nement(s) CRITIQUE(S)** - March\u00E9 tr\u00E8s volatil attendu\n");
        }
        if (totalHigh > 0) {
            summary += "\uD83D\uDD34 **".concat(totalHigh, " \u00E9v\u00E9nement(s) \u00E0 FORT impact** - Mouvements significatifs probables\n");
        }
        if (totalMedium > 0) {
            summary += "\uD83D\uDFE1 **".concat(totalMedium, " \u00E9v\u00E9nement(s) \u00E0 impact MOYEN** - Volatilit\u00E9 mod\u00E9r\u00E9e possible\n");
        }
        if (totalLow > 0) {
            summary += "\u26AA **".concat(totalLow, " \u00E9v\u00E9nement(s) \u00E0 faible impact** - Impact limit\u00E9\n");
        }
        summary += '\n';
        // Score de volatilité
        var volatilityScore = this.calculateVolatilityScore(classified);
        summary += "\uD83D\uDCCA **Score de Volatilit\u00E9 Global : ".concat(volatilityScore, "/10**\n\n");
        // Prochains événements importants
        var nextImportant = __spreadArray(__spreadArray([], classified.critical, true), classified.high, true).sort(function (a, b) { return new Date(a.event_date).getTime() - new Date(b.event_date).getTime(); })
            .slice(0, 3);
        if (nextImportant.length > 0) {
            summary += '📈 **Prochains événements importants :**\n';
            nextImportant.forEach(function (e) {
                var date = new Date(e.event_date);
                var day = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
                var time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                var score = e.calculated_score || e.importance || 1;
                var label = score >= 3.5 ? '🔴 CRITIQUE' : '🔴 FORT';
                summary += "- ".concat(day, " ").concat(time, " : ").concat(label, " **").concat(e.event_name, "**\n");
                if (e.forecast && e.previous) {
                    summary += "  Pr\u00E9vision: ".concat(e.forecast, " | Pr\u00E9c\u00E9dent: ").concat(e.previous, "\n");
                }
            });
        }
        return summary;
    };
    /**
     * Calcule un score de volatilité global
     */
    RougePulseAgent.prototype.calculateVolatilityScore = function (classified) {
        var score = 0;
        // Pondération par type d'événement
        score += classified.critical.length * 3; // Critique = 3 points
        score += classified.high.length * 2; // Fort = 2 points
        score += classified.medium.length * 1; // Moyen = 1 point
        score += classified.low.length * 0.5; // Faible = 0.5 point
        // Bonus si événements dans les 24h
        var now = new Date();
        var next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        __spreadArray(__spreadArray(__spreadArray([], classified.critical, true), classified.high, true), classified.medium, true).forEach(function (e) {
            if (new Date(e.event_date) <= next24h) {
                score += 0.5; // Bonus de proximité temporelle
            }
        });
        return Math.min(Math.round(score * 10) / 10, 10); // Arrondi à 1 décimale, max 10
    };
    /**
     * Groupe les événements par importance et par jour
     */
    RougePulseAgent.prototype.groupEventsByImportance = function (classified) {
        var _this = this;
        var grouped = {};
        ['critical', 'high', 'medium', 'low'].forEach(function (level) {
            var events = classified[level];
            events.forEach(function (e) {
                var day = new Date(e.event_date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                });
                if (!grouped[day]) {
                    grouped[day] = {
                        critical: [],
                        high: [],
                        medium: [],
                        low: [],
                    };
                }
                grouped[day][level].push(_this.formatEventAdvanced(e));
            });
        });
        return grouped;
    };
    /**
     * Alertes pour les prochaines 24h
     */
    RougePulseAgent.prototype.getNext24HoursAlerts = function (classified) {
        var _this = this;
        var now = new Date();
        var next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        var next24Events = __spreadArray(__spreadArray(__spreadArray([], classified.critical, true), classified.high, true), classified.medium, true).filter(function (e) { return new Date(e.event_date) <= next24h; });
        return next24Events.map(function (e) { return ({
            event: e.event_name,
            time: new Date(e.event_date).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
            }),
            urgency: _this.getUrgencyLevel(e),
            icon: _this.getAlertColor(e),
            impact: _this.getImpactLevel(e),
        }); });
    };
    RougePulseAgent.prototype.generateCalendarSummary = function (high, medium) {
        var summary = '📅 **Calendrier Économique (3 jours)**\n\n';
        if (high.length > 0) {
            summary += '🔴 **IMPACT FORT - ATTENTION MARCHÉ**\n';
            high.forEach(function (e) {
                var date = new Date(e.event_date);
                var day = date.toLocaleDateString('fr-FR', { weekday: 'short' });
                var time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                summary += "- ".concat(day, " ").concat(time, " : **").concat(e.event_name, "**\n");
                if (e.forecast)
                    summary += "  (Pr\u00E9vu: ".concat(e.forecast, " | Pr\u00E9c: ").concat(e.previous, ")\n");
            });
            summary += '\n';
        }
        else {
            summary += "✅ Aucun événement à fort impact (🔴) prévu pour l'instant.\n\n";
        }
        if (medium.length > 0) {
            summary += '🟡 **Impact Moyen**\n';
            // On affiche les 5 prochains événements moyens
            medium.slice(0, 5).forEach(function (e) {
                var date = new Date(e.event_date);
                var day = date.toLocaleDateString('fr-FR', { weekday: 'short' });
                var time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                summary += "- ".concat(day, " ").concat(time, " : ").concat(e.event_name, "\n");
            });
            if (medium.length > 5)
                summary += "... et ".concat(medium.length - 5, " autres \u00E9v\u00E9nements.\n");
        }
        return summary;
    };
    RougePulseAgent.prototype.close = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.dbService.close()];
                    case 1:
                        _a.sent();
                        console.log("[".concat(this.agentName, "] Database connection closed"));
                        return [2 /*return*/];
                }
            });
        });
    };
    return RougePulseAgent;
}(BaseAgentSimple_1.BaseAgentSimple));
exports.RougePulseAgent = RougePulseAgent;
