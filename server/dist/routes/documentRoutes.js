"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const documentController_1 = require("../controllers/documentController");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post('/upload', upload_1.upload.single('file'), (0, asyncHandler_1.asyncHandler)(documentController_1.uploadDocument));
router.get('/', (0, asyncHandler_1.asyncHandler)(documentController_1.getDocuments));
router.get('/:id', (0, asyncHandler_1.asyncHandler)(documentController_1.getDocumentById));
router.delete('/:id', (0, asyncHandler_1.asyncHandler)(documentController_1.deleteDocument));
exports.default = router;
//# sourceMappingURL=documentRoutes.js.map