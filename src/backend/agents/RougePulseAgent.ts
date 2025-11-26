import { BaseAgentSimple } from './BaseAgentSimple';
import { Pool } from 'pg';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { FinnhubClient, StockData } from '../ingestion/FinnhubClient';

dotenv.config();

export interface TechnicalLevels {
  supports: Array<{ level: number; strength: 'faible' | 'moyen' | 'fort'; edge_score: number; source: string }>;
  resistances: Array<{ level: number; strength: 'faible' | 'moyen' | 'fort'; edge_score: number; source: string }>;
  current_price: number;
  daily_range: { high: number; low: number };
  round_levels: Array<{ level: number; type: 'psychological'; significance: string }>;
  pivot_points: { p: number; r1: number; r2: number; s1: number; s2: number };
  fibonacci_levels: Array<{ level: number; type: 'retracement'; percent: string }>;
}

export class RougePulseAgent extends BaseAgentSimple {
  private readonly execAsync: (
    command: string,
    options?: Record<string, unknown>
  ) => Promise<{ stdout: string; stderr: string }>;
  private readonly pool: Pool;
  private readonly finnhubClient: FinnhubClient;

  constructor() {
    super('rouge-pulse-agent');
    this.execAsync = promisify(exec);
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'financial_analyst',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '9022',
    });
    this.finnhubClient = new FinnhubClient();
  }

  async analyzeEconomicEvents(): Promise<Record<string, unknown> | { error: string }> {
    console.log(`[${this.agentName}] 🔍 Starting Enhanced Economic Calendar Analysis...`);

    try {
      // 0. Récupérer les prix temps réel du S&P 500
      console.log(`[${this.agentName}] 📈 Récupération des données S&P 500 en temps réel...`);
      const sp500Data = await this.finnhubClient.fetchSP500Data();

      if (!sp500Data) {
        console.warn(`[${this.agentName}] ⚠️ Impossible de récupérer les données S&P 500`);
      } else {
        console.log(`[${this.agentName}] ✅ S&P 500: ${sp500Data.current.toFixed(2)} (${sp500Data.percent_change > 0 ? '+' : ''}${sp500Data.percent_change.toFixed(2)}%)`);
      }

      // 1. Fetch Data from Database
      const events = await this.getUpcomingAndRecentEvents();

      if (events.length === 0) {
        console.log(`[${this.agentName}] No relevant economic events found.`);
        return { message: 'No significant events found.' };
      }

      console.log(`[${this.agentName}] Retrieved ${events.length} events for analysis.`);

      // 1b. Fetch News Context (ZeroHedge/FinancialJuice)
      const news = await this.getRecentNewsHeadlines();
      const newsContext = news.map(n => `- ${n.source}: ${n.title}`).join('\n');

      // 1c. Analyser les niveaux techniques depuis les news et données
      const technicalLevels = await this.analyzeTechnicalLevels(sp500Data || undefined, news);

      // 2. Prepare Enhanced Prompt with Technical Data
      const prompt = this.createEnhancedAnalysisPrompt(events, newsContext, technicalLevels, sp500Data || undefined);

      // 3. Analyze with KiloCode
      const aiAnalysis = await this.tryKiloCodeWithFile(prompt);

      if (!aiAnalysis) {
        return { error: 'AI Analysis failed.' };
      }

      // 4. Save Analysis to Database with Technical Data
      await this.saveAnalysisToDatabase(aiAnalysis, technicalLevels);

      console.log(`[${this.agentName}] 🎉 Enhanced analysis completed and saved successfully.`);

      return {
        events_analyzed: events.length,
        analysis: aiAnalysis,
        technical_levels: technicalLevels,
        sp500_data: sp500Data,
      };
    } catch (error) {
      console.error(`[${this.agentName}] Analysis failed:`, error);
      return {
        error: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private async saveAnalysisToDatabase(analysis: any, technicalLevels?: TechnicalLevels): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Sauvegarder l'analyse principale
      await client.query(
        `
              INSERT INTO rouge_pulse_analyses
              (impact_score, market_narrative, high_impact_events, asset_analysis, trading_recommendation, raw_analysis, sp500_price, technical_levels, created_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
          `,
        [
          analysis.impact_score,
          analysis.market_narrative,
          JSON.stringify(analysis.high_impact_events),
          JSON.stringify(analysis.asset_analysis),
          analysis.trading_recommendation,
          JSON.stringify(analysis),
          technicalLevels?.current_price || null,
          JSON.stringify(technicalLevels || {}),
        ]
      );

      console.log(`[${this.agentName}] 💾 Analysis saved to database with technical levels`);
    } catch (e) {
      console.error(`[${this.agentName}] Failed to save analysis to DB:`, e);
    } finally {
      client.release();
    }
  }

  private async analyzeTechnicalLevels(sp500Data?: StockData, news: any[] = []): Promise<TechnicalLevels> {
    console.log(`[${this.agentName}] 📊 Analyse des niveaux techniques...`);

    if (!sp500Data) {
      // Données par défaut si pas de prix
      return {
        supports: [],
        resistances: [],
        current_price: 0,
        daily_range: { high: 0, low: 0 },
        round_levels: [],
        pivot_points: { p: 0, r1: 0, r2: 0, s1: 0, s2: 0 },
        fibonacci_levels: [],
      };
    }

    const currentPrice = sp500Data.current;
    const levels: TechnicalLevels = {
      supports: [],
      resistances: [],
      current_price: currentPrice,
      daily_range: { high: sp500Data.high, low: sp500Data.low },
      round_levels: [],
      pivot_points: { p: 0, r1: 0, r2: 0, s1: 0, s2: 0 },
      fibonacci_levels: [],
    };

    // 1. Niveaux psychologiques ronds (tous les 50 points)
    for (let level = Math.floor(currentPrice / 50) * 50 - 200; level <= Math.floor(currentPrice / 50) * 50 + 200; level += 50) {
      levels.round_levels.push({
        level: level,
        type: 'psychological',
        significance: this.getPsychologicalSignificance(level, currentPrice),
      });
    }

    // 2. Extraire les niveaux des news
    const newsLevels = await this.extractLevelsFromNews(news, currentPrice);

    // 3. Fusionner et scorer les niveaux
    levels.supports = newsLevels.filter(l => l.level < currentPrice && l.type === 'support');
    levels.resistances = newsLevels.filter(l => l.level > currentPrice && l.type === 'resistance');

    // 4. Ajouter les niveaux techniques basiques
    this.addBasicTechnicalLevels(levels, sp500Data);

    // 5. Calculer les Points Pivots
    levels.pivot_points = this.calculatePivotPoints(sp500Data);
    this.addPivotLevels(levels, levels.pivot_points);

    // 6. Calculer les niveaux de Fibonacci
    levels.fibonacci_levels = this.calculateFibonacciLevels(sp500Data);
    this.addFibonacciLevels(levels, levels.fibonacci_levels);

    console.log(`[${this.agentName}] 📈 Niveaux trouvés: ${levels.supports.length} supports, ${levels.resistances.length} résistances`);

    return levels;
  }

  private getPsychologicalSignificance(level: number, currentPrice: number): string {
    const distance = Math.abs(level - currentPrice) / currentPrice * 100;

    if (distance < 1) return 'Niveau psychologique actuel';
    if (distance < 3) return 'Zone psychologique proche';
    if (distance < 5) return 'Niveau psychologique notable';
    if (level % 100 === 0) return 'Niveau psychologique majeur';
    return 'Niveau psychologique secondaire';
  }

  private async extractLevelsFromNews(news: any[], currentPrice: number): Promise<any[]> {
    const levels: any[] = [];

    for (const newsItem of news) {
      const text = (newsItem.title || '').toLowerCase();

      // Chercher les mentions de niveaux de prix
      const pricePatterns = [
        /(\d{4,5})\s*support/gi,
        /support\s*(\d{4,5})/gi,
        /(\d{4,5})\s*résistance/gi,
        /résistance\s*(\d{4,5})/gi,
        /(\d{4,5})\s*resistance/gi,
        /resistance\s*(\d{4,5})/gi,
        /cible\s*(\d{4,5})/gi,
        /(\d{4,5})\s*cible/gi,
        /(\d{4,5})\s*level/gi,
        /level\s*(\d{4,5})/gi,
      ];

      pricePatterns.forEach(pattern => {
        const matches = [...text.matchAll(pattern)];
        matches.forEach(match => {
          const level = parseInt(match[1]);
          if (level >= currentPrice * 0.8 && level <= currentPrice * 1.2) { // +/- 20% du prix actuel
            const type = match[0].toLowerCase().includes('support') ? 'support' : 'resistance';

            levels.push({
              level: level,
              type: type,
              source: newsItem.source,
              strength: this.calculateStrengthFromText(text, level, currentPrice),
              edge_score: this.calculateEdgeScore(text, type, currentPrice),
              reason: `Extrait de: ${newsItem.title.substring(0, 100)}...`,
            });
          }
        });
      });
    }

    return levels;
  }

  private calculateStrengthFromText(text: string, level: number, currentPrice: number): 'faible' | 'moyen' | 'fort' {
    const strongIndicators = ['strong', 'major', 'critical', 'key', 'important', 'majeur', 'critique', 'fort', 'important'];
    const weakIndicators = ['minor', 'small', 'weak', 'faible', 'mineur'];

    const textLower = text.toLowerCase();

    if (strongIndicators.some(indicator => textLower.includes(indicator))) return 'fort';
    if (weakIndicators.some(indicator => textLower.includes(indicator))) return 'faible';

    // Basé sur la proximité du prix actuel
    const distance = Math.abs(level - currentPrice) / currentPrice * 100;
    if (distance < 2) return 'fort';
    if (distance < 5) return 'moyen';
    return 'faible';
  }

  private calculateEdgeScore(text: string, type: string, currentPrice: number): number {
    let score = 50; // Score de base

    // Bonus si multiple mentions
    const supportMentions = (text.match(/support/gi) || []).length;
    const resistanceMentions = (text.match(/résistance|resistance/gi) || []).length;
    score += (supportMentions + resistanceMentions) * 10;

    // Bonus si cohérence directionnelle
    const bullishWords = ['bullish', 'hausse', 'montée', 'up'];
    const bearishWords = ['bearish', 'baisse', 'descente', 'down'];

    const bullishCount = bullishWords.filter(word => text.includes(word)).length;
    const bearishCount = bearishWords.filter(word => text.includes(word)).length;

    if ((type === 'resistance' && bearishCount > bullishCount) ||
        (type === 'support' && bullishCount > bearishCount)) {
      score += 25; // Cohérence directionnelle
    }

    // Bonus si provenance fiable
    if (text.includes('reuters') || text.includes('bloomberg') || text.includes('wsj')) {
      score += 15;
    }

    return Math.min(100, Math.max(0, score));
  }

  private addBasicTechnicalLevels(levels: TechnicalLevels, sp500Data: StockData): void {
    const { high, low, current, previous_close } = sp500Data;

    // Ajouter les niveaux de la journée
    if (low) {
      levels.supports.unshift({
        level: low,
        strength: 'moyen',
        edge_score: 60,
        source: 'Plus bas de la journée',
      });
    }

    if (previous_close) {
      if (previous_close < current) {
        levels.supports.push({
          level: previous_close,
          strength: 'faible',
          edge_score: 40,
          source: 'Clôture précédente',
        });
      } else {
        levels.resistances.push({
          level: previous_close,
          strength: 'faible',
          edge_score: 40,
          source: 'Clôture précédente',
        });
      }
    }

    if (high) {
      levels.resistances.push({
        level: high,
        strength: 'moyen',
        edge_score: 60,
        source: 'Plus haut de la journée',
      });
    }
  }

  private calculatePivotPoints(data: StockData): { p: number; r1: number; r2: number; s1: number; s2: number } {
    const { high, low, current } = data;
    const p = (high + low + current) / 3;
    const r1 = 2 * p - low;
    const s1 = 2 * p - high;
    const r2 = p + (high - low);
    const s2 = p - (high - low);

    return { p, r1, r2, s1, s2 };
  }

  private addPivotLevels(levels: TechnicalLevels, pivots: { p: number; r1: number; r2: number; s1: number; s2: number }): void {
    levels.supports.push(
      { level: pivots.s1, strength: 'moyen', edge_score: 65, source: 'Pivot S1' },
      { level: pivots.s2, strength: 'fort', edge_score: 75, source: 'Pivot S2' }
    );
    levels.resistances.push(
      { level: pivots.r1, strength: 'moyen', edge_score: 65, source: 'Pivot R1' },
      { level: pivots.r2, strength: 'fort', edge_score: 75, source: 'Pivot R2' }
    );
    // Pivot central
    if (pivots.p < levels.current_price) {
      levels.supports.push({ level: pivots.p, strength: 'fort', edge_score: 70, source: 'Pivot Central (P)' });
    } else {
      levels.resistances.push({ level: pivots.p, strength: 'fort', edge_score: 70, source: 'Pivot Central (P)' });
    }
  }

  private calculateFibonacciLevels(data: StockData): Array<{ level: number; type: 'retracement'; percent: string }> {
    const { high, low } = data;
    const range = high - low;
    if (range <= 0) return [];

    return [
      { level: high - range * 0.236, type: 'retracement', percent: '23.6%' },
      { level: high - range * 0.382, type: 'retracement', percent: '38.2%' },
      { level: high - range * 0.5, type: 'retracement', percent: '50.0%' },
      { level: high - range * 0.618, type: 'retracement', percent: '61.8%' },
    ];
  }

  private addFibonacciLevels(levels: TechnicalLevels, fibs: Array<{ level: number; type: 'retracement'; percent: string }>): void {
    fibs.forEach(fib => {
      if (fib.level < levels.current_price) {
        levels.supports.push({ level: fib.level, strength: 'moyen', edge_score: 55, source: `Fibo ${fib.percent}` });
      } else {
        levels.resistances.push({ level: fib.level, strength: 'moyen', edge_score: 55, source: `Fibo ${fib.percent}` });
      }
    });
  }

  private async getUpcomingAndRecentEvents(): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      // Get events from last 24h and next 24h
      const res = await client.query(`
              SELECT * FROM economic_events 
              WHERE event_date >= NOW() - INTERVAL '24 hours' 
              AND event_date <= NOW() + INTERVAL '24 hours'
              ORDER BY event_date ASC
          `);
      return res.rows;
    } finally {
      client.release();
    }
  }

  private async getRecentNewsHeadlines(): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const res = await client.query(`
              SELECT title, source FROM news_items 
              WHERE published_at >= NOW() - INTERVAL '24 hours'
              ORDER BY published_at DESC
              LIMIT 10
          `);
      return res.rows;
    } catch {
      console.warn(`[${this.agentName}] Failed to fetch news context`);
      return [];
    } finally {
      client.release();
    }
  }

  private createEnhancedAnalysisPrompt(events: any[], newsContext: string = '', technicalLevels?: TechnicalLevels, sp500Data?: StockData): string {
    const technicalContext = technicalLevels ? `
## 📊 DONNÉES TECHNIQUES DU S&P 500 EN TEMPS RÉEL:

**Prix Actuel:** ${sp500Data ? sp500Data.current.toFixed(2) : 'N/A'} USD
**Variation Journalière:** ${sp500Data ? `${sp500Data.change > 0 ? '+' : ''}${sp500Data.change.toFixed(2)} (${sp500Data.percent_change > 0 ? '+' : ''}${sp500Data.percent_change.toFixed(2)}%)` : 'N/A'}
**Fourchette du Jour:** ${sp500Data ? `${sp500Data.low.toFixed(2)} - ${sp500Data.high.toFixed(2)}` : 'N/A'}

**NIVEAUX DE SUPPORT IMPORTANTS (par ordre de pertinence):**
${technicalLevels.supports.map((s, i) => `${i+1}. ${s.level.toFixed(2)} - Force: ${s.strength.toUpperCase()}, Edge Score: ${s.edge_score}/100, Source: ${s.source}`).join('\n') || 'Aucun support identifié'}

**NIVEAUX DE RÉSISTANCE IMPORTANTS (par ordre de pertinence):**
${technicalLevels.resistances.map((r, i) => `${i+1}. ${r.level.toFixed(2)} - Force: ${r.strength.toUpperCase()}, Edge Score: ${r.edge_score}/100, Source: ${r.source}`).join('\n') || 'Aucune résistance identifiée'}

**NIVEAUX PSYCHOLOGIQUES RONDS:**
${technicalLevels.round_levels.filter(l => l.significance.includes('majeur') || l.significance.includes('proche')).map(l => `- ${l.level}: ${l.significance}`).join('\n') || 'Aucun niveau psychologique significatif'}

**POINTS PIVOTS (Standard):**
P: ${technicalLevels.pivot_points.p.toFixed(2)} | R1: ${technicalLevels.pivot_points.r1.toFixed(2)} | S1: ${technicalLevels.pivot_points.s1.toFixed(2)}

**RETRACEMENTS DE FIBONACCI (Range du jour):**
${technicalLevels.fibonacci_levels.map(f => `- ${f.percent}: ${f.level.toFixed(2)}`).join('\n') || 'N/A'}
` : '';

    return `
You are RougePulse, an expert ES FUTURES technical analyst specializing in E-mini S&P 500 trading with deep understanding of market microstructure, price levels, futures data, and trading edge. You trade exclusively on TOPSTEP, CME GROUP, and AMP FUTURES platforms.

TASK:
Analyze the economic events, news context, and REAL-TIME ES FUTURES TECHNICAL DATA to provide a strategic ES futures assessment for professional futures trading.
You have access to ACTUAL E-mini S&P 500 prices and technical levels from futures markets and specialized trading sources (TopStep, CME, AMP Futures).

${technicalContext}

## 📅 ÉVÉNEMENTS ÉCONOMIQUES:
${JSON.stringify(events, null, 2)}

## 📰 CONTEXTE DES MARCHÉS (News financières):
${newsContext || 'No specific news context available.'}

## 🎯 INSTRUCTIONS SPÉCIFIQUES - EXPERT ES FUTURES:

1. **EDGE TRADING FUTURES**: Utilise les niveaux techniques ES avec les edge scores (>70 = forte confiance, 50-70 = modérée, <50 = faible). Explique POURQUOI un niveau a un edge spécifique pour les futures ES.

2. **FUTURES MARKET MICROSTRUCTURE**: Positionnez les événements économiques par rapport aux niveaux ES actuels. Impact sur le market depth, volume profile, et open interest.

3. **TOPSTEP/CME/AMP DATA**: Intégrez les données spécifiques des plateformes de trading futures (margin requirements, contract specifications, trading hours).

4. **PROBABILITISTIC FUTURES**: Donnez une évaluation probabiliste pour ES (ex: "65% de probabilité de cassure du support 5250.50 si mauvaises données CPI").

5. **NEXT SESSION FUTURES**: Identifiez les niveaux clés ES pour la session de demain basés sur la combinaison événements + niveaux techniques + contexte futures.

6. **FUTURES EDGE REASONING**: Expliquez pourquoi ces niveaux fonctionnent pour les contrats ES spécifiquement. Ex: "Le support 5250.50 est significatif car: 1) Niveau psychologique ES, 2) Volume profile accumulation, 3) Confluence événement FOMC, 4) Interest levels sur CME".

7. **LANGUAGE**: Tous les champs texte doivent être en FRANÇAIS.

## 📋 FORMAT JSON REQUIS - ES FUTURES SPECIALIST:
{
  "impact_score": number, // 0-100 (100 = Extrême volatilité/importance pour ES)
  "market_narrative": "Analyse ES Futures détaillée pour le TRADER EXPERT. Récit incluant macro + technique + microstructure futures. EN FRANÇAIS.",

  "bot_signal": {
    "action": "LONG|SHORT|WAIT",
    "entry_zone": [min_price, max_price],
    "stop_loss": price,
    "targets": [tp1, tp2, tp3],
    "timeframe": "SCALP|INTRADAY|SWING",
    "confidence": number (0-100),
    "setup_type": "BREAKOUT|REVERSAL|TREND_FOLLOWING|RANGE_BOUND",
    "reason": "Logique d'exécution ES Futures courte pour le bot EN FRANÇAIS"
  },

  "agent_state": {
    "market_regime": "TRENDING_UP|TRENDING_DOWN|RANGING|VOLATILE_UNCERTAIN",
    "volatility_alert": boolean,
    "sentiment_score": number (-100 à 100),
    "key_message": "Message concis ES Futures pour les autres agents (Vortex/Vixombre) EN FRANÇAIS"
  },

  "technical_edge_analysis": {
    "key_levels": [
      {
        "level": number,
        "type": "support|résistance",
        "strength": "faible|moyen|fort",
        "edge_score": number,
        "reasoning": "Pourquoi ce niveau ES est important maintenant (volume, open interest) EN FRANÇAIS",
        "probability_break": "Probabilité de cassure ES si X événement (0-100%) EN FRANÇAIS"
      }
    ],
    "current_position": "Position ES actuel par rapport aux niveaux clés et contexte futures EN FRANÇAIS"
  },
  "high_impact_events": [
    {
      "event": "Nom",
      "actual_vs_forecast": "Description de l'écart EN FRANÇAIS",
      "technical_implication": "Impact technique probable sur les niveaux ES Futures EN FRANÇAIS",
      "significance": "Pourquoi ce chiffre spécifique compte pour ES maintenant EN FRANÇAIS"
    }
  ],
  "es_futures_analysis": {
    "bias": "BULLISH|BEARISH|NEUTRAL",
    "reasoning": "Analyse ES détaillée incluant niveaux techniques, événements économiques, et microstructure futures EN FRANÇAIS",
    "key_levels": [Array of key price levels ES Futures],
    "edge_confirmation": "Comment les données économiques confirment/infutent l'edge technique ES EN FRANÇAIS",
    "platform_context": "Analyse spécifique TopStep/CME/AMP (margin, hours, volume) EN FRANÇAIS",
    "market_microstructure": "Volume profile, open interest, market depth analysis EN FRANÇAIS"
  },
  "trading_recommendation": "Conseil actionnable ES Futures basé sur la confluence données + niveaux techniques + contexte futures EN FRANÇAIS",
  "next_session_levels": {
    "session_setup": "Configuration potentielle ES Futures pour la prochaine séance EN FRANÇAIS",
    "breakout_scenarios": "Scénarios de cassure des niveaux clés ES Futures EN FRANÇAIS",
    "invalidation_levels": "Niveaux d'invalidation des scénarios ES Futures EN FRANÇAIS"
  }
}

IMPORTANT: Concentrez-vous sur l'EDGE TRADING ES FUTURES - expliquez pourquoi un trader ES aurait un avantage avec cette information spécifique aux contrats E-mini S&P 500.
`;
  }

  private async tryKiloCodeWithFile(prompt: string): Promise<any> {
    const bufferPath = path.resolve('rouge_pulse_buffer.md');

    const content = `
# RougePulse Analysis Buffer

## 📊 Economic Data
\`\`\`json
${prompt}
\`\`\`

## 🤖 Instructions
Analyze the data above and return ONLY the requested JSON.
`;

    await fs.writeFile(bufferPath, content, 'utf-8');

    console.log(`\n[${this.agentName}] 🔍 SYSTEM PROMPT (Buffer Content):`);
    // console.log(content); // Optional: print buffer content

    try {
      const isWindows = process.platform === 'win32';
      const readCommand = isWindows ? `type "${bufferPath}"` : `cat "${bufferPath}"`;
      const command = `${readCommand} | kilocode -m ask --auto --json`;

      console.log(`\n[${this.agentName}] 🚀 EXECUTING KILOCODE...`);

      const { stdout, stderr } = await this.execAsync(command, {
        timeout: 90000,
        cwd: process.cwd(),
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });

      await fs.writeFile('rouge_debug.log', `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`);

      return this.parseOutput(stdout);
    } catch (error) {
      console.error(`[${this.agentName}] KiloCode execution failed:`, error);
      return null;
    } finally {
      // await fs.unlink(bufferPath).catch(() => {});
    }
  }

  private async parseOutput(stdout: string): Promise<Record<string, unknown> | null> {
    try {
      const clean = stdout.replace(/\u001b\[[0-9;]*m/g, '').replace(/\u001b\[[0-9;]*[A-Z]/g, '');

      // Strategy 1: Handle KiloCode Streaming JSON Output
      const lines = clean.split('\n');
      let bestContent = '';
      let maxJsonLength = 0;

      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (!line) continue;
        try {
          if (line.startsWith('{') && line.endsWith('}')) {
            const event = JSON.parse(line);
            if (event.type === 'say' && event.say === 'completion_result' && event.content) {
              const content = event.content;

              // Find JSON in the content - look for completion_result with JSON structure
              const hasJsonStructure =
                content.includes('"impact_score"') && content.includes('"market_narrative"');
              if (hasJsonStructure && content.length > maxJsonLength) {
                bestContent = content;
                maxJsonLength = content.length;
              }
            }
          }
        } catch {
          /* Ignore */
        }
      }

      if (bestContent) {
        console.log(`[${this.agentName}] Found best content with length: ${bestContent.length}`);
        await fs.writeFile('rouge_last_content.log', bestContent);

        // Extract and fix incomplete JSON
        let jsonStr = bestContent;

        // Remove markdown code blocks
        jsonStr = jsonStr.replace(/```json\s*|\s*```/g, '').trim();

        // Find the start of JSON
        const jsonStart = jsonStr.indexOf('{');
        if (jsonStart !== -1) {
          jsonStr = jsonStr.substring(jsonStart);
        }

        console.log(`[${this.agentName}] JSON string length before extraction: ${jsonStr.length}`);

        // Try to extract complete JSON object
        let braceCount = 0;
        let endIndex = -1;
        let inString = false;
        let escapeNext = false;

        for (let i = 0; i < jsonStr.length; i++) {
          const char = jsonStr[i];

          if (escapeNext) {
            escapeNext = false;
            continue;
          }

          if (char === '\\') {
            escapeNext = true;
            continue;
          }

          if (char === '"' && !escapeNext) {
            inString = !inString;
            continue;
          }

          if (!inString) {
            if (char === '{') {
              braceCount++;
            } else if (char === '}') {
              braceCount--;
              if (braceCount === 0) {
                endIndex = i + 1;
                break;
              }
            }
          }
        }

        if (endIndex !== -1) {
          jsonStr = jsonStr.substring(0, endIndex);
          console.log(`[${this.agentName}] Extracted JSON length: ${jsonStr.length}`);
        } else {
          // If we can't find a complete JSON, take what we have and fix it
          console.warn(`[${this.agentName}] JSON appears truncated, attempting repair...`);
        }

        const parsed = this.safeJsonParse(jsonStr);
        if (parsed) {
          console.log(`[${this.agentName}] JSON parsing successful!`);
          return parsed;
        } else {
          console.warn(`[${this.agentName}] JSON parsing failed, trying fallback extraction...`);
        }
      } else {
        console.warn(`[${this.agentName}] No content found in stdout lines`);
        await fs.writeFile('rouge_last_content.log', 'NO CONTENT FOUND IN STDOUT LINES');
      }

      // Strategy 2: Fallback to Regex
      const jsonMatch =
        clean.match(/```json\s*(\{[\s\S]*?\})\s*```/) || clean.match(/\{[\s\S]*?\}/);

      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        return this.safeJsonParse(jsonStr);
      }

      return null;
    } catch (error) {
      console.error(`[${this.agentName}] Parsing failed:`, error);
      return null;
    }
  }

  private safeJsonParse(jsonStr: string): Record<string, unknown> | null {
    try {
      return JSON.parse(jsonStr);
    } catch {
      console.warn(`[${this.agentName}] Standard JSON parse failed, attempting repairs...`);

      // Repair 1: Remove trailing commas
      const repaired = jsonStr.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
      try {
        return JSON.parse(repaired);
      } catch (_e2) {
        // Continue to next repair attempt
      }

      // Repair 2: Smart completion based on structure
      const braceCount = (jsonStr.match(/{/g) || []).length - (jsonStr.match(/}/g) || []).length;
      const bracketCount =
        (jsonStr.match(/\[/g) || []).length - (jsonStr.match(/\]/g) || []).length;

      let completion = '';
      if (braceCount > 0) completion += '}'.repeat(braceCount);
      if (bracketCount > 0) completion += ']'.repeat(bracketCount);

      // Also try to close any open strings
      const quoteCount = (jsonStr.match(/"/g) || []).length;
      if (quoteCount % 2 !== 0) completion += '"';

      try {
        const fixed = jsonStr + completion;
        console.log(`[${this.agentName}] Smart repair: added ${completion}`);
        return JSON.parse(fixed);
      } catch (_e3) {
        // Continue to next repair attempt
      }

      // Repair 3: Try common truncation patterns for trading_recommendation
      const tradingRecommendationMatch = jsonStr.match(/"trading_recommendation"\s*:\s*"([^"]*)$/);
      if (tradingRecommendationMatch) {
        const partialValue = tradingRecommendationMatch[1];
        const fixedJson = jsonStr.replace(
          /"trading_recommendation"\s*:\s*"([^"]*)$/,
          `"trading_recommendation": "${partialValue}..."`
        );
        try {
          console.log(`[${this.agentName}] Fixed trading_recommendation field`);
          return JSON.parse(fixedJson);
        } catch (_e4) {
          // Continue to next repair attempt
        }
      }

      // Repair 4: Force complete object structure
      try {
        return JSON.parse(jsonStr + '}');
      } catch (_e5) {
        // Continue to next repair attempt
      }
      try {
        return JSON.parse(jsonStr + ']}');
      } catch (_e6) {
        // Continue to next repair attempt
      }
      try {
        return JSON.parse(jsonStr + '"}]}');
      } catch (_e7) {
        // Continue to next repair attempt
      }

      console.warn(
        `[${this.agentName}] All repair attempts failed. JSON length: ${jsonStr.length}`
      );

      // Try to extract partial useful data
      try {
        const partial = this.extractPartialData(jsonStr);
        if (partial) {
          console.log(`[${this.agentName}] Extracted partial data as fallback`);
          return partial;
        }
      } catch (_e8) {
        // All repair attempts failed
      }

      return null;
    }
  }

  private extractPartialData(jsonStr: string): Record<string, unknown> | null {
    try {
      console.log(`[${this.agentName}] 🔍 Tentative d'extraction de données partielles...`);

      // Extraire tous les champs possibles avec des regex plus flexibles
      const impactMatch = jsonStr.match(/"impact_score"\s*:\s*(\d+)/);

      // Essaye plusieurs patterns pour market_narrative
      let narrativeText = '';
      const narrativePatterns = [
        /"market_narrative"\s*:\s*"([^"]{20,500})"/,
        /"market_narrative"\s*:\s*'([^']{20,500})'/,
        /"market_narrative"\s*:\s*"([^"]*)"/,
      ];

      for (const pattern of narrativePatterns) {
        const match = jsonStr.match(pattern);
        if (match && match[1] && match[1].length > 30) {
          narrativeText = match[1];
          break;
        }
      }

      // Extraire les données S&P 500 si disponibles
      let sp500Data = null;
      const sp500Match = jsonStr.match(/"sp500_data"\s*:\s*\{[^}]*"current"\s*:\s*([\d.]+)/);
      if (sp500Match) {
        sp500Data = parseFloat(sp500Match[1]);
      }

      // Extraire les niveaux techniques
      let technicalLevels: any = null;
      const supportsMatch = jsonStr.match(/"supports"\s*:\s*\[([^\]]+)\]/);
      const resistancesMatch = jsonStr.match(/"resistances"\s*:\s*\[([^\]]+)\]/);

      if (supportsMatch || resistancesMatch) {
        technicalLevels = 'Données techniques partiellement extraites';
      }

      // Extraire bot_signal si disponible
      let botAction = 'WAIT';
      let botConfidence = 25;
      const botActionMatch = jsonStr.match(/"action"\s*:\s*"([^"]+)"/);
      const botConfidenceMatch = jsonStr.match(/"confidence"\s*:\s*(\d+)/);

      if (botActionMatch) botAction = botActionMatch[1];
      if (botConfidenceMatch) botConfidence = parseInt(botConfidenceMatch[1]);

      // Si on a trouvé des données significatives
      if (impactMatch || narrativeText || sp500Data) {
        const partialData = {
          impact_score: impactMatch ? parseInt(impactMatch[1]) : 25,
          market_narrative: narrativeText || 'Analyse partielle - données JSON tronquées mais utilisables',
          asset_analysis: {
            ES_Futures: {
              bias: narrativeText.toLowerCase().includes('hauss') ? 'BULLISH' :
                     narrativeText.toLowerCase().includes('baiss') ? 'BEARISH' : 'NEUTRAL',
              reasoning: 'Extrait de l\'analyse tronquée'
            },
            Bitcoin: {
              bias: narrativeText.toLowerCase().includes('hauss') ? 'BULLISH' :
                     narrativeText.toLowerCase().includes('baiss') ? 'BEARISH' : 'NEUTRAL',
              reasoning: 'Extrait de l\'analyse tronquée'
            },
          },
          trading_recommendation: narrativeText
            ? `${narrativeText.substring(0, 150)}${narrativeText.length > 150 ? '...' : ''}`
            : 'Analyse partielle - utilisez !rougepulseagent pour l\'analyse complète',
          bot_signal: {
            action: botAction,
            confidence: botConfidence,
            reason: 'Extrait de données tronquées'
          },
          agent_state: {
            market_regime: 'PARTIAL_DATA',
            volatility_alert: true,
            sentiment_score: 0
          },
          high_impact_events: [],
          technical_levels: technicalLevels,
          sp500_price: sp500Data,
          partial_data: true,
          note: 'Données extraites d\'une réponse JSON tronquée par l\'IA',
        };

        console.log(`[${this.agentName}] ✅ Extraction partielle réussie - Score: ${partialData.impact_score}, Narrative: ${partialData.market_narrative.length} chars`);
        return partialData;
      }

      console.log(`[${this.agentName}] ⚠️ Aucune donnée significative trouvée dans le JSON tronqué`);
      return null;
    } catch (e) {
      console.warn(`[${this.agentName}] Partial data extraction failed:`, e);
      return null;
    }
  }
}
