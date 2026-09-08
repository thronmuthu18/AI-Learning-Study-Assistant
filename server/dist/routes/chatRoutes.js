"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chatController_1 = require("../controllers/chatController");
const auth_1 = require("../middleware/auth");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post('/', (0, asyncHandler_1.asyncHandler)(chatController_1.sendMessage));
router.get('/conversations', (0, asyncHandler_1.asyncHandler)(chatController_1.getConversations));
router.get('/conversations/:id', (0, asyncHandler_1.asyncHandler)(chatController_1.getConversationById));
router.delete('/conversations/:id', (0, asyncHandler_1.asyncHandler)(chatController_1.deleteConversation));
exports.default = router;
//# sourceMappingURL=chatRoutes.js.map