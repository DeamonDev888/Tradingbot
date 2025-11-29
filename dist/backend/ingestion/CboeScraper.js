import { chromium } from 'playwright';
export class CboeScraper {
    browser = null;
    async init() {
        if (!this.browser) {
            this.browser = await chromium.launch({
                headless: true,
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
        }
    }
    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
    async createStealthPage() {
        if (!this.browser)
            throw new Error('Browser not initialized');
        const context = await this.browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 1920, height: 1080 },
        });
        const page = await context.newPage();
        return page;
    }
    async scrapeOexRatio() {
        await this.init();
        const page = await this.createStealthPage();
        const source = 'Barchart';
        try {
            console.log(`[${source}] Navigating to OEX Put/Call Ratio page...`);
            await page.goto('https://www.barchart.com/stocks/quotes/$CPCO/interactive-chart', {
                waitUntil: 'domcontentloaded',
                timeout: 30000,
            });
            // Handle cookie consent if present
            try {
                const cookieButton = await page
                    .locator('button:has-text("Accept"), button:has-text("Accepter")')
                    .first();
                if (await cookieButton.isVisible({ timeout: 5000 })) {
                    await cookieButton.click();
                }
            }
            catch {
                // Ignore if not found
            }
            // Look for the specific text pattern observed by the subagent
            // "OEX Put/Call Ratio ($CPCO) 1.72 -1.07 (-38.35%) 23:59 ET"
            // We can try to find the element containing "$CPCO" and extract the text
            // Wait a bit for dynamic content
            await page.waitForTimeout(3000);
            const content = await page.content();
            // Regex to find the value
            // Matches: OEX Put/Call Ratio ($CPCO) 1.72
            const match = content.match(/OEX Put\/Call Ratio \(\$CPCO\)\s+([\d.]+)/);
            let ratio = null;
            if (match && match[1]) {
                ratio = parseFloat(match[1]);
                console.log(`[${source}] Found OEX Ratio via regex: ${ratio}`);
            }
            else {
                // Fallback: Try to find the price/value element directly if regex fails
                // Barchart usually puts the last price in a specific class
                const priceElement = await page.locator('.last-change .last-value').first();
                if (await priceElement.isVisible()) {
                    const text = await priceElement.textContent();
                    if (text) {
                        ratio = parseFloat(text.replace(/,/g, ''));
                        console.log(`[${source}] Found OEX Ratio via selector: ${ratio}`);
                    }
                }
            }
            if (ratio === null) {
                throw new Error('Could not extract OEX Put/Call Ratio');
            }
            return {
                source,
                put_call_ratio: ratio,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            console.error(`[${source}] Error scraping:`, error);
            return {
                source,
                put_call_ratio: null,
                timestamp: null,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
        finally {
            await this.close();
        }
    }
    async saveToDatabase(pool, result) {
        if (result.put_call_ratio === null)
            return;
        const client = await pool.connect();
        try {
            // Create table if not exists (handled in schema update script, but good to have here conceptually)
            await client.query(`INSERT INTO oex_ratios (ratio, source, scraped_at) VALUES ($1, $2, NOW())`, [result.put_call_ratio, result.source]);
            console.log(`[CboeScraper] Saved OEX Ratio ${result.put_call_ratio} to DB.`);
        }
        catch (error) {
            console.error('[CboeScraper] Error saving to DB:', error);
        }
        finally {
            client.release();
        }
    }
}
//# sourceMappingURL=CboeScraper.js.map