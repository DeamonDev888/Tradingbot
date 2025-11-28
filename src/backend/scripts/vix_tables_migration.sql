-- Migration pour les tables VIX manquantes
-- Exécuter avec: psql -h localhost -U postgres -d financial_analyst -f vix_tables_migration.sql

-- Extension pour UUID si nécessaire
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table pour stocker les données VIX brutes
CREATE TABLE IF NOT EXISTS vix_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(10) NOT NULL DEFAULT 'VIX',
    value DECIMAL(10,2) NOT NULL,
    change_abs DECIMAL(8,2),
    change_pct DECIMAL(8,2),
    previous_close DECIMAL(10,2),
    open DECIMAL(10,2),
    high DECIMAL(10,2),
    low DECIMAL(10,2),
    source VARCHAR(100) NOT NULL,
    last_update TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour stocker les analyses VIX complètes
CREATE TABLE IF NOT EXISTS vix_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_vix_data_symbol ON vix_data(symbol);
CREATE INDEX IF NOT EXISTS idx_vix_data_source ON vix_data(source);
CREATE INDEX IF NOT EXISTS idx_vix_data_created_at ON vix_data(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vix_data_last_update ON vix_data(last_update DESC);
CREATE INDEX IF NOT EXISTS idx_vix_analysis_created_at ON vix_analysis(created_at DESC);

-- Index GIN pour les requêtes JSONB sur vix_analysis
CREATE INDEX IF NOT EXISTS idx_vix_analysis_data_gin ON vix_analysis USING GIN (analysis_data);

-- Vue pour les dernières données VIX
CREATE OR REPLACE VIEW latest_vix_data AS
SELECT
    id,
    symbol,
    value,
    change_abs,
    change_pct,
    previous_close,
    open,
    high,
    low,
    source,
    last_update,
    created_at
FROM vix_data
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Vue pour consolidé les données VIX par source
CREATE OR REPLACE VIEW vix_data_by_source AS
SELECT
    source,
    COUNT(*) as data_count,
    AVG(value) as avg_value,
    MAX(value) as max_value,
    MIN(value) as min_value,
    MAX(created_at) as last_update
FROM vix_data
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY source
ORDER BY last_update DESC;

-- Commentaires pour la documentation
COMMENT ON TABLE vix_data IS 'Stocke les données brutes du VIX collectées depuis différentes sources (Yahoo, MarketWatch, Investing.com, etc.)';
COMMENT ON TABLE vix_analysis IS 'Stocke les analyses complètes générées par VixOmbreAgent avec KiloCode AI';
COMMENT ON VIEW latest_vix_data IS 'Vue pour les 7 derniers jours de données VIX';
COMMENT ON VIEW vix_data_by_source IS 'Vue pour les statistiques par source sur les dernières 24h';

-- Afficher un résumé de la création
DO $$
BEGIN
    RAISE NOTICE '✅ Migration VIX terminée:';
    RAISE NOTICE '   - Table vix_data créée avec succès';
    RAISE NOTICE '   - Table vix_analysis créée avec succès';
    RAISE NOTICE '   - Index optimisés créés';
    RAISE NOTICE '   - Views latest_vix_data et vix_data_by_source créées';
END $$;