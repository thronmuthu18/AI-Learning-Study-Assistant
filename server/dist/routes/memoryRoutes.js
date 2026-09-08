"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const memoryController_1 = require("../controllers/memoryController");
const auth_1 = require("../middleware/auth");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', (0, asyncHandler_1.asyncHandler)(memoryController_1.getMemories));
router.post('/', (0, asyncHandler_1.asyncHandler)(memoryController_1.createMemory));
router.delete('/:id', (0, asyncHandler_1.asyncHandler)(memoryController_1.deleteMemory));
exports.default = router;
//# sourceMappingURL=memoryRoutes.js.map