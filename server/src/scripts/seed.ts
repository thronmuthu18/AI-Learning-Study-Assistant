import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import config from '../config';
import { connectDB, disconnectDB } from '../config/db';
import User from '../models/User';
import Course from '../models/Course';
import DocumentModel from '../models/Document';
import DocumentChunk from '../models/DocumentChunk';
import LearningPlan from '../models/LearningPlan';
import LearningTask from '../models/LearningTask';
import Quiz from '../models/Quiz';
import QuizAttempt from '../models/QuizAttempt';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import Memory from '../models/Memory';
import StudySession from '../models/StudySession';
import { extractTextFromFile } from '../rag/textExtractor';
import { chunkDocument } from '../rag/chunker';
import { generateBatchEmbeddings } from '../rag/embeddings';

const SAMPLE_DOCUMENT_TEXT = `# Chapter 4: Process Synchronization & Concurrency

## 4.1 The Critical-Section Problem
A critical section is a piece of code that accesses shared resources (such as common variables or files) that must not be concurrently accessed by more than one thread of execution.

A valid solution to the critical-section problem must satisfy three requirements:
1. **Mutual Exclusion**: If process Pi is executing in its critical section, then no other processes can be executing in their critical sections.
2. **Progress**: If no process is executing in its critical section and there exist some processes that wish to enter their critical section, then the selection of the next process cannot be postponed indefinitely.
3. **Bounded Waiting**: There must be a bound or limit on the number of times that other processes are allowed to enter their critical sections after a process has made a request to enter and before that request is granted.

## 4.2 Semaphores and Mutex Locks
A mutex (mutual exclusion) lock is a synchronization primitive used to protect critical sections and prevent race conditions. A process must acquire the lock before entering a critical section, and release the lock when it exits.

A semaphore is a synchronization tool that provides more sophisticated ways for processes to synchronize their activities. An integer variable S that, apart from initialization, is accessed only through two standard atomic operations: \`wait()\` (or \`P()\`) and \`signal()\` (or \`V()\`).
- **Counting Semaphores**: Integer value can range over an unrestricted domain. Used to control access to a given resource consisting of a finite number of instances.
- **Binary Semaphores**: Integer value can range only between 0 and 1. Behavior is identical to a mutex lock.

## 4.3 Classic Problems of Synchronization
1. **Bounded-Buffer (Producer-Consumer) Problem**: Producers generate items and put them into a shared buffer, while consumers take items out. Semaphores \`mutex\`, \`empty\`, and \`full\` ensure no buffer overflow or underflow occurs.
2. **Readers-Writers Problem**: Allows multiple readers to read shared data concurrently, but only one writer to modify it with exclusive access.
3. **Dining-Philosophers Problem**: Illustrates allocation of several resources among several processes in a deadlock-free and starvation-free manner.

## 4.4 Deadlocks
A deadlock is a situation where a set of processes are blocked because each process is holding a resource and waiting for another resource held by some other process in the set.

### The Four Necessary Conditions for Deadlock (Coffman Conditions):
1. **Mutual Exclusion**: At least one resource must be held in a non-shareable mode.
2. **Hold and Wait**: A process must be holding at least one resource and waiting to acquire additional resources held by other processes.
3. **No Preemption**: Resources cannot be preempted; a resource can be released only voluntarily by the process holding it.
4. **Circular Wait**: A closed chain of processes exists such that each process holds at least one resource needed by the next process in the chain.

### Handling Deadlocks:
- **Deadlock Prevention**: Disallow at least one of the four necessary Coffman conditions.
- **Deadlock Avoidance**: The Banker's Algorithm uses resource-allocation state knowledge (available, max, allocation, need) to ensure the system never enters an unsafe state.
- **Deadlock Detection and Recovery**: Periodically check wait-for graphs and preempt or terminate processes to break cycles.
`;

export const seedDatabase = async (): Promise<void> => {
  console.log('🌱 Starting Database Seeding...');
  await connectDB();

  // Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    Course.deleteMany({}),
    DocumentModel.deleteMany({}),
    DocumentChunk.deleteMany({}),
    LearningPlan.deleteMany({}),
    LearningTask.deleteMany({}),
    Quiz.deleteMany({}),
    QuizAttempt.deleteMany({}),
    Conversation.deleteMany({}),
    Message.deleteMany({}),
    Memory.deleteMany({}),
    StudySession.deleteMany({}),
  ]);

  console.log('🧹 Cleaned existing database collections.');

  // 1. Create Demo User
  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await User.create({
    name: 'Alex Rivera',
    email: 'demo@studyassistant.ai',
    passwordHash,
    currentLevel: 'intermediate',
    learningGoals: ['Ace Operating Systems Final Exam', 'Master Concurrency & Distributed Architecture'],
    subjects: ['Computer Science', 'Operating Systems', 'System Design'],
    preferences: {
      theme: 'dark',
      preferredLearningStyle: 'reading_writing',
      dailyGoalMinutes: 60,
      explanationDepth: 'detailed',
    },
  });
  console.log(`👤 Created Demo User: ${user.email} (password: password123)`);

  // 2. Create Sample Courses
  const courseOS = await Course.create({
    userId: user._id,
    title: 'Operating Systems & Concurrency',
    code: 'CS301',
    description: 'In-depth study of process synchronization, kernel architectures, virtual memory, and deadlock algorithms.',
    category: 'Computer Science',
    tags: ['Operating Systems', 'Concurrency', 'Semaphores', 'Deadlocks'],
    color: '#6366f1',
    icon: 'Cpu',
  });

  const courseML = await Course.create({
    userId: user._id,
    title: 'Machine Learning Foundations',
    code: 'CS450',
    description: 'Statistical learning theory, neural networks, optimization algorithms, and transformer architectures.',
    category: 'Artificial Intelligence',
    tags: ['Machine Learning', 'Deep Learning', 'PyTorch', 'Math'],
    color: '#8b5cf6',
    icon: 'Brain',
  });
  console.log(`📚 Created Courses: "${courseOS.title}" & "${courseML.title}"`);

  // 3. Create Sample Document & Vector Embeddings
  const uploadDir = config.uploadDir;
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const sampleFilePath = path.join(uploadDir, 'Operating_Systems_Chapter_4_Synchronization.md');
  fs.writeFileSync(sampleFilePath, SAMPLE_DOCUMENT_TEXT, 'utf-8');

  const extraction = await extractTextFromFile(sampleFilePath, 'md');
  const chunks = chunkDocument(extraction.pages, {
    chunkSize: 800,
    chunkOverlap: 120,
    documentId: new mongoose.Types.ObjectId().toString(),
    documentName: 'Process Synchronization & Deadlocks Notes.md',
    courseId: courseOS._id.toString(),
    userId: user._id.toString(),
  });

  const embeddings = await generateBatchEmbeddings(chunks.map((c) => c.content));

  const document = await DocumentModel.create({
    userId: user._id,
    courseId: courseOS._id,
    title: 'Process Synchronization & Deadlocks Notes.md',
    originalFileName: 'Chapter_4_Synchronization_Notes.md',
    storedFileName: path.basename(sampleFilePath),
    filePath: sampleFilePath,
    fileType: 'md',
    fileSize: Buffer.byteLength(SAMPLE_DOCUMENT_TEXT),
    mimeType: 'text/markdown',
    status: 'ready',
    pageCount: extraction.pageCount,
    chunkCount: chunks.length,
    characterCount: extraction.characterCount,
    summary: 'Comprehensive notes covering critical sections, semaphores, mutex locks, and Coffman deadlock conditions.',
  });

  const chunkDocs = chunks.map((chunk, idx) => ({
    userId: user._id,
    courseId: courseOS._id,
    documentId: document._id,
    content: chunk.content,
    chunkIndex: idx,
    pageNumber: chunk.pageNumber,
    documentName: document.title,
    tokenCount: chunk.tokenCount,
    embedding: embeddings[idx],
    metadata: {
      userId: user._id,
      courseId: courseOS._id,
      documentId: document._id,
      documentName: document.title,
      pageNumber: chunk.pageNumber,
      chunkIndex: idx,
      totalChunks: chunks.length,
    },
  }));

  await DocumentChunk.insertMany(chunkDocs);

  courseOS.stats.totalDocuments = 1;
  courseOS.stats.totalChunks = chunks.length;
  await courseOS.save();
  console.log(`📄 Indexed Sample Document with ${chunks.length} vector embeddings`);

  // 4. Create Active Learning Plan
  const learningPlan = await LearningPlan.create({
    userId: user._id,
    courseId: courseOS._id,
    title: 'Operating Systems Exam Mastery Roadmap',
    subject: 'Operating Systems',
    goal: 'Score 90%+ on upcoming university final examination',
    currentKnowledgeLevel: 'intermediate',
    availableHoursPerDay: 2,
    targetDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    preferredLearningStyle: 'reading_writing',
    summary: 'A 3-week rigorous roadmap covering process synchronization, memory management, and deadlock resolution.',
    modules: [
      {
        weekNumber: 1,
        title: 'Week 1: Process Synchronization & Mutexes',
        description: 'Understand critical sections, Peterson’s solution, and semaphore primitives.',
        topics: ['Critical-Section Problem', 'Semaphores & Mutex Locks', 'Producer-Consumer Problem'],
        subtopics: ['Mutual exclusion proof', 'Bounded buffer synchronization'],
        estimatedHours: 6,
      },
      {
        weekNumber: 2,
        title: 'Week 2: Deadlocks & Banker’s Algorithm',
        description: 'Master Coffman conditions, deadlock prevention, and safety state calculations.',
        topics: ['Four Conditions for Deadlock', 'Banker’s Algorithm', 'Deadlock Detection'],
        subtopics: ['Resource allocation graphs', 'Safe state matrices'],
        estimatedHours: 8,
      },
      {
        weekNumber: 3,
        title: 'Week 3: Virtual Memory & Page Replacement',
        description: 'Paging, TLB performance, page faults, and replacement algorithms (LRU, FIFO, Clock).',
        topics: ['Paging & Segmentation', 'Page Replacement Algorithms', 'Thrashing'],
        subtopics: ['TLB hit ratio calculation', 'Optimal vs LRU replacement'],
        estimatedHours: 7,
      },
    ],
    totalTasks: 6,
    completedTasks: 2,
    progressPercentage: 33,
    status: 'active',
  });

  const sampleTasks = [
    {
      planId: learningPlan._id,
      userId: user._id,
      courseId: courseOS._id,
      weekNumber: 1,
      dayNumber: 1,
      title: 'Study Critical-Section Requirements & Peterson’s Algorithm',
      description: 'Review mutual exclusion, progress, and bounded waiting criteria.',
      type: 'reading',
      priority: 'high',
      estimatedMinutes: 45,
      status: 'completed',
      completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      orderIndex: 0,
      sourceTopic: 'Critical-Section Problem',
    },
    {
      planId: learningPlan._id,
      userId: user._id,
      courseId: courseOS._id,
      weekNumber: 1,
      dayNumber: 2,
      title: 'Implement Counting Semaphore in C/C++',
      description: 'Simulate producer-consumer with a bounded buffer using sem_wait and sem_post.',
      type: 'practice',
      priority: 'high',
      estimatedMinutes: 60,
      status: 'completed',
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      orderIndex: 1,
      sourceTopic: 'Semaphores & Mutex Locks',
    },
    {
      planId: learningPlan._id,
      userId: user._id,
      courseId: courseOS._id,
      weekNumber: 1,
      dayNumber: 3,
      title: 'Week 1 Quiz Checkpoint: Concurrency & Locks',
      description: 'Test understanding of atomic operations and race conditions.',
      type: 'quiz_checkpoint',
      priority: 'medium',
      estimatedMinutes: 30,
      status: 'todo',
      orderIndex: 2,
      sourceTopic: 'Semaphores & Mutex Locks',
    },
    {
      planId: learningPlan._id,
      userId: user._id,
      courseId: courseOS._id,
      weekNumber: 2,
      dayNumber: 1,
      title: 'Master the 4 Coffman Deadlock Conditions',
      description: 'Memorize and explain Mutual Exclusion, Hold & Wait, No Preemption, and Circular Wait.',
      type: 'topic',
      priority: 'high',
      estimatedMinutes: 45,
      status: 'todo',
      orderIndex: 3,
      sourceTopic: 'Deadlocks',
    },
    {
      planId: learningPlan._id,
      userId: user._id,
      courseId: courseOS._id,
      weekNumber: 2,
      dayNumber: 2,
      title: 'Solve 3 Banker’s Algorithm Safety State Matrices',
      description: 'Calculate Need matrix and determine if execution vector sequence is safe.',
      type: 'practice',
      priority: 'high',
      estimatedMinutes: 75,
      status: 'todo',
      orderIndex: 4,
      sourceTopic: 'Banker’s Algorithm',
    },
    {
      planId: learningPlan._id,
      userId: user._id,
      courseId: courseOS._id,
      weekNumber: 3,
      dayNumber: 1,
      title: 'Final Revision & Timed Mock Exam',
      description: 'Full course review covering all 3 module checkpoints.',
      type: 'revision',
      priority: 'high',
      estimatedMinutes: 90,
      status: 'todo',
      orderIndex: 5,
      sourceTopic: 'Final Review',
    },
  ];

  await LearningTask.insertMany(sampleTasks);
  console.log('🗺️ Created Active Learning Plan with 6 actionable tasks');

  // 5. Create Sample Quiz
  const quiz = await Quiz.create({
    userId: user._id,
    courseId: courseOS._id,
    documentId: document._id,
    title: 'Process Synchronization & Deadlocks Checkpoint',
    description: 'Test your understanding of critical sections, counting semaphores, and Coffman deadlock conditions.',
    difficulty: 'medium',
    topics: ['Critical Sections', 'Semaphores', 'Deadlock Conditions', 'Banker Algorithm'],
    questions: [
      {
        questionIndex: 0,
        type: 'mcq',
        question: 'Which of the following is NOT one of the three requirements for a valid critical-section solution?',
        options: [
          'Mutual Exclusion',
          'Progress',
          'Bounded Waiting',
          'Preemptive Scheduling',
        ],
        correctAnswer: 'Preemptive Scheduling',
        explanation: 'The three essential requirements are Mutual Exclusion, Progress, and Bounded Waiting.',
        difficulty: 'easy',
        topic: 'Critical Sections',
        sourceReference: {
          documentId: document._id,
          documentName: document.title,
          pageNumber: 1,
          excerpt: 'A valid solution to the critical-section problem must satisfy three requirements: Mutual Exclusion, Progress, Bounded Waiting.',
        },
      },
      {
        questionIndex: 1,
        type: 'true_false',
        question: 'A binary semaphore behaves identically to a mutex lock.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: 'A binary semaphore integer value is restricted between 0 and 1, making it function as a mutual exclusion lock.',
        difficulty: 'medium',
        topic: 'Semaphores',
        sourceReference: {
          documentId: document._id,
          documentName: document.title,
          pageNumber: 1,
          excerpt: 'Binary Semaphores: Integer value can range only between 0 and 1. Behavior is identical to a mutex lock.',
        },
      },
      {
        questionIndex: 2,
        type: 'mcq',
        question: 'Which condition requires that resources cannot be forcibly confiscated from a process holding them?',
        options: [
          'Mutual Exclusion',
          'Hold and Wait',
          'No Preemption',
          'Circular Wait',
        ],
        correctAnswer: 'No Preemption',
        explanation: 'No Preemption means resources can only be released voluntarily by the holding process upon task completion.',
        difficulty: 'medium',
        topic: 'Deadlock Conditions',
        sourceReference: {
          documentId: document._id,
          documentName: document.title,
          pageNumber: 1,
          excerpt: 'No Preemption: Resources cannot be preempted; a resource can be released only voluntarily.',
        },
      },
      {
        questionIndex: 3,
        type: 'mcq',
        question: 'What is the primary algorithm used for deadlock avoidance with multiple resource instances?',
        options: [
          'Peterson Algorithm',
          'Banker’s Algorithm',
          'Round Robin Algorithm',
          'Dijkstra Shortest Path',
        ],
        correctAnswer: 'Banker’s Algorithm',
        explanation: 'The Banker’s algorithm tests for safe states by simulating allocation for maximum possible claims.',
        difficulty: 'hard',
        topic: 'Banker Algorithm',
      },
    ],
    totalQuestions: 4,
  });

  // 6. Create Past Quiz Attempt
  await QuizAttempt.create({
    quizId: quiz._id,
    userId: user._id,
    courseId: courseOS._id,
    answers: [
      {
        questionIndex: 0,
        questionText: 'Which of the following is NOT one of the three requirements for a valid critical-section solution?',
        selectedAnswer: 'Preemptive Scheduling',
        correctAnswer: 'Preemptive Scheduling',
        isCorrect: true,
        explanation: 'Correct! The requirements are Mutual Exclusion, Progress, and Bounded Waiting.',
        topic: 'Critical Sections',
      },
      {
        questionIndex: 1,
        questionText: 'A binary semaphore behaves identically to a mutex lock.',
        selectedAnswer: 'True',
        correctAnswer: 'True',
        isCorrect: true,
        explanation: 'Correct!',
        topic: 'Semaphores',
      },
      {
        questionIndex: 2,
        questionText: 'Which condition requires that resources cannot be forcibly confiscated from a process holding them?',
        selectedAnswer: 'No Preemption',
        correctAnswer: 'No Preemption',
        isCorrect: true,
        explanation: 'Correct!',
        topic: 'Deadlock Conditions',
      },
      {
        questionIndex: 3,
        questionText: 'What is the primary algorithm used for deadlock avoidance with multiple resource instances?',
        selectedAnswer: 'Peterson Algorithm',
        correctAnswer: 'Banker’s Algorithm',
        isCorrect: false,
        explanation: 'Banker’s Algorithm is used for deadlock avoidance with multiple resource instances.',
        topic: 'Banker Algorithm',
      },
    ],
    score: 3,
    totalQuestions: 4,
    percentage: 75,
    weakTopics: ['Banker Algorithm'],
    strongTopics: ['Critical Sections', 'Semaphores', 'Deadlock Conditions'],
    timeSpentSeconds: 110,
    completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  });
  console.log('🎯 Created Sample Quiz & 75% Score Attempt with Weak Topic Analysis');

  // 7. Create Study Sessions (Consecutive 5-day active streak)
  for (let dayOffset = 4; dayOffset >= 0; dayOffset--) {
    const sessionDate = new Date();
    sessionDate.setDate(sessionDate.getDate() - dayOffset);

    await StudySession.create({
      userId: user._id,
      courseId: courseOS._id,
      sessionType: dayOffset % 2 === 0 ? 'reading' : 'quiz',
      durationMinutes: 45 + dayOffset * 10,
      completedTasksCount: dayOffset === 2 || dayOffset === 4 ? 1 : 0,
      activityDate: sessionDate,
      notes: `Daily study activity for Day -${dayOffset}`,
    });
  }
  console.log('🔥 Logged 5-Day Study Sessions for authentic streak calculation');

  // 8. Create Sample Conversation with RAG Grounding
  const conversation = await Conversation.create({
    userId: user._id,
    courseId: courseOS._id,
    title: 'Understanding Coffman Deadlock Conditions',
    mode: 'course_materials',
    messageCount: 2,
    lastMessageAt: new Date(),
  });

  await Message.create({
    conversationId: conversation._id,
    userId: user._id,
    role: 'user',
    content: 'Can you explain the four necessary conditions for deadlock from my course notes?',
    citations: [],
    toolsUsed: [],
  });

  await Message.create({
    conversationId: conversation._id,
    userId: user._id,
    role: 'assistant',
    content: `Based on your uploaded course notes (**${document.title}**, Page 1), a deadlock can occur if and only if all **four Coffman conditions** hold simultaneously:\n\n1. **Mutual Exclusion**: At least one resource must be held in a non-shareable mode (only one process at a time can use it).\n2. **Hold and Wait**: A process must currently hold at least one resource while waiting to acquire additional resources held by other processes.\n3. **No Preemption**: Resources cannot be forcibly taken away; they are released only voluntarily by the holding process.\n4. **Circular Wait**: A closed chain of processes exists $(P_0, P_1, ..., P_n)$ where $P_0$ is waiting for a resource held by $P_1$, and $P_n$ is waiting for a resource held by $P_0$.\n\n💡 *Tip: To prevent deadlocks, you must eliminate at least one of these four conditions!*`,
    citations: [
      {
        documentId: document._id,
        documentName: document.title,
        pageNumber: 1,
        snippet: 'The Four Necessary Conditions for Deadlock: 1. Mutual Exclusion 2. Hold and Wait 3. No Preemption 4. Circular Wait...',
        chunkIndex: 1,
        score: 0.94,
      },
    ],
    toolsUsed: [],
  });
  console.log('💬 Created RAG Sample Conversation with Verified Citations');

  // 9. Create AI Long-Term Memories
  await Memory.create([
    {
      userId: user._id,
      type: 'learning_style',
      content: 'Prefers concise bullet points with concrete code examples in C/C++.',
      importance: 8,
      source: 'user_profile',
    },
    {
      userId: user._id,
      type: 'weak_topic',
      content: 'Needs practice with Banker’s Algorithm matrix calculations and safe state sequences.',
      importance: 9,
      source: 'quiz',
      courseId: courseOS._id,
    },
    {
      userId: user._id,
      type: 'goal',
      content: 'Targeting a final grade of A in CS301 Operating Systems.',
      importance: 7,
      source: 'chat',
    },
  ]);
  console.log('🧠 Stored Personalized AI Memories');

  console.log('✅ Database Seeding Completed Successfully!');
  await disconnectDB();
};

// Execute if run directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding error:', err);
      process.exit(1);
    });
}
