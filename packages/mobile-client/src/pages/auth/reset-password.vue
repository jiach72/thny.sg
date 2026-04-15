<template>
  <base-layout>
    <view class="reset-page">
      <view class="brand-zone">
        <view class="brand-icon"><text class="icon-text">TH</text></view>
        <text class="brand-title">重置密码</text>
        <text class="brand-subtitle">请设置您的新密码</text>
      </view>

      <view class="form-card">
        <view v-if="!done" class="form-body">
          <view class="field-group">
            <view class="field-label">新密码</view>
            <input v-model="form.password" :password="true" placeholder="至少8个字符" class="field-input" />
          </view>
          <view class="field-group">
            <view class="field-label">确认新密码</view>
            <input v-model="form.confirmPassword" :password="true" placeholder="再次输入新密码" class="field-input" />
          </view>

          <view class="form-footer">
            <nut-button type="primary" size="large" block :loading="loading" @click="handleReset">
              确认重置
            </nut-button>
          </view>
        </view>

        <view v-else class="success-body">
          <text class="success-icon">✅</text>
          <text class="success-title">密码已重置</text>
          <text class="success-desc">您的密码已成功更新，请使用新密码登录。</text>
          <nut-button type="primary" size="large" block @click="goLogin" style="margin-top: 48rpx;">前往登录</nut-button>
        </view>
      </view>

      <view class="footer">
        <text class="copyright">© 2026 TongHai Nanyang Pte. Ltd.</text>
      </view>
    </view>
  </base-layout>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { authApi } from '../../api/portalApi'

const loading = ref(false)
const done = ref(false)
const token = ref('')
const form = reactive({ password: '', confirmPassword: '' })

onLoad((options: any) => {
  token.value = options?.token || ''
  if (!token.value) {
    uni.showToast({ title: '无效的重置链接', icon: 'none' })
  }
})

async function handleReset() {
  if (form.password.length < 8) {
    uni.showToast({ title: '密码至少需要8个字符', icon: 'none' })
    return
  }
  if (form.password !== form.confirmPassword) {
    uni.showToast({ title: '两次输入的密码不一致', icon: 'none' })
    return
  }
  loading.value = true
  try {
    await authApi.resetPassword({ token: token.value, password: form.password })
    done.value = true
  } catch {
    uni.showToast({ title: '重置失败，链接可能已过期', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function goLogin() {
  uni.reLaunch({ url: '/pages/login/login' })
}
</script>

<style lang="scss">
.reset-page {
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
  .brand-subtitle { font-size: 26rpx; color: #94a3b8; }
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
.success-body {
  display: flex; flex-direction: column; align-items: center; text-align: center; gap: 16rpx;
  .success-icon { font-size: 80rpx; margin-bottom: 16rpx; }
  .success-title { font-size: 36rpx; font-weight: 700; color: #f1f5f9; }
  .success-desc { font-size: 26rpx; color: #94a3b8; line-height: 1.6; }
}
.footer { margin-top: auto; padding-bottom: 64rpx; padding-top: 48rpx; }
.copyright { font-size: 22rpx; color: #475569; }
</style>
