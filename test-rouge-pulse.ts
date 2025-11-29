// Test simple pour RougePulseAgent
import { RougePulseAgent } from './src/backend/agents/RougePulseAgent';
import * as dotenv from 'dotenv';

dotenv.config();

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

    if (result.critical_events && result.critical_events.length > 0) {
      console.log('\n🔴 ÉVÉNEMENTS CRITIQUES:');
      result.critical_events.forEach(event => {
        console.log('- ' + event.time + ': ' + event.event + ' (' + event.importance + ')');
      });
    }

    if (result.next_24h_alerts && result.next_24h_alerts.length > 0) {
      console.log('\n🚨 ALERTES 24H:');
      result.next_24h_alerts.forEach(alert => {
        console.log('- ' + alert.time + ': ' + alert.event + ' ' + alert.icon);
      });
    }

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
