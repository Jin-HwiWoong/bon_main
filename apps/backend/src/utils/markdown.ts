function replaceImages(markdown: string) {
  return markdown.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, altText: string) => altText.trim());
}

function replaceLinks(markdown: string) {
  return markdown.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label: string) => label.trim());
}

function stripFormatting(markdown: string) {
  return markdown
    .replace(/```([\s\S]*?)```/g, (_, code: string) => `\n${code.trim()}\n`)
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^>\s?/gm, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/\|/g, " ")
    .replace(/<\/?[^>]+>/g, " ");
}

export function extractPlainTextFromMarkdown(markdown: string) {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const text = stripFormatting(replaceLinks(replaceImages(normalized)));

  return text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
