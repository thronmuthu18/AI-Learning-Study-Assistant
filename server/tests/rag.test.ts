import mongoose from 'mongoose';
import { cleanExtractedText } from '../src/rag/textExtractor';
import { chunkDocument, recursiveSplitText } from '../src/rag/chunker';
import { generateEmbedding, cosineSimilarity, createDeterministicEmbedding } from '../src/rag/embeddings';
import VectorStore from '../src/rag/vectorStore';
import DocumentChunk from '../src/models/DocumentChunk';
import DocumentModel from '../src/models/Document';
import Course from '../src/models/Course';
import User from '../src/models/User';
import RAGPipeline from '../src/rag/ragPipeline';

describe('RAG, Text Extraction & Vector Search Pipeline', () => {
  let userId: mongoose.Types.ObjectId;
  let courseId: mongoose.Types.ObjectId;
  let documentId: mongoose.Types.ObjectId;

  beforeEach(async () => {
    userId = new mongoose.Types.ObjectId();
    courseId = new mongoose.Types.ObjectId();
    documentId = new mongoose.Types.ObjectId();

    await User.create({
      _id: userId,
      name: 'RAG Tester',
      email: 'rag@test.com',
      passwordHash: 'hash',
    });

    await Course.create({
      _id: courseId,
      userId,
      title: 'Operating Systems',
    });

    await DocumentModel.create({
      _id: documentId,
      userId,
      courseId,
      title: 'Concurrency Notes.md',
      originalFileName: 'Concurrency.md',
      storedFileName: 'stored_concurrency.md',
      filePath: 'uploads/fake.md',
      fileType: 'md',
      fileSize: 1024,
      mimeType: 'text/markdown',
      status: 'ready',
      pageCount: 1,
      chunkCount: 2,
      characterCount: 500,
    });
  });

  it('should clean and normalize erratic text', () => {
    const raw = 'Hello   world!\r\n\r\n\r\nThis is\t\ttabbed.\u0000';
    const cleaned = cleanExtractedText(raw);
    expect(cleaned).toBe('Hello world!\n\nThis is tabbed.');
  });

  it('should split document pages into overlapping semantic chunks preserving metadata', () => {
    const pages = [
      {
        pageNumber: 1,
        text: 'Section 1: Mutex locks provide mutual exclusion. A thread must acquire the lock before entering a critical section.',
      },
      {
        pageNumber: 2,
        text: 'Section 2: Semaphores can be binary or counting. Counting semaphores allow access to a fixed number of resources.',
      },
    ];

    const chunks = chunkDocument(pages, {
      chunkSize: 200,
      chunkOverlap: 20,
      documentId: documentId.toString(),
      documentName: 'Concurrency Notes.md',
      courseId: courseId.toString(),
      userId: userId.toString(),
    });

    expect(chunks.length).toBe(2);
    expect(chunks[0].documentName).toBe('Concurrency Notes.md');
    expect(chunks[0].userId).toBe(userId.toString());
    expect(chunks[0].pageNumber).toBe(1);
    expect(chunks[1].pageNumber).toBe(2);
  });

  it('should compute accurate cosine similarities between vector embeddings', () => {
    const vecA = createDeterministicEmbedding('operating systems process synchronization semaphore');
    const vecB = createDeterministicEmbedding('operating systems mutex lock semaphore synchronization');
    const vecC = createDeterministicEmbedding('cooking recipes chocolate cake strawberry dessert');

    const similarityAB = cosineSimilarity(vecA, vecB);
    const similarityAC = cosineSimilarity(vecA, vecC);

    expect(similarityAB).toBeGreaterThan(similarityAC);
    expect(similarityAB).toBeGreaterThan(0.5);
  });

  it('should store chunks and retrieve them via VectorStore similarity search with strict user isolation', async () => {
    const textA = 'Deadlock occurs when four conditions hold: mutual exclusion, hold and wait, no preemption, circular wait.';
    const textB = 'Virtual memory paging uses page replacement algorithms such as Least Recently Used (LRU) and FIFO.';

    const embA = await generateEmbedding(textA);
    const embB = await generateEmbedding(textB);

    await DocumentChunk.create([
      {
        userId,
        courseId,
        documentId,
        content: textA,
        chunkIndex: 0,
        pageNumber: 1,
        documentName: 'Concurrency Notes.md',
        tokenCount: 20,
        embedding: embA,
        metadata: { userId, courseId, documentId, documentName: 'Concurrency Notes.md', pageNumber: 1, chunkIndex: 0 },
      },
      {
        userId,
        courseId,
        documentId,
        content: textB,
        chunkIndex: 1,
        pageNumber: 2,
        documentName: 'Concurrency Notes.md',
        tokenCount: 20,
        embedding: embB,
        metadata: { userId, courseId, documentId, documentName: 'Concurrency Notes.md', pageNumber: 2, chunkIndex: 1 },
      },
    ]);

    const results = await VectorStore.similaritySearch('What are the conditions for deadlock?', {
      userId,
      courseId,
      topK: 2,
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].chunk.content).toContain('Deadlock occurs when four conditions');
    expect(results[0].chunk.pageNumber).toBe(1);

    // Verify isolation for other user
    const otherUserResults = await VectorStore.similaritySearch('deadlock', {
      userId: new mongoose.Types.ObjectId(),
    });
    expect(otherUserResults.length).toBe(0);
  });

  it('should answer questions using RAG pipeline and include grounded source citations', async () => {
    const text = 'The Banker algorithm is used for deadlock avoidance in operating systems by ensuring safe states.';
    const emb = await generateEmbedding(text);

    await DocumentChunk.create({
      userId,
      courseId,
      documentId,
      content: text,
      chunkIndex: 0,
      pageNumber: 3,
      documentName: 'Concurrency Notes.md',
      tokenCount: 20,
      embedding: emb,
      metadata: { userId, courseId, documentId, documentName: 'Concurrency Notes.md', pageNumber: 3, chunkIndex: 0 },
    });

    const ragResult = await RAGPipeline.answerQuestion('What algorithm avoids deadlocks?', {
      userId,
      courseId,
    });

    expect(ragResult.hasCourseContext).toBe(true);
    expect(ragResult.citations.length).toBeGreaterThan(0);
    expect(ragResult.citations[0].documentName).toBe('Concurrency Notes.md');
    expect(ragResult.citations[0].pageNumber).toBe(3);
  });
});
