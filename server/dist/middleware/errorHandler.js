"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
const zod_1 = require("zod");
const config_1 = __importDefault(require("../config"));
class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let errors = undefined;
    // Zod validation errors
    if (err instanceof zod_1.ZodError) {
        statusCode = 400;
        message = 'Validation failed';
        errors = err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));
    }
    // Mongoose validation error
    else if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Database validation failed';
        errors = Object.values(err.errors || {}).map((val) => ({
            field: val.path,
            message: val.message,
        }));
    }
    // Mongoose duplicate key error (11000)
    else if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        message = `A record with this ${field} already exists.`;
    }
    // Mongoose CastError (invalid ObjectId)
    else if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid ID format for ${err.path}`;
    }
    // Multer errors
    else if (err.name === 'MulterError') {
        statusCode = 400;
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = `File is too large. Maximum size is ${config_1.default.maxFileSizeMb}MB.`;
        }
        else {
            message = `File upload error: ${err.message}`;
        }
    }
    // Log non-operational (unexpected) errors
    if (statusCode >= 500) {
        console.error('[Unhandled Server Error]', err);
    }
    res.status(statusCode).json({
        success: false,
        message,
        errors,
        ...(config_1.default.env === 'development' && { stack: err.stack }),
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map