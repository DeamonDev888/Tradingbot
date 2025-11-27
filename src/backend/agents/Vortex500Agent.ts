import { BaseAgentSimple } from './BaseAgentSimple';
import { NewsAggregator, NewsItem } from '../ingestion/NewsAggregator';
import { NewsDatabaseService } from '../database/NewsDatabaseService';
import { ToonFormatter } from '../utils/ToonFormatter';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';

export class Vortex500Agent extends BaseAgentSimple {
  private newsAggregator: NewsAggregator;
  private dbService: NewsDatabaseService;
  private readonly execAsync: (
    command: string,
    options?: Record<string, unknown>
  ) => Promise<{ stdout: string; stderr: string }>;

  constructor() {
    super('vortex500-agent');
    this.newsAggregator = new NewsAggregator();
    this.dbService = new NewsDatabaseService();
    this.execAsync = promisify(exec);
  }

  /**
   * Analyse de sentiment robuste et finale
   */
  async analyzeMarketSentiment(_forceRefresh: boolean = false): Promise<Record<string, unknown>> {
    console.log(`[${this.agentName}] Starting ROBUST market sentiment analysis...`);

    try {
      // 1. Tester la connexion à la base de données
      const dbConnected = await this.dbService.testConnection();

      if (!dbConnected) {
        console.log(`[${this.agentName}] Database not connected`);
        return this.createNotAvailableResult('Database not available - agent uses database only');
      }

      console.log(`[${this.agentName}] Using DATABASE-ONLY mode - no scraping`);

      // 2. Obtenir les données UNIQUEMENT depuis la base de données
      let allNews: NewsItem[] = [];
      const cacheFresh = await this.dbService.isCacheFresh(2);
      console.log(`[${this.agentName}] Database cache status: ${cacheFresh ? 'FRESH' : 'STALE'}`);

      // Essayer d'abord les 48h récentes, puis étendre à 7 jours si nécessaire
      let cachedNews = await this.dbService.getNewsForAnalysis(48); // 48h de données
      let hoursUsed: number | null = 48;

      if (cachedNews.length === 0) {
        console.log(`[${this.agentName}] No processed news in last 48h, expanding to 7 days...`);
        cachedNews = await this.getNewsForAnalysisExtended(24 * 7); // 7 jours
        hoursUsed = 24 * 7;
      }

      if (cachedNews.length === 0) {
        console.log(
          `[${this.agentName}] No processed news in last 7 days, using all processed news...`
        );
        cachedNews = await this.getAllProcessedNews();
        hoursUsed = null;
      }

      allNews = cachedNews.map(item => ({
        title: item.title,
        url: item.url,
        source: item.source,
        timestamp: item.timestamp || new Date(),
        sentiment: item.sentiment,
      }));

      console.log(
        `[${this.agentName}] Using ${allNews.length} news items from DATABASE (${hoursUsed ? `last ${hoursUsed}h` : 'all time'})`
      );

      if (allNews.length === 0) {
        console.log(`[${this.agentName}] No news data available in database`);
        return this.createNotAvailableResult(
          'No news data in database - please run data ingestion first'
        );
      }

      // 2. Analyser les sentiments avec la solution finale robuste
      console.log(`[${this.agentName}] Analyzing ${allNews.length} news items from DATABASE...`);
      const result = await this.performRobustSentimentAnalysis(allNews, true);

      // 3. Sauvegarder si base de données disponible
      if (dbConnected) {
        await this.dbService.saveSentimentAnalysis(result);
      }

      return {
        ...result,
        data_source: cacheFresh ? 'database_cache' : 'database_fresh',
        news_count: allNews.length,
        analysis_method: 'robust_kilocode_v2',
      };
    } catch (error) {
      console.error(`[${this.agentName}] Analysis failed:`, error);
      return this.createNotAvailableResult(
        `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Récupère les news pour l'analyse avec paramètre personnalisé
   */
  private async getNewsForAnalysisExtended(hoursBack: number): Promise<NewsItem[]> {
    const client = await (this.dbService as any).pool.connect();
    try {
      const result = await client.query(`
        SELECT id, title, url, source, published_at, scraped_at,
               sentiment, confidence, keywords, market_hours, processing_status
        FROM news_items
        WHERE processing_status = 'processed'
          AND published_at >= NOW() - INTERVAL '${hoursBack} hours'
        ORDER BY published_at DESC
        LIMIT 100
      `);

      return result.rows.map((row: any) => {
        // Formater la date en format lisible
        const publishedDate = new Date(row.published_at);
        const formattedDate = publishedDate.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        // Nettoyer et normaliser le titre pour gérer les accents et l'encodage
        const cleanTitle = String(row.title)
          .replace(/confidentiel/g, 'confidentiel')
          .replace(/œ/g, 'oe')
          .replace(/æ/g, 'ae')
          .replace(/à/g, 'a')
          .replace(/é/g, 'e')
          .replace(/è/g, 'e')
          .replace(/ù/g, 'u');

        return {
          title: `${cleanTitle} [${formattedDate}]`,
          url: row.url,
          source: row.source,
          timestamp: publishedDate,
          sentiment: row.sentiment,
        };
      });
    } finally {
      client.release();
    }
  }

  /**
   * Récupère toutes les news traitées (sans limite de temps)
   */
  private async getAllProcessedNews(): Promise<NewsItem[]> {
    const client = await (this.dbService as any).pool.connect();
    try {
      const result = await client.query(`
        SELECT id, title, url, source, published_at, scraped_at,
               sentiment, confidence, keywords, market_hours, processing_status
        FROM news_items
        WHERE processing_status = 'processed'
        ORDER BY published_at DESC
        LIMIT 100
      `);

      return result.rows.map((row: any) => {
        // Formater la date en format lisible
        const publishedDate = new Date(row.published_at);
        const formattedDate = publishedDate.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        // Nettoyer et normaliser le titre pour gérer les accents et l'encodage
        const cleanTitle = String(row.title)
          .replace(/confidentiel/g, 'confidentiel')
          .replace(/œ/g, 'oe')
          .replace(/æ/g, 'ae')
          .replace(/à/g, 'a')
          .replace(/é/g, 'e')
          .replace(/è/g, 'e')
          .replace(/ù/g, 'u');

        return {
          title: `${cleanTitle} [${formattedDate}]`,
          url: row.url,
          source: row.source,
          timestamp: publishedDate,
          sentiment: row.sentiment,
        };
      });
    } finally {
      client.release();
    }
  }

  /**
   * Crée un résultat N/A standard
   */
  private createNotAvailableResult(reason: string): Record<string, unknown> {
    return {
      sentiment: 'N/A',
      score: null,
      catalysts: [],
      risk_level: 'N/A',
      summary: `Analyse indisponible : ${reason}`,
      data_source: 'error',
      news_count: 0,
      analysis_method: 'none',
    };
  }

  /**
   * Scraping robust des nouvelles
   */
  private async scrapeFreshNews(): Promise<NewsItem[]> {
    const sources = ['ZeroHedge', 'CNBC', 'FinancialJuice'];
    console.log(`[${this.agentName}] Scraping from ${sources.join(', ')}...`);

    try {
      const [zeroHedge, cnbc, financialJuice] = await Promise.allSettled([
        this.newsAggregator.fetchZeroHedgeHeadlines(),
        this.newsAggregator.fetchCNBCMarketNews(),
        this.newsAggregator.fetchFinancialJuice(),
      ]);

      const results = [zeroHedge, cnbc, financialJuice];
      const counts = results.map(r => (r.status === 'fulfilled' ? r.value.length : 0));
      const allNews: NewsItem[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allNews.push(...result.value);
          this.dbService.updateSourceStatus(sources[index], true);
        } else {
          console.error(`[${this.agentName}] Failed to scrape ${sources[index]}:`, result.reason);
          this.dbService.updateSourceStatus(
            sources[index],
            false,
            result.reason instanceof Error ? result.reason.message : 'Unknown error'
          );
        }
      });

      console.log(
        `[${this.agentName}] Scraped ${allNews.length} headlines (ZH: ${counts[0]}, CNBC: ${counts[1]}, FJ: ${counts[2]})`
      );
      return allNews;
    } catch (error) {
      console.error(`[${this.agentName}] Scraping failed:`, error);
      return [];
    }
  }

  /**
   * Analyse finale robuste avec fallback multiples
   */
  private async performRobustSentimentAnalysis(
    newsItems: NewsItem[],
    _useCache: boolean
  ): Promise<Record<string, unknown>> {
    console.log(`[${this.agentName}] Starting ROBUST analysis with fallback methods...`);

    // 1. Créer le prompt optimisé
    const toonData = ToonFormatter.arrayToToon(
      'headlines',
      newsItems.map(n => ({
        title: n.title,
        src: n.source,
      }))
    );

    const prompt = this.createOptimizedPrompt(toonData);

    console.log(`[${this.agentName}] Prompt length: ${prompt.length} chars`);

    // Réactiver l'affichage du prompt complet pour voir ce qui est envoyé
    console.log(`\n[${this.agentName}] 🔍 KILOCODE PROMPT SENT:`);
    console.log('='.repeat(80));
    console.log(prompt);
    console.log('='.repeat(80));

    // 2. Analyser avec KiloCode - PAS DE FALLBACK,直接 N/A
    try {
      return await this.tryKiloCodeDirect(prompt, newsItems.length);
    } catch (kilocodeError) {
      console.warn(
        `[${this.agentName}] KiloCode failed - returning N/A: ${kilocodeError instanceof Error ? kilocodeError.message : 'Unknown error'}`
      );

      // PAS DE FALLBACK - Retourner N/A comme demandé
      return this.createNotAvailableResult(
        `KiloCode analysis failed: ${kilocodeError instanceof Error ? kilocodeError.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Crée le prompt optimisé pour KiloCode avec nettoyage des accents
   */
  private createOptimizedPrompt(toonData: string): string {
    return `
You are an expert Market Sentiment Analyst for ES Futures (S&P 500).

TASK:
Analyze the provided TOON data and return valid JSON.

CRITICAL:
- Output ONLY the JSON object
- No markdown, no explanations
- Must be parseable by JSON.parse()
- **IMPORTANT: The 'summary' and 'catalysts' fields MUST be in FRENCH.**

EXAMPLE:
{
  "sentiment": "BEARISH",
  "score": -25,
  "catalysts": ["Baisse du Bitcoin", "Fed restrictive"],
  "risk_level": "HIGH",
  "summary": "Le sentiment de marché est négatif en raison de..."
}

STRUCTURE:
{
  "sentiment": "BULLISH" | "BEARISH" | "NEUTRAL",
  "score": number between -100 and 100,
  "catalysts": ["string (en Français)", "string (en Français)"],
  "risk_level": "LOW" | "MEDIUM" | "HIGH",
  "summary": "Brief explanation in French"
}

DATA:
${toonData}

RULES:
1. Analyze all headlines (News) AND Macro Data (FRED)
2. Macro Data (Yield Curve, Inflation, etc.) is CRITICAL for context
3. Return ONLY JSON
4. No conversational text
5. **WRITE IN FRENCH**
`;
  }

  /**
   * KiloCode DIRECT - Pas de fallback, N/A si échoue
   */
  private async tryKiloCodeDirect(
    prompt: string,
    newsCount: number
  ): Promise<Record<string, unknown>> {
    // Confirmer explicitement que les données viennent de la base de données
    console.log(`\n[${this.agentName}] 📊 DATABASE-ONLY PROCESS:`);
    console.log(`   ├─ Extracted ${newsCount} news items from PostgreSQL`);
    console.log(`   ├─ Creating database.md buffer with TOON format`);
    console.log(`   └─ No web scraping - pure database analysis`);

    console.log(`[${this.agentName}] 🚀 Executing KiloCode analysis...`);
    const result = await this.tryKiloCodeWithFile(prompt);
    console.log(`[${this.agentName}] ✅ KiloCode analysis successful!`);
    return result || this.createNotAvailableResult('KiloCode returned null');
  }

  /**
   * Approche 1: Fichier database.md buffer avec format TOON (le plus propre)
   */
  private async tryKiloCodeWithFile(prompt: string): Promise<Record<string, unknown>> {
    const bufferPath = `database.md`;

    // Créer le fichier buffer avec format Markdown + TOON
    const toonContent = this.createDatabaseBufferMarkdown(prompt);
    await fs.writeFile(bufferPath, toonContent, 'utf-8');

    try {
      // Utiliser la commande Windows appropriée (type sur Windows, cat sur Linux/Mac)
      const isWindows = process.platform === 'win32';
      const readCommand = isWindows ? `type "${bufferPath}"` : `cat "${bufferPath}"`;
      const command = `${readCommand} | kilocode -m ask --auto --json`;

      console.log(`[${this.agentName}] Using DATABASE.MD buffer: ${readCommand} | kilocode`);

      const { stdout } = await this.execAsync(command, {
        timeout: 90000,
        cwd: process.cwd(),
      });

      return this.parseRobustOutput(stdout);
    } finally {
      // Garder le fichier pour inspection (décommenter pour supprimer)
      // await fs.unlink(bufferPath).catch(() => {});
      console.log(`[${this.agentName}] 📄 Database buffer kept for inspection: ${bufferPath}`);
    }
  }

  /**
   * Crée le fichier buffer database.md avec format Markdown + TOON
   */
  private createDatabaseBufferMarkdown(prompt: string): string {
    // Extraire la section DATA du prompt pour l'afficher dans le buffer
    const dataMatch = prompt.match(/DATA:\n([\s\S]*?)RULES:/);
    const toonData = dataMatch ? dataMatch[1].trim() : 'No data found';

    return `
# Database Buffer - Market Sentiment Analysis

## 📊 Data Source: PostgreSQL Database
- **Extraction**: 22 news items from database
- **Mode**: DATABASE-ONLY (no web scraping)
- **Cache Status**: FRESH (within 2 hours)
- **Processing**: TOON format for KiloCode AI

## 📰 Database News Items (TOON Format)

\`\`\`
${toonData}
\`\`\`

## 🤖 AI Analysis Instructions

You are an expert Market Sentiment Analyst for ES Futures (S&P 500).

TASK: Analyze the TOON data above and return valid JSON.

CRITICAL:
- Output ONLY the JSON object
- No markdown, no explanations
- Must be parseable by JSON.parse()
- **IMPORTANT: The 'summary' and 'catalysts' fields MUST be in FRENCH.**

REQUIRED JSON STRUCTURE:
\`\`\`json
{
  "sentiment": "BULLISH" | "BEARISH" | "NEUTRAL",
  "score": number between -100 and 100,
  "catalysts": ["string (en Français)", "string (en Français)"],
  "risk_level": "LOW" | "MEDIUM" | "HIGH",
  "summary": "Brief explanation in French"
}
\`\`\`

RULES:
1. Analyze all headlines from database
2. Return ONLY JSON
3. No conversational text
4. **WRITE IN FRENCH**

---
*Generated: ${new Date().toISOString()}*
*Buffer: database.md*
`;
  }

  /**
   * Parsing robust avec nettoyage ANSI et fallback multiples
   */
  private parseRobustOutput(stdout: string): Record<string, unknown> {
    console.log(`[${this.agentName}] Parsing robust output (${stdout.length} chars)...`);

    try {
      // Nettoyage amélioré des séquences ANSI et caractères de contrôle
      const cleanOutput = this.stripAnsiCodes(stdout);

      // 1. Chercher d'abord le JSON final complet (pattern le plus spécifique)
      const finalJsonMatch = cleanOutput.match(/\{[^{}]*"sentiment"[^{}]*\}[^{}]*\}/g);
      if (finalJsonMatch) {
        for (const match of finalJsonMatch) {
          try {
            const cleaned = match.replace(/^[\s\n\r]+|[\s\n\r]+$/g, '');
            const parsed = JSON.parse(cleaned);
            if (this.isValidSentimentResult(parsed)) {
              console.log(`[${this.agentName}] ✅ Found valid JSON via final pattern`);
              return this.validateSentimentResult(parsed);
            }
          } catch {
            // Continuer avec le prochain match
          }
        }
      }

      // 2. Améliorer la recherche de JSON dans tout le texte (méthode plus agressive)
      const enhancedJsonSearch = cleanOutput.match(
        /\{[\s\S]*?"sentiment"[\s\S]*?"score"[\s\S]*?"risk_level"[\s\S]*?"catalysts"[\s\S]*?"summary"[\s\S]*?\}[\s\S]*\}/g
      );
      if (enhancedJsonSearch) {
        for (const match of enhancedJsonSearch) {
          try {
            const cleaned = match.replace(/^[\s\n\r]+|[\s\n\r]+$/g, '');
            const parsed = JSON.parse(cleaned);
            if (this.isValidSentimentResult(parsed)) {
              console.log(`[${this.agentName}] ✅ Found valid JSON via enhanced pattern`);
              return this.validateSentimentResult(parsed);
            }
          } catch {
            // Continuer avec le prochain match
          }
        }
      }

      // 2. Parser NDJSON ligne par ligne
      const lines = cleanOutput.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        try {
          const event = JSON.parse(line);

          // Priorité: metadata JSON (le plus fiable)
          if (
            event.metadata &&
            (event.metadata.sentiment || event.metadata.score || event.metadata.catalysts)
          ) {
            return this.validateSentimentResult(event.metadata);
          }

          // Deuxième: completion_result content
          if (event.type === 'completion_result' && event.content) {
            const parsed = this.extractJsonFromContent(event.content);
            if (parsed) return this.validateSentimentResult(parsed);
          }

          // Troisième: text content (pas reasoning)
          if (event.type === 'say' && event.say !== 'reasoning' && event.content) {
            const parsed = this.extractJsonFromContent(event.content);
            if (parsed) return this.validateSentimentResult(parsed);
          }
        } catch {
          // Ignorer les lignes non-JSON
        }
      }

      // 3. Fallback: chercher JSON dans tout le texte avec patterns améliorés
      const fallbackParsed = this.extractJsonFromContent(cleanOutput);
      if (fallbackParsed) {
        return this.validateSentimentResult(fallbackParsed);
      }
    } catch (error) {
      console.warn(
        `[${this.agentName}] NDJSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    throw new Error('No valid JSON found in any method');
  }

  /**
   * Vérifie si un résultat de sentiment est valide
   */
  private isValidSentimentResult(result: any): boolean {
    return (
      result &&
      typeof result === 'object' &&
      typeof result.sentiment === 'string' &&
      typeof result.score === 'number' &&
      ['BULLISH', 'BEARISH', 'NEUTRAL'].includes(result.sentiment.toUpperCase())
    );
  }

  /**
   * Extrait JSON du contenu avec multiples patterns
   */
  private extractJsonFromContent(content: string): unknown | null {
    const patterns = [
      /\{[\s\S]*?"sentiment"[\s\S]*?\}/g, // Standard JSON
      /\{[\s\S]*?\}/g, // N'importe quel objet JSON
      /sentiment["\s]*:\s*"[^"]+"/, // Format clé-valeur
      /sentiment["\s]*:\s*[^,}]+/m, // Format clé-valeur (non-quoté)
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {
          continue;
        }
      }
    }

    return null;
  }

  /**
   * Valide et normalise le résultat pour le SentimentAgent avec nettoyage
   */
  private validateSentimentResult(result: unknown): Record<string, unknown> {
    if (!result || typeof result !== 'object') {
      return this.createValidatedResult();
    }

    const resultObj = result as Record<string, unknown>;
    return this.createValidatedResult({
      sentiment: resultObj.sentiment,
      score: resultObj.score,
      risk_level: resultObj.risk_level,
      catalysts: resultObj.catalysts,
      summary: resultObj.summary,
    });
  }

  /**
   * Strip ANSI escape codes from a string
   */
  private stripAnsiCodes(str: string): string {
    // Remove ANSI escape sequences
    return str.replace(
      /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
      ''
    );
  }

  /**
   * Crée un résultat validé avec nettoyage des caractères pour Discord
   */
  private createValidatedResult(override: Record<string, unknown> = {}): Record<string, unknown> {
    // Fonction de nettoyage pour corriger l'encodage et les accents
    const cleanForDisplay = (text: string): string => {
      return String(text)
        .replace(/confidentiel/g, 'confidentiel')
        .replace(/œ/g, 'oe')
        .replace(/æ/g, 'ae')
        .replace(/à/g, 'a')
        .replace(/é/g, 'e')
        .replace(/è/g, 'e')
        .replace(/ù/g, 'u')
        .replace(/[^a-zA-Z0-9\s.!?]/g, ''); // Garder seulement lettres, chiffres, espaces et ponctuation simple
    };

    return {
      sentiment:
        override.sentiment &&
        ['BULLISH', 'BEARISH', 'NEUTRAL'].includes((override.sentiment as string).toUpperCase())
          ? (override.sentiment as string).toUpperCase()
          : 'NEUTRAL',
      score:
        typeof override.score === 'number' && override.score >= -100 && override.score <= 100
          ? override.score
          : 0,
      risk_level:
        override.risk_level &&
        ['LOW', 'MEDIUM', 'HIGH'].includes((override.risk_level as string).toUpperCase())
          ? (override.risk_level as string).toUpperCase()
          : 'MEDIUM',
      catalysts: Array.isArray(override.catalysts)
        ? (override.catalysts as unknown[])
            .filter((c: unknown) => typeof c === 'string')
            .slice(0, 5)
        : [],
      summary:
        typeof override.summary === 'string'
          ? cleanForDisplay(override.summary)
          : 'Aucune analyse disponible',
    };
  }
}
