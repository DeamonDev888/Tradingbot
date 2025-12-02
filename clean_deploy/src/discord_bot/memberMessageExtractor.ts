import { Guild, TextChannel, Message } from 'discord.js';
import fs from 'fs';
import path from 'path';

export interface MemberMessage {
    content: string;
    channelId: string;
    channelName: string;
    timestamp: string;
    messageId: string;
}

export interface MemberProfile {
    username: string;
    id: string;
    discriminator: string;
    nickname?: string;
    joinedAt?: string;
    messages: MemberMessage[];
}

export function serializeMemberToToon(profile: MemberProfile): string {
    let toon = '';

    // Member info
    toon += `member{username,id,discriminator,nickname,joinedAt}:\n`;
    toon += `  ${profile.username},${profile.id},${profile.discriminator},${profile.nickname || ''},${profile.joinedAt || ''}\n\n`;

    // Messages
    toon += `messages[${profile.messages.length}]{channelName,channelId,timestamp,content,messageId}:\n`;
    for (const msg of profile.messages) {
        // Échapper les virgules et les retours à la ligne dans le contenu
        const escapedContent = msg.content.replace(/,/g, '\\,').replace(/\n/g, '\\n');
        toon += `  ${msg.channelName},${msg.channelId},${msg.timestamp},${escapedContent},${msg.messageId}\n`;
    }

    return toon;
}

export async function extractMemberMessages(guild: Guild, memberIds: string[]): Promise<Map<string, MemberProfile>> {
    const memberProfiles = new Map<string, MemberProfile>();

    console.log(`🔍 Extraction des messages pour ${memberIds.length} membres...`);

    // Récupérer les informations des membres
    await guild.members.fetch();

    for (const memberId of memberIds) {
        const member = guild.members.cache.get(memberId);
        if (!member) {
            console.log(`❌ Membre ${memberId} non trouvé`);
            continue;
        }

        const profile: MemberProfile = {
            username: member.user.username,
            id: member.user.id,
            discriminator: member.user.discriminator,
            nickname: member.nickname || undefined,
            joinedAt: member.joinedAt?.toISOString() || undefined,
            messages: []
        };

        memberProfiles.set(memberId, profile);
        console.log(`📋 Profil créé pour ${member.user.username}#${member.user.discriminator}`);
    }

    // Scanner tous les canaux textuels
    const textChannels = guild.channels.cache.filter(channel =>
        channel.type === 0 && // TextChannel
        channel.permissionsFor(guild.client.user)?.has(['ViewChannel', 'ReadMessageHistory'])
    ) as any; // Cast to any for TypeScript compatibility

    console.log(`📝 Scan de ${textChannels.size} canaux textuels...`);

    let messageCount = 0;
    for (const channel of textChannels.values()) {
        try {
            console.log(`🔎 Scan du canal: #${channel.name}`);

            const messages = await channel.messages.fetch({ limit: 100 });

            for (const message of messages.values()) {
                if (memberProfiles.has(message.author.id) && !message.author.bot) {
                    const memberMessage: MemberMessage = {
                        content: message.content,
                        channelId: message.channel.id,
                        channelName: (message.channel as any).name || 'unknown',
                        timestamp: message.createdAt.toISOString(),
                        messageId: message.id
                    };

                    memberProfiles.get(message.author.id)!.messages.push(memberMessage);
                    messageCount++;
                }
            }
        } catch (error) {
            console.log(`⚠️ Impossible d'accéder au canal #${channel.name}: ${error}`);
        }
    }

    console.log(`✅ ${messageCount} messages trouvés au total`);
    return memberProfiles;
}

export async function saveMemberProfiles(memberProfiles: Map<string, MemberProfile>, outputDir: string = 'member_profiles'): Promise<void> {
    // Créer le répertoire de sortie s'il n'existe pas
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const [memberId, profile] of memberProfiles) {
        const filename = `${profile.username}_${memberId}.toon`;
        const filepath = path.join(outputDir, filename);

        const toonContent = serializeMemberToToon(profile);
        fs.writeFileSync(filepath, toonContent, 'utf-8');

        console.log(`💾 Fichier sauvegardé: ${filename} (${profile.messages.length} messages)`);
    }
}

export async function createMemberToonFiles(guild: Guild, usernames: string[]): Promise<void> {
    console.log(`🚀 Création des fichiers .toon pour les membres: ${usernames.join(', ')}`);

    // Trouver les IDs des membres à partir de leurs usernames
    await guild.members.fetch();
    const memberIds: string[] = [];

    for (const username of usernames) {
        const member = guild.members.cache.find(m =>
            m.user.username.toLowerCase() === username.toLowerCase() ||
            m.nickname?.toLowerCase() === username.toLowerCase()
        );

        if (member) {
            memberIds.push(member.id);
            console.log(`✅ Membre trouvé: ${member.user.username}#${member.user.discriminator}`);
        } else {
            console.log(`❌ Membre non trouvé: ${username}`);
        }
    }

    if (memberIds.length === 0) {
        console.log('❌ Aucun membre trouvé');
        return;
    }

    // Extraire les messages
    const memberProfiles = await extractMemberMessages(guild, memberIds);

    // Sauvegarder les profils
    await saveMemberProfiles(memberProfiles);

    console.log(`🎉 Fichiers .toon créés avec succès dans le dossier 'member_profiles/'`);
}