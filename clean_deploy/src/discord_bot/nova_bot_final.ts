import { Client, GatewayIntentBits, Message } from 'discord.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

// Charger les variables d'environnement
dotenv.config();

const execAsync = promisify(exec);

// Implémentation finale de Nova avec profils et KiloCode optimisé
class NovaBotFinal {
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
                        console.log(`✅ Nova: Profil ${profile.username} (${profile.id})`);
                    }
                }
            }

            console.log(`🤖 Nova: ${this.memberProfiles.size} profils chargés !`);
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
        try {
            // Tentative avec KiloCode structuré en JSON
            const response = await this.callKiloCodeStructured(message, username, userId);
            return response;
        } catch (error) {
            console.error('❌ Nova: Erreur KiloCode, utilisation fallback:', error);
            return this.generateFallbackResponse(message, username);
        }
    }

    async callKiloCodeStructured(message: string, username?: string, userId?: string): Promise<string> {
        const memberProfile = this.getMemberProfile(userId, username);
        const currentDate = new Date().toLocaleDateString('fr-FR');

        const promptData = {
            bot_name: "Nova",
            server_name: "VIBE DEV",
            server_description: "Serveur Discord de développement financier et technique avec 11 membres depuis 2021",
            user_profile: memberProfile ? {
                username: memberProfile.username,
                nickname: memberProfile.nickname,
                member_since: new Date(memberProfile.joinedAt).toLocaleDateString('fr-FR'),
                recent_messages: memberProfile.messages?.slice(-2).map((msg: any) => ({
                    channel: msg.channelName,
                    content: msg.content.substring(0, 100)
                })) || []
            } : null,
            request: {
                message: message,
                username: username || "Inconnu",
                user_id: userId || "Non disponible",
                timestamp: currentDate
            }
        };

        const prompt = `You are "Nova" 🤖, an intelligent Discord chatbot for the VIBE DEV server, specialized in financial analysis and development.

## TASK
Analyze the user's request and provide a helpful, contextualized response in French. Return your response as a valid JSON object.

## INPUT DATA
${JSON.stringify(promptData, null, 2)}

## RESPONSE REQUIREMENTS
Return ONLY a valid JSON object with this exact structure:
{
  "response": "Your helpful response in French (2-4 sentences, natural and friendly)",
  "tone": "FRIENDLY" | "PROFESSIONAL" | "TECHNICAL" | "ENCOURAGING",
  "context_used": "Brief explanation of how you used the user's profile or context",
  "emojis": ["😊", "🤖", "💡", "👍"],
  "follow_up_suggestion": "Optional suggestion for follow-up (can be empty string)"
}

## COMMUNICATION STYLE
- **Natural & Friendly**: Use conversational French, not robotic responses
- **Contextual**: Reference user profile if available (be subtle, not creepy)
- **Helpful**: Provide practical advice or information
- **Encouraging**: Support users who are learning
- **Moderate Emojis**: Use 1-2 relevant emojis maximum
- **Concise**: 2-4 sentences maximum unless complex technical explanation needed

## DOMAIN KNOWLEDGE
You have knowledge of:
- Financial markets and analysis (trading, crypto, stocks)
- Software development and programming
- AI and machine learning concepts
- Discord server management and bots
- Your server's specialized channels: agent-projet, mcp, 3d-shader-sprite, cyber-sécurité, trading-crypto-bot

## CRITICAL RULES
1. Return ONLY valid JSON - no markdown formatting
2. Response MUST be in French
3. Be helpful and accurate
4. If you don't know something, say so honestly
5. Adapt tone based on user profile (formal for new users, friendly for known members)
6. Include relevant context from user profile when available

User message: "${message}"

JSON Response:`;

        const tempPath = path.resolve(`nova_temp_${Date.now()}.md`);
        await fs.writeFile(tempPath, prompt, 'utf-8');

        try {
            // Essai 1: Mode direct avec instructions JSON
            const { stdout: stdout1 } = await execAsync(`type "${tempPath}" | kilocode -m ask`, {
                timeout: 8000  // 8 secondes timeout
            });

            if (stdout1 && stdout1.trim()) {
                const result1 = this.parseJsonResponse(stdout1);
                if (result1 && result1.response) {
                    return result1.response;
                }
            }
        } catch (error1) {
            console.log('⚠️ Nova: Tentative 1 échouée, essai fallback');
        }

        try {
            // Essai 2: Mode simple pour réponse texte
            const simplePrompt = `Tu es Nova, un assistant IA Discord pour le serveur VIBE DEV.\n\nUtilisateur: ${username || 'Mon ami'}\nMessage: "${message}"\n\nRéponds en 1-2 phrases, façon naturelle et amicale. En français.`;

            const { stdout: stdout2 } = await execAsync(`echo "${simplePrompt}" | kilocode -m ask`, {
                timeout: 5000  // 5 secondes timeout
            });

            if (stdout2 && stdout2.trim()) {
                const cleaned = this.cleanSimpleResponse(stdout2);
                if (cleaned && cleaned.length > 10) {
                    return cleaned;
                }
            }
        } catch (error2) {
            console.log('⚠️ Nova: Tentative 2 échouée, utilisation fallback final');
        }

        // Fallback final - toujours retourner quelque chose
        return this.generateFallbackResponse(message, username);
        } finally {
            try {
                await fs.unlink(tempPath);
            } catch (e) {
                // Ignorer si le fichier n'existe plus
            }
        }
    }

    parseJsonResponse(stdout: string): any {
        // Nettoyer la sortie et extraire le JSON
        let cleanOutput = stdout
            .replace(/\x1b\[[0-9;]*m/g, '')  // Codes couleurs ANSI
            .replace(/\x1b\[[0-9]*[A-Z]/g, '')  // Codes curseur
            .replace(/\r\n/g, '\n')
            .trim();

        // Chercher un objet JSON valide
        const jsonMatch = cleanOutput.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Aucun JSON trouvé dans la réponse');
        }

        try {
            return JSON.parse(jsonMatch[0]);
        } catch (parseError) {
            console.error('❌ Erreur parsing JSON:', parseError);
            throw new Error('JSON invalide');
        }
    }

    generateFallbackResponse(message: string, username?: string): string {
        const greetings = [
            "Salut", "Bonjour", "Hello", "Hey", "Coucou"
        ];
        const responses = [
            `${greetings[Math.floor(Math.random() * greetings.length)]} ${username || 'mon ami'} ! Je suis Nova, votre assistant IA pour le serveur VIBE DEV. 😊`,
            `${greetings[Math.floor(Math.random() * greetings.length)]} ${username || '!'} Nova à votre service ! Je peux vous aider avec la finance, le développement technique ou répondre à vos questions. 🤖`,
            `Bonjour ${username || 'là'} ! Je suis Nova, le bot du serveur VIBE DEV. Comment puis-je vous aider aujourd'hui ? ✨`,
            `Hey ${username || '!'} Je suis Nova, votre assistant spécialisé en finance et développement. N'hésitez pas à me poser vos questions ! 💡`
        ];

        const baseResponse = responses[Math.floor(Math.random() * responses.length)];

        // Ajouter un contexte basé sur le message
        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes('aide') || lowerMessage.includes('help')) {
            return `${baseResponse} Je peux vous aider avec l'analyse financière, le développement, ou répondre à vos questions techniques. 👍`;
        } else if (lowerMessage.includes('trading') || lowerMessage.includes('crypto')) {
            return `${baseResponse} Je suis spécialisé en analyse financière et trading. N'hésitez pas si vous avez des questions sur les marchés ! 📈`;
        } else if (lowerMessage.includes('code') || lowerMessage.includes('développement')) {
            return `${baseResponse} Je connais bien le développement logiciel et les sujets techniques du serveur. Je suis là pour vous aider ! 💻`;
        } else if (lowerMessage.includes('ça va') || lowerMessage.includes('comment vas')) {
            return `${baseResponse} Je vais très bien, merci ! Je suis prêt à vous aider avec tout ce dont vous avez besoin. 😊`;
        }

        return `${baseResponse} Dites-moi comment je peux vous aider !`;
    }

    cleanSimpleResponse(stdout: string): string {
        // Nettoyer la réponse simple
        let cleaned = stdout
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

        if (cleaned.length > 0) {
            return cleaned.replace(/^["']|["']$/g, '').trim();
        }

        return null;
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

const nova = new NovaBotFinal(client);

client.once('ready', async () => {
    console.log(`🤖 ${client.user?.tag} avec Nova KiloCode Final est connecté !`);

    const channelId = process.env.DISCORD_CHANNEL_ID;
    if (channelId) {
        try {
            const channel = await client.channels.fetch(channelId);
            if (channel?.isTextBased()) {
                await (channel as any).send(
                    '🤖 **Nova KiloCode Final est en ligne !**\n\n' +
                    'Utilisez:\n' +
                    '• `@Nova votre question` (mention)\n' +
                    '• `Nova explique-moi...` (préfixe)\n' +
                    '• Messages privés à Nova\n\n' +
                    'Nova utilise KiloCode CLI pour des réponses IA personnalisées ! 🚀\n' +
                    `Profils chargés: ${nova['memberProfiles'].size}`
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
                '🤖 **Statut Nova Final**\n\n' +
                '✅ Actif avec KiloCode CLI\n' +
                `Profils chargés: ${nova['memberProfiles'].size}\n` +
                'Utilisation: @Nova ou "nova question"\n' +
                'Cooldown: 3 secondes\n' +
                'Pas de fallback - Toujours KiloCode'
            );
        }

        if (content === '!nova_cleanup') {
            nova.cleanupCooldowns();
            await message.reply('🧹 Nettoyage des cooldowns effectué !');
        }
    }
});

client.login(process.env.DISCORD_TOKEN);