import { XNewsScraper } from './XNewsScraper.js';
import { XNewsItem, XScrapingResult } from './interfaces.js';
import path from 'path';
import fs from 'fs';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export class XScraperService {
  private scraper: XNewsScraper;
  private pool: Pool;

  constructor() {
    this.scraper = new XNewsScraper();
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'financial_analyst',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
    });
  }

  /**
   * Classify news content by category using AI and finance keywords
   * X/Twitter sources get special prefix to distinguish from other data
   */
  private classifyNewsCategory(title: string, content: string, source: string): string {
    const text = `${title} ${content || ''}`.toLowerCase();

    // Check if this is an X/Twitter source first
    const sourceLower = source.toLowerCase();
    const isXTwitter = sourceLower.includes('x -') ||
                      sourceLower.includes('twitter') ||
                      sourceLower.includes('@') ||
                      sourceLower.includes('(') && source.includes(')');

    if (!isXTwitter) {
      return 'Non-X'; // Not X/Twitter content
    }

    // AI / Machine Learning keywords
    const aiKeywords = [
      'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning',
      'neural network', 'llm', 'large language model', 'gpt', 'claude', 'chatgpt',
      'openai', 'anthropic', 'transformer', 'diffusion', 'stable diffusion',
      'midjourney', 'dall-e', 'nlp', 'natural language processing',
      'reinforcement learning', 'tensorflow', 'pytorch', 'keras', 'scikit-learn',
      'data science', 'big data', 'algorithm', 'neural nets', 'cnn', 'rnn'
    ];

    // Finance / Economics keywords
    const financeKeywords = [
      'finance', 'economics', 'market', 'stock', 'trading', 'investment',
      'portfolio', 'hedge fund', 'venture capital', 'cryptocurrency', 'bitcoin',
      'ethereum', 'defi', 'banking', 'federal reserve', 'inflation',
      'gdp', 'recession', 'bull market', 'bear market', 'derivatives',
      'options', 'futures', 'forex', 'commodities', 'gold', 'silver',
      'oil', 'gas', 'energy', 'supply chain', 'employment', 'unemployment'
    ];

    // Technology keywords
    const techKeywords = [
      'technology', 'tech', 'software', 'hardware', 'programming', 'coding',
      'developer', 'software engineering', 'cloud computing', 'aws', 'azure',
      'google cloud', 'devops', 'kubernetes', 'docker', 'microservices',
      'api', 'rest', 'graphql', 'database', 'sql', 'nosql', 'mongodb',
      'postgresql', 'redis', 'javascript', 'python', 'java', 'c++', 'rust',
      'web3', 'blockchain', 'smart contract', 'metaverse', 'vr', 'ar',
      'iot', 'edge computing', '5g', 'cybersecurity', 'privacy', 'security'
    ];

    // Robotics / Hardware keywords
    const roboticsKeywords = [
      'robot', 'robotics', 'automation', 'manufacturing', '3d printing',
      'drone', 'uav', 'autonomous vehicle', 'self-driving', 'tesla',
      'electric vehicle', 'ev', 'battery', 'semiconductor', 'chip', 'nvidia',
      'amd', 'intel', 'qualcomm', 'arm', 'cpu', 'gpu'
    ];

    // Count keyword matches
    const aiScore = aiKeywords.reduce((count, keyword) =>
      count + (text.includes(keyword) ? 1 : 0), 0);
    const financeScore = financeKeywords.reduce((count, keyword) =>
      count + (text.includes(keyword) ? 1 : 0), 0);
    const techScore = techKeywords.reduce((count, keyword) =>
      count + (text.includes(keyword) ? 1 : 0), 0);
    const roboticsScore = roboticsKeywords.reduce((count, keyword) =>
      count + (text.includes(keyword) ? 1 : 0), 0);

    // Determine primary category
    const scores = { AI: aiScore, Finance: financeScore, Technology: techScore, Robotics: roboticsScore };
    const maxScore = Math.max(...Object.values(scores));

    // Threshold for classification
    if (maxScore === 0) {
      return 'X-General';
    }

    // Return category with highest score
    const baseCategory = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] || 'General';
    return `X-${baseCategory}`;
  }

  /**
   * Run X/Twitter scraping with full lifecycle
   */
  async runScraping(opmlPath?: string): Promise<XScrapingResult> {
    try {
      console.log('=== Starting X/Twitter Scraper Service with Categories ===');

      await this.scraper.init();
      const result = await this.scraper.scrapeFromOpml(opmlPath);

      // Add category classification to each item
      console.log('🏷️  Classifying news items by category...');
      for (const item of result.items) {
        item.category = this.classifyNewsCategory(item.title, item.content || '', item.source);
      }

      console.log(`=== X Scraper Results with Categories ===`);
      console.log(`Success: ${result.success}`);
      console.log(`Total Items: ${result.totalItems}`);
      console.log(`Processed Feeds: ${result.processedFeeds}`);
      console.log(`Errors: ${result.errors.length}`);

      if (result.errors.length > 0) {
        console.log('Errors:');
        result.errors.forEach(error => console.log(` - ${error}`));
      }

      return result;
    } catch (error: any) {
      console.error('X Scraper Service failed:', error);
      return {
        success: false,
        items: [],
        errors: [`Service error: ${error instanceof Error ? error.message : String(error)}`],
        processedFeeds: 0,
        totalItems: 0,
      };
    } finally {
      await this.scraper.close();
    }
  }

  /**
   * Save scraped items to JSON file
   */
  async saveToJson(items: XNewsItem[], outputPath?: string): Promise<void> {
    const filePath = outputPath || path.join(process.cwd(), 'x_news_items_with_categories.json');

    try {
      const data = {
        scraped_at: new Date().toISOString(),
        total_items: items.length,
        items: items,
      };

      await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
      console.log(`📄 Saved ${items.length} X items with categories to ${filePath}`);
    } catch (error) {
      console.error(`Failed to save X items to ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Save scraped items to Database with category classification
   */
  async saveToDatabase(items: XNewsItem[]): Promise<void> {
    if (items.length === 0) return;

    const client = await this.pool.connect();
    try {
      console.log(`💾 Saving ${items.length} items to database with X-category classification...`);

      // Ensure table exists with category column
      await client.query(`
        CREATE TABLE IF NOT EXISTS news_items (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title VARCHAR(1000) NOT NULL,
            source VARCHAR(1000) NOT NULL,
            url TEXT,
            content TEXT,
            sentiment VARCHAR(20),
            category VARCHAR(50),
            published_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(title, source, published_at)
        );
      `);

      let savedCount = 0;
      const categoryCounts: Record<string, number> = { 'X-AI': 0, 'X-Finance': 0, 'X-Technology': 0, 'X-Robotics': 0, 'X-General': 0 };

      for (const item of items) {
        try {
          // Classify news item
          const category = this.classifyNewsCategory(item.title, item.content || '', item.source);
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;

          await client.query(
            `
                INSERT INTO news_items (title, source, url, content, sentiment, category, published_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (title, source, published_at)
                DO UPDATE SET
                  content = EXCLUDED.content,
                  url = EXCLUDED.url,
                  category = EXCLUDED.category,
                  updated_at = NOW()
                WHERE
                  news_items.content IS NULL
                  OR length(news_items.content) < 50
                  OR length(EXCLUDED.content) > length(COALESCE(news_items.content, ''))
                  OR news_items.category IS NULL
                  OR news_items.category != EXCLUDED.category
            `,
            [
              item.title,
              item.source,
              item.url,
              item.content || null,
              item.sentiment || 'neutral',
              category,
              item.published_at,
            ]
          );
          savedCount++;
        } catch (e) {
          console.warn(`Failed to save item: ${item.title}`, e);
        }
      }
      console.log(`✅ Successfully saved ${savedCount} items to database`);
      console.log(`📊 Category distribution:`);
      Object.entries(categoryCounts).forEach(([category, count]) => {
        if (count > 0) {
          console.log(`   • ${category}: ${count} items`);
        }
      });
    } catch (error) {
      console.error('❌ Database error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Close scraper service
   */
  async close(): Promise<void> {
    await this.pool.end();
  }

  /**
   * Get default OPML file path
   */
  getDefaultOpmlPath(): string {
    return path.join(process.cwd(), 'ia.opml');
  }

  /**
   * Check if OPML file exists
   */
  async opmlFileExists(opmlPath?: string): Promise<boolean> {
    const pathToCheck = opmlPath || this.getDefaultOpmlPath();
    try {
      await fs.promises.access(pathToCheck);
      return true;
    } catch {
      return false;
    }
  }
}

// Standalone execution
console.log('Checking execution context:', import.meta.url, process.argv[1]);
// Convert process.argv[1] to file URL format for comparison if needed, or just loosely check
const isRunningDirectly = import.meta.url === `file://${process.argv[1]}` ||
                          process.argv[1].endsWith('XScraperService.ts') ||
                          process.argv[1].endsWith('XScraperService_fixed.ts');

if (isRunningDirectly) {
  const service = new XScraperService();

  const opmlPath = process.argv[2];

  service
    .opmlFileExists(opmlPath)
    .then((exists: boolean) => {
      if (!exists) {
        console.error('OPML file not found:', opmlPath || service.getDefaultOpmlPath());
        process.exit(1);
      }

      return service.runScraping(opmlPath);
    })
    .then(async (result: XScrapingResult) => {
      if (result.success && result.items.length > 0) {
        await service.saveToJson(result.items);
        await service.saveToDatabase(result.items);
        console.log('✅ X scraping with categories completed successfully');
      } else {
        console.log('⚠️  X scraping completed with no items or errors');
      }
      await service.close();
      process.exit(0);
    })
    .catch(async (error: unknown) => {
      console.error('❌ X scraping service failed:', error);
      await service.close();
      process.exit(1);
    });
}
