"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDeterministicEmbedding = exports.cosineSimilarity = exports.generateBatchEmbeddings = exports.generateEmbedding = exports.EMBEDDING_DIMENSIONS = void 0;
const openai_1 = require("../ai/openai");
const config_1 = __importDefault(require("../config"));
exports.EMBEDDING_DIMENSIONS = 1536;
/**
 * Generate embedding vector for a single text string
 */
const generateEmbedding = async (text) => {
    const embeddings = await (0, exports.generateBatchEmbeddings)([text]);
    return embeddings[0];
};
exports.generateEmbedding = generateEmbedding;
/**
 * Generate embedding vectors for an array of text strings
 */
const generateBatchEmbeddings = async (texts) => {
    const sanitizedTexts = texts.map((t) => t.replace(/\n/g, ' ').slice(0, 8000));
    if (openai_1.openai && (0, openai_1.hasOpenAIKey)()) {
        try {
            const response = await openai_1.openai.embeddings.create({
                model: config_1.default.openaiEmbeddingModel,
                input: sanitizedTexts,
                dimensions: exports.EMBEDDING_DIMENSIONS,
            });
            return response.data.map((item) => item.embedding);
        }
        catch (error) {
            console.warn('[Embeddings] Live OpenAI embedding failed, using deterministic local embedding:', error.message);
            if (!error.message.includes('401') && !error.message.includes('insufficient_quota')) {
                throw error;
            }
        }
    }
    // Fallback: Generate normalized deterministic term-frequency vectors
    return sanitizedTexts.map((text) => (0, exports.createDeterministicEmbedding)(text));
};
exports.generateBatchEmbeddings = generateBatchEmbeddings;
/**
 * Calculate cosine similarity between two vectors
 */
const cosineSimilarity = (vecA, vecB) => {
    if (!vecA || !vecB || vecA.length !== vecB.length)
        return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0)
        return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};
exports.cosineSimilarity = cosineSimilarity;
/**
 * Generates a high-quality deterministic 1536-dimensional normalized vector
 * based on word tokens, character n-grams, and semantic hash distribution
 */
const createDeterministicEmbedding = (text) => {
    const vector = new Array(exports.EMBEDDING_DIMENSIONS).fill(0);
    const words = text.toLowerCase().match(/\b[a-z0-9_]{2,}\b/g) || ['empty'];
    for (let w = 0; w < words.length; w++) {
        const word = words[w];
        // Hash word to multiple slots
        for (let h = 0; h < 5; h++) {
            let hash = 0;
            for (let i = 0; i < word.length; i++) {
                hash = (hash * 31 + word.charCodeAt(i) + h * 17) >>> 0;
            }
            const index = hash % exports.EMBEDDING_DIMENSIONS;
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
        const index = hash % exports.EMBEDDING_DIMENSIONS;
        vector[index] += 0.5;
    }
    // Normalize to unit length
    let norm = 0;
    for (let i = 0; i < exports.EMBEDDING_DIMENSIONS; i++) {
        norm += vector[i] * vector[i];
    }
    if (norm === 0) {
        vector[0] = 1;
        return vector;
    }
    const sqrtNorm = Math.sqrt(norm);
    for (let i = 0; i < exports.EMBEDDING_DIMENSIONS; i++) {
        vector[i] = vector[i] / sqrtNorm;
    }
    return vector;
};
exports.createDeterministicEmbedding = createDeterministicEmbedding;
//# sourceMappingURL=embeddings.js.map