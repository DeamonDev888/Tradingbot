import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import * as cron from 'node-cron';
import * as path from 'path';
import { RougePulseAgent } from '../backend/agents/RougePulseAgent';
import { VixombreAgent } from '../backend/agents/VixombreAgent';
import { Vortex500Agent } from '../backend/agents/Vortex500Agent';
import { NewsAggregator } from '../backend/ingestion/NewsAggregator';
import { TradingEconomicsScraper } from '../backend/ingestion/TradingEconomicsScraper';
import { VixPlaywrightScraper } from '../backend/ingestion/VixPlaywrightScraper';

// ... imports

// Load env
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
const APPLICATION_ID = '1442309135646331001';

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

  cron.schedule('0 8 * * *', async () => {
    console.log('⏰ Running daily summary...');
    await postDailySummary();
  });
});

client.on('messageCreate', async message => {
  console.log(
    `📩 Message received: "${message.content}" from ${message.author.tag} in ${message.channelId}`
  );

  if (message.author.bot) return;

  if (message.content.trim() === '!sentiment') {
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

  if (message.content.trim() === '!vix') {
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

  if (
    message.content.trim().toLowerCase() === '!rougepulse' ||
    message.content.trim().toLowerCase() === '!pulse'
  ) {
    console.log('🔴 Processing !rougepulse command...');
    const rougePulse = await getLatestRougePulse();
    if (rougePulse) {
      console.log('✅ RougePulse found, replying...');
      const formattedMessages = formatRougePulseMessage(rougePulse);

      if (formattedMessages.length === 1) {
        await message.reply(formattedMessages[0]);
      } else {
        // Envoyer le premier message, puis le second après un délai
        await message.reply(formattedMessages[0]);
        setTimeout(async () => {
          try {
            await message.channel.send(formattedMessages[1]);
          } catch (error) {
            console.error('Error sending second message:', error);
          }
        }, 500);
      }
    } else {
      console.log('❌ No RougePulse found in DB.');
      await message.reply('❌ No RougePulse analysis found in database.');
    }
  }

  if (message.content.trim().toLowerCase() === '!rougepulseagent') {
    console.log('🔴 Processing !rougepulseagent command...');
    const loadingMsg = await message.reply(
      '🔴 **RougePulseAgent** analyse le calendrier économique... ⏳'
    );

    try {
      const agent = new RougePulseAgent();

      // Add a 95s timeout (slightly longer than agent's 90s timeout)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout: L'analyse prend trop de temps.")), 95000)
      );

      const result = (await Promise.race([agent.analyzeEconomicEvents(), timeoutPromise])) as any;

      if ('error' in result) {
        await loadingMsg.edit(`❌ Erreur d'analyse RougePulse : ${result.error}`);
      } else if ('message' in result) {
        await loadingMsg.edit(`ℹ️ **RougePulseAgent** : ${result.message}`);
      } else if (result && result.analysis) {
        const formattedMessages = formatRougePulseMessage(result.analysis);

        if (formattedMessages.length === 1) {
          // Un seul message - simple édition
          await loadingMsg.edit(formattedMessages[0]);
        } else {
          // Deux messages - éditer le premier, puis envoyer le second
          await loadingMsg.edit(formattedMessages[0]);
          setTimeout(async () => {
            try {
              await message.channel.send(formattedMessages[1]);
            } catch (sendError) {
              console.error('Error sending second message:', sendError);
              await message.channel.send("❌ Erreur lors de l'envoi du second message");
            }
          }, 500); // Délai de 500ms entre les messages
        }
      } else {
        await loadingMsg.edit('❌ **Erreur RougePulseAgent** : Résultat invalide ou vide');
      }
    } catch (error) {
      console.error('Error in RougePulseAgent command:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';

      // Truncate error message to avoid Discord 2000 character limit
      const truncatedError =
        errorMessage.length > 500 ? errorMessage.substring(0, 497) + '...' : errorMessage;
      let userMessage = `❌ **Erreur RougePulseAgent** : ${truncatedError}`;

      if (errorMessage.includes('Timeout')) {
        userMessage =
          "⏰ **Timeout RougePulseAgent** : L'analyse prend trop de temps. Réessayez plus tard.";
      } else if (errorMessage.includes('No significant events found')) {
        userMessage =
          'ℹ️ **RougePulseAgent** : Aucun événement économique significatif trouvé pour les prochaines 24h.';
      } else if (errorMessage.includes('Database')) {
        userMessage =
          '🗄️ **Erreur Base de Données** : Impossible de récupérer les données économiques. Vérifiez la connexion.';
      }

      await loadingMsg.edit(userMessage);
    }
  }

  if (message.content.trim().toLowerCase() === '!vixagent') {
    console.log('📊 Processing !vixagent command...');
    const loadingMsg = await message.reply('📊 **VixombreAgent** analyse la volatilité VIX... ⏳');

    try {
      const agent = new VixombreAgent();

      // Add a 180s timeout (augmenté pour VIX)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout: L'analyse VIX prend trop de temps.")), 180000)
      );

      const result = (await Promise.race([agent.analyzeVixStructure(), timeoutPromise])) as any;

      if ('error' in result) {
        await loadingMsg.edit(`❌ Erreur d'analyse VIX : ${result.error}`);
      } else {
        const messages = formatVixAgentMessage(result);

        if (messages.length === 0) {
          await loadingMsg.edit('❌ Erreur : Aucun message généré');
          return;
        }

        console.log(
          `[VIX] Envoi de ${messages.length} message(s) (${messages.map(m => m.length).join(', ')} caractères)`
        );

        try {
          // Mettre à jour le premier message
          await loadingMsg.edit(messages[0]);

          // Envoyer les messages supplémentaires avec validation
          for (let i = 1; i < messages.length; i++) {
            const msg = messages[i];
            if (msg.length <= 1999) {
              await message.channel.send(msg);
            } else {
              console.warn(
                `[VIX] Message ${i + 1} trop long (${msg.length} caractères), envoi annulé`
              );
            }
          }
        } catch (sendError) {
          console.error('[VIX] Erreur envoi messages:', sendError);
          await loadingMsg.edit(
            `❌ Erreur envoi : ${sendError instanceof Error ? sendError.message : 'Erreur inconnue'}`
          );
        }
      }
    } catch (error) {
      console.error('Error in VixAgent command:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';

      let userMessage = `❌ Erreur VIX : ${errorMessage.substring(0, 100)}...`;

      if (errorMessage.includes('Timeout')) {
        userMessage =
          '⏰ **Timeout VIXAgent** : Le scraping VIX prend trop de temps. Réessayez plus tard ou utilisez une commande plus rapide.';
        userMessage +=
          "\n💡 **Suggestion**: Le VIX nécessite l'analyse de plusieurs sources web, essayez pendant les heures de faible activité.";
      }

      // Truncate error message to avoid Discord 2000 character limit
      const truncatedError =
        userMessage.length > 500 ? userMessage.substring(0, 497) + '...' : userMessage;
      await loadingMsg.edit(truncatedError);
    }
  }

  if (message.content.trim().toLowerCase() === '!vortex500') {
    console.log('🧪 Processing !vortex500 command...');
    const loadingMsg = await message.reply('🧪 **Vortex500** analyse le sentiment de marché... ⏳');

    try {
      const agent = new Vortex500Agent();

      // Add a 180s timeout (augmenté pour VIX)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout: L'analyse VIX prend trop de temps.")), 180000)
      );

      const result = (await Promise.race([agent.analyzeMarketSentiment(), timeoutPromise])) as any;

      if (result.sentiment === 'N/A') {
        await loadingMsg.edit(`❌ Analyse Vortex500 indisponible : ${result.summary}`);
      } else {
        await loadingMsg.edit(formatVortex500Message(result));
      }
    } catch (error) {
      console.error('Error in Vortex500 command:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      // Truncate error message to avoid Discord 2000 character limit
      const truncatedError =
        errorMessage.length > 500 ? errorMessage.substring(0, 497) + '...' : errorMessage;
      await loadingMsg.edit(`❌ Erreur Vortex500 : ${truncatedError}`);
    }
  }

  if (message.content.trim().toLowerCase() === '!newsagg') {
    console.log('📰 Processing !newsagg command...');
    const loadingMsg = await message.reply(
      '📰 **NewsAggregator** récupère les dernières news... ⏳'
    );

    try {
      const aggregator = new NewsAggregator();

      // Récupérer les news depuis différentes sources
      const [zeroHedge, cnbc, financialJuice] = await Promise.allSettled([
        aggregator.fetchZeroHedgeHeadlines(),
        aggregator.fetchCNBCMarketNews(),
        aggregator.fetchFinancialJuice(),
      ]);

      const allNews = [];
      let successCount = 0;

      if (zeroHedge.status === 'fulfilled') {
        allNews.push(...zeroHedge.value.map(n => `📌 **ZeroHedge**: ${n.title}`));
        successCount++;
      }
      if (cnbc.status === 'fulfilled') {
        allNews.push(...cnbc.value.map(n => `📈 **CNBC**: ${n.title}`));
        successCount++;
      }
      if (financialJuice.status === 'fulfilled') {
        allNews.push(...financialJuice.value.map(n => `💹 **FinancialJuice**: ${n.title}`));
        successCount++;
      }

      const newsMessage = `
**📰 News Aggregator - Dernières Nouvelles**
**Sources récupérées**: ${successCount}/3
**Total des articles**: ${allNews.length}

${allNews.slice(0, 15).join('\n\n')}

${allNews.length > 15 ? `... et ${allNews.length - 15} autres articles` : ''}

*Sources: ZeroHedge, CNBC, FinancialJuice*
      `.trim();

      await loadingMsg.edit(newsMessage);
    } catch (error) {
      console.error('Error in NewsAggregator command:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      // Truncate error message to avoid Discord 2000 character limit
      const truncatedError =
        errorMessage.length > 500 ? errorMessage.substring(0, 497) + '...' : errorMessage;
      await loadingMsg.edit(`❌ Erreur News : ${truncatedError}`);
    }
  }

  if (message.content.trim().toLowerCase() === '!tescraper') {
    console.log('📅 Processing !tescraper command...');
    const loadingMsg = await message.reply(
      '📅 **TradingEconomicsScraper** scrape le calendrier économique US... ⏳'
    );

    try {
      const scraper = new TradingEconomicsScraper();

      // Add a 60s timeout for scraping
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout: Le scraping prend trop de temps.')), 60000)
      );

      const events = (await Promise.race([scraper.scrapeUSCalendar(), timeoutPromise])) as any[];

      if (events.length === 0) {
        await loadingMsg.edit('❌ Aucun événement économique trouvé ou erreur de scraping.');
        return;
      }

      // Sauvegarder en base de données
      await scraper.saveEvents(events);

      // Formatter les événements pour Discord
      const formattedEvents = events.slice(0, 10).map(event => {
        const importance = '⭐'.repeat(event.importance || 1);
        return `**${event.event}** ${importance}
└ 🇺🇸 ${event.actual || 'Pending'} | 📊 ${event.forecast || 'N/A'} | 🔙 ${event.previous || 'N/A'}
└ 📅 ${event.date.toLocaleDateString('fr-FR')}`;
      });

      const scraperMessage = `
**📅 Trading Economics - Calendrier Éco US**
**Événements trouvés**: ${events.length}

${formattedEvents.join('\n\n')}

${events.length > 10 ? `... et ${events.length - 10} autres événements` : ''}

*Données sauvegardées en base de données*
      `.trim();

      await loadingMsg.edit(scraperMessage);
    } catch (error) {
      console.error('Error in TradingEconomicsScraper command:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      // Truncate error message to avoid Discord 2000 character limit
      const truncatedError =
        errorMessage.length > 500 ? errorMessage.substring(0, 497) + '...' : errorMessage;
      await loadingMsg.edit(`❌ Erreur TE Scraper : ${truncatedError}`);
    }
  }

  if (message.content.trim().toLowerCase() === '!vixscraper') {
    console.log('📈 Processing !vixscraper command...');
    const loadingMsg = await message.reply(
      '📈 **VixPlaywrightScraper** scrape les données VIX... ⏳'
    );

    try {
      const scraper = new VixPlaywrightScraper();

      // Add a 60s timeout for scraping
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout: Le scraping prend trop de temps.')), 60000)
      );

      const results = (await Promise.race([scraper.scrapeAll(), timeoutPromise])) as any[];

      if (results.length === 0) {
        await loadingMsg.edit('❌ Aucune donnée VIX trouvée ou erreur de scraping.');
        return;
      }

      // Formatter les résultats pour Discord
      const formattedResults = results.map(result => {
        if (result.error) {
          return `❌ **${result.source}**: Erreur - ${result.error}`;
        }

        const changeSymbol =
          result.change_pct && result.change_pct > 0
            ? '📈'
            : result.change_pct && result.change_pct < 0
              ? '📉'
              : '➡️';
        return `📊 **${result.source}**
└ Prix: ${result.value || 'N/A'} ${changeSymbol} ${result.change_pct || '0'}%
└ Fourchette: ${result.low || 'N/A'} - ${result.high || 'N/A'}
└ News: ${result.news_headlines?.length || 0} articles`;
      });

      const scraperMessage = `
**📈 VIX Scraper - Données de Volatilité**
**Sources analysées**: ${results.length}

${formattedResults.join('\n\n')}

*Métriques: ${scraper.getMetrics()?.averageResponseTime || 'N/A'}ms temps moyen*
      `.trim();

      await loadingMsg.edit(scraperMessage);
    } catch (error) {
      console.error('Error in VixPlaywrightScraper command:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      // Truncate error message to avoid Discord 2000 character limit
      const truncatedError =
        errorMessage.length > 500 ? errorMessage.substring(0, 497) + '...' : errorMessage;
      await loadingMsg.edit(`❌ Erreur VIX Scraper : ${truncatedError}`);
    }
  }

  if (message.content.trim() === '!help') {
    console.log('📖 Processing !help command...');
    await message.reply(formatHelpMessage());
  }
});

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

function formatRougePulseMessage(data: any): string[] {
  const narrative = data.market_narrative || 'Pas de narratif disponible.';
  const score = data.impact_score || 0;
  const events = Array.isArray(data.high_impact_events)
    ? data.high_impact_events
    : data.high_impact_events
      ? JSON.parse(data.high_impact_events)
      : [];

  // Gérer le nouveau format ES Futures (es_futures_analysis) et l'ancien (asset_analysis)
  const assets = data.asset_analysis
    ? typeof data.asset_analysis === 'string'
      ? JSON.parse(data.asset_analysis)
      : data.asset_analysis
    : {};
  const esFutures = data.es_futures_analysis
    ? typeof data.es_futures_analysis === 'string'
      ? JSON.parse(data.es_futures_analysis)
      : data.es_futures_analysis
    : assets.ES_Futures || {};

  const rec = data.trading_recommendation || 'Aucune recommandation.';

  // Vérifier et convertir en français si nécessaire
  const frenchNarrative = convertToFrenchIfNeeded(narrative);
  const frenchRec = convertToFrenchIfNeeded(rec);

  // Gérer le bias ES Futures avec le nouveau format
  const esBias =
    esFutures?.bias === 'BULLISH'
      ? '🟢 HAUSSIER'
      : esFutures?.bias === 'BEARISH'
        ? '🔴 BAISSIER'
        : '⚪ NEUTRE';

  // Former les événements complets sans troncation
  let eventsList = '';
  if (events.length > 0) {
    eventsList = events
      .map((e: any) => {
        const event = e.event || e.name || 'Événement';
        const details = e.actual_vs_forecast || e.actual || 'N/A';
        const significance = e.significance || '';

        return `**📊 ${event}**\n💫 ${details}${significance ? `\n🎯 ${significance}` : ''}`;
      })
      .join('\n\n');
  } else {
    eventsList = '**📋 Aucun événement majeur détecté**';
  }

  // Message 1 : En-tête, narration et début des événements
  const message1 = `
**🔴 RougePulse ES Futures Expert** 📊 (1/2)
**Impact :** ${score}/100 ${score >= 70 ? '🔥' : score >= 50 ? '⚠️' : '📉'} | **Tendance :** ${esBias}

**📈 Analyse de Marché :**
${frenchNarrative}

**📊 Données Prix ES :**
${data.sp500_price && !isNaN(data.sp500_price) ? `💹 ${Number(data.sp500_price).toFixed(2)} USD | **Source:** ${data.price_source || 'Conversion SPY'}` : '📊 Prix en cours de récupération...'}

**📅 Événements Économiques :**
${eventsList}
  `.trim();

  // Message 2 : Suite des événements (si nécessaire) et signal trading
  const message2 = `
**🎯 Signal Trading ES :**
${frenchRec}

💹 *ES Futures Analysis | ${(() => {
    try {
      return data.created_at && new Date(data.created_at).getTime() > 0
        ? new Date(data.created_at).toLocaleDateString('fr-FR')
        : new Date().toLocaleDateString('fr-FR');
    } catch {
      return new Date().toLocaleDateString('fr-FR');
    }
  })()}*
  `.trim();

  // Vérifier si on a besoin de 2 messages
  if (message1.length <= 1900) {
    return [message1]; // Un seul message suffit
  } else {
    // Séparer intelligemment en 2 messages
    const midpoint = Math.floor(frenchNarrative.length / 2);
    const part1Narrative = frenchNarrative.substring(0, midpoint) + '...';
    const part2Narrative = frenchNarrative.substring(midpoint);

    const optimizedMessage1 = `
**🔴 RougePulse ES Futures Expert** 📊 (1/2)
**Impact :** ${score}/100 ${score >= 70 ? '🔥' : score >= 50 ? '⚠️' : '📉'} | **Tendance :** ${esBias}

**📈 Analyse de Marché :**
${part1Narrative}

**📅 Événements Économiques :**
${eventsList}
    `.trim();

    const optimizedMessage2 = `
**🔴 RougePulse ES Futures Expert** 📊 (2/2)
**📈 Suite Analyse :**
${part2Narrative}

**🎯 Signal Trading ES :**
${frenchRec}

💹 *ES Futures Analysis | ${(() => {
      try {
        return data.created_at && new Date(data.created_at).getTime() > 0
          ? new Date(data.created_at).toLocaleDateString('fr-FR')
          : new Date().toLocaleDateString('fr-FR');
      } catch {
        return new Date().toLocaleDateString('fr-FR');
      }
    })()}*
    `.trim();

    return [optimizedMessage1, optimizedMessage2];
  }
}

// Fonction pour convertir l'anglais vers le français si nécessaire
function convertToFrenchIfNeeded(text: string): string {
  if (!text || typeof text !== 'string') return text;

  // Mots clés anglais à remplacer par leurs équivalents français
  const translations: { [key: string]: string } = {
    // Trading terms
    bullish: 'haussier',
    bearish: 'baissier',
    neutral: 'neutre',
    long: 'achat',
    short: 'vente',
    support: 'support',
    resistance: 'résistance',
    breakout: 'cassure',
    reversal: 'retournement',
    trend: 'tendance',
    volatility: 'volatilité',
    momentum: 'momentum',
    consolidation: 'consolidation',
    range: 'fourchette',
    pullback: 'replï',
    rally: 'rally',
    dip: 'baisse',
    crash: 'krach',

    // Economic terms
    inflation: 'inflation',
    recession: 'récession',
    growth: 'croissance',
    data: 'données',
    report: 'rapport',
    forecast: 'prévisions',
    actual: 'réel',
    estimate: 'estimation',
    consumer: 'consommateur',
    spending: 'dépenses',
    manufacturing: 'manufacturier',
    services: 'services',
    employment: 'emploi',
    unemployment: 'chômage',
    'interest rates': "taux d'intérêt",
    'monetary policy': 'politique monétaire',
    'federal reserve': 'Réserve Fédérale',
    Fed: 'Fed',
    'central bank': 'banque centrale',

    // Market terms
    'stock market': 'marché boursier',
    'equity markets': 'marchés actions',
    'bond market': 'marché obligataire',
    commodities: 'matières premières',
    currencies: 'devises',
    forex: 'forex',
    cryptocurrency: 'cryptomonnaie',
    bitcoin: 'bitcoin',
    BTC: 'BTC',
    'S&P 500': 'S&P 500',
    'Dow Jones': 'Dow Jones',
    NASDAQ: 'NASDAQ',

    // Analysis terms
    analysis: 'analyse',
    indicator: 'indicateur',
    signal: 'signal',
    recommendation: 'recommandation',
    strategy: 'stratégie',
    portfolio: 'portefeuille',
    risk: 'risque',
    reward: 'rendement',
    profit: 'profit',
    loss: 'perte',
    gain: 'gain',
    return: 'rendement',
    yield: 'rendement',
    dividend: 'dividende',
    earnings: 'bénéfices',
    revenue: "chiffre d'affaires",
    margin: 'marge',

    // Time periods
    daily: 'quotidien',
    weekly: 'hebdomadaire',
    monthly: 'mensuel',
    quarterly: 'trimestriel',
    annual: 'annuel',
    year: 'année',
    month: 'mois',
    week: 'semaine',
    day: 'jour',
    hour: 'heure',
    minute: 'minute',

    // Descriptive words
    strong: 'fort',
    weak: 'faible',
    high: 'élevé',
    low: 'bas',
    significant: 'significatif',
    important: 'important',
    major: 'majeur',
    minor: 'mineur',
    key: 'clé',
    critical: 'critique',
    essential: 'essentiel',
    crucial: 'crucial',
    positive: 'positif',
    negative: 'négatif',
    optimistic: 'optimiste',
    pessimistic: 'pessimiste',
    cautious: 'prudent',
    aggressive: 'agressif',

    // Common phrases
    'market sentiment': 'sentiment du marché',
    'risk appetite': 'appétit pour le risque',
    'safe haven': 'valeur refuge',
    'flight to safety': 'fuite vers la qualité',
    'market timing': 'timing de marché',
    'technical analysis': 'analyse technique',
    'fundamental analysis': 'analyse fondamentale',
    'quantitative analysis': 'analyse quantitative',
    'algorithmic trading': 'trading algorithmique',
    'high frequency trading': 'trading haute fréquence',
    'day trading': 'trading intraday',
    'swing trading': 'swing trading',
    'position trading': 'trading de position',
    'long term': 'long terme',
    'short term': 'court terme',
    'medium term': 'moyen terme',
  };

  let frenchText = text;

  // Remplacer les termes anglais par les français (insensible à la casse)
  for (const [english, french] of Object.entries(translations)) {
    const regex = new RegExp(`\\b${english}\\b`, 'gi');
    frenchText = frenchText.replace(regex, french);
  }

  // Corriger les majuscules après les transformations
  frenchText = frenchText.replace(
    /\b(haussier|baissier|neutre|achat|vente|support|résistance|cassure|retournement|tendance)\b/gi,
    match => (match === match.toUpperCase() ? match.toUpperCase() : match)
  );

  return frenchText;
}

function formatHelpMessage(): string {
  return `
**🤖 NovaQuote Analyste - Commandes**

📊 **Commandes d'Analyse (Base de données) :**
• \`!sentiment\` - Dernière analyse de sentiment enregistrée (instant)
• \`!vix\` - Dernière analyse VIX enregistrée (instant)
• \`!rougepulse\` - Dernière analyse calendrier économique (instant)

🤖 **Commandes des Agents IA (Temps réel) :**
• \`!rougepulseagent\` - Analyse calendrier économique en temps réel (~90s)
• \`!vixagent\` - Analyse experte VIX en temps réel (~90s)
• \`!vortex500\` - Analyse sentiment marché avancée en temps réel (~90s)

🔧 **Commandes de Scraping :**
• \`!newsagg\` - Récupérer les dernières news financières (~30s)
• \`!tescraper\` - Scraper calendrier économique US (~60s)
• \`!vixscraper\` - Scraper données volatilité VIX (~60s)

ℹ️ **Informations :**
• \`!help\` - Afficher ce message d'aide

⏰ **Fonctionnalités Automatiques :**
• Résumé quotidien des marchés à 8h00

⚡ **Temps d'exécution :**
- Base de données : **Instant** (< 1s)
- Agents IA : **~90 secondes**
- Scraping : **30-60 secondes**

💡 **Information :**
Le bot fournit une analyse financière en temps réel incluant des scores de sentiment, des indicateurs de volatilité et des recommandations de trading basées sur les dernières données.

🎯 **Conseils :**
- Utilisez les commandes "Base de données" pour des résultats instantanés
- Utilisez les agents IA pour des analyses fraîches et personnalisées
- Les agents IA peuvent prendre jusqu'à 90 secondes - soyez patient !

*Besoin d'aide ? Contactez l'administrateur !*
    `.trim();
}

function formatSentimentMessage(data: any): string {
  const catalysts = data.catalysts
    ? Array.isArray(data.catalysts)
      ? data.catalysts
      : JSON.parse(data.catalysts)
    : [];

  const sentimentMap: { [key: string]: string } = {
    BULLISH: 'HAUSSIER 🟢',
    BEARISH: 'BAISSIER 🔴',
    NEUTRAL: 'NEUTRE ⚪',
  };
  const riskMap: { [key: string]: string } = {
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
${catalysts.map((c: string) => `• ${c}`).join('\n')}

*Date de l'analyse : ${data.created_at ? new Date(data.created_at).toLocaleString('fr-FR') : 'Date non disponible'}*
    `.trim();
}

function formatVixMessage(row: any): string {
  const data = row.analysis_data;
  const expert = data.expert_volatility_analysis || {};
  const current = data.current_vix_data || {};

  const trendMap: { [key: string]: string } = {
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

function formatVixAgentMessage(data: any): string[] {
  const expert = data.expert_volatility_analysis || {};
  const current = data.current_vix_data || {};
  const metadata = data.metadata || {};

  const trendMap: { [key: string]: string } = {
    BULLISH: 'HAUSSIER 📈',
    BEARISH: 'BAISSIER 📉',
    NEUTRAL: 'NEUTRE ➡️',
  };

  const regimeMap: { [key: string]: string } = {
    CRISIS: 'CRISE 🚨',
    ELEVATED: 'ÉLEVÉ ⚠️',
    NORMAL: 'NORMAL ✅',
    CALM: 'CALME 😌',
    EXTREME_CALM: 'TRÈS CALME 😴',
  };

  const messages: string[] = [];

  // Message 1: Résumé principal (garanti < 1000 caractères)
  const message1 = `
**📊 VixombreAgent - Analyse Expert VIX**
**VIX Actuel :** ${current.consensus_value || expert.current_vix || 'N/A'}
**Tendance :** ${trendMap[expert.vix_trend?.toUpperCase()] || 'N/A'}
**Régime :** ${regimeMap[expert.volatility_regime?.toUpperCase()] || expert.volatility_regime || 'N/A'}
**Niveau de Risque :** ${expert.risk_level || 'N/A'}

**💡 Analyse Expert :**
${expert.expert_summary ? (expert.expert_summary.length > 300 ? expert.expert_summary.substring(0, 300) + '...' : expert.expert_summary) : 'Aucun résumé disponible.'}
  `.trim();

  if (message1.length > 0) messages.push(message1);

  // Message 2: Catalyseurs et recommandations (garanti < 1000 caractères)
  if (expert.catalysts && expert.catalysts.length > 0) {
    const catalystsText = expert.catalysts
      .slice(0, 3) // Limiter à 3 catalyseurs maximum
      .map((c: string) => `• ${c.length > 50 ? c.substring(0, 50) + '...' : c}`)
      .join('\n');

    const message2 = `
**🔥 Catalyseurs de Volatilité :**
${catalystsText}
${expert.catalysts.length > 3 ? `... et ${expert.catalysts.length - 3} autres catalyseurs` : ''}

**🎯 Recommandation Trading :**
Stratégie : ${expert.trading_recommendations?.strategy || 'N/A'}
ES Futures : ${expert.market_implications?.es_futures_bias || 'N/A'}
    `.trim();

    if (message2.length > 0 && message2.length <= 1990) messages.push(message2);
  }

  // Message 3: Métadonnées (garanti < 500 caractères)
  const message3 = `
**📊 Métadonnées :**
Source : ${metadata.data_source || 'N/A'}
Enregistrements : ${metadata.record_count || 0}
Analyse : ${metadata.analysis_type || 'N/A'}

*Généré par VixombreAgent AI*
  `.trim();

  if (message3.length > 0) messages.push(message3);

  // Validation finale : garantir que tous les messages sont < 2000 caractères
  return messages.filter(msg => msg.length > 0 && msg.length <= 1990);
}

function formatVortex500Message(data: any): string {
  const sentimentMap: { [key: string]: string } = {
    BULLISH: 'HAUSSIER 🟢',
    BEARISH: 'BAISSIER 🔴',
    NEUTRAL: 'NEUTRE ⚪',
  };

  const catalysts = data.catalysts || [];

  return `
**🧪 Vortex500 - Analyse de Sentiment Avancée**
**Sentiment du Marché :** ${sentimentMap[data.sentiment?.toUpperCase()] || data.sentiment || 'N/A'}
**Score de Sentiment :** ${data.score || 'N/A'}/100
**Niveau de Risque :** ${data.risk_level || 'N/A'}

**📝 Résumé d'Analyse :**
${data.summary || 'Aucun résumé disponible.'}

**🔑 Catalyseurs Clés :**
${catalysts.length > 0 ? catalysts.map((c: string) => `• ${c}`).join('\n') : 'Aucun catalyseur identifié'}

**📊 Informations :**
Source des données : ${data.data_source || 'N/A'}
Nombre d'articles analysés : ${data.news_count || 'N/A'}
Méthode d'analyse : ${data.analysis_method || 'N/A'}

*Généré par Vortex500 AI*
    `.trim();
}

async function postDailySummary() {
  if (!CHANNEL_ID) {
    console.error('❌ DISCORD_CHANNEL_ID not set in .env');
    return;
  }
  const channel = (await client.channels.fetch(CHANNEL_ID)) as TextChannel;
  if (!channel) {
    console.error('❌ Channel not found');
    return;
  }
  const sentiment = await getLatestSentiment();
  const vix = await getLatestVix();
  let message = '**🌞 Daily Market Summary**\n\n';
  if (sentiment) message += formatSentimentMessage(sentiment) + '\n\n---\n\n';
  if (vix) message += formatVixMessage(vix);
  await channel.send(message);
}

// Hardcoded token fallback if env fails
const TOKEN = process.env.DISCORD_TOKEN?.trim() || 'YOUR_DISCORD_BOT_TOKEN';

client.login(TOKEN).catch(err => {
  console.error('Failed to login:', err);
});
