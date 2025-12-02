import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';

export interface XFeed {
  title: string;
  xmlUrl: string;
  htmlUrl: string;
}

export function parseOpml(filePath: string): XFeed[] {
  const xml = fs.readFileSync(filePath, 'utf8');
  const $ = cheerio.load(xml, { xmlMode: true });
  const feeds: XFeed[] = [];

  $('outline[type="rss"]').each((_, element) => {
    const title = $(element).attr('text') || '';
    const xmlUrl = $(element).attr('xmlUrl') || '';
    const htmlUrl = $(element).attr('htmlUrl') || '';

    if (xmlUrl) {
      feeds.push({ title, xmlUrl, htmlUrl });
    }
  });

  return feeds;
}
