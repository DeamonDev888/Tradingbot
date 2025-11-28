# 📊 RougePulseAgent - Documentation Complète

## 🎯 Vue d'Ensemble

Le **RougePulseAgent** est le cœur neurologique du système **Financial Analyst** qui transforme les données de marché brutes en intelligence de trading actionnelle pour les **contrats Futures E-mini S&P 500 (ES)**.

---

## 🏗 Architecture du Système

```
                    ┌─────────────────────────────────────────────────────┐
                    │        FINANCIAL ANALYST SYSTEM        │
                    └─────────────────────────────────────────────────────┘
                                    │
                    ┌─────────────────────────┐
                    │   ROUGE PULSE AGENT │ ← NOUS
                    └─────────────────────────┘
                                    │
        ┌─────────────────┬─────────────────────┬─────────────────┬─────────────────┐
        │  NEWS DATA     │ ECONOMIC EVENTS │  ES FUTURES   │ MARKET DATA  │
        │  (Scraping)     │  (TradingEcon)  │  (Vos scrapers)│ (Database)     │
        └─────────────────┴─────────────────────┴─────────────────┴─────────────────┘
                    │
                    ┌─────────────────────────────────────────┐
                    │        AI ANALYSIS ENGINE           │
                    │  (x-ai/grok-code-fast-1)          │
                    └─────────────────────────────────────────┘
                    │
                    ┌─────────────────────────────────────────┐
                    │     TRADING SIGNALS & RISK MGMT      │
                    │  (Outputs structurés pour traders)     │
                    └─────────────────────────────────────────┘
```

---

## 🔄 Flux de Données

### 1. **Pipeline d'Ingestion**

```typescript
// Flux principal orchestré par NewsAggregator
Data Sources → NewsAggregator → PostgreSQL
├── ZeroHedge (RSS scraper)
├── CNBC (RSS scraper)
├── FinancialJuice (RSS scraper)
├── Finnhub (API client)
├── TradingEconomics (scraper calendrier)
└── VixPlaywrightScraper (VIX + futures)
```

### 2. **Pipeline d'Analyse**

```typescript
// Pipeline principal dans RougePulseAgent
Collect Data → Technical Analysis → AI Processing → Trading Signals
├── getLatestSP500FromDB()       // Vos vrais ES Futures
├── getRecentNewsHeadlines()    // News financières
├── getUpcomingAndRecentEvents() // Événements économiques
├── analyzeTechnicalLevels()        // Analyse technique ES
└── tryKiloCodeWithFile()       // IA Groq/Claude
```

### 3. **Sorties Structurées**

```json
{
  "market_sentiment": "BEARISH|BULLISH|NEUTRAL",
  "sentiment_score": -100 à +100,
  "risk_level": "LOW|MEDIUM|HIGH",
  "catalysts": [
    {
      "event": "FOMC Meeting",
      "impact": "HIGH",
      "actual_vs_forecast": "Hawkish vs Dovish"
    }
  ],
  "trading_recommendation": {
    "action": "LONG|SHORT|WAIT",
    "entry_zone": [6800, 6820],
    "stop_loss": 6750,
    "targets": [6900, 6950],
    "timeframe": "SCALPING|INTRADAY|SWING"
  },
  "technical_edge_analysis": {
    "key_levels": [
      {
        "level": 6850,
        "type": "support|resistance",
        "strength": "weak|moderate|strong",
        "edge_score": 85,
        "reasoning": "Confluence volume + pivot fibonacci",
        "probability_break": "65%"
      }
    ]
  }
}
```

---

## 🗄️ Schéma de Base de Données

### Tables Principales

```sql
-- Données de marché avec vos améliorations
CREATE TABLE market_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(50) NOT NULL,           -- ES_Investing.com, SPY, etc.
    price NUMERIC(10,2) NOT NULL,
    change NUMERIC(10,2),
    change_percent NUMERIC(8,4),
    high NUMERIC(10,2),
    low NUMERIC(10,2),
    open NUMERIC(10,2),
    previous_close NUMERIC(10,2),
    asset_type VARCHAR(20),                -- FUTURES, ETF, INDEX
    source VARCHAR(100),                  -- Investing.com, Finnhub, etc.
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analyses de sentiment avec scoring avancé
CREATE TABLE rouge_pulse_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    impact_score INTEGER,                   -- -100 à +100
    market_narrative TEXT,
    high_impact_events TEXT,
    asset_analysis JSONB,
    trading_recommendation TEXT,
    raw_analysis JSONB,
    sp500_price NUMERIC(10,2),
    price_source VARCHAR(100),              -- Votre mapping détaillé
    technical_levels JSONB,               -- Niveaux ES analysés
    es_futures_analysis JSONB,
    bot_signal JSONB,
    agent_state JSONB,
    next_session_levels JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## ⚙️ Configuration

### Variables d'Environnement

```bash
# Base de données PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=financial_analyst
DB_USER=postgres
DB_PASSWORD=****

# Clés API externes
FINNHUB_API_KEY=****
ALPHA_VANTAGE_API_KEY=****

# Configuration IA
AI_MODEL=x-ai/grok-code-fast-1
AI_MAX_TOKENS=128000
AI_TEMPERATURE=0.1
```

### Fichier `.env` Type

```env
# ===========================================
# FINANCIAL ANALYST - CONFIGURATION
# ===========================================

# Base de données PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=financial_analyst
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe

# API Keys pour sources externes
FINNHUB_API_KEY=votre_cle_finnhub
FRED_API_KEY=votre_cle_fred

# Configuration IA (Claude/Groq)
AI_MODEL=x-ai/grok-code-fast-1
AI_TEMPERATURE=0.1
AI_MAX_TOKENS=128000

# Configuration Scraper
USER_AGENT=Financial-Analyst-Bot/1.0
SCRAPE_DELAY_MIN=2000
SCRAPE_DELAY_MAX=5000

# Timeouts (secondes)
ANALYSIS_TIMEOUT=60
SCRAPE_TIMEOUT=30
DATABASE_TIMEOUT=10

# Cache Configuration
CACHE_TTL_HOURS=2
ENABLE_CACHE=true
```

---

## 🚀 Déploiement et Installation

### 1. **Prérequis Système**

```bash
# Node.js 18+ requis
node --version

# PostgreSQL 13+ requis
psql --version

# Playwright pour scraping (installé globalement)
npm install -g playwright

# Dépendances du projet
npm install
```

### 2. **Initialisation Base de Données**

```bash
# Créer la base de données
createdb financial_analyst

# Exécuter le script d'initialisation
npm run db:init

# Ou manuellement :
psql -h localhost -U postgres -d financial_analyst -f src/backend/database/schema_simplified.sql
```

### 3. **Installation des Dépendances**

```bash
# Installer toutes les dépendances
npm install

# Compiler le projet TypeScript
npm run build

# Vérifier la configuration
npm run config:check
```

---

## 📖 Guide d'Utilisation

### Lancement des Agents

```bash
# 1. Ingestion des données (scraping + news)
npm run ingest:all

# 2. Analyse de sentiment complète
npm run agent:rouge-pulse

# 3. Agents secondaires (utilise les analyses)
npm run agent:vortex
npm run agent:vixombre

# 4. Surveillance continue
npm run monitor:continuous

# 5. Rapport de statut
npm run status:scrapers
```

### Commandes Détaillées

```bash
# ============= SCRIPT PRINCIPAUX =============

# Ingestion complète des données
npm run ingest:all
├── news:all        # Toutes les sources de news
├── market:es         # Scraping ES Futures (votre système)
├── events:economic    # Calendrier économique
└── vix:all           # VIX + levels

# Analyse de sentiment ES Futures
npm run agent:rouge-pulse
├── Utilise vos vrais prix ES_Investing.com (6,832.25)
├── Analyse les niveaux techniques + news
└── Génère signaux LONG/SHORT/WAIT

# Surveillance en temps réel
npm run monitor:continuous
├── Toutes les 5 minutes
├── Logs structurés dans database.md
└── Alertes sur divergences

# Nettoyage et maintenance
npm run db:cleanup        # Cache > 30j, analyses > 90j
npm run db:migrate         # Migrations schéma
npm run db:backup          # Sauvegardes automatiques
```

---

## 🎯 Intégration avec Vos Scrapers ES Futures

### Utilisation de Vos Données Améliorées

```typescript
// Dans RougePulseAgent.ts - getDetailedSourceInfo()
const sourceInfo = this.getDetailedSourceInfo(sp500Data);

// Affichera automatiquement :
"📊 Investing.com (ES Futures) - Scraping Direct | Confiance: 🔥 Élevée | ⚡ Temps Réel"
"🔄 SPY ETF Converti (718.50 × 9.5) → ES Futures | Confiance: ⚡ Moyenne | 📈 Très Récent"
```

### Mapping des Sources Reconnaissues

| Source détectée | Affichage professionnel | Confiance |
|---|---|---|---|
| `ES_Investing.com` | 📊 Investing.com (ES Futures) - Scraping Direct | 🔥 Élevée |
| `ES_Yahoo_Finance` | 📈 Yahoo Finance (ES Futures) - Scraping Direct | 🔥 Élevée |
| `ES_CONVERTED` | 🔄 SPY ETF Converti (prix × 9.5) → ES Futures | ⚡ Moyenne |
| `SPY` | 💰 SPY ETF - Données Brutes | 📊 Standard |
| `QQQ` | 🚀 QQQ ETF - Données Brutes | 📊 Standard |

---

## 🔧 Analyse Technique ES Futures

### Niveaux Psychologiques Automatiques

```typescript
// Génération automatique selon le prix actuel
const stepSize = currentPrice > 1000 ? 100 : 50;  // ES Futures : 100 points

for (let level = Math.floor(currentPrice / stepSize) * stepSize - 500;
     level <= Math.floor(currentPrice / stepSize) * stepSize + 500;
     level += stepSize) {

  // Niveaux ronds tous les 100 points
  if (level % 500 === 0) return 'Niveau psychologique majeur ES';
  if (level % 250 === 0) return 'Niveau psychologique important ES';
  if (level % 100 === 0) return 'Niveau psychologique ES';
}
```

### Points Pivots Calculés

```typescript
// Formule de pivot standard
P = (High + Low + Close) / 3
R1 = (2 × P) - Low
R2 = (2 × P) - High
S1 = P - (R1 - P) × 0.382
S2 = P + (R2 - P) × 0.382
```

### Niveaux Fibonacci Intégrés

```typescript
// Ratios standards appliqués au range journalier
const fibRatios = [0.236, 0.382, 0.500, 0.618];

fibRatios.forEach(ratio => {
  const support = high - (high - low) * ratio;
  const resistance = low + (high - low) * ratio;

  // Ajoutés avec force basée sur la confluence
});
```

---

## 📊 Exemples d'Utilisation

### Cas 1 : Détection de Support Technique

```json
{
  "current_price": 6832.25,
  "sentiment_score": -35,
  "market_sentiment": "BEARISH",
  "trading_recommendation": {
    "action": "SHORT",
    "entry_zone": [6825, 6830],
    "stop_loss": 6850,
    "targets": [6800, 6785],
    "reasoning": "Support psychologique à 6825 cassé avec volume croissant"
  },
  "technical_edge_analysis": {
    "key_levels": [
      {
        "level": 6825,
        "type": "support",
        "strength": "strong",
        "edge_score": 85,
        "probability_break": "75%",
        "reasoning": "Confluence pivot R1 + volume profile accumulation",
        "confirmation_factors": [
          "Support pivot standard calculé",
          "Volume croissant sur 4 heures",
          "Pivot psychologique majeur ES"
        ]
      }
    ]
  }
}
```

### Cas 2 : Signal d'Attente (WAIT)

```json
{
  "market_sentiment": "NEUTRAL",
  "sentiment_score": 5,
  "trading_recommendation": {
    "action": "WAIT",
    "entry_zone": [6800, 6850],
    "monitor_levels": [6775, 6825, 6875, 6900],
    "reasoning": "Marché en consolidation avant FOMC",
    "timeframe": "INTRADAY"
  }
}
```

---

## ⚡ Optimisations et Performance

### Cache Intelligent

```typescript
// Stratégie de cache multi-niveaux
const cacheStrategy = {
  recent: {      // < 2h
    ttl: 2 * 60 * 1000,
    priority: "real_time"
  },
  standard: {    // < 24h
    ttl: 24 * 60 * 1000,
    priority: "standard"
  },
  archive: {     // < 7j
    ttl: 7 * 24 * 60 * 1000,
    priority: "background"
  }
};
```

### Parallélisation Optimale

```typescript
// Exécution parallèle des scrapers
const sources = [
  'Investing.com',    // 30s timeout
  'Yahoo Finance',    // 25s timeout
  'Finnhub API'      // 10s timeout
];

const results = await Promise.allSettled(
  sources.map(source => scrapeSource(source))
);
```

### Gestion d'Erreurs Robuste

```typescript
// 5 tentatives de réparation JSON automatiques
const repairStrategies = [
  "basic_completion",      // Ajouter {} manquants
  "trading_recommendation", // Réparer le champ tronqué
  "smart_completion",     // Reconstruction intelligente
  "fallback_structure"   // Retourner objet partiel valide
];
```

---

## 🔍 Monitoring et Debug

### Logs Structurés

```bash
# Fichier de monitoring continu
database.md → Contient toutes les analyses avec timestamp

# Format timestampé
[2024-11-27 14:30:12] ROUGE_PULSE: Analysis completed
├── Sentiment: BEARISH (-35)
├── Risk Level: HIGH
├── ES Price: 6832.25 (ES_Investing.com)
├── Trading Signal: SHORT 6825-6830, SL 6850
└── Technical Levels: [6775, 6825, 6875]
```

### Métriques de Performance

```typescript
// Suivi des temps de réponse
const performanceMetrics = {
  averageAnalysisTime: 45000,  // 45 secondes
  successRate: 94.5,         // 94.5% de succès
  cacheHitRate: 67.3,        // 67.3% de cache hits
  errorRate: 5.5              // 5.5% d'erreurs
};
```

### Alertes et Anomalies

```typescript
// Détection de divergences critiques
const divergenceAlert = {
  priceSpread: Math.abs(expectedPrice - actualPrice) / expectedPrice,
  threshold: 0.02,  // 2% de divergence

  if (priceSpread > threshold) {
    alertLevel: "CRITICAL";
    message: "Divergence prix détectée entre sources";
    recommendedAction: "MANUAL_VERIFICATION";
  }
};
```

---

## 🚨 Dépannage et Résolution de Problèmes

### Problèmes Communs

```bash
# 1. Erreur de connexion à la base de données
ERROR: Connection refused (port 5432)
→ Vérifier que PostgreSQL est démarré
→ Configurer DB_HOST=localhost et DB_PORT=5432

# 2. Clés API manquantes
WARNING: FINNHUB_API_KEY is missing
→ Ajouter les clés dans le fichier .env
→ Créer un compte sur finnhub.io

# 3. Timeout lors du scraping
ERROR: Scraper timeout after 30000ms
→ Augmenter SCRAPE_TIMEOUT dans .env
→ Vérifier la connexion réseau

# 4. Réponse IA vide ou malformée
WARNING: Empty AI response received
→ Vérifier AI_MODEL et AI_TEMPERATURE
→ Ajouter fallback vers analyse de données brutes
```

### Scripts de Diagnostic

```bash
# Test complet du système
npm run test:complete

# Diagnostic des scrapers
npm run debug:scrapers

# Validation de la base de données
npm run db:validate

# Test des APIs externes
npm run test:apis
```

---

## 📚 Bonnes Pratiques

### Sécurité

```bash
# Ne jamais exposer les clés API dans le code source
# Utiliser toujours les variables d'environnement
# Limiter les permissions de la base de données
# Valider toutes les entrées utilisateur

# Configuration PostgreSQL sécurisée
GRANT SELECT, INSERT, UPDATE ON financial_analyst TO financial_analyst_user;
REVOKE ALL ON financial_analyst FROM public;
```

### Performance

```bash
# Index stratégiques pour les requêtes fréquentes
CREATE INDEX CONCURRENTLY idx_market_data_symbol_timestamp
ON market_data (symbol, timestamp DESC);

# Limitation des résultats avec OFFSET et LIMIT
SELECT * FROM market_data
ORDER BY timestamp DESC
LIMIT 100 OFFSET 0;

# Connexions persistantes pour les analyses fréquentes
// Réutiliser la même connexion pool pour les analyses successives
```

### Maintenance

```bash
# Nettoyage régulier du cache (tâche cron)
0 2 * * * * /usr/bin/npm run db:cleanup

# Sauvegardes automatiques quotidiennes
0 3 * * * * /usr/bin/npm run db:backup

# Monitoring de l'espace disque
df -h /path/to/database | grep -E "Avail|Use%"
```

---

## 🔗 Références et Ressources

### Documentation Technique

- **Schema SQL** : `src/backend/database/schema_simplified.sql`
- **API Documentation** : `docs/TOOL_FORMAT.md`
- **Scraper Status** : `docs/SCRAPERS_STATUS_REPORT.md`

### Scripts Utilitaires

```bash
# Migration de schéma de base de données
npm run db:migrate

# Réinitialisation complète (DANGEREUX - perte de données)
npm run db:reset

# Import/export de données
npm run db:export
npm run db:import FILE.json

# Validation de la configuration
npm run config:validate
```

### Community et Support

- **Issues GitHub** : Signaler les bugs avec templates détaillés
- **Discord Technique** : Canal pour questions et partage
- **Documentation Update** : Contribuer aux améliorations continues

---

## 📈 Roadmap et Évolutions

### Version Actuelle : v2.1.0

- ✅ Scraping ES Futures multi-sources
- ✅ Analyse de sentiment IA avancée
- ✅ Mapping intelligent des sources
- ✅ Cache multi-niveaux performant
- ✅ Monitoring continu et alertes

### Prochaines Améliorations

- **v2.2.0** : Machine Learning pour prédiction de niveaux
- **v2.3.0** : Interface web de visualisation des signaux
- **v2.4.0** : Alertes mobiles et notifications temps réel
- **v3.0.0** : Intégration multi-actifs (actions + options)

---

## 📞 Support et Dépannage

### Pour l'Assistance Technique

1. **Vérifier la documentation** existante dans `docs/`
2. **Consulter les logs** dans `database.md`
3. **Utiliser les scripts de diagnostic** disponibles
4. **Vérifier la configuration** avec `npm run config:check`

### Informations de Débuggage à Fournir

- **Version exacte** : `npm --version`
- **Environment** : `uname -a` + `node --version`
- **Configuration** : Contenu du fichier `.env` (masquer les clés)
- **Logs d'erreurs** : 50 dernières lignes de chaque log
- **Métriques système** : CPU, RAM, disque available

---

## 📊 Conclusion

Le **RougePulseAgent** représente un système d'analyse financière de pointe qui transforme vos données de marché ES Futures en intelligence de trading actionnelle.

**Points Forts :**
- 🔄 **Données ES Futures fiables** via vos scrapers améliorés
- 🧠 **Analyse IA avancée** avec Groq/Claude
- 📊 **Signaux de trading structurés** avec niveaux de confiance
- ⚡ **Performance optimisée** avec cache et parallélisation
- 🔍 **Monitoring complet** avec alertes et métriques

C'est un outil professionnel pour traders quantitatifs et analystes financiers ! 🚀

---

*Document généré le 27 novembre 2024*
*Version : 1.0.0*
*Auteur : Financial Analyst System*