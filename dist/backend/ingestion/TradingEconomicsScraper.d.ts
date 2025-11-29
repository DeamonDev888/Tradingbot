export interface EconomicEvent {
    date: Date;
    country: string;
    event: string;
    importance: number;
    actual: string;
    forecast: string;
    previous: string;
    currency: string;
    unit?: string;
}
export declare class TradingEconomicsScraper {
    private pool;
    constructor();
    scrapeUSCalendar(): Promise<EconomicEvent[]>;
    saveEvents(events: EconomicEvent[]): Promise<void>;
}
//# sourceMappingURL=TradingEconomicsScraper.d.ts.map