import WebSocket from 'ws';
import { EventEmitter } from 'events';
export class SierraChartVIXClient extends EventEmitter {
    ws = null;
    config;
    isConnected = false;
    reconnectAttempts = 0;
    maxReconnectAttempts = 5;
    reconnectDelay = 5000;
    constructor(config) {
        super();
        this.config = {
            symbol: '.VIX', // Symbole VIX par défaut
            ...config,
        };
    }
    /**
     * Connexion au serveur Sierra Chart
     */
    async connect() {
        return new Promise((resolve, reject) => {
            try {
                const wsUrl = `ws://${this.config.host}:${this.config.port}`;
                console.log(`Connexion à Sierra Chart sur ${wsUrl}`);
                this.ws = new WebSocket(wsUrl);
                this.ws.on('open', () => {
                    console.log('Connecté à Sierra Chart');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.sendLoginRequest();
                    resolve();
                });
                this.ws.on('message', (data) => {
                    this.handleMessage(data);
                });
                this.ws.on('error', (error) => {
                    console.error('Erreur WebSocket:', error);
                    this.emit('error', error);
                    if (!this.isConnected) {
                        reject(error);
                    }
                });
                this.ws.on('close', () => {
                    console.log('Déconnecté de Sierra Chart');
                    this.isConnected = false;
                    this.emit('disconnected');
                    this.handleReconnect();
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /**
     * Envoie la requête de connexion/authentification
     */
    sendLoginRequest() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return;
        }
        // Construction du message DTC pour l'authentification
        const loginMessage = this.buildDTCMessage({
            Type: 'LOGIN',
            Username: this.config.username || '',
            Password: this.config.password || '',
            ProtocolVersion: '1.0',
        });
        this.ws.send(loginMessage);
        console.log('Requête de connexion envoyée');
    }
    /**
     * S'abonner aux données du VIX
     */
    subscribeToVIX() {
        if (!this.isConnected || !this.ws) {
            throw new Error('Pas connecté à Sierra Chart');
        }
        const subscribeMessage = this.buildDTCMessage({
            Type: 'SUBSCRIBE',
            Symbol: this.config.symbol,
            DataFormat: 'REALTIME',
        });
        this.ws.send(subscribeMessage);
        console.log(`Abonnement aux données ${this.config.symbol} envoyé`);
    }
    /**
     * Construction des messages au format DTC de Sierra Chart
     */
    buildDTCMessage(data) {
        // Format simplifié pour Sierra Chart DTC protocol
        const message = {
            ...data,
            Timestamp: Date.now(),
        };
        return JSON.stringify(message) + '\n';
    }
    /**
     * Traitement des messages reçus
     */
    handleMessage(data) {
        try {
            const messageStr = data.toString('utf8');
            const messages = messageStr.split('\n').filter(msg => msg.trim());
            for (const msgStr of messages) {
                const message = JSON.parse(msgStr);
                this.processMessage(message);
            }
        }
        catch (error) {
            console.error('Erreur traitement message:', error);
        }
    }
    /**
     * Traitement individuel des messages
     */
    processMessage(message) {
        switch (message.Type) {
            case 'LOGIN_RESPONSE':
                this.handleLoginResponse(message);
                break;
            case 'MARKET_DATA':
                this.handleMarketData(message);
                break;
            case 'ERROR':
                this.handleErrorResponse(message);
                break;
            default:
                console.log('Message non traité:', message.Type);
        }
    }
    /**
     * Gestion de la réponse de connexion
     */
    handleLoginResponse(message) {
        if (message.Result === 'SUCCESS') {
            console.log('Authentification réussie');
            this.emit('authenticated');
            // S'abonner automatiquement au VIX après connexion
            this.subscribeToVIX();
        }
        else {
            console.error('Échec authentification:', message.ErrorText);
            this.emit('authenticationError', message.ErrorText);
        }
    }
    /**
     * Gestion des données de marché
     */
    handleMarketData(message) {
        if (message.Symbol === this.config.symbol) {
            const vixData = {
                symbol: message.Symbol,
                lastPrice: parseFloat(message.LastPrice) || 0,
                bid: parseFloat(message.Bid) || 0,
                ask: parseFloat(message.Ask) || 0,
                volume: parseInt(message.Volume) || 0,
                timestamp: new Date(message.Timestamp || Date.now()),
                change: parseFloat(message.Change) || 0,
                changePercent: parseFloat(message.ChangePercent) || 0,
                open: parseFloat(message.Open) || 0,
                high: parseFloat(message.High) || 0,
                low: parseFloat(message.Low) || 0,
            };
            console.log(`VIX: ${vixData.lastPrice} (${vixData.changePercent >= 0 ? '+' : ''}${vixData.changePercent.toFixed(2)}%)`);
            this.emit('vixData', vixData);
        }
    }
    /**
     * Gestion des messages d'erreur
     */
    handleErrorResponse(message) {
        console.error('Erreur Sierra Chart:', message.ErrorText);
        this.emit('error', new Error(message.ErrorText));
    }
    /**
     * Gestion de la reconnexion automatique
     */
    async handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts} dans ${this.reconnectDelay}ms`);
            setTimeout(async () => {
                try {
                    await this.connect();
                }
                catch (error) {
                    console.error('Échec reconnexion:', error);
                }
            }, this.reconnectDelay);
        }
        else {
            console.error('Nombre maximal de tentatives de reconnexion atteint');
            this.emit('maxReconnectAttemptsReached');
        }
    }
    /**
     * Demander les données historiques du VIX
     */
    async requestHistoricalData(daysBack = 30) {
        if (!this.isConnected || !this.ws) {
            throw new Error('Pas connecté à Sierra Chart');
        }
        const historicalRequest = this.buildDTCMessage({
            Type: 'HISTORICAL_DATA_REQUEST',
            Symbol: this.config.symbol,
            DaysBack: daysBack,
            Interval: 'DAILY',
        });
        this.ws.send(historicalRequest);
        console.log(`Demande de données historiques VIX (${daysBack} jours) envoyée`);
    }
    /**
     * Déconnexion
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
        console.log('Déconnexion manuelle');
    }
    /**
     * Vérifier le statut de connexion
     */
    isReady() {
        return this.isConnected && this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }
}
/**
 * Fonction principale pour tester le client VIX
 */
async function main() {
    const config = {
        host: 'localhost',
        port: 11099,
        symbol: '.VIX', // ou 'VIX' selon la configuration de Sierra Chart
    };
    const vixClient = new SierraChartVIXClient(config);
    // Écouteurs d'événements
    vixClient.on('authenticated', () => {
        console.log('✅ Authentifié et abonné au VIX');
    });
    vixClient.on('vixData', (data) => {
        console.log(`📊 Données VIX reçues:
        Prix: ${data.lastPrice}
        Variation: ${data.changePercent.toFixed(2)}%
        Volume: ${data.volume}
        Bid/Ask: ${data.bid}/${data.ask}
        Haut/Bas: ${data.high}/${data.low}
        Timestamp: ${data.timestamp.toLocaleString()}`);
    });
    vixClient.on('error', (error) => {
        console.error('❌ Erreur:', error.message);
    });
    vixClient.on('disconnected', () => {
        console.log('🔌 Déconnecté');
    });
    try {
        // Connexion
        await vixClient.connect();
        // Demander les données historiques après connexion
        setTimeout(() => {
            vixClient.requestHistoricalData(7); // 7 derniers jours
        }, 2000);
        // Garder la connexion active
        process.on('SIGINT', () => {
            console.log('\nArrêt du client...');
            vixClient.disconnect();
            process.exit(0);
        });
    }
    catch (error) {
        console.error('Erreur lors de la connexion:', error);
        process.exit(1);
    }
}
// Export pour utilisation dans d'autres modules
export default SierraChartVIXClient;
// Exécuter le script si appelé directement
if (require.main === module) {
    main().catch(console.error);
}
//# sourceMappingURL=get_vix_data.js.map