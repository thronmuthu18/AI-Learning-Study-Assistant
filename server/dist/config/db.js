"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDB = exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const index_1 = __importDefault(require("./index"));
const connectDB = async (customUri) => {
    const uri = customUri || index_1.default.mongoUri;
    try {
        const conn = await mongoose_1.default.connect(uri, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log(`[Database] MongoDB connected successfully to: ${conn.connection.host}/${conn.connection.name}`);
        return conn;
    }
    catch (error) {
        console.error('[Database] MongoDB connection error:', error);
        if (index_1.default.env === 'production') {
            process.exit(1);
        }
        throw error;
    }
};
exports.connectDB = connectDB;
const disconnectDB = async () => {
    try {
        await mongoose_1.default.disconnect();
        console.log('[Database] MongoDB disconnected cleanly');
    }
    catch (error) {
        console.error('[Database] Disconnect error:', error);
    }
};
exports.disconnectDB = disconnectDB;
//# sourceMappingURL=db.js.map