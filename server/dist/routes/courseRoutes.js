"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const courseController_1 = require("../controllers/courseController");
const auth_1 = require("../middleware/auth");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post('/', (0, asyncHandler_1.asyncHandler)(courseController_1.createCourse));
router.get('/', (0, asyncHandler_1.asyncHandler)(courseController_1.getCourses));
router.get('/:id', (0, asyncHandler_1.asyncHandler)(courseController_1.getCourseById));
router.put('/:id', (0, asyncHandler_1.asyncHandler)(courseController_1.updateCourse));
router.delete('/:id', (0, asyncHandler_1.asyncHandler)(courseController_1.deleteCourse));
exports.default = router;
//# sourceMappingURL=courseRoutes.js.map