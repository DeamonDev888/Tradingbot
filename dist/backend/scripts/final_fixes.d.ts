#!/usr/bin/env ts-node
interface FinalFixResult {
    timestamp: Date;
    dataCrisisFixed: boolean;
    agentPerformanceFixed: boolean;
    systemOptimized: boolean;
    finalStats: {
        totalNews: number;
        recentNews24h: number;
        recentNews48h: number;
        avgAgentEfficiency: number;
        bufferUtilization: number;
    };
    success: boolean;
    issues: string[];
    recommendations: string[];
}
declare class FinalFixer {
    private pool;
    constructor();
    testConnection(): Promise<boolean>;
    getCurrentStats(): Promise<{
        totalNews: number;
        recentNews24h: number;
        recentNews48h: number;
        avgAgentEfficiency: number;
        bufferUtilization: number;
    }>;
    executeFinalFixes(): Promise<FinalFixResult>;
    private generateRecommendations;
    formatFixReport(result: FinalFixResult): string;
    close(): Promise<void>;
}
export { FinalFixer };
//# sourceMappingURL=final_fixes.d.ts.map