
import axios from 'axios';

export class NitterManager {
  private static instances = [
    'https://nitter.lucabased.xyz',
    'https://nitter.net',
    'https://nitter.cz',
    'https://nitter.privacydev.net',
    'https://nitter.poast.org',
    'https://xcancel.com'
  ];

  private static workingInstances: string[] = [];
  private static lastCheck = 0;
  private static CHECK_INTERVAL = 1000 * 60 * 60; // 1 hour

  /**
   * Get a list of working Nitter instances, prioritizing the cached ones.
   */
  static async getWorkingInstances(): Promise<string[]> {
    if (this.workingInstances.length > 0 && Date.now() - this.lastCheck < this.CHECK_INTERVAL) {
      return this.workingInstances;
    }

    console.log('🔄 Checking Nitter instances health...');
    const healthy: string[] = [];

    // Prioritize the one we know works
    const priority = 'https://nitter.lucabased.xyz';
    
    // Check priority first
    if (await this.checkInstance(priority)) {
        healthy.push(priority);
    }

    // Check others in parallel
    const checks = this.instances
        .filter(url => url !== priority)
        .map(async (url) => {
            if (await this.checkInstance(url)) {
                healthy.push(url);
            }
        });

    await Promise.all(checks);

    this.workingInstances = healthy;
    this.lastCheck = Date.now();
    
    console.log(`✅ Found ${healthy.length} healthy Nitter instances:`, healthy.join(', '));
    return healthy;
  }

  private static async checkInstance(baseUrl: string): Promise<boolean> {
    try {
      // Check a known stable feed or just the home page
      // Using a specific feed is better to verify RSS functionality
      const testUrl = `${baseUrl}/elonmusk/rss`;
      const response = await axios.get(testUrl, {
        timeout: 5000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        validateStatus: (status) => status === 200
      });
      return response.status === 200 && response.data.includes('<rss');
    } catch (error) {
      return false;
    }
  }

  /**
   * Convert a Twitter/X URL to a Nitter URL using a random healthy instance
   */
  static async convertUrl(originalUrl: string): Promise<string> {
    const instances = await this.getWorkingInstances();
    if (instances.length === 0) {
        throw new Error('No healthy Nitter instances available');
    }

    // Pick a random instance to distribute load
    const instance = instances[Math.floor(Math.random() * instances.length)];
    
    // Extract username from original URL
    // Formats: https://x.com/username, https://twitter.com/username/rss, etc.
    let username = '';
    try {
        const urlObj = new URL(originalUrl);
        const parts = urlObj.pathname.split('/').filter(p => p);
        if (parts.length > 0) {
            username = parts[0];
            // Handle /username/rss
            if (parts[1] === 'rss') {
                // it's already in rss format
            }
        }
    } catch (e) {
        // Fallback for simple strings
        const match = originalUrl.match(/x\.com\/([^\/]+)|twitter\.com\/([^\/]+)/);
        if (match) {
            username = match[1] || match[2];
        }
    }

    if (!username) {
        // Try to parse from existing nitter url
        const match = originalUrl.match(/nitter\.[^/]+\/([^/]+)/);
        if (match) {
            username = match[1];
        }
    }

    if (!username) return originalUrl; // Return original if parsing fails

    return `${instance}/${username}/rss`;
  }
}
