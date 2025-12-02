import { BaseAgentSimple } from "./BaseAgentSimple";
import * as fs from "fs/promises";
import * as path from "path";

interface MemberProfile {
  username: string;
  id: string;
  discriminator: string;
  nickname?: string;
  joinedAt: string;
  messages?: Array<{
    channelName: string;
    channelId: string;
    timestamp: string;
    content: string;
    messageId: string;
  }>;
  extended_conversations?: any;
  key_developments?: any;
  skills_and_interests?: any;
  personality_traits?: any;
  challenges_identified?: any;
  future_prospects?: any;
}

interface ChatRequest {
  message: string;
  userId?: string;
  username?: string;
  channelId?: string;
}

export class DiscordChatBotAgent extends BaseAgentSimple {
  private memberProfiles: Map<string, MemberProfile> = new Map();

  constructor() {
    super("discord-chatbot");
    this.loadMemberProfiles();
  }

  private async loadMemberProfiles() {
    try {
      const profilesDir = path.resolve("member_profiles");
      const files = await fs.readdir(profilesDir);

      for (const file of files) {
        if (file.endsWith('.toon')) {
          const filePath = path.join(profilesDir, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const profile = this.parseProfileContent(content, file);
          if (profile) {
            this.memberProfiles.set(profile.id, profile);
          }
        }
      }

      console.log(`✅ Chargé ${this.memberProfiles.size} profils membres`);
    } catch (error) {
      console.warn("⚠️ Impossible de charger les profils membres:", error);
    }
  }

  private parseProfileContent(content: string, filename: string): MemberProfile | null {
    try {
      const lines = content.split('\n');
      const profile: Partial<MemberProfile> = {};

      // Parser les informations de base
      for (const line of lines) {
        if (line.startsWith('member{')) {
          const memberInfo = line.match(/member\{[^:]*:[^,]*,([^,]+),([^,]*),([^,]*),([^}]*)\}/);
          if (memberInfo) {
            profile.username = memberInfo[1]?.trim() || '';
            profile.id = memberInfo[2]?.trim() || '';
            profile.discriminator = memberInfo[3]?.trim() || '0';
            profile.nickname = memberInfo[4]?.trim() || undefined;
            profile.joinedAt = memberInfo[5]?.trim() || '';
          }
        }
      }

      // Extraire l'ID depuis le nom de fichier
      const idMatch = filename.match(/_(\d+)_?/);
      if (idMatch && !profile.id) {
        profile.id = idMatch[1];
      }

      return profile as MemberProfile;
    } catch (error) {
      console.warn(`⚠️ Erreur parsing fichier ${filename}:`, error);
      return null;
    }
  }

  async chat(request: ChatRequest): Promise<string> {
    // 1. Récupérer le profil du membre
    const memberProfile = this.getMemberProfile(request.userId, request.username);

    // 2. Créer le prompt personnalisé
    const prompt = this.createPersonalizedPrompt(request, memberProfile);

    // 3. Envoyer à KiloCode via BaseAgentSimple
    try {
      const response = await this.callKiloCode({
        prompt,
        outputFile: 'discord_chat_response.md'
      });

      // Parser la réponse - pour le chatbot, on veut du texte pas du JSON
      return this.parseChatResponse(response);
    } catch (error) {
      console.error("❌ Erreur chatbot:", error);
      return "Désolé, j'ai eu un petit souci technique... Peux-tu reformuler ta question ? 🤖";
    }
  }

  private getMemberProfile(userId?: string, username?: string): MemberProfile | null {
    if (userId && this.memberProfiles.has(userId)) {
      return this.memberProfiles.get(userId)!;
    }

    // Fallback par username
    for (const profile of this.memberProfiles.values()) {
      if (profile.username === username) {
        return profile;
      }
    }

    return null;
  }

  private createPersonalizedPrompt(request: ChatRequest, profile: MemberProfile | null): string {
    const currentDate = new Date().toLocaleDateString('fr-FR');

    let profileContext = "";
    if (profile) {
      profileContext = `
## 👤 PROFIL UTILISATEUR CONNU
**Nom**: ${profile.username}${profile.nickname ? ` (${profile.nickname})` : ''}
**Membre depuis**: ${new Date(profile.joinedAt).toLocaleDateString('fr-FR')}
**Discriminator**: ${profile.discriminator}

${profile.messages && profile.messages.length > 0 ? `
**Derniers messages connus**:
${profile.messages.slice(-3).map(msg =>
  `• ${new Date(msg.timestamp).toLocaleDateString('fr-FR')}: ${msg.content.substring(0, 100)}...`
).join('\n')}
` : ''}
`;
    } else {
      profileContext = `
## 👤 UTILISATEUR NON RÉFÉRENCÉ
**Username**: ${request.username || 'Inconnu'}
**User ID**: ${request.userId || 'Non disponible'}
`;
    }

    return `
You are "Nova" 🤖, an intelligent Discord chatbot for the VIBE DEV server. You have access to member profiles and adapt your responses based on who you're talking to.

${profileContext}

## 📋 CONTEXTE DE LA CONVERSATION
**Date**: ${currentDate}
**Channel ID**: ${request.channelId || 'Non spécifié'}
**Message de l'utilisateur**: "${request.message}"

## 🎯 TON PERSONNALITÉ ET RÈGLES

### Style de communication:
- **Amical et accessible**: Utilise des emojis modérés 😊
- **Intelligent mais pas arrogant**: Montre ton expertise sans donner de leçons
- **Contextualisé**: Adapte tes réponses selon le profil de l'utilisateur
- **Humain**: Utilise un langage naturel, évite les réponses robotiques

### Connaissance du serveur:
- Le serveur s'appelle "VIBE DEV"
- 11 membres depuis janvier 2021
- Plusieurs channels techniques: agent-projet, mcp, 3d-shader-sprite, cyber-sécurité, trading-crypto-bot, etc.
- Atmosphère de développement et d'apprentissage

### Règles importantes:
1. **Personnalisation**: Si tu connais l'utilisateur, référence ses intérêts ou conversations passées de manière subtile
2. **Technique**: Pour les questions de code, donne des réponses pratiques avec des exemples
3. **Encourageant**: Sois supportive, surtout pour ceux qui apprennent
4. **Humble**: N'hésite pas à dire quand tu ne sais pas
5. **Concis**: Va droit au but mais sois complet

## 💡 RÉPONSE ATTENDUE
Réponds au message de l'utilisateur de manière naturelle et personnalisée. Sois utile, amical et adapté au contexte technique du serveur.

**Message utilisateur**: "${request.message}"

Ta réponse (naturelle, pas de formatage spécial):
`;
  }

  private parseChatResponse(response: unknown): string {
    // Si la réponse est un objet, essayer d'extraire du texte
    if (typeof response === 'object' && response !== null) {
      const resp = response as Record<string, unknown>;

      // Chercher du texte dans différentes propriétés possibles
      const textSources = [
        resp.content,
        resp.text,
        resp.response,
        resp.message,
        resp.summary,
        resp.completion,
      ];

      for (const source of textSources) {
        if (typeof source === 'string' && source.trim().length > 0) {
          return this.cleanTextResponse(source);
        }
      }

      // Si c'est du JSON mais pas de texte, retourner une réponse par défaut
      return "Salut ! J'ai bien reçu ton message. Comment puis-je t'aider aujourd'hui ? 😊";
    }

    // Si la réponse est une chaîne, la nettoyer
    if (typeof response === 'string') {
      return this.cleanTextResponse(response);
    }

    // Fallback
    return "Salut ! Comment puis-je t'aider aujourd'hui ? 😊";
  }

  private cleanTextResponse(text: string): string {
    // Nettoyer les artifacts de KiloCode
    let cleaned = text
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
      .replace(/^[^a-zA-ZÀ-ÿ]*/, '') // Enlever les caractères non-texte au début
      .trim();

    // Si la réponse est vide ou trop courte après nettoyage
    if (cleaned.length < 5) {
      return "Salut ! Comment puis-je t'aider aujourd'hui ? 😊";
    }

    return cleaned;
  }

  // Méthode utilitaire pour chat rapide
  async quickChat(message: string, username?: string): Promise<string> {
    return await this.chat({
      message,
      username
    });
  }

  // Méthode pour lister les profils chargés
  getLoadedProfiles(): string[] {
    return Array.from(this.memberProfiles.values()).map(p =>
      `${p.username}${p.nickname ? ` (${p.nickname})` : ''}`
    );
  }
}