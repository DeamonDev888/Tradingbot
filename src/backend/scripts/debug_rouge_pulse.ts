import { RougePulseAgent } from '../agents/RougePulseAgent';

async function debugRougePulse() {
  console.log('--- DEBUG ROUGE PULSE AGENT ---');
  const agent = new RougePulseAgent();

  try {
    // 1. Test SP500 Data
    console.log('\n1. Testing getLatestSP500FromDB...');
    // Access private method via any cast or just run the main method and log inside
    // Since I can't easily access private methods without modifying the class or using any,
    // I will run the public analyzeEconomicEvents and see the logs (since I added logs in the class).

    const result = await agent.analyzeMarketSentiment();
    console.log('\n--- RESULT ---');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

debugRougePulse();
