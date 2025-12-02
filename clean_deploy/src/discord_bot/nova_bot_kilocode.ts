import { Client, GatewayIntentBits, Message } from 'discord.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Simple implémentation de Nova avec profils et KiloCode
class NovaKiloCodeBot {
    private client: Client;
    private cooldowns: Map<string, number> = new Map();
    private memberProfiles: Map<string, any> = new Map();

    constructor(client: Client) {
        this.client = client;
        this.loadMemberProfiles();
    }

    async loadMemberProfiles() {
        try {
            const profilesDir = path.resolve("member_profiles");
            const files = await fs.readdir(profilesDir);

            for (const file of files) {
                if (file.endsWith('.toon')) {
                    const filePath = path.join(profilesDir, file);
                    const content = await fs.readFile(filePath, 'utf-8');
                    const profile = this.parseProfileContent(content, file);
                    if (profile && profile.username) {
                        this.memberProfiles.set(profile.id, profile);
                        console.log(`✅ Nova: Profil chargé ${profile.username} (${profile.id})`);
                    }
                }
            }

            console.log(`🤖 Nova: ${this.memberProfiles.size} profils chargés avec succès !`);
        } catch (error) {
            console.warn("⚠️ Nova: Impossible de charger les profils:", error);
        }
    }

    parseProfileContent(content: string, filename: string): any {
        try {
            const profile: any = {};

            // Parser la ligne member{}
            const memberMatch = content.match(/member\s*\{[^:]*:?\s*([^,]+),([^,]+),([^,]*),([^,]*),([^}]*)\}/);
            if (memberMatch) {
                profile.username = memberMatch[1]?.trim() || '';
                profile.id = memberMatch[2]?.trim() || '';
                profile.discriminator = memberMatch[3]?.trim() || '0';
                profile.nickname = memberMatch[4]?.trim() || undefined;
                profile.joinedAt = memberMatch[5]?.trim() || '';
            }

            // Extraire l'ID depuis le nom de fichier si non trouvé
            const idMatch = filename.match(/_(\d+)_?/);
            if (idMatch && (!profile.id || profile.id === '')) {
                profile.id = idMatch[1];
            }

            // Parser les messages (simple)
            const messages = [];
            const messageMatches = content.matchAll(/messages\[\d+\]\{[^}]*\}/g);
            for (const match of messageMatches) {
                const msgContent = match[0];
                const parts = msgContent.match(/([^,]+)/g);
                if (parts && parts.length >= 5) {
                    messages.push({
                        channelName: parts[0]?.split(':')[1]?.trim() || '',
                        content: parts[3]?.split(':')[1]?.trim() || ''
                    });
                }
            }

            if (messages.length > 0) {
                profile.messages = messages;
                profile.lastMessage = messages[messages.length - 1]?.content || '';
            }

            return profile.id ? profile : null;
        } catch (error) {
            console.warn(`⚠️ Nova: Erreur parsing ${filename}:`, error);
            return null;
        }
    }

    getMemberProfile(userId?: string, username?: string): any {
        if (userId && this.memberProfiles.has(userId)) {
            return this.memberProfiles.get(userId);
        }

        for (const profile of this.memberProfiles.values()) {
            if (profile.username === username) {
                return profile;
            }
        }

        return null;
    }

    async handleMessage(message: Message): Promise<boolean> {
        if (message.author.bot) return false;

        const isMentioned = message.mentions.has(this.client.user!);
        const isDM = message.channel.type === 1;
        const hasNovaPrefix = message.content.toLowerCase().includes('nova');

        if (!isMentioned && !isDM && !hasNovaPrefix) return false;

        // Cooldown
        const userId = message.author.id;
        const now = Date.now();
        const lastUsed = this.cooldowns.get(userId) || 0;

        if (now - lastUsed < 3000) {
            const remainingTime = Math.ceil((3000 - (now - lastUsed)) / 1000);
            await message.reply(`⏳ Attends ${remainingTime}s avant de me redemander !`);
            return true;
        }

        this.cooldowns.set(userId, now);

        // Traiter la demande
        const cleanContent = this.cleanMessage(message.content, isMentioned);

        if (!cleanContent.trim()) {
            await message.reply('Salut ! Comment puis-je t\'aider ? 😊');
            return true;
        }

        try {
            const response = await this.generateResponse(cleanContent, message.author.username, userId);
            await message.reply(response);
        } catch (error) {
            console.error('❌ Nova: Erreur traitement message:', error);
            await message.reply('Désolé, j\'ai eu un petit souci technique... Réessaie plus tard ! 🤖');
        }

        return true;
    }

    cleanMessage(content: string, wasMentioned: boolean): string {
        let cleaned = content;

        if (wasMentioned) {
            cleaned = cleaned.replace(/<@!?\d+>/g, '').trim();
        }

        cleaned = cleaned.replace(/nova\s*/gi, '').trim();
        return cleaned;
    }

    async generateResponse(message: string, username?: string, userId?: string): Promise<string> {
        const memberProfile = this.getMemberProfile(userId, username);
        const bufferPath = path.resolve("nova_buffer.md");
        const bufferContent = `# Nova - Assistant Discord VIBE DEV

Tu es "Nova" 🤖, l'assistant IA amical et intelligent pour le serveur Discord VIBE DEV.

${this.createProfileContext(memberProfile)}

## Message de l'utilisateur
"${message}"

## Instructions de réponse
- Réponds de manière naturelle, amicale et conversationnelle
- Sois utile et pertinent
- Si tu connais l'utilisateur, référence subtilement son profil
- Longueur: 2-4 phrases maximum
- Ton: Amical et accessible
- Utilise des emojis modérés
- Pas de formatage markdown complexe

Réponds directement sans artifices:
`;

        await fs.writeFile(bufferPath, bufferContent, 'utf-8');

        try {
            const { stdout } = await execAsync(`type "${bufferPath}" | kilocode -m ask --auto`, {
                timeout: 30000
            });

            return this.parseKiloCodeResponse(stdout);
        } catch (error) {
            console.error('❌ Nova: Erreur KiloCode:', error);

            // Pas de fallback - toujours utiliser KiloCode
            throw error;
        } finally {
            try {
                await fs.unlink(bufferPath);
            } catch (e) {
                // Ignorer si le fichier n'existe plus
            }
        }
    }

    createProfileContext(profile: any): string {
        if (!profile) return "## Utilisateur\nNouvel utilisateur ou profil non identifié";

        const recentMessages = profile.messages && profile.messages.length > 0
            ? profile.messages.slice(-2).map((msg: any) => `• ${msg.channelName}: "${msg.content}"`).join('\n')
            : "aucun message récent";

        return `## Profil Utilisateur Connu
**Pseudo**: ${profile.username}${profile.nickname ? ` (${profile.nickname})` : ''}
**Membre depuis**: ${new Date(profile.joinedAt).toLocaleDateString('fr-FR')}
**Messages récents**:
${recentMessages}`;
    }

    parseKiloCodeResponse(stdout: string): string {
        // Enlever les codes de contrôle et séquences ANSI
        let cleanOutput = stdout
            .replace(/\x1b\[[0-9;]*m/g, '')  // Codes couleurs
            .replace(/\x1b\[[0-9]*[A-Z]/g, '')  // Codes curseur
            .replace(/\r\n/g, '\n')  // Normaliser les fins de ligne
            .split('\n')
            .filter(line => line.trim() &&
                        !line.includes('API Request') &&
                        !line.includes('Reasoning') &&
                        !line.includes('Understanding') &&
                        !line.includes('##') &&
                        !line.startsWith('*') &&
                        !/^[A-Z]{2,}$/.test(line.trim()) &&
                        !line.includes('The task is') &&
                        !line.includes('Nova - Assistant') &&
                        !line.includes('Message de l\'utilisateur'))
            .join('\n')
            .trim();

        // Chercher des phrases naturelles
        const naturalPhrases = cleanOutput
            .split('\n')
            .filter(line => {
                const trimmed = line.trim();
                return trimmed.length > 10 &&
                       !trimmed.includes('Reasoning') &&
                       !trimmed.includes('API Request') &&
                       !trimmed.includes('Understanding') &&
                       !trimmed.includes('##') &&
                       !trimmed.startsWith('*') &&
                       !/^[A-Z]{2,}$/.test(trimmed) &&
                       !trimmed.includes('The task is') &&
                       !trimmed.includes('Nova - Assistant') &&
                       !trimmed.includes('Message de l\'utilisateur');
            });

        if (naturalPhrases.length > 0) {
            return naturalPhrases[0].replace(/^["']|["']$/g, '').trim();
        }

        // Fallback: chercher une phrase complète
        const sentences = cleanOutput.match(/[^.!?]+[.!?]/g);
        if (sentences && sentences.length > 0) {
            return sentences[0].trim();
        }

        return "Désolé, je n'ai pas pu traiter ta demande. Peux-tu reformuler ? 🤖";
    }

    // Nettoyer les anciens cooldowns
    cleanupCooldowns() {
        const now = Date.now();
        for (const [userId, timestamp] of this.cooldowns.entries()) {
            if (now - timestamp > 60000) { // Plus d'une minute
                this.cooldowns.delete(userId);
            }
        }
    }
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const nova = new NovaKiloCodeBot(client);

client.once('ready', async () => {
    console.log(`🤖 ${client.user?.tag} avec Nova KiloCode est connecté !`);

    const channelId = process.env.DISCORD_CHANNEL_ID;
    if (channelId) {
        try {
            const channel = await client.channels.fetch(channelId);
            if (channel?.isTextBased()) {
                await (channel as any).send(
                    '🤖 **Nova avec KiloCode est en ligne !**\n\n' +
                    'Utilisez:\n' +
                    '• `@Nova votre question`\n' +
                    '• `Nova explique-moi...`\n' +
                    '• Messages privés à Nova\n\n' +
                    'Nova utilise KiloCode CLI pour des réponses IA personnalisées ! 🚀'
                );
            }
        } catch (error) {
            console.error('❌ Erreur message ready:', error);
        }
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Commandes existantes
    if (message.content === '!ping') {
        await message.reply('🏓 Pong !');
        return;
    }

    // Laisser Nova gérer les messages
    const handled = await nova.handleMessage(message);
    if (handled) return;

    // Commandes admin
    if (message.author.id === process.env.ADMIN_USER_ID) {
        const content = message.content.toLowerCase();

        if (content === '!nova_status') {
            await message.reply(
                '🤖 **Statut Nova KiloCode**\n\n' +
                '✅ Actif avec KiloCode CLI\n' +
                `Profils chargés: ${nova['memberProfiles'].size}\n` +
                'Utilisation: @Nova ou "nova question"\n' +
                'Cooldown: 3 secondes'
            );
        }

        if (content === '!nova_cleanup') {
            nova.cleanupCooldowns();
            await message.reply('🧹 Nettoyage des cooldowns effectué !');
        }
    }
});

client.login(process.env.DISCORD_TOKEN);