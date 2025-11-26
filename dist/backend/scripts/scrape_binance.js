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
const BinanceScraper_1 = require("../ingestion/BinanceScraper");
const pg_1 = require("pg");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const pool = new pg_1.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'financial_analyst',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '9022',
});
async function main() {
    console.log('🚀 Starting Binance Crypto Scraper...');
    const scraper = new BinanceScraper_1.BinanceScraper();
    try {
        // 1. Fetch
        const prices = await scraper.fetchPrices();
        // 2. Display
        console.log('\n📊 Current Crypto Prices:');
        prices.forEach(p => {
            const icon = p.change_24h >= 0 ? '🟢' : '🔴';
            console.log(`${icon} ${p.symbol.padEnd(10)} $${p.price.toFixed(2)} (${p.change_24h.toFixed(2)}%)`);
        });
        // 3. Save
        if (prices.length > 0) {
            await scraper.saveToDatabase(pool, prices);
        }
        console.log('\n✅ Process completed.');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
    finally {
        await pool.end();
    }
}
main();
