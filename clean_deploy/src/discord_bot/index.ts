import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import { loadServerInfo, fetchAndSave, getServerInfo, refreshServerInfo } from './serverScanner';  // Import du module

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

let serverInfo: ReturnType<typeof getServerInfo>;  // Type inféré

client.once('ready', async () => {
    console.log(`${client.user?.tag} est connecté !`);

    const guildId = process.env.DISCORD_GUILD_ID;
    if (!guildId) {
        console.error('DISCORD_GUILD_ID manquant dans .env !');
        return;
    }

    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
        console.error(`Serveur avec ID ${guildId} non trouvé !`);
        return;
    }

    // Vérification : Charge si existe, sinon fetch
    serverInfo = loadServerInfo();
    if (!serverInfo) {
        serverInfo = await fetchAndSave(guild);
    } else {
        // Met à jour le nom du guild si changé
        if (serverInfo) serverInfo.guild.name = guild.name;
    }

    // Exemple d'utilisation
    const channelId = process.env.DISCORD_CHANNEL_ID;
    if (channelId && serverInfo) {
        const channel = await client.channels.fetch(channelId);
        if (channel && channel.isTextBased()) {
            await (channel as any).send(`Bot prêt ! ${serverInfo.channels.length} channels et ${serverInfo.members.length} membres connus.`);
        }
    }
});

// Commandes exemple (utilise getServerInfo() pour accéder aux données)
client.on('messageCreate', async (message) => {
    if (message.content === '!scan') {
        if (message.author.id === 'TON_USER_ID_ICI') {  // Remplace par ton ID
            const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID || '');
            if (guild) {
                serverInfo = await refreshServerInfo(guild);
                await message.reply('Scan rafraîchi !');
            }
        }
    }

    if (message.content === '!info') {
        if (fs.existsSync('server_info.toon')) {
            const info = fs.readFileSync('server_info.toon', 'utf-8');
            await message.reply(`Aperçu :\n\`\`\`toon\n${info.substring(0, 1000)}...\n\`\`\``);
        } else {
            await message.reply('Aucune donnée serveur trouvée.');
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
