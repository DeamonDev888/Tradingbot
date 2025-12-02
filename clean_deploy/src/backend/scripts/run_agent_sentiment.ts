import { Vortex500Agent } from '../agents/Vortex500Agent';

/**
 * SCRIPT: run_agent_sentiment.ts
 *
 * Ce script instancie l'agent Vortex500 et lance une analyse complète.
 * Il sert de test d'intégration final pour vérifier que :
 * 1. Le scraping fonctionne (NewsAggregator)
 * 2. Le formatage TOON fonctionne (ToonFormatter)
 * 3. L'appel à KiloCode fonctionne (BaseAgent)
 * 4. L'IA renvoie un JSON valide.
 */

async function main() {
  console.log('🧪 Initializing Vortex500 Agent...');
  const agent = new Vortex500Agent();

  try {
    console.log('🧠 Running Market Analysis (This may take 10-30s)...');
    const result = await agent.analyzeMarketSentiment();

    console.log('\n===========================================');
    console.log('🤖 AI MARKET VERDICT');
    console.log('===========================================');
    console.log(`SENTIMENT : ${result.sentiment} (${result.score}/100)`);
    console.log(`RISK LEVEL: ${result.risk_level}`);
    console.log('\n🔑 CATALYSTS:');
    const catalysts = result.catalysts as string[];
    catalysts.forEach((c: string) => console.log(` - ${c}`));
    console.log('\n📝 SUMMARY:');
    console.log(result.summary);
    console.log('===========================================\n');
  } catch (error) {
    console.error('❌ Agent Failure:', error);
  }
}

main();
