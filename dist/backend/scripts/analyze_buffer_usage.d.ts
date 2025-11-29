#!/usr/bin/env ts-node
interface BufferUsageReport {
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
            bufferTimeWindow: number;
            newsItemsUsed: number;
            queryTime: number;
            cacheHit: boolean;
            source: 'database_cache' | 'database_fresh' | 'no_data';
            efficiency: number;
        };
    };
    analysis: {
        overallEfficiency: number;
        bufferUtilization: number;
        recommendations: string[];
        bottlenecks: string[];
    };
}
export declare class BufferUsageAnalyzer {
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
        bufferTimeWindow: number;
        newsItemsUsed: number;
        queryTime: number;
        cacheHit: boolean;
        source: 'database_cache' | 'database_fresh' | 'no_data';
        efficiency: number;
    }>;
    private extractBufferTimeWindow;
    generateReport(): Promise<BufferUsageReport>;
    private analyzeOverallEfficiency;
    private generateRecommendations;
    private identifyBottlenecks;
    formatReport(report: BufferUsageReport): string;
    close(): Promise<void>;
}
export {};
//# sourceMappingURL=analyze_buffer_usage.d.ts.map