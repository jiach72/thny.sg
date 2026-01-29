import express from 'express'
import cors from 'cors'
import { config } from './config/index.js'
import routes from './routes/index.js'
import { errorHandler } from './middlewares/index.js'

const app = express()

// CORS 配置
app.use(cors({
    origin: config.cors.origins,
    credentials: true,
}))

// 解析 JSON
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`
  ╔═══════════════════════════════════════════════╗
  ║                                               ║
  ║   🚀 TongHai CRM API Server                   ║
  ║                                               ║
  ║   Environment: ${config.nodeEnv.padEnd(30)}║
  ║   Port: ${String(PORT).padEnd(38)}║
  ║   API: http://localhost:${PORT}/api/v1${' '.repeat(14)}║
  ║                                               ║
  ╚═══════════════════════════════════════════════╝
  `)
})

export default app
