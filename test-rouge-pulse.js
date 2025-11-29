
const { RougePulseAgent } = require('./dist/backend/agents/RougePulseAgent.js');
require('dotenv').config();

async function testRougePulseAgent() {
  console.log('🚀 Test RougePulseAgent...');

  try {
    const agent = new RougePulseAgent();
    const result = await agent.analyzeMarketSentiment();

    console.log('\n=== RÉSULTAT ROUGE PULSE AGENT ===');
    console.log('Status:', result.status);
    console.log('Total events:', result.total_events);
    console.log('Critical events:', result.critical_count);
    console.log('High events:', result.high_count);
    console.log('Volatility score:', result.volatility_score);

    console.log('\n📄 RÉSUMÉ:');
    console.log(result.summary);

    await agent.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

testRougePulseAgent();

