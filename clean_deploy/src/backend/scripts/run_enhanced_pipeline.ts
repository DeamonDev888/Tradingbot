#!/usr/bin/env ts-node

import { EnhancedNewsPipeline } from './enhanced_news_pipeline';

console.log('🚀 Démarrage du Pipeline Amélioré...');

const pipeline = new EnhancedNewsPipeline();

pipeline
  .runPipeline()
  .then(result => {
    const successRate =
      result.total.itemsFound > 0 ? result.total.itemsSaved / result.total.itemsFound : 0;

    console.log('\n📋 RÉSULTATS DU PIPELINE:');
    console.log(`• Total items: ${result.total.itemsFound.toLocaleString()}`);
    console.log(`• Items validés: ${result.total.itemsValidated.toLocaleString()}`);
    console.log(`• Items sauvegardés: ${result.total.itemsSaved.toLocaleString()}`);
    console.log(`• Taux de réussite: ${(successRate * 100).toFixed(1)}%`);
    console.log(`• Score qualité moyen: ${(result.total.avgQualityScore * 100).toFixed(1)}%`);
    console.log(`• Doublons détectés: ${result.total.duplicatesRemoved.toLocaleString()}`);
    console.log(`• Faible qualité retirés: ${result.total.lowQualityRemoved.toLocaleString()}`);
    console.log(`• Espace récupéré: ${result.total.spaceRecovered.toFixed(1)} MB`);

    if (result.marketData.vixValue) {
      console.log(`• VIX actuel: ${result.marketData.vixValue}`);
    }

    if (result.marketData.sp500Value) {
      console.log(`• S&P500 actuel: ${result.marketData.sp500Value.toFixed(2)}`);
    }

    if (result.errors.length > 0) {
      console.log('\n❌ ERREURS:');
      result.errors.slice(0, 5).forEach(error => {
        console.log(`   • ${error}`);
      });
      if (result.errors.length > 5) {
        console.log(`   • ... et ${result.errors.length - 5} autres erreurs`);
      }
    }

    if (result.warnings.length > 0) {
      console.log('\n⚠️ AVERTISSEMENTS:');
      result.warnings.slice(0, 5).forEach(warning => {
        console.log(`   • ${warning}`);
      });
      if (result.warnings.length > 5) {
        console.log(`   • ... et ${result.warnings.length - 5} autres avertissements`);
      }
    }

    // Évaluation du succès
    if (result.errors.length === 0 && successRate > 0.8 && result.total.avgQualityScore > 0.6) {
      console.log('\n🎉 PIPELINE TERMINÉ AVEC GRAND SUCCÈS');
      console.log('   • Aucune erreur critique');
      console.log(`   • Taux de réussite excellent: ${(successRate * 100).toFixed(1)}%`);
      console.log(
        `   • Qualité des données bonne: ${(result.total.avgQualityScore * 100).toFixed(1)}%`
      );
      process.exit(0);
    } else if (
      result.errors.length === 0 &&
      successRate > 0.6 &&
      result.total.avgQualityScore > 0.4
    ) {
      console.log('\n🟡 PIPELINE TERMINÉ AVEC SUCCÈS PARTIEL');
      console.log(`   • Taux de réussite acceptable: ${(successRate * 100).toFixed(1)}%`);
      console.log(
        `   • Qualité des données moyenne: ${(result.total.avgQualityScore * 100).toFixed(1)}%`
      );
      process.exit(1);
    } else {
      console.log('\n🔴 PIPELINE TERMINÉ AVEC DES PROBLÈMES');
      console.log(`   • Taux de réussite faible: ${(successRate * 100).toFixed(1)}%`);
      console.log(
        `   • Qualité des données faible: ${(result.total.avgQualityScore * 100).toFixed(1)}%`
      );
      console.log(`   • Erreurs critiques: ${result.errors.length}`);
      process.exit(2);
    }
  })
  .catch(error => {
    console.error('\n❌ ERREUR CRITIQUE DU PIPELINE:', error);
    console.error('   Vérifiez:');
    console.error('   • La connexion à la base de données');
    console.error('   • Les clés API (FINNHUB_API_KEY, FRED_API_KEY)');
    console.error('   • La configuration dans .env');
    process.exit(3);
  });
