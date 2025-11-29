#!/usr/bin/env ts-node
interface OptimizationReport {
    timestamp: Date;
    current: {
        totalNews: number;
        recentNews24h: number;
        recentNews48h: number;
        bufferUtilization: number;
        avgAgentEfficiency: number;
    };
    target: {
        recentNews24h: number;
        recentNews48h: number;
        bufferUtilization: number;
        avgAgentEfficiency: number;
    };
    optimizations: {
        scraping: {
            frequency: string;
            sources: string[];
            priority: number;
        };
        database: {
            indexing: string[];
            cleanup: string[];
            optimization: string[];
        };
        agents: {
            [agentName: string]: {
                bufferWindow: number;
                caching: boolean;
                optimization: string[];
            };
        };
    };
    actions: {
        immediate: string[];
        shortTerm: string[];
        longTerm: string[];
    };
    impact: {
        dataVolume: string;
        performance: string;
        reliability: string;
    };
}
declare class PipelineOptimizer {
    private pool;
    private dbService;
    private newsAggregator;
    constructor();
    testConnection(): Promise<boolean>;
    analyzeCurrentState(): Promise<OptimizationReport['current']>;
    analyzeAgentPerformance(): Promise<{
        bufferUtilization: number;
        avgAgentEfficiency: number;
        agentStats: {
            [name: string]: {
                itemsUsed: number;
                efficiency: number;
            };
        };
    }>;
    generateOptimizationPlan(): Promise<OptimizationReport>;
    private generateScrapingOptimizations;
    private generateDatabaseOptimizations;
    private generateAgentOptimizations;
    private calculateOptimalBufferWindow;
    private generateAgentOptimizationList;
    private generateActionPlan;
    private calculateImpact;
    formatReport(report: OptimizationReport): string;
    executeImmediateActions(): Promise<{
        success: string[];
        failed: string[];
    }>;
    close(): Promise<void>;
}
export { PipelineOptimizer };
//# sourceMappingURL=optimize_pipeline.d.ts.map