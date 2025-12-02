#!/usr/bin/env node

/**
 * Bot de production pour publier les nouvelles financières sur Discord
 * Version optimisée pour les environnements de production avec cron jobs
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'path';
import pg from 'pg';

// Charger les variables d'environnement
dotenv.config();

class ProductionBot {
  constructor() {
    this.channelId = '1442317829998383235';
    this.token = process.env.DISCORD_TOKEN;
    this.projectRoot = path.dirname(fileURLToPath(import.meta.url));
    this.lastPublishedData = null;

    // Configuration production
    this.isProduction = process.env.NODE_ENV === 'production';
    this.maxRetries = 3;
    this.retryDelay = 5000;
  }

  /**
   * Journalisation structurée pour la production
   */
  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      env: this.isProduction ? 'production' : 'development'
    };

    if (data) {
      logEntry.data = data;
    }

    console.log(JSON.stringify(logEntry));
  }

  /**
   * Connexion à la base de données avec retry
   */
  async getDatabaseConnection() {
    let retries = 0;

    while (retries < this.maxRetries) {
      try {
        const client = new pg.Client({
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          database: process.env.DB_NAME || 'financial_analyst',
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD,
          connectionTimeoutMillis: 10000,
          query_timeout: 30000
        });

        await client.connect();
        this.log('INFO', 'Database connection established');
        return client;

      } catch (error) {
        retries++;
        this.log('ERROR', `Database connection attempt ${retries}/${this.maxRetries} failed`, { error: error.message });

        if (retries < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Récupère les dernières nouvelles des sources X/Twitter
   */
  async getLatestNews() {
    const client = await this.getDatabaseConnection();

    try {
      const query = `
        SELECT id, title, content, source, url, published_at
        FROM news_items
        WHERE source ILIKE '%x%'
           OR source ILIKE '%twitter%'
           OR source LIKE 'X - %'
           OR source ILIKE 'xinhua'
        ORDER BY published_at DESC
        LIMIT 10
      `;

      const result = await client.query(query);
      this.log('INFO', `Retrieved ${result.rows.length} news items from database`);

      const newsItems = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        content: row.content || 'Nouvelle financière pertinente',
        source: row.source,
        url: row.url,
        published_at: row.published_at,
        score: 7,
        category: this.categorizeNews(row.title, row.source)
      }));

      return newsItems;

    } catch (error) {
      this.log('ERROR', 'Failed to fetch news from database', { error: error.message });
      throw error;
    } finally {
      await client.end();
    }
  }

  /**
   * Catégorise automatiquement une nouvelle
   */
  categorizeNews(title, source) {
    const titleLower = title.toLowerCase();
    const sourceLower = source.toLowerCase();

    if (titleLower.includes('crypto') || titleLower.includes('bitcoin') || titleLower.includes('ethereum')) {
      return 'crypto';
    }
    if (titleLower.includes('tech') || titleLower.includes('technology') || sourceLower.includes('tech')) {
      return 'technology';
    }
    if (titleLower.includes('market') || titleLower.includes('stock') || titleLower.includes('trading')) {
      return 'market';
    }
    if (titleLower.includes('economy') || titleLower.includes('gdp') || titleLower.includes('inflation')) {
      return 'economy';
    }

    return 'finance';
  }

  /**
   * Charge les données de publication précédentes
   */
  async loadPreviousData() {
    try {
      const fs = await import('fs/promises');
      const dataPath = path.join(this.projectRoot, 'production_published_data.json');

      if (await fs.access(dataPath).catch(() => false)) {
        const data = await fs.readFile(dataPath, 'utf-8');
        this.lastPublishedData = JSON.parse(data);
        this.log('INFO', 'Previous published data loaded');
      } else {
        this.lastPublishedData = { news: [] };
        this.log('INFO', 'No previous data found, starting fresh');
      }
    } catch (error) {
      this.log('ERROR', 'Failed to load previous data', { error: error.message });
      this.lastPublishedData = { news: [] };
    }
  }

  /**
   * Vérifie si une nouvelle est déjà publiée
   */
  isAlreadyPublished(title, source, publishedAt) {
    if (!this.lastPublishedData?.news) return false;

    return this.lastPublishedData.news.some((item) =>
      item.title === title &&
      item.source === source &&
      new Date(item.published_at).getTime() === new Date(publishedAt).getTime()
    );
  }

  /**
   * Sauvegarde les données publiées
   */
  async savePublishedData(newData) {
    try {
      const fs = await import('fs/promises');
      const dataPath = path.join(this.projectRoot, 'production_published_data.json');

      const saveData = {
        timestamp: new Date().toISOString(),
        total_published: newData.length,
        news: [...(this.lastPublishedData?.news || []), ...newData].slice(-100) // Garde seulement les 100 derniers
      };

      await fs.writeFile(dataPath, JSON.stringify(saveData, null, 2));
      this.log('INFO', 'Published data saved successfully');

    } catch (error) {
      this.log('ERROR', 'Failed to save published data', { error: error.message });
    }
  }

  /**
   * Convertit les URLs nitter.net en fixupx.com
   */
  convertNitterToFixupX(url) {
    if (!url || url === 'undefined' || url === 'null') {
      return url;
    }

    // Convertir nitter.net en fixupx.com
    let convertedUrl = url.replace(/https?:\/\/nitter\.net\//i, 'https://fixupx.com/');

    // Enlever le #m à la fin s'il existe et ajouter ?s=20
    if (convertedUrl.endsWith('#m')) {
      convertedUrl = convertedUrl.slice(0, -2) + '?s=20';
    } else if (!convertedUrl.includes('?')) {
      convertedUrl += '?s=20';
    }

    return convertedUrl;
  }

  /**
   * Nettoie le HTML du contenu des nouvelles de manière complète
   */
  cleanHtmlContent(content) {
    if (!content) return 'Nouvelle financière pertinente';

    // Nettoyage en plusieurs étapes pour être plus complet
    let cleanContent = content
      // Étape 1: Enlever toutes les balises HTML
      .replace(/<[^>]*>/g, '')
      // Étape 2: Gérer les retours à la ligne HTML
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      // Étape 3: Remplacer les entités HTML
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–')
      .replace(/&hellip;/g, '…')
      .replace(/&rsquo;/g, "'")
      .replace(/&lsquo;/g, "'")
      .replace(/&ldquo;/g, '"')
      .replace(/&rdquo;/g, '"')
      // Étape 4: Nettoyer les espaces multiples et retours à la ligne
      .replace(/\s*\n\s*\n\s*/g, '\n\n') // Normaliser les paragraphes
      .replace(/\s*\n\s*/g, '\n') // Normaliser les lignes simples
      .replace(/[ \t]+/g, ' ') // Nettoyer les espaces multiples
      .trim();

    // Étape 5: Nettoyage final des retours à la ligne en début/fin
    cleanContent = cleanContent.replace(/^\n+|\n+$/g, '');

    return cleanContent || 'Nouvelle financière pertinente';
  }

  /**
   * Formate un message pour Discord avec une présentation améliorée
   */
  formatDiscordMessage(item) {
    const emoji = this.getCategoryEmoji(item.category);
    const scoreColor = this.getScoreColor(item.score);

    // Nettoyage et formatage du titre
    const title = this.cleanHtmlContent(item.title);
    const displayTitle = title.length > 100 ? title.substring(0, 97) + '...' : title;

    // Nettoyage du contenu
    const cleanedContent = this.cleanHtmlContent(item.content);
    const displayContent = cleanedContent.length > 300 ? cleanedContent.substring(0, 297) + '...' : cleanedContent;

    // Formatage de la date
    const dateStr = new Date(item.published_at).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Construction du message avec un espacement approprié
    let message = '';

    // Titre principal avec emoji
    message += `${emoji} **${displayTitle}**\n\n`;

    // Métadonnées sur une ligne compacte
    message += `📰 **${item.source}** • Score: ${scoreColor}${item.score}** • 📅 ${dateStr}\n`;

    // Lien vers la source originale
    if (item.url && item.url !== 'undefined' && item.url !== 'null') {
      const convertedUrl = this.convertNitterToFixupX(item.url);
      message += `🔗 [Voir le tweet original](${convertedUrl})\n`;
    }

    // Séparateur visuel
    message += '\n';

    // Contenu du tweet (formaté correctement pour Discord)
    if (displayContent && displayContent !== 'Nouvelle financière pertinente') {
      // Diviser le contenu en lignes si nécessaire pour une meilleure lisibilité
      const lines = displayContent.split('\n');
      message += lines.map(line => line.trim()).join('\n');
    } else {
      message += '_Nouvelle financière pertinente_';
    }

    return message;
  }

  /**
   * Retourne l'emoji approprié pour une catégorie
   */
  getCategoryEmoji(category) {
    const emojis = {
      'finance': '💰',
      'market': '📈',
      'economy': '🏛️',
      'crypto': '₿',
      'technology': '💻',
      'default': '📰'
    };
    return emojis[category?.toLowerCase()] || emojis.default;
  }

  /**
   * Retourne la couleur pour un score
   */
  getScoreColor(score) {
    if (score >= 8) return '🟢';
    if (score >= 6) return '🟡';
    if (score >= 4) return '🟠';
    return '🔴';
  }

  /**
   * Publie les nouvelles sur Discord
   */
  async publishToDiscord(news) {
    const { Client, GatewayIntentBits } = await import('discord.js');

    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ]
    });

    try {
      await client.login(this.token);
      this.log('INFO', 'Discord client connected');

      const channel = await client.channels.fetch(this.channelId);
      if (!channel) {
        throw new Error('Discord channel not found');
      }

      this.log('INFO', `Publishing ${news.length} news items to Discord`);

      let publishedCount = 0;
      for (const item of news) {
        try {
          const message = this.formatDiscordMessage(item);
          await channel.send(message);

          publishedCount++;
          this.log('INFO', `Published: ${item.title.substring(0, 50)}...`);

          // Délai entre les messages pour éviter le spam
          if (this.isProduction) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }

        } catch (itemError) {
          this.log('ERROR', `Failed to publish item: ${item.title}`, { error: itemError.message });
        }
      }

      await client.destroy();
      this.log('INFO', `Discord publishing completed: ${publishedCount}/${news.length} items published`);

      return publishedCount;

    } catch (error) {
      await client.destroy();
      this.log('ERROR', 'Discord publishing failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Cycle principal de publication avec retry
   */
  async runPublishingCycle() {
    const startTime = Date.now();

    try {
      this.log('INFO', 'Starting production publishing cycle');

      // Charger les données précédentes
      await this.loadPreviousData();

      // Récupérer les dernières nouvelles
      const news = await this.getLatestNews();

      if (news.length === 0) {
        this.log('INFO', 'No news items found to publish');
        return { success: true, published: 0, duration: Date.now() - startTime };
      }

      // Filtrer les nouvelles déjà publiées
      const newNews = news.filter(item =>
        !this.isAlreadyPublished(item.title, item.source, item.published_at)
      );

      this.log('INFO', `Filtered news: ${newNews.length} new items to publish out of ${news.length} total`);

      if (newNews.length > 0) {
        // Publier sur Discord
        const publishedCount = await this.publishToDiscord(newNews);

        // Sauvegarder les données publiées
        await this.savePublishedData(newNews);

        const duration = Date.now() - startTime;
        this.log('INFO', 'Publishing cycle completed successfully', {
          total_news: news.length,
          new_news: newNews.length,
          published: publishedCount,
          duration_ms: duration
        });

        return { success: true, published: publishedCount, duration };

      } else {
        this.log('INFO', 'No new items to publish - all items already published');
        return { success: true, published: 0, duration: Date.now() - startTime };
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      this.log('ERROR', 'Publishing cycle failed', {
        error: error.message,
        duration_ms: duration
      });

      return { success: false, error: error.message, duration };
    }
  }
}

// Exécution si fichier appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  const bot = new ProductionBot();

  bot.runPublishingCycle()
    .then(result => {
      if (result.success) {
        bot.log('INFO', 'Bot execution completed successfully', result);
        process.exit(0);
      } else {
        bot.log('ERROR', 'Bot execution failed', result);
        process.exit(1);
      }
    })
    .catch(error => {
      bot.log('ERROR', 'Fatal bot error', { error: error.message });
      process.exit(1);
    });
}

export { ProductionBot };