#!/usr/bin/env ts-node

import { VixombreAgent } from './src/backend/agents/VixombreAgent';

async function testVixombreExpert() {
    console.log('🎭 TEST VIXOMBRE AGENT - EXPERT VOLATILITY ANALYSIS');
    console.log('=' .repeat(80));
    console.log('');

    const agent = new VixombreAgent();

    try {
        console.log('🚀 Lancement de l\'analyse experte de la volatilité...\n');

        const startTime = Date.now();
        const analysis = await agent.analyzeVixStructure();
        const duration = Date.now() - startTime;

        console.log(`⏱️  Analyse terminée en ${duration}ms\n`);

        if (analysis.error) {
            console.log('❌ ERREUR D\'ANALYSE:');
            console.log(analysis.error);
            return;
        }

        // Afficher les résultats au format expert
        console.log('✅ ANALYSE EXPERTE DE LA VOLATILITÉ TERMINÉE AVEC SUCCÈS!');
        console.log('=' .repeat(80));
        console.log('');

        // Métadonnées
        console.log('📊 MÉTADONNÉES:');
        console.log(`   • Timestamp: ${analysis.metadata?.analysis_timestamp}`);
        console.log(`   • Statut marché: ${analysis.metadata?.markets_status}`);
        console.log(`   • Sources scrapées: ${analysis.metadata?.sources_scraped}/${analysis.metadata?.sources_scraped + analysis.metadata?.sources_failed}`);
        console.log(`   • Type d'analyse: ${analysis.metadata?.analysis_type}`);
        console.log('');

        // Données VIX actuelles
        console.log('📈 DONNÉES VIX ACTUELLES:');
        console.log(`   • VIX Consensus: ${analysis.current_vix_data?.consensus_value}`);
        console.log(`   • Tendance: ${analysis.current_vix_data?.trend}`);
        console.log(`   • Sources: ${analysis.current_vix_data?.sources?.length} source(s)`);
        console.log('');

        // Analyse experte
        const expert = analysis.expert_volatility_analysis;
        if (expert && expert.sentiment) {
            console.log('🎯 ANALYSE EXPERTE:');
            console.log('   '.repeat(40));
            console.log(`📊 RÉSULTAT D'ANALYSE DE VOLATILITÉ:`);
            console.log(JSON.stringify({
                sentiment: expert.sentiment,
                sentiment_score: expert.sentiment_score,
                risk_level: expert.risk_level,
                volatility_regime: expert.volatility_regime,
                catalysts: expert.catalysts || [],
                expert_summary: expert.expert_summary,
                key_insights: expert.key_insights || []
            }, null, 2));
            console.log('');

            console.log('💡 INSIGHTS CLÉS:');
            console.log('   '.repeat(40));
            if (expert.key_insights && expert.key_insights.length > 0) {
                expert.key_insights.forEach((insight: string, i: number) => {
                    console.log(`   ${i + 1}. ${insight}`);
                });
            } else {
                console.log('   • Aucun insight disponible');
            }
            console.log('');

            // Implications marché
            if (expert.market_implications) {
                console.log('📊 IMPLICATIONS MARCHÉ:');
                console.log(`   • Biais ES Futures: ${expert.market_implications.es_futures_bias}`);
                console.log(`   • Attente volatilité: ${expert.market_implications.volatility_expectation}`);
                console.log(`   • Niveau confiance: ${expert.market_implications.confidence_level}%`);
                console.log(`   • Horizon temporel: ${expert.market_implications.time_horizon}`);
                console.log('');
            }

            // Recommandations de trading
            if (expert.trading_recommendations) {
                console.log('🎯 RECOMMANDATIONS TRADING:');
                console.log(`   • Stratégie: ${expert.trading_recommendations.strategy}`);
                if (expert.trading_recommendations.entry_signals) {
                    console.log('   • Signaux d\'entrée:');
                    expert.trading_recommendations.entry_signals.forEach((signal: string) => {
                        console.log(`     - ${signal}`);
                    });
                }
                console.log(`   • Gestion risque: ${expert.trading_recommendations.risk_management}`);
                if (expert.trading_recommendations.target_vix_levels) {
                    console.log(`   • Cibles VIX: ${expert.trading_recommendations.target_vix_levels.join(' - ')}`);
                }
                console.log('');
            }
        }

        // Contexte historique
        if (analysis.historical_context) {
            console.log('📚 CONTEXTE HISTORIQUE:');
            const hist = analysis.historical_context;
            console.log(`   • Moyenne 5 jours: ${hist.comparison_5day}`);
            console.log(`   • Moyenne 20 jours: ${hist.comparison_20day}`);
            console.log(`   • Tendance volatilité: ${hist.volatility_trend}`);
            console.log(`   • Support: ${hist.key_levels?.support}`);
            console.log(`   • Résistance: ${hist.key_levels?.resistance}`);
            console.log('');
        }

        // Analyse des news
        if (analysis.news_analysis) {
            console.log('📰 ANALYSE DES NEWS:');
            const news = analysis.news_analysis;
            console.log(`   • Total headlines: ${news.total_headlines}`);
            if (news.key_themes && news.key_themes.length > 0) {
                console.log(`   • Thèmes clés: ${news.key_themes.join(', ')}`);
            }
            if (news.volatility_catalysts && news.volatility_catalysts.length > 0) {
                console.log(`   • Catalyseurs volatilité: ${news.volatility_catalysts.length} trouvé(s)`);
            }
            console.log('');
        }

        console.log('✅ ANALYSE COMPLÈTE TERMINÉE AVEC SUCCÈS!');

    } catch (error) {
        console.error('❌ Erreur critique lors du test:', error);
    }
}

if (require.main === module) {
    testVixombreExpert();
}