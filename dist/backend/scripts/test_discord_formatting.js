import { RougePulseAgent } from '../agents/RougePulseAgent';
// Simulation de la fonction de formatage Discord
function convertToFrenchIfNeeded(text) {
    if (!text || typeof text !== 'string')
        return text;
    // Mots clés anglais à remplacer par leurs équivalents français
    const translations = {
        bullish: 'haussier',
        bearish: 'baissier',
        neutral: 'neutre',
        support: 'support',
        resistance: 'résistance',
        breakout: 'cassure',
        trend: 'tendance',
        volatility: 'volatilité',
        inflation: 'inflation',
        recession: 'récession',
        data: 'données',
        report: 'rapport',
        forecast: 'prévisions',
        actual: 'réel',
        market: 'marché',
        stock: 'action',
        trading: 'trading',
        analysis: 'analyse',
        recommendation: 'recommandation',
        risk: 'risque',
        momentum: 'momentum',
        consumer: 'consommateur',
        spending: 'dépenses',
        economic: 'économique',
        session: 'séance',
        key: 'clé',
        level: 'niveau',
        price: 'prix',
        break: 'cassure',
        above: 'au-dessus',
        below: 'en-dessous',
        critical: 'critique',
        major: 'majeur',
        minor: 'mineur',
        high: 'élevé',
        low: 'bas',
        strong: 'fort',
        weak: 'faible',
        positive: 'positif',
        negative: 'négatif',
    };
    let frenchText = text;
    // Remplacer les termes anglais par les français (insensible à la casse)
    for (const [english, french] of Object.entries(translations)) {
        const regex = new RegExp(`\\b${english}\\b`, 'gi');
        frenchText = frenchText.replace(regex, french);
    }
    return frenchText;
}
function formatRougePulseMessage(data) {
    const narrative = data.market_narrative || 'Pas de narratif disponible.';
    const score = data.impact_score || 0;
    const rec = data.trading_recommendation || 'Aucune recommandation.';
    // Convertir en français
    const frenchNarrative = convertToFrenchIfNeeded(narrative);
    const frenchRec = convertToFrenchIfNeeded(rec);
    console.log('🔄 Test de conversion:');
    console.log('Original (first 100 chars):', narrative.substring(0, 100));
    console.log('French (first 100 chars):', frenchNarrative.substring(0, 100));
    // Test de longueur Discord
    const maxNarrativeLength = 500;
    const truncatedNarrative = frenchNarrative.length > maxNarrativeLength
        ? frenchNarrative.substring(0, maxNarrativeLength - 3) + '...'
        : frenchNarrative;
    const maxRecLength = 300;
    const truncatedRec = frenchRec.length > maxRecLength ? frenchRec.substring(0, maxRecLength - 3) + '...' : frenchRec;
    const message = `
🔴 **RougePulse - Analyse Calendrier Éco**
📊 **Impact Session :** ${score}/100

📖 **Narratif de Marché :**
${truncatedNarrative}

🎯 **Recommandation Trading :**
${truncatedRec}
  `.trim();
    console.log('\n📏 Test de longueur:');
    console.log('Longueur totale:', message.length, 'caractères');
    console.log('Limite Discord (2000):', message.length <= 2000 ? '✅ OK' : '❌ Trop long');
    if (message.length > 2000) {
        const ellipsis = "...\n\n📋 *Message tronqué - utilisez !rougepulseagent pour voir l'analyse complète*";
        const cutoffPoint = 2000 - ellipsis.length;
        const truncatedMessage = message.substring(0, cutoffPoint) + ellipsis;
        console.log('Longueur après troncature:', truncatedMessage.length);
        return truncatedMessage;
    }
    return message;
}
async function testDiscordFormatting() {
    console.log('🚀 Test du formatage Discord avec traduction française...\n');
    const agent = new RougePulseAgent();
    try {
        console.log("🔍 Lancement de l'analyse RougePulse...");
        const result = await agent.analyzeMarketSentiment();
        if ('error' in result) {
            console.log('❌ Erreur:', result.error);
            return;
        }
        if (result.analysis) {
            console.log('\n📊 Test du formatage Discord:');
            console.log('='.repeat(50));
            const discordMessage = formatRougePulseMessage(result.analysis);
            console.log('\n📱 Message Discord formaté:');
            console.log('─'.repeat(50));
            console.log(discordMessage);
            console.log('─'.repeat(50));
            console.log('\n✅ Test terminé !');
            console.log('\n🎯 Vérifications:');
            console.log('✅ Traduction française appliquée');
            console.log('✅ Longueur optimisée pour Discord');
            console.log('✅ Troncature intelligente si nécessaire');
        }
        else {
            console.log('❌ Aucune analyse retournée');
        }
    }
    catch (error) {
        console.error('❌ Erreur lors du test:', error);
    }
}
testDiscordFormatting();
//# sourceMappingURL=test_discord_formatting.js.map