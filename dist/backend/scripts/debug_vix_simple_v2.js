import { chromium } from 'playwright';
async function debugScraper() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
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
            const metaContent = await page.getAttribute('meta[name="global-translation-variables"]', 'content');
            if (metaContent) {
                console.log('Found meta tag content (length):', metaContent.length);
                const cleanContent = metaContent.replace(/&quot;/g, '"');
                try {
                    let data = JSON.parse(cleanContent);
                    if (typeof data === 'string') {
                        console.log('Data is string, parsing again...');
                        data = JSON.parse(data);
                    }
                    console.log('Parsed JSON data:', {
                        LAST_PRICE: data.LAST_PRICE,
                        PREV_CLOSE: data.PREV_CLOSE,
                        OPEN_PRICE: data.OPEN_PRICE,
                    });
                }
                catch (e) {
                    console.log('Failed to parse JSON:', e);
                }
            }
            else {
                console.log('Meta tag NOT found');
            }
        }
        catch (e) {
            console.log('Investing.com error:', e);
        }
    }
    catch (error) {
        console.error('Global Error:', error);
    }
    finally {
        await browser.close();
    }
}
debugScraper();
//# sourceMappingURL=debug_vix_simple_v2.js.map