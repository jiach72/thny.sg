import { ref, onMounted, onUnmounted } from 'vue'

export interface ChatMessageData {
  id: string
  content: string
  senderId: string
  createdAt: string
}

interface TypingData {
  userId: string
  isTyping: boolean
}

interface StatusData {
  userId: string
  status: 'online' | 'offline'
}

interface WebSocketMessage {
  type: 'message' | 'typing' | 'status'
  data: ChatMessageData | TypingData | StatusData
}

export function useWebSocket(url?: string) {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const wsHost = import.meta.env.VITE_WS_URL || `${window.location.hostname}:5000`
  const defaultUrl = `${wsProtocol}://${wsHost}`
  const wsUrl = url || defaultUrl
  const isConnected = ref(false)
  const lastMessage = ref<WebSocketMessage | null>(null)
  const onlineStatus = ref<'online' | 'offline' | 'away'>('offline')

  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let reconnectAttempts = 0
  const maxReconnectAttempts = 5
  const reconnectDelay = 3000

  const connect = (): void => {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return

    try {
      ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        isConnected.value = true
        onlineStatus.value = 'online'
        reconnectAttempts = 0
      }

      ws.onclose = () => {
        isConnected.value = false
        onlineStatus.value = 'offline'
        attemptReconnect()
      }

      ws.onerror = () => {
        isConnected.value = false
        onlineStatus.value = 'offline'
      }

      ws.onmessage = (event: MessageEvent) => {
        try {
          const parsed: WebSocketMessage = JSON.parse(event.data)
          lastMessage.value = parsed
        } catch {
          lastMessage.value = { type: 'message', data: { id: '', content: event.data, senderId: '', createdAt: new Date().toISOString() } }
        }
      }
    } catch {
      isConnected.value = false
      onlineStatus.value = 'offline'
      attemptReconnect()
    }
  }

  const attemptReconnect = (): void => {
    if (reconnectAttempts >= maxReconnectAttempts) return
    if (reconnectTimer) clearTimeout(reconnectTimer)
    reconnectTimer = setTimeout(() => {
      reconnectAttempts++
      connect()
    }, reconnectDelay)
  }

  const send = (message: WebSocketMessage): boolean => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return false
    try {
      ws.send(JSON.stringify(message))
      return true
    } catch {
      return false
    }
  }

  const sendMessage = (content: string): boolean => {
    return send({ type: 'message', data: { id: '', content, senderId: '', createdAt: new Date().toISOString() } })
  }

  const sendTyping = (userId: string = ''): boolean => {
    return send({ type: 'typing', data: { userId, isTyping: true } })
  }

  const disconnect = (): void => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    reconnectAttempts = maxReconnectAttempts
    if (ws) {
      ws.close()
      ws = null
    }
    isConnected.value = false
    onlineStatus.value = 'offline'
  }

  onMounted(() => {
    connect()
  })

  onUnmounted(() => {
    disconnect()
  })

  return {
    isConnected,
    lastMessage,
    onlineStatus,
    send,
    sendMessage,
    sendTyping,
    connect,
    disconnect,
  }
}
