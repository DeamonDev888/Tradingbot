"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FredClient = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
class FredClient {
    constructor() {
        this.baseUrl = 'https://api.stlouisfed.org/fred/series/observations';
        // Mapping des séries FRED vers des noms lisibles
        // IDs officiels FRED: https://fred.stlouisfed.org/tags/series
        this.seriesMap = {
            CPIAUCSL: 'US CPI (Inflation)',
            UNRATE: 'US Unemployment Rate',
            FEDFUNDS: 'Federal Funds Rate',
            GDP: 'US GDP',
            DGS2: '2-Year Treasury Yield',
            DGS5: '5-Year Treasury Yield',
            DGS10: '10-Year Treasury Yield',
            DGS30: '30-Year Treasury Yield',
            T10Y2Y: '10Y-2Y Treasury Yield Spread', // Indicateur de récession
            T10Y3M: '10Y-3M Treasury Yield Spread', // Autre indicateur clé
            // 'VIXCLS': 'CBOE Volatility Index (VIX)', // [SUPPRIMÉ PAR L'UTILISATEUR]
            WALCL: 'Fed Balance Sheet (Liquidity)',
            BAMLH0A0HYM2: 'High Yield Credit Spread',
        };
        this.apiKey = process.env.FRED_API_KEY || '';
        if (!this.apiKey) {
            console.warn('⚠️ FRED_API_KEY is missing in .env file. FRED data will not be fetched.');
        }
    }
    /**
     * Récupère les dernières données pour une série spécifique
     */
    async fetchSeriesObservation(seriesId) {
        if (!this.apiKey)
            return null;
        try {
            const response = await axios_1.default.get(this.baseUrl, {
                params: {
                    series_id: seriesId,
                    api_key: this.apiKey,
                    file_type: 'json',
                    limit: 1,
                    sort_order: 'desc',
                },
            });
            const observations = response.data.observations;
            if (observations && observations.length > 0) {
                const obs = observations[0];
                return {
                    id: seriesId,
                    title: this.seriesMap[seriesId] || seriesId,
                    value: parseFloat(obs.value),
                    date: obs.date,
                };
            }
            return null;
        }
        catch (error) {
            console.error(`❌ Error fetching FRED series ${seriesId}:`, error instanceof Error ? error.message : error);
            return null;
        }
    }
    /**
     * Récupère toutes les séries configurées
     */
    async fetchAllKeyIndicators() {
        if (!this.apiKey)
            return [];
        const seriesIds = Object.keys(this.seriesMap);
        const promises = seriesIds.map(id => this.fetchSeriesObservation(id));
        const results = await Promise.all(promises);
        return results.filter((item) => item !== null);
    }
}
exports.FredClient = FredClient;
