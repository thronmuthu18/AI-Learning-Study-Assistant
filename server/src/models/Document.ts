import mongoose, { Document as MongoDoc, Schema } from 'mongoose';

export type DocumentProcessingStatus = 'uploading' | 'processing' | 'embedding' | 'ready' | 'failed';
export type SupportedFileType = 'pdf' | 'docx' | 'txt' | 'md';

export interface IDocument extends MongoDoc {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  title: string;
  originalFileName: string;
  storedFileName: string;
  filePath: string;
  fileType: SupportedFileType;
  fileSize: number;
  mimeType: string;
  status: DocumentProcessingStatus;
  errorMessage?: string;
  pageCount: number;
  chunkCount: number;
  characterCount: number;
  summary?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true, trim: true },
    originalFileName: { type: String, required: true },
    storedFileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileType: { type: String, enum: ['pdf', 'docx', 'txt', 'md'], required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    status: {
      type: String,
      enum: ['uploading', 'processing', 'embedding', 'ready', 'failed'],
      default: 'uploading',
      index: true,
    },
    errorMessage: { type: String },
    pageCount: { type: Number, default: 1 },
    chunkCount: { type: Number, default: 0 },
    characterCount: { type: Number, default: 0 },
    summary: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

DocumentSchema.index({ userId: 1, courseId: 1, createdAt: -1 });

export const DocumentModel = mongoose.model<IDocument>('Document', DocumentSchema);
export default DocumentModel;
