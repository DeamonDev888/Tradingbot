import { RougePulseAgent } from './backend/agents/RougePulseAgent';
import { Vortex500Agent } from './backend/agents/Vortex500Agent';

async function testAgents() {
  console.log('🚀 Starting Agent Tests...');

  // Test RougePulseAgent
  console.log('\n---------------------------------------------------');
  console.log('🧪 Testing RougePulseAgent...');
  const rougeAgent = new RougePulseAgent();
  try {
    const rougeResult = await rougeAgent.analyzeMarketSentiment();
    console.log('✅ RougePulse Analysis Completed');
    console.log('Summary:', rougeResult.summary);
    console.log('Events Count:', rougeResult.total_events);
    console.log('Volatility Score:', rougeResult.volatility_score);
  } catch (error) {
    console.error('❌ RougePulse Failed:', error);
  } finally {
    await rougeAgent.close();
  }

  // Test Vortex500Agent
  console.log('\n---------------------------------------------------');
  console.log('🧪 Testing Vortex500Agent...');
  const vortexAgent = new Vortex500Agent();
  try {
    // Vortex500Agent doesn't have a close method in the interface shown,
    // but it uses dbService which might need closing.
    // Checking the code, it doesn't expose close() but dbService is private.
    // It creates a new dbService in constructor.
    // We'll just run the analysis.
    const vortexResult = await vortexAgent.analyzeMarketSentiment();
    console.log('✅ Vortex500 Analysis Completed');
    console.log('Sentiment:', vortexResult.sentiment);
    console.log('Score:', vortexResult.score);
    console.log('Risk Level:', vortexResult.risk_level);
    console.log('Summary:', vortexResult.summary);
  } catch (error) {
    console.error('❌ Vortex500 Failed:', error);
  }

  console.log('\n---------------------------------------------------');
  console.log('🏁 Agent Tests Finished');
}

testAgents();
