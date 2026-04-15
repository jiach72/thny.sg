<template>
  <nut-popup 
    v-model:visible="visible" 
    position="bottom" 
    round
    :style="{ height: '84%', background: 'var(--th-bg-base)', overflow: 'hidden' }"
  >
    <view class="ai-chat-sheet">
      <!-- 头部 -->
      <view class="chat-header">
        <view class="bot-info">
          <view class="bot-avatar">🤖</view>
          <view class="bot-text">
            <text class="bot-name">智能客服</text>
            <text class="bot-status">在线</text>
          </view>
        </view>
        <view class="close-btn" @click="appStore.toggleAIChat(false)">×</view>
      </view>

      <!-- 消息区 -->
      <scroll-view class="chat-content" scroll-y :scroll-into-view="bottomId">
        <view class="message-list">
          <view class="message-item ai">
            <view class="bubble">您好！我是通海南洋 AI 助理。智能客服功能正在接入中，敬请期待。您目前可以通过首页的服务咨询入口或联系专属顾问获得帮助。</view>
          </view>
          <view v-for="msg in chatMessages" :key="msg.id" class="message-item" :class="msg.role">
            <view class="bubble">{{ msg.content }}</view>
          </view>
          <view :id="'bottom'" class="chat-bottom-anchor"></view>
        </view>
      </scroll-view>

      <!-- 底部输入区 -->
      <view class="chat-footer">
        <input 
          class="chat-input" 
          placeholder="请输入您的问题..." 
          v-model="inputValue"
          @confirm="handleSend"
          :confirm-type="'send'"
        />
        <nut-button type="primary" size="small" class="send-btn" @click="handleSend">发送</nut-button>
      </view>
    </view>
  </nut-popup>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '../stores/app'

interface ChatMsg { id: number; role: 'user' | 'ai'; content: string }

const appStore = useAppStore()
const visible = computed({
  get: () => appStore.isAIChatVisible,
  set: (val) => appStore.toggleAIChat(val)
})

const inputValue = ref('')
const bottomId = ref('bottom')
const chatMessages = ref<ChatMsg[]>([])
let msgId = 0

const handleSend = () => {
  if (!inputValue.value.trim()) return
  chatMessages.value.push({ id: ++msgId, role: 'user', content: inputValue.value })
  inputValue.value = ''
  setTimeout(() => {
    chatMessages.value.push({ id: ++msgId, role: 'ai', content: '感谢您的留言。AI 客服功能即将上线，您的消息将在功能就绪后处理。您也可以通过顾问预约获得即时帮助。' })
  }, 600)
}
</script>

<style lang="scss">
.ai-chat-sheet {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid var(--th-border-color);
  
  .bot-info {
    display: flex;
    align-items: center;
    gap: 16rpx;
    
    .bot-avatar {
      font-size: 48rpx;
      width: 80rpx;
      height: 80rpx;
      background: linear-gradient(135deg, #e0e7ff, #bfdbfe);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4rpx 12rpx rgba(59, 130, 246, 0.1);
    }
    
    .bot-text {
      display: flex;
      flex-direction: column;
      gap: 4rpx;
    }
    
    .bot-name {
      font-size: 32rpx;
      font-weight: 600;
      color: var(--th-text-main);
    }
    
    .bot-status {
      font-size: 24rpx;
      color: #10b981; // 绿色在线状态
      display: flex;
      align-items: center;
      gap: 8rpx;

      &::before {
        content: '';
        width: 12rpx;
        height: 12rpx;
        background-color: #10b981;
        border-radius: 50%;
      }
    }
  }
  
  .close-btn {
    font-size: 56rpx;
    color: var(--th-text-secondary);
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 300;
  }
}

.chat-content {
  flex: 1;
  overflow-y: auto;
  padding: 32rpx;
  background-color: var(--th-bg-surface);
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
  padding-bottom: 24rpx;
}

.message-item {
  display: flex;
  width: 100%;
  
  &.ai {
    justify-content: flex-start;
    .bubble {
      background: rgba(59, 130, 246, 0.1); 
      color: var(--th-text-main);
      border-bottom-left-radius: 8rpx;
      border: 1px solid rgba(59, 130, 246, 0.15);
    }
  }
  
  &.user {
    justify-content: flex-end;
    .bubble {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
      border-bottom-right-radius: 8rpx;
      box-shadow: 0 8rpx 16rpx rgba(59, 130, 246, 0.2);
    }
  }
  
  .bubble {
    max-width: 80%;
    padding: 24rpx 32rpx;
    border-radius: 36rpx;
    font-size: 30rpx;
    line-height: 1.6;
    letter-spacing: 0.5rpx;
  }
}

/* 呼吸打字特效 */
.typing {
  display: flex;
  gap: 12rpx;
  align-items: center;
  height: 48rpx;
  padding: 0 16rpx !important;
  
  .dot {
    width: 16rpx;
    height: 16rpx;
    background-color: #3b82f6;
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out both;
  }
  
  .dot:nth-child(1) { animation-delay: -0.32s; }
  .dot:nth-child(2) { animation-delay: -0.16s; }
}

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
  40% { transform: scale(1); opacity: 1; }
}

.chat-footer {
  padding: 24rpx 32rpx;
  background-color: var(--th-bg-base);
  border-top: 1rpx solid var(--th-border-color);
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  
  .chat-input {
    flex: 1;
    height: 88rpx;
    background: var(--th-bg-surface);
    border: 1px solid var(--th-border-color);
    border-radius: 44rpx;
    padding: 0 40rpx;
    font-size: 30rpx;
    color: var(--th-text-main);
  }
  
  .send-btn {
    border-radius: 44rpx;
    height: 88rpx;
    padding: 0 48rpx;
    font-weight: 600;
  }
}
</style>
