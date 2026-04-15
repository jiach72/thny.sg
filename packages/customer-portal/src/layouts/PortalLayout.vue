<template>
  <div class="h-screen w-screen overflow-hidden font-sans text-text relative selection:bg-wealth selection:text-obsidian">
    
    <!-- 网络离线提示横幅 -->
    <transition name="slide-down">
      <div v-if="isOffline" class="fixed top-0 left-0 right-0 z-[100] bg-red-500/90 backdrop-blur-sm text-white text-center py-2 px-4 text-sm font-medium shadow-lg">
        {{ t('layout.offlineWarning') }}
      </div>
    </transition>
    
    <!-- 1. Immersive Wallpaper (Fluid CSS Mesh Gradient) -->
    <!-- Re-engineered to bring back the vivid "Monterey" wallpaper aesthetic locally without relying on external Unsplash image -->
    <div class="absolute inset-0 z-0 bg-obsidian overflow-hidden" aria-hidden="true" role="presentation">
      <!-- 深空渐变基底 -->
      <div class="absolute inset-0 bg-gradient-to-br from-[#130f25] via-[#2d235c] to-[#1a1c3b] opacity-100"></div>
      
      <!-- 巨大的橙金辉光（还原截图1左侧的亮色调） -->
      <div class="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] bg-gradient-to-br from-[#f97316] via-[#d97706]/40 to-transparent rounded-full blur-[140px] opacity-40 mix-blend-screen pointer-events-none"></div>
      
      <!-- 巨大的青蓝色辉光（还原右下角质感） -->
      <div class="absolute -bottom-[10%] -right-[10%] w-[60vw] h-[60vw] bg-gradient-to-tl from-[#06b6d4] via-[#3b82f6]/40 to-transparent rounded-full blur-[140px] opacity-40 mix-blend-screen pointer-events-none"></div>
      
      <!-- 补充性紫红色调和 -->
      <div class="absolute top-[20%] right-[10%] w-[40vw] h-[40vw] bg-[#9333ea] rounded-full blur-[140px] opacity-30 mix-blend-screen pointer-events-none"></div>

      <!-- 高级感颗粒噪点 -->
      <div class="absolute inset-0 opacity-[0.25] mix-blend-overlay pointer-events-none" style="background-image: url('/noise.svg'); background-repeat: repeat;"></div>
      
      <!-- 确保文本与界面对比度的底层遮罩 -->
      <div class="absolute inset-0 bg-obsidian/30 backdrop-blur-[1px] pointer-events-none"></div>
    </div>



    <!-- 3. Unified Glass Sidebar (Left) -->
    <div class="absolute left-6 top-6 bottom-6 w-20 rounded-[32px] bg-[#0B0F19]/60 backdrop-blur-2xl border border-white/10 flex flex-col items-center py-6 z-50 shadow-2xl" role="navigation" aria-label="主导航">
      
      <!-- Logo -->
      <div class="mb-6">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-wealth to-[#B49248] flex items-center justify-center shadow-lg shadow-wealth/20 cursor-pointer hover:scale-105 transition-transform" @click="$router.push('/')">
          <span class="font-serif font-bold text-2xl text-obsidian">T</span>
        </div>
      </div>

      <!-- Navigation -->
      <div class="flex flex-col gap-4 w-full items-center">
        <!-- Divider -->
        <div class="w-8 h-px bg-white/10 mb-2"></div>

        <router-link 
          v-for="item in navItems" 
          :key="item.path" 
          :to="item.path"
          class="group relative w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300"
          :class="$route.path.startsWith(item.path) && item.path !== '/' ? 'bg-white/10 text-wealth shadow-[0_0_15px_rgba(214,181,110,0.3)] shadow-[inset_0_0_10px_rgba(255,255,255,0.1)]' : 'text-white/70 hover:bg-white/10 hover:text-white hover:shadow-[0_0_10px_rgba(255,255,255,0.2)]'"
        >
          <component :is="item.icon" class="w-6 h-6 transition-transform group-hover:scale-110" />
          
          <!-- Tooltip -->
          <div class="absolute left-full ml-5 px-3 py-1.5 rounded-lg bg-[#151E2E] border border-white/10 text-sm whitespace-nowrap opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 shadow-xl z-50">
            {{ item.name }}
          </div>
          
          <!-- Active Indicator (Left Bar) -->
          <div v-if="$route.path.startsWith(item.path) && item.path !== '/'" class="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-8 bg-wealth rounded-r-full shadow-[0_0_8px_rgba(214,181,110,0.6)]"></div>
          
          <!-- Badge -->
          <span v-if="item.badge && item.badge > 0" class="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border border-obsidian">
            {{ item.badge }}
          </span>
        </router-link>
      </div>

      <!-- Spacer -->
      <div class="mt-auto w-full flex flex-col items-center gap-4">
        
        <!-- Divider -->
        <div class="w-8 h-px bg-white/10 mt-2"></div>

        <!-- System Icons -->
        
        <!-- Notifications -->
        <button class="relative group w-12 h-12 flex items-center justify-center rounded-xl bg-black/20 border border-white/5 hover:bg-wealth/20 hover:border-wealth/30 transition-all duration-300" @click="$router.push('/messages')" title="Notifications">
            <component :is="Bell" class="w-5 h-5 text-white group-hover:text-wealth transition-all" />
            <span v-if="unreadCount > 0" class="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-obsidian shadow-sm"></span>
        </button>

        <!-- Profile -->
        <button class="group w-12 h-12 flex items-center justify-center rounded-xl bg-black/20 border border-white/5 hover:bg-wealth/20 hover:border-wealth/30 transition-all duration-300" @click="$router.push('/profile')" title="Profile">
            <component :is="User" class="w-5 h-5 text-white group-hover:text-wealth transition-all" />
        </button>

        <!-- Language -->
        <el-dropdown trigger="click" @command="handleLanguageChange" placement="right">
          <button class="group w-12 h-12 flex items-center justify-center rounded-xl bg-black/20 border border-white/5 hover:bg-wealth/20 hover:border-wealth/30 transition-all duration-300" :title="t('common.language')">
              <component :is="Languages" class="w-5 h-5 text-white group-hover:text-wealth transition-all" />
          </button>
          <template #dropdown>
            <el-dropdown-menu class="!bg-obsidian !border-white/10">
              <el-dropdown-item command="zh" :class="{'!text-wealth': locale === 'zh'}" class="!text-white/70 hover:!text-white hover:!bg-white/10">中文</el-dropdown-item>
              <el-dropdown-item command="en" :class="{'!text-wealth': locale === 'en'}" class="!text-white/70 hover:!text-white hover:!bg-white/10">English</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- Help -->
        <button class="group w-12 h-12 flex items-center justify-center rounded-xl bg-black/20 border border-white/5 hover:bg-wealth/20 hover:border-wealth/30 transition-all duration-300" @click="$router.push('/help')" :title="t('nav.helpAndResources')">
            <component :is="HelpCircle" class="w-5 h-5 text-white group-hover:text-wealth transition-all" />
        </button>

        <!-- Settings -->
        <button class="group w-12 h-12 flex items-center justify-center rounded-xl bg-black/20 border border-white/5 hover:bg-wealth/20 hover:border-wealth/30 transition-all duration-300" @click="$router.push('/settings')" :title="t('nav.settings')">
            <component :is="Settings" class="w-5 h-5 text-white group-hover:text-wealth transition-all" />
        </button>
      </div>

    </div>

    <!-- 4. Main "App Window" Area -->
    <!-- Instead of a full page, it sits like a window -->
    <main class="absolute inset-0 z-10 pl-4 pr-4 py-4 pb-20 md:pl-32 md:pr-8 md:py-20 md:pb-0 pointer-events-none flex flex-col justify-center">
      <div class="w-full h-full max-w-[1600px] mx-auto pointer-events-auto flex flex-col">
        <!-- Window Container -->
        <div class="flex-1 bg-glass/60 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col relative">
            
            <!-- Window Glare Effect -->
            <div class="absolute top-0 right-0 w-[600px] h-[300px] bg-white/5 blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            <!-- Content Scroll Area -->
            <div class="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20 p-8">
               <router-view v-slot="{ Component }">
                  <transition name="zoom-fade" mode="out-in">
                    <component :is="Component" />
                  </transition>
                </router-view>
            </div>
        </div>
      </div>
    </main>

    <nav class="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-obsidian/90 backdrop-blur-xl border-t border-white/10 safe-area-bottom">
      <div class="flex items-center justify-around h-16">
        <router-link v-for="tab in mobileTabs" :key="tab.path || tab.key" :to="tab.path || ''"
          class="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors"
          :class="isMobileTabActive(tab) ? 'text-wealth' : 'text-white/50'"
          @click.prevent="tab.key === 'services' ? toggleServiceMenu() : navigateTo(tab.path)"
        >
          <component :is="tab.icon" class="w-5 h-5" />
          <span class="text-[10px]">{{ tab.name }}</span>
        </router-link>
      </div>

      <transition name="slide-up">
        <div v-if="showServiceMenu" class="absolute bottom-16 left-4 right-4 p-4 rounded-2xl bg-glass/20 backdrop-blur-2xl border border-white/10 shadow-2xl">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-bold uppercase tracking-wider text-text-muted">{{ t('nav.chat') }}</span>
            <button @click="showServiceMenu = false" class="p-1 rounded-lg hover:bg-white/10 text-text-muted transition-colors">
              <component :is="X" class="w-4 h-4" />
            </button>
          </div>
          <div class="space-y-1">
            <router-link to="/invoices" @click="showServiceMenu = false" class="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors">
              <div class="w-9 h-9 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center">
                <component :is="Receipt" class="w-4 h-4" />
              </div>
              <div>
                <div class="text-sm font-medium text-text">{{ t('nav.invoices') }}</div>
                <div class="text-[10px] text-text-muted">{{ t('layout.invoiceDesc') }}</div>
              </div>
            </router-link>
            <router-link to="/appointments" @click="showServiceMenu = false" class="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors">
              <div class="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <component :is="Calendar" class="w-4 h-4" />
              </div>
              <div>
                <div class="text-sm font-medium text-text">{{ t('nav.appointments') }}</div>
                <div class="text-[10px] text-text-muted">{{ t('layout.appointmentDesc') }}</div>
              </div>
            </router-link>
            <router-link to="/chat" @click="showServiceMenu = false" class="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors">
              <div class="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <component :is="MessageCircle" class="w-4 h-4" />
              </div>
              <div>
                <div class="text-sm font-medium text-text">{{ t('nav.chat') }}</div>
                <div class="text-[10px] text-text-muted">{{ t('layout.chatDesc') }}</div>
              </div>
            </router-link>
          </div>
        </div>
      </transition>

      <transition name="fade">
        <div v-if="showServiceMenu" class="fixed inset-0 z-[-1]" @click="showServiceMenu = false"></div>
      </transition>
    </nav>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { messageApi } from '@/api'
import { useI18n } from 'vue-i18n'
import { useIdleTimeout } from '@/composables/useIdleTimeout'
import { 
  LayoutGrid,
  FolderKanban,
  Vault,
  MessageSquare,
  MessageCircle,
  Settings,
  Bell,
  User,
  Languages,
  Receipt,
  HelpCircle,
  Calendar,
  X,
  Briefcase
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const unreadCount = ref(0)
const isOffline = ref(!navigator.onLine)
const showServiceMenu = ref(false)
const { t, locale } = useI18n()

// 启动空闲超时检测 (30分钟)
useIdleTimeout(30)

// 网络状态监听
const handleOnline = (): void => { isOffline.value = false }
const handleOffline = (): void => { isOffline.value = true }

const handleLanguageChange = (lang: 'zh' | 'en'): void => {
  locale.value = lang
  localStorage.setItem('thny_portal_lang', lang)
}

// More "App-like" naming
const navItems = computed(() => [
  { name: t('nav.dashboard'), path: '/dashboard', icon: LayoutGrid },
  { name: t('nav.projects'), path: '/projects', icon: FolderKanban },
  { name: t('nav.invoices'), path: '/invoices', icon: Receipt },
  { name: t('nav.appointments'), path: '/appointments', icon: Calendar },
  { name: t('nav.documents'), path: '/documents', icon: Vault },
  { name: t('nav.chat'), path: '/chat', icon: MessageCircle },
  { name: t('nav.messages'), path: '/messages', icon: MessageSquare, badge: unreadCount.value },
])

const mobileTabs = computed(() => [
  { name: t('nav.dashboard'), path: '/dashboard', icon: LayoutGrid },
  { name: t('nav.services'), key: 'services', path: '', icon: Briefcase },
  { name: t('nav.messages'), path: '/messages', icon: MessageSquare },
  { name: t('nav.documents'), path: '/documents', icon: Vault },
  { name: t('nav.profile'), path: '/profile', icon: User },
])

function isMobileTabActive(tab: { path?: string; key?: string }): boolean {
  if (tab.key === 'services') {
    return ['/invoices', '/appointments', '/chat'].includes(route.path)
  }
  return tab.path ? route.path.startsWith(tab.path) : false
}

function toggleServiceMenu(): void {
  showServiceMenu.value = !showServiceMenu.value
}

function navigateTo(path?: string): void {
  if (path) {
    showServiceMenu.value = false
    router.push(path)
  }
}



onMounted(async () => {
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  try {
    const result = await messageApi.getUnreadCount()
    unreadCount.value = result.count || 0
  } catch {
    // ignore
  }
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})


</script>

<style scoped>
/* App Window Zoom Transition */
.zoom-fade-enter-active,
.zoom-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.zoom-fade-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}

.zoom-fade-leave-to {
  opacity: 0;
  transform: scale(1.05);
}

/* 离线横幅动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}

/* 服务菜单弹出动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* 淡入淡出 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
