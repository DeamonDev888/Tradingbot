import { NewsItem } from '../ingestion/NewsAggregator';
import { Pool } from 'pg';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

export interface NewsFingerprint {
  id: string;
  title_hash: string;
  content_hash?: string;
  url_hash: string;
  source: string;
  published_at: Date;
  created_at: Date;
}

export interface DeduplicationResult {
  unique: NewsItem[];
  duplicates: NewsItem[];
  duplicate_count: number;
}

export class NewsDeduplicationService {
  private pool: Pool;
  private similarityThreshold: number = 0.85; // 85% similarity threshold

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'financial_analyst',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
    });
  }

  /**
   * Initialize the deduplication database table
   */
  async initializeTable(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS news_fingerprints (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title_hash VARCHAR(64) NOT NULL,
          content_hash VARCHAR(64),
          url_hash VARCHAR(64) NOT NULL,
          source VARCHAR(500) NOT NULL,
          published_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(title_hash, source, published_at)
        );

        CREATE INDEX IF NOT EXISTS idx_news_fingerprints_title_hash ON news_fingerprints(title_hash);
        CREATE INDEX IF NOT EXISTS idx_news_fingerprints_url_hash ON news_fingerprints(url_hash);
        CREATE INDEX IF NOT EXISTS idx_news_fingerprints_published_at ON news_fingerprints(published_at);
      `);
      console.log('✅ News deduplication table initialized');
    } catch (error) {
      console.error('❌ Failed to initialize deduplication table:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Remove duplicate news items from a list
   */
  async deduplicate(newsItems: NewsItem[]): Promise<DeduplicationResult> {
    const unique: NewsItem[] = [];
    const duplicates: NewsItem[] = [];

    for (const item of newsItems) {
      const isDuplicate = await this.isDuplicate(item);
      if (isDuplicate) {
        duplicates.push(item);
      } else {
        unique.push(item);
        await this.saveFingerprint(item);
      }
    }

    return {
      unique,
      duplicates,
      duplicate_count: duplicates.length,
    };
  }

  /**
   * Check if a news item is a duplicate
   */
  private async isDuplicate(item: NewsItem): Promise<boolean> {
    const fingerprint = this.generateFingerprint(item);
    const client = await this.pool.connect();

    try {
      // Check for exact matches first (same title hash, source, and close published time)
      const exactMatchQuery = `
        SELECT id FROM news_fingerprints
        WHERE title_hash = $1
          AND source = $2
          AND published_at >= $3
          AND published_at <= $4
        LIMIT 1
      `;

      // Allow 1 hour window for published time to account for slight variations
      const publishedTime = new Date(item.timestamp);
      const timeWindowStart = new Date(publishedTime.getTime() - 60 * 60 * 1000); // 1 hour before
      const timeWindowEnd = new Date(publishedTime.getTime() + 60 * 60 * 1000); // 1 hour after

      const exactResult = await client.query(exactMatchQuery, [
        fingerprint.title_hash,
        item.source,
        timeWindowStart.toISOString(),
        timeWindowEnd.toISOString(),
      ]);

      if (exactResult.rows.length > 0) {
        return true;
      }

      // Check for similar content (if content is available)
      if (item.content && item.content.length > 100) {
        const similarQuery = `
          SELECT id FROM news_fingerprints
          WHERE content_hash = $1
            AND source = $2
            AND published_at >= $3
            AND published_at <= $4
          LIMIT 1
        `;

        const similarResult = await client.query(similarQuery, [
          fingerprint.content_hash,
          item.source,
          timeWindowStart.toISOString(),
          timeWindowEnd.toISOString(),
        ]);

        if (similarResult.rows.length > 0) {
          return true;
        }
      }

      // Check for URL duplicates
      const urlQuery = `
        SELECT id FROM news_fingerprints
        WHERE url_hash = $1
        LIMIT 1
      `;

      const urlResult = await client.query(urlQuery, [fingerprint.url_hash]);
      if (urlResult.rows.length > 0) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      return false; // In case of error, allow the item through
    } finally {
      client.release();
    }
  }

  /**
   * Save fingerprint of a news item
   */
  private async saveFingerprint(item: NewsItem): Promise<void> {
    const fingerprint = this.generateFingerprint(item);
    const client = await this.pool.connect();

    try {
      await client.query(
        `
          INSERT INTO news_fingerprints (title_hash, content_hash, url_hash, source, published_at)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (title_hash, source, published_at) DO NOTHING
        `,
        [
          fingerprint.title_hash,
          fingerprint.content_hash,
          fingerprint.url_hash,
          item.source,
          new Date(item.timestamp).toISOString(),
        ]
      );
    } catch (error) {
      console.error('Error saving fingerprint:', error);
      // Don't throw error to avoid breaking the pipeline
    } finally {
      client.release();
    }
  }

  /**
   * Generate a fingerprint for a news item
   */
  private generateFingerprint(item: NewsItem): Omit<NewsFingerprint, 'id' | 'created_at'> {
    // Normalize title for consistent hashing
    const normalizedTitle = this.normalizeText(item.title);
    const titleHash = crypto.createHash('sha256').update(normalizedTitle).digest('hex');

    // Hash URL
    const urlHash = crypto.createHash('sha256').update(item.url).digest('hex');

    // Hash content if available
    let contentHash: string | undefined;
    if (item.content && item.content.length > 50) {
      const normalizedContent = this.normalizeText(item.content);
      contentHash = crypto.createHash('sha256').update(normalizedContent).digest('hex');
    }

    return {
      title_hash: titleHash,
      content_hash: contentHash,
      url_hash: urlHash,
      source: item.source,
      published_at: new Date(item.timestamp),
    };
  }

  /**
   * Normalize text for consistent hashing
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, ' ') // normalize whitespace
      .replace(/[^\w\s]/g, '') // remove punctuation
      .trim();
  }

  /**
   * Clean old fingerprints (older than specified days)
   */
  async cleanOldFingerprints(daysToKeep: number = 30): Promise<number> {
    const client = await this.pool.connect();
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await client.query(
        'DELETE FROM news_fingerprints WHERE published_at < $1',
        [cutoffDate.toISOString()]
      );

      console.log(`🧹 Cleaned ${result.rowCount} old fingerprints older than ${daysToKeep} days`);
      return result.rowCount || 0;
    } catch (error) {
      console.error('Error cleaning old fingerprints:', error);
      return 0;
    } finally {
      client.release();
    }
  }

  /**
   * Get deduplication statistics
   */
  async getStats(): Promise<{
    total_fingerprints: number;
    oldest_fingerprint: Date | null;
    newest_fingerprint: Date | null;
  }> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT
          COUNT(*) as total_fingerprints,
          MIN(published_at) as oldest_fingerprint,
          MAX(published_at) as newest_fingerprint
        FROM news_fingerprints
      `);

      const row = result.rows[0];
      return {
        total_fingerprints: parseInt(row.total_fingerprints),
        oldest_fingerprint: row.oldest_fingerprint ? new Date(row.oldest_fingerprint) : null,
        newest_fingerprint: row.newest_fingerprint ? new Date(row.newest_fingerprint) : null,
      };
    } catch (error) {
      console.error('Error getting deduplication stats:', error);
      return {
        total_fingerprints: 0,
        oldest_fingerprint: null,
        newest_fingerprint: null,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}
