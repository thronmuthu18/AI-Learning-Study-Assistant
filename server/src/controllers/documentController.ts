import { Response } from 'express';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import DocumentModel, { SupportedFileType } from '../models/Document';
import DocumentChunk from '../models/DocumentChunk';
import Course from '../models/Course';
import { extractTextFromFile } from '../rag/textExtractor';
import { chunkDocument } from '../rag/chunker';
import { generateBatchEmbeddings } from '../rag/embeddings';
import VectorStore from '../rag/vectorStore';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const uploadDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!._id;
  const file = req.file;

  if (!file) {
    throw new AppError('No document file was uploaded.', 400);
  }

  const { courseId, title } = req.body;
  if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
    // Cleanup uploaded file
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    throw new AppError('Valid courseId is required.', 400);
  }

  const course = await Course.findOne({ _id: courseId, userId });
  if (!course) {
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    throw new AppError('Course not found or access denied.', 404);
  }

  // Determine file type
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '') as SupportedFileType;
  const docTitle = title || path.basename(file.originalname, path.extname(file.originalname));

  // 1. Create document entry
  const document = await DocumentModel.create({
    userId,
    courseId: course._id,
    title: docTitle,
    originalFileName: file.originalname,
    storedFileName: file.filename,
    filePath: file.path,
    fileType: ext,
    fileSize: file.size,
    mimeType: file.mimetype,
    status: 'processing',
    pageCount: 1,
    chunkCount: 0,
    characterCount: 0,
  });

  // Perform processing asynchronously or inline
  try {
    // 2. Extract text
    const extraction = await extractTextFromFile(file.path, ext);
    document.pageCount = extraction.pageCount;
    document.characterCount = extraction.characterCount;
    document.status = 'embedding';
    await document.save();

    // 3. Chunk text
    const chunks = chunkDocument(extraction.pages, {
      chunkSize: 1000,
      chunkOverlap: 150,
      documentId: document._id.toString(),
      documentName: document.title,
      courseId: course._id.toString(),
      userId: userId.toString(),
    });

    if (chunks.length === 0) {
      throw new Error('Document contained no readable text.');
    }

    // 4. Generate Embeddings in batch
    const chunkTexts = chunks.map((c) => c.content);
    const embeddings = await generateBatchEmbeddings(chunkTexts);

    // 5. Store chunks in DB
    const chunkDocs = chunks.map((chunk, index) => ({
      userId,
      courseId: course._id,
      documentId: document._id,
      content: chunk.content,
      chunkIndex: chunk.chunkIndex,
      pageNumber: chunk.pageNumber,
      documentName: document.title,
      tokenCount: chunk.tokenCount,
      embedding: embeddings[index],
      metadata: {
        userId,
        courseId: course._id,
        documentId: document._id,
        documentName: document.title,
        pageNumber: chunk.pageNumber,
        chunkIndex: chunk.chunkIndex,
        totalChunks: chunks.length,
      },
    }));

    await DocumentChunk.insertMany(chunkDocs);

    // 6. Update document status to ready
    document.chunkCount = chunks.length;
    document.status = 'ready';
    document.summary = extraction.fullText.slice(0, 300) + '...';
    await document.save();

    // 7. Update course stats
    course.stats.totalDocuments += 1;
    course.stats.totalChunks += chunks.length;
    await course.save();

    res.status(201).json({
      success: true,
      message: 'Document uploaded and indexed successfully into vector database.',
      document,
    });
  } catch (err: any) {
    document.status = 'failed';
    document.errorMessage = err.message || 'Processing failed';
    await document.save();

    res.status(500).json({
      success: false,
      message: `Document processing failed: ${err.message}`,
      document,
    });
  }
};

export const getDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!._id;
  const { courseId, status } = req.query;

  const filter: any = { userId };
  if (courseId && mongoose.Types.ObjectId.isValid(courseId as string)) {
    filter.courseId = new mongoose.Types.ObjectId(courseId as string);
  }
  if (status) {
    filter.status = status;
  }

  const documents = await DocumentModel.find(filter)
    .populate('courseId', 'title color icon')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    documents,
  });
};

export const getDocumentById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid document ID', 400);
  }

  const document = await DocumentModel.findOne({ _id: id, userId }).populate('courseId', 'title color icon');
  if (!document) {
    throw new AppError('Document not found', 404);
  }

  // Get sample preview chunks
  const sampleChunks = await DocumentChunk.find({ documentId: document._id, userId })
    .select('chunkIndex pageNumber content tokenCount')
    .limit(10)
    .sort({ chunkIndex: 1 });

  res.status(200).json({
    success: true,
    document,
    chunks: sampleChunks,
  });
};

export const deleteDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid document ID', 400);
  }

  const document = await DocumentModel.findOneAndDelete({ _id: id, userId });
  if (!document) {
    throw new AppError('Document not found', 404);
  }

  // Delete chunks from vector store
  await VectorStore.deleteDocumentChunks(id);

  // Delete file from disk if exists
  if (fs.existsSync(document.filePath)) {
    try {
      fs.unlinkSync(document.filePath);
    } catch (e) {
      console.warn('[DocumentController] Could not delete disk file:', e);
    }
  }

  // Update Course stats
  await Course.updateOne(
    { _id: document.courseId },
    {
      $inc: {
        'stats.totalDocuments': -1,
        'stats.totalChunks': -document.chunkCount,
      },
    }
  );

  res.status(200).json({
    success: true,
    message: 'Document and all vector embeddings deleted successfully',
  });
};
