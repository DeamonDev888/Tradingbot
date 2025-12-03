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
            await page.goto('https://www.barchart.com/stocks/quotes/$CPCO', {
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
            // Wait for the main price element to be visible
            // We look for the specific text "OEX Put/Call Ratio" but use a looser match
            const titleLocator = page.locator('text=OEX Put/Call Ratio');
            try {
                await titleLocator.first().waitFor({ timeout: 15000 });
            }
            catch (e) {
                console.log(`[${source}] Title locator timeout. Page content preview:`, (await page.content()).substring(0, 500));
            }
            let ratio = null;
            if (await titleLocator.first().isVisible()) {
                // Get the element and its text
                const element = titleLocator.first();
                const text = (await element.textContent()) || '';
                const parentText = await element.evaluate(el => el.parentElement?.textContent || '');
                console.log(`[${source}] Found element text: "${text.trim()}"`);
                console.log(`[${source}] Found parent text: "${parentText.trim()}"`);
                // Try to match number in the text or parent text
                // Matches: 1.72 or 0.85 etc.
                const numberRegex = /([\d]+\.[\d]+)/;
                // First try the parent text as it usually contains the price "OEX Put/Call Ratio ($CPCO) 1.72"
                let match = parentText.match(numberRegex);
                if (match && match[1]) {
                    // Verify it's not part of the symbol ($CPCO) - usually price is after
                    // Let's look for the number specifically after the title
                    const afterTitle = parentText.split('OEX Put/Call Ratio')[1] || '';
                    const priceMatch = afterTitle.match(/([\d]+\.[\d]+)/);
                    if (priceMatch && priceMatch[1]) {
                        ratio = parseFloat(priceMatch[1]);
                        console.log(`[${source}] Extracted ratio from parent text: ${ratio}`);
                    }
                }
                if (ratio === null) {
                    // Try the element text itself
                    match = text.match(numberRegex);
                    if (match && match[1]) {
                        ratio = parseFloat(match[1]);
                        console.log(`[${source}] Extracted ratio from element text: ${ratio}`);
                    }
                }
            }
            if (ratio === null) {
                console.log(`[${source}] Primary extraction failed. Trying fallback class selector...`);
                // Fallback: Try the specific class selector for Barchart quotes
                const priceElement = await page.locator('.last-change .last-value').first();
                if (await priceElement.isVisible()) {
                    const text = await priceElement.textContent();
                    if (text) {
                        ratio = parseFloat(text.replace(/,/g, ''));
                        console.log(`[${source}] Found OEX Ratio via class selector: ${ratio}`);
                    }
                }
                else {
                    console.log(`[${source}] Fallback selector .last-change .last-value not visible.`);
                }
            }
            if (ratio === null) {
                console.log(`[${source}] All selectors failed. Trying nuclear option: Full Page Text Search`);
                const bodyText = await page.innerText('body');
                // Look for "OEX Put/Call Ratio" and grab the first number after it
                const parts = bodyText.split('OEX Put/Call Ratio');
                if (parts.length > 1) {
                    // Get the part after the text
                    const afterText = parts[1];
                    // Match the first number (float)
                    const match = afterText.match(/(\d+\.\d+)/);
                    if (match && match[1]) {
                        ratio = parseFloat(match[1]);
                        console.log(`[${source}] Found OEX Ratio via full page text search: ${ratio}`);
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