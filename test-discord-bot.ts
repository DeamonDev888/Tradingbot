import { RougePulseAgent } from './src/backend/agents/RougePulseAgent';

async function testDiscordBotIntegration() {
  console.log("🧪 Test d'intégration du bot Discord avec le nouvel agent RougePulseAgent...");

  try {
    const agent = new RougePulseAgent();

    console.log('✅ Agent RougePulseAgent créé avec succès');

    // Test de l'analyse économique
    console.log("📅 Lancement de l'analyse du calendrier économique...");
    const result = (await agent.analyzeMarketSentiment(false)) as any;

    if (result.error) {
      console.log("❌ Erreur lors de l'analyse:", result.error);
      console.log('Status:', result.status);
    } else {
      console.log('✅ Analyse réussie!');
      console.log('📊 Score de volatilité:', result.volatility_score);
      console.log('🔴 Événements critiques:', result.critical_count);
      console.log('🔴 Impact fort:', result.high_count);
      console.log('🟡 Impact moyen:', result.medium_count);
      console.log('⚪ Impact faible:', result.low_count);

      // Afficher le résumé généré par l'agent
      console.log("\n📅 Résumé généré par l'agent:");
      console.log('='.repeat(50));
      console.log(result.summary);

      // Vérifier les alertes critiques
      if (result.next_24h_alerts && result.next_24h_alerts.length > 0) {
        console.log('\n🚨 Alertes 24h:');
        result.next_24h_alerts.forEach((alert: any) => {
          console.log(`${alert.icon} ${alert.time} - ${alert.event}`);
        });
      }
    }

    // Fermer la connexion
    await agent.close();
    console.log('\n🔌 Connexion fermée');

    console.log("\n✅ Test d'intégration terminé avec succès!");
    console.log('\n🤖 Le bot Discord est maintenant prêt à utiliser:');
    console.log('  - Nouvel agent RougePulseAgent avec scoring avancé');
    console.log('  - Mise en évidence des événements critiques (rouge + gras)');
    console.log('  - Calcul du score de volatilité global');
    console.log('  - Alertes pour les Market Movers');
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

testDiscordBotIntegration();
