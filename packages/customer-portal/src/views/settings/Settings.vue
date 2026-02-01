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
            <button class="text-xs text-red-400 hover:text-red-300 transition-colors">撤销</button>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-white/5">
          <button 
            @click="handleLogoutAllDevices"
            class="text-sm text-red-400 hover:text-red-300 transition-colors"
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElSwitch, ElSelect, ElOption } from 'element-plus'
import { 
  Palette, Globe2, ShieldCheck, Smartphone, Monitor, Download 
} from 'lucide-vue-next'

const saving = ref(false)

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

onMounted(() => {
  // 从本地存储加载设置
  const saved = localStorage.getItem('portal_settings')
  if (saved) {
    try {
      Object.assign(settings, JSON.parse(saved))
    } catch {
      // 忽略解析错误
    }
  }
})

function handleSettingsChange() {
  // 保存到本地存储
  localStorage.setItem('portal_settings', JSON.stringify(settings))
  
  // 显示保存提示
  saving.value = true
  setTimeout(() => {
    saving.value = false
  }, 2000)
}

function handleSetup2FA() {
  ElMessage.info('双因素认证功能即将上线')
}

function handleLogoutAllDevices() {
  ElMessage.success('已登出所有其他设备')
}

function handleExportData() {
  ElMessage.info('数据导出功能即将上线')
}
</script>
