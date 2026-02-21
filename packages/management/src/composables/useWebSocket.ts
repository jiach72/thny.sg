import { ref, onMounted, onUnmounted } from 'vue'
import { io, Socket } from 'socket.io-client'
import { ElNotification } from 'element-plus'
import { useAuthStore } from '@/stores/authStore'
import type { NotificationType, RealtimeNotification } from '@tonghai/shared/types'

/**
 * WebSocket 连接 composable
 * 自动在组件挂载时连接，卸载时断开
 */
export function useWebSocket() {
    const authStore = useAuthStore()
    const socket = ref<Socket | null>(null)
    const isConnected = ref(false)

    function connect() {
        if (!authStore.accessToken) return

        socket.value = io(import.meta.env.VITE_WS_URL || window.location.origin, {
            auth: { token: authStore.accessToken },
            transports: ['websocket'],
        })

        socket.value.on('connect', () => {
            isConnected.value = true
        })

        socket.value.on('disconnect', () => {
            isConnected.value = false
        })

        // 监听通用通知事件
        socket.value.on('notification', handleNotification)
        socket.value.on('lead:assigned', handleLeadAssigned)
        socket.value.on('task:updated', handleTaskUpdated)
        socket.value.on('message:new', handleNewMessage)
    }

    function disconnect() {
        socket.value?.disconnect()
        socket.value = null
        isConnected.value = false
    }

    function handleNotification(notification: RealtimeNotification) {
        ElNotification({
            title: notification.title,
            message: notification.message,
            type: getElType(notification.type),
            duration: 5000,
        })
    }

    function handleLeadAssigned(_data: unknown) {
        // 线索分配通知 — 后续可集成到 store 刷新列表
    }

    function handleTaskUpdated(_data: unknown) {
        // 任务更新通知
    }

    function handleNewMessage(_data: unknown) {
        // 新消息通知
    }

    function getElType(type: NotificationType): 'success' | 'warning' | 'info' | 'error' {
        const map: Record<string, 'success' | 'warning' | 'info' | 'error'> = {
            LEAD_ASSIGNED: 'success',
            TASK_STATUS_CHANGED: 'info',
            NEW_MESSAGE: 'info',
            SYSTEM_ANNOUNCEMENT: 'warning',
            TASK_DUE_REMINDER: 'warning',
            PROJECT_UPDATE: 'info',
        }
        return map[type] || 'info'
    }

    /**
     * 加入指定房间
     */
    function joinRoom(room: string) {
        socket.value?.emit('join-room', room)
    }

    /**
     * 离开指定房间
     */
    function leaveRoom(room: string) {
        socket.value?.emit('leave-room', room)
    }

    onMounted(() => {
        connect()
    })

    onUnmounted(() => {
        disconnect()
    })

    return {
        socket,
        isConnected,
        connect,
        disconnect,
        joinRoom,
        leaveRoom,
    }
}
