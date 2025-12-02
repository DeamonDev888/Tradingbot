#!/usr/bin/env node

/**
 * Simple Discord Publisher avec recherche X/Twitter intégrée (version inline)
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
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

      if (!this.browser) {
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
      }

      const searchQuery = `${title} ${source}`;
      const searchUrl = `https://x.com/search?q=${encodeURIComponent(searchQuery)}&src=typed_query`;

      await this.page.goto(searchUrl, {
        waitUntil: 'networkidle',
        timeout: 10000
      });

      // Wait for search results
      await this.page.waitForSelector('[data-testid="tweet"]', { timeout: 5000 });

      // Get first tweet result
      const twitterUrl = await this.page.evaluate(() => {
        const firstTweet = document.querySelector('[data-testid="tweet"] a[href*="/status/"]');
        return firstTweet ? firstTweet.getAttribute('href') : null;
      });

      await this.page.close();
      this.browser = null;

      if (twitterUrl && twitterUrl.startsWith('https://x.com/')) {
        console.log(`✅ Found Twitter URL: ${twitterUrl}`);
        return twitterUrl;
      }

      console.log('⚠️ No valid Twitter URL found');
      return null;
    } catch (error) {
      console.error('Error searching Twitter:', error);
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

      const newsWithTwitterUrls = [];
      for (const row of result.rows) {
        console.log(`🔍 Searching Twitter for: "${row.title}" (${row.source})`);
        const twitterUrl = await this.searchTwitterUrl(row.title, row.source);

        const newsItem = {
          id: row.id,
          title: row.title,
          content: row.content,
          source: row.source,
          url: row.url,
          published_at: row.published_at,
          score: 7,
          category: 'finance',
          twitterUrl
        };

        newsWithTwitterUrls.push(newsItem);
      }

      return newsWithTwitterUrls;

    } catch (error) {
      console.error('❌ Database error:', error);
      return [];
    } finally {
      client.release();
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
  async savePublishedData(data) {
    const fs = await import('fs/promises');
    const dataPath = path.join(this.projectRoot, 'x_published_data.json');
    try {
      const saveData = {
        timestamp: new Date().toISOString(),
        total_published: data.length,
        news: [...(this.lastPublishedData?.news || []), ...data]
      };

      await fs.writeFile(dataPath, JSON.stringify(saveData, null, 2));
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

    // Ajouter le lien FixupX si URL Twitter trouvée
    if (item.twitterUrl) {
      const fixupUrl = item.twitterUrl.replace('https://x.com/', 'https://fixupx.com/status/');
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
   * Cycle principal de publication
   */
  async runPublishingCycle() {
    try {
      console.log('🚀 Starting X/Twitter-only publishing cycle...');

      // Charger les données précédentes
      await this.loadPreviousData();

      // Récupérer les dernières nouvelles avec recherche URL Twitter
      const news = await this.getLatestNews();
      console.log(`📊 Found ${news.length} X/Twitter-like news items`);

      // Filtrer les nouvelles déjà publiées
      const newNews = news.filter(item =>
        !this.isAlreadyPublished(item.title, item.source, item.published_at)
      );

      console.log(`🆕 ${newNews.length} new items to publish`);

      if (newNews.length > 0) {
        // Créer un client Discord
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

          console.log(`📢 Publishing ${newNews.length} news to Discord...`);

          for (const item of newNews) {
            try {
              const message = this.formatDiscordMessage(item);
              await channel.send(message);
              console.log(`✅ Published: ${item.title.substring(0, 50)}...`);

              // Délai entre les messages
              await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (itemError) {
              console.error(`❌ Error publishing ${item.title}:`, itemError);
            }
          }

          await client.destroy();
          console.log('✅ Publication completed');

          // Sauvegarder les données publiées
          const publishedData = {
            timestamp: new Date().toISOString(),
            total_published: newNews.length,
            news: [...(this.lastPublishedData?.news || []), ...newNews]
          };

          await this.savePublishedData(publishedData);
          this.lastPublishedData = publishedData;
          console.log('💾 Published data saved');

        } catch (discordError) {
          console.error('❌ Discord error:', discordError);
        }

      } catch (error) {
        console.error('❌ Error in publishing cycle:', error);
      }

      console.log('✅ Publishing cycle completed');
      return { success: true, published: newNews.length };

    } catch (error) {
      console.error('❌ Error in publishing cycle:', error);
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
        console.log('🎉 Bot executed successfully');
      } else {
        console.error('💥 Error:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

export { SimplePublisher };