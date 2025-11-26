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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VixombreAgent = void 0;
const BaseAgentSimple_1 = require("./BaseAgentSimple");
const VixPlaywrightScraper_1 = require("../ingestion/VixPlaywrightScraper");
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
const pg_1 = require("pg");
dotenv.config();
class VixombreAgent extends BaseAgentSimple_1.BaseAgentSimple {
    scraper;
    execAsync;
    pool;
    constructor() {
        super('vixombre-agent');
        this.scraper = new VixPlaywrightScraper_1.VixPlaywrightScraper();
        this.execAsync = (0, util_1.promisify)(child_process_1.exec);
        this.pool = new pg_1.Pool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'financial_analyst',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '9022',
        });
    }
    async analyzeVixStructure() {
        console.log(`[${this.agentName}] Starting VIX Web Scraping & Analysis...`);
        try {
            // 1. Scrape Data
            const scrapeResults = await this.scraper.scrapeAll();
            const successCount = scrapeResults.filter((r) => !r.error && r.value !== null).length;
            const failedSources = scrapeResults
                .filter((r) => r.error || r.value === null)
                .map((r) => `${r.source} (${r.error || 'No data'})`);
            console.log(`[${this.agentName}] Scraped ${successCount} sources successfully.`);
            // 1b. Save to Database
            await this.scraper.saveToDatabase(this.pool, scrapeResults);
            // 2. Prepare Data for AI
            const prompt = this.createAnalysisPrompt(scrapeResults);
            // 3. Analyze with KiloCode
            let aiAnalysis = await this.tryKiloCodeWithFile(prompt);
            // Fallback if AI failed
            if (!aiAnalysis) {
                console.log(`[${this.agentName}] AI Analysis failed, generating fallback stats...`);
                const validValues = scrapeResults
                    .filter((r) => r.value !== null)
                    .map((r) => r.value);
                const avg = validValues.length > 0
                    ? validValues.reduce((a, b) => a + b, 0) / validValues.length
                    : 0;
                const validChanges = scrapeResults
                    .filter((r) => r.change_pct !== null)
                    .map((r) => r.change_pct);
                const avgChange = validChanges.length > 0
                    ? validChanges.reduce((a, b) => a + b, 0) / validChanges.length
                    : 0;
                // Calculate High/Low spread from available data
                const highs = scrapeResults.filter(r => r.high !== null).map(r => r.high);
                const lows = scrapeResults.filter(r => r.low !== null).map(r => r.low);
                const maxHigh = highs.length > 0 ? Math.max(...highs) : 0;
                const minLow = lows.length > 0 ? Math.min(...lows) : 0;
                const _spread = maxHigh && minLow ? maxHigh - minLow : 0;
                const _headlines = scrapeResults.flatMap((r) => r.news_headlines);
                aiAnalysis = {
                    volatility_analysis: {
                        current_vix: validValues.length > 0 ? parseFloat(avg.toFixed(2)) : 0,
                        vix_trend: avgChange < 0 ? 'BEARISH' : 'BULLISH',
                        volatility_regime: avg > 30 ? 'CRISIS' : avg > 20 ? 'ELEVATED' : 'NORMAL',
                        sentiment: 'NEUTRAL',
                        sentiment_score: 0,
                        risk_level: avg > 20 ? 'HIGH' : 'MEDIUM',
                        catalysts: ['Analyse IA indisponible', 'Données de marché uniquement'],
                        expert_summary: "Analyse de secours automatisée. Le service d'IA n'était pas disponible pour fournir des informations détaillées.",
                        key_insights: ['Données VIX récupérées avec succès', 'Analyse IA détaillée ignorée'],
                        trading_recommendations: {
                            strategy: 'NEUTRAL',
                            target_vix_levels: [15, 25],
                        },
                    },
                };
            }
            // 4. Récupérer données historiques VIX pour analyse de tendance
            const historicalData = await this.getVixHistoricalData();
            // 5. Construct Final JSON avec analyse experte
            const expertAnalysis = aiAnalysis.volatility_analysis ||
                {};
            const finalResult = {
                metadata: {
                    analysis_timestamp: new Date().toISOString(),
                    markets_status: this.determineMarketStatus(),
                    sources_scraped: successCount,
                    sources_failed: failedSources,
                    analysis_type: 'EXPERT_VOLATILITY_ANALYSIS',
                },
                current_vix_data: {
                    consensus_value: expertAnalysis.current_vix || this.getConsensusValue(scrapeResults),
                    trend: expertAnalysis.vix_trend || 'NEUTRAL',
                    sources: scrapeResults.map((r) => {
                        return Object.fromEntries(Object.entries({
                            source: r.source,
                            value: r.value,
                            change_abs: r.change_abs,
                            change_pct: r.change_pct,
                            previous_close: r.previous_close,
                            open: r.open,
                            high: r.high,
                            low: r.low,
                            last_update: r.last_update,
                        }).filter(([, v]) => v !== null));
                    }),
                },
                expert_volatility_analysis: {
                    current_vix: expertAnalysis.current_vix,
                    vix_trend: expertAnalysis.vix_trend,
                    volatility_regime: expertAnalysis.volatility_regime,
                    sentiment: expertAnalysis.sentiment,
                    sentiment_score: expertAnalysis.sentiment_score,
                    risk_level: expertAnalysis.risk_level,
                    catalysts: expertAnalysis.catalysts || [],
                    technical_signals: expertAnalysis.technical_signals || {},
                    market_implications: expertAnalysis.market_implications || {},
                    expert_summary: expertAnalysis.expert_summary,
                    key_insights: expertAnalysis.key_insights || [],
                    trading_recommendations: expertAnalysis.trading_recommendations || {},
                },
                historical_context: {
                    comparison_5day: historicalData.five_day_avg,
                    comparison_20day: historicalData.twenty_day_avg,
                    volatility_trend: this.calculateVolatilityTrend(historicalData),
                    key_levels: {
                        support: historicalData.support_level,
                        resistance: historicalData.resistance_level,
                    },
                },
                news_analysis: {
                    total_headlines: scrapeResults.reduce((sum, r) => sum + r.news_headlines.length, 0),
                    key_themes: this.extractNewsThemes(scrapeResults),
                    volatility_catalysts: this.identifyVolatilityCatalysts(scrapeResults),
                },
            };
            await this.saveAnalysisToDatabase(finalResult);
            return finalResult;
        }
        catch (error) {
            console.error(`[${this.agentName}] Analysis failed:`, error);
            return {
                error: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    determineMarketStatus() {
        const now = new Date();
        const day = now.getDay();
        const hour = now.getHours();
        if (day === 0 || day === 6)
            return `Clôture du vendredi (marchés fermés week-end)`;
        if (hour < 9 || hour > 16)
            return `Marchés fermés (Hors séance)`;
        return `Séance en cours`;
    }
    createAnalysisPrompt(results) {
        return `
You are VIXOMBRE, a world-class volatility expert and market analyst.

## 🤖 INSTRUCTIONS
Analyze the provided VIX data and news to deliver an EXPERT VOLATILITY ANALYSIS.

CRITICAL RULES:
1. Return ONLY valid JSON.
2. NO conversational text.
3. ALL text fields MUST be in FRENCH.

## 🧠 KNOWLEDGE BASE: VIX & VVIX INTERPRETATION
1. **VIX LEVELS**:
   - **10-15**: Marché confiant, faible volatilité.
   - **20-30**: Marché nerveux/volatile (peut être haussier mais agité).
   - **>30**: Peur élevée / Crise.

2. **CALCUL DU MOUVEMENT ATTENDU (ES Futures)**:
   - "Le VIX te dit de combien ES peut bouger".
   - **Mouvement Mensuel**: VIX / 3.46 (ex: VIX 20 → ~5.8% / mois).
   - **Mouvement Hebdo**: ~1.35% pour VIX 20.
   - **Mouvement Quotidien (Rule of 16)**: VIX / 16.

3. **CORRÉLATION VVIX (Volatilité de la Volatilité)**:
   - **VIX > 20 & VVIX > 120**: 🚨 GROS MOUVEMENT IMMINENT (généralement BAISSIER).
   - **VIX Monte & VVIX < 100**: Panique non crédible, le marché rebondit souvent.
   - **VIX Bas (<15-17) & VVIX > 110**: Gros mouvement dans les 24-72h.
   - **VVIX > 130**: DANGER, forte probabilité de volatilité/chute.
   - **VVIX < 85**: Marché calme, gros mouvement peu probable.

## 📊 VIX DATA
${JSON.stringify(this.simplifyResults(results), null, 2)}

IMPORTANT DATA POINTS:
- **Value**: Current VIX level.
- **Change**: Daily change in points and percentage.
- **Range (High/Low)**: Intraday volatility range.
- **Open/Prev Close**: Gap analysis (Opening Gap).
- **News**: Recent headlines for context.

HISTORICAL CONTEXT:
- VIX Long-Term Mean: ~19-20
- VIX Crisis Levels: >30 (High Fear), >40 (Extreme Fear)
- VIX Calm Levels: <15 (Low Volatility), <12 (Extreme Calm)
- VIX Spike Reversal: Often signals market bottoms when spikes reverse

REQUIRED EXPERT ANALYSIS FORMAT:
{
  "volatility_analysis": {
    "current_vix": number,
    "vix_trend": "BULLISH|BEARISH|NEUTRAL",
    "volatility_regime": "CRISIS|ELEVATED|NORMAL|CALM|EXTREME_CALM",
    "sentiment": "EXTREME_FEAR|FEAR|NEUTRAL|GREED|EXTREME_GREED",
    "sentiment_score": number_between_-100_and_100,
    "risk_level": "CRITICAL|HIGH|MEDIUM|LOW",
    "catalysts": ["List of 3-5 key volatility drivers from news (IN FRENCH)"],
    "technical_signals": {
      "vix_vs_mean": "string (IN FRENCH)",
      "volatility_trend": "string (IN FRENCH)",
      "pattern_recognition": "string (IN FRENCH)",
      "gap_analysis": "GAP_UP|GAP_DOWN|NONE",
      "intraday_range_analysis": "EXPANDING|CONTRACTING|STABLE"
    },
    "market_implications": {
      "es_futures_bias": "BULLISH|BEARISH|NEUTRAL",
      "volatility_expectation": "INCREASING|DECREASING|STABLE",
      "confidence_level": number_between_0_100,
      "time_horizon": "INTRADAY|SWING|POSITIONAL"
    },
    "expert_summary": "Professional volatility analysis summary (2-3 sentences) IN FRENCH",
    "key_insights": ["3-5 bullet points of actionable volatility insights IN FRENCH"],
    "trading_recommendations": {
      "strategy": "VOLATILITY_BUY|VOLATILITY_SELL|NEUTRAL",
      "entry_signals": ["Specific entry conditions IN FRENCH"],
      "risk_management": "Risk management advice IN FRENCH",
      "target_vix_levels": [min_target, max_target]
    }
  }
}

ANALYSIS METHODOLOGY:
1. Compare current VIX to historical averages and recent trends.
2. **Analyze the Intraday Range (High - Low) and Opening Gap (Open - Prev Close)** for immediate sentiment.
3. Analyze news for volatility catalysts (geopolitical, economic, market events).
4. Assess market sentiment from VIX levels and news tone.
5. Provide ES Futures directional bias based on volatility expectations.
6. Include risk assessment and confidence levels.
7. Focus on actionable trading insights.

RULES:
1. Return ONLY valid JSON - no explanations outside JSON.
2. Be decisive in your analysis - avoid "may" or "might".
3. Provide specific, actionable recommendations.
4. Base sentiment_score on: Negative = -50 to -100, Neutral = -49 to 49, Positive = 50 to 100.
5. Include numerical VIX targets when providing recommendations.
6. Consider both current conditions AND future volatility expectations.
7. **IMPORTANT: ALL TEXT FIELDS (summary, insights, catalysts, recommendations) MUST BE IN FRENCH.**
`;
    }
    async tryKiloCodeWithFile(prompt) {
        const bufferPath = path.resolve('vix_buffer.md');
        const content = `
# Vixombre Analysis Buffer

## 📊 VIX Data
\`\`\`json
${prompt}
\`\`\`

## 🤖 Instructions
Analyze the data above and return ONLY the requested JSON.
`;
        await fs.writeFile(bufferPath, content, 'utf-8');
        console.log(`\n[${this.agentName}] 🔍 SYSTEM PROMPT (Buffer Content):`);
        console.log('='.repeat(80));
        console.log(content);
        console.log('='.repeat(80));
        try {
            const isWindows = process.platform === 'win32';
            const readCommand = isWindows ? `type "${bufferPath}"` : `cat "${bufferPath}"`;
            const command = `${readCommand} | kilocode -m ask --auto --json`;
            console.log(`\n[${this.agentName}] 🚀 EXECUTING COMMAND:`);
            console.log(`> ${command}`);
            console.log('='.repeat(80));
            const { stdout } = await this.execAsync(command, {
                timeout: 90000,
                cwd: process.cwd(),
            });
            return this.parseOutput(stdout);
        }
        catch (error) {
            console.error(`[${this.agentName}] KiloCode execution failed:`, error);
            return null;
        }
        finally {
            // await fs.unlink(bufferPath).catch(() => {});
            console.log(`[${this.agentName}] 📄 VIX buffer kept for inspection: ${bufferPath}`);
        }
    }
    parseOutput(stdout) {
        console.log(`[${this.agentName}] Raw AI Output length:`, stdout.length);
        fs.writeFile('vix_debug_output.txt', stdout).catch(console.error);
        try {
            const clean = stdout
                .replace(/\u001b\[[0-9;]*m/g, '')
                .replace(/\u001b\[[0-9;]*[A-Z]/g, '')
                .replace(/\u001b\[.*?[A-Za-z]/g, '');
            const lines = clean.split('\n').filter(line => line.trim() !== '');
            let finalJson = null;
            for (const line of lines) {
                try {
                    const event = JSON.parse(line);
                    if (event.metadata && (event.metadata.comparisons || event.metadata.aggregated_news)) {
                        return event.metadata;
                    }
                    if (event.type === 'completion_result' && event.content) {
                        if (typeof event.content === 'string') {
                            const extracted = this.extractJsonFromContent(event.content);
                            if (extracted)
                                finalJson = extracted;
                        }
                        else {
                            finalJson = event.content;
                        }
                    }
                    if (event.type === 'say' && event.say !== 'reasoning' && event.content) {
                        const extracted = this.extractJsonFromContent(event.content);
                        if (extracted)
                            finalJson = extracted;
                    }
                }
                catch (_parseError) {
                    // Ignore JSON parsing errors
                }
            }
            if (finalJson)
                return finalJson;
            const fallbackParsed = this.extractJsonFromContent(clean);
            if (fallbackParsed)
                return fallbackParsed;
            throw new Error('No valid JSON found in stream');
        }
        catch (error) {
            console.error(`[${this.agentName}] Parsing failed:`, error);
            return null;
        }
    }
    extractJsonFromContent(content) {
        const patterns = [
            /```json\s*(\{[\s\S]*?\})\s*```/,
            /```\s*(\{[\s\S]*?\})\s*```/,
            /\{[\s\S]*?"comparisons"[\s\S]*?\}/,
            /\{[\s\S]*?\}/,
        ];
        for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match) {
                try {
                    const jsonStr = match[1] || match[0];
                    return JSON.parse(jsonStr);
                }
                catch (_jsonError) {
                    continue;
                }
            }
        }
        return null;
    }
    extractNewsThemes(results) {
        const headlines = results.flatMap(r => r.news_headlines.map(h => h.title));
        const themes = new Set();
        const keywords = [
            'inflation',
            'fed',
            'rate',
            'war',
            'earnings',
            'tech',
            'oil',
            'recession',
            'growth',
        ];
        headlines.forEach(h => {
            keywords.forEach(k => {
                if (h.toLowerCase().includes(k))
                    themes.add(k.toUpperCase());
            });
        });
        return Array.from(themes).slice(0, 5);
    }
    identifyVolatilityCatalysts(results) {
        const headlines = results.flatMap(r => r.news_headlines.map(h => h.title));
        const catalysts = headlines.filter(h => h.toLowerCase().includes('spike') ||
            h.toLowerCase().includes('plunge') ||
            h.toLowerCase().includes('crash') ||
            h.toLowerCase().includes('surge') ||
            h.toLowerCase().includes('jump') ||
            h.toLowerCase().includes('drop'));
        return catalysts.slice(0, 3);
    }
    async getVixHistoricalData() {
        try {
            const client = await this.pool.connect();
            // Récupérer les 20 derniers jours de données VIX
            const result = await client.query(`
                SELECT price as value, timestamp as created_at
                FROM market_data
                WHERE symbol = 'VIX'
                AND timestamp >= NOW() - INTERVAL '20 days'
                ORDER BY timestamp DESC
                LIMIT 20
            `);
            client.release();
            if (result.rows.length === 0) {
                return {
                    five_day_avg: 20,
                    twenty_day_avg: 20,
                    support_level: 15,
                    resistance_level: 25,
                    current_trend: 'NEUTRAL',
                };
            }
            const values = result.rows.map(row => parseFloat(row.value));
            const fiveDayAvg = values.slice(0, 5).reduce((a, b) => a + b, 0) / Math.min(5, values.length);
            const twentyDayAvg = values.reduce((a, b) => a + b, 0) / values.length;
            // Calculer niveaux de support/résistance
            const sortedValues = [...values].sort((a, b) => a - b);
            const supportLevel = sortedValues[Math.floor(sortedValues.length * 0.2)] || 15;
            const resistanceLevel = sortedValues[Math.floor(sortedValues.length * 0.8)] || 25;
            return {
                five_day_avg: parseFloat(fiveDayAvg.toFixed(2)),
                twenty_day_avg: parseFloat(twentyDayAvg.toFixed(2)),
                support_level: parseFloat(supportLevel.toFixed(2)),
                resistance_level: parseFloat(resistanceLevel.toFixed(2)),
                current_trend: this.calculateTrendDirection(values),
            };
        }
        catch (error) {
            console.error('[VixombreAgent] Error fetching historical VIX data:', error);
            return {
                five_day_avg: 20,
                twenty_day_avg: 20,
                support_level: 15,
                resistance_level: 25,
                current_trend: 'NEUTRAL',
            };
        }
    }
    getConsensusValue(results) {
        const validValues = results.filter(r => r.value !== null).map(r => r.value);
        if (validValues.length === 0)
            return 20;
        const sum = validValues.reduce((a, b) => a + b, 0);
        return parseFloat((sum / validValues.length).toFixed(2));
    }
    calculateVolatilityTrend(historicalData) {
        const fiveDayAvg = historicalData.five_day_avg;
        const twentyDayAvg = historicalData.twenty_day_avg;
        if (fiveDayAvg && twentyDayAvg) {
            if (fiveDayAvg > twentyDayAvg * 1.1)
                return 'BULLISH_VOLATILITY';
            if (fiveDayAvg < twentyDayAvg * 0.9)
                return 'BEARISH_VOLATILITY';
        }
        return 'NEUTRAL_VOLATILITY';
    }
    calculateTrendDirection(values) {
        if (values.length < 3)
            return 'NEUTRAL';
        const recent = values.slice(0, 3);
        const older = values.slice(3, 6);
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recentAvg;
        if (recentAvg > olderAvg * 1.05)
            return 'BULLISH';
        if (recentAvg < olderAvg * 0.95)
            return 'BEARISH';
        return 'NEUTRAL';
    }
    async saveAnalysisToDatabase(analysis) {
        try {
            const client = await this.pool.connect();
            await client.query(`
                INSERT INTO vix_analyses (analysis_data)
                VALUES ($1)
            `, [analysis]);
            client.release();
            console.log(`[${this.agentName}] Analysis saved to database.`);
        }
        catch (error) {
            console.error(`[${this.agentName}] Failed to save analysis to DB:`, error);
        }
    }
    simplifyResults(results) {
        return results.map(r => ({
            source: r.source,
            value: r.value,
            change_pct: r.change_pct,
            news: r.news_headlines.slice(0, 5).map(n => n.title), // Only top 5 titles
        }));
    }
}
exports.VixombreAgent = VixombreAgent;
