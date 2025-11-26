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
exports.FinnhubClient = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
class FinnhubClient {
    apiKey;
    baseUrl = 'https://finnhub.io/api/v1';
    constructor() {
        this.apiKey = process.env.FINNHUB_API_KEY || '';
        if (!this.apiKey) {
            console.warn('⚠️ FINNHUB_API_KEY is missing. Finnhub data will not be fetched.');
        }
    }
    /**
     * Récupère les news générales du marché
     */
    async fetchMarketNews() {
        if (!this.apiKey)
            return [];
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/news`, {
                params: {
                    category: 'general',
                    token: this.apiKey,
                },
                timeout: 5000,
            });
            return response.data.slice(0, 10); // Top 10 news
        }
        catch (error) {
            console.error('❌ Error fetching Finnhub news:', error instanceof Error ? error.message : error);
            return [];
        }
    }
    /**
     * Récupère le sentiment des news (si disponible dans le plan gratuit)
     * Sinon, on se contente des news brutes
     */
    async fetchNewsSentiment() {
        // Note: L'endpoint sentiment est souvent Premium.
        // On se concentre sur les news brutes pour l'instant.
        return null;
    }
    /**
     * Récupère les données de marché d'un indice ou action en temps réel
     * Utilise l'endpoint /quote pour les données actuelles
     */
    async fetchQuote(symbol) {
        if (!this.apiKey)
            return null;
        try {
            console.log(`[Finnhub] Récupération des données pour ${symbol}...`);
            const response = await axios_1.default.get(`${this.baseUrl}/quote`, {
                params: {
                    symbol: symbol,
                    token: this.apiKey,
                },
                timeout: 5000,
            });
            const data = response.data;
            if (data.c === null || data.c === undefined) {
                console.warn(`[Finnhub] Pas de données valides pour ${symbol}`);
                return null;
            }
            // Récupérer aussi les métadonnées de base
            await axios_1.default
                .get(`${this.baseUrl}/stock/profile2`, {
                params: {
                    symbol: symbol,
                    token: this.apiKey,
                },
                timeout: 3000,
            })
                .catch(() => ({ data: { name: symbol } }));
            const stockData = {
                current: data.c, // Current price
                change: data.d, // Change
                percent_change: data.dp, // Percent change
                high: data.h, // High price of the day
                low: data.l, // Low price of the day
                open: data.o, // Open price of the day
                previous_close: data.pc, // Previous close price
                timestamp: data.t || Math.floor(Date.now() / 1000), // Timestamp
                symbol: symbol,
            };
            console.log(`[Finnhub] ✅ Données récupérées pour ${symbol}: ${stockData.current} (${stockData.change > 0 ? '+' : ''}${stockData.percent_change}%)`);
            return stockData;
        }
        catch (error) {
            console.error(`❌ [Finnhub] Erreur lors de la récupération des données pour ${symbol}:`, error instanceof Error ? error.message : error);
            return null;
        }
    }
    /**
     * Récupère spécifiquement les données du S&P 500
     * Utilise SPY et convertit en ES Futures de manière fiable
     */
    async fetchSP500Data() {
        console.log(`[Finnhub] 🔄 Récupération des données S&P 500 via SPY...`);
        try {
            // Utiliser SPY directement (le plus fiable sur Finnhub)
            const spyData = await this.fetchQuote('SPY');
            if (spyData) {
                // Conversion SPY -> ES Futures (ratio standard: 1 ES = 10 SPY environ)
                const multiplier = 10.0; // Ratio plus précis ES/SPY
                const esData = {
                    ...spyData,
                    current: Math.round(spyData.current * multiplier * 100) / 100,
                    high: Math.round(spyData.high * multiplier * 100) / 100,
                    low: Math.round(spyData.low * multiplier * 100) / 100,
                    open: Math.round(spyData.open * multiplier * 100) / 100,
                    previous_close: Math.round(spyData.previous_close * multiplier * 100) / 100,
                    change: Math.round(spyData.change * multiplier * 100) / 100,
                    symbol: 'ES_CONVERTED',
                };
                console.log(`[Finnhub] ✅ ES Futures (convertis): ${esData.current.toFixed(2)} (${esData.change > 0 ? '+' : ''}${esData.percent_change.toFixed(2)}%)`);
                return esData;
            }
        }
        catch (error) {
            console.error(`[Finnhub] ❌ Erreur récupération SPY:`, error);
        }
        // Fallback: utiliser un proxy d'un autre indice si SPY échoue
        console.warn(`[Finnhub] ⚠️ SPY indisponible, tentative avec QQQ...`);
        try {
            const qqqData = await this.fetchQuote('QQQ');
            if (qqqData) {
                // Conversion QQQ -> ES (approximation)
                const multiplier = 12.0; // QQQ est plus petit que SPY
                const esData = {
                    ...qqqData,
                    current: Math.round(qqqData.current * multiplier * 100) / 100,
                    high: Math.round(qqqData.high * multiplier * 100) / 100,
                    low: Math.round(qqqData.low * multiplier * 100) / 100,
                    open: Math.round(qqqData.open * multiplier * 100) / 100,
                    previous_close: Math.round(qqqData.previous_close * multiplier * 100) / 100,
                    change: Math.round(qqqData.change * multiplier * 100) / 100,
                    symbol: 'ES_FROM_QQQ',
                };
                console.log(`[Finnhub] ⚡ ES Futures (via QQQ): ${esData.current.toFixed(2)} (${esData.change > 0 ? '+' : ''}${esData.percent_change.toFixed(2)}%)`);
                return esData;
            }
        }
        catch (error) {
            console.error(`[Finnhub] ❌ Erreur récupération QQQ:`, error);
        }
        console.error(`[Finnhub] ❌ Impossible de récupérer les données S&P 500`);
        return null;
    }
    /**
     * Récupère les données de plusieurs indices populaires en parallèle
     * Utilise les ETFs des indices car plus fiables que les indices bruts
     */
    async fetchMultipleIndices(symbols = ['SPY', 'QQQ', 'DIA']) {
        if (!this.apiKey)
            return [];
        console.log(`[Finnhub] Récupération parallèle des indices: ${symbols.join(', ')}`);
        const promises = symbols.map(symbol => this.fetchQuote(symbol));
        const results = await Promise.all(promises);
        const validResults = results.filter((item) => item !== null);
        console.log(`[Finnhub] ${validResults.length}/${symbols.length} indices récupérés avec succès`);
        return validResults;
    }
    /**
     * Récupère les données des principaux indices boursiers avec des noms explicites
     */
    async fetchMajorIndices() {
        const indicesMapping = [
            { name: 'S&P 500', symbol: 'SPY' },
            { name: 'NASDAQ', symbol: 'QQQ' },
            { name: 'Dow Jones', symbol: 'DIA' },
        ];
        const results = await this.fetchMultipleIndices(indicesMapping.map(i => i.symbol));
        return results.map((data, index) => ({
            name: indicesMapping[index].name,
            data: data,
        }));
    }
}
exports.FinnhubClient = FinnhubClient;
