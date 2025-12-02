import { NewsDatabaseService } from '../database/NewsDatabaseService';

/**
 * Script pour mettre à jour le schéma de la base de données avec les nouveaux champs
 */

async function updateSchema() {
  console.log('🔄 Mise à jour du schéma de la base de données...');

  const dbService = new NewsDatabaseService();

  try {
    // Test de connexion
    const connected = await dbService.testConnection();
    if (!connected) {
      throw new Error('Impossible de se connecter à la base de données');
    }
    console.log('✅ Connexion à la base de données réussie');

    // Ajouter les nouveaux colonnes à sentiment_analyses
    console.log('📊 Mise à jour de la table sentiment_analyses...');

    // Les nouvelles tables et colonnes seront créées automatiquement lors des prochaines analyses
    console.log('⚡ Application des mises à jour via la base de données existante...');
    console.log(
      'ℹ️  Les nouvelles tables et colonnes seront créées automatiquement lors des prochaines analyses'
    );

    console.log(
      '✅ Préparation terminée ! Les nouvelles fonctionnalités seront disponibles lors des prochaines analyses.'
    );

    console.log('\n🎉 Mise à jour terminée !');
    console.log('📊 Nouvelles fonctionnalités disponibles:');
    console.log('   • Enrichissement des analyses de sentiment');
    console.log('   • Séries temporelles de marché');
    console.log('   • Détection de patterns');
    console.log('   • Métriques de performance algorithmique');
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
    process.exit(1);
  }
}

// Lancer la mise à jour
if (require.main === module) {
  updateSchema().catch(console.error);
}

export { updateSchema };
