import { Client, GatewayIntentBits } from 'discord.js';

console.log("🧪 Testing Discord Token...");

const token = 'YOUR_DISCORD_BOT_TOKEN';
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on('ready', () => {
  console.log(`✅ SUCCESS! Logged in as ${client.user?.tag}`);
  client.destroy();
  process.exit(0);
});

client.login(token).catch(error => {
    console.error("❌ FAILURE: Token rejected.");
    console.error(error);
    process.exit(1);
});
