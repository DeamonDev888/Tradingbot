import * as path from 'path';
import * as fs from 'fs';
import * as cheerio from 'cheerio';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { NewsScraper } from './NewsScraper';
import { parseOpml, XFeed } from './opml_parser';

dotenv.config();

interface NewsItem {
  title: string;
  source: string;
  url: string;
  content?: string;
  sentiment?: string;
  published_at: Date;
}

export class OpmlIngestionScript {
  private pool: Pool;
  private newsScraper: NewsScraper;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'financial_analyst',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '9022',
    });
    this.newsScraper = new NewsScraper();
  }

  async run(opmlFilePath: string): Promise<void> {
    try {
      console.log(`Starting OPML Ingestion from: ${opmlFilePath}`);

      if (!fs.existsSync(opmlFilePath)) {
        console.error(`OPML file not found: ${opmlFilePath}`);
        return;
      }

      const feeds = parseOpml(opmlFilePath);
      console.log(`Found ${feeds.length} feeds in OPML.`);

      await this.newsScraper.init();

      // Process feeds in chunks to avoid overwhelming resources
      const chunkSize = 5;
      for (let i = 0; i < feeds.length; i += chunkSize) {
        const chunk = feeds.slice(i, i + chunkSize);
        console.log(
          `Processing chunk ${i / chunkSize + 1} of ${Math.ceil(feeds.length / chunkSize)}...`
        );

        await Promise.all(chunk.map(feed => this.processFeed(feed)));

        // Small delay between chunks
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      console.log('OPML Ingestion complete.');
    } catch (error) {
      console.error('Error in OPML Ingestion:', error);
    } finally {
      await this.newsScraper.close();
      await this.pool.end();
    }
  }

  private async processFeed(feed: XFeed): Promise<void> {
    console.log(`Fetching feed: ${feed.title} (${feed.xmlUrl})`);
    try {
      const pageContent = await this.newsScraper.fetchPageContent(feed.xmlUrl);

      let $ = cheerio.load(pageContent, { xmlMode: true });
      let entries = $('item').toArray();

      // Handle cases where Playwright returns HTML wrapping the XML
      if (entries.length === 0) {
        const $html = cheerio.load(pageContent);
        entries = $html('item').toArray();

        if (entries.length === 0) {
          const preText = $html('pre').text();
          if (preText) {
            const $xml = cheerio.load(preText, { xmlMode: true });
            entries = $xml('item').toArray();
            $ = $xml; // Update $ to use the XML context
          }
        } else {
          $ = $html as any; // Use HTML context if items found there
        }
      }

      // Limit to top 5 items per feed
      entries = entries.slice(0, 5);

      const newsItems: NewsItem[] = [];

      for (const element of entries) {
        const title = $(element).find('title').text().trim();
        const link = $(element).find('link').text().trim();
        const pubDateStr = $(element).find('pubDate').text().trim();
        const description = $(element).find('description').text().trim();

        if (title && link) {
          newsItems.push({
            title: title.substring(0, 200),
            source: `RSS - ${feed.title}`,
            url: link,
            content: description,
            sentiment: 'neutral',
            published_at: new Date(pubDateStr || new Date()),
          });
        }
      }

      await this.saveNewsToDatabase(newsItems);
    } catch (error) {
      console.error(
        `Failed to process feed ${feed.title}:`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  private async saveNewsToDatabase(news: NewsItem[]): Promise<void> {
    if (news.length === 0) return;

    const client = await this.pool.connect();
    try {
      // Ensure table exists (idempotent)
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
                UNIQUE(title, source, published_at)
            );
        `);

      for (const item of news) {
        try {
          await client.query(
            `
                INSERT INTO news_items (title, source, url, content, sentiment, published_at, processing_status)
                VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
                ON CONFLICT (title, source, published_at) 
                DO UPDATE SET 
                  content = EXCLUDED.content,
                  url = EXCLUDED.url,
                  processing_status = 'PENDING'
                WHERE 
                  news_items.content IS NULL 
                  OR length(news_items.content) < 50
                  OR length(EXCLUDED.content) > length(COALESCE(news_items.content, ''));
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
        } catch (e) {
          // Ignore duplicate key errors if logic above fails, but log others
          console.error(`Error saving item ${item.title}:`, e);
        }
      }
      console.log(`Saved ${news.length} items from ${news[0]?.source}`);
    } catch (error) {
      console.error('Database error:', error);
    } finally {
      client.release();
    }
  }
}

// Standalone execution
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  const script = new OpmlIngestionScript();
  const opmlFile = process.argv[2] || path.join(process.cwd(), 'ia.opml');
  script.run(opmlFile);
}
