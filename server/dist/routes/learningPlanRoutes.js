"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const learningPlanController_1 = require("../controllers/learningPlanController");
const auth_1 = require("../middleware/auth");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post('/', (0, asyncHandler_1.asyncHandler)(learningPlanController_1.generateLearningPlan));
router.get('/', (0, asyncHandler_1.asyncHandler)(learningPlanController_1.getLearningPlans));
router.get('/:id', (0, asyncHandler_1.asyncHandler)(learningPlanController_1.getLearningPlanById));
router.patch('/:id/tasks/:taskId', (0, asyncHandler_1.asyncHandler)(learningPlanController_1.updateTaskStatus));
router.delete('/:id', (0, asyncHandler_1.asyncHandler)(learningPlanController_1.deleteLearningPlan));
exports.default = router;
//# sourceMappingURL=learningPlanRoutes.js.map