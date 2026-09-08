"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const progressController_1 = require("../controllers/progressController");
const auth_1 = require("../middleware/auth");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', (0, asyncHandler_1.asyncHandler)(progressController_1.getProgressDashboard));
exports.default = router;
//# sourceMappingURL=progressRoutes.js.map