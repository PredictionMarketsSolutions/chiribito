"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';
// Custom format for development (colored and readable)
const devFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: 'HH:mm:ss' }), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
        msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
}));
// Production format (JSON for log aggregation)
const prodFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    format: isProduction ? prodFormat : devFormat,
    defaultMeta: { service: 'chiribito-backend' },
    transports: [
        new winston_1.default.transports.Console(),
    ],
});
// Add file transports in production
if (isProduction) {
    logger.add(new winston_1.default.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 10485760, // 10MB
        maxFiles: 5,
    }));
    logger.add(new winston_1.default.transports.File({
        filename: 'logs/combined.log',
        maxsize: 10485760, // 10MB
        maxFiles: 5,
    }));
}
// Convenience wrappers matching console API
exports.default = {
    debug: (message, meta) => logger.debug(message, meta),
    info: (message, meta) => logger.info(message, meta),
    warn: (message, meta) => logger.warn(message, meta),
    error: (message, meta) => logger.error(message, meta),
    // Keep console for backwards compatibility during migration
    log: (message, meta) => logger.info(message, meta),
};
