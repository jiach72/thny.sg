<template>
  <view 
    class="ai-drift-ball"
    :class="{ 'is-dragging': isDragging }"
    :style="{ left: x + 'px', top: y + 'px' }"
    @touchstart="onTouchStart"
    @touchmove.stop.prevent="onTouchMove"
    @touchend="onTouchEnd"
    @click="onClick"
  >
    <view class="ball-content">
      <view class="halo"></view>
      <text class="icon">🤖</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAppStore } from '../stores/app'

const sysInfo = uni.getSystemInfoSync()
const windowWidth = sysInfo.windowWidth
const windowHeight = sysInfo.windowHeight
const ballSize = 60 // 与 CSS 宽度一致

// 初始在右下角
const x = ref(windowWidth - ballSize - 20)
const y = ref(windowHeight - ballSize - 120)
const isDragging = ref(false)
const appStore = useAppStore()

let startTouchX = 0
let startTouchY = 0
let startX = 0
let startY = 0
let moved = false

const onTouchStart = (e: any) => {
  isDragging.value = true
  moved = false
  const touch = e.touches[0]
  startTouchX = touch.clientX
  startTouchY = touch.clientY
  startX = x.value
  startY = y.value
}

const onTouchMove = (e: any) => {
  moved = true
  const touch = e.touches[0]
  const dx = touch.clientX - startTouchX
  const dy = touch.clientY - startTouchY

  let newX = startX + dx
  let newY = startY + dy

  // 约束不能脱离屏幕安全区
  if (newX < 0) newX = 0
  if (newX > windowWidth - ballSize) newX = windowWidth - ballSize
  if (newY < 0) newY = 0
  if (newY > windowHeight - ballSize) newY = windowHeight - ballSize

  x.value = newX
  y.value = newY
}

const onTouchEnd = () => {
  isDragging.value = false
  
  if (moved) {
    // 磁吸到最近的屏幕边缘 (留 20px 边距)
    const midX = windowWidth / 2
    if (x.value + ballSize / 2 < midX) {
      x.value = 20
    } else {
      x.value = windowWidth - ballSize - 20
    }
  }
}

const onClick = () => {
  // 如果是由于拖拽抬起触发的 click，不响应
  if (moved) return
  appStore.toggleAIChat(true)
}
</script>

<style lang="scss">
.ai-drift-ball {
  position: fixed;
  width: 60px;
  height: 60px;
  z-index: 9999;
  // 非拖动时使用弹簧阻尼完成边缘磁吸
  transition: left 0.4s cubic-bezier(0.25, 1, 0.5, 1);
  
  &.is-dragging {
    // 拖动时关闭过渡和特效，提升性能跟手度
    transition: none;
    .ball-content { animation: none; }
    .halo { display: none; }
  }

  .ball-content {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    // 与 Premium UI 一脉相承的科技蓝紫渐变
    background: linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%);
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    // 心跳/呼吸微小尺寸形变
    animation: breathing 3s ease-in-out infinite alternate;

    .halo {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      border-radius: 50%;
      box-shadow: 0 0 20px 4px rgba(59, 130, 246, 0.6);
      animation: pulse 2s infinite;
    }
    
    .icon {
      font-size: 28px;
      z-index: 2;
    }
  }
}

@keyframes breathing {
  0% { transform: scale(0.96); }
  100% { transform: scale(1.04); }
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(1.5); opacity: 0; }
}
</style>
