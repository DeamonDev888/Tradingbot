-- Financial Analyst Database Schema - Enhanced Version with Deduplication
-- Schema amélioré avec contraintes UNIQUE et validation

-- Extension pour UUID si nécessaire
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table pour stocker les news avec déduplication robuste
DROP TABLE IF EXISTS news_items CASCADE;

CREATE TABLE IF NOT EXISTS news_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_hash VARCHAR(64) UNIQUE NOT NULL, -- Hash SHA256 du titre normalisé
    url_hash VARCHAR(64) UNIQUE NOT NULL,  -- Hash SHA256 de l'URL normalisée
    title VARCHAR(1000) NOT NULL,
    url VARCHAR(2048) NOT NULL,
    source VARCHAR(100) NOT NULL,
    content TEXT,
    author VARCHAR(200),
    published_at TIMESTAMP WITH TIME ZONE,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sentiment VARCHAR(20) CHECK (sentiment IN ('bullish', 'bearish', 'neutral', NULL)),
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    keywords JSONB DEFAULT '[]',
    market_hours VARCHAR(20) CHECK (market_hours IN ('pre-market', 'market', 'after-hours', 'extended')),
    processing_status VARCHAR(20) DEFAULT 'raw' CHECK (processing_status IN ('raw', 'processed', 'analyzed')),
    duplicate_count INTEGER DEFAULT 1, -- Compteur de duplications détectées
    original_id UUID REFERENCES news_items(id), -- Référence à l'originale si doublon
    data_quality_score DECIMAL(3,2) CHECK (data_quality_score >= 0 AND data_quality_score <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Contraintes composites pour déduplication avancée
    UNIQUE(title_hash, published_at),  -- Éviter les doublons de même titre/heure
    UNIQUE(source, title_hash, DATE(published_at)),  -- Un titre unique par source/jour
    CHECK (published_at <= NOW() + INTERVAL '1 hour'),  -- Pas de dates dans le futur
    CHECK (LENGTH(TRIM(title)) >= 10),  -- Titre minimum 10 caractères
    CHECK (url ~ '^https?://')  -- URL doit être valide
);

-- Index optimisés pour la déduplication et performance
CREATE INDEX IF NOT EXISTS idx_news_items_title_hash ON news_items(title_hash);
CREATE INDEX IF NOT EXISTS idx_news_items_url_hash ON news_items(url_hash);
CREATE INDEX IF NOT EXISTS idx_news_items_published_at ON news_items(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_items_source ON news_items(source);
CREATE INDEX IF NOT EXISTS idx_news_items_sentiment ON news_items(sentiment);
CREATE INDEX IF NOT EXISTS idx_news_items_market_hours ON news_items(market_hours);
CREATE INDEX IF NOT EXISTS idx_news_items_processing_status ON news_items(processing_status);
CREATE INDEX IF NOT EXISTS idx_news_items_scraped_at ON news_items(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_items_created_at ON news_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_items_quality_score ON news_items(data_quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_news_items_duplicate_count ON news_items(duplicate_count DESC);

-- Index pour les recherches full-text
CREATE INDEX IF NOT EXISTS idx_news_items_title_fts ON news_items USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_news_items_content_fts ON news_items USING gin(to_tsvector('english', content));

-- Fonction pour générer des hashes normalisés
CREATE OR REPLACE FUNCTION normalize_and_hash(text_param TEXT, url_param TEXT)
RETURNS TABLE(title_hash VARCHAR(64), url_hash VARCHAR(64)) AS $$
BEGIN
    RETURN QUERY
    SELECT
        SHA256(LOWER(TRIM(REGEXP_REPLACE(text_param, '[^a-zA-Z0-9\s]', '', 'g')))) as title_hash,
        SHA256(REGEXP_REPLACE(LOWER(url_param), '[^a-zA-Z0-9\-_\.\/\:]', '', 'g')) as url_hash;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer le score de qualité d'une news
CREATE OR REPLACE FUNCTION calculate_news_quality_score(
    p_title TEXT,
    p_url TEXT,
    p_content TEXT,
    p_source TEXT,
    p_published_at TIMESTAMP WITH TIME ZONE
) RETURNS DECIMAL(3,2) AS $$
DECLARE
    score DECIMAL(3,2) := 1.0;
BEGIN
    -- Qualité du titre (40%)
    IF LENGTH(TRIM(p_title)) < 10 THEN score := score - 0.4; END IF;
    IF LENGTH(TRIM(p_title)) < 20 THEN score := score - 0.2; END IF;
    IF p_title ~ '[A-Z]{4,}' THEN score := score - 0.1; END IF; -- Trop de majuscules

    -- Qualité de l'URL (20%)
    IF p_url NOT ~ '^https?://[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,}' THEN score := score - 0.2; END IF;
    IF p_url ~ 'bit\.ly|tinyurl|t\.co' THEN score := score - 0.1; END IF; -- URL raccourcies

    -- Qualité du contenu (20%)
    IF p_content IS NOT NULL THEN
        IF LENGTH(TRIM(p_content)) < 50 THEN score := score - 0.1; END IF;
        IF p_content ~ '[A-Z]{4,}' THEN score := score - 0.05; END IF;
    END IF;

    -- Qualité de la source (10%)
    IF p_source IN ('ZeroHedge', 'CNBC', 'FinancialJuice', 'Finnhub', 'FRED') THEN
        score := score; -- Sources fiables
    ELSIF p_source IN ('Reddit', 'Twitter', 'Social Media') THEN
        score := score - 0.1; -- Sources moins fiables
    END IF;

    -- Fraîcheur (10%)
    IF p_published_at < NOW() - INTERVAL '7 days' THEN
        score := score - 0.1;
    ELSIF p_published_at > NOW() + INTERVAL '1 hour' THEN
        score := score - 0.5; -- Dates futures
    END IF;

    RETURN GREATEST(0, LEAST(1, score));
END;
$$ LANGUAGE plpgsql;

-- Trigger pour calculer automatiquement le score de qualité
CREATE OR REPLACE FUNCTION set_news_quality_score() RETURNS TRIGGER AS $$
BEGIN
    NEW.data_quality_score := calculate_news_quality_score(
        NEW.title,
        NEW.url,
        NEW.content,
        NEW.source,
        NEW.published_at
    );

    -- Calculer les hashes
    SELECT SHA256(LOWER(TRIM(REGEXP_REPLACE(NEW.title, '[^a-zA-Z0-9\s]', '', 'g')))),
           SHA256(REGEXP_REPLACE(LOWER(NEW.url), '[^a-zA-Z0-9\-_\.\/\:]', '', 'g'))
    INTO NEW.title_hash, NEW.url_hash;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_news_quality_score ON news_items;
CREATE TRIGGER trigger_set_news_quality_score
    BEFORE INSERT ON news_items
    FOR EACH ROW EXECUTE FUNCTION set_news_quality_score();

-- Fonction de déduplication intelligente
CREATE OR REPLACE FUNCTION smart_deduplicate_news() RETURNS INTEGER AS $$
DECLARE
    duplicates_count INTEGER := 0;
    merged_count INTEGER := 0;
BEGIN
    -- Marquer les doublons détectés
    UPDATE news_items n1 SET
        duplicate_count = subquery.duplicate_count,
        processing_status = 'duplicate'
    FROM (
        SELECT
            id,
            COUNT(*) OVER (PARTITION BY title_hash) as duplicate_count
        FROM news_items
        WHERE processing_status != 'duplicate'
    ) subquery
    WHERE n1.id = subquery.id AND subquery.duplicate_count > 1;

    GET DIAGNOSTICS duplicates_count = ROW_COUNT;

    -- Créer une vue des news uniques de haute qualité
    CREATE OR REPLACE VIEW high_quality_unique_news AS
    SELECT DISTINCT ON (title_hash) *
    FROM news_items
    WHERE processing_status != 'duplicate'
      AND data_quality_score >= 0.7
    ORDER BY title_hash, data_quality_score DESC, scraped_at DESC;

    -- Compter les items fusionnés
    SELECT COUNT(*) INTO merged_count
    FROM high_quality_unique_news;

    -- Nettoyer les doublons de faible qualité
    DELETE FROM news_items
    WHERE id NOT IN (SELECT id FROM high_quality_unique_news)
      AND processing_status = 'duplicate';

    RETURN duplicates_count;
END;
$$ LANGUAGE plpgsql;

-- Table pour le suivi des duplications
CREATE TABLE IF NOT EXISTS duplicate_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_hash VARCHAR(64) NOT NULL,
    source VARCHAR(100) NOT NULL,
    duplicate_count INTEGER DEFAULT 1,
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    action_taken VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_duplicate_tracking_title_hash ON duplicate_tracking(title_hash);
CREATE INDEX IF NOT EXISTS idx_duplicate_tracking_first_seen ON duplicate_tracking(first_seen DESC);

-- Fonction pour suivre les duplications
CREATE OR REPLACE FUNCTION track_duplicates() RETURNS VOID AS $$
BEGIN
    INSERT INTO duplicate_tracking (title_hash, source, duplicate_count)
    SELECT title_hash, source, COUNT(*)
    FROM news_items
    WHERE scraped_at >= NOW() - INTERVAL '24 hours'
      AND duplicate_count > 1
    GROUP BY title_hash, source
    ON CONFLICT (title_hash, source)
    DO UPDATE SET
        duplicate_count = EXCLUDED.duplicate_count,
        last_seen = NOW(),
        action_taken = 'tracked';
END;
$$ LANGUAGE plpgsql;

-- Table pour le suivi de la qualité des données
CREATE TABLE IF NOT EXISTS data_quality_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_news INTEGER DEFAULT 0,
    unique_news INTEGER DEFAULT 0,
    duplicate_news INTEGER DEFAULT 0,
    avg_quality_score DECIMAL(5,2) DEFAULT 0,
    high_quality_news INTEGER DEFAULT 0,  -- score >= 0.8
    medium_quality_news INTEGER DEFAULT 0, -- score >= 0.6 < 0.8
    low_quality_news INTEGER DEFAULT 0,   -- score < 0.6
    sources_active INTEGER DEFAULT 0,
    news_last_24h INTEGER DEFAULT 0,
    news_last_7d INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(metric_date)
);

CREATE INDEX IF NOT EXISTS idx_data_quality_metrics_date ON data_quality_metrics(metric_date DESC);

-- Fonction pour mettre à jour les métriques de qualité
CREATE OR REPLACE FUNCTION update_data_quality_metrics() RETURNS VOID AS $$
BEGIN
    INSERT INTO data_quality_metrics (
        metric_date, total_news, unique_news, duplicate_news,
        avg_quality_score, high_quality_news, medium_quality_news, low_quality_news,
        sources_active, news_last_24h, news_last_7d
    )
    SELECT
        CURRENT_DATE,
        COUNT(*) as total_news,
        COUNT(DISTINCT title_hash) as unique_news,
        COUNT(*) - COUNT(DISTINCT title_hash) as duplicate_news,
        ROUND(AVG(data_quality_score), 2) as avg_quality_score,
        COUNT(CASE WHEN data_quality_score >= 0.8 THEN 1 END) as high_quality_news,
        COUNT(CASE WHEN data_quality_score >= 0.6 AND data_quality_score < 0.8 THEN 1 END) as medium_quality_news,
        COUNT(CASE WHEN data_quality_score < 0.6 THEN 1 END) as low_quality_news,
        COUNT(DISTINCT source) as sources_active,
        COUNT(CASE WHEN scraped_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as news_last_24h,
        COUNT(CASE WHEN scraped_at >= NOW() - INTERVAL '7 days' THEN 1 END) as news_last_7d
    FROM news_items
    ON CONFLICT (metric_date)
    DO UPDATE SET
        total_news = EXCLUDED.total_news,
        unique_news = EXCLUDED.unique_news,
        duplicate_news = EXCLUDED.duplicate_news,
        avg_quality_score = EXCLUDED.avg_quality_score,
        high_quality_news = EXCLUDED.high_quality_news,
        medium_quality_news = EXCLUDED.medium_quality_news,
        low_quality_news = EXCLUDED.low_quality_news,
        sources_active = EXCLUDED.sources_active,
        news_last_24h = EXCLUDED.news_last_24h,
        news_last_7d = EXCLUDED.news_last_7d,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Créer les autres tables (sentiment_analyses, news_sources, etc.)
-- (Le reste du schema original reste inchangé)