import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// Custom format for development (colored and readable)
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Production format (JSON for log aggregation)
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  format: isProduction ? prodFormat : devFormat,
  defaultMeta: { service: 'chiribito-backend' },
  transports: [
    new winston.transports.Console(),
  ],
});

// Add file transports in production
if (isProduction) {
  logger.add(new winston.transports.File({ 
    filename: 'logs/error.log', 
    level: 'error',
    maxsize: 10485760, // 10MB
    maxFiles: 5,
  }));
  logger.add(new winston.transports.File({ 
    filename: 'logs/combined.log',
    maxsize: 10485760, // 10MB
    maxFiles: 5,
  }));
}

// Add file transports in development too (for persistent logs)
if (isDevelopment) {
  logger.add(new winston.transports.File({ 
    filename: 'logs/dev.log',
    maxsize: 5242880, // 5MB
    maxFiles: 3,
  }));
  logger.add(new winston.transports.File({ 
    filename: 'logs/dev-error.log',
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 3,
  }));
}

// Convenience wrappers matching console API
export default {
  debug: (message: string, meta?: any) => logger.debug(message, meta),
  info: (message: string, meta?: any) => logger.info(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  error: (message: string, meta?: any) => logger.error(message, meta),
  
  // Keep console for backwards compatibility during migration
  log: (message: string, meta?: any) => logger.info(message, meta),
};
