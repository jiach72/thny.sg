<template>
  <base-layout>
    <view class="messages-page">
      <view class="page-header">
        <view class="header-top">
          <view>
            <text class="page-title">消息中心</text>
            <text class="page-desc">来自顾问团队的通知</text>
          </view>
          <view class="header-actions">
            <view class="unread-badge" v-if="unreadCount > 0">
              <text class="badge-num">{{ unreadCount }}</text>
            </view>
            <text class="mark-all-btn" :class="{ disabled: unreadCount === 0 }" @click="markAllRead">全部已读</text>
          </view>
        </view>
      </view>

      <!-- Tab 切换 -->
      <scroll-view scroll-x class="tab-bar">
        <view class="tab-list">
          <view
            v-for="tab in tabs"
            :key="tab.id"
            class="tab-item"
            :class="{ active: activeTab === tab.id }"
            @click="handleTabChange(tab.id)"
          >
            <text>{{ tab.label }}</text>
          </view>
        </view>
      </scroll-view>

      <!-- Loading -->
      <view v-if="loading" class="loading-state">
        <view v-for="i in 4" :key="i" class="skeleton-card"></view>
      </view>

      <!-- Empty -->
      <view v-else-if="messages.length === 0" class="empty-state">
        <text class="empty-icon">🔔</text>
        <text class="empty-text">{{ activeTab === 'unread' ? '没有未读消息' : '暂无消息' }}</text>
        <text class="empty-sub">{{ activeTab === 'unread' ? '所有消息已阅读' : '顾问团队发送的通知将显示在这里' }}</text>
      </view>

      <!-- List -->
      <view v-else class="msg-list">
        <view
          v-for="msg in messages"
          :key="msg.id"
          class="msg-card"
          :class="{ unread: !msg.isRead }"
          @click="openMessage(msg)"
        >
          <view class="msg-icon-wrap" :class="getTypeColor(msg.type)">
            <text class="msg-type-icon">{{ getTypeIcon(msg.type) }}</text>
          </view>
          <view class="msg-body">
            <view class="msg-top">
              <text class="msg-title" :class="{ bold: !msg.isRead }">{{ msg.title || '无标题' }}</text>
              <text class="msg-time">{{ formatTime(msg.createdAt) }}</text>
            </view>
            <text class="msg-content">{{ msg.content || '无内容' }}</text>
            <view class="msg-footer">
              <text v-if="msg.sender" class="msg-sender">来自: {{ msg.sender.name || '系统' }}</text>
              <text v-if="msg.project" class="msg-project">{{ msg.project.title }}</text>
            </view>
          </view>
          <view v-if="!msg.isRead" class="unread-dot"></view>
        </view>
      </view>

      <!-- 详情弹窗 -->
      <nut-popup v-model:visible="showDetail" position="bottom" round :style="{ height: '70%' }">
        <view class="msg-detail" v-if="selectedMessage">
          <text class="detail-title">{{ selectedMessage.title }}</text>
          <view class="detail-sender-row">
            <view class="sender-avatar">{{ (selectedMessage.sender?.name || '系')[0] }}</view>
            <view class="sender-info">
              <text class="sender-name">{{ selectedMessage.sender?.name || '系统' }}</text>
              <text class="sender-time">{{ formatDateTime(selectedMessage.createdAt) }}</text>
            </view>
            <text class="detail-type-tag">{{ getTypeLabel(selectedMessage.type) }}</text>
          </view>
          <scroll-view scroll-y class="detail-content-scroll">
            <text class="detail-body">{{ selectedMessage.content }}</text>
          </scroll-view>
          <view class="detail-actions">
            <nut-button plain type="danger" size="small" @click="deleteMessage">删除</nut-button>
            <nut-button type="primary" size="small" @click="showDetail = false">关闭</nut-button>
          </view>
        </view>
      </nut-popup>
    </view>
  </base-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { portalApi } from '../../api/portalApi'
import type { PortalMessage } from '@tonghai/shared'

const loading = ref(false)
const activeTab = ref('all')
const messages = ref<PortalMessage[]>([])
const unreadCount = ref(0)
const showDetail = ref(false)
const selectedMessage = ref<PortalMessage | null>(null)

const tabs = [
  { id: 'all', label: '全部' },
  { id: 'unread', label: '未读' },
  { id: 'PROJECT', label: '项目' },
  { id: 'SYSTEM', label: '系统' },
]

onMounted(() => {
  loadMessages()
  loadUnreadCount()
})

async function loadMessages() {
  loading.value = true
  try {
    const params: any = { page: 1, limit: 50 }
    if (activeTab.value === 'unread') params.isRead = false
    else if (['PROJECT', 'SYSTEM', 'DOCUMENT', 'PAYMENT'].includes(activeTab.value)) params.type = activeTab.value
    const res = await portalApi.getMessages(params)
    messages.value = Array.isArray(res) ? res : (res?.data || [])
  } catch {
    uni.showToast({ title: '加载消息失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function loadUnreadCount() {
  try {
    const res = await portalApi.getUnreadCount()
    unreadCount.value = res?.count ?? 0
  } catch { /* ignore */ }
}

function handleTabChange(tabId: string) {
  activeTab.value = tabId
  loadMessages()
}

async function openMessage(msg: PortalMessage) {
  selectedMessage.value = msg
  showDetail.value = true
  if (!msg.isRead) {
    try {
      await portalApi.markMessageAsRead(msg.id)
      msg.isRead = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch { /* ignore */ }
  }
}

async function markAllRead() {
  if (unreadCount.value === 0) return
  try {
    await portalApi.markAllMessagesAsRead()
    messages.value.forEach(m => m.isRead = true)
    unreadCount.value = 0
    uni.showToast({ title: '已全部标为已读', icon: 'success' })
  } catch {
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

async function deleteMessage() {
  if (!selectedMessage.value) return
  uni.showModal({
    title: '确认删除',
    content: '确定删除这条消息吗？',
    success: async (res) => {
      if (res.confirm && selectedMessage.value) {
        try {
          await portalApi.deleteMessage(selectedMessage.value.id)
          messages.value = messages.value.filter(m => m.id !== selectedMessage.value?.id)
          showDetail.value = false
          uni.showToast({ title: '已删除', icon: 'success' })
        } catch {
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    }
  })
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr), now = new Date(), diff = now.getTime() - d.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  return d.toLocaleDateString('zh-CN')
}
function formatDateTime(dateStr: string): string { return new Date(dateStr).toLocaleString('zh-CN') }
function getTypeLabel(t: string): string { return ({ SYSTEM: '系统', PROJECT: '项目', DOCUMENT: '文档', PAYMENT: '付款' } as any)[t] || t }
function getTypeIcon(t: string): string { return ({ SYSTEM: '🔔', PROJECT: '📁', DOCUMENT: '📄', PAYMENT: '💳' } as any)[t] || '💬' }
function getTypeColor(t: string): string { return ({ SYSTEM: 'bg-blue', PROJECT: 'bg-green', DOCUMENT: 'bg-orange', PAYMENT: 'bg-red' } as any)[t] || 'bg-gray' }
</script>

<style lang="scss">
.messages-page { min-height: 100vh; background: #f8fafc; padding: 0 32rpx 120rpx; }
.page-header {
  padding: 40rpx 0 24rpx;
  .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
  .page-title { font-size: 40rpx; font-weight: 700; color: #0f172a; display: block; }
  .page-desc { font-size: 24rpx; color: #64748b; display: block; margin-top: 6rpx; }
  .header-actions { display: flex; align-items: center; gap: 16rpx; }
  .unread-badge { background: #ef4444; width: 40rpx; height: 40rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    .badge-num { color: white; font-size: 20rpx; font-weight: 700; }
  }
  .mark-all-btn { font-size: 24rpx; color: #3b82f6; &.disabled { color: #cbd5e1; } }
}
.tab-bar {
  margin-bottom: 24rpx;
  .tab-list { display: flex; border-bottom: 1px solid #f1f5f9; }
  .tab-item {
    padding: 16rpx 32rpx; font-size: 26rpx; color: #64748b; border-bottom: 2px solid transparent; flex-shrink: 0;
    &.active { color: #3b82f6; border-color: #3b82f6; font-weight: 600; }
  }
}
.loading-state { .skeleton-card { height: 140rpx; background: #e2e8f0; border-radius: 12rpx; margin-bottom: 16rpx; animation: pulse 1.5s infinite; } }
@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
.empty-state { text-align: center; padding: 120rpx 0;
  .empty-icon { font-size: 80rpx; display: block; margin-bottom: 24rpx; }
  .empty-text { font-size: 28rpx; color: #94a3b8; display: block; }
  .empty-sub { font-size: 24rpx; color: #cbd5e1; display: block; margin-top: 12rpx; }
}
.msg-list { .msg-card {
  background: white; border-radius: 16rpx; padding: 28rpx; margin-bottom: 16rpx; display: flex; gap: 20rpx; align-items: flex-start; position: relative;
  box-shadow: 0 1rpx 8rpx rgba(0,0,0,0.03);
  &.unread { background: #eff6ff; border: 1px solid #bfdbfe; }
  .msg-icon-wrap {
    width: 64rpx; height: 64rpx; border-radius: 12rpx; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    &.bg-blue { background: #dbeafe; } &.bg-green { background: #dcfce7; } &.bg-orange { background: #fff7ed; } &.bg-red { background: #fef2f2; } &.bg-gray { background: #f1f5f9; }
    .msg-type-icon { font-size: 28rpx; }
  }
  .msg-body { flex: 1; min-width: 0; }
  .msg-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8rpx; }
  .msg-title { font-size: 28rpx; color: #1e293b; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; &.bold { font-weight: 700; } }
  .msg-time { font-size: 20rpx; color: #94a3b8; flex-shrink: 0; margin-left: 12rpx; }
  .msg-content { font-size: 24rpx; color: #64748b; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 8rpx; }
  .msg-footer { display: flex; gap: 12rpx; align-items: center; }
  .msg-sender { font-size: 22rpx; color: #94a3b8; }
  .msg-project { font-size: 20rpx; color: #64748b; background: #f1f5f9; padding: 2rpx 12rpx; border-radius: 6rpx; }
  .unread-dot { width: 12rpx; height: 12rpx; border-radius: 50%; background: #3b82f6; flex-shrink: 0; margin-top: 10rpx; }
}}
.msg-detail {
  padding: 40rpx; display: flex; flex-direction: column; height: 100%;
  .detail-title { font-size: 36rpx; font-weight: 700; color: #0f172a; margin-bottom: 24rpx; }
  .detail-sender-row { display: flex; align-items: center; gap: 16rpx; padding-bottom: 24rpx; border-bottom: 1px solid #f1f5f9; margin-bottom: 24rpx; }
  .sender-avatar { width: 64rpx; height: 64rpx; border-radius: 50%; background: #3b82f6; color: white; display: flex; align-items: center; justify-content: center; font-size: 28rpx; font-weight: 700; }
  .sender-info { flex: 1; }
  .sender-name { font-size: 28rpx; font-weight: 600; color: #1e293b; display: block; }
  .sender-time { font-size: 22rpx; color: #94a3b8; }
  .detail-type-tag { font-size: 20rpx; color: #64748b; background: #f1f5f9; padding: 4rpx 16rpx; border-radius: 8rpx; }
  .detail-content-scroll { flex: 1; margin-bottom: 24rpx; }
  .detail-body { font-size: 28rpx; color: #334155; line-height: 1.8; white-space: pre-line; }
  .detail-actions { display: flex; gap: 20rpx; justify-content: flex-end; }
}
</style>
