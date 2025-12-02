const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'financial_analyst',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '9022',
});

async function testVixDataQuery() {
  try {
    console.log('🧪 Test de la requête VixOmbreAgent...');

    // La requête exacte utilisée par VixOmbreAgent
    const vixDataQuery = `
      SELECT
        source,
        value,
        change_abs,
        change_pct,
        previous_close,
        open,
        high,
        low,
        last_update,
        created_at
      FROM vix_data
      WHERE created_at >= NOW() - INTERVAL '2 hours'
      ORDER BY created_at DESC
      LIMIT 10
    `;

    console.log('\n📝 Requête SQL:');
    console.log(vixDataQuery);

    try {
      const result = await pool.query(vixDataQuery);
      console.log(`\n✅ Succès: ${result.rows.length} enregistrements trouvés`);

      result.rows.forEach((row, i) => {
        console.log(
          `   [${i + 1}] ${row.source}: ${row.value} (change: ${row.change_abs || 'NULL'}, pct: ${row.change_pct || 'NULL'})`
        );
      });
    } catch (error) {
      console.error('\n❌ Erreur SQL:', error.message);
      console.error('Code:', error.code);
      console.error('Position:', error.position);
      console.error('Column:', error.column);
    }

    // Test alternatif: seulement les colonnes qui existent sûrement
    console.log('\n🔄 Test avec colonnes minimales...');
    const minimalQuery = `
      SELECT
        source,
        value,
        created_at
      FROM vix_data
      ORDER BY created_at DESC
      LIMIT 5
    `;

    try {
      const minimalResult = await pool.query(minimalQuery);
      console.log(`\n✅ Requête minimale: ${minimalResult.rows.length} enregistrements`);

      minimalResult.rows.forEach((row, i) => {
        console.log(`   [${i + 1}] ${row.source}: ${row.value} (${row.created_at})`);
      });
    } catch (error) {
      console.error('\n❌ Erreur requête minimale:', error.message);
    }
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  } finally {
    await pool.end();
  }
}

testVixDataQuery();
