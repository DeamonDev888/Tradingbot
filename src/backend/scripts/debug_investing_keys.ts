import { chromium } from 'playwright';

async function checkKeys() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://www.investing.com/indices/volatility-s-p-500', { waitUntil: 'commit' });

  const metaContent = await page.getAttribute(
    'meta[name="global-translation-variables"]',
    'content'
  );
  if (metaContent) {
    const cleanContent = metaContent.replace(/&quot;/g, '"');
    const data = JSON.parse(cleanContent);
    console.log('Keys:', Object.keys(data));
    console.log('Sample values:', {
      last_price: data.last_price,
      LastPrice: data.LastPrice,
      lp: data.lp,
      price: data.price,
    });
  }
  await browser.close();
}
checkKeys();
