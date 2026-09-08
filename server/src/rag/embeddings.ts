import { openai, hasOpenAIKey } from '../ai/openai';
import config from '../config';

export const EMBEDDING_DIMENSIONS = 1536;

/**
 * Generate embedding vector for a single text string
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
  const embeddings = await generateBatchEmbeddings([text]);
  return embeddings[0];
};

/**
 * Generate embedding vectors for an array of text strings
 */
export const generateBatchEmbeddings = async (texts: string[]): Promise<number[][]> => {
  const sanitizedTexts = texts.map((t) => t.replace(/\n/g, ' ').slice(0, 8000));

  if (openai && hasOpenAIKey()) {
    try {
      const response = await openai.embeddings.create({
        model: config.openaiEmbeddingModel,
        input: sanitizedTexts,
        dimensions: EMBEDDING_DIMENSIONS,
      });

      return response.data.map((item) => item.embedding);
    } catch (error: any) {
      console.warn('[Embeddings] Live OpenAI embedding failed, using deterministic local embedding:', error.message);
      if (!error.message.includes('401') && !error.message.includes('insufficient_quota')) {
        throw error;
      }
    }
  }

  // Fallback: Generate normalized deterministic term-frequency vectors
  return sanitizedTexts.map((text) => createDeterministicEmbedding(text));
};

/**
 * Calculate cosine similarity between two vectors
 */
export const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Generates a high-quality deterministic 1536-dimensional normalized vector
 * based on word tokens, character n-grams, and semantic hash distribution
 */
export const createDeterministicEmbedding = (text: string): number[] => {
  const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
  const words = text.toLowerCase().match(/\b[a-z0-9_]{2,}\b/g) || ['empty'];

  for (let w = 0; w < words.length; w++) {
    const word = words[w];
    // Hash word to multiple slots
    for (let h = 0; h < 5; h++) {
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = (hash * 31 + word.charCodeAt(i) + h * 17) >>> 0;
      }
      const index = hash % EMBEDDING_DIMENSIONS;
      vector[index] += 1 / Math.sqrt(w + 1);
    }
  }

  // Add 3-gram character hashes
  const clean = text.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (let i = 0; i < clean.length - 2; i++) {
    const gram = clean.slice(i, i + 3);
    let hash = 0;
    for (let j = 0; j < gram.length; j++) {
      hash = (hash * 37 + gram.charCodeAt(j)) >>> 0;
    }
    const index = hash % EMBEDDING_DIMENSIONS;
    vector[index] += 0.5;
  }

  // Normalize to unit length
  let norm = 0;
  for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
    norm += vector[i] * vector[i];
  }

  if (norm === 0) {
    vector[0] = 1;
    return vector;
  }

  const sqrtNorm = Math.sqrt(norm);
  for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
    vector[i] = vector[i] / sqrtNorm;
  }

  return vector;
};
