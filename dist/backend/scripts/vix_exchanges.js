import WebSocket from 'ws';
import { EventEmitter } from 'events';
export class SierraChartExchangeClient extends EventEmitter {
    ws = null;
    isConnected = false;
    isAuthenticated = false;
    constructor() {
        super();
    }
    async connect() {
        return new Promise((resolve, reject) => {
            try {
                console.log('🔌 Connexion à Sierra Chart Exchanges sur ws://localhost:11099');
                this.ws = new WebSocket('ws://localhost:11099');
                this.ws.on('open', () => {
                    console.log('✅ WebSocket connecté');
                    this.isConnected = true;
                    this.authenticate();
                    resolve();
                });
                this.ws.on('message', (data) => {
                    this.handleMessage(data);
                });
                this.ws.on('error', (error) => {
                    console.error('❌ Erreur WebSocket:', error.message);
                    this.emit('error', error);
                    reject(error);
                });
                this.ws.on('close', () => {
                    console.log('🔌 WebSocket fermé');
                    this.isConnected = false;
                    this.isAuthenticated = false;
                    this.emit('disconnected');
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    authenticate() {
        const authMessage = {
            Type: 1,
            Username: 'DEMO',
            Password: 'DEMO',
            ProtocolVersion: 8,
        };
        this.sendMessage(authMessage);
        console.log('🔐 Authentification envoyée');
    }
    sendMessage(message) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN)
            return;
        const messageStr = JSON.stringify(message) + '\0';
        this.ws.send(messageStr);
    }
    handleMessage(data) {
        try {
            const messages = data
                .toString('utf8')
                .split('\0')
                .filter(msg => msg.trim());
            for (const msgStr of messages) {
                if (msgStr.trim()) {
                    const message = JSON.parse(msgStr);
                    this.processMessage(message);
                }
            }
        }
        catch (error) {
            console.error('❌ Erreur traitement message:', error);
        }
    }
    processMessage(message) {
        switch (message.Type) {
            case 2: // LOGON_RESPONSE
                if (message.Result === 1) {
                    console.log('✅ Authentifié');
                    this.isAuthenticated = true;
                    this.emit('authenticated');
                    setTimeout(() => this.subscribeToExchanges(), 1000);
                }
                break;
            case 3001: // MARKET_DATA
                this.handleMarketData(message);
                break;
            case 11: // MARKET_DATA_REJECT
                console.log(`❌ Symbol rejeté: ${message.Symbol} - ${message.RejectText}`);
                break;
            case 3: // HEARTBEAT
                // Silencieux
                break;
        }
    }
    handleMarketData(message) {
        const cryptoData = {
            symbol: message.Symbol || 'UNKNOWN',
            exchange: this.detectExchange(message.Symbol),
            lastPrice: parseFloat(message.LastPrice) || parseFloat(message.Price) || 0,
            bid: parseFloat(message.Bid) || 0,
            ask: parseFloat(message.Ask) || 0,
            volume: parseInt(message.TotalVolume) || 0,
            timestamp: new Date(message.Timestamp || Date.now()),
            change: parseFloat(message.Change) || 0,
            changePercent: parseFloat(message.ChangePercent) || 0,
        };
        if (cryptoData.lastPrice > 0) {
            const exchangeIcon = this.getExchangeIcon(cryptoData.exchange);
            console.log(`${exchangeIcon} ${cryptoData.symbol}:`);
            console.log(`   💰 Prix: ${cryptoData.lastPrice.toLocaleString()}`);
            console.log(`   📈 Var: ${cryptoData.changePercent >= 0 ? '+' : ''}${cryptoData.changePercent.toFixed(4)}%`);
            console.log(`   📊 Volume: ${cryptoData.volume.toLocaleString()}`);
            console.log(`   ⏰ ${cryptoData.timestamp.toLocaleString()}`);
            console.log('   ' + '─'.repeat(50));
            this.emit('cryptoData', cryptoData);
        }
    }
    detectExchange(symbol) {
        if (symbol.includes('BINANCE'))
            return 'Binance';
        if (symbol.includes('BMEX'))
            return 'BitMEX';
        if (symbol.includes('XBT') || symbol.includes('BTC'))
            return 'BitMEX';
        if (symbol.includes('USDT'))
            return 'Binance';
        return 'Unknown';
    }
    getExchangeIcon(exchange) {
        switch (exchange) {
            case 'Binance':
                return '🟡';
            case 'BitMEX':
                return '🔴';
            default:
                return '📊';
        }
    }
    subscribeToExchanges() {
        console.log('\n🚀 Abonnement aux exchanges crypto...');
        // Symboles BitMEX
        const bitmexSymbols = [
            { symbol: 'BTCUSD', description: 'BTC/USD Perpetual (BitMEX)' },
            { symbol: 'ETHUSD', description: 'ETH/USD Perpetual (BitMEX)' },
            { symbol: 'XBTUSD', description: 'XBT/USD Perpetual (BitMEX)' },
        ];
        // Symboles Binance
        const binanceSymbols = [
            { symbol: 'BTCUSDT', description: 'BTC/USDT Spot (Binance)' },
            { symbol: 'BTCUSDT_PERP', description: 'BTC/USDT Perpetual (Binance)' },
            { symbol: 'ETHUSDT', description: 'ETH/USDT Spot (Binance)' },
            { symbol: 'ETHUSDT_PERP', description: 'ETH/USDT Perpetual (Binance)' },
        ];
        console.log('\n🔴 BitMEX:');
        bitmexSymbols.forEach((item, index) => {
            setTimeout(() => {
                console.log(`   📊 ${item.description}`);
                this.subscribeToSymbol(item.symbol);
                this.requestSnapshot(item.symbol);
            }, index * 300);
        });
        setTimeout(() => {
            console.log('\n🟡 Binance:');
            binanceSymbols.forEach((item, index) => {
                setTimeout(() => {
                    console.log(`   📊 ${item.description}`);
                    this.subscribeToSymbol(item.symbol);
                    this.requestSnapshot(item.symbol);
                }, index * 300);
            });
        }, bitmexSymbols.length * 300 + 500);
    }
    subscribeToSymbol(symbol) {
        const message = {
            Type: 2002, // SUBSCRIBE_TO_SYMBOL
            Symbol: symbol,
            Exchange: '',
            RequestID: Date.now() + Math.random(),
        };
        this.sendMessage(message);
    }
    requestSnapshot(symbol) {
        const message = {
            Type: 2003, // REQUEST_MARKET_DATA
            Symbol: symbol,
            Exchange: '',
            RequestID: Date.now() + Math.random(),
        };
        this.sendMessage(message);
    }
    /**
     * Obtenir rapidement le prix d'un symbole
     */
    async getPrice(symbol) {
        return new Promise((resolve, reject) => {
            if (!this.isAuthenticated) {
                reject(new Error('Pas authentifié'));
                return;
            }
            const timeout = setTimeout(() => {
                this.removeListener('cryptoData', onData);
                resolve(null);
            }, 5000);
            const onData = (data) => {
                if (data.symbol === symbol || data.symbol.includes(symbol)) {
                    clearTimeout(timeout);
                    this.removeListener('cryptoData', onData);
                    resolve(data.lastPrice);
                }
            };
            this.on('cryptoData', onData);
            this.requestSnapshot(symbol);
        });
    }
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
        this.isAuthenticated = false;
        console.log('🔌 Déconnexion');
    }
}
async function main() {
    const client = new SierraChartExchangeClient();
    client.on('authenticated', () => {
        console.log('🎉 Connecté aux exchanges crypto !\n');
    });
    client.on('cryptoData', (_data) => {
        // Éviter le double affichage (déjà géré dans handleMarketData)
    });
    client.on('error', (error) => {
        console.error('❌ Erreur:', error.message);
    });
    try {
        await client.connect();
        // Exemple: obtenir le prix BTC après 5 secondes
        setTimeout(async () => {
            console.log('\n🎯 Test rapide de récupération prix...');
            const btcPrice = await client.getPrice('BTCUSD');
            if (btcPrice) {
                console.log(`💰 BTCUSD: ${btcPrice.toLocaleString()}`);
            }
            else {
                console.log('❌ Prix BTC non reçu');
            }
            const btcBinancePrice = await client.getPrice('BTCUSDT');
            if (btcBinancePrice) {
                console.log(`💰 BTCUSDT: ${btcBinancePrice.toLocaleString()}`);
            }
            else {
                console.log('❌ Prix BTCUSDT non reçu');
            }
        }, 5000);
        process.on('SIGINT', () => {
            console.log('\n👋 Arrêt...');
            client.disconnect();
            process.exit(0);
        });
        console.log('🚀 Client démarré. Surveillance des exchanges BitMEX et Binance...');
    }
    catch (error) {
        console.error('❌ Erreur fatale:', error);
        process.exit(1);
    }
}
export default SierraChartExchangeClient;
if (require.main === module) {
    main();
}
//# sourceMappingURL=vix_exchanges.js.map