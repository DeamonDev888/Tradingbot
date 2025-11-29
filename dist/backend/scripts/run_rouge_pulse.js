import { RougePulseAgent } from '../agents/RougePulseAgent';
import * as fs from 'fs';
async function main() {
    console.log('🔴 Starting RougePulse Analysis...');
    const agent = new RougePulseAgent();
    try {
        const result = await agent.analyzeMarketSentiment();
        console.log('📊 Analysis Result saved to rouge_result.json');
        fs.writeFileSync('rouge_result.json', JSON.stringify(result, null, 2));
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=run_rouge_pulse.js.map