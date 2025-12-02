import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';
import { EventEmitter } from 'events';

const DATA_PATH = 'C:\\SierraChart\\Data\\';

// Configuration PostgreSQL
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'financial_analyst',
  user: 'postgres',
  password: '9022',
});

interface MarketData {
  symbol: string;
  assetType: 'CRYPTO' | 'VIX' | 'INDEX';
  lastPrice: number;
  change: number;
  changePercent: number;
  volume?: number;
  timestamp: Date;
  source: string;
}

class UnifiedMarketDataCollector extends EventEmitter {
  private isRunning = false;
  private dbInitialized = false;

  constructor() {
    super();
  }

  private async initializeDatabase() {
    try {
      // Table unifiée pour toutes les données de marché
      const createMarketDataTable = `
                CREATE TABLE IF NOT EXISTS market_data (
                    id SERIAL PRIMARY KEY,
                    symbol VARCHAR(20) NOT NULL,
                    asset_type VARCHAR(10) NOT NULL CHECK (asset_type IN ('CRYPTO', 'VIX', 'INDEX')),
                    price DECIMAL(15,8) NOT NULL,
                    change DECIMAL(15,8),
                    change_percent DECIMAL(8,2),
                    volume BIGINT,
                    source VARCHAR(100),
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE INDEX IF NOT EXISTS idx_market_symbol ON market_data(symbol);
                CREATE INDEX IF NOT EXISTS idx_market_asset_type ON market_data(asset_type);
                CREATE INDEX IF NOT EXISTS idx_market_timestamp ON market_data(timestamp);
                CREATE INDEX IF NOT EXISTS idx_market_composite ON market_data(symbol, asset_type, timestamp);
            `;

      await pool.query(createMarketDataTable);
      console.log('✅ Base de données unifiée initialisée');

      // Vue pour les dernières données
      const createLatestView = `
                CREATE OR REPLACE VIEW latest_market_data AS
                SELECT DISTINCT ON (symbol)
                    symbol, asset_type, price, change, change_percent, volume, source, timestamp
                FROM market_data
                ORDER BY symbol, timestamp DESC;
            `;

      await pool.query(createLatestView);
      console.log('✅ Vue des dernières données créée');
      this.dbInitialized = true;
      console.log('✅ Base de données prête pour les données');
    } catch (error: any) {
      console.error("❌ Erreur d'initialisation:", error.message);
    }
  }

  private collectCryptoData(): MarketData[] {
    const cryptoFiles = fs
      .readdirSync(DATA_PATH)
      .filter(
        file =>
          file.includes('BTC') ||
          file.includes('ETH') ||
          file.includes('XBT') ||
          file.includes('DOGE') ||
          file.includes('SOL') ||
          file.toLowerCase().includes('crypto')
      )
      .filter(file => file.endsWith('.scid') || file.endsWith('.dly'));

    const cryptoData: MarketData[] = [];

    cryptoFiles.forEach(file => {
      const stats = fs.statSync(path.join(DATA_PATH, file));
      if (Date.now() - stats.mtime.getTime() < 300000) {
        // Fichier récent (< 5 min)
        // TODO: Implémenter un vrai lecteur binaire SCID/DLY ici
        // Pour l'instant, on ne retourne RIEN pour éviter toute simulation.
        // On log juste qu'on a vu le fichier.
        console.log(
          `📁 Fichier détecté: ${file} (Données réelles disponibles mais lecteur non implémenté)`
        );
      }
    });

    return []; // Aucune donnée simulée
  }

  private collectVIXData(): MarketData | null {
    const vixSymbols = ['VIX.dly', 'VIX.scid', '.VIX.dly', '.VIX.scid', 'VX.dly', 'VX.scid'];

    for (const symbol of vixSymbols) {
      const filePath = path.join(DATA_PATH, symbol);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (Date.now() - stats.mtime.getTime() < 300000) {
          // TODO: Implémenter lecteur binaire
          console.log(`📁 Fichier VIX détecté: ${symbol}`);
          return null;
        }
      }
    }

    // Données de secours VIX - DESACTIVÉ POUR EVITER LA SIMULATION
    // Si aucun fichier n'est trouvé, on ne retourne rien.
    console.log(
      '⚠️ Aucune donnée VIX réelle trouvée (fichiers Sierra Chart manquants ou trop vieux)'
    );
    return null;
  }

  private async storeMarketData(data: MarketData): Promise<void> {
    if (!this.dbInitialized) {
      console.log(
        `⏸️  Base non prête - ${data.assetType} ${data.symbol}: ${data.lastPrice.toFixed(2)}$`
      );
      return;
    }

    try {
      const query = `
                INSERT INTO market_data
                (symbol, asset_type, price, change, change_percent, volume, source, timestamp)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id;
            `;

      const values = [
        data.symbol,
        data.assetType,
        data.lastPrice,
        data.change,
        data.changePercent,
        data.volume || null,
        data.source,
        data.timestamp,
      ];

      await pool.query(query, values);
      console.log(
        `💾 ${data.assetType} ${data.symbol}: ${data.lastPrice.toFixed(2)}$ (${data.changePercent >= 0 ? '+' : ''}${data.changePercent.toFixed(2)}%)`
      );
    } catch (error: any) {
      console.error(`❌ Erreur stockage ${data.symbol}:`, error.message);
    }
  }

  private async getMarketSummary(): Promise<void> {
    try {
      const query = `
                SELECT asset_type, COUNT(*) as count,
                       AVG(price) as avg_price,
                       AVG(CASE WHEN change_percent > 0 THEN change_percent ELSE 0 END) as avg_gain,
                       AVG(CASE WHEN change_percent < 0 THEN change_percent ELSE 0 END) as avg_loss
                FROM market_data
                WHERE timestamp > NOW() - INTERVAL '1 hour'
                GROUP BY asset_type;
            `;

      const result = await pool.query(query);

      console.log('\n📊 Résumé marché (dernière heure):');
      result.rows.forEach(row => {
        const avgPrice = Number(row.avg_price);
        console.log(
          `   ${row.asset_type}: ${row.count} actifs, prix moyen: ${!isNaN(avgPrice) ? avgPrice.toFixed(2) : 'N/A'}$`
        );
      });

      // Dernières données par actif
      const latestQuery = `
                SELECT DISTINCT ON (symbol)
                    symbol, asset_type, price, change_percent, source, timestamp
                FROM market_data
                ORDER BY symbol, timestamp DESC
                LIMIT 10;
            `;

      const latestResult = await pool.query(latestQuery);

      console.log('\n📈 Derniers prix:');
      latestResult.rows.forEach(row => {
        const price = Number(row.price);
        const changePercent = Number(row.change_percent);
        const change = changePercent >= 0 ? '+' : '';
        console.log(
          `   ${row.symbol} (${row.asset_type}): ${!isNaN(price) ? price.toFixed(2) : 'N/A'}$ (${change}${!isNaN(changePercent) ? changePercent.toFixed(2) : 'N/A'}%) - ${row.source}`
        );
      });
    } catch (error: any) {
      console.error('❌ Erreur résumé:', error.message);
    }
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('🚀 Démarrage du collecteur de données unifié...');

    // Initialiser la base de données d'abord
    await this.initializeDatabase();

    const collectAndStore = async () => {
      if (!this.isRunning) return;

      console.log(`\n${'='.repeat(60)}`);
      console.log(`⏰ ${new Date().toLocaleTimeString()} - Collecte des données`);

      // Collecter et stocker les données crypto
      this.collectCryptoData();
      console.log(
        'ℹ️ Aucune donnée Crypto disponible (fichiers manquants ou lecteur non implémenté)'
      );

      // Collecter et stocker les données VIX
      const vixData = this.collectVIXData();
      if (vixData) {
        console.log(`📈 Données VIX collectées`);
        await this.storeMarketData(vixData);
      } else {
        console.log('ℹ️ Aucune donnée VIX disponible');
      }

      // Afficher le résumé
      await this.getMarketSummary();
    };

    // Première collecte immédiate
    await collectAndStore();

    // Surveillance continue
    console.log('\n🔄 Surveillance continue (toutes les 60 secondes)...');
    console.log('💡 Configurez VIX dans Sierra Chart pour des données réelles');

    const interval = setInterval(collectAndStore, 60000);

    // Nettoyage à l'arrêt
    process.on('SIGINT', async () => {
      this.isRunning = false;
      clearInterval(interval);
      console.log('\n🛑 Arrêt du collecteur...');
      await this.stop();
      process.exit(0);
    });
  }

  public async stop(): Promise<void> {
    await pool.end();
    console.log('🔚 Connexion à la base fermée');
  }
}

// Démarrer le collecteur
const collector = new UnifiedMarketDataCollector();
collector.start().catch(console.error);

export { UnifiedMarketDataCollector, MarketData };
