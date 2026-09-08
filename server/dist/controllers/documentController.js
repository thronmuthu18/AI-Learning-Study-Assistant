"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDocument = exports.getDocumentById = exports.getDocuments = exports.uploadDocument = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const Document_1 = __importDefault(require("../models/Document"));
const DocumentChunk_1 = __importDefault(require("../models/DocumentChunk"));
const Course_1 = __importDefault(require("../models/Course"));
const textExtractor_1 = require("../rag/textExtractor");
const chunker_1 = require("../rag/chunker");
const embeddings_1 = require("../rag/embeddings");
const vectorStore_1 = __importDefault(require("../rag/vectorStore"));
const errorHandler_1 = require("../middleware/errorHandler");
const uploadDocument = async (req, res) => {
    const userId = req.user._id;
    const file = req.file;
    if (!file) {
        throw new errorHandler_1.AppError('No document file was uploaded.', 400);
    }
    const { courseId, title } = req.body;
    if (!courseId || !mongoose_1.default.Types.ObjectId.isValid(courseId)) {
        // Cleanup uploaded file
        if (fs_1.default.existsSync(file.path))
            fs_1.default.unlinkSync(file.path);
        throw new errorHandler_1.AppError('Valid courseId is required.', 400);
    }
    const course = await Course_1.default.findOne({ _id: courseId, userId });
    if (!course) {
        if (fs_1.default.existsSync(file.path))
            fs_1.default.unlinkSync(file.path);
        throw new errorHandler_1.AppError('Course not found or access denied.', 404);
    }
    // Determine file type
    const ext = path_1.default.extname(file.originalname).toLowerCase().replace('.', '');
    const docTitle = title || path_1.default.basename(file.originalname, path_1.default.extname(file.originalname));
    // 1. Create document entry
    const document = await Document_1.default.create({
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
        const extraction = await (0, textExtractor_1.extractTextFromFile)(file.path, ext);
        document.pageCount = extraction.pageCount;
        document.characterCount = extraction.characterCount;
        document.status = 'embedding';
        await document.save();
        // 3. Chunk text
        const chunks = (0, chunker_1.chunkDocument)(extraction.pages, {
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
        const embeddings = await (0, embeddings_1.generateBatchEmbeddings)(chunkTexts);
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
        await DocumentChunk_1.default.insertMany(chunkDocs);
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
    }
    catch (err) {
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
exports.uploadDocument = uploadDocument;
const getDocuments = async (req, res) => {
    const userId = req.user._id;
    const { courseId, status } = req.query;
    const filter = { userId };
    if (courseId && mongoose_1.default.Types.ObjectId.isValid(courseId)) {
        filter.courseId = new mongoose_1.default.Types.ObjectId(courseId);
    }
    if (status) {
        filter.status = status;
    }
    const documents = await Document_1.default.find(filter)
        .populate('courseId', 'title color icon')
        .sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        documents,
    });
};
exports.getDocuments = getDocuments;
const getDocumentById = async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new errorHandler_1.AppError('Invalid document ID', 400);
    }
    const document = await Document_1.default.findOne({ _id: id, userId }).populate('courseId', 'title color icon');
    if (!document) {
        throw new errorHandler_1.AppError('Document not found', 404);
    }
    // Get sample preview chunks
    const sampleChunks = await DocumentChunk_1.default.find({ documentId: document._id, userId })
        .select('chunkIndex pageNumber content tokenCount')
        .limit(10)
        .sort({ chunkIndex: 1 });
    res.status(200).json({
        success: true,
        document,
        chunks: sampleChunks,
    });
};
exports.getDocumentById = getDocumentById;
const deleteDocument = async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new errorHandler_1.AppError('Invalid document ID', 400);
    }
    const document = await Document_1.default.findOneAndDelete({ _id: id, userId });
    if (!document) {
        throw new errorHandler_1.AppError('Document not found', 404);
    }
    // Delete chunks from vector store
    await vectorStore_1.default.deleteDocumentChunks(id);
    // Delete file from disk if exists
    if (fs_1.default.existsSync(document.filePath)) {
        try {
            fs_1.default.unlinkSync(document.filePath);
        }
        catch (e) {
            console.warn('[DocumentController] Could not delete disk file:', e);
        }
    }
    // Update Course stats
    await Course_1.default.updateOne({ _id: document.courseId }, {
        $inc: {
            'stats.totalDocuments': -1,
            'stats.totalChunks': -document.chunkCount,
        },
    });
    res.status(200).json({
        success: true,
        message: 'Document and all vector embeddings deleted successfully',
    });
};
exports.deleteDocument = deleteDocument;
//# sourceMappingURL=documentController.js.map