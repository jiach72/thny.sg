<template>
  <Teleport to="body">
    <!-- 遮罩层 -->
    <Transition name="fade">
      <div
        v-if="visible"
        class="command-palette-overlay"
        @click="close"
      />
    </Transition>

    <!-- 命令面板 -->
    <Transition name="slide-down">
      <div v-if="visible" class="command-palette">
        <!-- 搜索输入框 -->
        <div class="search-header">
          <el-icon class="search-icon"><Search /></el-icon>
          <input
            ref="searchInput"
            v-model="query"
            type="text"
            class="search-input"
            placeholder="搜索线索、项目、任务或输入命令..."
            @keydown.esc="close"
            @keydown.down.prevent="selectNext"
            @keydown.up.prevent="selectPrev"
            @keydown.enter.prevent="executeSelected"
          />
          <div class="search-shortcut">
            <kbd>ESC</kbd>
            <span>关闭</span>
          </div>
        </div>

        <!-- 搜索结果 -->
        <div class="search-results" v-if="filteredResults.length > 0">
          <div
            v-for="(group, groupIndex) in groupedResults"
            :key="group.category"
            class="result-group"
          >
            <div class="group-header">
              <el-icon :size="14"><component :is="getCategoryIcon(group.category)" /></el-icon>
              <span>{{ getCategoryLabel(group.category) }}</span>
              <span class="group-count">{{ group.items.length }}</span>
            </div>
            <div
              v-for="(result, index) in group.items"
              :key="result.id"
              class="result-item"
              :class="{ active: isSelected(groupIndex, index) }"
              @click="executeItem(result)"
              @mouseenter="setSelected(groupIndex, index)"
            >
              <div class="result-icon">
                <el-icon><component :is="getResultIcon(result)" /></el-icon>
              </div>
              <div class="result-content">
                <div class="result-title" v-html="highlightQuery(result.title)"></div>
                <div class="result-subtitle" v-if="result.subtitle">{{ result.subtitle }}</div>
              </div>
              <div class="result-meta" v-if="result.meta">
                <el-tag size="small" :type="getTagType(result.meta)">{{ result.meta }}</el-tag>
              </div>
              <div class="result-action">
                <kbd>↵</kbd>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div class="empty-state" v-else-if="query.length > 0">
          <el-icon :size="48" color="#94a3b8"><Search /></el-icon>
          <p>未找到匹配 "<strong>{{ query }}</strong>" 的结果</p>
          <span>尝试搜索其他关键词</span>
        </div>

        <!-- 快捷命令 -->
        <div class="quick-commands" v-else>
          <div class="commands-header">快捷命令</div>
          <div class="commands-grid">
            <div
              v-for="command in quickCommands"
              :key="command.id"
              class="command-card"
              @click="executeCommand(command)"
            >
              <div class="command-icon" :style="{ background: command.color }">
                <el-icon :size="18"><component :is="command.icon" /></el-icon>
              </div>
              <div class="command-info">
                <span class="command-name">{{ command.name }}</span>
                <span class="command-desc">{{ command.description }}</span>
              </div>
              <kbd v-if="command.shortcut">{{ command.shortcut }}</kbd>
            </div>
          </div>

          <!-- 最近访问 -->
          <div class="recent-section" v-if="recentItems.length > 0">
            <div class="commands-header">最近访问</div>
            <div
              v-for="item in recentItems"
              :key="item.id"
              class="result-item"
              @click="executeItem(item)"
            >
              <div class="result-icon">
                <el-icon><component :is="getResultIcon(item)" /></el-icon>
              </div>
              <div class="result-content">
                <div class="result-title">{{ item.title }}</div>
                <div class="result-subtitle">{{ item.subtitle }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部提示 -->
        <div class="palette-footer">
          <div class="footer-hint">
            <kbd>↑↓</kbd> 导航
            <kbd>↵</kbd> 选择
            <kbd>ESC</kbd> 关闭
          </div>
          <div class="footer-brand">通海南洋 CRM</div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Search,
  User,
  Briefcase,
  List,
  Plus,
  Setting,
  Tickets,
  Document,
  DataAnalysis,
} from '@element-plus/icons-vue'
import { sanitizeHtml } from '@/utils/sanitize'

// 定义类型
interface SearchResult {
  id: string
  title: string
  subtitle?: string
  category: 'lead' | 'project' | 'task' | 'command' | 'page'
  route?: string
  action?: () => void
  meta?: string
}

interface QuickCommand {
  id: string
  name: string
  description: string
  icon: typeof User
  color: string
  shortcut?: string
  action: () => void
}

// Props 和 Emits
const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const router = useRouter()
const searchInput = ref<HTMLInputElement>()
const query = ref('')
const selectedGroup = ref(0)
const selectedIndex = ref(0)

// 快捷命令配置
const quickCommands: QuickCommand[] = [
  {
    id: 'new-lead',
    name: '创建线索',
    description: '添加新的销售线索',
    icon: Plus,
    color: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    shortcut: 'N',
    action: () => router.push('/leads?action=create'),
  },
  {
    id: 'new-task',
    name: '创建任务',
    description: '添加新的任务',
    icon: List,
    color: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    shortcut: 'T',
    action: () => router.push('/tasks?action=create'),
  },
  {
    id: 'dashboard',
    name: '仪表板',
    description: '查看数据概览',
    icon: DataAnalysis,
    color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    shortcut: 'D',
    action: () => router.push('/dashboard'),
  },
  {
    id: 'settings',
    name: '系统设置',
    description: '配置系统参数',
    icon: Setting,
    color: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
    shortcut: ',',
    action: () => router.push('/settings'),
  },
]

// 模拟搜索结果（实际应从 API 获取）
const mockResults: SearchResult[] = [
  // 页面导航
  { id: 'page-dashboard', title: '仪表板', subtitle: '数据概览和统计', category: 'page', route: '/dashboard' },
  { id: 'page-leads', title: '线索管理', subtitle: '管理所有销售线索', category: 'page', route: '/leads' },
  { id: 'page-projects', title: '项目管理', subtitle: '查看和管理项目', category: 'page', route: '/projects' },
  { id: 'page-tasks', title: '任务看板', subtitle: '待办任务管理', category: 'page', route: '/tasks' },
  { id: 'page-reports', title: '报表中心', subtitle: '数据分析和报表', category: 'page', route: '/reports' },
  { id: 'page-messages', title: '消息发送', subtitle: '客户消息管理', category: 'page', route: '/messages' },
  { id: 'page-invoices', title: '发票管理', subtitle: '发票和账单', category: 'page', route: '/settings/invoices' },
  { id: 'page-customers', title: '客户管理', subtitle: '管理客户信息与画像', category: 'page', route: '/customers' },
  { id: 'page-users', title: '员工管理', subtitle: '管理系统内部员工', category: 'page', route: '/settings/users' },
  { id: 'page-roles', title: '角色权限', subtitle: '配置角色和权限', category: 'page', route: '/settings/roles' },
]

// 最近访问记录（实际应从 localStorage 读取）
const recentItems = ref<SearchResult[]>([])

// 搜索过滤
const filteredResults = computed(() => {
  if (!query.value.trim()) return []
  
  const q = query.value.toLowerCase()
  return mockResults.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.subtitle?.toLowerCase().includes(q)
  )
})

// 按类别分组结果
const groupedResults = computed(() => {
  const groups: Record<string, SearchResult[]> = {}
  
  filteredResults.value.forEach((result) => {
    if (!groups[result.category]) {
      groups[result.category] = []
    }
    groups[result.category].push(result)
  })
  
  return Object.entries(groups).map(([category, items]) => ({
    category,
    items,
  }))
})

// 获取类别图标
function getCategoryIcon(category: string) {
  const icons: Record<string, typeof User> = {
    lead: User,
    project: Briefcase,
    task: List,
    command: Tickets,
    page: Document,
  }
  return icons[category] || Document
}

// 获取类别标签
function getCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    lead: '线索',
    project: '项目',
    task: '任务',
    command: '命令',
    page: '页面',
  }
  return labels[category] || '其他'
}

// 获取结果图标
function getResultIcon(result: SearchResult) {
  return getCategoryIcon(result.category)
}

// 获取标签类型
function getTagType(meta: string) {
  const types: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    '新线索': 'success',
    '进行中': 'warning',
    '已完成': 'info',
    '已逾期': 'danger',
  }
  return types[meta] || 'info'
}

function highlightQuery(text: string) {
  if (!query.value.trim()) return text
  const escaped = query.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  return sanitizeHtml(text.replace(regex, '<mark>$1</mark>'), {
    allowedTags: ['mark'],
    allowedAttr: [],
  })
}

// 选择状态管理
function isSelected(groupIdx: number, itemIdx: number) {
  return selectedGroup.value === groupIdx && selectedIndex.value === itemIdx
}

function setSelected(groupIdx: number, itemIdx: number) {
  selectedGroup.value = groupIdx
  selectedIndex.value = itemIdx
}

function selectNext() {
  if (groupedResults.value.length === 0) return
  
  const currentGroup = groupedResults.value[selectedGroup.value]
  if (selectedIndex.value < currentGroup.items.length - 1) {
    selectedIndex.value++
  } else if (selectedGroup.value < groupedResults.value.length - 1) {
    selectedGroup.value++
    selectedIndex.value = 0
  }
}

function selectPrev() {
  if (groupedResults.value.length === 0) return
  
  if (selectedIndex.value > 0) {
    selectedIndex.value--
  } else if (selectedGroup.value > 0) {
    selectedGroup.value--
    selectedIndex.value = groupedResults.value[selectedGroup.value].items.length - 1
  }
}

function executeSelected() {
  if (groupedResults.value.length === 0) return
  
  const currentGroup = groupedResults.value[selectedGroup.value]
  const item = currentGroup?.items[selectedIndex.value]
  if (item) {
    executeItem(item)
  }
}

// 执行选中项
function executeItem(result: SearchResult) {
  // 保存到最近访问
  addToRecent(result)
  
  if (result.route) {
    router.push(result.route)
  } else if (result.action) {
    result.action()
  }
  close()
}

// 执行快捷命令
function executeCommand(command: QuickCommand) {
  command.action()
  close()
}

// 添加到最近访问
function addToRecent(item: SearchResult) {
  const exists = recentItems.value.findIndex((i) => i.id === item.id)
  if (exists > -1) {
    recentItems.value.splice(exists, 1)
  }
  recentItems.value.unshift(item)
  if (recentItems.value.length > 5) {
    recentItems.value.pop()
  }
  // 保存到 localStorage
  localStorage.setItem('crm-recent-items', JSON.stringify(recentItems.value))
}

// 关闭面板
function close() {
  query.value = ''
  selectedGroup.value = 0
  selectedIndex.value = 0
  emit('update:visible', false)
}

// 全局快捷键 Cmd/Ctrl + K
function handleGlobalKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    emit('update:visible', !props.visible)
  }
}

// 监听显示状态，自动聚焦输入框
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      nextTick(() => {
        searchInput.value?.focus()
      })
    }
  }
)

// 重置选择状态
watch(query, () => {
  selectedGroup.value = 0
  selectedIndex.value = 0
})

onMounted(() => {
  // 加载最近访问
  try {
    const saved = localStorage.getItem('crm-recent-items')
    if (saved) {
      recentItems.value = JSON.parse(saved)
    }
  } catch {
    // 忽略解析错误
  }
  
  // 注册全局快捷键
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<style scoped>
/* 遮罩层 */
.command-palette-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
}

/* 命令面板主体 */
.command-palette {
  position: fixed;
  top: 15%;
  left: 50%;
  transform: translateX(-50%);
  width: 640px;
  max-width: calc(100vw - 32px);
  max-height: 70vh;
  background: var(--color-surface, #0f172a);
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  z-index: 1001;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 搜索头部 */
.search-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
  gap: 12px;
}

.search-icon {
  font-size: 20px;
  color: var(--color-text-muted, #94a3b8);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 16px;
  color: var(--color-text, #f1f5f9);
  font-family: inherit;
}

.search-input::placeholder {
  color: var(--color-text-muted, #64748b);
}

.search-shortcut {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-text-muted, #64748b);
  font-size: 12px;
}

/* 搜索结果 */
.search-results {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.result-group {
  margin-bottom: 8px;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted, #64748b);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.group-count {
  background: var(--color-border, rgba(255, 255, 255, 0.1));
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.result-item:hover,
.result-item.active {
  background: var(--color-primary, #0891b2);
  background: linear-gradient(135deg, rgba(8, 145, 178, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%);
}

.result-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-border, rgba(255, 255, 255, 0.05));
  border-radius: 8px;
  color: var(--color-primary, #06b6d4);
  flex-shrink: 0;
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text, #f1f5f9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-title :deep(mark) {
  background: rgba(6, 182, 212, 0.3);
  color: #22d3ee;
  padding: 0 2px;
  border-radius: 2px;
}

.result-subtitle {
  font-size: 12px;
  color: var(--color-text-muted, #64748b);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-meta {
  flex-shrink: 0;
}

.result-action {
  opacity: 0;
  transition: opacity 0.15s ease;
}

.result-item.active .result-action,
.result-item:hover .result-action {
  opacity: 1;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  color: var(--color-text-muted, #64748b);
}

.empty-state p {
  margin: 16px 0 8px;
  font-size: 14px;
  color: var(--color-text, #f1f5f9);
}

.empty-state strong {
  color: var(--color-primary, #06b6d4);
}

/* 快捷命令 */
.quick-commands {
  padding: 8px;
  overflow-y: auto;
  flex: 1;
}

.commands-header {
  padding: 12px 12px 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted, #64748b);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.commands-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 0 4px;
}

.command-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--color-border, rgba(255, 255, 255, 0.03));
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.command-card:hover {
  background: var(--color-border, rgba(255, 255, 255, 0.06));
  border-color: var(--color-primary, #0891b2);
  transform: translateY(-1px);
}

.command-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: white;
  flex-shrink: 0;
}

.command-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.command-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text, #f1f5f9);
}

.command-desc {
  font-size: 12px;
  color: var(--color-text-muted, #64748b);
}

.recent-section {
  margin-top: 16px;
}

/* 底部提示 */
.palette-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
  font-size: 12px;
  color: var(--color-text-muted, #64748b);
}

.footer-hint {
  display: flex;
  align-items: center;
  gap: 12px;
}

.footer-brand {
  font-weight: 600;
  color: var(--color-primary, #06b6d4);
}

/* 键盘快捷键样式 */
kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: var(--color-border, rgba(255, 255, 255, 0.1));
  border-radius: 4px;
  font-family: inherit;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-muted, #94a3b8);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px) scale(0.95);
}
</style>
