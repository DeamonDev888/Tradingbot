import { FinnhubClient } from '../ingestion/FinnhubClient';

async function demonstrateSP500Features() {
  console.log('🚀 Démonstration Finnhub - Données du S&P 500 et indices majeurs\n');

  const finnhubClient = new FinnhubClient();

  // Feature 1: S&P 500 seul
  console.log('📊 S&P 500 (via ETF SPY):');
  const sp500Data = await finnhubClient.fetchSP500Data();

  if (sp500Data) {
    console.log(`✅ Prix actuel: ${sp500Data.current.toFixed(2)} USD`);
    console.log(
      `📈 Variation: ${sp500Data.change > 0 ? '+' : ''}${sp500Data.change.toFixed(2)} (${sp500Data.percent_change > 0 ? '+' : ''}${sp500Data.percent_change.toFixed(2)}%)`
    );
    console.log(`📊 Ouverture: ${sp500Data.open.toFixed(2)} USD`);
    console.log(`🔼 Plus haut: ${sp500Data.high.toFixed(2)} USD`);
    console.log(`🔽 Plus bas: ${sp500Data.low.toFixed(2)} USD`);
    console.log(`📌 Clôture précédente: ${sp500Data.previous_close.toFixed(2)} USD`);
    console.log(`⏰ Heure: ${new Date(sp500Data.timestamp * 1000).toLocaleString()}\n`);
  }

  // Feature 2: Indices majeurs avec noms
  console.log('📈 Indices majeurs:');
  const majorIndices = await finnhubClient.fetchMajorIndices();

  majorIndices.forEach(index => {
    const trend = index.data.change > 0 ? '📈' : index.data.change < 0 ? '📉' : '➡️';
    const color =
      index.data.percent_change > 0 ? '🟢' : index.data.percent_change < 0 ? '🔴' : '⚪';

    console.log(
      `${trend} ${index.name} (${index.data.symbol}): ${color} ${index.data.current.toFixed(2)} ${index.data.change > 0 ? '+' : ''}${index.data.percent_change.toFixed(2)}%`
    );
  });

  // Feature 3: Comparaison de performance
  console.log('\n📊 Performance du jour:');
  console.log('─'.repeat(50));

  const bestPerformer = majorIndices.reduce((best, current) =>
    current.data.percent_change > best.data.percent_change ? current : best
  );

  const worstPerformer = majorIndices.reduce((worst, current) =>
    current.data.percent_change < worst.data.percent_change ? current : worst
  );

  console.log(
    `🏆 Meilleur: ${bestPerformer.name} (+${bestPerformer.data.percent_change.toFixed(2)}%)`
  );
  console.log(
    `📉 Pire: ${worstPerformer.name} (${worstPerformer.data.percent_change.toFixed(2)}%)`
  );

  // Feature 4: Données de marché additionnelles
  console.log('\n💹 Détails complets:');
  majorIndices.forEach(index => {
    console.log(`\n🔸 ${index.name}:`);
    console.log(`   • Prix: ${index.data.current.toFixed(2)} USD`);
    console.log(
      `   • Variation: ${index.data.change > 0 ? '+' : ''}${index.data.change.toFixed(2)} USD`
    );
    console.log(
      `   • Fourchette: ${index.data.low.toFixed(2)} - ${index.data.high.toFixed(2)} USD`
    );
    console.log(
      `   • Écart: ${(((index.data.high - index.data.low) / index.data.current) * 100).toFixed(2)}%`
    );
  });

  console.log('\n✨ Données récupérées avec succès via Finnhub !');
}

// Démonstration
demonstrateSP500Features()
  .then(() => {
    console.log('\n🎉 Script terminé avec succès');
    process.exit(0);
  })
  .catch((error: any) => {
    console.error('❌ Erreur lors de la démonstration:', error);
    process.exit(1);
  });
