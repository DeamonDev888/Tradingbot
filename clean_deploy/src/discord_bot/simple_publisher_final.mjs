#!/usr/bin/env node

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import pg from 'pg';

dotenv.config();

class SimplePublisher {
  constructor() {
    this.channelId = process.env.DISCORD_CHANNEL_ID;
    this.token = process.env.DISCORD_TOKEN;
    this.projectRoot = path.dirname(fileURLToPath(import.meta.url));
    this.lastPublishedData = null;
    this.browser = null;
    this.page = null;
  }

  /**
   * Recherche l'URL X/Twitter pour un titre et source
   */
  async searchTwitterUrl(title, source) {
    try {
      console.log(`🔍 Searching Twitter for: "${title}" (${source})`);

      const { chromium } = await import('playwright');
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        ]
      });

      this.page = await this.browser.newPage();
      await this.page.setViewportSize({ width: 1920, height: 1080 });
      console.log('Browser initialized for Twitter search');
    } catch (error) {
      console.error('Failed to initialize browser:', error);
      return null;
    }
  }

  /**
   * Récupère les dernières nouvelles X/Twitter avec recherche URL
   */
  async getLatestNews() {
    const client = new pg.Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'financial_analyst',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '9022'
    });

    const newsItems = [];

    try {
      const result = await client.query(`
        SELECT id, title, content, source, url, published_at
        FROM news_items
        WHERE source ILIKE '%x%'
           OR source ILIKE '%twitter%'
           OR source LIKE 'X - %'
           OR source ILIKE 'xinhua'
        ORDER BY published_at DESC
        LIMIT 5
      `);

      console.log(`📊 Found ${result.rows.length} X/Twitter-like news items`);

      for (const row of result.rows) {
        const twitterUrl = await this.searchTwitterUrl(row.title, row.source);

        newsItems.push({
          id: row.id,
          title: row.title,
          content: row.content,
          source: row.source,
          url: row.url,
          published_at: row.published_at,
          score: 7,
          category: 'finance',
          twitterUrl
        });
      }

      return newsItems;

    } catch (error) {
      console.error('❌ Database error:', error);
      return [];
    } finally {
      await client.end();
    }
  }

  /**
   * Charge les données précédentes
   */
  async loadPreviousData() {
    const fs = await import('fs/promises');
    const dataPath = path.join(this.projectRoot, 'x_published_data.json');

    try {
      if (await fs.access(dataPath).catch(() => false)) {
        const data = await fs.readFile(dataPath, 'utf-8');
        this.lastPublishedData = JSON.parse(data);
        console.log('📊 Previous data loaded');
      }
    } catch (error) {
      console.log('💭 No previous data, starting fresh');
      this.lastPublishedData = null;
    }
  }

  /**
   * Vérifie si une nouvelle est déjà publiée
   */
  isAlreadyPublished(title, source, publishedAt) {
    if (!this.lastPublishedData) return false;

    return this.lastPublishedData.news.some((item) =>
      item.title === title &&
      item.source === source &&
      new Date(item.published_at).getTime() === new Date(publishedAt).getTime()
    );
  }

  /**
   * Sauvegarde les données publiées
   */
  async savePublishedData(data) {
    const fs = await import('fs/promises');
    const dataPath = path.join(this.projectRoot, 'x_published_data.json');

    try {
      const publishedData = {
        timestamp: new Date().toISOString(),
        total_published: data.length,
        news: [...(this.lastPublishedData?.news || []), ...data]
      };

      await fs.writeFile(dataPath, JSON.stringify(publishedData, null, 2));
      console.log('💾 Published data saved');
    } catch (error) {
      console.error('❌ Error saving data:', error);
    }
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
   * Formate un message Discord
   */
  formatDiscordMessage(item) {
    const emoji = this.getCategoryEmoji(item.category);
    const scoreColor = this.getScoreColor(item.score);
    const title = item.title.length > 100 ? item.title.substring(0, 97) + '...' : item.title;

    let message = `${emoji} **${title}**\n`;
    message += `Source: ${item.source} | Score: ${scoreColor}${item.score}**\n`;
    message += `📅 ${new Date(item.published_at).toLocaleString('fr-FR')}\n`;

    // Ajouter le lien FixupX si trouvé
    if (item.twitterUrl) {
      const fixupUrl = item.twitterUrl.replace('https://x.com/', 'https://fixupx.com/');
      message += `🔗 Voir le post: [${fixupUrl}](${fixupUrl})\n`;
    }

    if (item.url) {
      message += `[Source originale](${item.url})\n`;
    }

    const contentText = item.content ? item.content.substring(0, 200) + '...' : 'Nouvelle financière pertinente';
    message += `*${contentText}*`;

    return message;
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

      const channel = await client.channels.fetch(this.channelId);
      if (!channel) {
        throw new Error('Channel Discord non trouvé');
      }

      console.log(`📢 Publication de ${news.length} nouvelles sur Discord...`);

      for (const item of news) {
        try {
          const message = this.formatDiscordMessage(item);
          await channel.send(message);
          console.log(`✅ Publié: ${item.title.substring(0, 50)}...`);

          // Délai entre les messages pour éviter de spammer
          await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (itemError) {
          console.error(`❌ Erreur publication item ${item.title}:`, itemError);
        }
      }

      await client.destroy();
      console.log('✅ Publication terminée');
    } catch (error) {
      await client.destroy();
      console.error('❌ Erreur publication Discord:', error);
      throw error;
    }
  }

  /**
   * Cycle principal de publication
   */
  async runPublishingCycle() {
    try {
      console.log('🚀 Démarrage du cycle de publication avec recherche X intégrée...');

      // Charger les données précédentes
      await this.loadPreviousData();

      // Récupérer les dernières nouvelles avec recherche URL
      const news = await this.getLatestNews();

      console.log(`📊 Found ${news.length} news items`);

      // Filtrer les nouvelles déjà publiées
      const newNews = news.filter(item =>
        !this.isAlreadyPublished(item.title, item.source, item.published_at)
      );

      console.log(`🆕 ${newNews.length} nouvelles à publier`);

      if (newNews.length > 0) {
        // Publier sur Discord
        await this.publishToDiscord(newNews);

        // Sauvegarder les données publiées
        await this.savePublishedData({
          timestamp: new Date().toISOString(),
          total_published: newNews.length,
          news: [...(this.lastPublishedData?.news || []), ...newNews]
        });
      }

      console.log('✅ Cycle de publication terminé');
      return { success: true, published: newNews.length };

    } catch (error) {
      console.error('❌ Erreur dans le cycle de publication:', error);
      return { success: false, error: error.message };
    }
  }
}

// Exécution si fichier appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  const publisher = new SimplePublisher();
  publisher.runPublishingCycle()
    .then(result => {
      if (result.success) {
        console.log('🎉 Bot exécuté avec succès');
      } else {
        console.error('💥 Erreur:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

export { SimplePublisher };