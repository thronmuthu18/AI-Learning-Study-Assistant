import { ExtractedPage } from './textExtractor';

export interface ChunkOptions {
  chunkSize?: number; // target character length per chunk (default: 1000)
  chunkOverlap?: number; // overlap in characters (default: 150)
  documentId: string;
  documentName: string;
  courseId: string;
  userId: string;
}

export interface PreparedChunk {
  content: string;
  chunkIndex: number;
  pageNumber: number;
  documentId: string;
  documentName: string;
  courseId: string;
  userId: string;
  tokenCount: number;
}

/**
 * Splits text into overlapping semantic chunks preserving page numbers and metadata
 */
export const chunkDocument = (
  pages: ExtractedPage[],
  options: ChunkOptions
): PreparedChunk[] => {
  const chunkSize = options.chunkSize || 1000;
  const chunkOverlap = options.chunkOverlap || 150;
  const chunks: PreparedChunk[] = [];
  let globalChunkIndex = 0;

  for (const page of pages) {
    const pageText = page.text.trim();
    if (!pageText) continue;

    if (pageText.length <= chunkSize) {
      chunks.push({
        content: pageText,
        chunkIndex: globalChunkIndex++,
        pageNumber: page.pageNumber,
        documentId: options.documentId,
        documentName: options.documentName,
        courseId: options.courseId,
        userId: options.userId,
        tokenCount: Math.ceil(pageText.length / 4),
      });
      continue;
    }

    // Split page text into chunks recursively
    const subChunks = recursiveSplitText(pageText, chunkSize, chunkOverlap);
    for (const sub of subChunks) {
      if (sub.trim().length > 20) {
        chunks.push({
          content: sub.trim(),
          chunkIndex: globalChunkIndex++,
          pageNumber: page.pageNumber,
          documentId: options.documentId,
          documentName: options.documentName,
          courseId: options.courseId,
          userId: options.userId,
          tokenCount: Math.ceil(sub.length / 4),
        });
      }
    }
  }

  return chunks;
};

/**
 * Recursive character splitter trying double newline, single newline, sentence boundaries, space
 */
export const recursiveSplitText = (
  text: string,
  chunkSize: number,
  chunkOverlap: number
): string[] => {
  const separators = ['\n\n', '\n', '. ', '? ', '! ', '; ', ', ', ' '];
  const resultChunks: string[] = [];

  const split = (currentText: string, sepIndex: number): string[] => {
    if (currentText.length <= chunkSize || sepIndex >= separators.length) {
      return [currentText];
    }

    const separator = separators[sepIndex];
    const parts = currentText.split(separator);
    const combined: string[] = [];
    let currentPart = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const test = currentPart ? `${currentPart}${separator}${part}` : part;

      if (test.length <= chunkSize) {
        currentPart = test;
      } else {
        if (currentPart) {
          combined.push(currentPart);
          // Apply overlap from end of currentPart
          const overlapText = currentPart.slice(-chunkOverlap);
          currentPart = `${overlapText}${separator}${part}`;
        } else {
          // A single part is larger than chunkSize, recurse with next separator
          const smallerSplits = split(part, sepIndex + 1);
          combined.push(...smallerSplits);
          currentPart = '';
        }
      }
    }

    if (currentPart.trim()) {
      combined.push(currentPart);
    }

    return combined;
  };

  return split(text, 0);
};
