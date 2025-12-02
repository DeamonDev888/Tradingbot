import { chromium } from 'playwright';

async function testIsolatedSources() {
  console.log('🧪 TEST ISOLÉ DES SOURCES - APPROCHE MINIMALISTE\n');

  const browser = await chromium.launch({
    headless: false, // Visible pour debug
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--disable-extensions',
      '--no-first-run',
      '--disable-default-apps',
    ],
  });

  try {
    // Test Yahoo Finance isolé
    console.log('🔍 TEST YAHOO FINANCE ISOLÉ');
    console.log('='.repeat(50));

    const yahooContext = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      extraHTTPHeaders: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        DNT: '1',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    const yahooPage = await yahooContext.newPage();

    // Masquer l'automatisation
    await yahooPage.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    });

    try {
      console.log('1. Navigation vers Yahoo...');
      const startTime = Date.now();

      const response = await yahooPage.goto('https://finance.yahoo.com/quote/%5EVIX', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });

      console.log(`   Status: ${response?.status()}`);
      console.log(`   URL: ${yahooPage.url()}`);
      console.log(`   Temps: ${Date.now() - startTime}ms`);

      // Si redirection consentement
      if (yahooPage.url().includes('consent.yahoo.com')) {
        console.log('2. Gestion consentement...');

        // Attendre un peu que les éléments apparaissent
        await yahooPage.waitForTimeout(2000);

        const agreeButton = await yahooPage.$('button[name="agree"]');
        if (agreeButton) {
          console.log('   ✅ Bouton agree trouvé');
          await agreeButton.click();
          await yahooPage.waitForTimeout(3000);

          console.log(`   URL après clic: ${yahooPage.url()}`);
        } else {
          console.log('   ❌ Bouton agree non trouvé');
        }

        // Si toujours sur consentement, recharger direct
        if (yahooPage.url().includes('consent.yahoo.com')) {
          console.log('3. Rechargement direct...');
          await yahooPage.goto('https://finance.yahoo.com/quote/%5EVIX', {
            waitUntil: 'domcontentloaded',
            timeout: 10000,
          });
        }
      }

      // Extraction simple
      console.log('4. Extraction VIX...');
      const value = await yahooPage.evaluate(() => {
        const selectors = [
          'fin-streamer[data-field="regularMarketPrice"][data-symbol="^VIX"]',
          '[data-testid="qsp-price"]',
          'fin-streamer[data-field="regularMarketPrice"]',
        ];

        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element && element.textContent) {
            return element.textContent.trim();
          }
        }
        return null;
      });

      console.log(`   VIX Value: ${value || 'NON TROUVÉ'}`);
      console.log(`   Succès: ${value ? '✅' : '❌'}`);
    } catch (error) {
      console.error(`   ❌ Erreur Yahoo: ${error}`);
    } finally {
      await yahooContext.close();
    }

    console.log('\n🔍 TEST MARKETWATCH ISOLÉ');
    console.log('='.repeat(50));

    const mwContext = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      extraHTTPHeaders: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        DNT: '1',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    const mwPage = await mwContext.newPage();

    // Masquer l'automatisation
    await mwPage.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    });

    try {
      console.log('1. Navigation vers MarketWatch...');
      const startTime = Date.now();

      const response = await mwPage.goto('https://www.marketwatch.com/investing/index/vix', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });

      console.log(`   Status: ${response?.status()}`);
      console.log(`   URL: ${mwPage.url()}`);
      console.log(`   Temps: ${Date.now() - startTime}ms`);

      // Attendre le chargement
      await mwPage.waitForTimeout(3000);

      // Extraction simple
      console.log('2. Extraction VIX...');
      const value = await mwPage.evaluate(() => {
        const selectors = ['.intraday__price .value', '.value', '.price', '[data-test*="price"]'];

        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element && element.textContent) {
            const text = element.textContent.trim();
            if (text && /^\d+\.?\d*$/.test(text)) {
              return text;
            }
          }
        }
        return null;
      });

      console.log(`   VIX Value: ${value || 'NON TROUVÉ'}`);
      console.log(`   Succès: ${value ? '✅' : '❌'}`);

      // Vérifier les blocages
      const blocked = await mwPage.evaluate(() => {
        const bodyText = document.body.innerText.toLowerCase();
        return (
          bodyText.includes('blocked') ||
          bodyText.includes('access denied') ||
          bodyText.includes('captcha') ||
          bodyText.includes('robot check') ||
          bodyText.includes('cloudflare')
        );
      });

      console.log(`   Blocage: ${blocked ? '✅ DÉTECTÉ' : '❌ NON'}`);
    } catch (error) {
      console.error(`   ❌ Erreur MarketWatch: ${error}`);
    } finally {
      await mwContext.close();
    }

    console.log('\n📊 RÉSUMÉ DES TESTS ISOLÉS');
    console.log('='.repeat(50));
    console.log('✅ Tests terminés');
  } catch (error) {
    console.error('Erreur globale:', error);
  } finally {
    console.log('\n⏳ Attente 10s avant fermeture...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    await browser.close();
  }
}

testIsolatedSources();
