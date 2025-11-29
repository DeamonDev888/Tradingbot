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
exports.VixSimpleAgent = void 0;
const pg_1 = require("pg");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
class VixSimpleAgent {
    constructor() {
        this.pool = new pg_1.Pool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'financial_analyst',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '9022',
        });
    }
    async analyzeVixStructure() {
        console.log('[VixSimpleAgent] 🚀 Starting VIX Database Analysis with markdown output...');
        try {
            // 1. Tester la connexion à la base de données
            const dbConnected = await this.testDatabaseConnection();
            if (!dbConnected) {
                console.log('[VixSimpleAgent] Database not connected - cannot proceed');
                return { error: 'Database not connected.' };
            }
            console.log('[VixSimpleAgent] Using DATABASE-FIRST mode for VIX/VVIX analysis...');
            // 2. Récupérer les données VIX récentes
            const vixData = await this.getVixDataFromDatabase();
            if (!vixData || vixData.length === 0) {
                console.log('[VixSimpleAgent] No VIX data in database - cannot proceed');
                return { error: 'No VIX data found in database. Please run ingestion pipeline.' };
            }
            console.log(`[VixSimpleAgent] Found ${vixData.length} VIX records in DATABASE`);
            // 3. Récupérer les données VVIX récentes
            const vvixData = await this.getVvixDataFromDatabase();
            if (vvixData && vvixData.length > 0) {
                console.log(`[VixSimpleAgent] Found ${vvixData.length} VVIX records in DATABASE`);
            }
            // 4. Analyser les données
            const analysis = await this.performVixAnalysis(vixData, vvixData);
            // 5. Sauvegarder l'analyse
            await this.saveAnalysisToDatabase(analysis);
            // 6. Exporter en markdown
            await this.saveAnalysisToMarkdown(analysis);
            console.log('[VixSimpleAgent] ✅ VIX Database Analysis completed successfully');
            return analysis;
        }
        catch (error) {
            console.error('[VixSimpleAgent] ❌ Error during VIX analysis:', error);
            return { error: error instanceof Error ? error.message : 'Unknown error occurred' };
        }
    }
    async testDatabaseConnection() {
        try {
            const result = await this.pool.query('SELECT 1');
            return result.rows.length > 0;
        }
        catch (error) {
            console.error('[VixSimpleAgent] Database connection test failed:', error);
            return false;
        }
    }
    async getVixDataFromDatabase() {
        try {
            const result = await this.pool.query(`
        SELECT * FROM vix_data
        WHERE timestamp >= NOW() - INTERVAL '7 days'
        ORDER BY timestamp DESC
        LIMIT 100
      `);
            return result.rows.map((row) => ({
                timestamp: row.timestamp,
                symbol: row.symbol,
                value: parseFloat(row.value),
                change: parseFloat(row.change || '0'),
                change_pct: parseFloat(row.change_pct || '0'),
                source: row.source || 'database',
            }));
        }
        catch (error) {
            console.error('[VixSimpleAgent] Error fetching VIX data:', error);
            return [];
        }
    }
    async getVvixDataFromDatabase() {
        try {
            const result = await this.pool.query(`
        SELECT * FROM vix_data
        WHERE symbol LIKE '%VVIX%'
        AND timestamp >= NOW() - INTERVAL '7 days'
        ORDER BY timestamp DESC
        LIMIT 50
      `);
            return result.rows.map((row) => ({
                timestamp: row.timestamp,
                symbol: row.symbol,
                value: parseFloat(row.value),
                change: parseFloat(row.change || '0'),
                change_pct: parseFloat(row.change_pct || '0'),
                source: row.source || 'database',
            }));
        }
        catch (error) {
            console.error('[VixSimpleAgent] Error fetching VVIX data:', error);
            return [];
        }
    }
    async performVixAnalysis(vixData, vvixData) {
        const latestVix = vixData[0];
        const latestVvix = vvixData[0];
        // Calculer les statistiques VIX
        const vixSources = vixData.filter(d => d.symbol.includes('VIX')).slice(0, 10);
        const consensusValue = vixSources.length > 0
            ? vixSources.reduce((sum, d) => sum + d.value, 0) / vixSources.length
            : latestVix.value;
        const spread = {
            min: Math.min(...vixSources.map(d => d.value)),
            max: Math.max(...vixSources.map(d => d.value)),
            range: 0,
        };
        spread.range = spread.max - spread.min;
        // Analyser le régime de volatilité
        const volatilityRegime = this.determineVolatilityRegime(consensusValue);
        // Analyser la tendance
        const vixTrend = this.determineVixTrend(vixData);
        // Générer les insights
        const keyInsights = this.generateKeyInsights(vixData, vvixData, consensusValue, volatilityRegime);
        // Créer l'analyse experte
        const expertAnalysis = {
            vix_trend: vixTrend,
            volatility_regime: volatilityRegime,
            expert_summary: this.generateExpertSummary(consensusValue, volatilityRegime, vixTrend),
            market_implications: {
                es_futures_bias: this.determineESFuturesBias(vixTrend),
                market_structure: this.determineMarketStructure(volatilityRegime),
            },
            trading_recommendations: {
                strategy: this.determineTradingStrategy(volatilityRegime, vixTrend),
                time_horizon: this.determineTimeHorizon(volatilityRegime),
                volatility_adjustment: this.determineVolatilityAdjustment(volatilityRegime),
                risk_management: this.determineRiskManagement(consensusValue),
                target_vix_levels: this.calculateTargetLevels(consensusValue, volatilityRegime),
            },
            catalysts: this.identifyCatalysts(vixData),
            key_insights: keyInsights,
        };
        // Analyse intelligente
        const intelligentAnalysis = {
            vix_level: this.categorizeVixLevel(consensusValue),
            trend: vixTrend,
            interpretation_text: this.generateInterpretation(consensusValue, volatilityRegime),
            expected_monthly_volatility: this.calculateExpectedVolatility(consensusValue, 'monthly'),
            expected_weekly_volatility: this.calculateExpectedVolatility(consensusValue, 'weekly'),
            expected_daily_move_range: this.calculateExpectedVolatility(consensusValue, 'daily'),
            volatility_regime: volatilityRegime,
            alerts: this.generateAlerts(consensusValue, volatilityRegime),
            market_signal: this.determineMarketSignal(vixTrend),
            signal_strength: this.determineSignalStrength(vixData),
            key_insights: keyInsights,
        };
        return {
            current_vix_data: {
                consensus_value: consensusValue,
                spread,
                sources: vixSources,
            },
            current_vvix_data: latestVvix
                ? {
                    consensus_value: latestVvix.value,
                    change_pct: latestVvix.change_pct,
                }
                : undefined,
            intelligent_volatility_analysis: intelligentAnalysis,
            expert_volatility_analysis: expertAnalysis,
            metadata: {
                analysis_timestamp: new Date().toISOString(),
                analysis_type: 'vix_database_analysis',
                vix_sources_count: vixSources.length,
                vvix_sources_count: vvixData.length,
            },
            combined_analysis: {
                market_outlook: this.generateMarketOutlook(volatilityRegime, vixTrend),
                key_takeaways: keyInsights,
                actionable_recommendations: this.generateActionableRecommendations(expertAnalysis),
            },
        };
    }
    determineVolatilityRegime(vixValue) {
        if (vixValue >= 35)
            return 'CRISIS';
        if (vixValue >= 25)
            return 'ELEVATED';
        if (vixValue >= 18)
            return 'NORMAL';
        if (vixValue >= 12)
            return 'CALM';
        return 'EXTREME_CALM';
    }
    determineVixTrend(vixData) {
        if (vixData.length < 5)
            return 'NEUTRAL';
        const recent = vixData.slice(0, 5);
        const older = vixData.slice(5, 10);
        const recentAvg = recent.reduce((sum, d) => sum + d.value, 0) / recent.length;
        const olderAvg = older.length > 0 ? older.reduce((sum, d) => sum + d.value, 0) / older.length : recentAvg;
        const diff = ((recentAvg - olderAvg) / olderAvg) * 100;
        if (diff > 5)
            return 'BULLISH';
        if (diff < -5)
            return 'BEARISH';
        return 'NEUTRAL';
    }
    generateKeyInsights(vixData, vvixData, consensusValue, regime) {
        const insights = [];
        insights.push(`VIX consensus at ${consensusValue.toFixed(2)} indicates ${regime.toLowerCase()} volatility regime`);
        if (vvixData.length > 0) {
            const vvixPremium = ((vvixData[0].value - consensusValue) / consensusValue) * 100;
            insights.push(`VVIX premium of ${vvixPremium.toFixed(1)}% suggests ${vvixPremium > 10 ? 'elevated fear levels' : 'moderate market expectations'}`);
        }
        const spread = this.calculateSpread(vixData);
        if (spread > 2) {
            insights.push(`Wide VIX spread (${spread.toFixed(2)}) indicates divergent market data sources`);
        }
        return insights;
    }
    calculateSpread(vixData) {
        const values = vixData.slice(0, 10).map(d => d.value);
        return Math.max(...values) - Math.min(...values);
    }
    generateExpertSummary(consensusValue, regime, trend) {
        return `VIX at ${consensusValue.toFixed(2)} reflects ${regime.toLowerCase()} volatility with ${trend.toLowerCase()} bias. Current levels suggest ${this.determineMarketCondition(regime, trend)}.`;
    }
    determineMarketCondition(regime, trend) {
        if (regime === 'CRISIS')
            return 'significant market stress and risk aversion';
        if (regime === 'ELEVATED')
            return 'increased uncertainty and elevated risk';
        if (regime === 'NORMAL')
            return 'balanced market conditions with moderate risk';
        return 'stable market environment with low volatility expectations';
    }
    determineESFuturesBias(vixTrend) {
        switch (vixTrend) {
            case 'BULLISH':
                return 'BEARISH';
            case 'BEARISH':
                return 'BULLISH';
            default:
                return 'NEUTRAL';
        }
    }
    determineMarketStructure(regime) {
        switch (regime) {
            case 'CRISIS':
                return 'Risk-off environment, flight to safety';
            case 'ELEVATED':
                return 'Cautious sentiment, selective risk-taking';
            case 'NORMAL':
                return 'Balanced approach, opportunistic trading';
            default:
                return 'Risk-on environment, search for yield';
        }
    }
    determineTradingStrategy(regime, trend) {
        if (regime === 'CRISIS')
            return 'Defensive positioning, volatility selling';
        if (regime === 'ELEVATED')
            return 'Selective opportunities, hedge strategies';
        if (trend === 'BULLISH')
            return 'Momentum strategies, breakout plays';
        if (trend === 'BEARISH')
            return 'Short positioning, protection strategies';
        return 'Range-bound strategies, mean reversion';
    }
    determineTimeHorizon(regime) {
        if (regime === 'CRISIS' || regime === 'ELEVATED')
            return 'Short-term (1-5 days)';
        if (regime === 'NORMAL')
            return 'Medium-term (1-4 weeks)';
        return 'Long-term (1-3 months)';
    }
    determineVolatilityAdjustment(regime) {
        switch (regime) {
            case 'CRISIS':
                return 'Increase position sizes by 50%, widen stops';
            case 'ELEVATED':
                return 'Increase position sizes by 25%, moderate stops';
            case 'NORMAL':
                return 'Standard position sizing, normal stops';
            default:
                return 'Decrease position sizes by 25%, tighten stops';
        }
    }
    determineRiskManagement(vixValue) {
        if (vixValue >= 30)
            return 'Maximum protection, diversified hedging';
        if (vixValue >= 20)
            return 'Enhanced protection, selective hedging';
        if (vixValue >= 15)
            return 'Standard protection, minimal hedging';
        return 'Basic protection, limited hedging';
    }
    calculateTargetLevels(vixValue, regime) {
        const levels = [];
        const multiplier = regime === 'CRISIS' ? 0.15 : regime === 'ELEVATED' ? 0.1 : 0.08;
        levels.push(vixValue * (1 + multiplier)); // Upper target
        levels.push(vixValue * (1 - multiplier)); // Lower target
        if (regime === 'CRISIS') {
            levels.push(vixValue * 1.25); // Extreme upper
            levels.push(vixValue * 0.75); // Extreme lower
        }
        return levels.sort((a, b) => a - b);
    }
    identifyCatalysts(vixData) {
        const catalysts = [];
        // Analyser les mouvements récents
        const recentMoves = vixData.slice(0, 5).filter(d => Math.abs(d.change_pct) > 5);
        if (recentMoves.length > 2) {
            catalysts.push('Multiple large VIX moves detected - possible market events');
        }
        // Analyser la convergence/divergence
        const uniqueSources = [...new Set(vixData.slice(0, 10).map(d => d.source))];
        if (uniqueSources.length > 3) {
            catalysts.push('Diverse VIX sources indicate broad market coverage');
        }
        return catalysts;
    }
    categorizeVixLevel(vixValue) {
        if (vixValue >= 35)
            return 'Extreme Fear';
        if (vixValue >= 25)
            return 'High Fear';
        if (vixValue >= 18)
            return 'Moderate Fear';
        if (vixValue >= 12)
            return 'Low Fear';
        return 'Extreme Greed';
    }
    generateInterpretation(consensusValue, regime) {
        return `Current VIX level of ${consensusValue.toFixed(2)} indicates ${regime.toLowerCase()} market conditions. This suggests ${this.getMarketImplication(regime)} for market participants.`;
    }
    getMarketImplication(regime) {
        switch (regime) {
            case 'CRISIS':
                return 'significant market stress and potential for rapid reversals';
            case 'ELEVATED':
                return 'elevated uncertainty with increased trading opportunities';
            case 'NORMAL':
                return 'balanced conditions suitable for most strategies';
            default:
                return 'stable environment requiring patience for entry points';
        }
    }
    calculateExpectedVolatility(vixValue, period) {
        const annualizedVol = vixValue;
        switch (period) {
            case 'monthly':
                return (annualizedVol / Math.sqrt(12)) * 1.5; // Approximate monthly range
            case 'weekly':
                return (annualizedVol / Math.sqrt(52)) * 2; // Approximate weekly range
            case 'daily':
                return (annualizedVol / Math.sqrt(252)) * 2.5; // Approximate daily range
            default:
                return annualizedVol;
        }
    }
    generateAlerts(vixValue, regime) {
        const alerts = [];
        if (vixValue >= 30) {
            alerts.push('🚨 CRISIS LEVEL - Maximum protection required');
        }
        else if (vixValue >= 25) {
            alerts.push('⚠️ ELEVATED VOLATILITY - Enhanced protection needed');
        }
        else if (vixValue <= 12) {
            alerts.push('😴 EXTREME CALM - Opportunity for volatility selling');
        }
        return alerts;
    }
    determineMarketSignal(vixTrend) {
        switch (vixTrend) {
            case 'BULLISH':
                return 'Bearish on equities';
            case 'BEARISH':
                return 'Bullish on equities';
            default:
                return 'Neutral - mixed signals';
        }
    }
    determineSignalStrength(vixData) {
        if (vixData.length < 10)
            return 'Low';
        const recentVolatility = this.calculateVolatility(vixData.slice(0, 5));
        const historicalVolatility = this.calculateVolatility(vixData.slice(5, 15));
        const ratio = recentVolatility / historicalVolatility;
        if (ratio > 1.5)
            return 'Strong';
        if (ratio > 1.2)
            return 'Moderate';
        return 'Weak';
    }
    calculateVolatility(data) {
        if (data.length < 2)
            return 0;
        const values = data.map(d => d.value);
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }
    generateMarketOutlook(regime, trend) {
        const regimeOutlook = {
            CRISIS: 'High volatility expected with potential for sharp reversals',
            ELEVATED: 'Above-average volatility with increased uncertainty',
            NORMAL: 'Moderate volatility with balanced market conditions',
            CALM: 'Low volatility environment suitable for trend following',
            EXTREME_CALM: 'Very low volatility suggesting complacency',
        };
        const trendOutlook = {
            BULLISH: 'Increasing volatility may signal market uncertainty',
            BEARISH: 'Decreasing volatility suggests improving sentiment',
            NEUTRAL: 'Stable volatility pattern expected to continue',
        };
        return `${regimeOutlook[regime]}. ${trendOutlook[trend]}.`;
    }
    generateActionableRecommendations(expertAnalysis) {
        const recommendations = [];
        recommendations.push(`Strategy: ${expertAnalysis.trading_recommendations.strategy}`);
        recommendations.push(`Time horizon: ${expertAnalysis.trading_recommendations.time_horizon}`);
        recommendations.push(`ES Futures bias: ${expertAnalysis.market_implications.es_futures_bias}`);
        recommendations.push(`Risk management: ${expertAnalysis.trading_recommendations.risk_management}`);
        return recommendations;
    }
    async saveAnalysisToDatabase(analysis) {
        try {
            const query = `
        INSERT INTO vix_analyses (analysis_data, created_at)
        VALUES ($1, NOW())
      `;
            await this.pool.query(query, [JSON.stringify(analysis)]);
            console.log('[VixSimpleAgent] ✅ Analysis saved to database');
        }
        catch (error) {
            console.error('[VixSimpleAgent] Error saving analysis to database:', error);
        }
    }
    async saveAnalysisToMarkdown(analysis) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `vix_analysis_${timestamp}.md`;
            const filepath = path.resolve(filename);
            // Créer le contenu markdown
            let markdown = `# Analyse VIX/VVIX - ${new Date().toLocaleString('fr-FR')}\n\n`;
            // Métadonnées
            markdown += `## 📊 Métadonnées\n\n`;
            markdown += `- **Timestamp** : ${analysis.metadata.analysis_timestamp}\n`;
            markdown += `- **Type d'analyse** : ${analysis.metadata.analysis_type}\n`;
            markdown += `- **Sources VIX** : ${analysis.metadata.vix_sources_count}\n`;
            markdown += `- **Sources VVIX** : ${analysis.metadata.vvix_sources_count}\n`;
            markdown += `- **Statut du marché** : ${this.determineMarketStatus()}\n\n`;
            // Données VIX actuelles
            markdown += `## 📈 Données VIX Actuelles\n\n`;
            markdown += `- **Valeur consensus** : ${analysis.current_vix_data.consensus_value}\n`;
            markdown += `- **Étendue** : ${analysis.current_vix_data.spread.min} - ${analysis.current_vix_data.spread.max} (${analysis.current_vix_data.spread.range})\n`;
            if (analysis.current_vix_data.sources.length > 0) {
                markdown += `### Sources VIX:\n`;
                analysis.current_vix_data.sources.forEach((source, i) => {
                    markdown += `${i + 1}. **${source.source}** : ${source.value} (${source.change_pct || 'N/A'}%)\n`;
                });
            }
            // Données VVIX si disponible
            if (analysis.current_vvix_data) {
                markdown += `\n## 📊 Données VVIX Actuelles\n\n`;
                markdown += `- **Valeur consensus** : ${analysis.current_vvix_data.consensus_value}\n`;
                if (analysis.current_vvix_data) {
                    markdown += `### Sources VVIX:\n`;
                    // Note: This would need to be adapted based on actual VVIX data structure
                }
            }
            // Analyse intelligente
            if (analysis.intelligent_volatility_analysis) {
                const volAnalysis = analysis.intelligent_volatility_analysis;
                markdown += `\n## 📊 Analyse Intelligente\n\n`;
                markdown += `- **Niveau VIX** : ${volAnalysis.vix_level}\n`;
                markdown += `- **Tendance** : ${volAnalysis.trend}\n`;
                markdown += `- **Interprétation** : ${volAnalysis.interpretation_text}\n`;
                markdown += `- **Volatilité mensuelle attendue** : ${volAnalysis.expected_monthly_volatility}\n`;
                markdown += `- **Volatilité hebdomadaire attendue** : ${volAnalysis.expected_weekly_volatility}\n`;
                markdown += `- **Mouvement quotidien attendu** : ${volAnalysis.expected_daily_move_range}\n`;
                markdown += `- **Régime de volatilité** : ${volAnalysis.volatility_regime}\n`;
                if (volAnalysis.alerts.length > 0) {
                    markdown += `- **Alertes** : ${volAnalysis.alerts.join(', ')}\n`;
                }
                markdown += `- **Signal de marché** : ${volAnalysis.market_signal}\n`;
                markdown += `- **Force du signal** : ${volAnalysis.signal_strength}\n`;
                if (volAnalysis.key_insights.length > 0) {
                    markdown += `- **Insights clés** : ${volAnalysis.key_insights.join(', ')}\n`;
                }
            }
            // Analyse experte
            if (analysis.expert_volatility_analysis) {
                const expert = analysis.expert_volatility_analysis;
                markdown += `\n## 📊 Analyse Expert\n\n`;
                markdown += `- **Tendance VIX** : ${expert.vix_trend}\n`;
                markdown += `- **Régime de volatilité** : ${expert.volatility_regime}\n`;
                markdown += `- **Résumé expert** : ${expert.expert_summary}\n`;
                markdown += `\n### Implications Marché\n\n`;
                markdown += `- **Biais ES Futures** : ${expert.market_implications.es_futures_bias}\n`;
                markdown += `- **Structure du marché** : ${expert.market_implications.market_structure}\n`;
                markdown += `\n### Recommandations Trading\n\n`;
                markdown += `- **Stratégie** : ${expert.trading_recommendations.strategy}\n`;
                markdown += `- **Horizon temporel** : ${expert.trading_recommendations.time_horizon}\n`;
                markdown += `- **Ajustement volatilité** : ${expert.trading_recommendations.volatility_adjustment}\n`;
                markdown += `- **Gestion risque** : ${expert.trading_recommendations.risk_management}\n`;
                markdown += `- **Niveaux cibles VIX** : ${expert.trading_recommendations.target_vix_levels.join(' - ')}\n`;
                if (expert.catalysts.length > 0) {
                    markdown += `\n### Catalyseurs\n\n`;
                    expert.catalysts.forEach((catalyst, i) => {
                        markdown += `${i + 1}. ${catalyst}\n`;
                    });
                }
                if (expert.key_insights.length > 0) {
                    markdown += `\n### Insights Clés\n\n`;
                    expert.key_insights.forEach((insight, i) => {
                        markdown += `${i + 1}. ${insight}\n`;
                    });
                }
            }
            await fs.writeFile(filepath, markdown, 'utf8');
            console.log(`[VixSimpleAgent] ✅ Markdown analysis saved to ${filepath}`);
        }
        catch (error) {
            console.error('[VixSimpleAgent] Error saving markdown:', error);
        }
    }
    determineMarketStatus() {
        return 'Database Analysis Mode - Real-time VIX assessment';
    }
}
exports.VixSimpleAgent = VixSimpleAgent;
