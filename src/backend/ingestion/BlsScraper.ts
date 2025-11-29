import { Browser, Page } from 'playwright';
import { Pool } from 'pg';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium } = require('playwright-extra');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const stealth = require('puppeteer-extra-plugin-stealth');

// Add stealth plugin
chromium.use(stealth());

export interface BlsEvent {
  event_name: string;
  value: string;
  change?: string;
  reference_period: string;
  release_date: string;
}

export class BlsScraper {
  private browser: Browser | null = null;
  private pool: Pool;

  constructor() {
    // Initialize DB connection
    this.pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'financial_analyst',
      password: process.env.DB_PASSWORD || 'password',
      port: parseInt(process.env.DB_PORT || '5432'),
    });
  }

  async init(): Promise<void> {
    if (!this.browser) {
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

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    await this.pool.end();
  }

  private async createStealthPage(): Promise<Page> {
    if (!this.browser) throw new Error('Browser not initialized');

    const context = await this.browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Upgrade-Insecure-Requests': '1',
        Referer: 'https://www.google.com/',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      },
    });

    const page = await context.newPage();

    // Simulate human behavior / Stealth evasions
    await page.addInitScript(() => {
      // Browser globals are available in page context
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
      (window as any).chrome = { runtime: {} };
      Object.defineProperty(navigator, 'permissions', {
        get: () => ({
          query: () => Promise.resolve({ state: 'granted' }),
        }),
      });
    });

    return page;
  }

  private async humanDelay(page: Page, min = 1000, max = 3000): Promise<void> {
    const delay = Math.random() * (max - min) + min;
    await page.waitForTimeout(delay);
  }

  private parseDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date string: "${dateStr}", using current date.`);
        return new Date().toISOString();
      }
      return date.toISOString();
    } catch (e) {
      console.warn(`Error parsing date "${dateStr}":`, e);
      return new Date().toISOString();
    }
  }

  async scrapeLatestNumbers(): Promise<BlsEvent[]> {
    await this.init();
    // Use stealth page
    const page = await this.createStealthPage();
    const results: BlsEvent[] = [];

    try {
      console.log('Navigating to BLS.gov with stealth settings...');
      await page.goto('https://www.bls.gov/', {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      await this.humanDelay(page, 2000, 5000);

      // Debug: Save content to check if we are blocked or just have wrong selectors
      const fs = require('fs');
      await fs.promises.writeFile('bls_dump.html', await page.content());
      await page.screenshot({ path: 'bls_screenshot.png', fullPage: true });
      console.log('Saved debug dump to bls_dump.html and bls_screenshot.png');

      // Simulate some mouse movement
      await page.mouse.move(100, 100);
      await this.humanDelay(page, 500, 1000);
      await page.mouse.move(200, 200);

      console.log('Extracting Latest Numbers...');

      // Selector for the main featured release
      const featuredRelease = page.locator('#news-releases .nr-entry').first();
      if ((await featuredRelease.count()) > 0) {
        try {
          const titleEl = featuredRelease.locator('.heading a').first();
          const summaryEl = featuredRelease.locator('p').first();
          const dateMonth = await page.locator('.nr-calendar-date .nr-date-month').textContent();
          const dateDay = await page.locator('.nr-calendar-date .nr-date-day').textContent();

          if ((await titleEl.count()) > 0) {
            const title = (await titleEl.textContent())?.trim() || '';
            const summary = (await summaryEl.textContent())?.trim() || '';
            const dateStr = `${dateMonth?.trim()} ${dateDay?.trim()} ${new Date().getFullYear()}`;

            console.log(`Featured Release Found: ${title} (${dateStr})`);

            results.push({
              event_name: title,
              value: summary,
              reference_period: 'Recent',
              release_date: this.parseDate(dateStr),
              change: summary,
            });
          }
        } catch (e) {
          console.error('Error parsing featured release:', e);
        }
      }

      // Selector for the archive list
      const archiveItems = await page.locator('#nr-archive .heading').all();
      const archiveDates = await page.locator('#nr-archive .nr-archive-date').all();

      for (let i = 0; i < archiveItems.length; i++) {
        try {
          const titleEl = archiveItems[i].locator('a').first();
          // Ensure we have a matching date element
          if (i >= archiveDates.length) break;
          const dateEl = archiveDates[i];

          if ((await titleEl.count()) > 0) {
            const title = (await titleEl.textContent())?.trim() || '';
            const dateStr = (await dateEl.textContent())?.trim() || '';

            console.log(`Archive Release Found: ${title} (${dateStr})`);

            results.push({
              event_name: title,
              value: title,
              reference_period: 'Recent',
              release_date: this.parseDate(dateStr),
              change: title,
            });
          }
        } catch (e) {
          console.error(`Error parsing archive item ${i}:`, e);
        }
      }

      console.log(`Extracted ${results.length} events.`);
    } catch (error) {
      console.error('Error scraping BLS:', error);
    } finally {
      if (page) await page.close();
      if (this.browser) await this.browser.close();
      this.browser = null;
    }

    return results;
  }

  async saveToDatabase(events: BlsEvent[]): Promise<void> {
    if (events.length === 0) return;

    console.log(`Saving ${events.length} events to database...`);
    let client;
    try {
      console.log('Connecting to database...');
      client = await this.pool.connect();
      console.log('Connected to database.');
    } catch (e) {
      console.error('Failed to connect to database:', e);
      throw e;
    }

    try {
      console.log('Starting transaction...');
      await client.query('BEGIN');
      console.log('Transaction started.');

      for (const event of events) {
        // Map to economic_events table
        // event_date, country, event_name, importance, actual, forecast, previous, currency, source

        // We need to parse the value to get 'actual'.
        // BLS values often come as "+0.2%" or "3.9%".

        try {
          console.log(`Inserting event: ${event.event_name}`);
          await client.query(
            `INSERT INTO economic_events 
            (event_date, country, event_name, actual, source, importance, currency)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (event_date, country, event_name) 
            DO UPDATE SET actual = EXCLUDED.actual, created_at = NOW()`,
            [
              event.release_date ? new Date(event.release_date) : new Date(),
              'United States',
              event.event_name,
              event.value,
              'BLS',
              3, // High importance for BLS data usually
              'USD',
            ]
          );
          console.log('Event inserted.');
        } catch (insertError) {
          console.error(`Failed to insert event: ${event.event_name}`, insertError);
          // Continue with other events
        }
      }

      console.log('Committing transaction...');
      await client.query('COMMIT');
      console.log('Data saved successfully.');
    } catch (e) {
      console.log('Rolling back transaction...');
      await client.query('ROLLBACK');
      console.error('Error saving to database (Transaction Rollback):', e);
      throw e;
    } finally {
      console.log('Releasing client...');
      client.release();
      console.log('Client released.');
    }
  }
}
