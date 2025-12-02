#!/usr/bin/env node

/**
 * Auto Publisher - Publie automatiquement les nouvelles pertinentes sur Discord
 * Utilise le pipeline ESM complet (X scraper + NewsFilterAgent)
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

// Importation ESM des modules du pipeline
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

class AutoPublisher {
  constructor(channelId = 'general') {
    this.channelId = channelId;
    this.lastPublishedData = null;
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
    const dataPath = path.join(projectRoot, 'last_published.json');
    try {
      const fs = await import('fs/promises');
      await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
      console.log('💾 Données publiées sauvegardées');
    } catch (error) {
      console.error('❌ Erreur sauvegarde données:', error);
    }
  }

  /**
   * Formate un message Discord pour une nouvelle
   */
  formatDiscordMessage(item) {
    const emoji = this.getCategoryEmoji(item.category);
    const scoreColor = this.getScoreColor(item.score);
    const title = item.title.length > 100 ? item.title.substring(0, 97) + '...' : item.title;

    return `${emoji} **${title}**\n` +
           `Source: ${item.source} | Score: ${scoreColor}${item.score}**\n` +
           `📅 ${new Date(item.published_at).toLocaleString('fr-FR')}\n` +
           `${item.url ? `[Lire plus](${item.url})` : ''}\n` +
           `*${item.reason || 'Nouvelle pertinente pour l\'analyse financière'}*`;
  }

  /**
   * Retourne l'emoji approprié pour une catégorie
   */
  getCategoryEmoji(category) {
    const emojis = {
      'market': '📈',
      'earnings': '💰',
      'crypto': '₿',
      'economy': '🏛️',
      'commodities': '🛢️',
      'technology': '💻',
      'forex': '💱',
      'politics': '🏛️',
      'default': '📰'
    };
    return emojis[category] || emojis.default;
  }

  /**
   * Retourne la couleur pour un score
   */
  getScoreColor(score) {
    if (score >= 80) return '🟢';
    if (score >= 60) return '🟡';
    if (score >= 40) return '🟠';
    return '🔴';
  }

  /**
   * Cycle principal de publication
   */
  async runPublishingCycle() {
    try {
      console.log('🚀 Démarrage du cycle de publication...');

      // 1. Exécuter le scraping X
      const xResult = await this.runXScraping();
      console.log(`📊 X scraping: ${xResult.items.length} nouvelles trouvées`);

      // 2. Exécuter le filtrage des nouvelles
      const filteredNews = await this.runNewsFiltering();
      console.log(`🔍 Filtrage: ${filteredNews.length} nouvelles pertinentes`);

      // 3. Combiner toutes les nouvelles pertinententes
      const allNews = [...xResult.items, ...filteredNews];

      // 4. Filtrer les nouvelles déjà publiées
      const newNews = allNews.filter(item =>
        !this.isAlreadyPublished(item.title, item.source, item.published_at)
      );

      console.log(`🆕 ${newNews.length} nouvelles à publier`);

      if (newNews.length > 0) {
        // 5. Publier sur Discord
        await this.publishToDiscord(newNews);

        // 6. Sauvegarder les données publiées
        const publishedData = {
          timestamp: new Date().toISOString(),
          total_published: newNews.length,
          news: [...(this.lastPublishedData?.news || []), ...newNews]
        };

        await this.savePublishedData(publishedData);
        this.lastPublishedData = publishedData;
      }

      console.log('✅ Cycle de publication terminé');
      return { success: true, published: newNews.length };

    } catch (error) {
      console.error('❌ Erreur dans le cycle de publication:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Exécute le scraping X
   */
  async runXScraping() {
    try {
      const { XScraperService } = await import(`${projectRoot}/src/x_scraper/XScraperService.js`);
      const xScraper = new XScraperService();

      if (await xScraper.opmlFileExists()) {
        return await xScraper.runScraping();
      } else {
        console.log('⚠️ Fichier OPML X non trouvé, utilisation des données existantes');
        return { success: false, items: [], errors: ['No OPML file found'], processedFeeds: 0, totalItems: 0 };
      }
    } catch (error) {
      console.error('❌ Erreur X scraping:', error);
      return { success: false, items: [], errors: [error.message], processedFeeds: 0, totalItems: 0 };
    }
  }

  /**
   * Exécute le filtrage des nouvelles traditionnelles
   */
  async runNewsFiltering() {
    try {
      const { NewsFilterAgent } = await import(`${projectRoot}/src/backend/agents/NewsFilterAgent.js`);

      const request = {
        query: "Analyse les dernières nouvelles financières pertinentes",
        agent_type: "news_filter",
        use_database: true
      };

      const agent = new NewsFilterAgent();
      const response = await agent.process(request);

      if (response.success && response.data?.relevant_news) {
        return response.data.relevant_news;
      } else {
        console.log('⚠️ Aucune nouvelle pertinente trouvée par le NewsFilterAgent');
        return [];
      }
    } catch (error) {
      console.error('❌ Erreur filtrage nouvelles:', error);
      return [];
    }
  }

  /**
   * Publie les nouvelles sur Discord
   */
  async publishToDiscord(news) {
    try {
      // Importer Discord.js
      const { Client, GatewayIntentBits } = await import('discord.js');

      const client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent
        ]
      });

      await client.login(process.env.DISCORD_TOKEN);

      const channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID);
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
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (itemError) {
          console.error(`❌ Erreur publication item ${item.title}:`, itemError);
        }
      }

      await client.destroy();
      console.log('✅ Publication terminée');

    } catch (error) {
      console.error('❌ Erreur publication Discord:', error);
      throw error;
    }
  }
}

// Exécution si fichier appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  const publisher = new AutoPublisher();
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

export { AutoPublisher };