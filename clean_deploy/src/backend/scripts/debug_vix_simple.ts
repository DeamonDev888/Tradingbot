import { chromium } from 'playwright';
import * as fs from 'fs';

async function debugScraper() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Upgrade-Insecure-Requests': '1',
        Referer: 'https://www.google.com/',
      },
    });

    const page = await context.newPage();

    // --- Investing.com Debug ---
    console.log('\n--- Debugging Investing.com ---');
    try {
      await page.goto('https://www.investing.com/indices/volatility-s-p-500', {
        timeout: 30000,
        waitUntil: 'commit',
      });
      await page.waitForTimeout(3000);

      // Meta tag check
      const metaContent = await page.getAttribute(
        'meta[name="global-translation-variables"]',
        'content'
      );
      if (metaContent) {
        console.log('Found meta tag content (length):', metaContent.length);
        const cleanContent = metaContent.replace(/&quot;/g, '"');
        try {
          const data = JSON.parse(cleanContent);
          console.log('Parsed JSON data:', {
            LAST_PRICE: data.LAST_PRICE,
            PREV_CLOSE: data.PREV_CLOSE,
            OPEN_PRICE: data.OPEN_PRICE,
          });
        } catch (e) {
          console.log('Failed to parse JSON:', e);
        }
      } else {
        console.log('Meta tag NOT found');
      }
    } catch (e) {
      console.log('Investing.com error:', e);
    }

    // --- Yahoo Finance Debug ---
    console.log('\n--- Debugging Yahoo Finance ---');
    try {
      await page.goto('https://finance.yahoo.com/quote/%5EVIX', {
        timeout: 30000,
        waitUntil: 'commit',
      });
      await page.waitForTimeout(3000);

      if (page.url().includes('consent.yahoo.com') || (await page.$('button[name="agree"]'))) {
        console.log('Consent page detected');
        const agreeButton = page.locator('button[name="agree"], button.accept-all').first();
        if (await agreeButton.isVisible()) {
          await agreeButton.click();
          console.log('Clicked agree');
          await page.waitForNavigation({ timeout: 15000, waitUntil: 'domcontentloaded' });
        } else {
          console.log('Agree button not visible');
        }
      }

      const priceSelector = 'fin-streamer[data-field="regularMarketPrice"][data-symbol="^VIX"]';
      try {
        await page.waitForSelector(priceSelector, { timeout: 5000 });
        const price = await page.locator(priceSelector).first().getAttribute('value');
        console.log('Yahoo Price (attribute):', price);
        const text = await page.locator(priceSelector).first().textContent();
        console.log('Yahoo Price (text):', text);
      } catch (e) {
        console.log('Yahoo Price selector not found');
      }
    } catch (e) {
      console.log('Yahoo error:', e);
    }

    // --- MarketWatch Debug ---
    console.log('\n--- Debugging MarketWatch ---');
    try {
      await page.goto('https://www.marketwatch.com/investing/index/vix', {
        timeout: 30000,
        waitUntil: 'commit',
      });
      await page.waitForTimeout(3000);

      const content = await page.content();
      if (content.includes('DataDome')) {
        console.log('MarketWatch: Blocked by DataDome CAPTCHA');
      } else {
        console.log('MarketWatch: Page loaded (no obvious captcha)');
        const selectors = [
          'bg-quote.value',
          '.intraday__price .value',
          '[data-test="instrument-price-last"]',
        ];
        for (const sel of selectors) {
          const el = page.locator(sel).first();
          if (await el.isVisible()) {
            console.log(`Selector found: ${sel}, Text: ${await el.textContent()}`);
          } else {
            console.log(`Selector NOT found: ${sel}`);
          }
        }
      }
    } catch (e) {
      console.log('MarketWatch error:', e);
    }
  } catch (error) {
    console.error('Global Error:', error);
  } finally {
    await browser.close();
  }
}

debugScraper();
