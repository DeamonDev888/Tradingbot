import { NewsAggregator } from './src/backend/ingestion/NewsAggregator';

async function testNewsAggregator() {
  console.log('📰 Testing NewsAggregator...');

  try {
    const aggregator = new NewsAggregator();

    console.log('🔄 Fetching from multiple sources...');
    const [zeroHedge, cnbc, financialJuice] = await Promise.allSettled([
      aggregator.fetchZeroHedgeHeadlines(),
      aggregator.fetchCNBCMarketNews(),
      aggregator.fetchFinancialJuice()
    ]);

    const results = [
      { source: 'ZeroHedge', result: zeroHedge },
      { source: 'CNBC', result: cnbc },
      { source: 'FinancialJuice', result: financialJuice }
    ];

    console.log('\n📊 RESULTS:');
    console.log('='.repeat(50));

    results.forEach(({ source, result }) => {
      if (result.status === 'fulfilled') {
        console.log(`✅ ${source}: ${result.value.length} headlines`);
        if (result.value.length > 0) {
          console.log(`   Latest: ${result.value[0].title}`);
        }
      } else {
        console.log(`❌ ${source}: ${result.reason}`);
      }
    });

    const totalHeadlines = results.reduce((sum, { result }) =>
      result.status === 'fulfilled' ? sum + result.value.length : sum, 0
    );

    console.log(`\n📈 Total headlines collected: ${totalHeadlines}`);
    console.log('✅ NewsAggregator test completed successfully!');

  } catch (error) {
    console.error('❌ NewsAggregator test failed:', error);
  }
}

testNewsAggregator();