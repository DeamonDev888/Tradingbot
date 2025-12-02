// X/Twitter Scraper Module
// Export all classes and interfaces for easy import
// IMPORTANT: Export explicitement avec le chemin d'entrée principal du dossier

export { XNewsScraper } from './XNewsScraper.js';
export { XFeedParser } from './XFeedParser.js';
export { XScraperService } from './XScraperService.js';

// Barrel principal pour l'importation depuis l'extérieur
export { XFeed, XNewsItem, XScrapingResult } from './interfaces.js';

export { XNewsScraper as XScraperWithEntry } from './XNewsScraper.js';
export { XFeedParser as XFeedParserWithEntry } from './XFeedParser.js';
export { XScraperService as XScraperServiceWithEntry } from './XScraperService.js';
