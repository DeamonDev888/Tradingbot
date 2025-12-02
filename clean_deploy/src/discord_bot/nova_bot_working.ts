import { Client, GatewayIntentBits, Message } from 'discord.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

dotenv.config();

// Simple implémentation de Nova sans dépendances complexes
class SimpleNovaBot {
    private client: Client;
    private cooldowns: Map<string, number> = new Map();

    constructor(client: Client) {
        this.client = client;
    }

    async handleMessage(message: Message): Promise<boolean> {
        if (message.author.bot) return false;

        const isMentioned = message.mentions.has(this.client.user!);
        const isDM = message.channel.type === 1; // DM channel
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
            const response = await this.generateResponse(cleanContent);
            await message.reply(response);
        } catch (error) {
            console.error('❌ Erreur Nova:', error);
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

    async generateResponse(message: string): Promise<string> {
        const bufferPath = path.resolve("nova_buffer.md");
        const bufferContent = `# Nova - Assistant Discord VIBE DEV

Tu es "Nova" 🤖, l'assistant IA amical et intelligent pour le serveur Discord VIBE DEV.

## Message de l'utilisateur
"${message}"

## Instructions de réponse
- Réponds de manière naturelle, amicale et conversationnelle
- Sois utile et pertinent
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
            console.error('❌ Erreur KiloCode:', error);

            // Fallback en cas d'erreur KiloCode
            const fallbacks = [
                `Je vois que tu demandes: "${message}". Je suis là pour t'aider ! 😊`,
                'Comment puis-je t\'aider aujourd\'hui ?',
                'Intéressante question ! Laisse-moi y réfléchir...',
                'Je suis Nova, ton assistant pour VIBE DEV !',
                'Je peux t\'aider avec ça ! Explique-moi ce que tu veux savoir.',
            ];

            if (message.toLowerCase().includes('aide')) {
                return 'Bien sûr ! Je suis là pour répondre à tes questions. Sur quoi veux-tu de l\'aide ? 😊';
            }

            if (message.toLowerCase().includes('comment') || message.toLowerCase().includes('ça va')) {
                return 'Salut ! Je vais très bien, merci ! Et toi ? Je suis prêt à t\'aider ! 🤖';
            }

            if (message.toLowerCase().includes('formation')) {
                return 'La formation est un investissement important ! Si tu es en BTS SIO comme jul0018, tu es sur la bonne voie pour la cybersécurité. N\'hésite pas si tu as des questions spécifiques !';
            }

            if (message.toLowerCase().includes('react') || message.toLowerCase().includes('javascript')) {
                return 'React est une bibliothèque JavaScript géniale pour créer des interfaces ! Elle utilise des composants réutilisables et un état géré. Veux-tu que je t\'explique un concept particulier ?';
            }

            return fallbacks[Math.floor(Math.random() * fallbacks.length)];
        } finally {
            try {
                await fs.unlink(bufferPath);
            } catch (e) {
                // Ignorer si le fichier n'existe plus
            }
        }
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
                       !trimmed.includes('The task is');
            });

        if (naturalPhrases.length > 0) {
            return naturalPhrases[0].replace(/^["']|["']$/g, '').trim();
        }

        // Fallback: chercher une phrase complète
        const sentences = cleanOutput.match(/[^.!?]+[.!?]/g);
        if (sentences && sentences.length > 0) {
            return sentences[0].trim();
        }

        // Dernier fallback
        const fallbacks = [
            'Je suis là pour t\'aider ! 😊',
            'Comment puis-je t\'aider aujourd\'hui ?',
            'N\'hésite pas si tu as des questions !',
            'Je suis prêt à répondre à tes questions !'
        ];

        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const nova = new SimpleNovaBot(client);

client.once('ready', async () => {
    console.log(`🤖 ${client.user?.tag} avec Nova est connecté !`);

    const channelId = process.env.DISCORD_CHANNEL_ID;
    if (channelId) {
        try {
            const channel = await client.channels.fetch(channelId);
            if (channel?.isTextBased()) {
                await (channel as any).send(
                    '🤖 **Nova est en ligne !**\n\n' +
                    'Utilisez:\n' +
                    '• `@Nova votre question`\n' +
                    '• `Nova explique-moi...`\n' +
                    '• Messages privés à Nova\n\n' +
                    'Nova est prêt à vous aider ! 😊'
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
                '🤖 **Statut Nova**\n\n' +
                '✅ Actif et prêt à répondre !\n' +
                'Utilisation: @Nova ou "nova question"\n' +
                'Cooldown: 3 secondes'
            );
        }
    }
});

client.login(process.env.DISCORD_TOKEN);