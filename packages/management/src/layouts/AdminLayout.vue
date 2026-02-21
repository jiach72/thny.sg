<template>
  <div class="admin-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed: isCollapsed }">
      <div class="logo">
        <span v-if="!isCollapsed">通海南洋CRM</span>
        <span v-else>TH</span>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapsed"
        router
        class="sidebar-menu"
        background-color="#001529"
        text-color="#a6adb4"
        active-text-color="#fff"
      >
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <template #title>仪表板</template>
        </el-menu-item>
        
        <el-menu-item index="/workbench">
          <el-icon><Monitor /></el-icon>
          <template #title>工作台</template>
        </el-menu-item>
        
        <el-menu-item index="/leads">
          <el-icon><User /></el-icon>
          <template #title>线索管理</template>
        </el-menu-item>
        
        <el-menu-item index="/projects">
          <el-icon><Briefcase /></el-icon>
          <template #title>项目管理</template>
        </el-menu-item>
        
        <el-menu-item index="/tasks">
          <el-icon><List /></el-icon>
          <template #title>任务看板</template>
        </el-menu-item>
        
        <el-menu-item index="/messages">
          <el-icon><ChatDotRound /></el-icon>
          <template #title>消息发送</template>
        </el-menu-item>

        <el-menu-item index="/settings/invoices">
          <el-icon><Wallet /></el-icon>
          <template #title>发票管理</template>
        </el-menu-item>

        <el-menu-item index="/reports">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>报表中心</template>
        </el-menu-item>

        <el-menu-item index="/analytics">
          <el-icon><TrendCharts /></el-icon>
          <template #title>销售分析</template>
        </el-menu-item>
        
        <el-sub-menu index="settings-root">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统设置</span>
          </template>
          <el-menu-item index="/settings">
            <el-icon><Tools /></el-icon>
            <span>基本设置</span>
          </el-menu-item>
          <el-menu-item index="/settings/users">
            <el-icon><UserFilled /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="/settings/roles">
            <el-icon><Key /></el-icon>
            <span>角色权限</span>
          </el-menu-item>
          <el-menu-item index="/settings/scoring">
            <el-icon><Trophy /></el-icon>
            <span>评分规则</span>
          </el-menu-item>
          <el-menu-item index="/settings/email-templates">
            <el-icon><Message /></el-icon>
            <span>邮件模板</span>
          </el-menu-item>
          <el-menu-item index="/settings/scheduler">
            <el-icon><Timer /></el-icon>
            <span>定时任务</span>
          </el-menu-item>
          <el-menu-item index="/settings/faq">
            <el-icon><ChatDotRound /></el-icon>
            <span>FAQ 知识库</span>
          </el-menu-item>
          <el-menu-item index="/settings/news">
            <el-icon><Document /></el-icon>
            <span>新闻管理</span>
          </el-menu-item>
          <el-menu-item index="/settings/ai">
            <el-icon><Cpu /></el-icon>
            <span>AI 设置</span>
          </el-menu-item>
          <el-menu-item index="/settings/workflow-designer">
            <el-icon><Connection /></el-icon>
            <span>工作流设计器</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </aside>

    <!-- 主内容区 -->
    <div class="main-container">
      <!-- 顶部栏 -->
      <header class="header">
        <div class="header-left">
          <el-button
            :icon="isCollapsed ? Expand : Fold"
            text
            @click="isCollapsed = !isCollapsed"
          />
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <!-- 全局搜索 -->
        <div class="header-center">
          <button class="search-trigger" @click="showCommandPalette = true">
            <el-icon><Search /></el-icon>
            <span>搜索...</span>
            <div class="search-shortcut">
              <kbd>⌘</kbd>
              <kbd>K</kbd>
            </div>
          </button>
        </div>
        
        <div class="header-right">
          <!-- 主题切换器 -->
          <ThemeSwitcher />
          
          <!-- 通知中心 -->
          <NotificationCenter />
          
          <el-dropdown trigger="click" @command="handleCommand">
            <div class="user-info">
              <el-avatar :size="32" :src="user?.avatarUrl">
                {{ user?.name?.[0] || 'U' }}
              </el-avatar>
              <span class="user-name">{{ user?.name }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人设置</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 页面内容 -->
      <main class="content">
        <router-view />
      </main>
    </div>
    
    <!-- 全局搜索命令面板 -->
    <CommandPalette v-model:visible="showCommandPalette" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores'
import CommandPalette from '@/components/common/CommandPalette.vue'
import NotificationCenter from '@/components/common/NotificationCenter.vue'
import ThemeSwitcher from '@/components/common/ThemeSwitcher.vue'
import {
  Odometer,
  User,
  List,
  Briefcase,
  Setting,
  Fold,
  Expand,
  ArrowDown,
  ChatDotRound,
  DataAnalysis,
  Tools,
  UserFilled,
  Key,
  Document,
  Cpu,
  Monitor,
  Wallet,
  Trophy,
  Message,
  Timer,
  Search,
  TrendCharts,
  Connection,
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const isCollapsed = ref(false)
const showCommandPalette = ref(false)

const activeMenu = computed(() => {
  const path = route.path
  // 处理详情页高亮
  if (path.startsWith('/leads/')) return '/leads'
  return path
})

const currentTitle = computed(() => route.meta.title as string || '')

function handleCommand(command: string) {
  if (command === 'logout') {
    authStore.logout()
    router.push('/login')
  } else if (command === 'profile') {
    router.push('/settings')
  }
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--color-background);
}

.sidebar {
  width: 240px;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.sidebar.collapsed {
  width: 72px;
}

.logo {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  font-family: 'Lexend', sans-serif;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.03em;
  border-bottom: 1px solid var(--color-border);
}

.sidebar-menu {
  border-right: none;
  background: transparent !important;
  flex: 1;
  padding: 12px 0;
}

:deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
  margin: 4px 12px;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted) !important;
  font-family: 'Source Sans 3', sans-serif;
  font-weight: 500;
  transition: all 0.2s ease;
}

:deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, rgba(8, 145, 178, 0.15) 0%, rgba(6, 182, 212, 0.08) 100%) !important;
  color: var(--color-primary) !important;
  font-weight: 600;
}

:deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.05) !important;
  color: var(--color-text) !important;
}

/* 子菜单样式优化 */
:deep(.el-sub-menu) {
  margin: 4px 12px;
}

:deep(.el-sub-menu__title) {
  height: 48px !important;
  line-height: 48px !important;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted) !important;
  font-family: 'Source Sans 3', sans-serif;
  font-weight: 500;
  transition: all 0.15s ease;
  padding-left: 20px !important;
  padding-right: 12px !important;
}

:deep(.el-sub-menu__title span) {
  flex: 1;
}

:deep(.el-sub-menu__title:hover) {
  background: rgba(255, 255, 255, 0.05) !important;
  color: var(--color-text) !important;
}

:deep(.el-sub-menu.is-active > .el-sub-menu__title) {
  color: var(--color-primary) !important;
}

:deep(.el-sub-menu .el-menu) {
  background: transparent !important;
  padding: 0 !important;
}

:deep(.el-sub-menu .el-menu-item) {
  height: 40px;
  line-height: 40px;
  margin: 0 0 0 8px;
  padding-left: 40px !important;
  font-size: 13px;
}

:deep(.el-sub-menu .el-menu-item .el-icon) {
  font-size: 14px;
  margin-right: 8px;
}

/* 子菜单展开箭头 */
:deep(.el-sub-menu__icon-arrow) {
  color: var(--color-text-muted);
  transition: transform 0.15s ease;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  height: 72px;
  background: var(--color-background);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  border-bottom: 1px solid var(--color-border);
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  transition: all 0.2s;
}

.user-info:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.user-name {
  color: var(--color-text);
  font-size: 14px;
  font-weight: 600;
}

.content {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 全局搜索触发按钮 */
.header-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  cursor: pointer;
  color: var(--color-text-muted);
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s ease;
  min-width: 260px;
}

.search-trigger:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-primary);
  color: var(--color-text);
  box-shadow: var(--shadow-sm);
}

.search-trigger span {
  flex: 1;
  text-align: left;
}

.search-shortcut {
  display: flex;
  align-items: center;
  gap: 4px;
}

.search-shortcut kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  background: var(--color-border);
  border-radius: 4px;
  font-family: inherit;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-muted);
}
</style>
