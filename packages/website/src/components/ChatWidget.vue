<template>
  <div class="chat-widget" :class="{ 'is-open': isOpen }">
    <!-- 聊天按钮 -->
    <button 
      class="chat-toggle-btn" 
      @click="toggleChat"
      :aria-label="isOpen ? t('chat.close') : t('chat.open')"
    >
      <el-icon v-if="!isOpen" class="chat-icon"><ChatDotRound /></el-icon>
      <el-icon v-else class="close-icon"><Close /></el-icon>
      <span v-if="!isOpen && unreadCount > 0" class="unread-badge">{{ unreadCount }}</span>
    </button>

    <!-- 聊天窗口 -->
    <Transition name="chat-popup">
      <div v-if="isOpen" class="chat-window">
        <!-- 头部 -->
        <div class="chat-header">
          <div class="header-info">
            <div class="avatar">
              <span class="avatar-text">TH</span>
            </div>
            <div class="header-text">
              <h4>{{ t('chat.title') }}</h4>
              <span class="status">{{ t('chat.online') }}</span>
            </div>
          </div>
          <button class="close-btn" @click="toggleChat">
            <el-icon><Close /></el-icon>
          </button>
        </div>

        <!-- 消息列表 -->
        <div class="chat-messages" ref="messagesContainer">
          <!-- 欢迎消息 -->
          <div v-if="messages.length === 0" class="welcome-message">
            <p>{{ t('chat.welcome') }}</p>
            <div class="quick-actions">
              <button 
                v-for="action in quickActions" 
                :key="action.key"
                class="quick-action-btn"
                @click="sendQuickAction(action.message)"
              >
                {{ t(`chat.quickActions.${action.key}`) }}
              </button>
            </div>
          </div>

          <!-- 消息气泡 -->
          <div 
            v-for="msg in messages" 
            :key="msg.id"
            class="message"
            :class="msg.role"
          >
            <div class="message-content">
              <p v-html="formatMessage(msg.content)"></p>
              <span class="message-time">{{ formatTime(msg.createdAt) }}</span>
            </div>
            
            <!-- 反馈按钮（仅对机器人消息） -->
            <div v-if="msg.role === 'assistant' && !msg.feedbackGiven" class="feedback-btns">
              <button @click="giveFeedback(msg.id, true)" :title="t('chat.helpful')">
                <el-icon><CircleCheck /></el-icon>
              </button>
              <button @click="giveFeedback(msg.id, false)" :title="t('chat.notHelpful')">
                <el-icon><CircleClose /></el-icon>
              </button>
            </div>
          </div>

          <!-- 加载指示器 -->
          <div v-if="isLoading" class="message assistant loading">
            <div class="message-content">
              <div class="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>

          <!-- 推荐问题 -->
          <div v-if="suggestedFaqs.length > 0" class="suggested-faqs">
            <p class="suggested-title">{{ t('chat.relatedQuestions') }}</p>
            <button 
              v-for="faq in suggestedFaqs" 
              :key="faq.id" 
              class="suggested-btn"
              @click="sendMessage(faq.question)"
            >
              {{ faq.question }}
            </button>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="chat-input">
          <input 
            v-model="inputMessage"
            type="text"
            :placeholder="t('chat.inputPlaceholder')"
            @keyup.enter="handleSend"
            :disabled="isLoading"
            maxlength="500"
          />
          <button 
            class="send-btn" 
            @click="handleSend"
            :disabled="!inputMessage.trim() || isLoading"
          >
            <el-icon><Position /></el-icon>
          </button>
        </div>

        <!-- 底部提示 -->
        <div class="chat-footer">
          <a href="/contact" target="_blank">{{ t('chat.contactHuman') }}</a>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChatDotRound, Close, Position, CircleCheck, CircleClose } from '@element-plus/icons-vue'

import apiClient from '../api/apiClient'
import DOMPurify from 'dompurify'

const { t, locale } = useI18n()

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  createdAt: Date
  feedbackGiven?: boolean
}

interface SuggestedFaq {
  id: string
  question: string
}

// 状态
const isOpen = ref(false)
const isLoading = ref(false)
const inputMessage = ref('')
const messages = ref<Message[]>([])
const sessionId = ref<string | null>(null)
const unreadCount = ref(0)
const suggestedFaqs = ref<SuggestedFaq[]>([])
const messagesContainer = ref<HTMLElement | null>(null)

// 快捷操作
const quickActions = [
  { key: 'services', message: '你们提供哪些服务？' },
  { key: 'ep', message: '如何申请新加坡EP工作签证？' },
  { key: 'company', message: '在新加坡注册公司需要什么条件？' },
  { key: 'contact', message: '如何预约咨询？' }
]

// 访客ID（持久化）
function getVisitorId(): string {
  let visitorId = localStorage.getItem('chatVisitorId')
  if (!visitorId) {
    visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9)
    localStorage.setItem('chatVisitorId', visitorId)
  }
  return visitorId
}

// 切换聊天窗口
function toggleChat() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    unreadCount.value = 0
    nextTick(() => scrollToBottom())
  }
}

// 发送消息
async function sendMessage(content: string) {
  if (!content.trim() || isLoading.value) return

  // 添加用户消息
  const userMessage: Message = {
    id: 'temp_' + Date.now(),
    content: content.trim(),
    role: 'user',
    createdAt: new Date()
  }
  messages.value.push(userMessage)
  inputMessage.value = ''
  suggestedFaqs.value = []
  
  await nextTick()
  scrollToBottom()

  isLoading.value = true

  try {
    const response = await apiClient.post('/chat/message', {
      sessionId: sessionId.value,
      message: content.trim(),
      visitorId: getVisitorId(),
      locale: locale.value === 'en' ? 'en' : 'zh'
    })

    if (response.success) {
      const data = response.data
      sessionId.value = data.sessionId

      // 添加机器人回复
      const assistantMessage: Message = {
        id: 'msg_' + Date.now(),
        content: data.message,
        role: 'assistant',
        createdAt: new Date()
      }
      messages.value.push(assistantMessage)

      // 设置推荐问题
      if (data.suggestedFaqs && data.suggestedFaqs.length > 0) {
        suggestedFaqs.value = data.suggestedFaqs
      }

      // 如果窗口关闭，显示未读数
      if (!isOpen.value) {
        unreadCount.value++
      }
    }
  } catch (error) {
    console.error('Chat error:', error)
    messages.value.push({
      id: 'error_' + Date.now(),
      content: t('chat.errorMessage'),
      role: 'assistant',
      createdAt: new Date()
    })
  } finally {
    isLoading.value = false
    await nextTick()
    scrollToBottom()
  }
}

// 处理发送
function handleSend() {
  sendMessage(inputMessage.value)
}

// 发送快捷操作
function sendQuickAction(message: string) {
  sendMessage(message)
}

// 提供反馈
async function giveFeedback(messageId: string, isHelpful: boolean) {
  try {
    await apiClient.post(`/chat/messages/${messageId}/feedback`, {
      isHelpful
    })
    
    // 标记已反馈
    const msg = messages.value.find(m => m.id === messageId)
    if (msg) {
      msg.feedbackGiven = true
    }
  } catch (error) {
    console.error('Feedback error:', error)
  }
}

// 格式化消息（支持链接，通过 DOMPurify 消毒防止 XSS）
function formatMessage(content: string): string {
  // 转换 URL 为链接
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const html = content.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener">$1</a>')
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: ['a', 'br', 'strong', 'em'], ALLOWED_ATTR: ['href', 'target', 'rel'] })
}

// 格式化时间
function formatTime(date: Date): string {
  const d = new Date(date)
  return d.toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit' })
}

// 滚动到底部
function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 初始化
onMounted(() => {
  // 恢复会话ID
  const savedSessionId = localStorage.getItem('chatSessionId')
  if (savedSessionId) {
    sessionId.value = savedSessionId
  }
})
</script>

<style scoped>
.chat-widget {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  font-family: var(--font-family, 'Inter', sans-serif);
}

/* 聊天按钮 */
.chat-toggle-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, var(--color-accent, #0369a1) 0%, var(--color-primary, #0c4a6e) 100%);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(3, 105, 161, 0.4);
  transition: all 0.3s ease;
  position: relative;
}

.chat-toggle-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 25px rgba(3, 105, 161, 0.5);
}

.chat-toggle-btn .chat-icon,
.chat-toggle-btn .close-icon {
  font-size: 28px;
}

.unread-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #ef4444;
  color: white;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

/* 聊天窗口 */
.chat-window {
  position: absolute;
  bottom: 76px;
  right: 0;
  width: 380px;
  max-width: calc(100vw - 48px);
  height: 520px;
  max-height: calc(100vh - 120px);
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 头部 */
.chat-header {
  padding: 16px;
  background: linear-gradient(135deg, var(--color-accent, #0369a1) 0%, var(--color-primary, #0c4a6e) 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.avatar-text {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-accent, #0369a1);
}

.header-text h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.header-text .status {
  font-size: 12px;
  opacity: 0.9;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.close-btn:hover {
  opacity: 1;
}

/* 消息区域 */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f8fafc;
}

/* 欢迎消息 */
.welcome-message {
  text-align: center;
  color: #64748b;
  padding: 20px;
}

.welcome-message p {
  margin: 0 0 16px;
  font-size: 14px;
  line-height: 1.6;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quick-action-btn {
  padding: 10px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  background: white;
  color: var(--color-accent, #0369a1);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.quick-action-btn:hover {
  background: var(--color-accent, #0369a1);
  color: white;
  border-color: var(--color-accent, #0369a1);
}

/* 消息气泡 */
.message {
  display: flex;
  flex-direction: column;
  max-width: 85%;
}

.message.user {
  align-self: flex-end;
}

.message.assistant {
  align-self: flex-start;
}

.message-content {
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.5;
}

.message.user .message-content {
  background: linear-gradient(135deg, var(--color-accent, #0369a1) 0%, var(--color-primary, #0c4a6e) 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.message.assistant .message-content {
  background: white;
  color: #334155;
  border: 1px solid #e2e8f0;
  border-bottom-left-radius: 4px;
}

.message-content p {
  margin: 0;
  word-break: break-word;
}

.message-content a {
  color: inherit;
  text-decoration: underline;
}

.message-time {
  font-size: 11px;
  opacity: 0.6;
  margin-top: 4px;
  display: block;
}

/* 反馈按钮 */
.feedback-btns {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.feedback-btns button {
  background: none;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  padding: 2px;
  transition: color 0.2s;
}

.feedback-btns button:hover {
  color: var(--color-accent, #0369a1);
}

/* 加载指示器 */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94a3b8;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) { animation-delay: 0s; }
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-6px); }
}

/* 推荐问题 */
.suggested-faqs {
  padding: 8px 0;
}

.suggested-title {
  font-size: 12px;
  color: #94a3b8;
  margin: 0 0 8px;
}

.suggested-btn {
  display: block;
  width: 100%;
  padding: 8px 12px;
  margin-bottom: 6px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  color: #475569;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
}

.suggested-btn:hover {
  background: #f1f5f9;
  border-color: var(--color-accent, #0369a1);
}

/* 输入区域 */
.chat-input {
  padding: 12px 16px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  gap: 8px;
  background: white;
}

.chat-input input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.chat-input input:focus {
  border-color: var(--color-accent, #0369a1);
}

.send-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: var(--color-accent, #0369a1);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.send-btn:hover:not(:disabled) {
  background: var(--color-primary, #0c4a6e);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 底部 */
.chat-footer {
  padding: 8px 16px;
  text-align: center;
  font-size: 12px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.chat-footer a {
  color: var(--color-accent, #0369a1);
  text-decoration: none;
}

.chat-footer a:hover {
  text-decoration: underline;
}

/* 动画 */
.chat-popup-enter-active,
.chat-popup-leave-active {
  transition: all 0.3s ease;
}

.chat-popup-enter-from,
.chat-popup-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

/* 响应式 */
@media (max-width: 480px) {
  .chat-widget {
    bottom: 16px;
    right: 16px;
  }

  .chat-window {
    width: calc(100vw - 32px);
    height: calc(100vh - 100px);
    right: -8px;
  }

  .chat-toggle-btn {
    width: 54px;
    height: 54px;
  }
}
</style>
