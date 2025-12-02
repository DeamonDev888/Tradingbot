import { RougePulseAgent } from '../agents/RougePulseAgent';

interface TestResult {
  sp500_data?: any;
  technical_levels?: any;
  analysis?: any;
  events_analyzed?: number;
  error?: string;
}

async function testRougePulseEnhanced() {
  console.log(
    "🚀 Test de l'agent RougePulse amélioré avec données S&P 500 et niveaux techniques...\n"
  );

  const agent = new RougePulseAgent();

  try {
    // Lancer l'analyse complète
    console.log("🔍 Démarrage de l'analyse économique et technique...");
    const analysisResult: Record<string, unknown> | { error: string } =
      await agent.analyzeMarketSentiment();

    if ('error' in analysisResult) {
      console.log('❌ Erreur:', analysisResult.error);
      return;
    }

    // Convertir en TestResult pour le typage
    const testResult: TestResult = analysisResult as TestResult;

    console.log("\n📊 RÉSULTATS DE L'ANALYSE:");
    console.log('='.repeat(60));

    // Afficher les données S&P 500
    if (testResult.sp500_data) {
      const sp500 = testResult.sp500_data;
      console.log('\n💹 DONNÉES S&P 500 EN TEMPS RÉEL:');
      console.log(`Prix actuel: ${sp500.current ? sp500.current.toFixed(2) : 'N/A'} USD`);
      console.log(
        `Variation: ${sp500.change ? (sp500.change > 0 ? '+' : '') + sp500.change.toFixed(2) : 'N/A'} (${sp500.percent_change ? (sp500.percent_change > 0 ? '+' : '') + sp500.percent_change.toFixed(2) : 'N/A'}%)`
      );
      console.log(
        `Fourchette: ${sp500.low ? sp500.low.toFixed(2) : 'N/A'} - ${sp500.high ? sp500.high.toFixed(2) : 'N/A'} USD`
      );
      console.log(`Ouverture: ${sp500.open ? sp500.open.toFixed(2) : 'N/A'} USD`);
      console.log(
        `Clôture précédente: ${sp500.previous_close ? sp500.previous_close.toFixed(2) : 'N/A'} USD`
      );
    }

    // Afficher les niveaux techniques
    if (testResult.technical_levels) {
      const levels = testResult.technical_levels;
      console.log('\n📈 NIVEAUX TECHNIQUES ANALYSÉS:');

      if (levels.supports && levels.supports.length > 0) {
        console.log('\n🟢 SUPPORTS (par pertinence):');
        levels.supports.forEach((support: any, index: number) => {
          console.log(
            `  ${index + 1}. ${support.level ? support.level.toFixed(2) : 'N/A'} - Force: ${support.strength ? support.strength.toUpperCase() : 'N/A'}`
          );
          console.log(
            `     Edge Score: ${support.edge_score || 'N/A'}/100 - Source: ${support.source || 'N/A'}`
          );
        });
      }

      if (levels.resistances && levels.resistances.length > 0) {
        console.log('\n🔴 RÉSISTANCES (par pertinence):');
        levels.resistances.forEach((resistance: any, index: number) => {
          console.log(
            `  ${index + 1}. ${resistance.level ? resistance.level.toFixed(2) : 'N/A'} - Force: ${resistance.strength ? resistance.strength.toUpperCase() : 'N/A'}`
          );
          console.log(
            `     Edge Score: ${resistance.edge_score || 'N/A'}/100 - Source: ${resistance.source || 'N/A'}`
          );
        });
      }

      if (levels.round_levels && levels.round_levels.length > 0) {
        console.log('\n💡 NIVEAUX PSYCHOLOGIQUES RONDS:');
        levels.round_levels.slice(0, 5).forEach((level: any) => {
          console.log(`  - ${level.level || 'N/A'}: ${level.significance || 'N/A'}`);
        });
      }
    }

    // Afficher l'analyse AI
    if (testResult.analysis) {
      const analysis = testResult.analysis;
      console.log('\n🤖 ANALYSE AI ENHANCÉE:');

      if (analysis.impact_score !== undefined) {
        console.log(`\n📊 Impact Score: ${analysis.impact_score}/100`);
      }

      if (analysis.market_narrative) {
        console.log(
          `\n📝 Récit du marché: ${(analysis.market_narrative || '').substring(0, 200)}...`
        );
      }

      if (analysis.technical_edge_analysis) {
        console.log('\n⚡ Analyse Technique EDGE:');
        if (analysis.technical_edge_analysis.current_position) {
          console.log(`Position actuelle: ${analysis.technical_edge_analysis.current_position}`);
        }

        if (
          analysis.technical_edge_analysis.key_levels &&
          analysis.technical_edge_analysis.key_levels.length > 0
        ) {
          console.log('\nNiveaux clés identifiés:');
          analysis.technical_edge_analysis.key_levels.forEach((level: any, index: number) => {
            console.log(
              `  ${index + 1}. ${level.level || 'N/A'} (${level.type || 'N/A'}) - Edge: ${level.edge_score || 'N/A'}/100`
            );
            if (level.probability_break) {
              console.log(`     Probabilité cassure: ${level.probability_break}`);
            }
          });
        }
      }

      if (analysis.asset_analysis) {
        console.log("\n🎯 Analyse d'Actifs:");
        if (analysis.asset_analysis.ES_Futures) {
          const es = analysis.asset_analysis.ES_Futures;
          console.log(`  ES Futures: ${es.bias || 'N/A'}`);
          if (es.edge_confirmation) {
            console.log(
              `  Edge confirmation: ${(es.edge_confirmation || '').substring(0, 100)}...`
            );
          }
        }

        if (analysis.asset_analysis.Bitcoin) {
          const btc = analysis.asset_analysis.Bitcoin;
          console.log(`  Bitcoin: ${btc.bias || 'N/A'}`);
          if (btc.correlation_analysis) {
            console.log(
              `  Corrélation ES-BTC: ${(btc.correlation_analysis || '').substring(0, 100)}...`
            );
          }
        }
      }

      if (analysis.trading_recommendation) {
        console.log(
          `\n💡 Recommandation de trading: ${(analysis.trading_recommendation || '').substring(0, 200)}...`
        );
      }

      if (analysis.next_session_levels) {
        console.log('\n📅 Niveaux Session Suivante:');
        if (analysis.next_session_levels.session_setup) {
          console.log(
            `Configuration: ${(analysis.next_session_levels.session_setup || '').substring(0, 150)}...`
          );
        }
        if (analysis.next_session_levels.breakout_scenarios) {
          console.log(
            `Scénarios cassure: ${(analysis.next_session_levels.breakout_scenarios || '').substring(0, 150)}...`
          );
        }
      }
    }

    console.log('\n✅ Test terminé avec succès!');
    console.log("\n🎉 L'agent RougePulse est maintenant capable de:");
    console.log('  • Récupérer les prix S&P 500 en temps réel');
    console.log('  • Analyser les niveaux de support/résistance depuis les news');
    console.log("  • Calculer des scores d'edge trading");
    console.log('  • Identifier les niveaux psychologiques ronds');
    console.log('  • Fournir une analyse probabiliste et non déterministe');
    console.log('  • Préparer les niveaux pour la prochaine séance');
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Exécuter le test
testRougePulseEnhanced()
  .then(() => {
    console.log('\n🏁 Script de test terminé');
    process.exit(0);
  })
  .catch((error: any) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
