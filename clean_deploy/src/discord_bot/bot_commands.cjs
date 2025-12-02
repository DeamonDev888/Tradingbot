#!/usr/bin/env node

const { Client, GatewayIntentBits } = require('discord.js');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const APPLICATION_ID = process.env.DISCORD_APPLICATION_ID || '';

client.once('ready', () => {
  const asciiArt = `
   _______
  /       \\
 /  🤖 BOT  \\
| FINANCIAL |
 \\ ANALYST /
  \\_______/
  `;
  console.log(asciiArt);
  console.log(`🤖 Discord Bot Command Runner logged in as ${client.user?.tag}`);
  console.log(
    `🔗 Lien d'invitation: https://discord.com/api/oauth2/authorize?client_id=${APPLICATION_ID}&permissions=84992&scope=bot`
  );
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  console.log(`📩 Command: "${message.content}" from ${message.author.tag}`);

  // Simple ping command
  if (message.content.trim().toLowerCase() === '!ping') {
    await message.reply('🏓 Pong!');
    return;
  }

  // Help command
  if (message.content.trim().toLowerCase() === '!help') {
    await message.reply(formatHelpMessage());
    return;
  }

  // ===== COMMANDES POUR EXECUTER LES SCRIPTS =====

  // Commandes pour les AGENTS
  if (message.content.trim().toLowerCase() === '!run-rougepulse') {
    await executeScript(message, 'RougePulseAgent', 'ts-node src/backend/agents/RougePulseAgent.ts', '🚀 Lancement du RougePulseAgent...');
    return;
  }

  if (message.content.trim().toLowerCase() === '!run-vixsimple') {
    await executeScript(message, 'VixSimpleAgent', 'ts-node src/backend/agents/VixSimpleAgent.ts', '📈 Lancement du VixSimpleAgent...');
    return;
  }

  if (message.content.trim().toLowerCase() === '!run-vortex500') {
    await executeScript(message, 'Vortex500Agent', 'ts-node src/backend/agents/Vortex500Agent.ts', '🧪 Lancement du Vortex500Agent...');
    return;
  }

  // Commandes pour les SCRAPERS
  if (message.content.trim().toLowerCase() === '!run-tradingeconomics') {
    await executeScript(message, 'TradingEconomicsScraper', 'ts-node src/backend/ingestion/TradingEconomicsScraper.ts', '📊 Lancement du TradingEconomicsScraper...');
    return;
  }

  if (message.content.trim().toLowerCase() === '!run-newsaggregator') {
    await executeScript(message, 'NewsAggregator', 'ts-node src/backend/ingestion/NewsAggregator.ts', '📰 Lancement du NewsAggregator...\n\n⏳ *Ceci peut prendre plusieurs minutes...', true);
    return;
  }

  if (message.content.trim().toLowerCase() === '!run-vixplaywright') {
    await executeScript(message, 'VixPlaywrightScraper', 'ts-node src/backend/ingestion/VixPlaywrightScraper.ts', '🎭 Lancement du VixPlaywrightScraper...');
    return;
  }
});

// Fonction générique pour exécuter un script
async function executeScript(message, scriptName, command, startMessage, isLong = false) {
  console.log(`🚀 Lancement de ${scriptName}...`);

  const replyMessage = await message.reply(`${startMessage}\n\n⏳ *Exécution en cours...*${isLong ? '\n\n*Cette opération peut prendre plusieurs minutes.*' : ''}`);

  try {
    const startTime = Date.now();

    const result = await new Promise((resolve, reject) => {
      const child = exec(command, {
        cwd: process.cwd(),
        timeout: isLong ? 300000 : 120000, // 5 min max pour long, 2 min pour normal
        encoding: 'utf8'
      }, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Erreur ${scriptName}:`, error);
          resolve({
            success: false,
            error: error.message,
            stdout: stdout,
            stderr: stderr
          });
        } else {
          console.log(`✅ ${scriptName} terminé avec succès`);
          resolve({
            success: true,
            stdout: stdout,
            stderr: stderr
          });
        }
      });

      // Pour les opérations longues, envoyer des updates
      if (isLong) {
        const updateInterval = setInterval(() => {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          replyMessage.edit(`${startMessage}\n\n⏳ *Exécution en cours...* (${elapsed}s écoulés)`);
        }, 30000); // Update every 30 seconds

        child.on('close', () => clearInterval(updateInterval));
      }
    });

    const elapsed = Math.floor((Date.now() - startTime) / 1000);

    if (result.success) {
      await replyMessage.edit(`✅ **${scriptName} terminé avec succès**\n\n**Durée:** ${elapsed}s\n\n*Les résultats ont été sauvegardés dans la base de données*`);
    } else {
      await replyMessage.edit(`❌ **Erreur lors de l'exécution de ${scriptName}**\n\n**Durée:** ${elapsed}s\n\n**Erreur:** \`${result.error}\`\n\n*Vérifiez les logs pour plus de détails*`);
    }

  } catch (error) {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    console.error(`❌ Exception dans ${scriptName}:`, error);
    await replyMessage.edit(`❌ **Exception lors de l'exécution**\n\n**Durée:** ${elapsed}s\n\n**Erreur:** \`${error.message}\`\n\n*Le script a rencontré une erreur inattendue*`);
  }
}

function formatHelpMessage() {
  return `
**🤖 NovaQuote Financial Analyst - Commandes**

📊 **Commandes de Base :**
• \`!ping\` - Tester la connexion du bot
• \`!help\` - Afficher ce message d'aide

🚀 **Agents IA (Lancer des analyses) :**
• \`!run-rougepulse\` - Lancer l'analyse du calendrier économique
• \`!run-vixsimple\` - Lancer l'analyse VIX/VVIX
• \`!run-vortex500\` - Lancer l'analyse de sentiment de marché

📡 **Scrapers (Récupérer des données) :**
• \`!run-tradingeconomics\` - Scraper le calendrier économique US
• \`!run-newsaggregator\` - Agréger les news financières
• \`!run-vixplaywright\` - Scraper les données VIX en temps réel

⚡ **Information :**
• Les scripts sont exécutés avec ts-node directement
• Les opérations longues affichent le temps écoulé
• Les résultats sont sauvegardés en base de données

*Pour plus d'options, modifiez src/discord_bot/bot_commands.cjs*
*Besoin d'aide supplémentaire ? Contactez l'administrateur !*
  `.trim();
}

// Error handling
client.on('error', (error) => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down bot...');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down bot...');
  client.destroy();
  process.exit(0);
});

// Start bot
async function startBot() {
  try {
    const token = process.env.DISCORD_TOKEN;
    if (!token) {
      throw new Error('DISCORD_TOKEN not found in environment variables');
    }

    await client.login(token);
  } catch (error) {
    console.error('Failed to start bot:', error);
    process.exit(1);
  }
}

// Bootstrap
startBot();