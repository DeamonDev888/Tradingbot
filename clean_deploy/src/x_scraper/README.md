# X/Twitter News Scraper

Module séparé pour le scraping des flux RSS X/Twitter, extrait du système d'agrégation principal.

## Structure

- **XFeedParser.ts**: Analyse des fichiers OPML et extraction des flux X/Twitter
- **XNewsScraper.ts**: Scraper principal utilisant Playwright pour contourner les protections anti-bot
- **XScraperService.ts**: Service de haut niveau pour orchestrer le scraping
- **interfaces.ts**: Types TypeScript pour le module

## Utilisation

### Exemple simple

```typescript
import { XScraperService } from './XScraperService';

const service = new XScraperService();

// Lancer le scraping avec le fichier OPML par défaut (ia.opml)
const result = await service.runScraping();

if (result.success) {
  console.log(`Scraped ${result.totalItems} items from ${result.processedFeeds} feeds`);
  await service.saveToJson(result.items);
}
```

### Utilisation en ligne de commande

```bash
# Compiler le module
npx tsc src/x_scraper/*.ts --target es2020 --module commonjs --outdir dist/x_scraper

# Exécuter avec fichier OPML par défaut
node dist/x_scraper/XScraperService.js

# Exécuter avec fichier OPML spécifique
node dist/x_scraper/XScraperService.js /path/to/your.opml
```

## Priorité des flux

Le scraper traite les flux dans cet ordre de priorité:
1. **lightbrd.com** (plus fiable) - jusqu'à 8 flux
2. **xcancel.com** - jusqu'à 7 flux
3. **Autres domaines** - jusqu'à 5 flux

## Extraction par flux

Maximum 5 articles par flux pour éviter la surcharge.

## Détection anti-bot

Utilise Playwright avec:
- User-Agent réaliste
- Navigation avec attente réseau
- Gestion des redirections
- Parsing XML/HTML multiple

## Fichiers générés

- **x_news_items.json**: Articles scrapés avec métadonnées
- **Logs détaillés** dans la console pour le débogage

## Dépendances

- `playwright`: Navigateur headless pour contourner les protections
- `cheerio`: Parsing HTML/XML
- `axios`: Requêtes HTTP (fallback)
- `typescript`: Support TypeScript