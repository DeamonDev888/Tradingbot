interface VIXData {
    symbol: string;
    lastPrice: number;
    change: number;
    changePercent: number;
    timestamp: Date;
    source: string;
}
declare class VIXDatabaseIntegration {
    private vixData;
    constructor();
    private initializeDatabase;
    private collectVIXData;
    private storeVIXData;
    private getLatestVIXData;
    start(): Promise<void>;
    stop(): Promise<void>;
}
export { VIXDatabaseIntegration, VIXData };
//# sourceMappingURL=vix_database_integration.d.ts.map