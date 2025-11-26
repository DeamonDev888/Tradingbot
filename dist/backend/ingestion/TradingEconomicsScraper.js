"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradingEconomicsScraper = void 0;
const playwright_1 = require("playwright");
const pg_1 = require("pg");
const dotenv = __importStar(require("dotenv"));
const fs = __importStar(require("fs"));
dotenv.config();
class TradingEconomicsScraper {
    pool;
    constructor() {
        this.pool = new pg_1.Pool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'financial_analyst',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '9022',
        });
    }
    async scrapeUSCalendar() {
        const log = (msg) => {
            console.log(msg);
            try {
                fs.appendFileSync('scraper_debug.log', msg + '\n');
            }
            catch (_e) {
                // Ignore file write errors
            }
        };
        log('🚀 Starting TradingEconomics US Calendar Scraper...');
        const browser = await playwright_1.chromium.launch({ headless: true });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        });
        const page = await context.newPage();
        try {
            // Navigate to the US calendar
            const url = 'https://tradingeconomics.com/united-states/calendar';
            log(`🌐 Navigating to: ${url}`);
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
            // Wait for the table to load
            await page.waitForSelector('#calendar', { timeout: 30000 });
            const events = [];
            // Select all rows in the calendar table
            const rows = await page.$$('table#calendar > tbody > tr');
            let currentDate = null;
            log(`📊 Found ${rows.length} rows in the calendar table.`);
            for (const row of rows) {
                // Try to get date from the first TD class (e.g., " 2025-11-24")
                const firstTdClass = await row.$eval('td', el => el.className).catch(() => '');
                const dateMatch = firstTdClass.match(/(\d{4}-\d{2}-\d{2})/);
                if (dateMatch) {
                    currentDate = dateMatch[1]; // Found a date in this row
                }
                // On the country-specific page, we assume United States.
                const country = 'United States';
                // Check if it's a valid event row by looking for the event name link
                const eventLink = await row.$('a.calendar-event');
                if (!eventLink)
                    continue;
                // Time is usually in a span with class calendar-date-1, -2, or -3
                const time = await row
                    .$eval('span[class*="calendar-date"]', el => el.textContent?.trim() || '')
                    .catch(() => '');
                const eventName = await row
                    .$eval('a.calendar-event', el => el.textContent?.trim() || '')
                    .catch(() => '');
                // Importance might not be visible on this view, default to 0
                const importance = await row
                    .$$eval('span.sentiment-star', stars => stars.length)
                    .catch(() => 0);
                // IDs like #actual are repeated in the table (bad HTML but common), so we search inside the row
                const actual = await row
                    .$eval('[id*="actual"]', el => el.textContent?.trim() || '')
                    .catch(() => '');
                const forecast = await row
                    .$eval('[id*="forecast"]', el => el.textContent?.trim() || '')
                    .catch(() => '');
                const previous = await row
                    .$eval('[id*="previous"]', el => el.textContent?.trim() || '')
                    .catch(() => '');
                const currency = 'USD'; // We are on US page
                if (currentDate && eventName) {
                    // Construct a date object.
                    // currentDate is YYYY-MM-DD
                    // time is HH:MM AM/PM
                    const dateTimeStr = `${currentDate} ${time}`;
                    const eventDate = new Date(Date.parse(dateTimeStr));
                    // If date parsing fails (e.g. "Tentative"), handle it
                    const validDate = isNaN(eventDate.getTime()) ? new Date() : eventDate;
                    events.push({
                        date: validDate,
                        country,
                        event: eventName,
                        importance,
                        actual,
                        forecast,
                        previous,
                        currency,
                    });
                }
            }
            log(`✅ Scraped ${events.length} events successfully.`);
            return events;
        }
        catch (error) {
            log(`❌ Error scraping TradingEconomics: ${error}`);
            return [];
        }
        finally {
            await browser.close();
        }
    }
    async saveEvents(events) {
        if (events.length === 0)
            return;
        try {
            const client = await this.pool.connect();
            // Ensure table exists
            await client.query(`
        CREATE TABLE IF NOT EXISTS economic_events (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            event_date TIMESTAMP WITH TIME ZONE,
            country VARCHAR(100),
            event_name VARCHAR(500),
            importance INTEGER,
            actual VARCHAR(50),
            forecast VARCHAR(50),
            previous VARCHAR(50),
            currency VARCHAR(20),
            source VARCHAR(50) DEFAULT 'TradingEconomics',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(event_date, country, event_name)
        );
      `);
            let savedCount = 0;
            for (const event of events) {
                try {
                    await client.query(`
                INSERT INTO economic_events 
                (event_date, country, event_name, importance, actual, forecast, previous, currency)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (event_date, country, event_name) 
                DO UPDATE SET 
                    actual = EXCLUDED.actual,
                    forecast = EXCLUDED.forecast,
                    previous = EXCLUDED.previous,
                    importance = EXCLUDED.importance
            `, [
                        event.date,
                        event.country,
                        event.event,
                        event.importance,
                        event.actual,
                        event.forecast,
                        event.previous,
                        event.currency,
                    ]);
                    savedCount++;
                }
                catch (e) {
                    console.error(`Failed to save event ${event.event}:`, e);
                }
            }
            console.log(`💾 Saved/Updated ${savedCount} economic events in database.`);
            client.release();
        }
        catch (error) {
            console.error('❌ Database error:', error);
        }
    }
}
exports.TradingEconomicsScraper = TradingEconomicsScraper;
