"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authRoutes_1 = __importDefault(require("./authRoutes"));
const courseRoutes_1 = __importDefault(require("./courseRoutes"));
const documentRoutes_1 = __importDefault(require("./documentRoutes"));
const chatRoutes_1 = __importDefault(require("./chatRoutes"));
const learningPlanRoutes_1 = __importDefault(require("./learningPlanRoutes"));
const quizRoutes_1 = __importDefault(require("./quizRoutes"));
const progressRoutes_1 = __importDefault(require("./progressRoutes"));
const memoryRoutes_1 = __importDefault(require("./memoryRoutes"));
const apiRouter = (0, express_1.Router)();
apiRouter.use('/auth', authRoutes_1.default);
apiRouter.use('/courses', courseRoutes_1.default);
apiRouter.use('/documents', documentRoutes_1.default);
apiRouter.use('/chat', chatRoutes_1.default);
apiRouter.use('/learning-plans', learningPlanRoutes_1.default);
apiRouter.use('/quizzes', quizRoutes_1.default);
apiRouter.use('/progress', progressRoutes_1.default);
apiRouter.use('/memory', memoryRoutes_1.default);
// Health check endpoint
apiRouter.get('/health', (req, res) => {
    res.status(200).json({
        status: 'online',
        service: 'AI Learning & Study Assistant API',
        timestamp: new Date().toISOString(),
    });
});
exports.default = apiRouter;
//# sourceMappingURL=index.js.map