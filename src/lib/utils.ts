export function htmlToPlainText(html: string): string {
    if (!html) return '';

    // Replace <br> and <p> with newlines
    let text = html.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<\/p>/gi, '\n\n');
    text = text.replace(/<p.*?>/gi, '');

    // Replace list items with bullet points
    text = text.replace(/<li.*?>/gi, '• ');
    text = text.replace(/<\/li>/gi, '\n');

    // Strip all other HTML tags
    text = text.replace(/<[^>]*>?/gm, '');

    // Decode HTML entities safely without DOM if possible, or simple replace
    text = text
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

    return text.trim();
}
