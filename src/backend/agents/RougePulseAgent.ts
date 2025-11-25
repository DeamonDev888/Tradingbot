import { BaseAgentSimple } from './BaseAgentSimple';
import { Pool } from 'pg';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

export class RougePulseAgent extends BaseAgentSimple {
  private readonly execAsync: (
    command: string,
    options?: Record<string, unknown>
  ) => Promise<{ stdout: string; stderr: string }>;
  private readonly pool: Pool;

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
  }

  async analyzeEconomicEvents(): Promise<Record<string, unknown> | { error: string }> {
    console.log(`[${this.agentName}] Starting Economic Calendar Analysis...`);

    try {
      // 1. Fetch Data from Database
      const events = await this.getUpcomingAndRecentEvents();
      
      if (events.length === 0) {
          console.log(`[${this.agentName}] No relevant economic events found.`);
          return { message: "No significant events found." };
      }

      console.log(`[${this.agentName}] Retrieved ${events.length} events for analysis.`);

      // 1b. Fetch News Context (ZeroHedge/FinancialJuice)
      const news = await this.getRecentNewsHeadlines();
      const newsContext = news.map(n => `- ${n.source}: ${n.title}`).join('\n');

      // 2. Prepare Prompt
      const prompt = this.createAnalysisPrompt(events, newsContext);

      // 3. Analyze with KiloCode
      const aiAnalysis = await this.tryKiloCodeWithFile(prompt);

      if (!aiAnalysis) {
          return { error: "AI Analysis failed." };
      }

      // 4. Save Analysis to Database
      await this.saveAnalysisToDatabase(aiAnalysis);
      
      console.log(`[${this.agentName}] Analysis completed and saved successfully.`);
      
      return {
          events_analyzed: events.length,
          analysis: aiAnalysis
      };

    } catch (error) {
      console.error(`[${this.agentName}] Analysis failed:`, error);
      return {
        error: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private async saveAnalysisToDatabase(analysis: any): Promise<void> {
      const client = await this.pool.connect();
      try {
          await client.query(`
              INSERT INTO rouge_pulse_analyses 
              (impact_score, market_narrative, high_impact_events, asset_analysis, trading_recommendation, raw_analysis)
              VALUES ($1, $2, $3, $4, $5, $6)
          `, [
              analysis.impact_score,
              analysis.market_narrative,
              JSON.stringify(analysis.high_impact_events),
              JSON.stringify(analysis.asset_analysis),
              analysis.trading_recommendation,
              JSON.stringify(analysis)
          ]);
      } catch (e) {
          console.error(`[${this.agentName}] Failed to save analysis to DB:`, e);
      } finally {
          client.release();
      }
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
      } catch (e) {
          console.warn(`[${this.agentName}] Failed to fetch news context:`, e);
          return [];
      } finally {
          client.release();
      }
  }

  private createAnalysisPrompt(events: any[], newsContext: string = ""): string {
    return `
You are RougePulse, an expert economic calendar analyst with a deep understanding of market narratives.

TASK:
Analyze the economic events and news context to provide a strategic market assessment.
Focus on the "WHY" - why does this data matter for Bitcoin (BTC) and S&P 500 (ES)?

ECONOMIC EVENTS:
${JSON.stringify(events, null, 2)}

MARKET NEWS CONTEXT (ZeroHedge/FinancialJuice):
${newsContext || "No specific news context available."}

INSTRUCTIONS:
1. **Score the Impact**: Instead of just High/Low, assign an "Impact Score" (0-100) for the session.
2. **Narrative Analysis**: Explain what the "Smart Money" or market pundits are saying. Does this data confirm a trend (e.g., "Soft Landing", "Reflation", "Recession")?
3. **Asset Specifics**: Explicitly state the likely impact on Bitcoin (BTC) and ES Futures.
4. **Cross-Reference**: If a news headline matches an event, use it to validate the sentiment.

REQUIRED JSON OUTPUT:
{
  "impact_score": number, // 0-100 (100 = Extreme Volatility/Importance)
  "market_narrative": "Detailed explanation of the current market story (e.g. 'Inflation is sticky, bad for tech').",
  "high_impact_events": [
    { 
      "event": "Name", 
      "actual_vs_forecast": "Description of deviation", 
      "significance": "Why this specific number matters now" 
    }
  ],
  "asset_analysis": {
    "ES_Futures": { "bias": "BULLISH|BEARISH", "reasoning": "..." },
    "Bitcoin": { "bias": "BULLISH|BEARISH", "reasoning": "..." }
  },
  "trading_recommendation": "Actionable advice based on the data + narrative."
}
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
      const clean = stdout
        .replace(/\x1b\[[0-9;]*m/g, '')
        .replace(/\x1b\[[0-9;]*[A-Z]/g, '');

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
                      const hasJsonStructure = content.includes('"impact_score"') && content.includes('"market_narrative"');
                      if (hasJsonStructure && content.length > maxJsonLength) {
                          bestContent = content;
                          maxJsonLength = content.length;
                      }
                  }
              }
          } catch (e) { /* Ignore */ }
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
      const jsonMatch = clean.match(/```json\s*(\{[\s\S]*?\})\s*```/) || clean.match(/\{[\s\S]*?\}/);

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
      } catch (e) {
          console.warn(`[${this.agentName}] Standard JSON parse failed, attempting repairs...`);

          // Repair 1: Remove trailing commas
          let repaired = jsonStr.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
          try { return JSON.parse(repaired); } catch (e2) {}

          // Repair 2: Smart completion based on structure
          const braceCount = (jsonStr.match(/{/g) || []).length - (jsonStr.match(/}/g) || []).length;
          const bracketCount = (jsonStr.match(/\[/g) || []).length - (jsonStr.match(/\]/g) || []).length;

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
          } catch (e3) {}

          // Repair 3: Try common truncation patterns for trading_recommendation
          const tradingRecommendationMatch = jsonStr.match(/"trading_recommendation"\s*:\s*"([^"]*)$/);
          if (tradingRecommendationMatch) {
              const partialValue = tradingRecommendationMatch[1];
              const fixedJson = jsonStr.replace(/"trading_recommendation"\s*:\s*"([^"]*)$/, `"trading_recommendation": "${partialValue}..."`);
              try {
                  console.log(`[${this.agentName}] Fixed trading_recommendation field`);
                  return JSON.parse(fixedJson);
              } catch (e4) {}
          }

          // Repair 4: Force complete object structure
          try { return JSON.parse(jsonStr + '}'); } catch (e5) {}
          try { return JSON.parse(jsonStr + ']}'); } catch (e6) {}
          try { return JSON.parse(jsonStr + '"}]}'); } catch (e7) {}

          console.warn(`[${this.agentName}] All repair attempts failed. JSON length: ${jsonStr.length}`);

          // Try to extract partial useful data
          try {
              const partial = this.extractPartialData(jsonStr);
              if (partial) {
                  console.log(`[${this.agentName}] Extracted partial data as fallback`);
                  return partial;
              }
          } catch (e8) {}

          return null;
      }
  }

  private extractPartialData(jsonStr: string): Record<string, unknown> | null {
      try {
          // Extract key fields even if JSON is malformed
          const impactMatch = jsonStr.match(/"impact_score"\s*:\s*(\d+)/);
          const narrativeMatch = jsonStr.match(/"market_narrative"\s*:\s*"([^"]{10,200})"/);
          const esBiasMatch = jsonStr.match(/"ES_Futures"\s*:\s*{\s*"bias"\s*:\s*"([^"]+)"/);
          const btcBiasMatch = jsonStr.match(/"Bitcoin"\s*:\s*{\s*"bias"\s*:\s*"([^"]+)"/);

          if (impactMatch || narrativeMatch || esBiasMatch || btcBiasMatch) {
              return {
                  impact_score: impactMatch ? parseInt(impactMatch[1]) : 25,
                  market_narrative: narrativeMatch ? narrativeMatch[1] : 'Analysis partially available',
                  asset_analysis: {
                      ES_Futures: { bias: esBiasMatch ? esBiasMatch[1] : 'NEUTRAL' },
                      Bitcoin: { bias: btcBiasMatch ? btcBiasMatch[1] : 'NEUTRAL' }
                  },
                  trading_recommendation: 'Partial analysis - trading recommendation truncated',
                  high_impact_events: [],
                  partial_data: true
              };
          }
      } catch (e) {
          console.warn(`[${this.agentName}] Partial data extraction failed:`, e);
      }
      return null;
  }
}
