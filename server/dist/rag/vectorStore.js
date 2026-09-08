"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorStore = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const DocumentChunk_1 = __importDefault(require("../models/DocumentChunk"));
const embeddings_1 = require("./embeddings");
const config_1 = __importDefault(require("../config"));
class VectorStore {
    /**
     * Search for most similar chunks using vector similarity
     */
    static async similaritySearch(query, options) {
        const topK = options.topK || 5;
        const minScore = options.minScore ?? 0.2;
        // 1. Generate query embedding
        const queryEmbedding = await (0, embeddings_1.generateEmbedding)(query);
        // 2. Build MongoDB query filter
        const filter = {
            userId: new mongoose_1.default.Types.ObjectId(options.userId.toString()),
        };
        if (options.courseId) {
            filter.courseId = new mongoose_1.default.Types.ObjectId(options.courseId.toString());
        }
        if (options.documentId) {
            filter.documentId = new mongoose_1.default.Types.ObjectId(options.documentId.toString());
        }
        // 3. Check if Atlas Vector Search is available
        if (config_1.default.vectorSearchType === 'atlas') {
            try {
                const atlasResults = await DocumentChunk_1.default.aggregate([
                    {
                        $vectorSearch: {
                            index: 'vector_index',
                            path: 'embedding',
                            queryVector: queryEmbedding,
                            numCandidates: topK * 10,
                            limit: topK,
                            filter: filter,
                        },
                    },
                    {
                        $project: {
                            content: 1,
                            chunkIndex: 1,
                            pageNumber: 1,
                            documentName: 1,
                            tokenCount: 1,
                            metadata: 1,
                            userId: 1,
                            courseId: 1,
                            documentId: 1,
                            score: { $meta: 'vectorSearchScore' },
                        },
                    },
                ]);
                if (atlasResults.length > 0) {
                    return atlasResults.map((doc) => ({
                        chunk: doc,
                        score: doc.score || 0.9,
                    }));
                }
            }
            catch (err) {
                // Fallback to in-memory cosine ranking if Atlas index not created
                console.warn('[VectorStore] Atlas Vector Search unavailable, using in-memory similarity fallback:', err.message);
            }
        }
        // 4. In-memory / MongoDB similarity ranking (extremely fast for user course chunks)
        const chunks = await DocumentChunk_1.default.find(filter)
            .select('content chunkIndex pageNumber documentName tokenCount embedding metadata userId courseId documentId')
            .lean();
        if (!chunks || chunks.length === 0) {
            return [];
        }
        // Compute cosine similarity scores
        const scoredChunks = chunks.map((chunk) => {
            const score = (0, embeddings_1.cosineSimilarity)(queryEmbedding, chunk.embedding);
            return {
                chunk: chunk,
                score,
            };
        });
        // Sort by similarity descending and filter by threshold
        scoredChunks.sort((a, b) => b.score - a.score);
        return scoredChunks
            .filter((item) => item.score >= minScore)
            .slice(0, topK);
    }
    /**
     * Delete all chunks associated with a document
     */
    static async deleteDocumentChunks(documentId) {
        const result = await DocumentChunk_1.default.deleteMany({
            documentId: new mongoose_1.default.Types.ObjectId(documentId),
        });
        return result.deletedCount || 0;
    }
    /**
     * Delete all chunks associated with a course
     */
    static async deleteCourseChunks(courseId) {
        const result = await DocumentChunk_1.default.deleteMany({
            courseId: new mongoose_1.default.Types.ObjectId(courseId),
        });
        return result.deletedCount || 0;
    }
}
exports.VectorStore = VectorStore;
exports.default = VectorStore;
//# sourceMappingURL=vectorStore.js.map