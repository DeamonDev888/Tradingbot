import { chromium } from 'playwright';
import * as fs from 'fs';
async function dumpHtml() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            viewport: { width: 1920, height: 1080 },
        });
        const page = await context.newPage();
        // MarketWatch
        console.log('Dumping MarketWatch...');
        await page.goto('https://www.marketwatch.com/investing/index/vix', {
            timeout: 60000,
            waitUntil: 'commit',
        });
        await page.waitForTimeout(5000);
        const mwHtml = await page.content();
        fs.writeFileSync('marketwatch_dump.html', mwHtml);
        console.log('Saved marketwatch_dump.html');
        // Yahoo
        console.log('Dumping Yahoo...');
        await page.goto('https://finance.yahoo.com/quote/%5EVIX', {
            timeout: 60000,
            waitUntil: 'commit',
        });
        // Handle Yahoo Consent
        try {
            const agreeButton = page.locator('button[name="agree"], button.accept-all').first();
            if (await agreeButton.isVisible({ timeout: 5000 })) {
                await agreeButton.click();
                await page.waitForNavigation({ timeout: 30000, waitUntil: 'domcontentloaded' });
            }
        }
        catch {
            // Ignore consent popup errors
        }
        await page.waitForTimeout(5000);
        const yahooHtml = await page.content();
        fs.writeFileSync('yahoo_dump.html', yahooHtml);
        console.log('Saved yahoo_dump.html');
        // Investing
        console.log('Dumping Investing...');
        await page.goto('https://www.investing.com/indices/volatility-s-p-500', {
            timeout: 60000,
            waitUntil: 'commit',
        });
        await page.waitForTimeout(5000);
        const invHtml = await page.content();
        fs.writeFileSync('investing_dump.html', invHtml);
        console.log('Saved investing_dump.html');
    }
    catch (error) {
        console.error('Error:', error);
    }
    finally {
        await browser.close();
    }
}
dumpHtml();
//# sourceMappingURL=debug_vix_dump.js.map