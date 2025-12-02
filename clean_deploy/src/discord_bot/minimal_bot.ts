#!/usr/bin/env node

import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const PID_FILE = path.join(process.cwd(), 'bot.pid');

function killPreviousInstance() {
  if (fs.existsSync(PID_FILE)) {
    try {
      const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8'));
      if (pid && pid !== process.pid) {
        console.log(`🛑 Killing previous instance (PID: ${pid})...`);
        try {
          process.kill(pid, 'SIGKILL'); // Force kill
          console.log('✅ Previous instance killed.');
        } catch (e) {
          if ((e as any).code === 'ESRCH') {
            console.log('⚠️ Previous instance not found (stale PID file).');
          } else {
            console.error('❌ Failed to kill previous instance:', e);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error reading PID file:', error);
    }
  }

  try {
    fs.writeFileSync(PID_FILE, process.pid.toString());
    console.log(`📝 PID file created (PID: ${process.pid})`);
  } catch (error) {
    console.error('❌ Failed to write PID file:', error);
  }
}

// Kill previous instance before doing anything else
killPreviousInstance();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  const asciiArt = `
   _______
  /       \\
 /  🤖 BOT  \\
| FINANCIAL |
 \\ ANALYST /
  \\_______/
  `;
  console.log(asciiArt);
  console.log(`🤖 Discord Bot logged in as ${client.user?.tag}`);
  console.log('📊 Bot started successfully in minimal mode!');
});

// Basic message handling
client.on('messageCreate', async message => {
  if (message.author.bot) return;

  console.log(
    `📩 Message received: "${message.content}" from ${message.author.tag} in ${message.channelId}`
  );

  // Simple ping command
  if (message.content.trim().toLowerCase() === '!ping') {
    await message.reply('🏓 Pong!');
  }

  // Help command
  if (message.content.trim().toLowerCase() === '!help') {
    await message.reply(
      '🤖 **Minimal Financial Analyst Bot**\n\nCommands:\n• `!ping` - Test bot connectivity\n• `!help` - Show this help\n\n*Minimal mode - agents and scrapers are disabled*'
    );
  }
});

// Error handling
client.on('error', error => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down bot...');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down bot...');
  client.destroy();
  process.exit(0);
});

// Start the bot
async function startBot() {
  try {
    const token = process.env.DISCORD_TOKEN;
    if (!token) {
      throw new Error('DISCORD_TOKEN not found in environment variables');
    }

    await client.login(token);
  } catch (error) {
    console.error('Failed to start bot:', error);
    process.exit(1);
  }
}

// Bootstrap
console.log('🚀 Starting minimal bot...');
startBot();
