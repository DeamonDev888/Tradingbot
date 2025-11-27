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
const playwright_1 = require("playwright");
const fs = __importStar(require("fs"));
async function dumpHtml() {
    const browser = await playwright_1.chromium.launch({
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
        catch (e) { }
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
