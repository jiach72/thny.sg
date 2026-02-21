import winston from 'winston'
import path from 'path'

const logDir = process.env.LOG_DIR || 'logs'

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
)

const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
        const ctx = context ? `[${context}] ` : ''
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : ''
        return `${timestamp} ${level}: ${ctx}${message} ${metaStr}`
    })
)

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'crm-backend' },
    transports: [
        // 错误日志单独文件
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // 所有日志
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            maxsize: 5242880,
            maxFiles: 5,
        }),
    ],
})

// 开发环境添加控制台输出
if (process.env.NODE_ENV !== 'production') {
    logger.add(
        new winston.transports.Console({
            format: consoleFormat,
        })
    )
}

export default logger
