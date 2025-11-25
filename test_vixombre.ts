import { VixombreAgent } from './src/backend/agents/VixombreAgent';

async function main() {
    const agent = new VixombreAgent();
    console.log('🔍 Testing Vixombre Agent...');
    
    const result = await agent.analyzeVixStructure();
    
    console.log('\n📊 Analysis Result:');
    console.log(JSON.stringify(result, null, 2));
    
    process.exit(0);
}

main().catch(console.error);
