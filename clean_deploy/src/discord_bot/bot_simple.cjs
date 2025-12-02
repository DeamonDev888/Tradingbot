#!/usr/bin/env node

const { Client, GatewayIntentBits, TextChannel } = require('discord.js');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const cron = require('node-cron');
const path = require('path');

// Import des agents depuis le dossier compilé
const { RougePulseAgent } = require('../../../backend/agents/RougePulseAgent');
const { VixSimpleAgent } = require('../../../backend/agents/VixSimpleAgent');
const { Vortex500Agent } = require('../../../backend/agents/Vortex500Agent');
const { TradingEconomicsScraper } = require('../../../backend/ingestion/TradingEconomicsScraper');
const { NewsAggregator } = require('../../../backend/ingestion/NewsAggregator');
const { VixPlaywrightScraper } = require('../../../backend/ingestion/VixPlaywrightScraper');

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'financial_analyst',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '9022',
});

const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID || '';
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
  console.log(`🤖 Discord Bot logged in as ${client.user?.tag}`);
  console.log(
    `🔗 Lien d'invitation: https://discord.com/api/oauth2/authorize?client_id=${APPLICATION_ID}&permissions=84992&scope=bot`
  );

  // Schedule daily summary
  cron.schedule('0 8 * * *', async () => {
    console.log('⏰ Running daily summary...');
    await postDailySummary();
  });
});

// Basic message handling
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  console.log(`📩 Message received: "${message.content}" from ${message.author.tag} in ${message.channelId}`);

  // Simple ping command
  if (message.content.trim().toLowerCase() === '!ping') {
    await message.reply('🏓 Pong!');
  }

  // Help command
  if (message.content.trim().toLowerCase() === '!help') {
    await message.reply(formatHelpMessage());
  }

  // Status command
  if (message.content.trim().toLowerCase() === '!status') {
    await message.reply(formatStatusMessage());
  }

  // Sentiment command
  if (message.content.trim().toLowerCase() === '!sentiment') {
    console.log('🔍 Processing !sentiment command...');
    const sentiment = await getLatestSentiment();
    if (sentiment) {
      console.log('✅ Sentiment found, replying...');
      await message.reply(formatSentimentMessage(sentiment));
    } else {
      console.log('❌ No sentiment found in DB.');
      await message.reply('❌ No sentiment analysis found in database.');
    }
  }

  // VIX command
  if (message.content.trim().toLowerCase() === '!vix') {
    console.log('🔍 Processing !vix command...');
    const vix = await getLatestVix();
    if (vix) {
      console.log('✅ VIX found, replying...');
      await message.reply(formatVixMessage(vix));
    } else {
      console.log('❌ No VIX found in DB.');
      await message.reply('❌ No VIX analysis found in database.');
    }
  }

  // RougePulse command
  if (
    message.content.trim().toLowerCase() === '!rougepulse' ||
    message.content.trim().toLowerCase() === '!pulse'
  ) {
    console.log('🔴 Processing !rougepulse command...');
    const rougePulse = await getLatestRougePulse();
    if (rougePulse) {
      console.log('✅ RougePulse found, replying...');
      await message.reply(formatRougePulseMessage(rougePulse));
    } else {
      console.log('❌ No RougePulse found in DB.');
      await message.reply('❌ No RougePulse analysis found in database.');
    }
  }

  // ===== NOUVELLES COMMANDES POUR EXECUTER LES SCRIPTS =====

  // Commandes pour les AGENTS
  if (message.content.trim().toLowerCase() === '!run-rougepulse') {
    console.log('🚀 Lancement du RougePulseAgent...');
    await message.reply('🔄 Lancement de l\'analyse RougePulse en cours...');

    try {
      const agent = new RougePulseAgent();
      const result = await agent.analyzeMarketSentiment();
      await agent.close();

      if (result && !result.error) {
        console.log('✅ RougePulseAgent terminé avec succès');
        await message.reply(`✅ **Analyse RougePulse terminée**\n\n**Événements trouvés:** ${result.total_events || 0}\n**Événements critiques:** ${result.critical_count || 0}\n**Score de volatilité:** ${result.volatility_score || 0}/10\n\n*Résumé généré avec succès*`);
      } else {
        console.log('❌ Erreur dans RougePulseAgent:', result?.error);
        await message.reply(`❌ **Erreur lors de l'analyse RougePulse**\n\`${result?.error || 'Erreur inconnue'}\``);
      }
    } catch (error) {
      console.error('❌ Exception dans RougePulseAgent:', error);
      await message.reply(`❌ **Exception lors de l'exécution**\n\`${error instanceof Error ? error.message : 'Erreur inconnue'}\``);
    }
  }

  if (message.content.trim().toLowerCase() === '!run-vixsimple') {
    console.log('📈 Lancement du VixSimpleAgent...');
    await message.reply('🔄 Lancement de l\'analyse VIX en cours...');

    try {
      const agent = new VixSimpleAgent();
      const result = await agent.analyzeVixStructure();

      if (result && 'error' in result && result.error) {
        console.log('❌ Erreur dans VixSimpleAgent:', result.error);
        await message.reply(`❌ **Erreur lors de l'analyse VIX**\n\`${result.error}\``);
      } else if (result && 'current_vix_data' in result) {
        const vixValue = result.current_vix_data?.consensus_value || 'N/A';
        const regime = result.expert_volatility_analysis?.volatility_regime || 'N/A';
        const trend = result.expert_volatility_analysis?.vix_trend || 'N/A';

        console.log('✅ VixSimpleAgent terminé avec succès');
        await message.reply(`✅ **Analyse VIX terminée**\n\n**VIX Actuel:** ${vixValue}\n**Régime de volatilité:** ${regime}\n**Tendance:** ${trend}\n**Sources VIX:** ${result.metadata?.vix_sources_count || 0}\n\n*Analyse sauvegardée en base de données*`);
      } else {
        console.log('❌ Résultat invalide dans VixSimpleAgent');
        await message.reply('❌ **Résultat invalide**\n\n*L\'analyse VIX n\'a pas retourné de données valides*');
      }
    } catch (error) {
      console.error('❌ Exception dans VixSimpleAgent:', error);
      await message.reply(`❌ **Exception lors de l'exécution**\n\`${error instanceof Error ? error.message : 'Erreur inconnue'}\``);
    }
  }

  if (message.content.trim().toLowerCase() === '!run-vortex500') {
    console.log('🧪 Lancement du Vortex500Agent...');
    await message.reply('🔄 Lancement de l\'analyse de sentiment Vortex500 en cours...');

    try {
      const agent = new Vortex500Agent();
      const result = await agent.analyzeMarketSentiment();

      if (result && result.sentiment && result.sentiment !== 'N/A') {
        console.log('✅ Vortex500Agent terminé avec succès');
        const sentimentMap = {
          BULLISH: 'HAUSSIER 🟢',
          BEARISH: 'BAISSIER 🔴',
          NEUTRAL: 'NEUTRE ⚪',
        };

        await message.reply(`✅ **Analyse Vortex500 terminée**\n\n**Sentiment:** ${sentimentMap[result.sentiment] || result.sentiment}\n**Score:** ${result.score}/100\n**Niveau de risque:** ${result.risk_level || 'N/A'}\n**Sources de données:** ${result.data_source || 'N/A'}\n**Nombre d'articles:** ${result.news_count || 0}\n\n*Analyse sauvegardée avec succès*`);
      } else {
        console.log('❌ Erreur dans Vortex500Agent - pas de résultat valide');
        await message.reply(`❌ **Erreur lors de l'analyse Vortex500**\n\`Pas de résultat valide retourné\`\n\n*Assurez-vous que des données news sont disponibles dans la base de données*`);
      }
    } catch (error) {
      console.error('❌ Exception dans Vortex500Agent:', error);
      await message.reply(`❌ **Exception lors de l'exécution**\n\`${error instanceof Error ? error.message : 'Erreur inconnue'}\``);
    }
  }

  // Commandes pour les SCRAPERS
  if (message.content.trim().toLowerCase() === '!run-tradingeconomics') {
    console.log('📊 Lancement du TradingEconomicsScraper...');
    await message.reply('🔄 Lancement du scraping Trading Economics en cours...');

    try {
      const scraper = new TradingEconomicsScraper();
      const events = await scraper.scrapeUSCalendar();

      if (events && events.length > 0) {
        await scraper.saveEvents(events);
        console.log(`✅ TradingEconomicsScraper terminé - ${events.length} événements`);
        await message.reply(`✅ **Scraping Trading Economics terminé**\n\n**Événements récupérés:** ${events.length}\n**Événements sauvegardés:** ${events.length}\n**Période:** 7 prochains jours\n\n*Données économiques sauvegardées en base de données*`);
      } else {
        console.log('⚠️ TradingEconomicsScraper n\'a trouvé aucun événement');
        await message.reply('⚠️ **Aucun événement trouvé**\n\n*Le scraping s\'est terminé mais aucun événement n\'a été récupéré*');
      }
    } catch (error) {
      console.error('❌ Exception dans TradingEconomicsScraper:', error);
      await message.reply(`❌ **Exception lors de l'exécution**\n\`${error instanceof Error ? error.message : 'Erreur inconnue'}\``);
    }
  }

  if (message.content.trim().toLowerCase() === '!run-newsaggregator') {
    console.log('📰 Lancement du NewsAggregator...');
    await message.reply('🔄 Lancement de l\'agrégation de news en cours...\n\n⏳ *Ceci peut prendre plusieurs minutes...*');

    try {
      const aggregator = new NewsAggregator();
      const totalNews = await aggregator.fetchAndSaveAllNews();
      await aggregator.close();

      console.log(`✅ NewsAggregator terminé - ${totalNews} articles`);
      await message.reply(`✅ **Agrégation de news terminée**\n\n**Total d'articles:** ${totalNews}\n**Sources:** ZeroHedge, CNBC, FinancialJuice, X/Twitter, Finnhub, FRED, TradingEconomics\n\n*Articles sauvegardés en base de données pour analyse*`);
    } catch (error) {
      console.error('❌ Exception dans NewsAggregator:', error);
      await message.reply(`❌ **Exception lors de l'exécution**\n\`${error instanceof Error ? error.message : 'Erreur inconnue'}\`\n\n*Le scraping de news peut échouer en raison de protections anti-bot*`);
    }
  }

  if (message.content.trim().toLowerCase() === '!run-vixplaywright') {
    console.log('🎭 Lancement du VixPlaywrightScraper...');
    await message.reply('🔄 Lancement du scraping VIX avec Playwright en cours...');

    try {
      const scraper = new VixPlaywrightScraper();
      const result = await scraper.scrapeVVIX();

      // Vérification flexible qui s'adaptera à la refactorisation
      if (result && typeof result === 'object' && !result.error) {
        console.log('✅ VixPlaywrightScraper terminé avec succès');

        // Récupérer les informations disponibles de manière flexible
        const value = result.value || 'N/A';
        const changePct = result.change_pct || 'N/A';
        const source = result.source || 'Playwright';
        const lastUpdate = result.last_update || new Date().toISOString();

        await message.reply(`✅ **Scraping VIX terminé**\n\n**Valeur VIX:** ${value}\n**Variation:** ${changePct}%\n**Source:** ${source}\n**Dernière mise à jour:** ${new Date(lastUpdate).toLocaleString('fr-FR')}\n\n*Données VIX sauvegardées pour analyse*`);
      } else {
        const errorMsg = result?.error || 'Erreur inconnue';
        console.log('⚠️ VixPlaywrightScraper n\'a pas récupéré de données:', errorMsg);
        await message.reply(`⚠️ **Aucune donnée VIX récupérée**\n\n*Le scraping s\'est terminé mais a rencontré: ${errorMsg}*`);
      }
    } catch (error) {
      console.error('❌ Exception dans VixPlaywrightScraper:', error);
      await message.reply(`❌ **Exception lors de l'exécution**\n\`${error instanceof Error ? error.message : 'Erreur inconnue'}\`\n\n*Le scraping VIX peut échouer en raison de protections ou de changements de sites*`);
    }
  }

  // ===== FIN DES NOUVELLES COMMANDES =====
});

// Database functions
async function getLatestSentiment() {
  try {
    const res = await pool.query(
      `SELECT * FROM sentiment_analyses ORDER BY created_at DESC LIMIT 1`
    );
    return res.rows[0];
  } catch (e) {
    console.error('Error fetching sentiment:', e);
    return null;
  }
}

async function getLatestVix() {
  try {
    const res = await pool.query(`SELECT * FROM vix_analyses ORDER BY created_at DESC LIMIT 1`);
    return res.rows[0];
  } catch {
    return null;
  }
}

async function getLatestRougePulse() {
  try {
    const res = await pool.query(
      `SELECT * FROM rouge_pulse_analyses ORDER BY created_at DESC LIMIT 1`
    );
    return res.rows[0];
  } catch (e) {
    console.error('Error fetching rouge pulse:', e);
    return null;
  }
}

// Message formatting functions
function formatHelpMessage() {
  return `
**🤖 NovaQuote Financial Analyst - Commandes**

📊 **Commandes de Base (Base de données) :**
• \`!ping\` - Tester la connexion du bot
• \`!status\` - Vérifier l'état du système
• \`!sentiment\` - Dernière analyse de sentiment (instant)
• \`!vix\` - Dernière analyse VIX (instant)
• \`!rougepulse\` - Dernière analyse calendrier économique (instant)
• \`!pulse\` - Alias pour !rougepulse
• \`!help\` - Afficher ce message d'aide

🚀 **Agents IA (Lancer des analyses) :**
• \`!run-rougepulse\` - Lancer l'analyse du calendrier économique
• \`!run-vixsimple\` - Lancer l'analyse VIX/VVIX
• \`!run-vortex500\` - Lancer l'analyse de sentiment de marché

📡 **Scrapers (Récupérer des données) :**
• \`!run-tradingeconomics\` - Scraper le calendrier économique US
• \`!run-newsaggregator\` - Agréger les news financières
• \`!run-vixplaywright\` - Scraper les données VIX en temps réel

⚡ **Fonctionnalités Automatiques :**
• Résumé quotidien des marchés à 8h00

💡 **Information :**
Les agents analysent les données existantes en base de données.
Les scrapers récupèrent de nouvelles données avant analyse.
Certaines commandes peuvent prendre plusieurs minutes.

*Pour plus d'options, éditez src/discord_bot/index.ts*
*Besoin d'aide supplémentaire ? Contactez l'administrateur !*
  `.trim();
}

function formatStatusMessage() {
  return `
**🔍 État du Système**

🤖 **Bot NovaQuote:** En ligne ✅
📊 **Base de données:** Connectée ✅
⏰ **Prochain résumé:** 8h00 (GMT-5)

**Services Disponibles:**
• Analyse de sentiment ✅
• Analyse VIX ✅
• Calendrier économique ✅
• Agents IA ✅
• Scrapers ✅

**Dernière Mise à Jour:** ${new Date().toLocaleString('fr-FR')}
  `.trim();
}

function formatSentimentMessage(data) {
  const catalysts = data.catalysts
    ? Array.isArray(data.catalysts)
      ? data.catalysts
      : JSON.parse(data.catalysts)
    : [];

  const sentimentMap = {
    BULLISH: 'HAUSSIER 🟢',
    BEARISH: 'BAISSIER 🔴',
    NEUTRAL: 'NEUTRE ⚪',
  };
  const riskMap = {
    LOW: 'FAIBLE 🛡️',
    MEDIUM: 'MOYEN ⚠️',
    HIGH: 'ÉLEVÉ 🚨',
    CRITICAL: 'CRITIQUE 💀',
  };

  const sentiment = sentimentMap[data.overall_sentiment?.toUpperCase()] || data.overall_sentiment;
  const risk = riskMap[data.risk_level?.toUpperCase()] || data.risk_level;

  return `
**📊 Analyse du Sentiment de Marché**
**Sentiment :** ${sentiment}
**Score :** ${data.score}/100
**Niveau de Risque :** ${risk}

**📝 Résumé :**
${data.summary}

**🔑 Catalyseurs Clés :**
${catalysts.map(c => `• ${c}`).join('\n')}

*Date de l'analyse : ${data.created_at ? new Date(data.created_at).toLocaleString('fr-FR') : 'Date non disponible'}*
  `.trim();
}

function formatVixMessage(row) {
  const data = row.analysis_data;
  const expert = data?.expert_volatility_analysis || {};
  const current = data?.current_vix_data || {};

  const trendMap = {
    BULLISH: 'HAUSSIER 📈',
    BEARISH: 'BAISSIER 📉',
    NEUTRAL: 'NEUTRE ➡️',
  };

  return `
**📉 Analyse Volatilité VIX**
**VIX Actuel :** ${current.consensus_value ?? 'N/A'}
**Tendance :** ${trendMap[expert.vix_trend?.toUpperCase()] || expert.vix_trend || 'N/A'}
**Régime :** ${expert.volatility_regime ?? 'N/A'}

**💡 Résumé Expert :**
${expert.expert_summary ?? 'Aucun résumé disponible.'}

**🎯 Recommandation Trading :**
Stratégie : ${expert.trading_recommendations?.strategy || 'N/A'}
Niveaux Cibles : ${expert.trading_recommendations?.target_vix_levels?.join(' - ') || 'N/A'}

*Date de l'analyse : ${row.created_at ? new Date(row.created_at).toLocaleString('fr-FR') : 'Date non disponible'}*
  `.trim();
}

function formatRougePulseMessage(data) {
  const narrative = data.market_narrative || 'Pas de narratif disponible.';
  const score = data.impact_score || 0;
  const events = Array.isArray(data.high_impact_events)
    ? data.high_impact_events
    : data.high_impact_events
      ? JSON.parse(data.high_impact_events)
      : [];

  const rec = data.trading_recommendation || 'Aucune recommandation.';

  let eventsList = '';
  if (events.length > 0) {
    eventsList = events
      .map(e => {
        const event = e.event || e.name || 'Événement';
        const details = e.actual_vs_forecast || e.actual || 'N/A';
        const significance = e.significance || '';

        return `**📊 ${event}**\n💫 ${details}${significance ? `\n🎯 ${significance}` : ''}`;
      })
      .join('\n\n');
  } else {
    eventsList = '**📋 Aucun événement majeur détecté**';
  }

  return `
**🔴 RougePulse ES Futures Expert** 📊
**Impact :** ${score}/100 ${score >= 70 ? '🔥' : score >= 50 ? '⚠️' : '📉'}

**📈 Analyse de Marché :**
${narrative}

**📅 Événements Économiques :**
${eventsList}

**🎯 Signal Trading :**
${rec}

💹 *RougePulse Analysis | ${(() => {
    try {
      return data.created_at && new Date(data.created_at).getTime() > 0
        ? new Date(data.created_at).toLocaleDateString('fr-FR')
        : new Date().toLocaleDateString('fr-FR');
    } catch {
      return new Date().toLocaleDateString('fr-FR');
    }
  })()}*
  `.trim();
}

async function postDailySummary() {
  try {
    const [sentiment, vix, rougePulse] = await Promise.all([
      getLatestSentiment(),
      getLatestVix(),
      getLatestRougePulse()
    ]);

    let summary = '**📊 Résumé Quotidien des Marchés**\n\n';

    if (sentiment) {
      summary += `**📈 Sentiment:** ${sentiment.overall_sentiment || 'N/A'} (${sentiment.score || 'N/A'}/100)\n`;
    }

    if (vix) {
      const data = vix.analysis_data;
      const current = data?.current_vix_data || {};
      summary += `**📉 VIX:** ${current.consensus_value || 'N/A'}\n`;
    }

    if (rougePulse) {
      summary += `**🔴 Impact RougePulse:** ${rougePulse.impact_score || 'N/A'}/100\n`;
    }

    if (!sentiment && !vix && !rougePulse) {
      summary += 'Aucune analyse disponible actuellement.';
    }

    summary += `\n*${new Date().toLocaleDateString('fr-FR')}*`;

    if (CHANNEL_ID) {
      const channel = await client.channels.fetch(CHANNEL_ID);
      if (channel) {
        await channel.send(summary);
      }
    }
  } catch (error) {
    console.error('Error posting daily summary:', error);
  }
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

// Start the bot
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