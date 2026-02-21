import { Server as HttpServer } from 'http'
import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'
import logger from '../config/logger.js'

let io: Server | null = null

interface UserSocket {
    userId: string
    socketId: string
}

const connectedUsers = new Map<string, UserSocket[]>()

/**
 * 初始化 WebSocket 服务
 */
export function initWebSocket(httpServer: HttpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: config.cors.origins,
            credentials: true,
        },
    })

    // JWT 认证中间件
    io.use((socket, next) => {
        const token = socket.handshake.auth.token as string | undefined

        if (!token) {
            return next(new Error('未提供认证令牌'))
        }

        try {
            const decoded = jwt.verify(token, config.jwt.secret) as { sub: string }
            socket.data.userId = decoded.sub
            next()
        } catch {
            next(new Error('认证令牌无效'))
        }
    })

    io.on('connection', (socket: Socket) => {
        const userId = socket.data.userId as string

        logger.info('WebSocket 用户连接', { userId, socketId: socket.id, context: 'websocket' })

        // 加入用户私有房间
        socket.join(`user:${userId}`)

        // 记录连接
        addConnection(userId, socket.id)

        // 加入自定义房间
        socket.on('join-room', (room: string) => {
            socket.join(room)
            logger.debug('用户加入房间', { userId, room, context: 'websocket' })
        })

        socket.on('leave-room', (room: string) => {
            socket.leave(room)
        })

        socket.on('disconnect', () => {
            logger.info('WebSocket 用户断开', { userId, socketId: socket.id, context: 'websocket' })
            removeConnection(userId, socket.id)
        })
    })

    logger.info('WebSocket 服务已启动', { context: 'websocket' })
    return io
}

function addConnection(userId: string, socketId: string) {
    const connections = connectedUsers.get(userId) || []
    connections.push({ userId, socketId })
    connectedUsers.set(userId, connections)
}

function removeConnection(userId: string, socketId: string) {
    const connections = connectedUsers.get(userId) || []
    const filtered = connections.filter((c) => c.socketId !== socketId)
    if (filtered.length === 0) {
        connectedUsers.delete(userId)
    } else {
        connectedUsers.set(userId, filtered)
    }
}

/**
 * 获取 Socket.IO 实例
 */
export function getIO(): Server {
    if (!io) {
        throw new Error('WebSocket 服务未初始化')
    }
    return io
}

/**
 * 发送通知给特定用户
 */
export function notifyUser(userId: string, event: string, data: unknown) {
    if (!io) return
    io.to(`user:${userId}`).emit(event, data)
}

/**
 * 发送通知给多个用户
 */
export function notifyUsers(userIds: string[], event: string, data: unknown) {
    userIds.forEach((uid) => notifyUser(uid, event, data))
}

/**
 * 广播通知给所有连接的用户
 */
export function broadcast(event: string, data: unknown) {
    if (!io) return
    io.emit(event, data)
}

/**
 * 检查用户是否在线
 */
export function isUserOnline(userId: string): boolean {
    return connectedUsers.has(userId)
}

/**
 * 获取在线用户数
 */
export function getOnlineCount(): number {
    return connectedUsers.size
}
