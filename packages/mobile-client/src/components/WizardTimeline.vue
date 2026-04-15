<template>
  <view class="wizard-timeline">
    <!-- 顶部进度条与节点 (Timeline Header) -->
    <view class="wizard-header">
      <view 
        class="wizard-step" 
        v-for="(step, index) in steps" 
        :key="index"
        :class="{
          'is-active': currentStep === index,
          'is-completed': currentStep > index
        }"
      >
        <view class="step-line" v-if="index > 0"></view>
        <view class="step-node">
          <text v-if="currentStep > index" class="node-icon">✓</text>
          <text v-else class="node-number">{{ index + 1 }}</text>
        </view>
        <text class="step-title">{{ step }}</text>
      </view>
    </view>

    <!-- 动态内容区 (Dynamic Content Area) -->
    <view class="wizard-content">
      <slot :name="`step-${currentStep}`"></slot>
    </view>

    <!-- 底部插槽 (如按钮区) -->
    <view class="wizard-footer">
      <slot name="footer"></slot>
    </view>
  </view>
</template>

<script setup lang="ts">


const props = defineProps({
  steps: {
    type: Array as () => string[],
    required: true
  },
  currentStep: {
    type: Number,
    default: 0
  }
})
</script>

<style lang="scss" scoped>
.wizard-timeline {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.wizard-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 48rpx;
  position: relative;
  width: 100%;
}

.wizard-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
  z-index: 1;

  &.is-active {
    .step-node {
      background: var(--th-bg-base, #ffffff);
      border-color: #3b82f6;
      color: #3b82f6;
      transform: scale(1.15);
      box-shadow: 0 0 16rpx rgba(59, 130, 246, 0.3);
    }
    .step-title {
      color: var(--th-text-main, #1f2937);
      font-weight: 600;
      opacity: 1;
      transform: translateY(4rpx);
    }
  }

  &.is-completed {
    .step-node {
      background: #3b82f6;
      border-color: #3b82f6;
      color: #ffffff;
    }
    .step-line {
      background: #3b82f6;
    }
    .step-title {
      color: var(--th-text-main, #1f2937);
      opacity: 0.9;
    }
  }
}

.step-node {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  border: 4rpx solid var(--th-border-color, #e5e7eb);
  background: var(--th-bg-surface, #f9fafb);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: var(--th-text-secondary, #6b7280);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 2;
}

.step-line {
  position: absolute;
  top: 28rpx;
  right: 50%;
  width: 100%;
  height: 4rpx;
  background: var(--th-border-color, #e5e7eb);
  z-index: 0;
  transition: all 0.3s ease;
}

.step-title {
  margin-top: 16rpx;
  font-size: 24rpx;
  color: var(--th-text-secondary, #6b7280);
  text-align: center;
  opacity: 0.6;
  transition: all 0.3s ease;
}

.wizard-content {
  flex: 1;
  min-height: 200rpx;
  margin-bottom: 32rpx;
  animation: fadeIn 0.4s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10rpx); }
  to { opacity: 1; transform: translateY(0); }
}

.wizard-footer {
  margin-top: 24rpx;
}
</style>
