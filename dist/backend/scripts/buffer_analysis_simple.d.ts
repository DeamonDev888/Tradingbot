#!/usr/bin/env ts-node
interface SimpleBufferReport {
    timestamp: Date;
    database: {
        connected: boolean;
        totalNews: number;
        recentNews24h: number;
        recentNews48h: number;
        recentNews7d: number;
        avgQueryTime: number;
        bufferSize: number;
    };
    agents: {
        [agentName: string]: {
            newsItemsUsed: number;
            queryTime: number;
            source: string;
            efficiency: number;
        };
    };
    recommendations: string[];
}
declare class SimpleBufferAnalyzer {
    private pool;
    private dbService;
    constructor();
    testConnection(): Promise<boolean>;
    analyzeDatabaseBuffer(): Promise<{
        totalNews: number;
        recentNews24h: number;
        recentNews48h: number;
        recentNews7d: number;
        avgQueryTime: number;
        bufferSize: number;
    }>;
    analyzeAgentBufferUsage(agentName: string, agent: any): Promise<{
        newsItemsUsed: number;
        queryTime: number;
        source: string;
        efficiency: number;
    }>;
    generateReport(): Promise<SimpleBufferReport>;
    private generateRecommendations;
    formatReport(report: SimpleBufferReport): string;
    close(): Promise<void>;
}
export { SimpleBufferAnalyzer };
//# sourceMappingURL=buffer_analysis_simple.d.ts.map