import mongoose from 'mongoose';
import DocumentChunk, { IDocumentChunk } from '../models/DocumentChunk';
import { generateEmbedding, cosineSimilarity } from './embeddings';
import config from '../config';

export interface VectorSearchResult {
  chunk: IDocumentChunk;
  score: number;
}

export interface SearchOptions {
  userId: string | mongoose.Types.ObjectId;
  courseId?: string | mongoose.Types.ObjectId;
  documentId?: string | mongoose.Types.ObjectId;
  topK?: number;
  minScore?: number;
}

export class VectorStore {
  /**
   * Search for most similar chunks using vector similarity
   */
  public static async similaritySearch(
    query: string,
    options: SearchOptions
  ): Promise<VectorSearchResult[]> {
    const topK = options.topK || 5;
    const minScore = options.minScore ?? 0.2;

    // 1. Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    // 2. Build MongoDB query filter
    const filter: any = {
      userId: new mongoose.Types.ObjectId(options.userId.toString()),
    };

    if (options.courseId) {
      filter.courseId = new mongoose.Types.ObjectId(options.courseId.toString());
    }

    if (options.documentId) {
      filter.documentId = new mongoose.Types.ObjectId(options.documentId.toString());
    }

    // 3. Check if Atlas Vector Search is available
    if (config.vectorSearchType === 'atlas') {
      try {
        const atlasResults = await DocumentChunk.aggregate([
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
            chunk: doc as IDocumentChunk,
            score: doc.score || 0.9,
          }));
        }
      } catch (err: any) {
        // Fallback to in-memory cosine ranking if Atlas index not created
        console.warn('[VectorStore] Atlas Vector Search unavailable, using in-memory similarity fallback:', err.message);
      }
    }

    // 4. In-memory / MongoDB similarity ranking (extremely fast for user course chunks)
    const chunks = await DocumentChunk.find(filter)
      .select('content chunkIndex pageNumber documentName tokenCount embedding metadata userId courseId documentId')
      .lean();

    if (!chunks || chunks.length === 0) {
      return [];
    }

    // Compute cosine similarity scores
    const scoredChunks: VectorSearchResult[] = chunks.map((chunk) => {
      const score = cosineSimilarity(queryEmbedding, chunk.embedding);
      return {
        chunk: chunk as unknown as IDocumentChunk,
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
  public static async deleteDocumentChunks(documentId: string): Promise<number> {
    const result = await DocumentChunk.deleteMany({
      documentId: new mongoose.Types.ObjectId(documentId),
    });
    return result.deletedCount || 0;
  }

  /**
   * Delete all chunks associated with a course
   */
  public static async deleteCourseChunks(courseId: string): Promise<number> {
    const result = await DocumentChunk.deleteMany({
      courseId: new mongoose.Types.ObjectId(courseId),
    });
    return result.deletedCount || 0;
  }
}

export default VectorStore;
