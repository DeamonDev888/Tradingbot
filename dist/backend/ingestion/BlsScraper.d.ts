export interface BlsEvent {
    event_name: string;
    value: string;
    change?: string;
    reference_period: string;
    release_date: string;
}
export declare class BlsScraper {
    private browser;
    private pool;
    constructor();
    init(): Promise<void>;
    close(): Promise<void>;
    private createStealthPage;
    private humanDelay;
    private parseDate;
    scrapeLatestNumbers(): Promise<BlsEvent[]>;
    saveToDatabase(events: BlsEvent[]): Promise<void>;
}
//# sourceMappingURL=BlsScraper.d.ts.map