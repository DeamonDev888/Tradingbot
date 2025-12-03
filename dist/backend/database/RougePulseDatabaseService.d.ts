export interface RougePulseAnalysis {
    id?: string;
    analysis_date: Date;
    volatility_score: number;
    critical_count: number;
    high_count: number;
    medium_count: number;
    low_count: number;
    critical_alerts: any[];
    market_movers: any[];
    critical_events: any[];
    high_impact_events: any[];
    medium_impact_events: any[];
    low_impact_events: any[];
    next_24h_alerts: any[];
    summary: string;
    upcoming_schedule?: any;
    data_source: string;
    status: string;
}
export declare class RougePulseDatabaseService {
    private pool;
    constructor();
    testConnection(): Promise<boolean>;
    saveAnalysis(analysis: RougePulseAnalysis): Promise<string | null>;
    getLatestAnalysis(): Promise<RougePulseAnalysis | null>;
    getAnalysisById(id: string): Promise<RougePulseAnalysis | null>;
    getRecentAnalyses(daysBack?: number): Promise<RougePulseAnalysis[]>;
    getEconomicEvents(startDate: Date, endDate: Date): Promise<any[]>;
    close(): Promise<void>;
}
//# sourceMappingURL=RougePulseDatabaseService.d.ts.map