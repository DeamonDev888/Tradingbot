#!/usr/bin/env ts-node

import { VixPlaywrightScraper } from '../ingestion/VixPlaywrightScraper';
import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'financial_analyst',
  user: 'postgres',
  password: '9022',
});

async function testPlaywrightVixScraper() {
  console.log('🎭 TEST DU SCRAPER VIX AVEC PLAYWRIGHT (ANTI-BOT BYPASS)\n');

  const scraper = new VixPlaywrightScraper();

  try {
    console.log('🚀 Initialisation du browser...');
    await scraper.init();

    console.log('📊 Démarrage du scraping...\n');

    const startTime = Date.now();
    const results = await scraper.scrapeAll();
    const duration = Date.now() - startTime;

    console.log(`⏱️  Scraping terminé en ${duration}ms\n`);

    console.log('📋 RÉSULTATS PAR SOURCE:');
    console.log('='.repeat(80));

    let successCount = 0;
    let totalValue = 0;
    const validValues: number[] = [];

    results.forEach(result => {
      if (result.error) {
        console.log(`❌ ${result.source}: ERREUR - ${result.error}`);
      } else if (result.value === null) {
        console.log(`⚠️  ${result.source}: PAS DE DONNÉES - Vérifier les sélecteurs`);
      } else {
        console.log(`✅ ${result.source}:`);
        console.log(`   • VIX Value: ${result.value}`);
        console.log(`   • Change: ${result.change_abs} (${result.change_pct}%)`);
        console.log(`   • Previous Close: ${result.previous_close}`);
        console.log(`   • Day Range: ${result.low} - ${result.high}`);
        console.log(`   • News items: ${result.news_headlines.length}`);

        if (result.news_headlines.length > 0) {
          console.log(`   • Sample news: "${result.news_headlines[0].title.substring(0, 80)}..."`);
        }

        successCount++;
        totalValue += result.value;
        validValues.push(result.value);
      }
      console.log('');
    });

    // Analyse des résultats
    console.log('📈 ANALYSE DES DONNÉES:');
    console.log('='.repeat(50));

    if (validValues.length > 0) {
      const avg = validValues.reduce((a, b) => a + b, 0) / validValues.length;
      const min = Math.min(...validValues);
      const max = Math.max(...validValues);
      const spread = max - min;

      console.log(`📊 Statistiques:`);
      console.log(`   • Sources fonctionnelles: ${successCount}/${results.length}`);
      console.log(`   • Moyenne VIX: ${avg.toFixed(2)}`);
      console.log(`   • Min/Max: ${min.toFixed(2)} - ${max.toFixed(2)}`);
      console.log(`   • Écart (spread): ${spread.toFixed(2)}`);
      console.log(
        `   • Cohérence: ${spread < 1.0 ? '✅ EXCELLENTE' : spread < 2.0 ? '✅ BONNE' : '⚠️ FAIBLE'}`
      );
    } else {
      console.log(`❌ Aucune donnée VIX valide récupérée`);
    }

    // Test sauvegarde en base de données
    console.log('\n💾 TEST SAUVEGARDE BASE DE DONNÉES:');
    console.log('='.repeat(50));

    try {
      await scraper.saveToDatabase(pool, results);
      console.log('✅ Sauvegarde en base réussie');
    } catch (error: unknown) {
      console.error(
        '❌ Erreur sauvegarde BDD:',
        error instanceof Error ? error.message : String(error)
      );
    }

    // Comparaison avec ancien scraper
    console.log('\n🔄 COMPARAISON AVEC ANCIEN SCRAPER:');
    console.log('='.repeat(50));
    console.log('✅ Améliorations Playwright:');
    console.log('   • Headers stealth avancés');
    console.log('   • Simulation comportement humain');
    console.log('   • Gestion cookies automatique');
    console.log('   • Viewport réaliste');
    console.log('   • User-Agent randomisé');
    console.log('   • Anti-détection navigateur automatisé');

    console.log('\n📊 Performance:');
    console.log(`   • Temps d'exécution: ${duration}ms`);
    console.log(`   • Succès: ${successCount}/${results.length} sources`);
    console.log(`   • Taux de réussite: ${((successCount / results.length) * 100).toFixed(1)}%`);

    console.log('\n🎯 Recommandations:');
    if (successCount >= 2) {
      console.log("✅ Scraper Playwright fonctionnel - Remplacer l'ancien scraper");
    } else if (successCount >= 1) {
      console.log('⚠️  Scraper partiellement fonctionnel - Affiner les sélecteurs');
    } else {
      console.log('❌ Scraper non fonctionnel - Vérifier Playwright install');
    }
  } catch (error: unknown) {
    console.error('❌ Erreur critique:', error instanceof Error ? error.message : String(error));
  } finally {
    await scraper.close();
    await pool.end();
  }
}

// Vérification de l'installation de Playwright
async function checkPlaywrightInstallation() {
  console.log('🔍 VÉRIFICATION INSTALLATION PLAYWRIGHT');
  console.log('='.repeat(50));

  try {
    const { chromium } = await import('playwright');
    console.log('✅ Playwright installé');

    try {
      const browser = await chromium.launch({ headless: true });
      await browser.close();
      console.log('✅ Browser Chromium fonctionnel');
    } catch (error: unknown) {
      console.error('❌ Erreur browser:', error instanceof Error ? error.message : String(error));
      console.log('💡 Solution: npx playwright install');
      return false;
    }
    return true;
  } catch (error: unknown) {
    console.error('❌ Playwright non installé');
    console.log('💡 Installation: npm install playwright && npx playwright install');
    return false;
  }
}

if (require.main === module) {
  checkPlaywrightInstallation()
    .then(playwrightOk => {
      if (playwrightOk) {
        return testPlaywrightVixScraper();
      } else {
        console.log('\n❌ Installation Playwright requise avant de continuer');
        process.exit(1);
      }
    })
    .then(() => console.log('\n✅ Tests terminés!'))
    .catch(error =>
      console.error('\n❌ Erreur:', error instanceof Error ? error.message : String(error))
    );
}

export { testPlaywrightVixScraper };


