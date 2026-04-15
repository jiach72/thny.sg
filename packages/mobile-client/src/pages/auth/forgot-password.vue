<template>
  <base-layout>
    <view class="forgot-page">
      <view class="brand-zone">
        <view class="brand-icon"><text class="icon-text">TH</text></view>
        <text class="brand-title">找回密码</text>
        <text class="brand-subtitle">输入您的注册邮箱，我们将发送重置链接</text>
      </view>

      <view class="form-card">
        <view v-if="!sent" class="form-body">
          <view class="field-group">
            <view class="field-label">注册邮箱</view>
            <input v-model="email" placeholder="请输入您的邮箱" type="text" class="field-input" />
          </view>

          <view class="form-footer">
            <nut-button type="primary" size="large" block :loading="loading" @click="handleSubmit">
              发送重置链接
            </nut-button>
            <view class="back-link" @click="goBack">
              <text>← 返回登录</text>
            </view>
          </view>
        </view>

        <view v-else class="success-body">
          <text class="success-icon">✉️</text>
          <text class="success-title">邮件已发送</text>
          <text class="success-desc">请检查 {{ email }} 的收件箱，点击邮件中的链接重置密码。如未收到，请检查垃圾邮件文件夹。</text>
          <nut-button type="primary" size="large" block @click="goBack" style="margin-top: 48rpx;">返回登录</nut-button>
        </view>
      </view>

      <view class="footer">
        <text class="copyright">© 2026 TongHai Nanyang Pte. Ltd.</text>
      </view>
    </view>
  </base-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { authApi } from '../../api/portalApi'

const email = ref('')
const loading = ref(false)
const sent = ref(false)

async function handleSubmit() {
  if (!email.value.trim()) {
    uni.showToast({ title: '请输入邮箱', icon: 'none' })
    return
  }
  loading.value = true
  try {
    await authApi.forgotPassword(email.value.trim())
    sent.value = true
  } catch {
    uni.showToast({ title: '发送失败，请稍后重试', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function goBack() {
  uni.navigateBack()
}
</script>

<style lang="scss">
.forgot-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  display: flex; flex-direction: column; align-items: center; padding: 0 48rpx;
}
.brand-zone {
  margin-top: 160rpx; display: flex; flex-direction: column; align-items: center; margin-bottom: 64rpx;
  .brand-icon {
    width: 100rpx; height: 100rpx; border-radius: 24rpx;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    display: flex; align-items: center; justify-content: center; margin-bottom: 32rpx;
    box-shadow: 0 8rpx 32rpx rgba(59, 130, 246, 0.4);
  }
  .icon-text { font-size: 36rpx; font-weight: 800; color: white; }
  .brand-title { font-size: 40rpx; font-weight: 700; color: #f1f5f9; margin-bottom: 12rpx; }
  .brand-subtitle { font-size: 26rpx; color: #94a3b8; text-align: center; line-height: 1.6; }
}
.form-card {
  width: 100%; background: rgba(255, 255, 255, 0.06); backdrop-filter: blur(24px);
  border: 1rpx solid rgba(255, 255, 255, 0.1); border-radius: 32rpx; padding: 48rpx 40rpx;
}
.field-group { margin-bottom: 32rpx; }
.field-label { font-size: 26rpx; color: #94a3b8; margin-bottom: 12rpx; padding-left: 4rpx; }
.field-input {
  width: 100%; height: 88rpx; background: rgba(255,255,255,0.08);
  border: 1rpx solid rgba(255,255,255,0.12); border-radius: 16rpx;
  padding: 0 24rpx; font-size: 30rpx; color: #f1f5f9; box-sizing: border-box;
}
.form-footer { margin-top: 48rpx; }
.back-link { text-align: center; margin-top: 32rpx; color: #94a3b8; font-size: 26rpx; }
.success-body {
  display: flex; flex-direction: column; align-items: center; text-align: center; gap: 16rpx;
  .success-icon { font-size: 80rpx; margin-bottom: 16rpx; }
  .success-title { font-size: 36rpx; font-weight: 700; color: #f1f5f9; }
  .success-desc { font-size: 26rpx; color: #94a3b8; line-height: 1.6; }
}
.footer { margin-top: auto; padding-bottom: 64rpx; padding-top: 48rpx; }
.copyright { font-size: 22rpx; color: #475569; }
</style>
