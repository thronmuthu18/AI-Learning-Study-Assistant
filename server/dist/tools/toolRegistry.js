"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AI_TOOLS = void 0;
exports.AI_TOOLS = [
    {
        type: 'function',
        function: {
            name: 'searchCourseMaterials',
            description: 'Search uploaded course materials using vector semantic search to retrieve relevant text chunks, document names, and page numbers.',
            parameters: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'The search query or concept to look up in the uploaded course documents.',
                    },
                    courseId: {
                        type: 'string',
                        description: 'Optional ID of the course to restrict search to.',
                    },
                },
                required: ['query'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'getUserProgress',
            description: 'Retrieve the student’s current overall progress, study streak, completed learning tasks, and quiz statistics.',
            parameters: {
                type: 'object',
                properties: {},
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'getLearningPlan',
            description: 'Retrieve the active learning plan, modules, upcoming tasks, and completion percentage for the current student.',
            parameters: {
                type: 'object',
                properties: {
                    courseId: {
                        type: 'string',
                        description: 'Optional course ID filter.',
                    },
                },
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'getQuizHistory',
            description: 'Retrieve recent quiz attempts, scores, identified weak topics, and strong areas for the student.',
            parameters: {
                type: 'object',
                properties: {
                    limit: {
                        type: 'number',
                        description: 'Number of recent quiz attempts to retrieve (default: 5).',
                    },
                },
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'saveMemory',
            description: 'Save a useful non-sensitive learning insight about the student (e.g., preferred learning style, weak topic, learning goal, study preference).',
            parameters: {
                type: 'object',
                properties: {
                    type: {
                        type: 'string',
                        enum: [
                            'learning_style',
                            'preference',
                            'weak_topic',
                            'strong_topic',
                            'goal',
                            'performance_pattern',
                            'study_habit',
                        ],
                        description: 'Category of the memory.',
                    },
                    content: {
                        type: 'string',
                        description: 'The specific fact or preference to remember about the student.',
                    },
                    importance: {
                        type: 'number',
                        description: 'Importance score between 1 (minor) and 10 (crucial).',
                    },
                },
                required: ['type', 'content'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'createStudyPlan',
            description: 'Create a new customized learning plan roadmap for a subject with weekly modules and actionable tasks.',
            parameters: {
                type: 'object',
                properties: {
                    subject: { type: 'string', description: 'Subject or course title' },
                    goal: { type: 'string', description: 'Student primary learning goal' },
                    currentKnowledgeLevel: {
                        type: 'string',
                        enum: ['beginner', 'intermediate', 'advanced'],
                    },
                    availableHoursPerDay: { type: 'number', description: 'Hours per day' },
                    targetDate: { type: 'string', description: 'Target completion date (YYYY-MM-DD)' },
                },
                required: ['subject', 'goal'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'generateQuiz',
            description: 'Generate an interactive quiz with multiple choice, true/false, and short answer questions from course materials.',
            parameters: {
                type: 'object',
                properties: {
                    topic: { type: 'string', description: 'Topic or subject for the quiz' },
                    difficulty: {
                        type: 'string',
                        enum: ['easy', 'medium', 'hard'],
                        description: 'Difficulty level',
                    },
                    questionCount: { type: 'number', description: 'Number of questions to generate (3-15)' },
                },
                required: ['topic'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'recommendNextTopic',
            description: 'Get an explainable recommendation for what topic the student should study next based on quiz errors, learning plan, and past performance.',
            parameters: {
                type: 'object',
                properties: {},
            },
        },
    },
];
//# sourceMappingURL=toolRegistry.js.map