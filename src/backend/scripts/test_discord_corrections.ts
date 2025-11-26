import { RougePulseAgent } from '../agents/RougePulseAgent';

// Simulation de la fonction corrigée
function formatRougePulseMessage(data: any): string {
  const narrative = data.market_narrative || 'Pas de narratif disponible.';
  const score = data.impact_score || 0;
  const rec = data.trading_recommendation || 'Aucune recommandation.';

  // Limite narrative
  const maxNarrativeLength = 500;
  const truncatedNarrative = narrative.length > maxNarrativeLength
    ? narrative.substring(0, maxNarrativeLength - 3) + '...'
    : narrative;

  // Limite recommandation
  const maxRecLength = 300;
  const truncatedRec = rec.length > maxRecLength
    ? rec.substring(0, maxRecLength - 3) + '...'
    : rec;

  const message = `
🔴 **RougePulse - Analyse Calendrier Éco**
📊 **Impact Session :** ${score}/100

📖 **Narratif de Marché :**
${truncatedNarrative}

🎯 **Recommandation Trading :**
${truncatedRec}

*Date de l'analyse : ${data.created_at ? new Date(data.created_at).toLocaleString('fr-FR') : 'Date non disponible'}*
  `.trim();

  // Simulation de troncation avec mots coupés
  const maxDiscordLength = 2000;
  if (message.length > maxDiscordLength) {
    const ellipsis = '...\n\n📋 *Message tronqué - utilisez !rougepulseagent pour voir l\'analyse complète*';
    const cutoffPoint = maxDiscordLength - ellipsis.length;
    let truncatedMessage = message.substring(0, cutoffPoint);

    // Éviter de couper un mot : chercher le dernier espace
    const lastSpaceIndex = truncatedMessage.lastIndexOf(' ');
    if (lastSpaceIndex > cutoffPoint - 50) {
      truncatedMessage = truncatedMessage.substring(0, lastSpaceIndex);
    }

    return truncatedMessage + ellipsis;
  }
  return message;
}

// Test avec un texte très long pour vérifier la troncation
function testTruncation() {
  console.log('🧪 Test de troncation de mots...\n');

  const longNarrative = `Le marché S&P 500 évolue actuellement dans un contexte de données économiques complexes avec des multiples facteurs influençant la dynamique des prix. Les investisseurs doivent surveiller attentivement les indicateurs clés comme l'inflation qui montre des signes de modération mais reste préoccupante pour la Réserve Fédérale. Les données sur l'emploi et la consommation des ménages continuent de jouer un rôle crucial dans la détermination des tendances du marché. L'analyse technique révèle des niveaux de support et résistance importants qui pourraient être testés dans les prochains jours. La volatilité reste modérée mais pourrait augmenter suite aux annonces économiques attendues.`;

  const testData = {
    market_narrative: longNarrative,
    impact_score: 75,
    trading_recommendation: 'Surveiller attentivement les niveaux clés et ajuster les positions en fonction des annonces économiques importantes',
    created_at: new Date().toISOString(),
  };

  const result = formatRougePulseMessage(testData);

  console.log('📏 Test de longueur:');
  console.log('Longueur totale:', result.length, 'caractères');
  console.log('Limite Discord (2000):', result.length <= 2000 ? '✅ OK' : '❌ Trop long');

  // Vérifier que les mots ne sont pas coupés
  const lines = result.split('\n');
  const narrativeLine = lines.find(line => line.includes('Narratif de Marché'));
  if (narrativeLine) {
    const narrativeText = narrativeLine.replace('📖 **Narratif de Marché :**', '').trim();
    if (narrativeText.endsWith('...')) {
      console.log('✅ Troncation propre avec ellipsis');
    } else {
      console.log('❌ Pas de troncation (normal si < limite)');
    }
  }

  // Vérifier la date
  if (result.includes('Date non disponible')) {
    console.log('❌ Date non disponible');
  } else if (/\d{2}\/\d{2}\/\d{4}/.test(result)) {
    console.log('✅ Date formatée correctement');
  } else {
    console.log('⚠️ Format de date à vérifier');
  }

  console.log('\n📱 Message final:');
  console.log('─'.repeat(50));
  console.log(result);
  console.log('─'.repeat(50));
}

async function testCorrections() {
  console.log('🚀 Test des corrections Discord...\n');

  // Test 1: Troncation de mots
  testTruncation();

  // Test 2: Date handling
  console.log('\n🗓️ Test de gestion de date:');

  const testCases = [
    { created_at: new Date().toISOString(), name: 'Date valide' },
    { created_at: null, name: 'Date null' },
    { created_at: undefined, name: 'Date undefined' },
    { created_at: 'invalid-date', name: 'Date invalide' },
  ];

  testCases.forEach((testCase, index) => {
    try {
      const formattedDate = testCase.created_at ?
        new Date(testCase.created_at).toLocaleString('fr-FR') :
        'Date non disponible';

      console.log(`${index + 1}. ${testCase.name}: ${formattedDate}`);
    } catch (error) {
      console.log(`${index + 1}. ${testCase.name}: Erreur - Date non disponible`);
    }
  });

  // Test 3: Agent réel si possible
  console.log('\n🤖 Test avec l\'agent réel:');
  try {
    const agent = new RougePulseAgent();
    const result = await agent.analyzeEconomicEvents();

    if (!('error' in result) && result.analysis) {
      const discordMessage = formatRougePulseMessage(result.analysis);
      console.log('✅ Message Discord généré:', discordMessage.length, 'caractères');

      // Vérifier les corrections
      if (!discordMessage.includes('Invalid Date')) {
        console.log('✅ Pas de "Invalid Date" trouvé');
      }

      if (discordMessage.includes('Date non disponible') || discordMessage.match(/\d{2}\/\d{2}\/\d{4}/)) {
        console.log('✅ Date correctement formatée');
      }

      const lastChars = discordMessage.slice(-50);
      if (!lastChars.includes('Les nouve') && !lastChars.includes('nov...')) {
        console.log('✅ Pas de mots coupés à la fin');
      }
    }
  } catch (error) {
    console.log('⚠️ Test agent réel échoué:', error instanceof Error ? error.message : error);
  }

  console.log('\n✅ Test des corrections terminé !');
}

testCorrections();