import mongoose from 'mongoose';
import Memory, { IMemory, MemoryType, MemorySource } from '../models/Memory';
import { generateChatCompletion } from '../ai/openai';

export class MemoryService {
  /**
   * Save or update a student memory
   */
  public static async saveMemory(params: {
    userId: string | mongoose.Types.ObjectId;
    type: MemoryType;
    content: string;
    importance?: number;
    source?: MemorySource;
    courseId?: string | mongoose.Types.ObjectId;
  }): Promise<IMemory> {
    const userId = new mongoose.Types.ObjectId(params.userId.toString());
    const cleanContent = params.content.trim();

    // Check if an existing memory of same type has very similar content
    const existing = await Memory.findOne({
      userId,
      type: params.type,
      content: { $regex: new RegExp(`^${cleanContent.slice(0, 30)}`, 'i') },
    });

    if (existing) {
      existing.content = cleanContent;
      if (params.importance) existing.importance = params.importance;
      if (params.source) existing.source = params.source;
      return existing.save();
    }

    return Memory.create({
      userId,
      type: params.type,
      content: cleanContent,
      importance: params.importance || 5,
      source: params.source || 'chat',
      courseId: params.courseId ? new mongoose.Types.ObjectId(params.courseId.toString()) : undefined,
    });
  }

  /**
   * Retrieve all memories for a user formatted as clean context strings
   */
  public static async getMemoriesForUser(
    userId: string | mongoose.Types.ObjectId,
    limit: number = 20
  ): Promise<IMemory[]> {
    return Memory.find({ userId: new mongoose.Types.ObjectId(userId.toString()) })
      .sort({ importance: -1, updatedAt: -1 })
      .limit(limit);
  }

  /**
   * Format memories into a string for LLM system prompt injection
   */
  public static async getFormattedMemoryContext(
    userId: string | mongoose.Types.ObjectId
  ): Promise<string> {
    const memories = await this.getMemoriesForUser(userId, 15);
    if (memories.length === 0) return '';

    const lines = memories.map(
      (m) => `- [${m.type.toUpperCase()}] ${m.content} (Importance: ${m.importance}/10)`
    );

    return `\nSTUDENT PROFILE & MEMORY (Use these to personalize explanations, examples, and plans):\n${lines.join('\n')}\n`;
  }

  /**
   * Analyze conversation or text and automatically extract useful student learning memories
   */
  public static async extractAndStoreLearnerInsights(
    userId: string | mongoose.Types.ObjectId,
    userMessage: string,
    assistantReply: string
  ): Promise<void> {
    // Only extract if message contains indicators of preferences/weaknesses/goals
    const text = userMessage.toLowerCase();
    const learningKeywords = [
      'i struggle with',
      'i am weak at',
      'i find it hard',
      'my goal is',
      'i prefer',
      'i like visual',
      'explain like',
      'i am studying',
      'exam is on',
      'i dont understand',
      'confused about',
    ];

    const hasMatch = learningKeywords.some((k) => text.includes(k));
    if (!hasMatch) return;

    try {
      const prompt = `Analyze this student interaction and extract ONLY concrete, useful, non-sensitive study facts (like learning style, weak concepts, target goals).
If no clear lasting fact is present, return {"insights": []}.

STUDENT: "${userMessage}"
ASSISTANT: "${assistantReply.slice(0, 300)}"

Return JSON format:
{
  "insights": [
    {
      "type": "learning_style" | "preference" | "weak_topic" | "strong_topic" | "goal" | "study_habit",
      "content": "Short specific summary statement about the student",
      "importance": 1-10
    }
  ]
}`;

      const response = await generateChatCompletion({
        messages: [{ role: 'system', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      });

      const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
      if (Array.isArray(parsed.insights)) {
        for (const item of parsed.insights) {
          if (item.type && item.content) {
            await this.saveMemory({
              userId,
              type: item.type,
              content: item.content,
              importance: item.importance || 6,
              source: 'chat',
            });
          }
        }
      }
    } catch (err: any) {
      console.warn('[MemoryService] Auto-extraction skipped:', err.message);
    }
  }

  /**
   * Delete a memory by ID
   */
  public static async deleteMemory(
    memoryId: string,
    userId: string | mongoose.Types.ObjectId
  ): Promise<boolean> {
    const result = await Memory.deleteOne({
      _id: new mongoose.Types.ObjectId(memoryId),
      userId: new mongoose.Types.ObjectId(userId.toString()),
    });
    return result.deletedCount > 0;
  }
}

export default MemoryService;
