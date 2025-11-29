import axios from 'axios';
export class BinanceScraper {
    baseUrl = 'https://api.binance.com/api/v3';
    targetSymbols = [
        'BTCUSDT',
        'ETHUSDT',
        'SOLUSDT',
        'BNBUSDT',
        'XRPUSDT',
        'ADAUSDT',
        'DOGEUSDT',
        'AVAXUSDT',
    ];
    constructor() { }
    /**
     * Fetch 24hr ticker data for target symbols
     */
    async fetchPrices() {
        try {
            console.log('📡 Fetching crypto prices from Binance...');
            const response = await axios.get(`${this.baseUrl}/ticker/24hr`);
            const allTickers = response.data;
            // Filter and map
            const relevantTickers = allTickers
                .filter((t) => this.targetSymbols.includes(t.symbol))
                .map((t) => ({
                symbol: t.symbol,
                price: parseFloat(t.lastPrice),
                change_24h: parseFloat(t.priceChangePercent),
                volume_24h: parseFloat(t.quoteVolume), // Volume in USDT
            }));
            console.log(`✅ Fetched ${relevantTickers.length} crypto prices.`);
            return relevantTickers;
        }
        catch (error) {
            console.error('❌ Error fetching from Binance:', error);
            return [];
        }
    }
    /**
     * Save prices to database
     */
    async saveToDatabase(pool, prices) {
        if (prices.length === 0)
            return;
        const client = await pool.connect();
        try {
            console.log(`💾 Saving ${prices.length} crypto prices to DB...`);
            for (const price of prices) {
                await client.query(`INSERT INTO crypto_prices (symbol, price, change_24h, volume_24h, source)
           VALUES ($1, $2, $3, $4, 'Binance')`, [price.symbol, price.price, price.change_24h, price.volume_24h]);
            }
            console.log('✅ Crypto prices saved successfully.');
        }
        catch (error) {
            console.error('❌ Error saving to DB:', error);
        }
        finally {
            client.release();
        }
    }
}
//# sourceMappingURL=BinanceScraper.js.map