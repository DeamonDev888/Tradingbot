import axios from 'axios';
import * as dotenv from 'dotenv';
import { SP500FuturesScraper, SP500FuturesData } from './SP500FuturesScraper';

dotenv.config();

export interface FinnhubNews {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

export interface StockData {
  current: number;
  change: number;
  percent_change: number;
  high: number;
  low: number;
  open: number;
  previous_close: number;
  timestamp: number;
  symbol: string;
}

export class FinnhubClient {
  private apiKey: string;
  private baseUrl = 'https://finnhub.io/api/v1';
  private futuresScraper: SP500FuturesScraper;

  constructor() {
    this.apiKey = process.env.FINNHUB_API_KEY || '';
    this.futuresScraper = new SP500FuturesScraper();
    if (!this.apiKey) {
      console.warn('⚠️ FINNHUB_API_KEY is missing. Finnhub data will not be fetched.');
    }
  }

  /**
   * Récupère les news générales du marché
   */
  async fetchMarketNews(): Promise<FinnhubNews[]> {
    if (!this.apiKey) return [];

    try {
      const response = await axios.get(`${this.baseUrl}/news`, {
        params: {
          category: 'general',
          token: this.apiKey,
        },
        timeout: 5000,
      });

      return response.data.slice(0, 10); // Top 10 news
    } catch (error) {
      console.error(
        '❌ Error fetching Finnhub news:',
        error instanceof Error ? error.message : error
      );
      return [];
    }
  }

  /**
   * Récupère le sentiment des news (si disponible dans le plan gratuit)
   * Sinon, on se contente des news brutes
   */
  async fetchNewsSentiment(): Promise<any> {
    // Note: L'endpoint sentiment est souvent Premium.
    // On se concentre sur les news brutes pour l'instant.
    return null;
  }

  /**
   * Récupère les données de marché d'un indice ou action en temps réel
   * Utilise l'endpoint /quote pour les données actuelles
   */
  async fetchQuote(symbol: string): Promise<StockData | null> {
    if (!this.apiKey) return null;

    try {
      console.log(`[Finnhub] Récupération des données pour ${symbol}...`);
      const response = await axios.get(`${this.baseUrl}/quote`, {
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
      await axios
        .get(`${this.baseUrl}/stock/profile2`, {
          params: {
            symbol: symbol,
            token: this.apiKey,
          },
          timeout: 3000,
        })
        .catch(() => ({ data: { name: symbol } }));

      const stockData: StockData = {
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

      console.log(
        `[Finnhub] ✅ Données récupérées pour ${symbol}: ${stockData.current} (${stockData.change > 0 ? '+' : ''}${stockData.percent_change}%)`
      );
      return stockData;
    } catch (error) {
      console.error(
        `❌ [Finnhub] Erreur lors de la récupération des données pour ${symbol}:`,
        error instanceof Error ? error.message : error
      );
      return null;
    }
  }

  
  /**
   * Récupère spécifiquement les données du contrat future ES (E-mini S&P 500)
   * Méthode améliorée avec scraping prioritaire pour obtenir le vrai prix du contrat future S&P500
   */
  async fetchESFutures(): Promise<StockData | null> {
    console.log(`[Finnhub] 🔄 Récupération ES Futures (S&P500) - Sources multiples...`);

    // PRIORITÉ 1: Scraper des vrais contrats futures avec niveaux ZeroHedge (plus fiable)
    try {
      console.log(`[Finnhub] 1️⃣ Tentative scraping direct des futures avec niveaux ZeroHedge...`);
      const futuresData = await this.futuresScraper.fetchSP500FuturesWithZeroHedge();

      if (futuresData && futuresData.current && futuresData.current > 1000) {
        console.log(
          `[Finnhub] ✅ ES Futures via scraping (${futuresData.source}): ${futuresData.current.toFixed(2)} (${(futuresData.change || 0) > 0 ? '+' : ''}${(futuresData.percent_change || 0).toFixed(2)}%)`
        );

        // Afficher les niveaux techniques si disponibles
        if (futuresData.zero_hedge_analysis) {
          console.log(`[Finnhub] 📊 Niveaux ZeroHedge:`);
          if (futuresData.support_levels && futuresData.support_levels.length > 0) {
            console.log(`[Finnhub]   Supports: [${futuresData.support_levels.slice(0, 5).join(', ')}${futuresData.support_levels.length > 5 ? '...' : ''}]`);
          }
          if (futuresData.resistance_levels && futuresData.resistance_levels.length > 0) {
            console.log(`[Finnhub]   Résistances: [${futuresData.resistance_levels.slice(0, 5).join(', ')}${futuresData.resistance_levels.length > 5 ? '...' : ''}]`);
          }
          console.log(`[Finnhub]   Sentiment ZeroHedge: ${futuresData.zero_hedge_analysis.sentiment}`);
          if (futuresData.zero_hedge_analysis.key_messages.length > 0) {
            console.log(`[Finnhub]   Messages clés: ${futuresData.zero_hedge_analysis.key_messages.slice(0, 2).join(' | ')}`);
          }
        }

        return {
          current: futuresData.current,
          change: futuresData.change || 0,
          percent_change: futuresData.percent_change || 0,
          high: futuresData.high || futuresData.current,
          low: futuresData.low || futuresData.current,
          open: futuresData.open || futuresData.current,
          previous_close: futuresData.previous_close || futuresData.current,
          timestamp: Math.floor(Date.now() / 1000),
          symbol: `ES_${futuresData.source.replace(/\s+/g, '_')}`,
        };
      }
    } catch (error) {
      console.log(`[Finnhub] Échec scraping futures:`, error instanceof Error ? error.message : error);
    }

    // PRIORITÉ 1B: Scraper des vrais contrats futures (sans ZeroHedge)
    try {
      console.log(`[Finnhub] 1️⃣B Tentative scraping direct des futures (sans ZeroHedge)...`);
      const futuresData = await this.futuresScraper.fetchSP500Futures();

      if (futuresData && futuresData.current && futuresData.current > 1000) {
        console.log(
          `[Finnhub] ✅ ES Futures via scraping (${futuresData.source}): ${futuresData.current.toFixed(2)} (${(futuresData.change || 0) > 0 ? '+' : ''}${(futuresData.percent_change || 0).toFixed(2)}%)`
        );

        return {
          current: futuresData.current,
          change: futuresData.change || 0,
          percent_change: futuresData.percent_change || 0,
          high: futuresData.high || futuresData.current,
          low: futuresData.low || futuresData.current,
          open: futuresData.open || futuresData.current,
          previous_close: futuresData.previous_close || futuresData.current,
          timestamp: Math.floor(Date.now() / 1000),
          symbol: `ES_${futuresData.source.replace(/\s+/g, '_')}`,
        };
      }
    } catch (error) {
      console.log(`[Finnhub] Échec scraping futures backup:`, error instanceof Error ? error.message : error);
    }

    // PRIORITÉ 2: API Finnhub avec symboles futures
    console.log(`[Finnhub] 2️⃣ Tentative API Finnhub avec symboles futures...`);
    const futureSymbols = [
      'ES=F',      // Yahoo Finance format
      'ES1!',      // Interactive Brokers format
      '@ES.1',     // TD Ameritrade format
      'E-mini S&P 500', // Descriptif
    ];

    for (const symbol of futureSymbols) {
      try {
        console.log(`[Finnhub] Tentative API avec symbole: ${symbol}`);
        const data = await this.fetchQuote(symbol);

        if (data && data.current && data.current > 0) {
          // Vérifier si le prix semble correct pour les ES Futures (généralement > 4000)
          if (data.current > 1000) { // Les ES futures sont autour de 4000-5000
            console.log(
              `[Finnhub] ✅ ES Futures réussi via API ${symbol}: ${data.current.toFixed(2)} (${data.change > 0 ? '+' : ''}${data.percent_change.toFixed(2)}%)`
            );
            return {
              ...data,
              symbol: 'ES_FUTURES_API',
            };
          } else {
            console.log(`[Finnhub] ⚠️ Prix incorrect pour ${symbol}: ${data.current} (trop bas pour ES Futures)`);
          }
        }
      } catch (error) {
        console.log(`[Finnhub] Échec API avec ${symbol}:`, error instanceof Error ? error.message : error);
        continue;
      }
    }

    console.log(`[Finnhub] ❌ Toutes les sources ES Futures ont échoué`);
    return null;
  }

  /**
   * Récupère spécifiquement les données du S&P 500
   * Version corrigée qui essaie d'abord les vrais contrats futures
   */
  async fetchSP500Data(): Promise<StockData | null> {
    console.log(`[Finnhub] 🔄 Récupération des données S&P 500 (priorité Futures)...`);

    try {
      // PRIORITÉ 1: Essayer les vrais contrats futures ES
      const esData = await this.fetchESFutures();
      if (esData) {
        return esData;
      }

      console.log(`[Finnhub] ⚠️ ES Futures indisponible, fallback vers SPY ETF...`);

      // PRIORITÉ 2: Utiliser SPY ETF comme fallback (ancienne méthode)
      const spyData = await this.fetchQuote('SPY');
      if (spyData) {
        // Conversion SPY -> ES Futures (ratio plus précis basé sur le prix actuel)
        const estimatedESPrice = spyData.current * 10.0; // Approximation

        const esData = {
          ...spyData,
          current: Math.round(estimatedESPrice * 100) / 100,
          high: Math.round(spyData.high * 10.0 * 100) / 100,
          low: Math.round(spyData.low * 10.0 * 100) / 100,
          open: Math.round(spyData.open * 10.0 * 100) / 100,
          previous_close: Math.round(spyData.previous_close * 10.0 * 100) / 100,
          change: Math.round(spyData.change * 10.0 * 100) / 100,
          symbol: 'ES_FROM_SPY',
        };

        console.log(
          `[Finnhub] ⚡ ES Futures (estimé via SPY): ${esData.current.toFixed(2)} (${esData.change > 0 ? '+' : ''}${esData.percent_change.toFixed(2)}%)`
        );
        return esData;
      }
    } catch (error) {
      console.error(`[Finnhub] Erreur récupération S&P 500:`, error);
    }

    // PRIORITÉ 3: Dernier fallback avec QQQ si SPY échoue
    console.warn(`[Finnhub] ⚠️ SPY indisponible, tentative finale avec QQQ...`);
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

        console.log(
          `[Finnhub] 🔥 ES Futures (via QQQ fallback): ${esData.current.toFixed(2)} (${esData.change > 0 ? '+' : ''}${esData.percent_change.toFixed(2)}%)`
        );
        return esData;
      }
    } catch (error) {
      console.error(`[Finnhub] Erreur récupération QQQ:`, error);
    }

    console.error(`[Finnhub] ❌ Impossible de récupérer les données S&P 500 avec toutes les méthodes`);
    return null;
  }

  /**
   * Récupère les données de plusieurs indices populaires en parallèle
   * Utilise les ETFs des indices car plus fiables que les indices bruts
   */
  async fetchMultipleIndices(symbols: string[] = ['SPY', 'QQQ', 'DIA']): Promise<StockData[]> {
    if (!this.apiKey) return [];

    console.log(`[Finnhub] Récupération parallèle des indices: ${symbols.join(', ')}`);

    const promises = symbols.map(symbol => this.fetchQuote(symbol));
    const results = await Promise.all(promises);

    const validResults = results.filter((item): item is StockData => item !== null);
    console.log(`[Finnhub] ${validResults.length}/${symbols.length} indices récupérés avec succès`);

    return validResults;
  }

  /**
   * Récupère les données des principaux indices boursiers avec des noms explicites
   */
  async fetchMajorIndices(): Promise<{ name: string; data: StockData }[]> {
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
