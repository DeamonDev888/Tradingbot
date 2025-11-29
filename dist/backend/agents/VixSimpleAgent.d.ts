export interface VixData {
    timestamp: string;
    symbol: string;
    value: number;
    change: number;
    change_pct: number;
    source: string;
}
export interface VixAnalysisData {
    current_vix_data: {
        consensus_value: number;
        spread: {
            min: number;
            max: number;
            range: number;
        };
        sources: VixData[];
    };
    current_vvix_data?: {
        consensus_value: number;
        change_pct: number;
    };
    intelligent_volatility_analysis: {
        vix_level: string;
        trend: string;
        interpretation_text: string;
        expected_monthly_volatility: number;
        expected_weekly_volatility: number;
        expected_daily_move_range: number;
        volatility_regime: string;
        alerts: string[];
        market_signal: string;
        signal_strength: string;
        key_insights: string[];
    };
    expert_volatility_analysis: {
        vix_trend: string;
        volatility_regime: string;
        expert_summary: string;
        market_implications: {
            es_futures_bias: string;
            market_structure: string;
        };
        trading_recommendations: {
            strategy: string;
            time_horizon: string;
            volatility_adjustment: string;
            risk_management: string;
            target_vix_levels: number[];
        };
        catalysts: string[];
        key_insights: string[];
    };
    metadata: {
        analysis_timestamp: string;
        analysis_type: string;
        vix_sources_count: number;
        vvix_sources_count: number;
    };
    combined_analysis: {
        market_outlook: string;
        key_takeaways: string[];
        actionable_recommendations: string[];
    };
}
export declare class VixSimpleAgent {
    private readonly pool;
    constructor();
    analyzeVixStructure(): Promise<VixAnalysisData | {
        error: string;
    }>;
    private testDatabaseConnection;
    private getVixDataFromDatabase;
    private getVvixDataFromDatabase;
    private performVixAnalysis;
    private determineVolatilityRegime;
    private determineVixTrend;
    private generateKeyInsights;
    private calculateSpread;
    private generateExpertSummary;
    private determineMarketCondition;
    private determineESFuturesBias;
    private determineMarketStructure;
    private determineTradingStrategy;
    private determineTimeHorizon;
    private determineVolatilityAdjustment;
    private determineRiskManagement;
    private calculateTargetLevels;
    private identifyCatalysts;
    private categorizeVixLevel;
    private generateInterpretation;
    private getMarketImplication;
    private calculateExpectedVolatility;
    private generateAlerts;
    private determineMarketSignal;
    private determineSignalStrength;
    private calculateVolatility;
    private generateMarketOutlook;
    private generateActionableRecommendations;
    private saveAnalysisToDatabase;
    private saveAnalysisToMarkdown;
    private determineMarketStatus;
}
//# sourceMappingURL=VixSimpleAgent.d.ts.map