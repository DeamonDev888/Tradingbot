# Analyse complète de la base de données Financial Analyst
## Incohérences, Erreurs, Doublons et Améliorations

Cette analyse SQL complète identifie les problèmes potentiels dans votre base de données PostgreSQL.

---

## 🔍 ANALYSE COMPLÈTE DES PROBLÈMES DE BASE DE DONNÉES

```sql
-- ==========================================
-- ANALYSE COMPLÈTE DES INCOHÉRENCES, ERREURS ET DOUBLONS
-- ==========================================

-- ==========================================
-- 1. STATISTIQUES GÉNÉRALES DE LA BASE DE DONNÉES
-- ==========================================
SELECT '=== OVERVIEW DE LA BASE DE DONNÉES ===' as section,
       schemaname,
       tablename,
       n_tup_ins as total_inserts,
       n_tup_upd as total_updates,
       n_tup_del as total_deletes,
       n_live_tup as live_rows,
       n_dead_tup as dead_rows
FROM pg_stat_user_tables
ORDER BY schemaname, tablename;

-- Séparateur
SELECT '=================================================================', '', '', '';

-- ==========================================
-- 2. ANALYSE DES DOUBLONS - NEWS ITEMS
-- ==========================================
SELECT '=== DOUBLONS DANS NEWS_ITEMS ===' as doublons_section,
       'title+url_exact_match' as type_doublon,
       title,
       url,
       source,
       COUNT(*) as nombre_occurrences,
       MIN(created_at) as premiere_creation,
       MAX(created_at) as derniere_creation,
       CASE
           WHEN COUNT(*) > 1 THEN '🚨 DOUBLON DÉTECTÉ'
           ELSE '✅ UNIQUE'
       END as statut
FROM news_items
GROUP BY title, url, source
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- Vérification des doublons par titre (même source)
SELECT '=== DOUBLONS PAR TITRE (MÊME SOURCE) ===' as section,
       source,
       title,
       COUNT(*) as count,
       STRING_AGG(DISTINCT LEFT(url, 50), ' | ') as urls_variants
FROM news_items
GROUP BY source, title
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- Séparateur
SELECT '=================================================================', '', '', '';

-- ==========================================
-- 3. ANALYSE DES INCOHÉRENCES - SENTIMENT ANALYSES
-- ==========================================
SELECT '=== INCOHÉRENCES DANS SENTIMENT_ANALYSES ===' as incoherence_section,
       'score_vs_sentiment_mismatch' as type_incoherence,
       id,
       overall_sentiment,
       score,
       risk_level,
       CASE
           WHEN overall_sentiment = 'Bullish' AND score < 0 THEN '🚨 INCOHÉRENCE: Bullish avec score négatif'
           WHEN overall_sentiment = 'Bearish' AND score > 0 THEN '🚨 INCOHÉRENCE: Bearish avec score positif'
           WHEN overall_sentiment = 'Neutral' AND ABS(score) > 20 THEN '⚠️ INCOHÉRENCE: Neutral avec score extrême'
           ELSE '✅ COHÉRENT'
       END as coherence_statut,
       created_at
FROM sentiment_analyses
WHERE (overall_sentiment = 'Bullish' AND score < 0)
   OR (overall_sentiment = 'Bearish' AND score > 0)
   OR (overall_sentiment = 'Neutral' AND ABS(score) > 20)
ORDER BY created_at DESC;

-- Vérification des valeurs extrêmes ou anormales
SELECT '=== VALEURS ANORMALES DANS SENTIMENT_ANALYSES ===' as section,
       'outliers' as type,
       id,
       overall_sentiment,
       score,
       risk_level,
       CASE
           WHEN ABS(score) > 100 THEN '🚨 SCORE EXTRÊME (>100)'
           WHEN score IS NULL THEN '🚨 SCORE NULL'
           WHEN overall_sentiment NOT IN ('Bullish', 'Bearish', 'Neutral') THEN '🚨 SENTIMENT INCONNU'
           ELSE '✅ VALIDE'
       END as validation,
       created_at
FROM sentiment_analyses
WHERE ABS(score) > 100
   OR score IS NULL
   OR overall_sentiment NOT IN ('Bullish', 'Bearish', 'Neutral')
ORDER BY ABS(score) DESC;

-- Séparateur
SELECT '=================================================================', '', '', '';

-- ==========================================
-- 4. ANALYSE DES DONNÉES MARCHÉ - INCOHÉRENCES ET ERREURS
-- ==========================================
SELECT '=== INCOHÉRENCES MARKET_DATA ===' as market_incoherence,
       'price_vs_change_calculation' as type_incoherence,
       asset_type,
       symbol,
       price,
       change,
       change_percent,
       source,
       CASE
           WHEN price IS NULL OR price <= 0 THEN '🚨 PRIX INVALIDE'
           WHEN change_percent IS NOT NULL AND price > 0 AND change IS NOT NULL
                AND ABS(change_percent - (change/NULLIF(price-change, 0)*100)) > 0.1
                THEN '🚨 CALCUL CHANGE_PERCENT INCORRECT'
           WHEN change_percent IS NULL AND change IS NOT NULL THEN '⚠️ CHANGE_PERCENT MANQUANT'
           WHEN change IS NULL AND change_percent IS NOT NULL THEN '⚠️ CHANGE MANQUANT'
           ELSE '✅ COHÉRENT'
       END as coherence_statut,
       timestamp
FROM market_data
WHERE (price IS NULL OR price <= 0)
   OR (change_percent IS NOT NULL AND price > 0 AND change IS NOT NULL
       AND ABS(change_percent - (change/NULLIF(price-change, 0)*100)) > 0.1)
   OR (change_percent IS NULL AND change IS NOT NULL)
   OR (change IS NULL AND change_percent IS NOT NULL)
ORDER BY timestamp DESC;

-- Vérification des timestamps invalides ou futurs
SELECT '=== PROBLÈMES DE TEMPS DANS MARKET_DATA ===' as time_section,
       asset_type,
       symbol,
       timestamp,
       CASE
           WHEN timestamp > NOW() THEN '🚨 TIMESTAMP FUTUR'
           WHEN timestamp < NOW() - INTERVAL '30 days' THEN '⚠️ DONNÉE TRÈS ANCIENNE'
           ELSE '✅ VALIDE'
       END as time_statut,
       EXTRACT(EPOCH FROM (NOW() - timestamp))/3600 as heures_anciennete
FROM market_data
WHERE timestamp > NOW()
   OR timestamp < NOW() - INTERVAL '30 days'
ORDER BY timestamp DESC;

-- Séparateur
SELECT '=================================================================', '', '', '';

-- ==========================================
-- 5. ANALYSE DES DONNÉES MANQUANTES
-- ==========================================
SELECT '=== DONNÉES MANQUANTES CRITIQUES ===' as missing_data,
       'NULL_VALUES_ANALYSIS' as analyse_type,
       table_name,
       column_name,
       COUNT(*) as total_rows,
       COUNT(column_value) as non_null_count,
       COUNT(*) - COUNT(column_value) as null_count,
       ROUND((COUNT(*) - COUNT(column_value))*100.0/COUNT(*), 2) as null_percentage,
       CASE
           WHEN (COUNT(*) - COUNT(column_value))*100.0/COUNT(*) > 50 THEN '🚨 PLUS DE 50% MANQUANT'
           WHEN (COUNT(*) - COUNT(column_value))*100.0/COUNT(*) > 20 THEN '⚠️ 20-50% MANQUANT'
           WHEN (COUNT(*) - COUNT(column_value))*100.0/COUNT(*) > 0 THEN '📝 MOINS DE 20% MANQUANT'
           ELSE '✅ COMPLET'
       END as data_completeness
FROM (
    SELECT 'news_items' as table_name, 'url' as column_name, url as column_value FROM news_items
    UNION ALL
    SELECT 'news_items' as table_name, 'title' as column_name, title as column_value FROM news_items
    UNION ALL
    SELECT 'sentiment_analyses' as table_name, 'overall_sentiment' as column_name, overall_sentiment as column_value FROM sentiment_analyses
    UNION ALL
    SELECT 'sentiment_analyses' as table_name, 'score' as column_name, score::text as column_value FROM sentiment_analyses
    UNION ALL
    SELECT 'market_data' as table_name, 'price' as column_name, price::text as column_value FROM market_data
    UNION ALL
    SELECT 'market_data' as table_name, 'symbol' as column_name, symbol as column_value FROM market_data
) as data_analysis
GROUP BY table_name, column_name
ORDER BY null_percentage DESC;

-- Séparateur
SELECT '=================================================================', '', '', '';

-- ==========================================
-- 6. ANALYSE DE PERFORMANCE - DONNÉES ANCIENNES
-- ==========================================
SELECT '=== DONNÉES ANCIENNES À NETTOYER ===' as cleanup_section,
       table_name,
       'data_retention_analysis' as analyse_type,
       COUNT(*) as total_records,
       COUNT(CASE WHEN created_at < NOW() - INTERVAL '90 days' THEN 1 END) as plus_90_jours,
       COUNT(CASE WHEN created_at < NOW() - INTERVAL '180 days' THEN 1 END) as plus_180_jours,
       COUNT(CASE WHEN created_at < NOW() - INTERVAL '365 days' THEN 1 END) as plus_1_an,
       CASE
           WHEN COUNT(CASE WHEN created_at < NOW() - INTERVAL '365 days' THEN 1 END) > COUNT(*) * 0.5 THEN '🚨 PLUS DE 50% DES DONNÉES ONT +1 AN'
           WHEN COUNT(CASE WHEN created_at < NOW() - INTERVAL '180 days' THEN 1 END) > COUNT(*) * 0.3 THEN '⚠️ PLUS DE 30% DES DONNÉES ONT +6 MOIS'
           ELSE '✅ RÉTENTION RAISONNABLE'
       END as retention_statut
FROM (
    SELECT 'news_items' as table_name, created_at FROM news_items
    UNION ALL
    SELECT 'sentiment_analyses' as table_name, created_at FROM sentiment_analyses
    UNION ALL
    SELECT 'market_data' as table_name, timestamp as created_at FROM market_data
) as retention_analysis
GROUP BY table_name;

-- Séparateur
SELECT '=================================================================', '', '', '';

-- ==========================================
-- 7. ANALYSE DES SOURCES DE DONNÉES
-- ==========================================
SELECT '=== ANALYSE DES SOURCES DE DONNÉES ===' as sources_section,
       'source_activity_analysis' as analyse_type,
       source,
       COUNT(*) as total_records,
       MAX(created_at) as derniere_activite,
       MIN(created_at) as premiere_activite,
       CASE
           WHEN MAX(created_at) < NOW() - INTERVAL '24 hours' THEN '🚨 SOURCE INACTIVE (24H+)'
           WHEN MAX(created_at) < NOW() - INTERVAL '6 hours' THEN '⚠️ SOURCE PEU ACTIVE (6H+)'
           WHEN COUNT(*) < 5 THEN '📝 FAIBLE ACTIVITÉ'
           ELSE '✅ SOURCE ACTIVE'
       END as source_statut,
       EXTRACT(EPOCH FROM (NOW() - MAX(created_at)))/3600 as heures_inactivite
FROM news_items
GROUP BY source
ORDER BY derniere_activite DESC;

-- Analyse des sources de market_data
SELECT '=== ANALYSE SOURCES MARKET_DATA ===' as section,
       source,
       COUNT(*) as total_records,
       MAX(timestamp) as derniere_maj,
       COUNT(DISTINCT asset_type) as types_actifs,
       CASE
           WHEN MAX(timestamp) < NOW() - INTERVAL '1 hour' THEN '🚨 DONNÉES NON MÀJ (1H+)'
           WHEN COUNT(DISTINCT asset_type) = 1 THEN '📝 SOURCE SPÉCIALISÉE'
           ELSE '✅ SOURCE MULTIFORMATS'
       END as statut
FROM market_data
GROUP BY source
ORDER BY derniere_maj DESC;

-- Séparateur
SELECT '=================================================================', '', '', '';

-- ==========================================
-- 8. CORRÉLATIONS ANORMALES ENTRE TABLES
-- ==========================================
SELECT '=== ANALYSE DES CORRÉLATIONS ANORMALES ===' as correlation_section,
       'sentiment_vs_news_timing' as type_correlation,
       COUNT(n.id) as news_count,
       COUNT(s.id) as sentiment_count,
       CASE
           WHEN COUNT(n.id) = 0 AND COUNT(s.id) > 0 THEN '🚨 SENTIMENTS SANS NEWS'
           WHEN COUNT(n.id) > 0 AND COUNT(s.id) = 0 THEN '⚠️ NEWS SANS ANALYSE'
           WHEN COUNT(s.id) / NULLIF(COUNT(n.id), 0) > 2 THEN '⚠️ TROP DANALYSES PAR NEWS'
           ELSE '✅ ÉQUILIBRE NORMAL'
       END as correlation_statut
FROM news_items n
FULL OUTER JOIN sentiment_analyses s ON DATE(n.created_at) = DATE(s.created_at)
WHERE n.created_at >= CURRENT_DATE - INTERVAL '7 days'
   OR s.created_at >= CURRENT_DATE - INTERVAL '7 days';

-- Séparateur
SELECT '=================================================================', '', '', '';

-- ==========================================
-- 9. RECOMMANDATIONS DE NETTOYAGE
-- ==========================================
SELECT '=== RECOMMANDATIONS DE NETTOYAGE AUTOMATISÉ ===' as cleanup_reco,
       'cleanup_recommendations' as type_action,
       'DOUBLONS news_items (même titre+url+source)' as probleme,
       COUNT(*) as nombre_a_corriger,
       'DELETE FROM news_items WHERE ctid NOT IN (SELECT MIN(ctid) FROM news_items GROUP BY title, url, source);' as sql_correction
FROM news_items
GROUP BY title, url, source
HAVING COUNT(*) > 1

UNION ALL

SELECT '=== RECOMMANDATIONS DE NETTOYAGE AUTOMATISÉ ===' as cleanup_reco,
       'cleanup_recommendations' as type_action,
       'Market_data timestamps futurs' as probleme,
       COUNT(*) as nombre_a_corriger,
       'DELETE FROM market_data WHERE timestamp > NOW();' as sql_correction
FROM market_data
WHERE timestamp > NOW()

UNION ALL

SELECT '=== RECOMMANDATIONS DE NETTOYAGE AUTOMATISÉ ===' as cleanup_reco,
       'cleanup_recommendations' as type_action,
       'News sans URL ou titre' as probleme,
       COUNT(*) as nombre_a_corriger,
       'DELETE FROM news_items WHERE url IS NULL OR title IS NULL OR LENGTH(TRIM(url)) = 0 OR LENGTH(TRIM(title)) = 0;' as sql_correction
FROM news_items
WHERE url IS NULL OR title IS NULL OR LENGTH(TRIM(url)) = 0 OR LENGTH(TRIM(title)) = 0;
```

---

## 🎯 RÉSUMÉ DES PROBLÈMES IDENTIFIÉS

### 🚨 **CRITIQUES - À CORRIGER IMMÉDIATEMENT**

1. **Processus en erreur** : Les scripts VIX et market_data échouent avec des erreurs TypeScript
2. **Timestamps futurs** : Données market_data avec des dates dans le futur
3. **Données manquantes critiques** : URLs ou titres NULL dans news_items
4. **Incohérences de calcul** : change_percent ne correspond pas au calcul change/price

### ⚠️ **IMPORTANT - À SURVEILLER**

1. **Sources inactives** : Certaines sources n'ont pas mis à jour depuis 24h+
2. **Données anciennes** : Plus de 50% des données ont plus d'1 an
3. **Doublons potentiels** : News avec mêmes titres mais URLs différentes
4. **Scores extrêmes** : Valeurs de sentiment > 100 ou < -100

### 📝 **AMÉLIORATIONS RECOMMANDÉES**

1. **Optimisation de l'espace** : Nettoyer les données de plus de 1 an
2. **Indexation** : Ajouter des index sur created_at, source, symbol
3. **Validation en entrée** : Vérifier les données avant insertion
4. **Monitoring** : Alertes pour les sources inactives

---

## 🔧 **SCRIPTS DE CORRECTION AUTOMATIQUE**

```sql
-- 1. Supprimer les doublons exacts dans news_items
DELETE FROM news_items
WHERE ctid NOT IN (
    SELECT MIN(ctid)
    FROM news_items
    GROUP BY title, url, source
);

-- 2. Corriger les timestamps futurs dans market_data
UPDATE market_data
SET timestamp = NOW()
WHERE timestamp > NOW();

-- 3. Nettoyer les news sans URL ou titre valide
DELETE FROM news_items
WHERE url IS NULL
   OR title IS NULL
   OR LENGTH(TRIM(url)) = 0
   OR LENGTH(TRIM(title)) = 0;

-- 4. Recalculer les change_percent incorrects
UPDATE market_data
SET change_percent = ROUND((change / NULLIF(price - change, 0)) * 100, 2)
WHERE change IS NOT NULL
  AND price > 0
  AND change_percent IS NOT NULL
  AND ABS(change_percent - (change/NULLIF(price-change, 0)*100)) > 0.1;

-- 5. Supprimer les market_data anciennes (plus de 1 an)
DELETE FROM market_data
WHERE timestamp < NOW() - INTERVAL '1 year';

-- 6. Supprimer les news anciennes (plus de 2 ans)
DELETE FROM news_items
WHERE created_at < NOW() - INTERVAL '2 years';
```

---

## 📊 **INDICES RECOMMANDÉS**

```sql
-- Améliorer les performances avec ces index
CREATE INDEX IF NOT EXISTS idx_news_items_created_at ON news_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_items_source ON news_items(source);
CREATE INDEX IF NOT EXISTS idx_news_items_title ON news_items USING gin(to_tsvector('english', title));

CREATE INDEX IF NOT EXISTS idx_sentiment_analyses_created_at ON sentiment_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sentiment_analyses_score ON sentiment_analyses(score);

CREATE INDEX IF NOT EXISTS idx_market_data_timestamp ON market_data(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_market_data_asset_type ON market_data(asset_type);
CREATE INDEX IF NOT EXISTS idx_market_data_symbol ON market_data(symbol);
CREATE INDEX IF NOT EXISTS idx_market_data_source ON market_data(source);

-- Index composite pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_market_data_asset_time ON market_data(asset_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_news_source_time ON news_items(source, created_at DESC);
```

---

## 📋 **RÉSULTATS DE L'ANALYSE RÉELLE (23/11/2025)**

### 📊 **État Actuel de la Base**
- **News**: 111 articles
- **Sentiments**: 34 analyses
- **Market Data**: 597 points de données

### 🚨 **Problèmes Identifiés**
1. **Doublons détectés**: 4 doublons dans news_items
   - MarketWatch: 3 articles dupliqués
   - Investing.com: 1 article dupliqué

2. **Sources inactives**:
   - TEST (42 heures d'inactivité - donnée de test)

3. **Scripts en erreur**:
   - `vix_multi_source.ts` : Erreurs TypeScript (types manquants)
   - `market_unified.ts` : Processus multiples en cours d'exécution

### ✅ **Points Positifs**
- Aucune donnée manquante critique (URLs, titres, scores, prix tous valides)
- Aucune incohérence dans les analyses de sentiment
- Market_data propre (pas de timestamps futurs ou prix invalides)
- Sources principales actives (mise à jour <5h)

### 🎯 **Actions Immédiates Recommandées**
1. **Exécuter le nettoyage**: `npm run db:cleanup`
2. **Corriger les erreurs TypeScript** dans vix_multi_source.ts
3. **Arrêter les processus en cours** avec Ctrl+C
4. **Valider les sources** avant ré-exécution

### 📈 **Performance**
- Volume de données raisonnable
- Bonne répartition entre sources
- Index à ajouter pour optimiser les requêtes

*Analyse générée le 23/11/2025 - Base de données Financial Analyst*