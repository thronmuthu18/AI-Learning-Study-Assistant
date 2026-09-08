import mongoose, { Document, Schema } from 'mongoose';

export interface ICitation {
  documentId: mongoose.Types.ObjectId;
  documentName: string;
  pageNumber?: number;
  snippet: string;
  chunkIndex?: number;
  score?: number;
}

export interface IToolInvocation {
  toolName: string;
  args: Record<string, any>;
  resultSummary?: string;
}

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations: ICitation[];
  toolsUsed: IToolInvocation[];
  createdAt: Date;
  updatedAt: Date;
}

const CitationSchema = new Schema<ICitation>(
  {
    documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true },
    documentName: { type: String, required: true },
    pageNumber: { type: Number, default: 1 },
    snippet: { type: String, required: true },
    chunkIndex: { type: Number },
    score: { type: Number },
  },
  { _id: false }
);

const ToolInvocationSchema = new Schema<IToolInvocation>(
  {
    toolName: { type: String, required: true },
    args: { type: Schema.Types.Mixed, default: {} },
    resultSummary: { type: String },
  },
  { _id: false }
);

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    citations: { type: [CitationSchema], default: [] },
    toolsUsed: { type: [ToolInvocationSchema], default: [] },
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
export default Message;
