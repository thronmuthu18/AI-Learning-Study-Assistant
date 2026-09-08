"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const User_1 = __importDefault(require("../models/User"));
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                message: 'Authentication required. Missing or invalid Bearer token.',
            });
            return;
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Authentication token is empty.',
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwtSecret);
        const user = await User_1.default.findById(decoded.id);
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'User session expired or user no longer exists.',
            });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            res.status(401).json({
                success: false,
                message: 'Authentication token has expired. Please log in again.',
            });
            return;
        }
        res.status(401).json({
            success: false,
            message: 'Invalid authentication token.',
        });
    }
};
exports.authenticate = authenticate;
//# sourceMappingURL=auth.js.map