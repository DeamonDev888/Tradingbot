#!/usr/bin/env node

/**
 * Simple Discord Publisher - Publie les nouvelles financières pertinentes
 * Version simplifiée qui utilise directement les données de la base
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

class SimplePublisher {
  constructor() {
    this.channelId = process.env.DISCORD_CHANNEL_ID;
    this.token = process.env.DISCORD_TOKEN;
    this.lastPublishedData = null;
    this.projectRoot = path.dirname(fileURLToPath(import.meta.url));
  }

  /**
   * Récupère les nouvelles pertinentes de la base de données
   */
  async getRelevantNews() {
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
      // Récupérer UNIQUEMENT les nouvelles X/Twitter avec un score de pertinence élevé
      const query = `
        SELECT
          id,
          title,
          content,
          source,
          url,
          published_at,
          relevance_score,
          category,
          processing_status
        FROM news_items
        WHERE processing_status = 'processed'
          AND relevance_score >= 6
          AND (source ILIKE '%x%'
               OR source ILIKE '%twitter%'
               OR source LIKE 'X - %'
               OR source ILIKE 'xinhua')
        ORDER BY published_at DESC
        LIMIT 10
      `;

      const result = await client.query(query);
      console.log(`📊 Found ${result.rows.length} relevant news items`);

      return result.rows.map(row => ({
        title: row.title,
        content: row.content,
        source: row.source,
        url: row.url,
        published_at: row.published_at,
        score: row.relevance_score || 7,
        category: row.category || 'finance'
      }));

    } catch (error) {
      console.error('❌ Database error:', error);
      return [];
    } finally {
      client.release();
      await pool.end();
    }
  }

  /**
   * Récupère les dernières nouvelles (même sans score)
   */
  async getLatestNews() {
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
      // Récupérer UNIQUEMENT les dernières nouvelles X/Twitter traitées
      const query = `
        SELECT
          id,
          title,
          content,
          source,
          url,
          published_at
        FROM news_items
        WHERE processing_status = 'processed'
          AND (source ILIKE '%x%'
               OR source ILIKE '%twitter%'
               OR source LIKE 'X - %'
               OR source ILIKE 'xinhua')
        ORDER BY published_at DESC
        LIMIT 5
      `;

      const result = await client.query(query);
      console.log(`📊 Found ${result.rows.length} latest news items`);

      return result.rows.map(row => ({
        title: row.title,
        content: row.content,
        source: row.source,
        url: row.url,
        published_at: row.published_at,
        score: 7,
        category: 'finance'
      }));

    } catch (error) {
      console.error('❌ Database error:', error);
      return [];
    } finally {
      client.release();
      await pool.end();
    }
  }

  /**
   * Charge les données précédentes pour éviter les doublons
   */
  async loadPreviousData() {
    const dataPath = path.join(this.projectRoot, 'simple_published.json');
    try {
      const fs = await import('fs/promises');
      if (await fs.access(dataPath).catch(() => false)) {
        const data = await fs.readFile(dataPath, 'utf-8');
        this.lastPublishedData = JSON.parse(data);
        console.log('📊 Données précédentes chargées');
      }
    } catch (error) {
      console.log('💭 Pas de données précédentes, démarrage frais');
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
  async savePublishedData(news) {
    const dataPath = path.join(this.projectRoot, 'simple_published.json');
    try {
      const fs = await import('fs/promises');
      const data = {
        timestamp: new Date().toISOString(),
        total_published: news.length,
        news: [...(this.lastPublishedData?.news || []), ...news]
      };

      await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
      console.log('💾 Données publiées sauvegardées');
    } catch (error) {
      console.error('❌ Erreur sauvegarde données:', error);
    }
  }

  /**
   * Formate un message Discord
   */
  formatDiscordMessage(item) {
    const emoji = this.getCategoryEmoji(item.category);
    const scoreColor = this.getScoreColor(item.score);
    const title = item.title.length > 100 ? item.title.substring(0, 97) + '...' : item.title;

    // Créer l'URL fixup.cx à partir de l'URL existante ou utiliser un ID
    const fixupUrl = this.createFixupUrl(item);

    // Construire le message ligne par ligne pour éviter les erreurs
    let message = `${emoji} **${title}**\n`;
    message += `Source: ${item.source} | Score: ${scoreColor}${item.score}**\n`;
    message += `📅 ${new Date(item.published_at).toLocaleString('fr-FR')}\n`;

    // Ajouter le lien FixupX seulement si disponible
    if (fixupUrl) {
      message += `🔗 Voir le post: [${fixupUrl}](${fixupUrl})\n`;
    }

    if (item.url) {
      message += `[Source originale](${item.url})\n`;
    }

    const contentText = item.content ? item.content.substring(0, 200) + '...' : 'Nouvelle financière pertinente';
    message += `*${contentText}*\n\n`;

    // Ajouter des instructions pour trouver le vrai tweet
    if (!fixupUrl) {
      message += `🔍 **Trouver le tweet original :**\n`;
      message += `• Cherchez "${item.title}" sur X/Twitter\n`;
      message += `• Copiez le lien depuis la source ci-dessus\n`;
      message += `• Utilisez https://vxtwitter.com pour voir sans compte`;
    }

    return message;
  }

  /**
   * Crée l'URL fixupx.com pour un post X/Twitter
   */
  createFixupUrl(item) {
    // Si l'URL existe déjà et c'est une vraie URL X/Twitter
    if (item.url && this.isRealTwitterUrl(item.url)) {
      return this.convertToFixupxUrl(item.url, item.source);
    }

    // Sinon, ne pas créer d'URL FixupX car elles ne fonctionnent pas
    return null;
  }

  /**
   * Génère un ID fallback avec le username "fixup"
   */
  generateFallbackId(item) {
    // Toujours utiliser "fixup" comme username pour preuve
    return 'fixup';
  }

  /**
   * Vérifie si c'est une vraie URL X/Twitter
   */
  isRealTwitterUrl(url) {
    return url.includes('twitter.com') || url.includes('x.com');
  }

  /**
   * Convertit une URL X/Twitter en URL fixupx.com
   */
  convertToFixupxUrl(url, source) {
    // Si c'est déjà une URL X/Twitter
    if (url.includes('twitter.com') || url.includes('x.com')) {
      const tweetId = this.extractTweetId(url);
      if (tweetId) {
        return `https://fixupx.com/status/${tweetId}`;
      }
    }

    // Pour les sources X/Twitter spécifiques, créer des URLs directes
    if (source) {
      const xUsername = this.getXUsernameFromSource(source);
      if (xUsername) {
        return `https://fixupx.com/${xUsername}`;
      }
    }

    // Pour les URLs RSS xcancel, essayer d'extraire un nom d'utilisateur
    if (url.includes('xcancel.com')) {
      const username = url.match(/https?:\/\/(?:www\.)?xcancel\.com\/([^\/]+)/)?.[1];
      if (username && username !== 'rss') {
        return `https://fixupx.com/${username}`;
      }
    }

    // Fallback: utiliser l'ID généré
    return `https://fixupx.com/status/${this.generateIdFromUrl(url)}`;
  }

  /**
   * Retourne le username X/Twitter pour une source
   */
  getXUsernameFromSource(source) {
    const xUsernames = {
      'X - Maji': 'majilato',
      'X - Stocktwits': 'Stocktwits',
      'X - Eamon Javers': 'EamonJavers',
      'X - The Bear Traps Report': 'BearTrapsReport',
      'X - John J. Hardy': 'JohnJHardy',
      'X - Jamie Catherwood': 'JamieCatherwood',
      'X - PredictWise': 'PredictWise',
      'X - Decision Desk HQ': 'DecisionDeskHQ',
      'X - Phila Fed Research': 'PhilaFed',
      'Xinhua': 'Xinhua'
    };

    return xUsernames[source] || null;
  }

  /**
   * Extrait l'ID d'un tweet depuis une URL X/Twitter
   */
  extractTweetId(url) {
    const match = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
    return match ? match[1] : null;
  }

  /**
   * Génère un ID à partir d'une URL
   */
  generateIdFromUrl(url) {
    if (!url) return Date.now();
    return url
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 10) + Date.now();
  }

  /**
   * Génère un ID simple à partir du titre
   */
  generateIdFromTitle(title) {
    // Créer un hash simple ou utiliser les premiers mots
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .substring(0, 20) + '-' + Date.now();
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

          // Délai entre les messages
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
      console.log('🚀 Démarrage du cycle de publication...');

      // Charger les données précédentes
      await this.loadPreviousData();

      // Récupérer les nouvelles pertinentes
      let news = await this.getRelevantNews();

      // Si pas de nouvelles pertinentes, récupérer les dernières
      if (news.length === 0) {
        console.log('⚠️ Pas de nouvelles pertinentes, récupération des dernières...');
        news = await this.getLatestNews();
      }

      // Filtrer les nouvelles déjà publiées
      const newNews = news.filter(item =>
        !this.isAlreadyPublished(item.title, item.source, item.published_at)
      );

      console.log(`🆕 ${newNews.length} nouvelles à publier`);

      if (newNews.length > 0) {
        // Publier sur Discord
        await this.publishToDiscord(newNews);

        // Sauvegarder les données publiées
        await this.savePublishedData(newNews);
      } else {
        console.log('ℹ️ Aucune nouvelle à publier (tout déjà publié)');
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