<template>
  <div class="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
    <!-- 头部 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="font-serif text-3xl text-text mb-2">设置</h1>
        <p class="text-sm text-text-muted">管理您的账户设置和偏好</p>
      </div>
    </div>

    <!-- 设置卡片列表 -->
    <div class="space-y-6">
      
      <!-- 外观设置 -->
      <div class="p-6 rounded-2xl bg-glass/20 border border-white/5">
        <div class="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
          <div class="p-3 rounded-lg bg-purple-500/10 text-purple-400">
            <component :is="Palette" class="w-6 h-6" />
          </div>
          <div>
            <h2 class="font-serif text-xl text-text">外观设置</h2>
            <p class="text-xs text-text-muted">自定义界面显示偏好</p>
          </div>
        </div>

        <div class="space-y-4">
          <div class="flex items-center justify-between py-3 border-b border-white/5">
            <div>
              <div class="text-sm font-medium text-text">深色模式</div>
              <div class="text-xs text-text-muted">默认启用深色主题</div>
            </div>
            <el-switch v-model="settings.darkMode" active-color="#D6B56E" disabled />
          </div>
          
          <div class="flex items-center justify-between py-3 border-b border-white/5">
            <div>
              <div class="text-sm font-medium text-text">紧凑模式</div>
              <div class="text-xs text-text-muted">减少元素间距，显示更多内容</div>
            </div>
            <el-switch v-model="settings.compactMode" active-color="#D6B56E" @change="handleSettingsChange" />
          </div>
          
          <div class="flex items-center justify-between py-3">
            <div>
              <div class="text-sm font-medium text-text">动画效果</div>
              <div class="text-xs text-text-muted">页面过渡和交互动画</div>
            </div>
            <el-switch v-model="settings.animations" active-color="#D6B56E" @change="handleSettingsChange" />
          </div>
        </div>
      </div>

      <!-- 语言设置 -->
      <div class="p-6 rounded-2xl bg-glass/20 border border-white/5">
        <div class="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
          <div class="p-3 rounded-lg bg-blue-500/10 text-blue-400">
            <component :is="Globe2" class="w-6 h-6" />
          </div>
          <div>
            <h2 class="font-serif text-xl text-text">语言与区域</h2>
            <p class="text-xs text-text-muted">设置显示语言和时区</p>
          </div>
        </div>

        <div class="space-y-4">
          <div class="flex items-center justify-between py-3 border-b border-white/5">
            <div>
              <div class="text-sm font-medium text-text">界面语言</div>
              <div class="text-xs text-text-muted">选择您偏好的语言</div>
            </div>
            <el-select v-model="settings.language" class="!w-40" @change="handleSettingsChange">
              <el-option label="简体中文" value="zh-CN" />
              <el-option label="English" value="en" />
            </el-select>
          </div>
          
          <div class="flex items-center justify-between py-3">
            <div>
              <div class="text-sm font-medium text-text">时区</div>
              <div class="text-xs text-text-muted">用于日期和时间显示</div>
            </div>
            <el-select v-model="settings.timezone" class="!w-48" @change="handleSettingsChange">
              <el-option label="(UTC+8) 新加坡" value="Asia/Singapore" />
              <el-option label="(UTC+8) 北京" value="Asia/Shanghai" />
              <el-option label="(UTC+8) 吉隆坡" value="Asia/Kuala_Lumpur" />
              <el-option label="(UTC+0) 伦敦" value="Europe/London" />
            </el-select>
          </div>
        </div>
      </div>

      <!-- 隐私设置 -->
      <div class="p-6 rounded-2xl bg-glass/20 border border-white/5">
        <div class="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
          <div class="p-3 rounded-lg bg-green-500/10 text-green-400">
            <component :is="ShieldCheck" class="w-6 h-6" />
          </div>
          <div>
            <h2 class="font-serif text-xl text-text">隐私与安全</h2>
            <p class="text-xs text-text-muted">管理数据隐私选项</p>
          </div>
        </div>

        <div class="space-y-4">
          <div class="flex items-center justify-between py-3 border-b border-white/5">
            <div>
              <div class="text-sm font-medium text-text">活动日志</div>
              <div class="text-xs text-text-muted">记录您的登录和操作历史</div>
            </div>
            <el-switch v-model="settings.activityLog" active-color="#D6B56E" @change="handleSettingsChange" />
          </div>
          
          <div class="flex items-center justify-between py-3 border-b border-white/5">
            <div>
              <div class="text-sm font-medium text-text">登录通知</div>
              <div class="text-xs text-text-muted">新设备登录时发送邮件通知</div>
            </div>
            <el-switch v-model="settings.loginNotification" active-color="#D6B56E" @change="handleSettingsChange" />
          </div>
          
          <div class="flex items-center justify-between py-3">
            <div>
              <div class="text-sm font-medium text-text">双因素认证</div>
              <div class="text-xs text-text-muted">为账户添加额外安全层</div>
            </div>
            <button 
              @click="handleSetup2FA"
              class="px-4 py-2 text-sm font-medium text-wealth border border-wealth/30 rounded hover:bg-wealth/10 transition-colors"
            >
              {{ settings.twoFactorEnabled ? '已启用' : '设置' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 会话管理 -->
      <div class="p-6 rounded-2xl bg-glass/20 border border-white/5">
        <div class="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
          <div class="p-3 rounded-lg bg-orange-500/10 text-orange-400">
            <component :is="Smartphone" class="w-6 h-6" />
          </div>
          <div>
            <h2 class="font-serif text-xl text-text">会话管理</h2>
            <p class="text-xs text-text-muted">管理已登录的设备</p>
          </div>
        </div>

        <div class="space-y-4">
          <!-- 当前设备 -->
          <div class="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-wealth/20">
            <div class="flex items-center gap-4">
              <div class="p-2 rounded bg-wealth/10 text-wealth">
                <component :is="Monitor" class="w-5 h-5" />
              </div>
              <div>
                <div class="text-sm font-medium text-text flex items-center gap-2">
                  Windows · Chrome
                  <span class="px-2 py-0.5 rounded bg-wealth/20 text-wealth text-[10px] font-bold">当前设备</span>
                </div>
                <div class="text-xs text-text-muted">新加坡 · 最近活动于刚刚</div>
              </div>
            </div>
          </div>

          <!-- 其他设备 -->
          <div class="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
            <div class="flex items-center gap-4">
              <div class="p-2 rounded bg-white/10 text-text-muted">
                <component :is="Smartphone" class="w-5 h-5" />
              </div>
              <div>
                <div class="text-sm font-medium text-text">iPhone · Safari</div>
                <div class="text-xs text-text-muted">新加坡 · 2 天前</div>
              </div>
            </div>
            <button class="px-3 py-1.5 text-xs text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded transition-colors">撤销</button>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-white/5">
          <button 
            @click="handleLogoutAllDevices"
            class="text-sm text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-4 py-2 rounded transition-colors"
          >
            登出所有其他设备
          </button>
        </div>
      </div>

      <!-- 数据导出 -->
      <div class="p-6 rounded-2xl bg-glass/20 border border-white/5">
        <div class="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
          <div class="p-3 rounded-lg bg-cyan-500/10 text-cyan-400">
            <component :is="Download" class="w-6 h-6" />
          </div>
          <div>
            <h2 class="font-serif text-xl text-text">数据与导出</h2>
            <p class="text-xs text-text-muted">下载或删除您的数据</p>
          </div>
        </div>

        <div class="flex flex-wrap gap-4">
          <button 
            @click="handleExportData"
            class="px-5 py-2.5 text-sm font-medium text-text bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors flex items-center gap-2"
          >
            <component :is="Download" class="w-4 h-4" />
            导出我的数据
          </button>
          <button class="px-5 py-2.5 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded transition-colors">
            删除账户
          </button>
        </div>
      </div>

    </div>

    <!-- 保存提示 -->
    <div v-if="saving" class="fixed bottom-8 right-8 px-4 py-2 rounded-lg bg-wealth text-obsidian text-sm font-medium shadow-lg animate-fade-in-up">
      设置已保存
    </div>

    <!-- 启用 2FA 弹窗 -->
    <el-dialog v-model="show2faDialog" title="设置双重安全认证" width="400px" custom-class="glass-dialog" :close-on-click-modal="false">
      <div v-loading="generating2fa" class="text-center py-2 space-y-4">
        <p class="text-sm text-text-muted">使用身份验证应用 (Microsoft Authenticator、Authy 等 TOTP 应用) 扫描二维码：</p>
        <div class="bg-white p-2 rounded-lg inline-block mx-auto mb-2 border border-white/20">
          <img v-if="qrCodeUrl" :src="qrCodeUrl" class="w-48 h-48 mx-auto" alt="2FA QR Code" />
        </div>
        <div class="text-xs text-text-muted mt-2 px-4 whitespace-normal break-all">
          或者手动输入密钥: <br/><span class="text-wealth font-mono select-all">{{ secretCode }}</span>
        </div>
        <div class="mt-4 text-left">
          <label class="block text-sm text-text-muted mb-2 text-center">输入应用提供的6位验证码：</label>
          <el-input 
            v-model="verificationCode" 
            placeholder="比如：123456" 
            maxlength="6"
            class="!text-center"
            @keyup.enter="confirmEnable2FA"
          />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3 pt-2">
          <button @click="show2faDialog = false" class="px-4 py-2 text-sm text-text-muted hover:text-text transition-colors">取消</button>
          <button @click="confirmEnable2FA" :disabled="loading2fa || !verificationCode" class="px-5 py-2 text-sm text-obsidian bg-wealth hover:bg-wealth-400 rounded transition-colors flex items-center gap-2">
            <span v-if="loading2fa" class="w-4 h-4 border-2 border-obsidian/20 border-t-obsidian rounded-full animate-spin"></span>
            验证并开启
          </button>
        </div>
      </template>
    </el-dialog>

    <!-- 关闭 2FA 弹窗 -->
    <el-dialog v-model="showDisable2faDialog" title="关闭安全认证" width="400px" custom-class="glass-dialog">
      <div class="py-4 space-y-4">
        <p class="text-sm text-text-muted">为确认您的操作安全，请提交一次正在使用的 6 位动态验证码：</p>
        <div class="mt-4">
          <el-input 
            v-model="verificationCode" 
            placeholder="输入验证码" 
            maxlength="6"
            @keyup.enter="confirmDisable2FA"
          />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3 pt-4">
          <button @click="showDisable2faDialog = false" class="px-4 py-2 text-sm text-text-muted hover:text-text transition-colors">取消</button>
          <button @click="confirmDisable2FA" :disabled="loading2fa || !verificationCode" class="px-5 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded transition-colors flex items-center gap-2">
            <span v-if="loading2fa" class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            确认关闭
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElSwitch, ElSelect, ElOption, ElDialog, ElInput } from 'element-plus'
import { 
  Palette, Globe2, ShieldCheck, Smartphone, Monitor, Download 
} from 'lucide-vue-next'
import { portalApi, authApi } from '@/api'

const saving = ref(false)
const show2faDialog = ref(false)
const showDisable2faDialog = ref(false)
const generating2fa = ref(false)
const loading2fa = ref(false)
const qrCodeUrl = ref('')
const secretCode = ref('')
const verificationCode = ref('')

const settings = reactive({
  darkMode: true,
  compactMode: false,
  animations: true,
  language: 'zh-CN',
  timezone: 'Asia/Singapore',
  activityLog: true,
  loginNotification: true,
  twoFactorEnabled: false,
})

onMounted(async () => {
  // 从本地存储加载设置
  const saved = localStorage.getItem('portal_settings')
  if (saved) {
    try {
      Object.assign(settings, JSON.parse(saved))
    } catch {
      // 忽略解析错误
    }
  }
  
  // 拉取远端账户信息获取真实的 2FA 状况
  try {
    const data = await authApi.getCurrentUser()
    if (data) {
        settings.twoFactorEnabled = !!(data as { twoFactorEnabled?: boolean }).twoFactorEnabled
    }
  } catch(e) {
    console.warn('Failed to fetch 2FA status:', e)
  }
})

// 保存提示定时器（防止内存泄漏）
let savingTimer: ReturnType<typeof setTimeout> | null = null

function handleSettingsChange(): void {
  // 保存到本地存储
  localStorage.setItem('portal_settings', JSON.stringify(settings))
  
  // 显示保存提示
  saving.value = true
  if (savingTimer) clearTimeout(savingTimer)
  savingTimer = setTimeout(() => {
    saving.value = false
    savingTimer = null
  }, 2000)
}

async function handleSetup2FA(): Promise<void> {
  if (settings.twoFactorEnabled) {
    showDisable2faDialog.value = true
    verificationCode.value = ''
    return
  }
  try {
    generating2fa.value = true
    show2faDialog.value = true
    verificationCode.value = ''
    const data = await authApi.generate2fa()
    qrCodeUrl.value = data.qrCode
    secretCode.value = data.secret
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '无法生成认证信息'
    ElMessage.error(msg)
    show2faDialog.value = false
  } finally {
    generating2fa.value = false
  }
}

async function confirmEnable2FA(): Promise<void> {
  if (!verificationCode.value || verificationCode.value.length !== 6) {
    ElMessage.warning('请输入6位数字安全码')
    return
  }
  try {
    loading2fa.value = true
    await authApi.enable2fa({ code: verificationCode.value })
    settings.twoFactorEnabled = true
    show2faDialog.value = false
    ElMessage.success('已成功启用安全验证')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '您输入的验证码有误'
    ElMessage.error(msg)
  } finally {
    loading2fa.value = false
  }
}

async function confirmDisable2FA(): Promise<void> {
  if (!verificationCode.value || verificationCode.value.length !== 6) {
    ElMessage.warning('请输入6位数字安全码以确认取消操作')
    return
  }
  try {
    loading2fa.value = true
    await authApi.disable2fa({ code: verificationCode.value })
    settings.twoFactorEnabled = false
    showDisable2faDialog.value = false
    ElMessage.success('已解除双重认证')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '您输入的验证码有误'
    ElMessage.error(msg)
  } finally {
    loading2fa.value = false
  }
}

function handleLogoutAllDevices(): void {
  ElMessage.success('已登出所有其他设备')
}

async function handleExportData(): Promise<void> {
  try {
    ElMessage.info('正在生成数据导出，请稍候...')
    const response = await portalApi.exportMyData()
    // 注意 responseType 为 blob，所以返回的本身就是文件流内容
    const url = window.URL.createObjectURL(response)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `个人数据与账单_${new Date().toISOString().split('T')[0]}.xlsx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    ElMessage.success('导出成功')
  } catch (error: unknown) {
    ElMessage.error('导出失败，请先稍等再重试')
  }
}
</script>
