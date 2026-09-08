"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const morgan_1 = __importDefault(require("morgan"));
const config_1 = __importDefault(require("./config"));
const db_1 = require("./config/db");
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = require("./middleware/errorHandler");
exports.app = (0, express_1.default)();
// Security HTTP headers
exports.app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
// CORS configuration
exports.app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin)
            return callback(null, true);
        return callback(null, true);
    },
    credentials: true,
}));
// Body Parsers
exports.app.use(express_1.default.json({ limit: '10mb' }));
exports.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Request logging
if (config_1.default.env !== 'test') {
    exports.app.use((0, morgan_1.default)('dev'));
}
// Rate Limiting (100 requests per 15 minutes per IP for API)
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes',
    },
});
exports.app.use('/api/', limiter);
// Serve uploaded files securely if needed
exports.app.use('/uploads', express_1.default.static(config_1.default.uploadDir));
// API Routes
exports.app.use('/api', routes_1.default);
// Root route
exports.app.get('/', (req, res) => {
    res.json({
        name: 'AI Learning & Study Assistant API',
        status: 'operational',
        version: '1.0.0',
        docs: '/api/health',
    });
});
// Centralized Error Handler
exports.app.use(errorHandler_1.errorHandler);
// Start server if not running in test mode
if (process.env.NODE_ENV !== 'test') {
    (0, db_1.connectDB)().then(() => {
        exports.app.listen(config_1.default.port, () => {
            console.log(`=========================================`);
            console.log(`🚀 AI Study Assistant Server running on http://localhost:${config_1.default.port}`);
            console.log(`📡 Environment: ${config_1.default.env}`);
            console.log(`🌐 Client Origin: ${config_1.default.clientUrl}`);
            console.log(`=========================================`);
        });
    });
}
exports.default = exports.app;
//# sourceMappingURL=server.js.map