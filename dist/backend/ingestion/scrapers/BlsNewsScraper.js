import { BlsScraper } from '../BlsScraper';
export class BlsNewsScraper {
    blsScraper;
    constructor() {
        this.blsScraper = new BlsScraper();
    }
    async init() {
        await this.blsScraper.init();
    }
    async close() {
        await this.blsScraper.close();
    }
    /**
     * Récupère les dernières données BLS et les convertit en NewsItems
     */
    async fetchNews() {
        try {
            const events = await this.blsScraper.scrapeLatestNumbers();
            return events.map(event => {
                let title = event.event_name;
                // If it doesn't already have a tag, add [ECONOMIC DATA]
                if (!title.startsWith('[')) {
                    title = `[ECONOMIC DATA] ${title}`;
                }
                return {
                    title: title,
                    source: 'BLS',
                    url: 'https://www.bls.gov/',
                    timestamp: new Date(event.release_date),
                    sentiment: 'neutral',
                    content: `Value: ${event.value}. Reference Period: ${event.reference_period}. ${event.change ? `Change: ${event.change}` : ''}`,
                };
            });
        }
        catch (error) {
            console.error('Error fetching BLS data:', error);
            return [];
        }
    }
}
//# sourceMappingURL=BlsNewsScraper.js.map