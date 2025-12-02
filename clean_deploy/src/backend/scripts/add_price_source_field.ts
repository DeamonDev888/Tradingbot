import { Pool } from 'pg';

async function addPriceSourceField() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const client = await pool.connect();
  try {
    console.log('🔧 Ajout du champ price_source à la table rouge_pulse_analyses...');

    // Vérifier si la colonne existe déjà
    const checkResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'rouge_pulse_analyses'
      AND column_name = 'price_source'
    `);

    if (checkResult.rows.length === 0) {
      // Ajouter la colonne si elle n'existe pas
      await client.query(`
        ALTER TABLE rouge_pulse_analyses
        ADD COLUMN price_source VARCHAR(255)
      `);
      console.log('✅ Champ price_source ajouté avec succès !');
    } else {
      console.log('ℹ️  Le champ price_source existe déjà');
    }

    // Afficher la structure mise à jour
    const structureResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'rouge_pulse_analyses'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Structure mise à jour de la table:');
    console.log('='.repeat(80));

    structureResult.rows.forEach((row, index) => {
      const nullable = row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      console.log(
        `${index + 1}. ${row.column_name.padEnd(20)} | ${row.data_type.padEnd(15)} | ${nullable}`
      );
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout du champ:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Exécuter la migration
if (require.main === module) {
  addPriceSourceField()
    .then(() => {
      console.log('\n🎉 Migration terminée avec succès !');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Migration échouée:', error);
      process.exit(1);
    });
}

export { addPriceSourceField };
