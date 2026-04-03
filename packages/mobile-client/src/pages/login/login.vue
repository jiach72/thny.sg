<template>
  <view class="login-page">
    <!-- 顶部品牌区 -->
    <view class="brand-zone">
      <view class="brand-icon">
        <text class="icon-text">TH</text>
      </view>
      <text class="brand-title">TongHai Nanyang</text>
      <text class="brand-subtitle">通海南洋 · 专业移民服务平台</text>
    </view>

    <!-- 登录表单卡片 -->
    <view class="login-card">
      <view v-if="!show2FA">
        <view class="field-group">
          <view class="field-label">邮箱</view>
          <input
            v-model="form.email"
            placeholder="请输入邮箱"
            type="text"
            class="field-input"
          />
        </view>
        <view class="field-group">
          <view class="field-label">密码</view>
          <input
            v-model="form.password"
            placeholder="请输入密码"
            :password="true"
            class="field-input"
          />
        </view>

        <view class="form-footer">
          <nut-button
            type="primary"
            size="large"
            block
            :loading="authStore.loading"
            @click="handleLogin"
          >
            登录
          </nut-button>
        </view>
      </view>

      <!-- 2FA 验证面板 -->
      <view v-else class="twofa-panel">
        <text class="twofa-hint">请输入您的双重认证验证码</text>
        <input
          v-model="tfaCode"
          placeholder="6 位验证码"
          type="number"
          :maxlength="6"
          class="field-input twofa-input"
        />
        <nut-button
          type="primary"
          size="large"
          block
          :loading="authStore.loading"
          @click="handle2FA"
        >
          验证
        </nut-button>
        <nut-button
          plain
          size="large"
          block
          class="mt-3"
          @click="show2FA = false; tfaTempToken = ''"
        >
          返回
        </nut-button>
      </view>
    </view>

    <!-- 底部版权 -->
    <view class="footer">
      <text class="copyright">© 2026 TongHai Nanyang Pte. Ltd.</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()

const form = reactive({
  email: '',
  password: '',
})

const show2FA = ref(false)
const tfaTempToken = ref('')
const tfaCode = ref('')

async function handleLogin() {
  if (!form.email || !form.password) {
    uni.showToast({ title: '请填写邮箱和密码', icon: 'none' })
    return
  }

  try {
    const result = await authStore.login({ email: form.email, password: form.password })

    if (result?.requires2FA) {
      show2FA.value = true
      tfaTempToken.value = result.tempToken || ''
      return
    }

    uni.showToast({ title: '登录成功', icon: 'success' })
    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 800)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '登录失败'
    uni.showToast({ title: msg, icon: 'none' })
  }
}

async function handle2FA() {
  if (tfaCode.value.length !== 6) {
    uni.showToast({ title: '请输入 6 位验证码', icon: 'none' })
    return
  }

  try {
    await authStore.verify2FA(tfaTempToken.value, tfaCode.value)
    uni.showToast({ title: '验证成功', icon: 'success' })
    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 800)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '验证失败'
    uni.showToast({ title: msg, icon: 'none' })
  }
}
</script>

<style lang="scss">
.login-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 48rpx;
}

.brand-zone {
  margin-top: 160rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 80rpx;

  .brand-icon {
    width: 120rpx;
    height: 120rpx;
    border-radius: 28rpx;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 32rpx;
    box-shadow: 0 8rpx 32rpx rgba(59, 130, 246, 0.4);
  }

  .icon-text {
    font-size: 44rpx;
    font-weight: 800;
    color: white;
    letter-spacing: 2rpx;
  }

  .brand-title {
    font-size: 44rpx;
    font-weight: 700;
    color: #f1f5f9;
    margin-bottom: 12rpx;
  }

  .brand-subtitle {
    font-size: 26rpx;
    color: #94a3b8;
  }
}

.login-card {
  width: 100%;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(24px);
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 32rpx;
  padding: 48rpx 40rpx;
}

.field-group {
  margin-bottom: 32rpx;
}

.field-label {
  font-size: 26rpx;
  color: #94a3b8;
  margin-bottom: 12rpx;
  padding-left: 4rpx;
}

.field-input {
  width: 100%;
  height: 88rpx;
  background: rgba(255, 255, 255, 0.08);
  border: 1rpx solid rgba(255, 255, 255, 0.12);
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
  color: #f1f5f9;
  box-sizing: border-box;
}

.form-footer {
  margin-top: 48rpx;
}

.twofa-panel {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.twofa-hint {
  font-size: 28rpx;
  color: #94a3b8;
  text-align: center;
}

.twofa-input {
  text-align: center;
  font-size: 40rpx;
  letter-spacing: 16rpx;
}

.mt-3 {
  margin-top: 16rpx;
}

.footer {
  margin-top: auto;
  padding-bottom: 64rpx;
  padding-top: 48rpx;
}

.copyright {
  font-size: 22rpx;
  color: #475569;
}
</style>
