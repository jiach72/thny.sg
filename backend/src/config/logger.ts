import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import path from 'path'

const logDir = process.env.LOG_DIR || 'logs'

// 敏感字段脱敏：防止密码、令牌等敏感信息泄露到日志中
const sensitiveFields = ['password', 'token', 'accessToken', 'refreshToken', 'secret', 'apiKey', 'authorization', 'cookie']
const sanitizeFormat = winston.format((info) => {
    if (typeof info === 'object' && info !== null) {
        for (const key of Object.keys(info)) {
            if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
                info[key] = '[REDACTED]'
            }
            if (typeof info[key] === 'string') {
                for (const field of sensitiveFields) {
                    const regex = new RegExp(`(${field}\\s*[:=]\\s*)[\\S]+`, 'gi')
                    info[key] = (info[key] as string).replace(regex, '$1[REDACTED]')
                }
            }
        }
    }
    return info
})

const logFormat = winston.format.combine(
    sanitizeFormat(),
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
        new DailyRotateFile({
            filename: path.join(logDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxSize: '20m',
            maxFiles: '14d',
            zippedArchive: true,
        }),
        // 所有日志
        new DailyRotateFile({
            filename: path.join(logDir, 'combined-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '14d',
            zippedArchive: true,
        }),
    ],
})

// 所有环境都输出到 console (Docker 日志通过 stdout 收集)
logger.add(
    new winston.transports.Console({
        format: consoleFormat,
    })
)

export default logger
