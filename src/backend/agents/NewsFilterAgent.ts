import { BaseAgentSimple, AgentRequest } from './BaseAgentSimple';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import pathModule from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { XScraperService } from '../../x_scraper/XScraperService.js';
import { XNewsItem, XScrapingResult } from '../../x_scraper/interfaces.js';

dotenv.config();

interface NewsItemToFilter {
  id: string;
  title: string;
  content: string;
  source: string;
}

interface FilterResult {
  id: string;
  relevance_score: number;
  category: 'CODE' | 'AI' | 'FINANCE' | 'OTHER';
  processing_status: 'RELEVANT' | 'IRRELEVANT';
  summary: string;
}

export class NewsFilterAgent extends BaseAgentSimple {
  private pool: Pool;
  private xScraperService: XScraperService;

  constructor() {
    super('NewsFilterAgent');
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'financial_analyst',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '9022',
    });
    this.xScraperService = new XScraperService();
  }

  public async runFilterCycle(): Promise<void> {
    console.log(`[${this.agentName}] Starting enhanced filter cycle with X scraper integration...`);

    try {
      // Step 1: Scrape fresh X/Twitter news first
      console.log(`[${this.agentName}] 🐦 Scraping fresh X/Twitter news...`);
      await this.scrapeAndSaveXNews();

      // Step 2: Process all pending items (including fresh X news)
      console.log(`[${this.agentName}] 📋 Fetching pending items for filtering...`);
      const pendingItems = await this.fetchPendingItems();
      if (pendingItems.length === 0) {
        console.log(`[${this.agentName}] No pending items to filter.`);
        return;
      }

      console.log(`[${this.agentName}] Found ${pendingItems.length} pending items for filtering.`);

      // Process in batches of 5
      const batchSize = 5;
      let processedBatches = 0;
      for (let i = 0; i < pendingItems.length; i += batchSize) {
        const batch = pendingItems.slice(i, i + batchSize);
        console.log(
          `[${this.agentName}] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(pendingItems.length / batchSize)} (${batch.length} items)`
        );
        await this.processBatch(batch);
        processedBatches++;

        // Small delay between batches to avoid overwhelming the AI
        if (processedBatches % 2 === 0) {
          console.log(`[${this.agentName}] ⏸️ Brief pause between batches...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(
        `[${this.agentName}] ✅ Filter cycle completed: ${pendingItems.length} items processed`
      );
    } catch (error) {
      console.error(`[${this.agentName}] ❌ Error in enhanced filter cycle:`, error);
    }
  }

  /**
   * Step 1: Scrape and save fresh X/Twitter news
   */
  private async scrapeAndSaveXNews(): Promise<void> {
    try {
      console.log(`[${this.agentName}] 🐦 Initializing X scraper service...`);

      // Check if OPML file exists
      const opmlExists = await this.xScraperService.opmlFileExists();
      if (!opmlExists) {
        console.log(`[${this.agentName}] ⚠️ OPML file not found, skipping X scraping`);
        return;
      }

      const result = await this.xScraperService.runScraping();

      if (result.success && result.items.length > 0) {
        console.log(`[${this.agentName}] 📥 Successfully scraped ${result.items.length} X items`);

        // Convert XNewsItem to database format
        const xNewsItems = result.items.map((xItem: XNewsItem) => ({
          title: xItem.title,
          source: xItem.source,
          url: xItem.url,
          content: xItem.content,
          sentiment: xItem.sentiment || 'neutral',
          published_at: new Date(xItem.published_at),
        }));

        // Save to database
        await this.saveXNewsToDatabase(xNewsItems);

        // Also save to JSON for backup
        await this.xScraperService.saveToJson(result.items);
      } else {
        console.log(`[${this.agentName}] ⚠️ X scraping returned no items or failed`);
        if (result.errors.length > 0) {
          console.log(`[${this.agentName}] X scraper errors:`, result.errors);
        }
      }
    } catch (error) {
      console.error(`[${this.agentName}] ❌ Error during X news scraping:`, error);
    }
  }

  /**
   * Save X news items to the same database table as other news
   */
  private async saveXNewsToDatabase(xNewsItems: any[]): Promise<void> {
    if (!xNewsItems || xNewsItems.length === 0) return;

    const client = await this.pool.connect();
    try {
      // Create table if not exists (same as NewsAggregator)
      await client.query(`
        CREATE TABLE IF NOT EXISTS news_items (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title VARCHAR(1000) NOT NULL,
            source VARCHAR(100) NOT NULL,
            url TEXT,
            content TEXT,
            sentiment VARCHAR(20),
            published_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            processing_status VARCHAR(20) DEFAULT 'raw',
            UNIQUE(title, source, published_at)
        );
      `);

      let savedCount = 0;
      for (const item of xNewsItems) {
        try {
          await client.query(
            `
            INSERT INTO news_items (title, source, url, content, sentiment, published_at, processing_status)
            VALUES ($1, $2, $3, $4, $5, $6, 'raw')
            ON CONFLICT (title, source, published_at) DO NOTHING
            `,
            [
              item.title,
              item.source,
              item.url,
              item.content || null,
              item.sentiment,
              item.published_at,
            ]
          );
          savedCount++;
        } catch (e) {
          console.error(`[${this.agentName}] Failed to save X news item ${item.title}:`, e);
        }
      }

      console.log(
        `[${this.agentName}] 💾 Saved ${savedCount}/${xNewsItems.length} X news items to database`
      );
    } catch (error) {
      console.error(`[${this.agentName}] Database error saving X news:`, error);
    } finally {
      client.release();
    }
  }

  private async fetchPendingItems(): Promise<NewsItemToFilter[]> {
    const client = await this.pool.connect();
    try {
      const res = await client.query(`
        SELECT id, title, content, source
        FROM news_items
        WHERE processing_status IN ('PENDING', 'raw', 'processed')
        ORDER BY created_at DESC
        LIMIT 50
      `);
      return res.rows;
    } finally {
      client.release();
    }
  }

  private async processBatch(batch: NewsItemToFilter[]): Promise<void> {
    const prompt = this.buildPrompt(batch);

    const req: AgentRequest = {
      prompt,
      outputFile: `data/agent-data/${this.agentName}/last_batch.json`,
    };

    try {
      // We override the default parsing logic by handling the raw output here if needed,
      // but BaseAgentSimple calls parseKiloCodeOutput.
      // We need to override parseKiloCodeOutput to handle our specific list format.
      // However, BaseAgentSimple.parseKiloCodeOutput is private.
      // We will just use callKiloCode and expect it to return something,
      // but since the base class implementation is strict about "sentiment" fields,
      // we might need to copy the execution logic or make the base class more flexible.
      //
      // Actually, looking at BaseAgentSimple, it enforces 'sentiment', 'score', etc.
      // This is too restrictive for us.
      // I will implement a custom execute method here that reuses the shell execution but parses differently.

      const results = await this.executeAndParse(req);
      await this.updateDatabase(results);
    } catch (error) {
      console.error(`[${this.agentName}] Failed to process batch:`, error);
    }
  }

  private buildPrompt(batch: NewsItemToFilter[]): string {
    const itemsJson = JSON.stringify(
      batch.map(b => ({
        id: b.id,
        title: b.title,
        content: b.content?.substring(0, 500) || b.title,
        source: b.source,
      })),
      null,
      2
    );

    return `
You are an expert content curator for a Financial & Tech community.
Your task is to filter the following news items based on their relevance to:
1. CODE / DEVELOPMENT (Web, Software, Tools)
2. ARTIFICIAL INTELLIGENCE (LLMs, ML, Research)
3. FINANCE / STOCK MARKET (Trading, Economy, Crypto)

IMPORTANT: Pay special attention to items from X/Twitter sources:
- These are often real-time market insights, tech announcements, or expert opinions
- Even short tweets can be highly relevant if they contain significant information
- Look for alpha content: insider insights, early news, market signals
- Prioritize content from verified accounts or industry experts

Items unrelated to these topics (e.g. politics, celebrity gossip, general entertainment) should be marked as OTHER and IRRELEVANT.

Input Items:
${itemsJson}

Return a JSON object with a "results" array containing an object for EACH input item with:
- "id": (same as input)
- "relevance_score": (0-10, where 10 is highly relevant)
- "category": "CODE", "AI", "FINANCE", or "OTHER"
- "processing_status": "RELEVANT" (if score >= 6) or "IRRELEVANT"
- "summary": (1 sentence summary in English)

SCORING GUIDELINES:
- X/Twitter items get +1 bonus for being real-time
- Market-moving content: 8-10
- Tech announcements: 7-9
- Expert analysis: 6-8
- General financial news: 5-7
- Off-topic content: 0-4

IMPORTANT: Return ONLY valid JSON. No markdown formatting. Summary MUST be in English.
`;
  }

  // Re-implementing execution logic to handle NDJSON and extract results
  private async executeAndParse(req: AgentRequest): Promise<FilterResult[]> {
    const execAsync = promisify(exec);

    const cacheDir = pathModule.join(process.cwd(), 'cache');
    try {
      await fs.mkdir(cacheDir, { recursive: true });
    } catch (e) {
      // ignore if exists
    }

    const tempPromptPath = pathModule.join(cacheDir, `temp_prompt_${Date.now()}.txt`);
    const cachePath = pathModule.join(cacheDir, `kilocode_cache_${Date.now()}.md`);

    await fs.writeFile(tempPromptPath, req.prompt, 'utf-8');
    console.log(`\n📝 PROMPT ENVOYÉ À KILOCODE:`);
    console.log('='.repeat(80));
    console.log(req.prompt.substring(0, 500) + '...');
    console.log('='.repeat(80));

    // Use 'type' for Windows compatibility instead of 'cat'
    const command = `type "${tempPromptPath}" | kilocode -m ask --auto --json > "${cachePath}"`;

    try {
      await execAsync(command, { timeout: 120000 });

      // Read the raw output
      const rawOutput = await fs.readFile(cachePath, 'utf-8');
      console.log(`\n📥 RÉPONSE BRUTE DE KILOCODE (taille: ${rawOutput.length} chars)`);

      // Strategy 0: Parse NDJSON (Newline Delimited JSON) - Primary Strategy
      console.log(`\n🔍 STRATÉGIE 0: Parsing NDJSON`);
      const lines = rawOutput.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        try {
          // Clean ANSI codes and find start of JSON
          const cleanLine = line.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '').trim();
          const jsonStartIndex = cleanLine.indexOf('{');

          if (jsonStartIndex === -1) continue;

          const jsonStr = cleanLine.substring(jsonStartIndex);
          const event = JSON.parse(jsonStr);

          // Check for completion_result with metadata
          if (event.type === 'say' && event.say === 'completion_result') {
            // Check metadata first (most reliable)
            if (event.metadata && event.metadata.results && Array.isArray(event.metadata.results)) {
              console.log(
                `✅ Stratégie 0a (Metadata) réussie: ${event.metadata.results.length} résultats`
              );
              return event.metadata.results as FilterResult[];
            }

            // Check content if metadata failed
            if (event.content) {
              try {
                const contentJson = JSON.parse(event.content);
                if (contentJson.results && Array.isArray(contentJson.results)) {
                  console.log(
                    `✅ Stratégie 0b (Content JSON) réussie: ${contentJson.results.length} résultats`
                  );
                  return contentJson.results as FilterResult[];
                }
              } catch (e) {
                // Content might not be pure JSON, ignore
              }
            }
          }
        } catch (e) {
          // Ignore non-JSON lines or parse errors
        }
      }

      // Fallback Strategies (for non-NDJSON output or if NDJSON parsing failed)

      // Strategy 1: Find JSON object with "results"
      const jsonMatch = rawOutput.match(/\{[\s\S]*"results"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          console.log(`\n🔍 STRATÉGIE 1: JSON avec "results" trouvé`);
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed.results)) {
            console.log(`✅ Stratégie 1 réussie: ${parsed.results.length} résultats`);
            return parsed.results as FilterResult[];
          }
        } catch (e) {
          console.log(`❌ Stratégie 1 échouée: ${e}`);
        }
      }

      // Strategy 2: Find any JSON array
      const arrayMatch = rawOutput.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        try {
          console.log(`\n🔍 STRATÉGIE 2: Tableau JSON trouvé`);
          const parsed = JSON.parse(arrayMatch[0]);
          if (Array.isArray(parsed)) {
            console.log(`✅ Stratégie 2 réussie: ${parsed.length} résultats`);
            return parsed as FilterResult[];
          }
        } catch (e) {
          console.log(`❌ Stratégie 2 échouée: ${e}`);
        }
      }

      // Strategy 3: Extract from markdown code blocks
      const codeBlockMatch = rawOutput.match(/```(?:json)?\s*(\{[\s\S]*?\}|\[[\s\S]*?\])\s*```/);
      if (codeBlockMatch) {
        try {
          console.log(`\n🔍 STRATÉGIE 3: JSON dans block de code trouvé`);
          const parsed = JSON.parse(codeBlockMatch[1]);
          if (parsed.results && Array.isArray(parsed.results)) {
            console.log(`✅ Stratégie 3a réussie: ${parsed.results.length} résultats`);
            return parsed.results as FilterResult[];
          } else if (Array.isArray(parsed)) {
            console.log(`✅ Stratégie 3b réussie: ${parsed.length} résultats`);
            return parsed as FilterResult[];
          }
        } catch (e) {
          console.log(`❌ Stratégie 3 échouée: ${e}`);
        }
      }

      console.log(`\n💥 TOUTES LES STRATÉGIES ONT ÉCHOUÉ`);
      console.log(`📄 Output sauvegardé dans: ${cachePath}`);

      const errorLog = `
Timestamp: ${new Date().toISOString()}
Error: Could not parse JSON results
Raw Output Preview:
${rawOutput.substring(0, 1000)}
      `;
      await fs.writeFile('agent_error.log', errorLog, 'utf-8');

      throw new Error('Could not parse JSON results from LLM output - see cache file');
    } finally {
      try {
        await fs.unlink(tempPromptPath);
      } catch {
        // Ignore cleanup errors
      }
      // Ne pas supprimer le fichier cache pour débogage
      console.log(`\n📄 Cache Kilocode sauvegardé: ${cachePath}`);
    }
  }

  private async updateDatabase(results: FilterResult[]): Promise<void> {
    const client = await this.pool.connect();
    try {
      for (const res of results) {
        await client.query(
          `
          UPDATE news_items 
          SET 
            relevance_score = $1,
            category = $2,
            processing_status = 'processed',
            content = CASE WHEN content IS NULL THEN $3 ELSE content END -- Update content with summary if empty? No, maybe just keep it.
          WHERE id = $4
        `,
          [res.relevance_score, res.category, res.summary, res.id]
        );

        console.log(
          `[${this.agentName}] Updated item ${res.id}: ${res.category} (${res.relevance_score}/10) -> processed (was ${res.processing_status})`
        );
      }
    } finally {
      client.release();
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }
}

// Standalone execution
const __filename = pathModule.resolve(process.argv[1]);
if (process.argv[1] === __filename) {
  const agent = new NewsFilterAgent();
  agent.runFilterCycle().then(() => agent.close());
}
