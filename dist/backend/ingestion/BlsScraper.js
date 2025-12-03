// Dynamic imports for playwright-extra (ES module compatibility)
let chromium;
let stealth;
export class BlsScraper {
    browser = null;
    constructor() {
        // No database connection needed - data is returned as NewsItem
    }
    async init() {
        if (!this.browser) {
            // Initialize chromium with stealth if not already done
            if (!chromium) {
                try {
                    const playwrightExtra = await import('playwright-extra');
                    const stealthPlugin = await import('puppeteer-extra-plugin-stealth');
                    chromium = playwrightExtra.chromium;
                    stealth = stealthPlugin.default;
                    chromium.use(stealth());
                }
                catch (error) {
                    console.warn('playwright-extra not available, using regular playwright');
                    chromium = (await import('playwright')).chromium;
                }
            }
            this.browser = await chromium.launch({
                headless: true,
                // channel: 'chrome',
                /* args: [
                  '--no-sandbox',
                  '--disable-setuid-sandbox',
                  '--disable-dev-shm-usage',
                  '--disable-accelerated-2d-canvas',
                  '--no-first-run',
                  '--no-zygote',
                  '--disable-gpu',
                  '--disable-blink-features=AutomationControlled',
                ], */
                // proxy: process.env.PROXY_URL ? { server: process.env.PROXY_URL } : undefined,
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
        // Simulate human behavior / Stealth evasions
        await page.addInitScript(() => {
            // Browser globals are available in page context
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
            window.chrome = { runtime: {} };
            Object.defineProperty(navigator, 'permissions', {
                get: () => ({
                    query: () => Promise.resolve({ state: 'granted' }),
                }),
            });
        });
        return page;
    }
    async humanDelay(page, min = 1000, max = 3000) {
        const delay = Math.random() * (max - min) + min;
        await page.waitForTimeout(delay);
    }
    parseDate(dateStr) {
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                console.warn(`Invalid date string: "${dateStr}", using current date.`);
                return new Date().toISOString();
            }
            return date.toISOString();
        }
        catch (e) {
            console.warn(`Error parsing date "${dateStr}":`, e);
            return new Date().toISOString();
        }
    }
    async scrapeLatestNumbers() {
        await this.init();
        const page = await this.createStealthPage();
        const results = [];
        try {
            console.log('Navigating to BLS.gov...');
            await page.goto('https://www.bls.gov/', { waitUntil: 'domcontentloaded', timeout: 60000 });
            await this.humanDelay(page, 2000, 4000);
            // 1. Scrape "Latest Numbers" Box
            console.log('Extracting Latest Numbers...');
            const latestItems = await page.locator('#latest-numbers p').all();
            for (const item of latestItems) {
                try {
                    const titleEl = item.locator('a').first();
                    const dataEl = item.locator('.data').first();
                    if ((await titleEl.isVisible()) && (await dataEl.isVisible())) {
                        const title = (await titleEl.textContent())?.trim() || '';
                        const valueText = (await dataEl.textContent())?.trim() || '';
                        // valueText is like "+0.3% in Sep 2025"
                        // Split into value and period
                        const parts = valueText.split(' in ');
                        const value = parts[0]?.trim() || valueText;
                        const period = parts.length > 1 ? parts[1].trim() : 'Recent';
                        if (title) {
                            console.log(`Latest Number: ${title} = ${value} (${period})`);
                            results.push({
                                event_name: title.replace(/:$/, ''), // Remove trailing colon
                                value: value,
                                reference_period: period,
                                release_date: new Date().toISOString(), // We assume "Latest" implies current relevance
                                change: value, // Often the value itself is the change (e.g. +0.3%)
                            });
                        }
                    }
                }
                catch (e) {
                    console.error('Error parsing latest number item:', e);
                }
            }
            // 2. Scrape Monthly Labor Review (MLR) Highlights if available on homepage
            // Usually in a "Monthly Labor Review" section or similar
            // If not, we can navigate to the MLR page separately.
            // For now, let's check for "Featured" articles on homepage which might be MLR
            const featuredArticles = await page.locator('.scrollable .items .item').all();
            for (const article of featuredArticles) {
                try {
                    const titleEl = article.locator('h4 a').first();
                    const summaryEl = article.locator('p').first();
                    if (await titleEl.isVisible()) {
                        const title = (await titleEl.textContent())?.trim() || '';
                        const summary = (await summaryEl.textContent())?.trim() || '';
                        if (title) {
                            console.log(`Featured Article: ${title}`);
                            results.push({
                                event_name: `[ARTICLE] ${title}`,
                                value: summary,
                                reference_period: 'Recent',
                                release_date: new Date().toISOString(),
                                change: 'N/A',
                            });
                        }
                    }
                }
                catch (e) {
                    // Ignore errors for individual articles
                }
            }
        }
        catch (error) {
            console.error('Error scraping BLS Homepage:', error);
        }
        finally {
            await page.close();
        }
        // 3. Scrape Regional Data (Separate Page)
        try {
            const regionPage = await this.createStealthPage();
            console.log('Navigating to BLS Regions...');
            await regionPage.goto('https://www.bls.gov/regions/home.htm', {
                waitUntil: 'domcontentloaded',
            });
            // Look for regional news releases
            const regionReleases = await regionPage.locator('.region-news-release li a').all();
            // Limit to first 5 to avoid spamming
            for (let i = 0; i < Math.min(regionReleases.length, 5); i++) {
                const title = (await regionReleases[i].textContent())?.trim();
                if (title) {
                    results.push({
                        event_name: `[REGIONAL] ${title}`,
                        value: 'See BLS website for details',
                        reference_period: 'Recent',
                        release_date: new Date().toISOString(),
                        change: 'N/A',
                    });
                }
            }
            await regionPage.close();
        }
        catch (e) {
            console.error('Error scraping BLS Regions:', e);
        }
        // 4. Scrape Employment Projections (Separate Page)
        try {
            const empPage = await this.createStealthPage();
            console.log('Navigating to BLS Projections...');
            await empPage.goto('https://www.bls.gov/emp/', { waitUntil: 'domcontentloaded' });
            // Look for latest release or featured content
            const featured = empPage.locator('#bodytext h3, #bodytext h4').first();
            if (await featured.isVisible()) {
                const title = (await featured.textContent())?.trim();
                if (title) {
                    results.push({
                        event_name: `[PROJECTIONS] ${title}`,
                        value: 'Updated Projections Available',
                        reference_period: '2024-2034',
                        release_date: new Date().toISOString(),
                        change: 'N/A',
                    });
                }
            }
            await empPage.close();
        }
        catch (e) {
            console.error('Error scraping BLS Projections:', e);
        }
        return results;
    }
}
//# sourceMappingURL=BlsScraper.js.map