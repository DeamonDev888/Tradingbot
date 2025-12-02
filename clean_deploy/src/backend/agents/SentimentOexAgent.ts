import { BaseAgentSimple } from './BaseAgentSimple';
import { CboeScraper, OexScrapeResult } from '../ingestion/CboeScraper';
import { Pool } from 'pg';

export class SentimentOexAgent extends BaseAgentSimple {
  private scraper: CboeScraper;
  private pool: Pool;

  constructor() {
    super('sentiment-oex-agent');
    this.scraper = new CboeScraper();
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'financial_analyst',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '9022',
    });
  }

  async analyzeSentiment(): Promise<any> {
    console.log(`[${this.agentName}] 🚀 Starting OEX Sentiment Analysis...`);

    // 1. Scrape Data
    let scrapeResult: OexScrapeResult;
    try {
      scrapeResult = await this.scraper.scrapeOexRatio();
      if (scrapeResult.put_call_ratio !== null) {
        await this.scraper.saveToDatabase(this.pool, scrapeResult);
      }
    } catch (e) {
      console.error(`[${this.agentName}] Scraping failed:`, e);
      return null;
    }

    if (scrapeResult.put_call_ratio === null) {
      console.error(`[${this.agentName}] No OEX Ratio found. Aborting.`);
      return null;
    }

    // 2. Create Prompt
    const prompt = this.createAnalysisPrompt(scrapeResult.put_call_ratio);

    // 3. Call AI
    const analysis = await this.callKiloCode({
      prompt,
      outputFile: 'oex_sentiment_output.json',
    });

    // 4. Save & Return
    if (analysis) {
      await this.saveAnalysisToDatabase(scrapeResult.put_call_ratio, analysis);
      return analysis;
    }

    return null;
  }

  private createAnalysisPrompt(ratio: number): string {
    return `
You are SentimentOex, an expert in options market sentiment analysis, specifically focusing on the CBOE OEX Put/Call Ratio.

TASK:
Analyze the current OEX Put/Call Ratio and determine the market sentiment based on specific rules.
Output the result in valid JSON format (French language).

DATA:
Current OEX Put/Call Ratio: ${ratio}

KNOWLEDGE BASE (INTERPRETATION RULES):
1. **Bullish Signal (Haussier)**: If the ratio is **below 0.7** and close to **0.5**. This indicates that traders are buying more calls than puts, suggesting a bullish sentiment.
2. **Bearish Signal (Baissier)**: If the ratio is **above 0.7** or **above 1.0**. This indicates that traders are buying more puts than calls (hedging or betting on a drop), suggesting a bearish sentiment.
3. **Neutral**: If the ratio is around 0.7 but not clearly bullish or bearish, or if there is ambiguity.

REQUIRED JSON OUTPUT FORMAT:
{
  "ratio": number,
  "sentiment_label": "BULLISH" | "BEARISH" | "NEUTRAL",
  "sentiment_score": number, // 0 (Extreme Bearish) to 100 (Extreme Bullish). 50 is Neutral.
  "market_implication": "string", // Detailed explanation in French
  "trading_signal": "BUY_CALLS" | "BUY_PUTS" | "WAIT",
  "confidence": "string" // "High", "Medium", "Low"
}

INSTRUCTIONS:
- Analyze the ratio ${ratio} strictly according to the rules above.
- Provide a clear "market_implication" in French explaining WHY the sentiment is bullish/bearish based on the ratio value.
- The "sentiment_score" should reflect the intensity.
    - Ratio ~0.5 -> Score ~80-90 (Bullish)
    - Ratio > 1.0 -> Score ~10-20 (Bearish)
    - Ratio ~0.7 -> Score ~50 (Neutral/Turning)
- Return ONLY the JSON object.
`;
  }

  private async saveAnalysisToDatabase(ratio: number, analysis: any): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(
        `INSERT INTO oex_sentiment_analyses 
        (ratio_analyzed, sentiment_score, sentiment_label, market_implication, trading_signal, raw_analysis, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          ratio,
          analysis.sentiment_score,
          analysis.sentiment_label,
          analysis.market_implication,
          analysis.trading_signal,
          JSON.stringify(analysis),
        ]
      );
      console.log(`[${this.agentName}] 💾 Analysis saved to DB.`);
    } catch (e) {
      console.error(`[${this.agentName}] DB Save failed:`, e);
    } finally {
      client.release();
    }
  }
}
