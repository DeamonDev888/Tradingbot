export interface FredSeriesData {
    id: string;
    title: string;
    value: number;
    date: string;
    unit?: string;
}
export declare class FredClient {
    private apiKey;
    private baseUrl;
    private seriesMap;
    constructor();
    /**
     * Récupère les dernières données pour une série spécifique
     */
    fetchSeriesObservation(seriesId: string): Promise<FredSeriesData | null>;
    /**
     * Récupère toutes les séries configurées
     */
    fetchAllKeyIndicators(): Promise<FredSeriesData[]>;
}
//# sourceMappingURL=FredClient.d.ts.map