#!/usr/bin/env node

/**
 * Outil pour trouver le vrai URL X/Twitter depuis les messages Discord
 */

import { Client, GatewayIntentBits } from 'discord.js';

class TwitterUrlFinder {
  constructor() {
    this.token = process.env.DISCORD_TOKEN;
    this.channelId = process.env.DISCORD_CHANNEL_ID;
  }

  /**
   * Connecte à Discord et cherche les messages récents
   */
  async findTwitterUrl(title, source, maxMessages = 100) {
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

      console.log(`🔍 Recherche de "${title}" dans les ${maxMessages} derniers messages...`);

      // Récupérer les messages récents
      const messages = await channel.messages.fetch({ limit: maxMessages });

      // Chercher le message qui correspond à notre titre
      for (const message of messages.values()) {
        // Vérifier si le message contient le titre (partiellement)
        if (this.isMatchingMessage(message.content, title, source)) {
          const twitterUrl = this.extractTwitterUrl(message.content);
          if (twitterUrl) {
            console.log(`✅ Vrai URL X trouvé : ${twitterUrl}`);
            await client.destroy();
            return twitterUrl;
          }
        }
      }

      console.log('❌ Aucun message correspondant trouvé dans les messages récents');
      await client.destroy();
      return null;

    } catch (error) {
      console.error('❌ Erreur Discord:', error);
      await client.destroy?.();
      return null;
    }
  }

  /**
   * Vérifie si un message correspond à notre news
   */
  isMatchingMessage(messageContent, title, source) {
    const messageLower = messageContent.toLowerCase();
    const titleLower = title.toLowerCase();
    const sourceLower = source.toLowerCase();

    // Rechercher des mots-clés du titre et de la source
    const titleWords = titleLower.split(' ').filter(word => word.length > 3);
    const foundKeywords = titleWords.some(word => messageLower.includes(word));

    // Vérifier si la source est mentionnée
    const foundSource = messageLower.includes(sourceLower);

    return foundKeywords && foundSource;
  }

  /**
   * Extrait l'URL X/Twitter depuis le contenu du message
   */
  extractTwitterUrl(messageContent) {
    // Chercher les URLs X/Twitter dans le message
    const twitterUrlPattern = /https?:\/\/(?:www\.)?(x\.com|twitter\.com)\/\S+/gi;
    const matches = messageContent.match(twitterUrlPattern);

    if (matches && matches.length > 0) {
      return matches[0]; // Retourner la première URL trouvée
    }

    return null;
  }

  /**
   * Test avec un message manuel
   */
  async testManualSearch(title, source) {
    console.log(`\n🧪 Test manuel pour: "${title}" (${source})`);
    return await this.findTwitterUrl(title, source, 200);
  }
}

// Test du système
async function main() {
  const finder = new TwitterUrlFinder();

  // Exemple avec une news réelle
  await finder.testManualSearch(
    "Chine annonce nouvelles mesures de soutien économique",
    "Xinhua"
  );
}

main().catch(console.error);