import { FinnhubClient } from '../ingestion/FinnhubClient';

async function testSP500() {
  console.log('🚀 Test de récupération des données du S&P 500 avec Finnhub...\n');

  const finnhubClient = new FinnhubClient();

  // Test 1: S&P 500 avec différents symboles
  console.log('📊 Test 1 - S&P 500 (test avec différents symboles):');
  const testSymbols = ['^GSPC', '.SPX', 'SPY', 'SPX', 'S&P500', 'GSPC'];

  for (const symbol of testSymbols) {
    console.log(`\n   Test avec symbole: ${symbol}`);
    const testData = await finnhubClient.fetchQuote(symbol);
    if (testData) {
      console.log(
        `   ✅ S&P 500 (${symbol}): ${testData.current} (${testData.change > 0 ? '+' : ''}${testData.percent_change}%)`
      );
      break; // Arrêter si on trouve un symbole qui fonctionne
    } else {
      console.log(`   ❌ Échec avec ${symbol}`);
    }
  }

  // Test 2: Plusieurs indices en parallèle avec symboles alternatifs
  console.log('\n📊 Test 2 - Indices multiples (symboles alternatifs):');
  const alternativeIndices = ['SPY', 'QQQ', 'DIA']; // ETFs des indices
  const indicesData = await finnhubClient.fetchMultipleIndices(alternativeIndices);

  if (indicesData.length > 0) {
    indicesData.forEach((index: any) => {
      const indexName =
        index.symbol === '^GSPC'
          ? 'S&P 500'
          : index.symbol === '^DJI'
            ? 'Dow Jones'
            : index.symbol === '^IXIC'
              ? 'NASDAQ'
              : index.symbol;
      console.log(
        `✅ ${indexName} (${index.symbol}): ${index.current} (${index.change > 0 ? '+' : ''}${index.percent_change}%)`
      );
    });
  } else {
    console.log('❌ Échec de la récupération des indices multiples');
  }

  // Test 3: Test avec un autre symbole (Apple)
  console.log('\n📊 Test 3 - Action Apple (AAPL):');
  const appleData = await finnhubClient.fetchQuote('AAPL');

  if (appleData) {
    console.log(
      `✅ Apple: ${appleData.current} (${appleData.change > 0 ? '+' : ''}${appleData.percent_change}%)`
    );
  } else {
    console.log('❌ Échec de la récupération des données Apple');
  }
}

// Gérer les erreurs
testSP500().catch((error: any) => {
  console.error('❌ Erreur lors du test:', error);
  process.exit(1);
});
