import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import * as cron from 'node-cron';
import * as path from 'path';
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
// Helper function to convert English to French
function convertToFrenchIfNeeded(text) {
    if (!text || typeof text !== 'string')
        return text;
    const translations = {
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
        pullback: 'repli',
        rally: 'rally',
        dip: 'baisse',
        crash: 'krach',
    };
    let frenchText = text;
    for (const [english, french] of Object.entries(translations)) {
        const regex = new RegExp(`\\b${english}\\b`, 'gi');
        frenchText = frenchText.replace(regex, french);
    }
    return frenchText;
}
// Formatting functions
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
${catalysts.map((c) => `• ${c}`).join('\n')}

*Date de l'analyse : ${data.created_at ? new Date(data.created_at).toLocaleString('fr-FR') : 'Date non disponible'}*
  `.trim();
}
function formatVixMessage(row) {
    const data = row.analysis_data;
    const expert = data.expert_volatility_analysis || {};
    const current = data.current_vix_data || {};
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
    const esFutures = data.es_futures_analysis
        ? typeof data.es_futures_analysis === 'string'
            ? JSON.parse(data.es_futures_analysis)
            : data.es_futures_analysis
        : {};
    const rec = data.trading_recommendation || 'Aucune recommandation.';
    const frenchNarrative = convertToFrenchIfNeeded(narrative);
    const frenchRec = convertToFrenchIfNeeded(rec);
    const esBias = esFutures?.bias === 'BULLISH'
        ? '🟢 HAUSSIER'
        : esFutures?.bias === 'BEARISH'
            ? '🔴 BAISSIER'
            : '⚪ NEUTRE';
    let eventsList = '';
    if (events.length > 0) {
        eventsList = events
            .map((e) => {
            const event = e.event || e.name || 'Événement';
            const details = e.actual_vs_forecast || e.actual || 'N/A';
            const significance = e.significance || '';
            return `**📊 ${event}**\n💫 ${details}${significance ? `\n🎯 ${significance}` : ''}`;
        })
            .join('\n\n');
    }
    else {
        eventsList = '**📋 Aucun événement majeur détecté**';
    }
    const message = `
**🔴 RougePulse ES Futures Expert** 📊
**Impact :** ${score}/100 ${score >= 70 ? '🔥' : score >= 50 ? '⚠️' : '📉'} | **Tendance :** ${esBias}

**📈 Analyse de Marché :**
${frenchNarrative}

**📊 Données Prix ES :**
${data.sp500_price && !isNaN(data.sp500_price) ? `💹 ${Number(data.sp500_price).toFixed(2)} USD | **Source:** ${data.price_source || 'Conversion SPY'}` : '📊 Prix en cours de récupération...'}

**📅 Événements Économiques :**
${eventsList}

**🎯 Signal Trading ES :**
${frenchRec}

💹 *ES Futures Analysis | ${(() => {
        try {
            return data.created_at && new Date(data.created_at).getTime() > 0
                ? new Date(data.created_at).toLocaleDateString('fr-FR')
                : new Date().toLocaleDateString('fr-FR');
        }
        catch {
            return new Date().toLocaleDateString('fr-FR');
        }
    })()}*
  `.trim();
    return [message];
}
function formatHelpMessage() {
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
function formatVortex500Message(data) {
    const sentimentMap = {
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
${catalysts.length > 0 ? catalysts.map((c) => `• ${c}`).join('\n') : 'Aucun catalyseur identifié'}

**📊 Informations :**
Source des données : ${data.data_source || 'N/A'}
Nombre d'articles analysés : ${data.news_count || 'N/A'}
Méthode d'analyse : ${data.analysis_method || 'N/A'}

*Généré par Vortex500 AI*
  `.trim();
}
// Database functions
async function getLatestSentiment() {
    try {
        const res = await pool.query(`SELECT * FROM sentiment_analyses ORDER BY created_at DESC LIMIT 1`);
        return res.rows[0];
    }
    catch (e) {
        console.error('Error fetching sentiment:', e);
        return null;
    }
}
async function getLatestVix() {
    try {
        const res = await pool.query(`SELECT * FROM vix_analyses ORDER BY created_at DESC LIMIT 1`);
        return res.rows[0];
    }
    catch {
        return null;
    }
}
async function getLatestRougePulse() {
    try {
        const res = await pool.query(`SELECT * FROM rouge_pulse_analyses ORDER BY created_at DESC LIMIT 1`);
        return res.rows[0];
    }
    catch (e) {
        console.error('Error fetching rouge pulse:', e);
        return null;
    }
}
async function postDailySummary() {
    if (!CHANNEL_ID) {
        console.error('❌ DISCORD_CHANNEL_ID not set in .env');
        return;
    }
    const channel = (await client.channels.fetch(CHANNEL_ID));
    if (!channel) {
        console.error('❌ Channel not found');
        return;
    }
    const sentiment = await getLatestSentiment();
    const vix = await getLatestVix();
    let message = '**🌞 Daily Market Summary**\n\n';
    if (sentiment)
        message += formatSentimentMessage(sentiment) + '\n\n---\n\n';
    if (vix)
        message += formatVixMessage(vix);
    await channel.send(message);
}
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
    console.log(`🔗 Lien d'invitation: https://discord.com/api/oauth2/authorize?client_id=${APPLICATION_ID}&permissions=84992&scope=bot`);
    cron.schedule('0 8 * * *', async () => {
        console.log('⏰ Running daily summary...');
        await postDailySummary();
    });
});
client.on('messageCreate', async (message) => {
    console.log(`📩 Message received: "${message.content}" from ${message.author.tag} in ${message.channelId}`);
    if (message.author.bot)
        return;
    if (message.content.trim() === '!sentiment') {
        console.log('🔍 Processing !sentiment command...');
        const sentiment = await getLatestSentiment();
        if (sentiment) {
            console.log('✅ Sentiment found, replying...');
            await message.reply(formatSentimentMessage(sentiment));
        }
        else {
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
        }
        else {
            console.log('❌ No VIX found in DB.');
            await message.reply('❌ No VIX analysis found in database.');
        }
    }
    if (message.content.trim().toLowerCase() === '!rougepulse' ||
        message.content.trim().toLowerCase() === '!pulse') {
        console.log('🔴 Processing !rougepulse command...');
        const rougePulse = await getLatestRougePulse();
        if (rougePulse) {
            console.log('✅ RougePulse found, replying...');
            const formattedMessages = formatRougePulseMessage(rougePulse);
            if (formattedMessages.length === 1) {
                await message.reply(formattedMessages[0]);
            }
            else {
                await message.reply(formattedMessages[0]);
                setTimeout(async () => {
                    try {
                        await message.channel.send(formattedMessages[1]);
                    }
                    catch (error) {
                        console.error('Error sending second message:', error);
                    }
                }, 500);
            }
        }
        else {
            console.log('❌ No RougePulse found in DB.');
            await message.reply('❌ No RougePulse analysis found in database.');
        }
    }
    if (message.content.trim() === '!help') {
        console.log('📖 Processing !help command...');
        await message.reply(formatHelpMessage());
    }
});
// Hardcoded token fallback if env fails
const TOKEN = process.env.DISCORD_TOKEN?.trim() || 'YOUR_DISCORD_BOT_TOKEN';
client.login(TOKEN).catch(err => {
    console.error('Failed to login:', err);
});
//# sourceMappingURL=index_clean.js.map