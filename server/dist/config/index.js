"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load .env from root or current directory
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../.env') });
dotenv_1.default.config();
exports.config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
    mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_study_assistant',
    jwtSecret: process.env.JWT_SECRET || 'super_secret_jwt_key_study_assistant_default_secret_32_chars',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    openaiEmbeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
    uploadDir: path_1.default.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads'),
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '25', 10),
    vectorSearchType: process.env.VECTOR_SEARCH_TYPE || 'auto', // 'atlas', 'in-memory', 'auto'
};
exports.default = exports.config;
//# sourceMappingURL=index.js.map