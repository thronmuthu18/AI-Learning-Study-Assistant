"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const quizController_1 = require("../controllers/quizController");
const auth_1 = require("../middleware/auth");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post('/generate', (0, asyncHandler_1.asyncHandler)(quizController_1.generateQuiz));
router.get('/', (0, asyncHandler_1.asyncHandler)(quizController_1.getQuizzes));
router.get('/:id', (0, asyncHandler_1.asyncHandler)(quizController_1.getQuizById));
router.post('/:id/submit', (0, asyncHandler_1.asyncHandler)(quizController_1.submitQuiz));
exports.default = router;
//# sourceMappingURL=quizRoutes.js.map