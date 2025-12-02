import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

export interface RougePulseAnalysis {
  id?: string;
  analysis_date: Date;
  volatility_score: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  critical_alerts: any[];
  market_movers: any[];
  critical_events: any[];
  high_impact_events: any[];
  medium_impact_events: any[];
  low_impact_events: any[];
  next_24h_alerts: any[];
  summary: string;
  upcoming_schedule?: any;
  data_source: string;
  status: string;
}

export class RougePulseDatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'financial_analyst',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '9022',
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('✅ RougePulse Database connection successful');
      return true;
    } catch (error) {
      console.error('❌ RougePulse Database connection failed:', error);
      return false;
    }
  }

  async saveAnalysis(analysis: RougePulseAnalysis): Promise<string | null> {
    if (!this.pool) {
      console.log('🔌 Database disabled - skipping save');
      return null;
    }

    const client = await this.pool.connect();
    try {
      // Créer la table si elle n'existe pas
      await client.query(`
        CREATE TABLE IF NOT EXISTS rouge_pulse_analyses_v2 (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            analysis_date TIMESTAMP WITH TIME ZONE,
            volatility_score DECIMAL(3,1),
            critical_count INTEGER,
            high_count INTEGER,
            medium_count INTEGER,
            low_count INTEGER,
            critical_alerts JSONB,
            market_movers JSONB,
            critical_events JSONB,
            high_impact_events JSONB,
            medium_impact_events JSONB,
            low_impact_events JSONB,
            next_24h_alerts JSONB,
            next_24h_alerts JSONB,
            summary TEXT,
            upcoming_schedule JSONB,
            data_source VARCHAR(100),
            status VARCHAR(50),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(analysis_date)
        );
      `);

      const result = await client.query(
        `
          INSERT INTO rouge_pulse_analyses_v2 (
            volatility_score,
            critical_count,
            high_count,
            medium_count,
            low_count,
            critical_alerts,
            market_movers,
            critical_events,
            high_impact_events,
            medium_impact_events,
            low_impact_events,
            next_24h_alerts,
            summary,
            upcoming_schedule,
            data_source,
            status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          ON CONFLICT (analysis_date)
          DO UPDATE SET
            volatility_score = EXCLUDED.volatility_score,
            critical_count = EXCLUDED.critical_count,
            high_count = EXCLUDED.high_count,
            medium_count = EXCLUDED.medium_count,
            low_count = EXCLUDED.low_count,
            critical_alerts = EXCLUDED.critical_alerts,
            market_movers = EXCLUDED.market_movers,
            critical_events = EXCLUDED.critical_events,
            high_impact_events = EXCLUDED.high_impact_events,
            medium_impact_events = EXCLUDED.medium_impact_events,
            low_impact_events = EXCLUDED.low_impact_events,
            next_24h_alerts = EXCLUDED.next_24h_alerts,
            summary = EXCLUDED.summary,
            upcoming_schedule = EXCLUDED.upcoming_schedule,
            data_source = EXCLUDED.data_source,
            status = EXCLUDED.status,
            created_at = NOW()
          RETURNING id
        `,
        [
          analysis.volatility_score,
          analysis.critical_count,
          analysis.high_count,
          analysis.medium_count,
          analysis.low_count,
          JSON.stringify(analysis.critical_alerts || []),
          JSON.stringify(analysis.market_movers || []),
          JSON.stringify(analysis.critical_events || []),
          JSON.stringify(analysis.high_impact_events || []),
          JSON.stringify(analysis.medium_impact_events || []),
          JSON.stringify(analysis.low_impact_events || []),
          JSON.stringify(analysis.next_24h_alerts || []),
          analysis.summary,
          JSON.stringify(analysis.upcoming_schedule || {}),
          analysis.data_source,
          analysis.status || 'success',
        ]
      );

      const analysisId = result.rows[0]?.id;
      console.log(`💾 Analysis saved to database with ID: ${analysisId}`);
      return analysisId;
    } catch (error) {
      console.error('❌ Error saving RougePulse analysis:', error);
      return null;
    } finally {
      client.release();
    }
  }

  async getLatestAnalysis(): Promise<RougePulseAnalysis | null> {
    if (!this.pool) {
      console.log('🔌 Database disabled - returning null');
      return null;
    }

    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM rouge_pulse_analyses_v2
         ORDER BY analysis_date DESC
         LIMIT 1`
      );

      if (result.rows.length > 0) {
        const row = result.rows[0];
        return {
          id: row.id,
          analysis_date: row.analysis_date,
          volatility_score: parseFloat(row.volatility_score),
          critical_count: row.critical_count,
          high_count: row.high_count,
          medium_count: row.medium_count,
          low_count: row.low_count,
          critical_alerts: JSON.parse(row.critical_alerts || '[]'),
          market_movers: JSON.parse(row.market_movers || '[]'),
          critical_events: JSON.parse(row.critical_events || '[]'),
          high_impact_events: JSON.parse(row.high_impact_events || '[]'),
          medium_impact_events: JSON.parse(row.medium_impact_events || '[]'),
          low_impact_events: JSON.parse(row.low_impact_events || '[]'),
          next_24h_alerts: JSON.parse(row.next_24h_alerts || '[]'),
          summary: row.summary,
          upcoming_schedule: JSON.parse(row.upcoming_schedule || '{}'),
          data_source: row.data_source,
          status: row.status,
        };
      }

      return null;
    } catch (error) {
      console.error('❌ Error fetching latest RougePulse analysis:', error);
      return null;
    } finally {
      client.release();
    }
  }

  async getAnalysisById(id: string): Promise<RougePulseAnalysis | null> {
    if (!this.pool) return null;

    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM rouge_pulse_analyses_v2 WHERE id = $1', [
        id,
      ]);

      if (result.rows.length > 0) {
        const row = result.rows[0];
        return {
          id: row.id,
          analysis_date: row.analysis_date,
          volatility_score: parseFloat(row.volatility_score),
          critical_count: row.critical_count,
          high_count: row.high_count,
          medium_count: row.medium_count,
          low_count: row.low_count,
          critical_alerts: JSON.parse(row.critical_alerts || '[]'),
          market_movers: JSON.parse(row.market_movers || '[]'),
          critical_events: JSON.parse(row.critical_events || '[]'),
          high_impact_events: JSON.parse(row.high_impact_events || '[]'),
          medium_impact_events: JSON.parse(row.medium_impact_events || '[]'),
          low_impact_events: JSON.parse(row.low_impact_events || '[]'),
          next_24h_alerts: JSON.parse(row.next_24h_alerts || '[]'),
          summary: row.summary,
          upcoming_schedule: JSON.parse(row.upcoming_schedule || '{}'),
          data_source: row.data_source,
          status: row.status,
        };
      }

      return null;
    } catch (error) {
      console.error('❌ Error fetching RougePulse analysis by ID:', error);
      return null;
    } finally {
      client.release();
    }
  }

  async getRecentAnalyses(daysBack: number = 7): Promise<RougePulseAnalysis[]> {
    if (!this.pool) return [];

    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM rouge_pulse_analyses_v2
         WHERE analysis_date >= NOW() - INTERVAL '${daysBack} days'
         ORDER BY analysis_date DESC
         LIMIT 10`,
        [daysBack]
      );

      return result.rows.map(row => ({
        id: row.id,
        analysis_date: row.analysis_date,
        volatility_score: parseFloat(row.volatility_score),
        critical_count: row.critical_count,
        high_count: row.high_count,
        medium_count: row.medium_count,
        low_count: row.low_count,
        critical_alerts: JSON.parse(row.critical_alerts || '[]'),
        market_movers: JSON.parse(row.market_movers || '[]'),
        critical_events: JSON.parse(row.critical_events || '[]'),
        high_impact_events: JSON.parse(row.high_impact_events || '[]'),
        medium_impact_events: JSON.parse(row.medium_impact_events || '[]'),
        low_impact_events: JSON.parse(row.low_impact_events || '[]'),
        next_24h_alerts: JSON.parse(row.next_24h_alerts || '[]'),
        summary: row.summary,
        upcoming_schedule: JSON.parse(row.upcoming_schedule || '{}'),
        data_source: row.data_source,
        status: row.status,
      }));
    } catch (error) {
      console.error('❌ Error fetching recent RougePulse analyses:', error);
      return [];
    } finally {
      client.release();
    }
  }

  async getEconomicEvents(startDate: Date, endDate: Date): Promise<any[]> {
    if (!this.pool) return [];

    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM economic_events
         WHERE event_date >= $1 AND event_date <= $2
         ORDER BY event_date ASC`,
        [startDate, endDate]
      );
      return result.rows;
    } catch (error) {
      console.error('❌ Error fetching economic events:', error);
      return [];
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      console.log('🔌 RougePulse Database connection closed');
    } else {
      console.log('🔌 RougePulse Memory-only mode - no connection to close');
    }
  }
}
