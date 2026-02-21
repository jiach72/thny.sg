import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import swaggerUi from 'swagger-ui-express'
import { config } from './config/index.js'
import { swaggerSpec } from './config/swagger.js'
import routes from './routes/index.js'
import { errorHandler } from './middlewares/index.js'
import { initWebSocket } from './services/websocketService.js'
import logger from './config/logger.js'
import morgan from 'morgan'
import { prisma } from './config/index.js'
import { closeRedis } from './config/redis.js'

const app = express()
const httpServer = createServer(app)

// 配置 Morgan 将 HTTP 请求切片输出到 Winston 日志器
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }))

// 初始化 WebSocket
initWebSocket(httpServer)

// CORS 配置
app.use(cors({
    origin: config.cors.origins,
    credentials: true,
}))

// 解析 JSON
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Swagger API 文档（仅开发环境）
if (config.nodeEnv !== 'production') {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'TongHai CRM API 文档',
    }))
    // JSON 格式的 OpenAPI spec
    app.get('/api-docs.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.send(swaggerSpec)
    })
}

// API 路由
app.use('/api/v1', routes)

// 404 处理
app.use((req, res) => {
    res.status(404).json({
        code: 'NOT_FOUND',
        message: `路由不存在: ${req.method} ${req.path}`,
    })
})

// 错误处理
app.use(errorHandler)

// 启动服务器
const PORT = config.port

httpServer.listen(PORT, '0.0.0.0', () => {
    logger.info(`
  ╔═══════════════════════════════════════════════╗
  ║                                               ║
  ║   🚀 TongHai CRM API Server                   ║
  ║                                               ║
  ║   Environment: ${config.nodeEnv.padEnd(30)}║
  ║   Port: ${String(PORT).padEnd(38)}║
  ║   API: http://localhost:${PORT}/api/v1${' '.repeat(14)}║
  ║   WebSocket: ✅                                ║
  ║                                               ║
  ╚═══════════════════════════════════════════════╝
  `)
})

// ==================== 平滑退出 (Graceful Shutdown) ====================
async function gracefulShutdown(signal: string) {
    logger.info(`\n🛑 接收到 ${signal} 信号，准备进行平滑退出...`)

    // 超时保护：如果 10 秒内没有退出完成，则强制退出
    const forceExitTimer = setTimeout(() => {
        logger.error('⏰ 平滑退出超时（10s），强制退出')
        process.exit(1)
    }, 10_000)
    forceExitTimer.unref() // 不阻止进程退出

    try {
        // 1. 停止接受新的 HTTP 请求（等待现有连接排空）
        await new Promise<void>((resolve, reject) => {
            httpServer.close((err) => {
                if (err) {
                    logger.error('HTTP 服务器关闭时发生错误:', err)
                    reject(err)
                } else {
                    logger.info('✅ HTTP 服务器已停止接受新连接')
                    resolve()
                }
            })
        })

        // 2. 关闭 Redis 连接
        await closeRedis()

        // 3. 断开 Prisma 数据库连接
        await prisma.$disconnect()
        logger.info('✅ Prisma 数据库连接已断开')

        logger.info('👋 服务已安全退出')
        process.exit(0)
    } catch (error) {
        logger.error('💥 平滑退出过程中发生错误:', error)
        process.exit(1)
    }
}

// 监听终止信号
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

export default app
