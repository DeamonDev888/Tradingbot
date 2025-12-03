#!/usr/bin/env node

/**
 * Simple Discord Publisher - Publie les nouvelles financières pertinentes
 * Version optimisée : Utilise la DB pour gérer l'état de publication (published_to_discord)
 */

import dotenv from 'dotenv';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';

dotenv.config();

class SimplePublisher {
  constructor() {
    this.channelId = process.env.DISCORD_CHANNEL_ID;
    this.token = process.env.DISCORD_TOKEN;
    this.projectRoot = path.dirname(fileURLToPath(import.meta.url));
  }

  /**
   * Convertit intelligemment n'importe quelle URL Twitter/X/Nitter en FixupX
   */
  convertToFixupX(url) {
    if (!url) return null;

    try {
      if (url.includes('fixupx.com') || url.includes('vxtwitter.com')) {
        return url;
      }
      const match = url.match(/(?:twitter\.com|x\.com|nitter\.[^/]+)\/(.+?\/status\/\d+)/);
      if (match && match[1]) {
        return `https://fixupx.com/${match[1]}`;
      }
      return url;
    } catch (error) {
      console.error('Erreur conversion URL:', error);
      return url;
    }
  }

  /**
   * Récupère les nouvelles NON PUBLIÉES de la base de données
   */
  async getUnpublishedNews() {
    const { Pool } = await import('pg');
    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'financial_analyst',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '9022'
    });

    const client = await pool.connect();
    try {
      // On récupère les news non publiées avec un bon score
      // Augmentation de la limite à 20 pour un flux plus soutenu
      const query = `
        SELECT
          id,
          title,
          content,
          source,
          url,
          published_at,
          relevance_score,
          category
        FROM news_items
        WHERE processing_status = 'processed'
          AND (published_to_discord IS FALSE OR published_to_discord IS NULL)
          AND relevance_score >= 6
          AND (category LIKE 'X-%' OR url LIKE '%twitter%' OR url LIKE '%x.com%')
        ORDER BY published_at DESC
        LIMIT 20
      `;

      const result = await client.query(query);
      console.log(`📊 Found ${result.rows.length} unpublished news items`);

      return { 
        items: result.rows.map(row => ({
          id: row.id, // On a besoin de l'ID pour marquer comme publié
          title: row.title,
          content: row.content,
          source: row.source,
          url: row.url,
          published_at: row.published_at,
          score: row.relevance_score,
          category: row.category,
          fixupUrl: this.convertToFixupX(row.url)
        })),
        pool // On retourne le pool pour pouvoir marquer comme publié plus tard
      };

    } catch (error) {
      console.error('❌ Database error:', error);
      client.release();
      await pool.end();
      return { items: [], pool: null };
    } finally {
      client.release();
    }
  }

  /**
   * Marque une news comme publiée dans la DB
   */
  async markAsPublished(pool, id) {
    if (!pool || !id) return;
    const client = await pool.connect();
    try {
      await client.query('UPDATE news_items SET published_to_discord = TRUE WHERE id = $1', [id]);
      // console.log(`✅ Marked item ${id} as published`);
    } catch (error) {
      console.error(`❌ Failed to mark item ${id} as published:`, error);
    } finally {
      client.release();
    }
  }

  /**
   * Nettoie le texte
   */
  cleanText(text) {
    if (!text) return '';
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Formate un message Discord propre
   */
  formatDiscordMessage(item) {
    const emoji = this.getCategoryEmoji(item.category);
    
    let cleanTitle = this.cleanText(item.title);
    let cleanContent = this.cleanText(item.content);

    if (cleanTitle.length > 80) {
        cleanTitle = cleanTitle.substring(0, 80).split(' ').slice(0, -1).join(' ') + '...';
    }

    let message = `**${emoji} ${cleanTitle}**\n\n`;
    
    if (cleanContent && cleanContent !== cleanTitle && cleanContent.length > 10) {
        if (cleanContent.length > 300) {
            cleanContent = cleanContent.substring(0, 300).split(' ').slice(0, -1).join(' ') + '...';
        }
        message += `${cleanContent}\n`;
    }

    const scoreColor = this.getScoreColor(item.score);
    message += `\n*Source: ${item.source} | Score: ${item.score}/10 ${scoreColor}*\n`;

    if (item.fixupUrl) {
      message += item.fixupUrl;
    } else if (item.url) {
      message += item.url;
    }

    return message;
  }

  getCategoryEmoji(category) {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('crypto')) return '₿';
    if (cat.includes('market')) return '📈';
    if (cat.includes('economy')) return '🏛️';
    if (cat.includes('tech')) return '💻';
    return '📰';
  }

  getScoreColor(score) {
    if (score >= 8) return '🟢';
    if (score >= 6) return '🟡';
    if (score >= 4) return '🟠';
    return '🔴';
  }

  /**
   * Publie les nouvelles sur Discord
   */
  async publishToDiscord(newsData) {
    const { items, pool } = newsData;
    if (!items || items.length === 0) {
        if (pool) await pool.end();
        return;
    }

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

      console.log(`📢 Envoi de ${items.length} messages...`);

      for (const item of items) {
        try {
          const message = this.formatDiscordMessage(item);
          await channel.send(message);
          console.log(`✅ Envoyé : ${item.title.substring(0, 40)}...`);
          
          // Marquer comme publié immédiatement après succès
          await this.markAsPublished(pool, item.id);

          // Petit délai anti-spam (2s)
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (itemError) {
          console.error(`❌ Erreur envoi item ${item.title}:`, itemError);
        }
      }

      await client.destroy();

    } catch (error) {
      if (client) client.destroy();
      console.error('❌ Erreur connexion Discord:', error);
      throw error;
    } finally {
      if (pool) await pool.end();
    }
  }

  /**
   * Cycle principal
   */
  async runPublishingCycle() {
    try {
      console.log('🚀 Démarrage SimplePublisher (Mode DB State)...');

      // 1. Récupérer les news non publiées
      const newsData = await this.getUnpublishedNews();

      if (newsData.items.length === 0) {
        console.log('✅ Aucune nouvelle news à publier.');
        if (newsData.pool) await newsData.pool.end();
        return { success: true, published: 0 };
      }

      console.log(`📝 ${newsData.items.length} nouvelles inédites à publier.`);

      // 2. Publier et mettre à jour le statut
      await this.publishToDiscord(newsData);

      console.log('✅ Terminé.');
      return { success: true, published: newsData.items.length };

    } catch (error) {
      console.error('❌ Erreur globale:', error);
      return { success: false, error: error.message };
    }
  }
}

// Exécution directe robuste
const isMainModule = import.meta.url === pathToFileURL(process.argv[1]).href || 
                     process.argv[1].endsWith('simple_publisher.mjs');

if (isMainModule) {
  const publisher = new SimplePublisher();
  publisher.runPublishingCycle()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
}

export { SimplePublisher };