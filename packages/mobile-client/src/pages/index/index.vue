<template>
  <view class="home-page">
    <!-- 顶部欢迎 -->
    <view class="welcome-section">
      <view class="avatar-ring">
        <text class="avatar-letter">{{ userInitial }}</text>
      </view>
      <text class="greeting">{{ greeting }}，{{ authStore.userName || '用户' }}</text>
      <text class="role-badge">{{ authStore.userRole }}</text>
    </view>

    <!-- 快捷操作卡片 -->
    <view class="quick-actions">
      <view class="action-card" @click="navigateTo('/pages/index/index')">
        <text class="action-icon">📋</text>
        <text class="action-label">我的案件</text>
      </view>
      <view class="action-card" @click="navigateTo('/pages/index/index')">
        <text class="action-icon">💬</text>
        <text class="action-label">AI 客服</text>
      </view>
      <view class="action-card" @click="navigateTo('/pages/index/index')">
        <text class="action-icon">📄</text>
        <text class="action-label">合同签署</text>
      </view>
      <view class="action-card" @click="navigateTo('/pages/index/index')">
        <text class="action-icon">💳</text>
        <text class="action-label">费用支付</text>
      </view>
    </view>

    <!-- 登出按钮 -->
    <view class="logout-section">
      <nut-button plain type="danger" size="large" block @click="handleLogout">
        退出登录
      </nut-button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()

onShow(() => {
  authStore.init()
  if (!authStore.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/login' })
  }
})

const userInitial = computed(() => {
  return (authStore.userName || 'U').charAt(0).toUpperCase()
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

function navigateTo(url: string) {
  uni.showToast({ title: '功能即将上线', icon: 'none' })
}

function handleLogout() {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出当前账号吗？',
    success: async (res) => {
      if (res.confirm) {
        await authStore.logout()
      }
    }
  })
}
</script>

<style lang="scss">
.home-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 0 32rpx;
}

.welcome-section {
  padding-top: 120rpx;
  padding-bottom: 64rpx;
  display: flex;
  flex-direction: column;
  align-items: center;

  .avatar-ring {
    width: 128rpx;
    height: 128rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24rpx;
    box-shadow: 0 8rpx 24rpx rgba(59, 130, 246, 0.3);
  }

  .avatar-letter {
    font-size: 48rpx;
    font-weight: 700;
    color: white;
  }

  .greeting {
    font-size: 40rpx;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 12rpx;
  }

  .role-badge {
    font-size: 24rpx;
    color: #64748b;
    background: #e2e8f0;
    padding: 6rpx 24rpx;
    border-radius: 20rpx;
  }
}

.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
  margin-bottom: 64rpx;

  .action-card {
    background: white;
    border-radius: 24rpx;
    padding: 40rpx 24rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
    transition: transform 0.2s;

    &:active {
      transform: scale(0.96);
    }
  }

  .action-icon {
    font-size: 48rpx;
  }

  .action-label {
    font-size: 28rpx;
    font-weight: 500;
    color: #334155;
  }
}

.logout-section {
  padding: 0 32rpx 80rpx;
}
</style>
