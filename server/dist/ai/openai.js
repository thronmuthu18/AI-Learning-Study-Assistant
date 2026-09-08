"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateChatCompletion = exports.hasOpenAIKey = exports.openai = void 0;
const openai_1 = __importDefault(require("openai"));
const config_1 = __importDefault(require("../config"));
// Initialize OpenAI client if API key is present
exports.openai = config_1.default.openaiApiKey
    ? new openai_1.default({ apiKey: config_1.default.openaiApiKey })
    : null;
const hasOpenAIKey = () => {
    return !!config_1.default.openaiApiKey && config_1.default.openaiApiKey.trim().length > 0 && !config_1.default.openaiApiKey.includes('your_openai_api_key');
};
exports.hasOpenAIKey = hasOpenAIKey;
/**
 * Generate completion with automatic OpenAI call or offline realistic mock fallback
 */
const generateChatCompletion = async (params) => {
    if (exports.openai && (0, exports.hasOpenAIKey)()) {
        try {
            const response = await exports.openai.chat.completions.create({
                model: params.model || config_1.default.openaiModel,
                messages: params.messages,
                temperature: params.temperature ?? 0.3,
                response_format: params.response_format,
                tools: params.tools,
                tool_choice: params.tool_choice,
            });
            return response;
        }
        catch (error) {
            console.warn('[OpenAI] Live API call failed, evaluating fallback:', error.message);
            // If error is invalid API key or quota, fall through to intelligent fallback
            if (!error.message.includes('401') && !error.message.includes('insufficient_quota')) {
                throw error;
            }
        }
    }
    // Deterministic intelligent fallback when offline or test mode
    return generateOfflineFallbackResponse(params);
};
exports.generateChatCompletion = generateChatCompletion;
/**
 * Intelligent offline fallback response generator for development/tests without live OpenAI API Key
 */
const generateOfflineFallbackResponse = (params) => {
    const lastUserMessage = [...params.messages]
        .reverse()
        .find((m) => m.role === 'user')?.content;
    const lastContent = typeof lastUserMessage === 'string' ? lastUserMessage : 'study query';
    const systemMessage = params.messages.find((m) => m.role === 'system')?.content || '';
    const systemStr = typeof systemMessage === 'string' ? systemMessage : '';
    let outputText = '';
    // JSON format requested (e.g. quiz generation or learning plan generation)
    if (params.response_format?.type === 'json_object') {
        if (systemStr.includes('quiz') || lastContent.toLowerCase().includes('quiz')) {
            outputText = JSON.stringify({
                title: `Comprehensive Quiz on ${lastContent.slice(0, 40)}`,
                description: 'Auto-generated mastery quiz testing key conceptual understanding.',
                difficulty: 'medium',
                topics: ['Core Concepts', 'Architecture', 'Application'],
                questions: [
                    {
                        questionIndex: 0,
                        type: 'mcq',
                        question: `What is the primary role of the concepts discussed regarding "${lastContent.slice(0, 30)}"?`,
                        options: [
                            'To optimize efficiency and ensure correct system operation',
                            'To replace all previous computational paradigms',
                            'To eliminate memory allocation overhead entirely',
                            'None of the above'
                        ],
                        correctAnswer: 'To optimize efficiency and ensure correct system operation',
                        explanation: 'The primary role is ensuring correct resource management, concurrency, and systematic execution.',
                        difficulty: 'easy',
                        topic: 'Core Concepts'
                    },
                    {
                        questionIndex: 1,
                        type: 'true_false',
                        question: 'Proper abstraction simplifies complex system design without sacrificing functionality.',
                        options: ['True', 'False'],
                        correctAnswer: 'True',
                        explanation: 'Abstraction isolates components and handles complexity cleanly.',
                        difficulty: 'medium',
                        topic: 'Architecture'
                    },
                    {
                        questionIndex: 2,
                        type: 'mcq',
                        question: 'Which strategy is most effective when managing concurrent processes?',
                        options: [
                            'Mutual exclusion and lock coordination',
                            'Unchecked memory sharing',
                            'Sequential execution only',
                            'Ignoring race conditions'
                        ],
                        correctAnswer: 'Mutual exclusion and lock coordination',
                        explanation: 'Mutual exclusion prevents simultaneous access to critical sections, avoiding race conditions.',
                        difficulty: 'hard',
                        topic: 'Application'
                    }
                ]
            });
        }
        else if (systemStr.includes('learning plan') || lastContent.toLowerCase().includes('plan')) {
            outputText = JSON.stringify({
                title: `Mastery Learning Plan: ${lastContent.slice(0, 40)}`,
                subject: 'Computer Science',
                goal: 'Understand core principles, solve problems, and prepare for exams',
                summary: 'A structured roadmap covering foundational fundamentals, advanced architecture, and practical checkpoints.',
                modules: [
                    {
                        weekNumber: 1,
                        title: 'Week 1: Fundamentals & Core Architecture',
                        description: 'Introduction to foundational models, structure, and basic workflows.',
                        topics: ['Introduction to Core Architecture', 'Memory & Data Models', 'Basic Control Flow'],
                        subtopics: ['Component interactions', 'State representation', 'Initialization'],
                        estimatedHours: 6
                    },
                    {
                        weekNumber: 2,
                        title: 'Week 2: Deep Dive & Practical Workflows',
                        description: 'Advanced mechanisms, concurrency, and performance tuning.',
                        topics: ['Process Coordination & Scheduling', 'Resource Allocation', 'Optimization Techniques'],
                        subtopics: ['Deadlock prevention', 'Paging & Caching', 'Throughput maximization'],
                        estimatedHours: 8
                    },
                    {
                        weekNumber: 3,
                        title: 'Week 3: Revision & Examination Prep',
                        description: 'Comprehensive review, practice problems, and quiz checkpoints.',
                        topics: ['Mock Exam Questions', 'Case Studies & Synthesis', 'Final Review'],
                        subtopics: ['Edge case analysis', 'Timed practice', 'Self-evaluation'],
                        estimatedHours: 5
                    }
                ],
                tasks: [
                    {
                        weekNumber: 1,
                        title: 'Read Introduction and Core Concepts',
                        description: 'Review foundational notes and understand high-level architecture.',
                        type: 'reading',
                        priority: 'high',
                        estimatedMinutes: 45
                    },
                    {
                        weekNumber: 1,
                        title: 'Complete Practice Exercise on Data Structures',
                        description: 'Implement key data structures and test their behavior.',
                        type: 'practice',
                        priority: 'medium',
                        estimatedMinutes: 60
                    },
                    {
                        weekNumber: 1,
                        title: 'Week 1 Quiz Checkpoint',
                        description: 'Take a self-assessment quiz on Week 1 topics.',
                        type: 'quiz_checkpoint',
                        priority: 'high',
                        estimatedMinutes: 30
                    },
                    {
                        weekNumber: 2,
                        title: 'Study Concurrency & Process Synchronization',
                        description: 'Examine semaphores, mutex locks, and monitor primitives.',
                        type: 'topic',
                        priority: 'high',
                        estimatedMinutes: 60
                    },
                    {
                        weekNumber: 2,
                        title: 'Solve Synchronization Problem Sets',
                        description: 'Work through classic Producer-Consumer and Dining Philosophers problems.',
                        type: 'practice',
                        priority: 'high',
                        estimatedMinutes: 90
                    },
                    {
                        weekNumber: 3,
                        title: 'Comprehensive Review of Weak Topics',
                        description: 'Review missed quiz questions and flashcard concepts.',
                        type: 'revision',
                        priority: 'medium',
                        estimatedMinutes: 60
                    }
                ]
            });
        }
        else {
            outputText = JSON.stringify({
                status: 'success',
                result: 'Operation completed successfully with structured output.'
            });
        }
    }
    else {
        // Normal RAG / Chat text response
        if (systemStr.includes('RAG') || systemStr.includes('course materials')) {
            outputText = `Based on your uploaded course materials:\n\n1. **Core Concept Overview**: The study materials emphasize the essential mechanisms and architectural flow involved in this subject.\n2. **Key Findings**: All components operate in synchronization to ensure high throughput, fault tolerance, and data integrity.\n3. **Practical Application**: When applying these concepts, remember to account for boundary conditions and state transitions.\n\n*Refer to your course documents for additional detailed theorems and case studies.*`;
        }
        else {
            outputText = `Here is a clear breakdown to help you study:\n\n- **Concept**: Let's break down "${lastContent.slice(0, 50)}".\n- **Explanation**: This topic revolves around structured coordination and step-by-step problem-solving.\n- **Study Tip**: Try breaking the problem down into smaller sub-problems and test your understanding with a short quiz!`;
        }
    }
    return {
        id: `mock-completion-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: params.model || 'gpt-4o-mini',
        choices: [
            {
                index: 0,
                message: {
                    role: 'assistant',
                    content: outputText,
                },
                finish_reason: 'stop',
            },
        ],
        usage: {
            prompt_tokens: 150,
            completion_tokens: 250,
            total_tokens: 400,
        },
    };
};
//# sourceMappingURL=openai.js.map