# AI Learning & Study Assistant

A production-ready full-stack AI-powered learning and study platform built with **React**, **Vite**, **TypeScript**, **Tailwind CSS**, **Node.js**, **Express**, **MongoDB**, and **OpenAI RAG (Retrieval Augmented Generation)**.

---

## 🌟 Key Features

1. **Personalized AI Learning Plans**:
   - Generates custom academic roadmaps based on subjects, target deadlines, exam dates, daily hours, and knowledge level.
   - Interactive weekly milestones with actionable tasks, revision schedules, and practice checkpoints.
2. **Grounded Course Materials RAG (Retrieval Augmented Generation)**:
   - Supports uploading **PDF**, **DOCX**, **TXT**, and **Markdown (MD)** documents.
   - Smart recursive text chunking and 1536-dimensional vector embedding generation.
   - Real-time similarity retrieval with strict grounding to eliminate hallucinated facts.
   - Source citations with document names, page numbers, and inspection previews.
3. **ChatGPT-Style Study Interface**:
   - 3 specialized modes:
     - **Course Materials (RAG)**: Strictly queries uploaded documents with verified citation previews.
     - **General Study**: AI Tutor with personalized memory and AI tool calling.
     - **Exam Preparation**: Socratic professor coaching, diagnostic inquiries, and gap checking.
   - Markdown formatting, syntax highlighted code blocks with one-click copy, and persistent conversation history.
4. **Persistent AI Learner Memory**:
   - Retains non-sensitive student insights (e.g. learning style, weak concepts, target scores).
   - Injected into prompts to tailor study explanations and quizzes.
   - Full memory management dashboard in Settings.
5. **Interactive AI Quiz Generator & Evaluator**:
   - Generates MCQ, True/False, and Short Answer questions from course notes.
   - Countdown timer, instant score calculation, percentage mastery, and confetti animations.
   - Automatically detects and flags weak topics for revision.
6. **Data-Driven Progress & Streak Tracking**:
   - Real consecutive daily study streak calculations from timestamped sessions.
   - 7-day activity timeline charts and topic accuracy matrix.
   - Explainable AI recommendations calculated from actual performance history.
7. **Production Security & Monorepo Architecture**:
   - JWT authentication, bcrypt password hashing, input validation, Helmet, Rate Limiting, and CORS.

---

## 🏗️ Architecture

```
                                  ┌───────────────────────────────┐
                                  │   React + Vite + Tailwind UI  │
                                  └───────────────┬───────────────┘
                                                  │ REST API / JWT
                                  ┌───────────────▼───────────────┐
                                  │   Node.js / Express Server    │
                                  └───────┬───────────────┬───────┘
                                          │               │
                     ┌────────────────────┴──┐         ┌──┴──────────────────┐
                     │ MongoDB & Mongoose    │         │ OpenAI Subsystem    │
                     │  - Users & Profiles   │         │  - Chat Completion  │
                     │  - Courses & Docs     │         │  - Vector Embeddings│
                     │  - Vector Chunks      │         │  - 8 AI Tools       │
                     │  - Quizzes & Plans    │         │  - Grounded RAG     │
                     └───────────────────────┘         └─────────────────────┘
```

---

## 📁 Monorepo Folder Structure

```
.
├── client/                     # React 18 + Vite + TypeScript Frontend
│   ├── src/
│   │   ├── components/         # Common buttons, cards, modals, file uploader, chat & quiz players
│   │   ├── contexts/           # AuthContext & ThemeContext
│   │   ├── layouts/            # AppLayout with sidebar & streak badge
│   │   ├── pages/              # Dashboard, Courses, Materials, Chat, Quizzes, Plans, Progress, Settings
│   │   ├── services/           # Axios API instance with JWT interceptor
│   │   ├── types/              # Comprehensive TypeScript interfaces
│   │   ├── index.css           # Tailwind design tokens & glassmorphism
│   │   └── main.tsx            # Application entrypoint
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── server/                     # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── ai/                 # OpenAI client & fallback response generator
│   │   ├── config/             # Environment variables & MongoDB connection
│   │   ├── controllers/        # Auth, Courses, Documents, Chat, Plans, Quizzes, Progress, Memory
│   │   ├── middleware/         # JWT Auth, Error Handler, Multer File Upload
│   │   ├── models/             # Mongoose Models (User, Course, Document, Chunk, Plan, Quiz, Memory, etc.)
│   │   ├── rag/                # Text extraction (PDF/DOCX/TXT/MD), Chunking, Embeddings, Vector Store
│   │   ├── routes/             # Express route declarations
│   │   ├── scripts/            # Seed script with demo user & course data
│   │   ├── services/           # MemoryService & RecommendationService
│   │   ├── tools/              # AI Tool Registry & Tool Executor
│   │   └── server.ts           # Server bootstrap
│   ├── tests/                  # Jest & Supertest Integration test suites
│   ├── package.json
│   └── tsconfig.json
├── package.json                # Root package for monorepo coordination
├── .env.example                # Environment variables template
└── README.md                   # Complete documentation
```

---

## 🚀 Quick Start & Installation

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **MongoDB**: Local MongoDB instance (e.g. `mongodb://127.0.0.1:27017`) or MongoDB Atlas URI
- **OpenAI API Key** (optional for test mode; intelligent fallback operates out of the box)

### 2. Clone & Install Dependencies

```bash
# Install root, server, and client dependencies
npm run install:all
```

Or install individually:
```bash
cd server && npm install
cd ../client && npm install
```

---

## ⚙️ Environment Variables Setup

Create a `.env` file in the project root:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://127.0.0.1:27017/ai_study_assistant

# Security
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long
JWT_EXPIRES_IN=7d

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Storage & Uploads
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=25

# Vector Search (options: 'auto', 'atlas', 'in-memory')
VECTOR_SEARCH_TYPE=auto
```

---

## 🗄️ MongoDB & Vector Search Setup

### In-Memory / Local MongoDB Vector Search (Default - Zero Extra Config)
By default, the vector store generates 1536-dimensional normalized embeddings and calculates cosine distances directly with user-level isolation in MongoDB. No Atlas account or custom cluster setup is required to run locally.

### MongoDB Atlas Vector Search (Optional for Atlas Deployments)
If deploying to MongoDB Atlas, create a Vector Search index on the `documentchunks` collection named `vector_index`:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "userId"
    },
    {
      "type": "filter",
      "path": "courseId"
    }
  ]
}
```

---

## 🧪 Running the Application

### 1. Seed the Database
Populate a demo user, sample course, lecture notes with vector chunks, active roadmap, and sample quiz:

```bash
npm run seed
```
- **Demo User Email**: `demo@studyassistant.ai`
- **Demo Password**: `password123`

### 2. Run Backend Server

```bash
npm run dev:server
```
*Server starts at `http://localhost:5000` with API health check at `http://localhost:5000/api/health`.*

### 3. Run Frontend Client

```bash
npm run dev:client
```
*Client starts at `http://localhost:5173`.*

---

## 🔬 Testing & Verification

Run the automated test suite using Jest and MongoDB Memory Server:

```bash
npm test
```

### Verified Test Suites:
- `auth.test.ts`: User registration, password hashing, JWT creation, profile updates, and login validation.
- `rag.test.ts`: PDF/DOCX/TXT extraction, text cleaning, recursive semantic chunking, embedding generation, vector similarity search, and source citations.
- `quiz.test.ts`: Structured quiz generation, multi-format answer evaluation, percentage scoring, and weak topic identification.
- `progress.test.ts`: Consecutive study streak calculations, 7-day timeline metrics, and explainable recommendations.

---

## 🛠️ REST API Specification

### Authentication
- `POST /api/auth/register` - Create student account
- `POST /api/auth/login` - Authenticate and receive JWT token
- `GET /api/auth/me` - Fetch authenticated user profile
- `PUT /api/auth/profile` - Update learning style, goals, and level

### Courses & Documents
- `POST /api/courses` - Create course
- `GET /api/courses` - List courses with stats
- `GET /api/courses/:id` - Get course detail
- `DELETE /api/courses/:id` - Delete course and cascade delete documents
- `POST /api/documents/upload` - Upload PDF/DOCX/TXT/MD, extract text, chunk, and embed
- `GET /api/documents` - List uploaded documents
- `GET /api/documents/:id` - Inspect document vector chunks
- `DELETE /api/documents/:id` - Delete document and associated vector chunks

### AI Study Chat & RAG
- `POST /api/chat` - Send user question in Course Materials (RAG), General Study, or Exam Prep mode
- `GET /api/chat/conversations` - List study chat sessions
- `GET /api/chat/conversations/:id` - Get conversation with full message history
- `DELETE /api/chat/conversations/:id` - Delete conversation

### Learning Plans & Tasks
- `POST /api/learning-plans` - Generate AI learning plan
- `GET /api/learning-plans` - List learning plans
- `GET /api/learning-plans/:id` - Get plan roadmap and tasks
- `PATCH /api/learning-plans/:id/tasks/:taskId` - Update task status (`todo`, `in_progress`, `completed`)
- `DELETE /api/learning-plans/:id` - Delete plan

### Quizzes & Progress
- `POST /api/quizzes/generate` - Generate AI quiz from course materials
- `GET /api/quizzes` - List quizzes
- `GET /api/quizzes/:id` - Get quiz for taking
- `POST /api/quizzes/:id/submit` - Submit answers, evaluate score, and detect weak topics
- `GET /api/progress` - Get dashboard metrics, streak, 7-day chart, and recommendations

### Memory Management
- `GET /api/memory` - List persistent AI learner memories
- `POST /api/memory` - Manually add memory insight
- `DELETE /api/memory/:id` - Delete memory

---

## 🛡️ Production Deployment

1. **Build Client & Server**:
   ```bash
   npm run build
   ```
2. **Start Production Server**:
   ```bash
   cd server && npm start
   ```
3. The frontend production bundle in `client/dist` can be served directly by a static host or reverse-proxied via NGINX.
