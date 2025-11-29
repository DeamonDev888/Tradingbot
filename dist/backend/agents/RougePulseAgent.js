import { BaseAgentSimple } from './BaseAgentSimple';
import { NewsDatabaseService } from '../database/NewsDatabaseService';
import { RougePulseDatabaseService } from '../database/RougePulseDatabaseService';
import * as dotenv from 'dotenv';
dotenv.config();
export class RougePulseAgent extends BaseAgentSimple {
    dbService;
    rpDbService;
    constructor() {
        super('rouge-pulse-agent');
        this.dbService = new NewsDatabaseService();
        this.rpDbService = new RougePulseDatabaseService();
    }
    /**
     * Analyse du calendrier économique avec scoring avancé
     */
    async analyzeMarketSentiment(_forceRefresh = false) {
        console.log(`[${this.agentName}] Starting Rouge Pulse Calendar analysis...`);
        try {
            const dbConnected = await this.dbService.testConnection();
            if (!dbConnected) {
                return {
                    error: 'Database not available for Calendar data',
                    status: 'unavailable',
                    analysis_date: new Date(),
                    data_source: 'trading_economics_calendar',
                };
            }
            // Période d'analyse élargie pour meilleure visibilité
            const startDate = new Date();
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 7); // 7 jours pour meilleure planification
            // Récupérer TOUS les événements (même faible importance)
            const events = await this.dbService.getEconomicEvents(startDate, endDate, 1);
            if (events.length === 0) {
                return {
                    summary: '📅 **Calendrier Économique**\n\nAucun événement économique prévu pour les 7 prochains jours.',
                    events: [],
                    high_impact_events: [],
                    market_movers: [],
                    critical_alerts: [],
                    analysis_date: new Date(),
                    status: 'no_data',
                    data_source: 'trading_economics_calendar',
                };
            }
            // Classification avancée avec scoring
            const classifiedEvents = this.classifyEventsByImpact(events);
            // Identifier les "Market Movers" - événements qui changent vraiment le marché
            const marketMovers = this.identifyMarketMovers(classifiedEvents.critical);
            // Générer les alertes critiques
            const criticalAlerts = this.generateCriticalAlerts(classifiedEvents.critical);
            // Résumé intelligent avec mise en évidence
            const summary = this.generateAdvancedSummary(classifiedEvents, criticalAlerts);
            return {
                summary,
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
            };
        }
        catch (error) {
            console.error(`[${this.agentName}] Analysis failed:`, error);
            return {
                error: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                status: 'error',
                analysis_date: new Date(),
                data_source: 'trading_economics_calendar',
            };
        }
    }
    /**
     * Classification avancée des événements par impact avec scoring intelligent
     */
    classifyEventsByImpact(events) {
        const now = new Date();
        const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const classified = {
            critical: [], // Rouge + gras = change vraiment le marché
            high: [], // Rouge = impact fort
            medium: [], // Jaune/Orange = impact moyen
            low: [], // Normal = faible impact
        };
        events.forEach(event => {
            const eventDate = new Date(event.event_date);
            const isNext24h = eventDate <= next24h;
            // Scoring basé sur l'importance, le timing et le type d'événement
            let score = event.importance || 1;
            // Boost pour les événements des prochaines 24h
            if (isNext24h)
                score += 0.5;
            // Boost pour les indicateurs clés (FED, PIB, Chômage, Inflation)
            const isKeyIndicator = this.isKeyMarketIndicator(event.event_name);
            if (isKeyIndicator)
                score += 1;
            // Classification basée sur le score
            if (score >= 3.5) {
                classified.critical.push({ ...event, calculated_score: score });
            }
            else if (score >= 2.5) {
                classified.high.push({ ...event, calculated_score: score });
            }
            else if (score >= 1.5) {
                classified.medium.push({ ...event, calculated_score: score });
            }
            else {
                classified.low.push({ ...event, calculated_score: score });
            }
        });
        // Trier par score et date
        Object.keys(classified).forEach(key => {
            classified[key].sort((a, b) => {
                // D'abord par score décroissant, puis par date croissante
                if (b.calculated_score !== a.calculated_score) {
                    return b.calculated_score - a.calculated_score;
                }
                return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
            });
        });
        return classified;
    }
    /**
     * Vérifie si c'est un indicateur clé qui fait bouger le marché
     */
    isKeyMarketIndicator(eventName) {
        const keyIndicators = [
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
        ].map(indicator => indicator.toLowerCase());
        return keyIndicators.some(indicator => eventName.toLowerCase().includes(indicator));
    }
    /**
     * Formatage avancé avec score et alertes
     */
    formatEventAdvanced(e) {
        const eventDate = new Date(e.event_date);
        const isNext24h = eventDate <= new Date(Date.now() + 24 * 60 * 60 * 1000);
        const isKeyIndicator = this.isKeyMarketIndicator(e.event_name);
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
    }
    /**
     * Étiquette d'importance avec mise en évidence
     */
    getImportanceLabel(e) {
        const score = e.calculated_score || e.importance || 1;
        if (score >= 3.5)
            return '🔴 **CRITIQUE**';
        if (score >= 2.5)
            return '🔴 **FORT**';
        if (score >= 1.5)
            return '🟡 MOYEN';
        return '⚪ FAIBLE';
    }
    /**
     * Niveau d'impact textuel
     */
    getImpactLevel(e) {
        const score = e.calculated_score || e.importance || 1;
        if (score >= 3.5)
            return 'Volatilité extrême attendue';
        if (score >= 2.5)
            return 'Forte volatilité attendue';
        if (score >= 1.5)
            return 'Volatilité modérée possible';
        return 'Impact limité attendu';
    }
    /**
     * Couleur d'alerte selon l'importance
     */
    getAlertColor(e) {
        const score = e.calculated_score || e.importance || 1;
        if (score >= 3.5)
            return '🚨';
        if (score >= 2.5)
            return '🔴';
        if (score >= 1.5)
            return '🟡';
        return '⚪';
    }
    /**
     * Détermine si un mouvement de marché est attendu
     */
    expectMarketMovement(e) {
        const score = e.calculated_score || e.importance || 1;
        const isKeyIndicator = this.isKeyMarketIndicator(e.event_name);
        return score >= 2.5 || isKeyIndicator;
    }
    /**
     * Calcule le changement entre prévision et précédent
     */
    calculateForecastChange(forecast, previous) {
        if (!forecast || !previous)
            return 'N/A';
        // Tenter de parser les valeurs numériques
        const forecastNum = parseFloat(forecast.replace(/[^0-9.-]/g, ''));
        const previousNum = parseFloat(previous.replace(/[^0-9.-]/g, ''));
        if (isNaN(forecastNum) || isNaN(previousNum))
            return 'N/A';
        const change = forecastNum - previousNum;
        const changePercent = previousNum !== 0 ? (change / Math.abs(previousNum)) * 100 : 0;
        return `${change >= 0 ? '+' : ''}${change.toFixed(1)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%)`;
    }
    /**
     * Calcule le potentiel de surprise
     */
    calculateSurprisePotential(e) {
        const score = e.calculated_score || e.importance || 1;
        if (score >= 3.5)
            return 'HIGH';
        if (score >= 2)
            return 'MEDIUM';
        return 'LOW';
    }
    /**
     * Identifie les événements qui vont vraiment faire bouger le marché
     */
    identifyMarketMovers(criticalEvents) {
        return criticalEvents.slice(0, 5).map(e => ({
            event: e.event_name,
            date: new Date(e.event_date),
            time: new Date(e.event_date).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
            }),
            forecast: e.forecast,
            previous: e.previous,
            change: this.calculateForecastChange(e.forecast, e.previous),
            impact_score: e.calculated_score,
            market_expected_impact: '🔥 **FORT MOUVEMENT ATTENDU**',
            why_critical: this.explainWhyCritical(e),
        }));
    }
    /**
     * Explique pourquoi un événement est critique
     */
    explainWhyCritical(e) {
        const reasons = [];
        if (this.isKeyMarketIndicator(e.event_name)) {
            reasons.push('Indicateur économique majeur');
        }
        const score = e.calculated_score || e.importance || 1;
        if (score >= 4) {
            reasons.push("Score maximum d'impact");
        }
        const eventDate = new Date(e.event_date);
        const isNext24h = eventDate <= new Date(Date.now() + 24 * 60 * 60 * 1000);
        if (isNext24h) {
            reasons.push('Prochaine publication < 24h');
        }
        if (e.importance === 3) {
            reasons.push('Importance maximale Trading Economics');
        }
        return reasons.length > 0 ? reasons.join(' • ') : 'Impact significatif attendu';
    }
    /**
     * Génère les alertes critiques
     */
    generateCriticalAlerts(criticalEvents) {
        const now = new Date();
        const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        return criticalEvents
            .filter(e => new Date(e.event_date) <= next24h)
            .map(e => ({
            alert_type: 'CRITICAL',
            icon: '🚨',
            event: e.event_name,
            time: new Date(e.event_date).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
            }),
            urgency: this.getUrgencyLevel(e),
            market_impact: '⚡ Volatilité extrême attendue',
            recommendation: this.getRecommendation(e),
        }));
    }
    /**
     * Niveau d'urgence
     */
    getUrgencyLevel(e) {
        const eventDate = new Date(e.event_date);
        const hoursUntil = (eventDate.getTime() - Date.now()) / (1000 * 60 * 60);
        if (hoursUntil <= 1)
            return '🔥 **IMMÉDIAT**';
        if (hoursUntil <= 6)
            return '⚡ **TRÈS URGENT**';
        if (hoursUntil <= 24)
            return '⏰ **URGENT**';
        return '📅 **IMPORTANT**';
    }
    /**
     * Recommandation basée sur l'événement
     */
    getRecommendation(e) {
        const eventName = e.event_name.toLowerCase();
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
    }
    /**
     * Génère un résumé avancé avec mise en évidence
     */
    generateAdvancedSummary(classified, criticalAlerts) {
        let summary = '📅 **Calendrier Économique - Vue Stratégique**\n\n';
        // Alertes critiques en premier
        if (criticalAlerts.length > 0) {
            summary += '🚨 **ALERTES CRITIQUES - 24 PROCHAINES HEURES** 🚨\n';
            criticalAlerts.forEach(alert => {
                summary += `${alert.icon} **${alert.time}** : ${alert.event}\n`;
                summary += `   ${alert.market_impact}\n`;
                summary += `   💡 ${alert.recommendation}\n\n`;
            });
            summary += '\n';
        }
        // Résumé des événements par importance
        const totalCritical = classified.critical.length;
        const totalHigh = classified.high.length;
        const totalMedium = classified.medium.length;
        const totalLow = classified.low.length;
        summary += "**Vue d'ensemble (7 prochains jours) :**\n";
        if (totalCritical > 0) {
            summary += `🔴 **${totalCritical} événement(s) CRITIQUE(S)** - Marché très volatil attendu\n`;
        }
        if (totalHigh > 0) {
            summary += `🔴 **${totalHigh} événement(s) à FORT impact** - Mouvements significatifs probables\n`;
        }
        if (totalMedium > 0) {
            summary += `🟡 **${totalMedium} événement(s) à impact MOYEN** - Volatilité modérée possible\n`;
        }
        if (totalLow > 0) {
            summary += `⚪ **${totalLow} événement(s) à faible impact** - Impact limité\n`;
        }
        summary += '\n';
        // Score de volatilité
        const volatilityScore = this.calculateVolatilityScore(classified);
        summary += `📊 **Score de Volatilité Global : ${volatilityScore}/10**\n\n`;
        // Prochains événements importants
        const nextImportant = [...classified.critical, ...classified.high]
            .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
            .slice(0, 3);
        if (nextImportant.length > 0) {
            summary += '📈 **Prochains événements importants :**\n';
            nextImportant.forEach(e => {
                const date = new Date(e.event_date);
                const day = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
                const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                const score = e.calculated_score || e.importance || 1;
                const label = score >= 3.5 ? '🔴 CRITIQUE' : '🔴 FORT';
                summary += `- ${day} ${time} : ${label} **${e.event_name}**\n`;
                if (e.forecast && e.previous) {
                    summary += `  Prévision: ${e.forecast} | Précédent: ${e.previous}\n`;
                }
            });
        }
        return summary;
    }
    /**
     * Calcule un score de volatilité global
     */
    calculateVolatilityScore(classified) {
        let score = 0;
        // Pondération par type d'événement
        score += classified.critical.length * 3; // Critique = 3 points
        score += classified.high.length * 2; // Fort = 2 points
        score += classified.medium.length * 1; // Moyen = 1 point
        score += classified.low.length * 0.5; // Faible = 0.5 point
        // Bonus si événements dans les 24h
        const now = new Date();
        const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        [...classified.critical, ...classified.high, ...classified.medium].forEach(e => {
            if (new Date(e.event_date) <= next24h) {
                score += 0.5; // Bonus de proximité temporelle
            }
        });
        return Math.min(Math.round(score * 10) / 10, 10); // Arrondi à 1 décimale, max 10
    }
    /**
     * Groupe les événements par importance et par jour
     */
    groupEventsByImportance(classified) {
        const grouped = {};
        ['critical', 'high', 'medium', 'low'].forEach(level => {
            const events = classified[level];
            events.forEach((e) => {
                const day = new Date(e.event_date).toLocaleDateString('fr-FR', {
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
                grouped[day][level].push(this.formatEventAdvanced(e));
            });
        });
        return grouped;
    }
    /**
     * Alertes pour les prochaines 24h
     */
    getNext24HoursAlerts(classified) {
        const now = new Date();
        const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const next24Events = [...classified.critical, ...classified.high, ...classified.medium].filter(e => new Date(e.event_date) <= next24h);
        return next24Events.map(e => ({
            event: e.event_name,
            time: new Date(e.event_date).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
            }),
            urgency: this.getUrgencyLevel(e),
            icon: this.getAlertColor(e),
            impact: this.getImpactLevel(e),
        }));
    }
    generateCalendarSummary(high, medium) {
        let summary = '📅 **Calendrier Économique (3 jours)**\n\n';
        if (high.length > 0) {
            summary += '🔴 **IMPACT FORT - ATTENTION MARCHÉ**\n';
            high.forEach(e => {
                const date = new Date(e.event_date);
                const day = date.toLocaleDateString('fr-FR', { weekday: 'short' });
                const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                summary += `- ${day} ${time} : **${e.event_name}**\n`;
                if (e.forecast)
                    summary += `  (Prévu: ${e.forecast} | Préc: ${e.previous})\n`;
            });
            summary += '\n';
        }
        else {
            summary += "✅ Aucun événement à fort impact (🔴) prévu pour l'instant.\n\n";
        }
        if (medium.length > 0) {
            summary += '🟡 **Impact Moyen**\n';
            // On affiche les 5 prochains événements moyens
            medium.slice(0, 5).forEach(e => {
                const date = new Date(e.event_date);
                const day = date.toLocaleDateString('fr-FR', { weekday: 'short' });
                const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                summary += `- ${day} ${time} : ${e.event_name}\n`;
            });
            if (medium.length > 5)
                summary += `... et ${medium.length - 5} autres événements.\n`;
        }
        return summary;
    }
    async close() {
        await this.dbService.close();
        console.log(`[${this.agentName}] Database connection closed`);
    }
}
//# sourceMappingURL=RougePulseAgent.js.map