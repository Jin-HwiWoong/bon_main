const DEFAULT_MAX_CHARS = 800;

export function splitContentIntoChunks(content: string): string[] {
  const pieces = content
    .split(/\n{2,}/)
    .map((piece) => piece.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  for (const piece of pieces) {
    if (piece.length <= DEFAULT_MAX_CHARS) {
      chunks.push(piece);
      continue;
    }

    for (let index = 0; index < piece.length; index += DEFAULT_MAX_CHARS) {
      chunks.push(piece.slice(index, index + DEFAULT_MAX_CHARS));
    }
  }

  if (chunks.length === 0 && content.trim()) {
    chunks.push(content.trim());
  }

  return chunks;
}
