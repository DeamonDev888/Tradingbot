/**
   * Formate un message Discord
   */
  formatDiscordMessage(item) {
    const emoji = this.getCategoryEmoji(item.category);
    const scoreColor = this.getScoreColor(item.score);
    const title = item.title.length > 100 ? item.title.substring(0, 97) + '...' : item.title;

    // Créer l'URL fixup.cx à partir de l'URL existante ou utiliser un ID
    const fixupUrl = this.createFixupUrl(item);

    // Construire le message ligne par ligne pour éviter les erreurs
    let message = `${emoji} **${title}**\n`;
    message += `Source: ${item.source} | Score: ${scoreColor}${item.score}**\n`;
    message += `📅 ${new Date(item.published_at).toLocaleString('fr-FR')}\n`;
    message += `🔗 Voir le post: [${fixupUrl}](${fixupUrl})\n`;

    if (item.url) {
      message += `[Source originale](${item.url})\n`;
    }

    const contentText = item.content ? item.content.substring(0, 200) + '...' : 'Nouvelle financière pertinente';
    message += `*${contentText}*`;

    return message;
  }