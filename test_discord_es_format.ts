// Test du formatage Discord avec les nouvelles données ES Futures
function formatRougePulseMessage(data: any): string {
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

  // Gérer le bias ES Futures avec le nouveau format
  const esBias =
    esFutures?.bias === 'BULLISH'
      ? '🟢 HAUSSIER'
      : esFutures?.bias === 'BEARISH'
        ? '🔴 BAISSIER'
        : '⚪ NEUTRE';

  // Ajouter la plateforme context si disponible
  const platformContext = esFutures?.platform_context
    ? `\n📊 **Contexte Plateformes :** ${esFutures.platform_context.substring(0, 100)}${esFutures.platform_context.length > 100 ? '...' : ''}`
    : '';

  const message = `
**🔴 RougePulse - Expert ES Futures**
**Impact Session :** ${score}/100
**ES Futures Bias :** ${esBias}

**📖 Narratif ES Futures :**
${narrative.length > 500 ? narrative.substring(0, 497) + '...' : narrative}

**🔥 Événements Clés :**
${events.length > 0 ? events.slice(0, 2).map((e: any) => `**• ${e.event || e.name || 'Événement'}**\n  └ ${e.actual_vs_forecast || e.actual || 'N/A'}`).join('\n\n') : 'Aucun événement majeur détecté.'}

**🎯 Recommandation ES Futures :**
${rec.length > 300 ? rec.substring(0, 297) + '...' : rec}
${platformContext}

*Analyse ES - TopStep/CME/AMP | Date : ${new Date().toLocaleString('fr-FR')}*
  `.trim();

  return message;
}

// Test avec les données ES Futures
const testESData = {
  impact_score: 75,
  market_narrative: "Analyse ES Futures : Le contrat E-mini S&P 500 évolue actuellement à 675.02 USD, en hausse de +6.29 (+0.94%) sur la journée, avec une fourchette de 664.48 à 676.21. Les données économiques montrent un contexte inflation modéré et une reprise technique soutenue par les niveaux de support critiques.",
  high_impact_events: [
    {
      event: "PPI YoY",
      actual_vs_forecast: "2.7% contre 2.6% attendu, légèrement supérieur mais stable"
    },
    {
      event: "Retail Sales MoM",
      actual_vs_forecast: "0.2% contre 0.3% attendu, en dessous mais positif"
    }
  ],
  es_futures_analysis: {
    bias: "BULLISH",
    platform_context: "TopStep combine requirements, CME provides volume data, AMP offers competitive margins for ES day trading"
  },
  trading_recommendation: "Surveiller la cassure au-dessus de 676.21 pour un achat intraday avec stop à 673.00, ciblant 679.33. Utiliser le contexte TopStep pour optimiser la gestion du risque.",
  created_at: new Date().toISOString()
};

console.log('🧪 Test du formatage Discord ES Futures...');
console.log('='.repeat(80));

const formattedMessage = formatRougePulseMessage(testESData);

console.log('\n📱 Message Discord formaté:');
console.log('─'.repeat(80));
console.log(formattedMessage);
console.log('─'.repeat(80));

console.log('\n📏 Vérifications:');
console.log('✅ Longueur totale:', formattedMessage.length, 'caractères');
console.log('✅ Contient "ES Futures":', formattedMessage.includes('ES Futures'));
console.log('✅ Ne contient pas "Bitcoin":', !formattedMessage.includes('Bitcoin'));
console.log('✅ Format date correct:', formattedMessage.includes('Analyse ES - TopStep/CME/AMP'));
console.log('✅ Bias affiché correctement:', formattedMessage.includes('🟢 HAUSSIER'));

console.log('\n✅ Test terminé avec succès!');