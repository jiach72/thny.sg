<template>
  <div class="notification-center">
    <!-- 触发按钮 -->
    <el-popover
      :visible="showPopover"
      placement="bottom-end"
      :width="380"
      trigger="click"
      popper-class="notification-popover"
      @show="onShowPopover"
    >
      <template #reference>
        <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
          <el-button class="notification-btn" circle @click="showPopover = !showPopover">
            <el-icon :size="18"><Bell /></el-icon>
          </el-button>
        </el-badge>
      </template>

      <!-- 通知面板 -->
      <div class="notification-panel">
        <!-- 头部 -->
        <div class="panel-header">
          <h4>通知中心</h4>
          <div class="header-actions">
            <el-button text size="small" @click="markAllAsRead" :disabled="unreadCount === 0">
              全部已读
            </el-button>
            <el-button text size="small" :icon="Setting" @click="openSettings" />
          </div>
        </div>

        <!-- 分类标签 -->
        <div class="category-tabs">
          <button 
            v-for="tab in tabs" 
            :key="tab.value"
            class="tab-btn"
            :class="{ active: activeTab === tab.value }"
            @click="activeTab = tab.value"
          >
            {{ tab.label }}
            <span v-if="tab.count > 0" class="tab-count">{{ tab.count }}</span>
          </button>
        </div>

        <!-- 通知列表 -->
        <div class="notification-list" v-if="filteredNotifications.length > 0">
          <div 
            v-for="notification in filteredNotifications" 
            :key="notification.id"
            class="notification-item"
            :class="{ unread: !notification.read }"
            @click="handleNotificationClick(notification)"
          >
            <div class="notification-icon" :style="{ background: getTypeColor(notification.type) }">
              <el-icon :size="16"><component :is="getTypeIcon(notification.type)" /></el-icon>
            </div>
            <div class="notification-content">
              <div class="notification-title">{{ notification.title }}</div>
              <div class="notification-message">{{ notification.message }}</div>
              <div class="notification-time">{{ formatTime(notification.createdAt) }}</div>
            </div>
            <el-button 
              v-if="!notification.read"
              class="mark-read-btn"
              circle 
              size="small"
              @click.stop="markAsRead(notification)"
            >
              <el-icon :size="12"><Check /></el-icon>
            </el-button>
          </div>
        </div>

        <!-- 空状态 -->
        <div class="empty-state" v-else>
          <el-icon :size="40"><BellFilled /></el-icon>
          <p>暂无{{ activeTab === 'all' ? '' : tabLabel }}通知</p>
        </div>

        <!-- 底部 -->
        <div class="panel-footer">
          <el-button text @click="viewAll">查看全部通知</el-button>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Bell,
  BellFilled,
  Setting,
  Check,
  User,
  Tickets,
  Warning,
  CircleCheck,
  Clock,
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

// 通知类型定义
interface Notification {
  id: string
  type: 'lead' | 'task' | 'system' | 'reminder' | 'success' | 'warning'
  title: string
  message: string
  read: boolean
  createdAt: string
  link?: string
}

const router = useRouter()
const showPopover = ref(false)
const activeTab = ref('all')

// 模拟通知数据
const notifications = ref<Notification[]>([
  {
    id: '1',
    type: 'lead',
    title: '新线索分配',
    message: '您有一条新线索「张三 - ABC公司」已分配给您',
    read: false,
    createdAt: new Date(Date.now() - 300000).toISOString(),
    link: '/leads/1',
  },
  {
    id: '2',
    type: 'task',
    title: '任务即将到期',
    message: '任务「首次跟进」将在 2 小时后到期',
    read: false,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    link: '/tasks',
  },
  {
    id: '3',
    type: 'success',
    title: '线索转化成功',
    message: '线索「李四」已成功转化为客户',
    read: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '4',
    type: 'reminder',
    title: '跟进提醒',
    message: '别忘了今天跟进「王五」的服务咨询',
    read: true,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '5',
    type: 'system',
    title: '系统更新',
    message: '系统已更新到最新版本，新增工作流自动化功能',
    read: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '6',
    type: 'warning',
    title: '逾期任务提醒',
    message: '您有 3 个任务已逾期，请尽快处理',
    read: true,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    link: '/tasks?filter=overdue',
  },
])

// 分类标签
const tabs = computed(() => [
  { label: '全部', value: 'all', count: unreadCount.value },
  { label: '线索', value: 'lead', count: getUnreadCountByType('lead') },
  { label: '任务', value: 'task', count: getUnreadCountByType('task') },
  { label: '系统', value: 'system', count: getUnreadCountByType('system') },
])

const tabLabel = computed(() => {
  return tabs.value.find(t => t.value === activeTab.value)?.label || ''
})

// 未读数量
const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

function getUnreadCountByType(type: string) {
  return notifications.value.filter(n => !n.read && n.type === type).length
}

// 过滤通知
const filteredNotifications = computed(() => {
  if (activeTab.value === 'all') {
    return notifications.value.slice(0, 10)
  }
  return notifications.value.filter(n => n.type === activeTab.value).slice(0, 10)
})

// 获取类型图标
function getTypeIcon(type: string) {
  const icons: Record<string, typeof Bell> = {
    lead: User,
    task: Tickets,
    system: Bell,
    reminder: Clock,
    success: CircleCheck,
    warning: Warning,
  }
  return icons[type] || Bell
}

// 获取类型颜色
function getTypeColor(type: string) {
  const colors: Record<string, string> = {
    lead: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    task: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    system: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
    reminder: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    warning: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  }
  return colors[type] || colors.system
}

// 格式化时间
function formatTime(dateStr: string) {
  return dayjs(dateStr).fromNow()
}

// 标记已读
function markAsRead(notification: Notification) {
  notification.read = true
}

// 全部已读
function markAllAsRead() {
  notifications.value.forEach(n => n.read = true)
  ElMessage.success('已全部标记为已读')
}

// 点击通知
function handleNotificationClick(notification: Notification) {
  markAsRead(notification)
  if (notification.link) {
    router.push(notification.link)
    showPopover.value = false
  }
}

// 查看全部
function viewAll() {
  router.push('/notifications')
  showPopover.value = false
}

// 打开设置
function openSettings() {
  router.push('/settings/notifications')
  showPopover.value = false
}

// 显示面板时
function onShowPopover() {
  // 可以在这里刷新通知
}

onMounted(() => {
  // 可在此处添加 WebSocket 订阅或轮询逻辑
})

onUnmounted(() => {
  // 清理订阅
})
</script>

<style scoped>
.notification-btn {
  background: transparent;
  border: none;
  color: var(--color-text-muted, #64748b);
  transition: all 0.2s ease;
}

.notification-btn:hover {
  color: var(--color-primary, #0891b2);
  background: var(--color-primary-light, rgba(8, 145, 178, 0.1));
}

.notification-panel {
  margin: -12px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
}

.panel-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text, #1e293b);
}

.header-actions {
  display: flex;
  gap: 4px;
}

/* 分类标签 */
.category-tabs {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
  overflow-x: auto;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 13px;
  color: var(--color-text-muted, #64748b);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.tab-btn:hover {
  background: var(--color-background, #f1f5f9);
  color: var(--color-text, #1e293b);
}

.tab-btn.active {
  background: var(--color-primary, #0891b2);
  color: white;
}

.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 9px;
  font-size: 11px;
  font-weight: 600;
}

.tab-btn:not(.active) .tab-count {
  background: var(--color-primary, #0891b2);
  color: white;
}

/* 通知列表 */
.notification-list {
  max-height: 360px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.notification-item:hover {
  background: var(--color-background, #f8fafc);
}

.notification-item.unread {
  background: var(--color-primary-light, rgba(8, 145, 178, 0.05));
}

.notification-item.unread::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--color-primary, #0891b2);
}

.notification-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: white;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text, #1e293b);
  margin-bottom: 4px;
}

.notification-message {
  font-size: 13px;
  color: var(--color-text-muted, #64748b);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-time {
  font-size: 12px;
  color: var(--color-text-muted, #94a3b8);
  margin-top: 4px;
}

.mark-read-btn {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.notification-item:hover .mark-read-btn {
  opacity: 1;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--color-text-muted, #94a3b8);
}

.empty-state p {
  margin: 12px 0 0;
  font-size: 14px;
}

/* 底部 */
.panel-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--color-border, #e2e8f0);
  text-align: center;
}
</style>

<style>
/* 全局样式覆盖 popover */
.notification-popover {
  padding: 0 !important;
  border-radius: 16px !important;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15) !important;
}
</style>
