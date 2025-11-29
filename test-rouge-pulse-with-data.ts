import { RougePulseAgent } from './src/backend/agents/RougePulseAgent';
import { NewsDatabaseService } from './src/backend/database/NewsDatabaseService';

async function testRougePulseAgentWithData() {
  console.log("🚀 Test de l'agent RougePulse avec données factices...");

  try {
    const dbService = new NewsDatabaseService();

    // Insérer quelques événements de test
    const testEvents = [
      {
        event_date: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2h dans le futur
        country: 'United States',
        event_name: 'FOMC Interest Rate Decision',
        importance: 3,
        actual: null,
        forecast: '5.25%',
        previous: '5.00%',
        currency: 'USD',
        source: 'TradingEconomics',
      },
      {
        event_date: new Date(Date.now() + 5 * 60 * 60 * 1000), // 5h dans le futur
        country: 'United States',
        event_name: 'Nonfarm Payrolls',
        importance: 3,
        actual: null,
        forecast: '200K',
        previous: '180K',
        currency: 'USD',
        source: 'TradingEconomics',
      },
      {
        event_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h dans le futur
        country: 'United States',
        event_name: 'Consumer Price Index (CPI)',
        importance: 3,
        actual: null,
        forecast: '3.2%',
        previous: '3.4%',
        currency: 'USD',
        source: 'TradingEconomics',
      },
      {
        event_date: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48h dans le futur
        country: 'United States',
        event_name: 'GDP Growth Rate',
        importance: 2,
        actual: null,
        forecast: '2.5%',
        previous: '2.1%',
        currency: 'USD',
        source: 'TradingEconomics',
      },
      {
        event_date: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72h dans le futur
        country: 'United States',
        event_name: 'Unemployment Rate',
        importance: 2,
        actual: null,
        forecast: '3.8%',
        previous: '3.9%',
        currency: 'USD',
        source: 'TradingEconomics',
      },
      {
        event_date: new Date(Date.now() + 96 * 60 * 60 * 1000), // 96h dans le futur
        country: 'United States',
        event_name: 'Retail Sales',
        importance: 1,
        actual: null,
        forecast: '0.5%',
        previous: '0.3%',
        currency: 'USD',
        source: 'TradingEconomics',
      },
    ];

    console.log('\n📝 Insertion des événements de test...');

    // Vérifier la connexion
    const connected = await dbService.testConnection();
    if (!connected) {
      console.log('❌ Pas de connexion à la base de données');
      return;
    }

    // Créer la table si elle n'existe pas
    const client = await (dbService as any).pool.connect();
    try {
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

      // Insérer les événements de test
      for (const event of testEvents) {
        try {
          await client.query(
            `
            INSERT INTO economic_events
            (event_date, country, event_name, importance, actual, forecast, previous, currency, source)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (event_date, country, event_name) DO NOTHING
          `,
            [
              event.event_date,
              event.country,
              event.event_name,
              event.importance,
              event.actual,
              event.forecast,
              event.previous,
              event.currency,
              event.source,
            ]
          );
          console.log(`✅ Événement ajouté: ${event.event_name}`);
        } catch (e) {
          console.error(`❌ Erreur lors de l'insertion de ${event.event_name}:`, e);
        }
      }

      console.log('\n🎯 Données de test insérées avec succès!');
    } finally {
      client.release();
    }

    // Maintenant tester l'agent
    const agent = new RougePulseAgent();
    const result = (await agent.analyzeMarketSentiment(false)) as any;

    console.log("\n✅ Résultat de l'analyse avec données:");
    console.log('='.repeat(50));

    if (result.error) {
      console.log('❌ Erreur:', result.error);
      console.log('Status:', result.status);
    } else {
      console.log('📊 Score de volatilité:', result.volatility_score || 'N/A');
      console.log('🔴 Événements critiques:', result.critical_count || 0);
      console.log('🔴 Impact fort:', result.high_count || 0);
      console.log('🟡 Impact moyen:', result.medium_count || 0);
      console.log('⚪ Impact faible:', result.low_count || 0);

      console.log('\n📅 Résumé stratégique:');
      console.log(result.summary);

      if (
        result.market_movers &&
        Array.isArray(result.market_movers) &&
        result.market_movers.length > 0
      ) {
        console.log('\n🔥 MARKET MOVERS (ceux qui changent vraiment le marché):');
        result.market_movers.forEach((mover: any, index: number) => {
          console.log(`${index + 1}. ${mover.event} - ${mover.time}`);
          console.log(`   Score: ${mover.impact_score} | Changement: ${mover.change}`);
          console.log(`   ${mover.market_expected_impact}`);
          console.log(`   Pourquoi c'est critique: ${mover.why_critical}`);
        });
      }

      if (
        result.critical_alerts &&
        Array.isArray(result.critical_alerts) &&
        result.critical_alerts.length > 0
      ) {
        console.log('\n🚨 ALERTES CRITIQUES:');
        result.critical_alerts.forEach((alert: any) => {
          console.log(`${alert.icon} ${alert.time} - ${alert.event}`);
          console.log(`   ${alert.market_impact}`);
          console.log(`   💡 ${alert.recommendation}`);
        });
      }

      // Afficher les événements par importance
      console.log('\n📈 ÉVÉNEMENTS PAR IMPORTANCE:');

      if (
        result.critical_events &&
        Array.isArray(result.critical_events) &&
        result.critical_events.length > 0
      ) {
        console.log('\n🔴 CRITIQUES (volatilité extrême attendue):');
        result.critical_events.forEach((e: any) => {
          console.log(`${e.time} - ${e.event}`);
          console.log(`   Score: ${e.importance_score} | ${e.impact_level}`);
          console.log(`   Prévision: ${e.forecast} | Précédent: ${e.previous}`);
          console.log(
            `   Changement: ${e.forecast_change} | Potentiel surprise: ${e.surprise_potential}`
          );
        });
      }

      if (
        result.high_impact_events &&
        Array.isArray(result.high_impact_events) &&
        result.high_impact_events.length > 0
      ) {
        console.log('\n🔴 FORT IMPACT:');
        result.high_impact_events.forEach((e: any) => {
          console.log(`${e.time} - ${e.event}`);
          console.log(`   Score: ${e.importance_score} | ${e.impact_level}`);
        });
      }
    }

    // Fermer les connexions
    await agent.close();
    await dbService.close();

    console.log('\n✅ Test complet terminé avec succès!');
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

testRougePulseAgentWithData();
