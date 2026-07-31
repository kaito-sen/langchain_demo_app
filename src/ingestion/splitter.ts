export interface Document {
  pageContent: string;
  metadata: Record<string, unknown>;
}

export function recursiveCharacterTextSplitter(
  text: string,
  chunkSize: number = 1000,
  chunkOverlap: number = 200
): string[] {
  const separators = ["\n\n", "\n", " ", ""];
  return splitText(text, chunkSize, chunkOverlap, separators);
}

function splitText(
  text: string,
  chunkSize: number,
  chunkOverlap: number,
  separators: string[]
): string[] {
  if (text.length <= chunkSize) {
    return [text];
  }

  for (const sep of separators) {
    if (sep === "") {
      const chunks: string[] = [];
      for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
      }
      return chunks;
    }

    const parts = text.split(sep);
    if (parts.length === 1) continue;

    const chunks: string[] = [];
    let currentChunk = "";

    for (const part of parts) {
      if (currentChunk.length + part.length + sep.length <= chunkSize) {
        currentChunk += (currentChunk ? sep : "") + part;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        currentChunk = part;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    if (chunks.length <= 1) continue;

    return applyOverlap(chunks, chunkOverlap, sep);
  }

  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

function applyOverlap(
  chunks: string[],
  overlap: number,
  separator: string
): string[] {
  const result: string[] = [chunks[0]!];

  for (let i = 1; i < chunks.length; i++) {
    const prevChunk = result[result.length - 1]!;
    const overlapText = prevChunk.slice(-overlap);
    const currentChunk = chunks[i]!;

    if (overlapText.length > 0 && currentChunk.startsWith(overlapText)) {
      result[result.length - 1] = prevChunk + separator + currentChunk.slice(overlapText.length);
    } else {
      result.push(currentChunk);
    }
  }

  return result;
}
