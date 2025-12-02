import { Guild, GuildMember } from 'discord.js';
import fs from 'fs';

export interface ChannelInfo {
    name: string;
    id: string;
    type: string;
}

export interface MemberInfo {
    username: string;
    id: string;
    discriminator: string;
    nickname?: string;
    joinedAt?: string;
    roles: string[];
}

export interface ServerInfo {
    channels: ChannelInfo[];
    members: MemberInfo[];
    guild: {
        name: string;
        id: string;
    };
}

const filename = 'server_info.toon';

function serializeToToon(info: ServerInfo): string {
    let toon = '';

    // Guild
    toon += `guild{name,id}:\n`;
    toon += `  ${info.guild.name},${info.guild.id}\n\n`;

    // Channels
    toon += `channels[${info.channels.length}]{name,id,type}:\n`;
    for (const ch of info.channels) {
        toon += `  ${ch.name},${ch.id},${ch.type}\n`;
    }
    toon += '\n';

    // Members
    toon += `members[${info.members.length}]{username,id,discriminator,nickname,joinedAt,roles}:\n`;
    for (const mem of info.members) {
        const rolesStr = mem.roles.join(';');  // Use ; for roles since roles can have commas?
        toon += `  ${mem.username},${mem.id},${mem.discriminator},${mem.nickname || ''},${mem.joinedAt || ''},${rolesStr}\n`;
    }

    return toon;
}

function parseFromToon(toon: string): ServerInfo {
    const lines = toon.split('\n').map(l => l.trim()).filter(l => l);
    let guild: {name: string, id: string} = {name: '', id: ''};
    let channels: ChannelInfo[] = [];
    let members: MemberInfo[] = [];
    let currentSection = '';

    for (const line of lines) {
        if (line.startsWith('guild{')) {
            currentSection = 'guild';
        } else if (line.startsWith('channels[')) {
            currentSection = 'channels';
        } else if (line.startsWith('members[')) {
            currentSection = 'members';
        } else if (line.startsWith('  ')) {
            // data line
            const parts = line.substring(2).split(',');
            if (currentSection === 'guild') {
                guild = {name: parts[0], id: parts[1]};
            } else if (currentSection === 'channels') {
                channels.push({name: parts[0], id: parts[1], type: parts[2]});
            } else if (currentSection === 'members') {
                members.push({
                    username: parts[0],
                    id: parts[1],
                    discriminator: parts[2],
                    nickname: parts[3] || undefined,
                    joinedAt: parts[4] || undefined,
                    roles: parts[5] ? parts[5].split(';') : []
                });
            }
        }
    }

    return {guild, channels, members};
}

export function loadServerInfo(): ServerInfo | null {
    if (fs.existsSync(filename)) {
        try {
            const data = fs.readFileSync(filename, 'utf-8');
            const info = parseFromToon(data);
            console.log(`✅ Fichier ${filename} chargé ! (${info.channels.length} channels, ${info.members.length} membres)`);
            return info;
        } catch (error) {
            console.error('Erreur lors du chargement du TOON :', error);
            return null;
        }
    }
    return null;
}

export async function fetchAndSave(guild: Guild): Promise<ServerInfo> {
    console.log(`Analyse du serveur ${guild.name} (ID: ${guild.id})...`);

    const info: ServerInfo = {
        channels: [],
        members: [],
        guild: { name: guild.name, id: guild.id },
    };

    // 1. Channels
    console.log('\n--- CHANNELS ---');
    guild.channels.cache.forEach((channel) => {
        const channelInfo: ChannelInfo = {
            name: channel.name,
            id: channel.id.toString(),
            type: channel.type.toString(),
        };
        info.channels.push(channelInfo);
        console.log(`Channel: ${channelInfo.name} (ID: ${channelInfo.id}, Type: ${channelInfo.type})`);
    });

    // 2. Membres
    console.log('\n--- MEMBRES ---');
    await guild.members.fetch();
    guild.members.cache.forEach((member: GuildMember) => {
        const memberInfo: MemberInfo = {
            username: member.user.username,
            id: member.user.id.toString(),
            discriminator: member.user.discriminator,
            nickname: member.nickname || undefined,
            joinedAt: member.joinedAt ? member.joinedAt.toISOString() : undefined,
            roles: member.roles.cache.map(role => role.id.toString()),
        };
        info.members.push(memberInfo);
        console.log(`Membre: ${memberInfo.username}#${memberInfo.discriminator} (ID: ${memberInfo.id})`);
    });

    // Sauvegarde
    fs.writeFileSync(filename, serializeToToon(info));
    console.log(`\n✅ Données sauvegardées dans ${filename} ! (${info.channels.length} channels, ${info.members.length} membres)`);
    return info;
}

export function getServerInfo(): ServerInfo | null {
    return loadServerInfo();
}

// Fonction pour rafraîchir manuellement (supprime et refetch)
export async function refreshServerInfo(guild: Guild): Promise<ServerInfo> {
    if (fs.existsSync(filename)) {
        fs.unlinkSync(filename);
        console.log('Ancien fichier supprimé, nouveau scan...');
    }
    return await fetchAndSave(guild);
}