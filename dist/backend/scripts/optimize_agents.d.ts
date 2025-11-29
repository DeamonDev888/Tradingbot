#!/usr/bin/env ts-node
interface AgentOptimizationResult {
    timestamp: Date;
    agents: {
        [agentName: string]: {
            beforeOptimization: {
                newsItemsUsed: number;
                queryTime: number;
                efficiency: number;
                source: string;
            };
            afterOptimization: {
                newsItemsUsed: number;
                queryTime: number;
                efficiency: number;
                source: string;
            };
            improvements: string[];
            issues: string[];
        };
    };
    systemWide: {
        bufferUtilization: number;
        avgEfficiency: number;
        dataFreshness: number;
        success: boolean;
    };
    recommendations: string[];
}
declare class AgentOptimizer {
    private dbService;
    private newsAggregator;
    constructor();
    testConnection(): Promise<boolean>;
    getCurrentSystemStats(): Promise<{
        totalNews: number;
        recentNews24h: number;
        recentNews48h: number;
        avgQueryTime: number;
    }>;
    analyzeAgentPerformance(agentName: string, agent: any): Promise<{
        newsItemsUsed: number;
        queryTime: number;
        efficiency: number;
        source: string;
        issues: string[];
    }>;
    optimizeVortexAgent(): Promise<{
        before: {
            newsItemsUsed: number;
            queryTime: number;
            efficiency: number;
            source: string;
        };
        after: {
            newsItemsUsed: number;
            queryTime: number;
            efficiency: number;
            source: string;
        };
        improvements: string[];
        issues: string[];
    }>;
    createOptimizedRougePulseAgent(): Promise<{
        newsItemsUsed: number;
        queryTime: number;
        efficiency: number;
        source: string;
        issues: string[];
    }>;
    implementSystemOptimizations(): Promise<string[]>;
    executeOptimizationPlan(): Promise<AgentOptimizationResult>;
    private generateRecommendations;
    formatOptimizationReport(result: AgentOptimizationResult): string;
    close(): Promise<void>;
}
export { AgentOptimizer };
//# sourceMappingURL=optimize_agents.d.ts.map