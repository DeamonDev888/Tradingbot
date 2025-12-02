export interface XFeed {
  title: string;
  xmlUrl: string;
  htmlUrl: string;
}

export interface XNewsItem {
  title: string;
  source: string;
  url: string;
  content?: string;
  sentiment?: string;
  category?: string;
  published_at: string;
  timestamp: Date;
  twitterUrl?: string;
}

export interface XScrapingResult {
  success: boolean;
  items: XNewsItem[];
  errors: string[];
  processedFeeds: number;
  totalItems: number;
}
