<template>
  <div class="glass-card section-card flex-1">
    <div class="card-header">
      <h3><el-icon><ChatDotRound /></el-icon> 最新咨询</h3>
      <el-button link type="primary" size="small">查看全部</el-button>
    </div>
    <div class="inquiry-list">
      <div v-for="inquiry in inquiries" :key="inquiry.id" class="inquiry-item">
        <div class="inquiry-avatar">
          {{ inquiry.name.charAt(0).toUpperCase() }}
        </div>
        <div class="inquiry-content">
          <div class="inquiry-top">
            <span class="name">{{ inquiry.name }}</span>
            <span class="time">{{ formatTimeAgo(inquiry.createdAt) }}</span>
          </div>
          <p class="message">{{ inquiry.message }}</p>
        </div>
        <el-button circle size="small" :icon="ArrowRight" @click="handleInquiryClick(inquiry)" />
      </div>
      <el-empty v-if="inquiries.length === 0" description="暂无新咨询" :image-size="60" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ChatDotRound, ArrowRight } from '@element-plus/icons-vue'
import { useInquiryStore } from '@/stores'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const inquiryStore = useInquiryStore()
const { inquiries } = storeToRefs(inquiryStore)

const formatTimeAgo = (date: string) => {
  return dayjs(date).fromNow()
}

const handleInquiryClick = (inquiry: any) => {
  console.log('View inquiry', inquiry)
  // TODO: Implement inquiry view logic or emitted event
}
</script>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
}

.section-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.inquiry-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.inquiry-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 12px;
  transition: background 0.2s;
}

.inquiry-item:hover {
  background: rgba(255, 255, 255, 0.6);
}

.inquiry-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e0e7ff;
  color: #4f46e5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.inquiry-content {
  flex: 1;
  min-width: 0;
}

.inquiry-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.inquiry-top .name {
  font-weight: 500;
  color: #1e293b;
}

.inquiry-top .time {
  font-size: 12px;
  color: #94a3b8;
}

.inquiry-content .message {
  font-size: 13px;
  color: #64748b;
  line-height: 1.4;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
