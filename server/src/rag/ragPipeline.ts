import mongoose from 'mongoose';
import { VectorStore, VectorSearchResult } from './vectorStore';
import { generateChatCompletion } from '../ai/openai';
import { ICitation } from '../models/Message';

export interface RAGAnswerResult {
  answer: string;
  citations: ICitation[];
  hasCourseContext: boolean;
  retrievedChunksCount: number;
}

export interface RAGOptions {
  userId: string | mongoose.Types.ObjectId;
  courseId?: string | mongoose.Types.ObjectId;
  documentId?: string | mongoose.Types.ObjectId;
  chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  userPreferences?: {
    preferredLearningStyle?: string;
    explanationDepth?: string;
  };
}

export class RAGPipeline {
  /**
   * Execute full RAG pipeline for answering user questions from course materials
   */
  public static async answerQuestion(
    question: string,
    options: RAGOptions
  ): Promise<RAGAnswerResult> {
    // 1. Retrieve relevant chunks from Vector Store
    const searchResults = await VectorStore.similaritySearch(question, {
      userId: options.userId,
      courseId: options.courseId,
      documentId: options.documentId,
      topK: 6,
      minScore: 0.15,
    });

    // 2. If NO relevant chunks found at all
    if (searchResults.length === 0) {
      return {
        answer:
          'I searched your uploaded course materials, but could not find relevant information to answer this question. Please make sure the relevant document is uploaded to this course, or switch to **General Study** mode if you would like me to explain this concept from general knowledge.',
        citations: [],
        hasCourseContext: false,
        retrievedChunksCount: 0,
      };
    }

    // 3. Assemble Grounded Context & Format Sources
    const citations: ICitation[] = [];
    const contextBlocks: string[] = [];

    searchResults.forEach((item, index) => {
      const { chunk, score } = item;
      const citation: ICitation = {
        documentId: chunk.documentId,
        documentName: chunk.documentName,
        pageNumber: chunk.pageNumber || 1,
        snippet: chunk.content.slice(0, 200).replace(/\s+/g, ' ') + '...',
        chunkIndex: chunk.chunkIndex,
        score: Math.round(score * 100) / 100,
      };

      // Deduplicate citations by doc name and page number
      const alreadyExists = citations.some(
        (c) => c.documentName === citation.documentName && c.pageNumber === citation.pageNumber
      );
      if (!alreadyExists) {
        citations.push(citation);
      }

      contextBlocks.push(
        `[SOURCE ${index + 1}: ${chunk.documentName} (Page ${chunk.pageNumber || 1})]\n${chunk.content}`
      );
    });

    const contextText = contextBlocks.join('\n\n---\n\n');

    // 4. Build System & User Prompts
    const systemPrompt = `You are a high-level AI Study Assistant and Professor.
Your goal is to provide accurate, pedagogical, and crystal-clear answers strictly based on the provided course material excerpts below.

CRITICAL GROUNDING RULES:
1. Base your answer PRIMARILY on the provided course materials.
2. If the answer cannot be found or reasonably inferred from the provided excerpts, state clearly: "This specific information is not covered in your uploaded course materials."
3. Do NOT hallucinate facts, citations, or references that do not exist in the context.
4. Format your response with clean Markdown: use headings, bold text, bullet points, and code blocks where applicable.
5. In your explanations, adapt to the student's learning style: ${options.userPreferences?.preferredLearningStyle || 'balanced'} with ${options.userPreferences?.explanationDepth || 'detailed'} depth.
6. Mention specific page numbers or sections when quoting or referencing concepts from the source material.

COURSE MATERIALS CONTEXT:
${contextText}`;

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Include recent chat history if provided
    if (options.chatHistory && options.chatHistory.length > 0) {
      const recentHistory = options.chatHistory.slice(-4);
      for (const msg of recentHistory) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    messages.push({ role: 'user', content: question });

    // 5. Query LLM
    const completion = await generateChatCompletion({
      messages,
      temperature: 0.2,
    });

    const answer =
      completion.choices[0]?.message?.content ||
      'Unable to generate an answer from the course materials.';

    return {
      answer,
      citations,
      hasCourseContext: true,
      retrievedChunksCount: searchResults.length,
    };
  }
}

export default RAGPipeline;
