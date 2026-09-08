import mongoose, { Document as MongoDoc, Schema } from 'mongoose';

export interface IDocumentChunkMetadata {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  documentId: mongoose.Types.ObjectId;
  documentName: string;
  pageNumber?: number;
  chunkIndex: number;
  totalChunks?: number;
  sectionTitle?: string;
}

export interface IDocumentChunk extends MongoDoc {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  documentId: mongoose.Types.ObjectId;
  content: string;
  chunkIndex: number;
  pageNumber: number;
  documentName: string;
  tokenCount: number;
  embedding: number[];
  metadata: IDocumentChunkMetadata;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentChunkSchema = new Schema<IDocumentChunk>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    content: { type: String, required: true },
    chunkIndex: { type: Number, required: true },
    pageNumber: { type: Number, default: 1 },
    documentName: { type: String, required: true },
    tokenCount: { type: Number, default: 0 },
    embedding: { type: [Number], required: true },
    metadata: {
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
      documentId: { type: Schema.Types.ObjectId, ref: 'Document' },
      documentName: { type: String },
      pageNumber: { type: Number, default: 1 },
      chunkIndex: { type: Number },
      totalChunks: { type: Number },
      sectionTitle: { type: String },
    },
  },
  { timestamps: true }
);

// Compound index for user chunk filtering
DocumentChunkSchema.index({ userId: 1, courseId: 1, documentId: 1 });

export const DocumentChunk = mongoose.model<IDocumentChunk>('DocumentChunk', DocumentChunkSchema);
export default DocumentChunk;
