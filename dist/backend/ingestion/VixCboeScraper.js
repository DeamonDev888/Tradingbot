export class VixCboeScraper {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    /**
     * Scrape depuis CBOE (source officielle VIX)
     * Alternative fiable quand les sites web sont bloqués
     */
    async scrapeCboeVix() {
        console.log('[CBOE] Début du scraping VIX depuis source officielle...');
        try {
            // Utiliser l'API CBOE ou parsing HTML plus simple
            const response = await fetch('https://www.cboe.com/tradable-products/vix/', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    DNT: '1',
                    Connection: 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                },
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const html = await response.text();
            // Parsing simple du HTML pour trouver le prix VIX
            // Recherche de motifs comme "$ 16.35" ou "16.35" près de "VIX"
            // Le site affiche souvent "$ 16.35"
            let vixMatch = html.match(/\$\s*([0-9]+\.[0-9]+)/);
            // Fallback: chercher "VIX" suivi d'un nombre
            if (!vixMatch) {
                vixMatch = html.match(/VIX.*?([0-9]+\.[0-9]+)/i);
            }
            const changeMatch = html.match(/([-+]?[0-9]+\.[0-9]+)%/i);
            if (vixMatch) {
                const vixValue = parseFloat(vixMatch[1]);
                const changePct = changeMatch ? parseFloat(changeMatch[1]) : null;
                console.log(`[CBOE] ✅ Succès: VIX ${vixValue} (${changePct || 'N/A'}%)`);
                return {
                    source: 'CBOE Official',
                    value: vixValue,
                    change_abs: null,
                    change_pct: changePct,
                    last_update: new Date().toISOString(),
                };
            }
            else {
                throw new Error('VIX value not found in HTML');
            }
        }
        catch (error) {
            console.error('[CBOE] ❌ Erreur:', error instanceof Error ? error.message : error);
            return {
                source: 'CBOE Official',
                value: null,
                change_abs: null,
                change_pct: null,
                last_update: null,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Alternative: utiliser Alpha Vantage API si disponible
     */
    async scrapeAlphaVantage() {
        console.log('[AlphaVantage] Tentative API VIX...');
        try {
            // Note: Nécessite une clé API Alpha Vantage
            const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
            if (!apiKey) {
                throw new Error('Alpha Vantage API key not configured');
            }
            const response = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=VIX&interval=1min&apikey=${apiKey}`);
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            const data = await response.json();
            const timeSeries = data['Time Series (1min)'];
            if (timeSeries) {
                const latestTime = Object.keys(timeSeries)[0];
                const latestData = timeSeries[latestTime];
                const vixValue = parseFloat(latestData['4. close']);
                return {
                    source: 'Alpha Vantage API',
                    value: vixValue,
                    change_abs: null,
                    change_pct: null,
                    last_update: latestTime,
                };
            }
            else {
                throw new Error('No data returned from Alpha Vantage');
            }
        }
        catch (error) {
            console.error('[AlphaVantage] ❌ Erreur:', error instanceof Error ? error.message : error);
            return {
                source: 'Alpha Vantage API',
                value: null,
                change_abs: null,
                change_pct: null,
                last_update: null,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Sauvegarder les résultats en base de données
     */
    async saveToDatabase(results) {
        const client = await this.pool.connect();
        try {
            for (const result of results) {
                if (result.value !== null) {
                    await client.query(`INSERT INTO vix_data (source, value, change_abs, change_pct, scraped_at)
             VALUES ($1, $2, $3, $4, NOW())
             ON CONFLICT (source, DATE(scraped_at))
             DO UPDATE SET value = $2, change_abs = $3, change_pct = $4`, [result.source, result.value, result.change_abs, result.change_pct]);
                    console.log(`[CBOE] 💾 Sauvegardé: ${result.source} -> ${result.value}`);
                }
            }
        }
        finally {
            client.release();
        }
    }
}
//# sourceMappingURL=VixCboeScraper.js.map