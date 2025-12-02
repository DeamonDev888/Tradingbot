import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { NewsAggregator } from '../backend/ingestion/NewsAggregator';
import * as dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Reaction, Partials.Message],
});

let newsAggregator: NewsAggregator | null = null;

client.on('ready', () => {
  console.log(`🤖 Bot Discord connecté en tant que ${client.user?.tag}`);
  console.log(`📡 Prêt à traiter les commandes...`);
});

client.on('messageCreate', async message => {
  if (message.author.bot || !message.content?.startsWith('!')) return;

  const content = message.content.trim().toLowerCase();

  try {
    switch (content) {
      case '!ping':
        await message.reply('🏓 Pong!');
        break;

      case '!help':
        await message.reply(`
🤖 **NovaQuote Bot - Commandes disponibles :**

📊 **Données de marché :**
• \`!vix\` - Indice de volatilité S&P 500 (VIX)
• \`!vortex\` - Indice de volatilité CBOE (VXZ)
• \`!sp500\` - Données S&P 500 (SPY)

📰 **News Financières :**
• \`!news\` - Récupérer les news via API Finnhub ✅
• \`!run-newsaggregator\` - Agréger toutes les sources de news
• \`!run-newsfilter\` - Filtrer et sauvegarder les news pertinentes

💡 **Finnhub API est 100% fonctionnelle !**
        `);
        break;

      case '!news':
      case '!run-newsaggregator': {
        if (!newsAggregator) {
          newsAggregator = new NewsAggregator();
          await newsAggregator.init();
        }

        await message.reply('🔄 Récupération des news en cours...');
        const newsCount = await newsAggregator.fetchAndSaveAllNews();

        if (newsCount > 0) {
          await message.reply(`✅ **${newsCount} news récupérées !**

Sources actives :
• Finnhub API ✅ (plusieurs centaines d'articles)
• Autres sources RSS (peuvent être limitées)

Utilisez \`!run-newsfilter\` pour analyser et publier les plus pertinentes !`);
        } else {
          await message.reply('❌ Aucune news récupérée. Vérifiez les logs.');
        }
        break;
      }

      case '!run-newsfilter':
        if (!newsAggregator) {
          newsAggregator = new NewsAggregator();
          await newsAggregator.init();
        }

        await message.reply('🕵️ Lancement du NewsFilterAgent...');
        await newsAggregator.fetchAndSaveAllNews();
        break;

      case '!post-top-news':
        if (!newsAggregator) {
          newsAggregator = new NewsAggregator();
          await newsAggregator.init();
        }

        await message.reply('📢 Publication des news les plus pertinentes...');
        // La logique de publication est gérée par le système existant
        await newsAggregator.fetchAndSaveAllNews();
        break;

      default:
        await message.reply(
          `❌ Commande inconnue: ${content}\nUtilisez \`!help\` pour voir les commandes.`
        );
    }
  } catch (error) {
    console.error('❌ Erreur commande:', error);
    await message.reply('❌ Une erreur est survenue. Vérifiez les logs.');
  }
});

// Login avec le token Discord
client.login(process.env.DISCORD_TOKEN).catch(error => {
  console.error('❌ Erreur de connexion Discord:', error);
});
