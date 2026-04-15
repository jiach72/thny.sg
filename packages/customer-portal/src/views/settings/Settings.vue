<template>
  <div class="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
    <!-- 头部 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="font-serif text-3xl text-text mb-2">{{ t('settings.title') }}</h1>
        <p class="text-sm text-text-muted">{{ t('settings.subtitle') }}</p>
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
            <h2 class="font-serif text-xl text-text">{{ t('settings.appearance') }}</h2>
            <p class="text-xs text-text-muted">{{ t('settings.appearanceDesc') }}</p>
          </div>
        </div>

        <div class="space-y-4">
          <div class="flex items-center justify-between py-3 border-b border-white/5">
            <div>
              <div class="text-sm font-medium text-text">{{ t('settings.darkMode') }}</div>
              <div class="text-xs text-text-muted">{{ t('settings.darkModeDesc') }}</div>
            </div>
            <el-switch v-model="settings.darkMode" active-color="#D6B56E" disabled />
          </div>
          
          <div class="flex items-center justify-between py-3 border-b border-white/5">
            <div>
              <div class="text-sm font-medium text-text">{{ t('settings.compactMode') }}</div>
              <div class="text-xs text-text-muted">{{ t('settings.compactModeDesc') }}</div>
            </div>
            <el-switch v-model="settings.compactMode" active-color="#D6B56E" @change="handleSettingsChange" />
          </div>
          
          <div class="flex items-center justify-between py-3">
            <div>
              <div class="text-sm font-medium text-text">{{ t('settings.animations') }}</div>
              <div class="text-xs text-text-muted">{{ t('settings.animationsDesc') }}</div>
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
            <h2 class="font-serif text-xl text-text">{{ t('settings.languageRegion') }}</h2>
            <p class="text-xs text-text-muted">{{ t('settings.languageRegionDesc') }}</p>
          </div>
        </div>

        <div class="space-y-4">
          <div class="flex items-center justify-between py-3 border-b border-white/5">
            <div>
              <div class="text-sm font-medium text-text">{{ t('settings.interfaceLanguage') }}</div>
              <div class="text-xs text-text-muted">{{ t('settings.interfaceLanguageDesc') }}</div>
            </div>
            <el-select v-model="settings.language" class="!w-40" @change="handleSettingsChange">
              <el-option label="简体中文" value="zh-CN" />
              <el-option label="English" value="en" />
            </el-select>
          </div>
          
          <div class="flex items-center justify-between py-3">
            <div>
              <div class="text-sm font-medium text-text">{{ t('settings.timezone') }}</div>
              <div class="text-xs text-text-muted">{{ t('settings.timezoneDesc') }}</div>
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
            <h2 class="font-serif text-xl text-text">{{ t('settings.privacySecurity') }}</h2>
            <p class="text-xs text-text-muted">{{ t('settings.privacySecurityDesc') }}</p>
          </div>
        </div>

        <div class="space-y-4">
          <div class="flex items-center justify-between py-3 border-b border-white/5">
            <div>
              <div class="text-sm font-medium text-text">{{ t('settings.activityLog') }}</div>
              <div class="text-xs text-text-muted">{{ t('settings.activityLogDesc') }}</div>
            </div>
            <el-switch v-model="settings.activityLog" active-color="#D6B56E" @change="handleSettingsChange" />
          </div>
          
          <div class="flex items-center justify-between py-3 border-b border-white/5">
            <div>
              <div class="text-sm font-medium text-text">{{ t('settings.loginNotification') }}</div>
              <div class="text-xs text-text-muted">{{ t('settings.loginNotificationDesc') }}</div>
            </div>
            <el-switch v-model="settings.loginNotification" active-color="#D6B56E" @change="handleSettingsChange" />
          </div>
          
          <div class="flex items-center justify-between py-3">
            <div>
              <div class="text-sm font-medium text-text">{{ t('settings.twoFactorAuth') }}</div>
              <div class="text-xs text-text-muted">{{ t('settings.twoFactorAuthDesc') }}</div>
            </div>
            <button 
              @click="handleSetup2FA"
              class="px-4 py-2 text-sm font-medium text-wealth border border-wealth/30 rounded hover:bg-wealth/10 transition-colors"
            >
              {{ settings.twoFactorEnabled ? t('settings.enabled') : t('settings.setup') }}
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
            <h2 class="font-serif text-xl text-text">{{ t('settings.sessionManagement') }}</h2>
            <p class="text-xs text-text-muted">{{ t('settings.sessionManagementDesc') }}</p>
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
                  <span class="px-2 py-0.5 rounded bg-wealth/20 text-wealth text-[10px] font-bold">{{ t('settings.currentDevice') }}</span>
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
            {{ t('settings.logoutAllDevices') }}
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
            <h2 class="font-serif text-xl text-text">{{ t('settings.dataExport') }}</h2>
            <p class="text-xs text-text-muted">{{ t('settings.dataExportDesc') }}</p>
          </div>
        </div>

        <div class="flex flex-wrap gap-4">
          <button 
            @click="handleExportData"
            class="px-5 py-2.5 text-sm font-medium text-text bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors flex items-center gap-2"
          >
            <component :is="Download" class="w-4 h-4" />
            {{ t('settings.exportMyData') }}
          </button>
          <button 
            @click="handleDeleteAccount"
            class="px-5 py-2.5 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded transition-colors"
          >
            {{ t('settings.deleteAccount') }}
          </button>
        </div>
      </div>

    </div>

    <!-- 保存提示 -->
    <div v-if="saving" class="fixed bottom-8 right-8 px-4 py-2 rounded-lg bg-wealth text-obsidian text-sm font-medium shadow-lg animate-fade-in-up">
      {{ t('settings.settingsSaved') }}
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
import { ElMessage, ElSwitch, ElSelect, ElOption, ElDialog, ElInput, ElMessageBox } from 'element-plus'
import { 
  Palette, Globe2, ShieldCheck, Smartphone, Monitor, Download 
} from 'lucide-vue-next'
import { portalApi, authApi } from '@/api'
import { useAuthStore } from '@/stores'
import { useRouter } from 'vue-router'
import { logger } from '@/utils/logger'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const router = useRouter()
const authStore = useAuthStore()

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
  try {
    const data = await authApi.getCurrentUser()
    if (data) {
      settings.twoFactorEnabled = !!(data as { twoFactorEnabled?: boolean }).twoFactorEnabled
      const prefs = (data as any).preferences
      if (prefs) {
        if (prefs.darkMode !== undefined) settings.darkMode = prefs.darkMode
        if (prefs.compactMode !== undefined) settings.compactMode = prefs.compactMode
        if (prefs.animations !== undefined) settings.animations = prefs.animations
        if (prefs.language !== undefined) settings.language = prefs.language
        if (prefs.timezone !== undefined) settings.timezone = prefs.timezone
        if (prefs.activityLog !== undefined) settings.activityLog = prefs.activityLog
        if (prefs.loginNotification !== undefined) settings.loginNotification = prefs.loginNotification
      }
    }
  } catch(e) {
    logger.warn('Settings', 'Failed to fetch settings from backend:', e)
    const saved = localStorage.getItem('portal_settings')
    if (saved) {
      try {
        Object.assign(settings, JSON.parse(saved))
      } catch {
        // 忽略解析错误
      }
    }
  }
})

let savingTimer: ReturnType<typeof setTimeout> | null = null
let syncTimer: ReturnType<typeof setTimeout> | null = null

function handleSettingsChange(): void {
  localStorage.setItem('portal_settings', JSON.stringify(settings))
  
  saving.value = true
  if (savingTimer) clearTimeout(savingTimer)
  savingTimer = setTimeout(() => {
    saving.value = false
    savingTimer = null
  }, 2000)

  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(async () => {
    try {
      await portalApi.updatePreferences({
        darkMode: settings.darkMode,
        compactMode: settings.compactMode,
        animations: settings.animations,
        language: settings.language,
        timezone: settings.timezone,
        activityLog: settings.activityLog,
        loginNotification: settings.loginNotification,
      } as any)
    } catch (e) {
      logger.warn('Settings', 'Failed to sync settings to backend:', e)
    }
  }, 1000)
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

async function handleLogoutAllDevices(): Promise<void> {
  try {
    await authStore.logout()
    ElMessage.success('已安全登出并在本设备清除会话')
    router.push('/login')
  } catch (e) {
    ElMessage.error('登出失败，请重试')
  }
}

async function handleExportData(): Promise<void> {
  try {
    ElMessage.info('正在生成数据导出，请稍候...')
    const response = await portalApi.exportMyData()
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

async function handleDeleteAccount(): Promise<void> {
  try {
    await ElMessageBox.confirm(
      '此操作将永久删除您的账户及所有关联数据，且不可恢复。确定要继续吗？',
      '删除账户',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'error',
        confirmButtonClass: 'el-button--danger',
        customClass: 'bg-obsidian border border-white/10',
      }
    )
    const { value } = await ElMessageBox.prompt(
      '请输入 "DELETE" 以确认删除操作',
      '最终确认',
      {
        confirmButtonText: '永久删除',
        cancelButtonText: '取消',
        inputPattern: /^DELETE$/,
        inputErrorMessage: '请输入正确的确认文本',
        customClass: 'bg-obsidian border border-white/10',
      }
    )
    if (value === 'DELETE') {
      await portalApi.deleteAccount()
      ElMessage.success('账户删除请求已提交')
      authStore.logout()
      router.push('/login')
    }
  } catch (error: unknown) {
    if (error !== 'cancel') {
      const msg = error instanceof Error ? error.message : '删除账户失败'
      ElMessage.error(msg)
    }
  }
}
</script>
