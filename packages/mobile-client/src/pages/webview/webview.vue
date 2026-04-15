<template>
  <view class="webview-container">
    <web-view v-if="targetUrl" :src="targetUrl" @message="onMessage"></web-view>
    <view v-else class="loading-state">
      <view class="spinner"></view>
      <text class="loading-text">正在建立安全连接...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useAuthStore } from '../../stores/auth'

const targetUrl = ref('')
const authStore = useAuthStore()

onLoad(async (options: any) => {
  const { url } = options
  if (!url) {
    uni.showToast({ title: '参数错误', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 1500)
    return
  }

  const decodedUrl = decodeURIComponent(url)
  
  // 向后端换取单次 SSO 免登安全票据
  const ticket = await authStore.getSSOTicket()
  if (!ticket) {
    uni.showToast({ title: '网关鉴权失败', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 1500)
    return
  }

  // 携带票据跳转
  const sep = decodedUrl.includes('?') ? '&' : '?'
  targetUrl.value = `${decodedUrl}${sep}ticket=${ticket}`
})

const onMessage = (_e: any) => {
  // PostMessage 回调 - 预留扩展点
}
</script>

<style lang="scss">
.webview-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  background-color: var(--th-bg-base);
  
  .loading-state {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 16px;
    background-color: var(--th-bg-base);
    
    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid var(--th-border-color);
      border-top-color: #3b82f6; // 品牌蓝
      border-radius: 50%;
      animation: spin 1s infinite linear;
    }

    .loading-text {
      color: var(--th-text-secondary);
      font-size: 14px;
      letter-spacing: 1px;
    }
  }
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}
</style>
