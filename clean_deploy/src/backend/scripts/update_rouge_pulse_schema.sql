-- Migration pour ajouter les nouvelles colonnes à la table rouge_pulse_analyses
-- Script pour supporter les données S&P 500 et niveaux techniques

-- Ajouter la colonne pour le prix S&P 500
ALTER TABLE rouge_pulse_analyses
ADD COLUMN IF NOT EXISTS sp500_price DECIMAL(10, 2) COMMENT 'Prix actuel du S&P 500 au moment de l\'analyse';

-- Ajouter la colonne pour les niveaux techniques (JSON)
ALTER TABLE rouge_pulse_analyses
ADD COLUMN IF NOT EXISTS technical_levels JSONB COMMENT 'Niveaux techniques supports/résistances avec edge scores';

-- Créer un index pour optimiser les requêtes sur les niveaux techniques
CREATE INDEX IF NOT EXISTS idx_rouge_pulse_technical_levels
ON rouge_pulse_analyses USING GIN (technical_levels);

-- Créer un index pour optimiser les requêtes sur le prix S&P 500
CREATE INDEX IF NOT EXISTS idx_rouge_pulse_sp500_price
ON rouge_pulse_analyses (sp500_price);

-- Ajouter des colonnes pour le bot signal (facultatif pour futures améliorations)
ALTER TABLE rouge_pulse_analyses
ADD COLUMN IF NOT EXISTS bot_action VARCHAR(20) COMMENT 'Action du bot: LONG/SHORT/WAIT',
ADD COLUMN IF NOT EXISTS bot_confidence INTEGER CHECK (bot_confidence >= 0 AND bot_confidence <= 100) COMMENT 'Score de confiance du bot 0-100',
ADD COLUMN IF NOT EXISTS market_regime VARCHAR(30) COMMENT 'Régime de marché: TRENDING_UP/DOWN/RANGING/VOLATILE',
ADD COLUMN IF NOT EXISTS sentiment_score INTEGER CHECK (sentiment_score >= -100 AND sentiment_score <= 100) COMMENT 'Score de sentiment -100 à 100';

-- Ajouter colonne pour la communication inter-agents
ALTER TABLE rouge_pulse_analyses
ADD COLUMN IF NOT EXISTS agent_message TEXT COMMENT 'Message pour les autres agents';

-- Vérifier la structure de la table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'rouge_pulse_analyses'
ORDER BY ordinal_position;

-- Message de confirmation
SELECT 'Migration rouge_pulse_analyses terminée avec succès!' as status;