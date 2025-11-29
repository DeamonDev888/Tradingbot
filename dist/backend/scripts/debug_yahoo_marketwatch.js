import { chromium } from 'playwright';
async function debugYahooAndMarketWatch() {
    console.log('🔍 DEBUG SPÉCIALISÉ - Yahoo Finance & MarketWatch\n');
    const browser = await chromium.launch({
        headless: false, // Mode visible pour debug
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
        ],
    });
    try {
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            viewport: { width: 1920, height: 1080 },
            extraHTTPHeaders: {
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Upgrade-Insecure-Requests': '1',
                Referer: 'https://www.google.com/',
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            },
        });
        const page = await context.newPage();
        // === YAHOO FINANCE DEBUG ===
        console.log('\n🔍 YAHOO FINANCE DEBUG');
        console.log('='.repeat(50));
        try {
            console.log('1. Navigation vers Yahoo Finance...');
            const response = await page.goto('https://finance.yahoo.com/quote/%5EVIX', {
                waitUntil: 'domcontentloaded',
                timeout: 30000,
            });
            console.log(`Status: ${response?.status()}`);
            console.log(`URL actuelle: ${page.url()}`);
            // Screenshot pour voir ce qui se passe
            await page.screenshot({ path: 'yahoo_step1.png', fullPage: true });
            console.log('📸 Screenshot sauvegardé: yahoo_step1.png');
            // Attendre un peu pour voir les redirections
            console.log('2. Attendre 5 secondes pour les redirections...');
            await page.waitForTimeout(5000);
            console.log(`URL après 5s: ${page.url()}`);
            // Vérifier les popup de consentement
            console.log('3. Recherche des popup de consentement...');
            const consentSelectors = [
                'button[name="agree"]',
                'button.accept-all',
                'button.btn.primary',
                'button[value="agree"]',
                'form[action*="consent"] button[type="submit"]',
                'button:has-text("Accept all")',
                'button:has-text("Tout accepter")',
                'button:has-text("Accept")',
                '#consent-page-submit',
                '[data-testid="policy-submit-accept-all-button"]',
            ];
            for (const selector of consentSelectors) {
                try {
                    const element = await page.$(selector);
                    if (element) {
                        const isVisible = await element.isVisible();
                        console.log(`  ✅ ${selector}: ${isVisible ? 'VISIBLE' : 'MASQUÉ'}`);
                        if (isVisible) {
                            console.log(`  🎯 CLIQUE SUR: ${selector}`);
                            await element.click();
                            await page.waitForTimeout(3000);
                            console.log(`  URL après clic: ${page.url()}`);
                        }
                    }
                }
                catch (e) {
                    console.log(`  ❌ ${selector}: Erreur`);
                }
            }
            // Screenshot après gestion consentement
            await page.screenshot({ path: 'yahoo_step2.png', fullPage: true });
            console.log('📸 Screenshot après consentement: yahoo_step2.png');
            // Vérifier si on peut trouver les données VIX
            console.log('4. Recherche des données VIX...');
            const vixSelectors = [
                'fin-streamer[data-field="regularMarketPrice"][data-symbol="^VIX"]',
                '[data-testid="qsp-price"]',
                'fin-streamer[data-field="regularMarketChange"]',
                '[data-testid="qsp-price-change"]',
                'fin-streamer[data-field="regularMarketChangePercent"]',
                '[data-testid="qsp-price-change-percent"]',
            ];
            for (const selector of vixSelectors) {
                try {
                    const element = await page.$(selector);
                    if (element) {
                        const isVisible = await element.isVisible();
                        const text = isVisible ? await element.textContent() : '';
                        console.log(`  📊 ${selector}: ${isVisible ? 'VISIBLE' : 'MASQUÉ'} - ${text || 'VIDE'}`);
                    }
                    else {
                        console.log(`  ❌ ${selector}: NON TROUVÉ`);
                    }
                }
                catch (e) {
                    console.log(`  ❌ ${selector}: Erreur`);
                }
            }
        }
        catch (error) {
            console.error('❌ Erreur Yahoo Finance:', error);
        }
        // === MARKETWATCH DEBUG ===
        console.log('\n🔍 MARKETWATCH DEBUG');
        console.log('='.repeat(50));
        try {
            console.log('1. Navigation vers MarketWatch...');
            await page.goto('https://www.marketwatch.com/investing/index/vix', {
                waitUntil: 'domcontentloaded',
                timeout: 30000,
            });
            console.log(`URL actuelle: ${page.url()}`);
            // Screenshot pour voir ce qui se passe
            await page.screenshot({ path: 'marketwatch_step1.png', fullPage: true });
            console.log('📸 Screenshot sauvegardé: marketwatch_step1.png');
            // Attendre un peu
            console.log('2. Attendre 5 secondes...');
            await page.waitForTimeout(5000);
            // Vérifier les blocages ou popups
            console.log('3. Vérification des blocages...');
            // Vérifier si on est bloqué
            const blocked = await page.evaluate(() => {
                return (document.body.innerText.includes('blocked') ||
                    document.body.innerText.includes('Access Denied') ||
                    document.body.innerText.includes('CAPTCHA') ||
                    document.body.innerText.includes('Robot check'));
            });
            console.log(`Blocage détecté: ${blocked}`);
            // Vérifier les données VIX
            console.log('4. Recherche des données VIX...');
            const vixSelectors = [
                '.intraday__price .value',
                '[data-test="instrument-price-last"]',
                '.intraday__price .change--point .value',
                '[data-test="instrument-price-change"]',
                '.intraday__price .change--percent .value',
                '[data-test="instrument-price-change-percent"]',
                '.intraday__close .value',
                '[data-test="prev-close-value"]',
            ];
            for (const selector of vixSelectors) {
                try {
                    const element = await page.$(selector);
                    if (element) {
                        const isVisible = await element.isVisible();
                        const text = isVisible ? await element.textContent() : '';
                        console.log(`  📊 ${selector}: ${isVisible ? 'VISIBLE' : 'MASQUÉ'} - ${text || 'VIDE'}`);
                    }
                    else {
                        console.log(`  ❌ ${selector}: NON TROUVÉ`);
                    }
                }
                catch (e) {
                    console.log(`  ❌ ${selector}: Erreur`);
                }
            }
            // Screenshot final
            await page.screenshot({ path: 'marketwatch_step2.png', fullPage: true });
            console.log('📸 Screenshot final: marketwatch_step2.png');
        }
        catch (error) {
            console.error('❌ Erreur MarketWatch:', error);
        }
    }
    catch (error) {
        console.error('Erreur globale:', error);
    }
    finally {
        await browser.close();
    }
}
debugYahooAndMarketWatch();
//# sourceMappingURL=debug_yahoo_marketwatch.js.map