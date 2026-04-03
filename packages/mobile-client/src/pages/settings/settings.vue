<template>
  <base-layout>
    <view class="settings-page">
      <view class="page-header">
        <text class="page-title">设置</text>
        <text class="page-desc">管理账户设置和偏好</text>
      </view>

      <!-- 外观设置 -->
      <view class="settings-card">
        <view class="card-header">
          <text class="card-icon">🎨</text>
          <view>
            <text class="card-title">外观设置</text>
            <text class="card-sub">自定义界面显示偏好</text>
          </view>
        </view>
        <view class="setting-row">
          <view class="setting-info">
            <text class="setting-label">深色模式</text>
            <text class="setting-desc">默认启用深色主题</text>
          </view>
          <nut-switch v-model="settings.darkMode" disabled />
        </view>
        <view class="setting-row">
          <view class="setting-info">
            <text class="setting-label">动画效果</text>
            <text class="setting-desc">页面过渡和交互动画</text>
          </view>
          <nut-switch v-model="settings.animations" @change="saveSettings" />
        </view>
      </view>

      <!-- 语言设置 -->
      <view class="settings-card">
        <view class="card-header">
          <text class="card-icon">🌐</text>
          <view>
            <text class="card-title">语言与区域</text>
            <text class="card-sub">设置显示语言和时区</text>
          </view>
        </view>
        <view class="setting-row" @click="showLangPicker = true">
          <view class="setting-info">
            <text class="setting-label">界面语言</text>
            <text class="setting-desc">{{ settings.language === 'en' ? 'English' : '简体中文' }}</text>
          </view>
          <text class="setting-arrow">›</text>
        </view>
        <view class="setting-row" @click="showTzPicker = true">
          <view class="setting-info">
            <text class="setting-label">时区</text>
            <text class="setting-desc">{{ settings.timezone }}</text>
          </view>
          <text class="setting-arrow">›</text>
        </view>
      </view>

      <!-- 隐私与安全 -->
      <view class="settings-card">
        <view class="card-header">
          <text class="card-icon">🛡️</text>
          <view>
            <text class="card-title">隐私与安全</text>
            <text class="card-sub">管理数据隐私选项</text>
          </view>
        </view>
        <view class="setting-row">
          <view class="setting-info">
            <text class="setting-label">活动日志</text>
            <text class="setting-desc">记录登录和操作历史</text>
          </view>
          <nut-switch v-model="settings.activityLog" @change="saveSettings" />
        </view>
        <view class="setting-row">
          <view class="setting-info">
            <text class="setting-label">登录通知</text>
            <text class="setting-desc">新设备登录时邮件通知</text>
          </view>
          <nut-switch v-model="settings.loginNotification" @change="saveSettings" />
        </view>
        <view class="setting-row">
          <view class="setting-info">
            <text class="setting-label">双因素认证</text>
            <text class="setting-desc">为账户添加额外安全层</text>
          </view>
          <nut-button size="mini" :type="settings.twoFactorEnabled ? 'success' : 'primary'" plain @click="handle2FA">
            {{ settings.twoFactorEnabled ? '已启用' : '设置' }}
          </nut-button>
        </view>
      </view>

      <!-- 数据导出 -->
      <view class="settings-card">
        <view class="card-header">
          <text class="card-icon">📥</text>
          <view>
            <text class="card-title">数据与导出</text>
            <text class="card-sub">下载或管理您的数据</text>
          </view>
        </view>
        <view class="export-actions">
          <nut-button plain block @click="handleExport">导出我的数据</nut-button>
        </view>
      </view>

      <!-- 2FA 弹窗 -->
      <nut-popup v-model:visible="show2faDialog" position="bottom" round :style="{ height: '55%' }">
        <view class="twofa-modal">
          <text class="modal-title">{{ settings.twoFactorEnabled ? '关闭安全认证' : '设置双重认证' }}</text>
          <view v-if="!settings.twoFactorEnabled && qrCodeUrl" class="qr-area">
            <text class="qr-desc">使用身份验证应用扫描二维码：</text>
            <image :src="qrCodeUrl" class="qr-image" mode="aspectFit" />
            <text class="secret-text">密钥: {{ secretCode }}</text>
          </view>
          <view class="code-input-area">
            <text class="code-label">输入6位验证码：</text>
            <input v-model="verificationCode" type="number" maxlength="6" placeholder="123456" class="code-input" />
          </view>
          <nut-button type="primary" block :disabled="loading2fa || verificationCode.length !== 6" @click="confirm2FA">
            {{ loading2fa ? '处理中...' : (settings.twoFactorEnabled ? '确认关闭' : '验证并开启') }}
          </nut-button>
        </view>
      </nut-popup>

      <!-- 语言选择器 -->
      <nut-popup v-model:visible="showLangPicker" position="bottom" round>
        <view class="picker-modal">
          <text class="picker-title">选择语言</text>
          <view class="picker-option" :class="{ active: settings.language === 'zh-CN' }" @click="setLang('zh-CN')"><text>简体中文</text></view>
          <view class="picker-option" :class="{ active: settings.language === 'en' }" @click="setLang('en')"><text>English</text></view>
        </view>
      </nut-popup>

      <!-- 时区选择器 -->
      <nut-popup v-model:visible="showTzPicker" position="bottom" round>
        <view class="picker-modal">
          <text class="picker-title">选择时区</text>
          <view v-for="tz in timezones" :key="tz.value" class="picker-option" :class="{ active: settings.timezone === tz.value }" @click="setTimezone(tz.value)">
            <text>{{ tz.label }}</text>
          </view>
        </view>
      </nut-popup>
    </view>
  </base-layout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { authApi, portalApi } from '../../api/portalApi'

const show2faDialog = ref(false)
const showLangPicker = ref(false)
const showTzPicker = ref(false)
const loading2fa = ref(false)
const qrCodeUrl = ref('')
const secretCode = ref('')
const verificationCode = ref('')

const timezones = [
  { label: '(UTC+8) 新加坡', value: 'Asia/Singapore' },
  { label: '(UTC+8) 北京', value: 'Asia/Shanghai' },
  { label: '(UTC+8) 吉隆坡', value: 'Asia/Kuala_Lumpur' },
  { label: '(UTC+0) 伦敦', value: 'Europe/London' },
]

const settings = reactive({
  darkMode: true,
  animations: true,
  language: 'zh-CN',
  timezone: 'Asia/Singapore',
  activityLog: true,
  loginNotification: true,
  twoFactorEnabled: false,
})

onMounted(async () => {
  const saved = uni.getStorageSync('app_settings')
  if (saved) {
    try { Object.assign(settings, typeof saved === 'string' ? JSON.parse(saved) : saved) } catch {}
  }
  try {
    const user = await authApi.getCurrentUser()
    if (user) settings.twoFactorEnabled = !!(user as any).twoFactorEnabled
  } catch {}
})

function saveSettings() {
  uni.setStorageSync('app_settings', JSON.stringify(settings))
  uni.showToast({ title: '已保存', icon: 'success', duration: 1000 })
}

function setLang(lang: string) { settings.language = lang; showLangPicker.value = false; saveSettings() }
function setTimezone(tz: string) { settings.timezone = tz; showTzPicker.value = false; saveSettings() }

async function handle2FA() {
  verificationCode.value = ''
  if (settings.twoFactorEnabled) {
    show2faDialog.value = true
    return
  }
  try {
    show2faDialog.value = true
    const data = await authApi.generate2fa()
    qrCodeUrl.value = data.qrCode
    secretCode.value = data.secret
  } catch {
    uni.showToast({ title: '无法生成认证信息', icon: 'none' })
    show2faDialog.value = false
  }
}

async function confirm2FA() {
  if (verificationCode.value.length !== 6) return
  loading2fa.value = true
  try {
    if (settings.twoFactorEnabled) {
      await authApi.disable2fa({ code: verificationCode.value })
      settings.twoFactorEnabled = false
      uni.showToast({ title: '已关闭双重认证', icon: 'success' })
    } else {
      await authApi.enable2fa({ code: verificationCode.value })
      settings.twoFactorEnabled = true
      uni.showToast({ title: '已启用安全验证', icon: 'success' })
    }
    show2faDialog.value = false
  } catch {
    uni.showToast({ title: '验证码有误', icon: 'none' })
  } finally {
    loading2fa.value = false
  }
}

async function handleExport() {
  uni.showToast({ title: '正在提交导出申请...', icon: 'loading' })
  try {
    await portalApi.exportMyData()
    uni.showToast({ title: '导出申请已提交，稍后将发送至您的邮箱', icon: 'success', duration: 3000 })
  } catch (e) {
    uni.showToast({ title: '数据导出失败，请稍后重试', icon: 'none' })
  }
}
</script>

<style lang="scss">
.settings-page { min-height: 100vh; background: #f8fafc; padding: 0 32rpx 120rpx; }
.page-header {
  padding: 40rpx 0 24rpx;
  .page-title { font-size: 40rpx; font-weight: 700; color: #0f172a; display: block; }
  .page-desc { font-size: 24rpx; color: #64748b; display: block; margin-top: 8rpx; }
}
.settings-card {
  background: white; border-radius: 20rpx; padding: 32rpx; margin-bottom: 24rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
  .card-header { display: flex; gap: 20rpx; align-items: center; padding-bottom: 24rpx; border-bottom: 1px solid #f1f5f9; margin-bottom: 16rpx; }
  .card-icon { font-size: 40rpx; }
  .card-title { font-size: 32rpx; font-weight: 700; color: #1e293b; display: block; }
  .card-sub { font-size: 22rpx; color: #94a3b8; }
  .setting-row {
    display: flex; justify-content: space-between; align-items: center; padding: 20rpx 0; border-bottom: 1px solid #f8fafc;
    &:last-child { border-bottom: none; }
  }
  .setting-info { flex: 1; }
  .setting-label { font-size: 28rpx; color: #1e293b; display: block; }
  .setting-desc { font-size: 22rpx; color: #94a3b8; }
  .setting-arrow { font-size: 32rpx; color: #cbd5e1; }
  .export-actions { padding-top: 8rpx; }
}
.twofa-modal {
  padding: 40rpx; display: flex; flex-direction: column; gap: 28rpx;
  .modal-title { font-size: 36rpx; font-weight: 700; color: #0f172a; text-align: center; }
  .qr-area { text-align: center;
    .qr-desc { font-size: 24rpx; color: #64748b; display: block; margin-bottom: 16rpx; }
    .qr-image { width: 300rpx; height: 300rpx; margin: 0 auto; }
    .secret-text { font-size: 22rpx; color: #3b82f6; display: block; margin-top: 12rpx; word-break: break-all; }
  }
  .code-input-area {
    .code-label { font-size: 24rpx; color: #64748b; display: block; margin-bottom: 12rpx; }
    .code-input { width: 100%; border: 1px solid #e2e8f0; border-radius: 12rpx; padding: 20rpx; font-size: 36rpx; text-align: center; letter-spacing: 16rpx; }
  }
}
.picker-modal {
  padding: 32rpx;
  .picker-title { font-size: 32rpx; font-weight: 700; color: #0f172a; display: block; margin-bottom: 24rpx; text-align: center; }
  .picker-option {
    padding: 24rpx; border-radius: 12rpx; margin-bottom: 12rpx; font-size: 28rpx; color: #334155;
    &.active { background: #eff6ff; color: #3b82f6; font-weight: 600; }
  }
}
</style>
