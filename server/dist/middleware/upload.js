"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const config_1 = __importDefault(require("../config"));
const errorHandler_1 = require("./errorHandler");
// Ensure upload directory exists
if (!fs_1.default.existsSync(config_1.default.uploadDir)) {
    fs_1.default.mkdirSync(config_1.default.uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, config_1.default.uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        const baseName = path_1.default.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
        cb(null, `${baseName}-${uniqueSuffix}${ext}`);
    },
});
const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.docx', '.txt', '.md'];
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
        cb(null, true);
    }
    else {
        cb(new errorHandler_1.AppError(`Unsupported file format "${ext}". Supported formats: PDF, DOCX, TXT, MD.`, 400));
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: config_1.default.maxFileSizeMb * 1024 * 1024,
    },
});
exports.default = exports.upload;
//# sourceMappingURL=upload.js.map