import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve('.env');

try {
  const content = fs.readFileSync(envPath, 'utf-8');

  // Clean up: Split by lines, trim, remove empty lines
  let lines = content
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  // Remove any existing DISCORD_TOKEN or DISCORD_CHANNEL_ID lines to avoid duplicates
  lines = lines.filter(
    l => !l.startsWith('DISCORD_TOKEN=') && !l.startsWith('DISCORD_CHANNEL_ID=')
  );

  // Add them back cleanly
  lines.push('DISCORD_TOKEN=YOUR_DISCORD_BOT_TOKEN');
  lines.push('DISCORD_CHANNEL_ID='); // Placeholder

  // Join with proper newlines
  const newContent = lines.join('\n');

  fs.writeFileSync(envPath, newContent, 'utf-8');
  console.log('✅ .env fixed successfully.');
  console.log('Current content preview:');
  console.log(newContent);
} catch (e) {
  console.error('Error fixing .env:', e);
}
