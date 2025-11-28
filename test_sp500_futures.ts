import { FinnhubClient } from './src/backend/ingestion/FinnhubClient';
import * as dotenv from 'dotenv';

dotenv.config();

async function testSP500Futures() {
  console.log('🧪 TEST: Récupération des données S&P500 Futures');
  console.log('='.repeat(60));

  const client = new FinnhubClient();

  if (!process.env.FINNHUB_API_KEY) {
    console.error('❌ FINNHUB_API_KEY manquant dans .env');
    process.exit(1);
  }

  try {
    // Test 1: Récupération directe des ES Futures
    console.log('\n1️⃣ Test direct des ES Futures...');
    const esData = await client.fetchESFutures();

    if (esData) {
      console.log('✅ ES Futures récupérés avec succès:');
      console.log(`   Prix: ${esData.current.toFixed(2)}`);
      console.log(`   Variation: ${esData.change > 0 ? '+' : ''}${esData.change} (${esData.percent_change > 0 ? '+' : ''}${esData.percent_change.toFixed(2)}%)`);
      console.log(`   Écart: ${esData.low?.toFixed(2)} - ${esData.high?.toFixed(2)}`);
      console.log(`   Ouverture: ${esData.open?.toFixed(2)}`);
      console.log(`   Clôture précédente: ${esData.previous_close?.toFixed(2)}`);
    } else {
      console.log('❌ ES Futures non disponibles');
    }

    // Test 2: Récupération S&P500 avec la nouvelle logique
    console.log('\n2️⃣ Test S&P500 (nouvelle méthode avec priorité Futures)...');
    const sp500Data = await client.fetchSP500Data();

    if (sp500Data) {
      console.log('✅ S&P500 data récupéré avec succès:');
      console.log(`   Symbole: ${sp500Data.symbol}`);
      console.log(`   Prix: ${sp500Data.current.toFixed(2)}`);
      console.log(`   Variation: ${sp500Data.change > 0 ? '+' : ''}${sp500Data.change} (${sp500Data.percent_change > 0 ? '+' : ''}${sp500Data.percent_change.toFixed(2)}%)`);
      console.log(`   Écart: ${sp500Data.low?.toFixed(2)} - ${sp500Data.high?.toFixed(2)}`);
      console.log(`   Ouverture: ${sp500Data.open?.toFixed(2)}`);
      console.log(`   Clôture précédente: ${sp500Data.previous_close?.toFixed(2)}`);

      // Analyse de la source
      if (sp500Data.symbol.includes('ES_FUTURES')) {
        console.log('   📊 Source: Futures directs (recommandé)');
      } else if (sp500Data.symbol.includes('ES_FROM_SPY')) {
        console.log('   📊 Source: SPY ETF converti (fallback)');
      } else if (sp500Data.symbol.includes('ES_FROM_QQQ')) {
        console.log('   📊 Source: QQQ ETF converti (dernier fallback)');
      } else {
        console.log('   📊 Source: ETF brut');
      }
    } else {
      console.log('❌ S&P500 data non disponible');
    }

    // Test 3: Comparaison avec les indices ETF
    console.log('\n3️⃣ Test comparatif avec les ETFs...');
    const indices = await client.fetchMajorIndices();

    for (const index of indices) {
      if (index.data) {
        console.log(`   ${index.name}: ${index.data.current.toFixed(2)} (${index.data.percent_change > 0 ? '+' : ''}${index.data.percent_change.toFixed(2)}%)`);
      }
    }

    // Analyse finale
    console.log('\n📋 Analyse des résultats:');

    if (esData && sp500Data) {
      if (esData.current === sp500Data.current && sp500Data.symbol.includes('ES_FUTURES')) {
        console.log('✅ Succès: Les données ES Futures sont utilisées directement');
      } else if (sp500Data.symbol.includes('ES_FROM_SPY') || sp500Data.symbol.includes('ES_FROM_QQQ')) {
        console.log('⚠️ Fallback: Les ETFs sont utilisés comme approximation');
        console.log('   💡 Recommandation: Vérifier les symboles futures avec Finnhub');
      } else {
        console.log('❌ Incohérence: Vérifier l\'implémentation');
      }
    } else if (sp500Data) {
      console.log('⚡ Partiel: Données récupérées via ETFs (ES Futures non disponibles)');
    } else {
      console.log('❌ Échec: Aucune donnée S&P500 récupérée');
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Exécuter le test
testSP500Futures()
  .then(() => {
    console.log('\n🎉 Test terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test échoué:', error);
    process.exit(1);
  });