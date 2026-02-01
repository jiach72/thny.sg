<template>
  <div class="h-screen w-screen overflow-hidden font-sans text-text relative selection:bg-wealth selection:text-obsidian">
    
    <!-- 1. Immersive Wallpaper (Fluid Gradient) -->
    <!-- Using a high-quality abstract gradient background similar to the reference -->
    <div class="absolute inset-0 z-0 bg-obsidian">
      <img 
        src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" 
        class="w-full h-full object-cover opacity-80"
        alt="Wallpaper"
      />
      <!-- Overlay to ensure text readability -->
      <div class="absolute inset-0 bg-obsidian/30"></div>
    </div>



    <!-- 3. Unified Glass Sidebar (Left) -->
    <div class="absolute left-6 top-6 bottom-6 w-20 rounded-[32px] bg-[#0B0F19]/60 backdrop-blur-2xl border border-white/10 flex flex-col items-center py-6 z-50 shadow-2xl">
      
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
        <button class="group w-12 h-12 flex items-center justify-center rounded-xl bg-black/20 border border-white/5 hover:bg-wealth/20 hover:border-wealth/30 transition-all duration-300" title="Language">
            <component :is="Languages" class="w-5 h-5 text-white group-hover:text-wealth transition-all" />
        </button>

        <!-- Settings -->
        <button class="group w-12 h-12 flex items-center justify-center rounded-xl bg-black/20 border border-white/5 hover:bg-wealth/20 hover:border-wealth/30 transition-all duration-300" @click="$router.push('/settings')" title="设置">
            <component :is="Settings" class="w-5 h-5 text-white group-hover:text-wealth transition-all" />
        </button>
      </div>

    </div>

    <!-- 4. Main "App Window" Area -->
    <!-- Instead of a full page, it sits like a window -->
    <main class="absolute inset-0 z-10 pl-32 pr-8 py-20 pointer-events-none flex flex-col justify-center">
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

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { messageApi } from '@/api'
import { 
  LayoutGrid, // Dashboard
  FolderKanban, // Projects
  Vault, // Vault
  MessageSquare, // Messages
  Settings,
  Bell,
  User,
  Languages
} from 'lucide-vue-next'

const unreadCount = ref(0)

// More "App-like" naming
const navItems = computed(() => [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutGrid },
  { name: 'Projects', path: '/projects', icon: FolderKanban },
  { name: 'Secure Vault', path: '/documents', icon: Vault },
  { name: 'Messages', path: '/messages', icon: MessageSquare, badge: unreadCount.value },
])

onMounted(async () => {
  try {
    const result = await messageApi.getUnreadCount()
    unreadCount.value = result.data?.count || 0
  } catch {
    // ignore
  }
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
</style>
