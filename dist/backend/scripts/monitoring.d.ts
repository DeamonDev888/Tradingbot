#!/usr/bin/env ts-node
interface MonitoringMetrics {
    timestamp: Date;
    database: {
        connected: boolean;
        totalNews: number;
        recentNews24h: number;
        recentNews7d: number;
        duplicates: number;
        qualityIssues: number;
    };
    performance: {
        avgQueryTime: number;
        slowQueries: number;
        connectionPoolActive: number;
        connectionPoolIdle: number;
    };
    alerts: {
        critical: string[];
        warnings: string[];
        info: string[];
    };
    health: {
        score: number;
        status: 'healthy' | 'warning' | 'critical';
        issues: string[];
    };
}
interface AlertRule {
    name: string;
    condition: (metrics: MonitoringMetrics) => boolean;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    enabled: boolean;
}
export declare class MonitoringService {
    private pool;
    private logFile;
    private metricsHistory;
    private maxHistorySize;
    constructor();
    testConnection(): Promise<boolean>;
    private alertRules;
    collectMetrics(): Promise<MonitoringMetrics>;
    private evaluateAlerts;
    private calculateHealthScore;
    logToFile(metrics: MonitoringMetrics): Promise<void>;
    formatMetricsReport(metrics: MonitoringMetrics): string;
    getMetricsHistory(minutes?: number): MonitoringMetrics[];
    startContinuousMonitoring(intervalMinutes?: number): Promise<void>;
    close(): Promise<void>;
}
export { MonitoringMetrics, AlertRule };
//# sourceMappingURL=monitoring.d.ts.map