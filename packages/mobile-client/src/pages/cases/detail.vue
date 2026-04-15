<template>
  <base-layout>
    <view class="detail-page" v-if="project">
      <!-- 项目头部 -->
      <view class="project-hero">
        <view class="hero-badges" v-if="project.projectType">
          <text class="type-badge">{{ getTypeLabel(project.projectType) }}</text>
          <text class="status-badge" :class="getStatusCls(project.status)">{{ getStatusLabel(project.status) }}</text>
        </view>
        <text class="hero-title">{{ project.title || '服务项目' }}</text>
        <view class="hero-meta">
          <text v-if="project.startDate" class="meta-item">📅 {{ formatDate(project.startDate) }}</text>
          <text v-if="project.estimatedEndDate" class="meta-item">⏰ 预计 {{ formatDate(project.estimatedEndDate) }}</text>
        </view>
        <nut-button type="primary" size="small" @click="showContactSheet = true">联系团队</nut-button>
      </view>

      <!-- 流程时间线 -->
      <view class="timeline-section" v-if="steps.length > 0">
        <text class="section-title">案例时间线</text>
        <view class="timeline">
          <view v-for="(step, idx) in steps" :key="step.id" class="timeline-item" :class="step.status">
            <view class="timeline-dot"></view>
            <view class="timeline-line" v-if="Number(idx) < steps.length - 1"></view>
            <view class="timeline-content">
              <text class="step-title">{{ step.title }}</text>
              <text class="step-date" v-if="step.date">{{ step.date }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 项目文档 -->
      <view class="docs-section">
        <text class="section-title">项目文档</text>
        <view v-if="project.documents && project.documents.length > 0" class="doc-list">
          <view v-for="doc in project.documents" :key="doc.id" class="doc-row">
            <view class="doc-row-info">
              <text class="doc-row-icon">📄</text>
              <view>
                <text class="doc-row-name">{{ doc.fileName }}</text>
                <text class="doc-row-date">{{ formatDate(doc.createdAt) }}</text>
              </view>
            </view>
            <text class="doc-download" @click="downloadDoc(doc)">下载</text>
          </view>
        </view>
        <view v-else class="empty-docs">
          <text class="empty-text">暂无文档</text>
        </view>
        <nut-button plain size="small" block @click="goDocuments" style="margin-top: 16rpx;">前往安全保险库 →</nut-button>
      </view>

      <!-- 顾问信息 -->
      <view class="consultant-section" v-if="project.consultant">
        <text class="section-title">首席顾问</text>
        <view class="consultant-card">
          <view class="consultant-avatar">{{ (project.consultant.name || 'C')[0] }}</view>
          <view class="consultant-info">
            <text class="consultant-name">{{ project.consultant.name }}</text>
            <text class="consultant-role">项目负责人</text>
          </view>
        </view>
      </view>

      <!-- 联系弹窗 -->
      <nut-popup v-model:visible="showContactSheet" position="bottom" round :style="{ height: '50%' }">
        <view class="contact-modal">
          <text class="modal-title">联系服务团队</text>
          <view class="form-group">
            <text class="form-label">主题</text>
            <input v-model="contactForm.title" type="text" placeholder="请输入主题" class="form-input" />
          </view>
          <view class="form-group">
            <text class="form-label">内容</text>
            <textarea v-model="contactForm.content" placeholder="请描述您的问题..." class="form-textarea" />
          </view>
          <nut-button type="primary" block :disabled="submitting || !contactForm.title || !contactForm.content" @click="submitContact">
            {{ submitting ? '发送中...' : '发送消息' }}
          </nut-button>
        </view>
      </nut-popup>
    </view>

    <!-- Loading -->
    <view v-else class="loading-page">
      <text class="loading-text">正在加载项目...</text>
    </view>
  </base-layout>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { portalApi, documentApi } from '../../api/portalApi'
import type { PortalProject } from '@tonghai/shared'

const project = ref<PortalProject | null>(null)
const showContactSheet = ref(false)
const submitting = ref(false)
const contactForm = reactive({ title: '', content: '' })

onLoad(async (options: any) => {
  const projectId = options?.id
  if (!projectId) { uni.navigateBack(); return }
  try {
    project.value = await portalApi.getProjectById(projectId)
  } catch {
    uni.showToast({ title: '加载项目失败', icon: 'none' })
  }
})

const steps = computed(() => {
  if (!project.value?.tasks) return []
  return project.value.tasks.map((t: any) => ({
    id: t.id,
    title: t.title,
    status: t.status === 'DONE' ? 'completed' : t.status === 'IN_PROGRESS' ? 'current' : 'pending',
    date: t.completedAt ? formatDate(t.completedAt) : (t.dueDate ? `截止 ${formatDate(t.dueDate)}` : ''),
  }))
})

async function downloadDoc(doc: any) {
  try {
    await documentApi.downloadDocument(doc.id)
    uni.showToast({ title: '下载请求已发起', icon: 'success' })
  } catch {
    uni.showToast({ title: '下载失败', icon: 'none' })
  }
}

function goDocuments() {
  uni.navigateTo({ url: '/pages/documents/documents' })
}

async function submitContact() {
  if (!contactForm.title || !contactForm.content) return
  submitting.value = true
  try {
    await portalApi.createInquiry({ serviceType: 'PROJECT_INQUIRY', message: contactForm.title + '\n' + contactForm.content })
    uni.showToast({ title: '消息已发送', icon: 'success' })
    showContactSheet.value = false
    contactForm.title = ''
    contactForm.content = ''
  } catch {
    uni.showToast({ title: '发送失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

function getTypeLabel(t: string): string { return ({ IMMIGRATION: '移民', EDUCATION: '教育', BUSINESS: '商业', REALESTATE: '房产' } as any)[t] || t || '服务' }
function getStatusLabel(s: string): string { return ({ ACTIVE: '进行中', COMPLETED: '已完成', PENDING: '待处理', ON_HOLD: '暂停' } as any)[s] || s }
function getStatusCls(s: string): string {
  if (s === 'COMPLETED') return 'st-done'
  if (s === 'ACTIVE' || s === 'IN_PROGRESS') return 'st-active'
  return 'st-pending'
}
function formatDate(d: string): string { if (!d) return '-'; return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }) }
</script>

<style lang="scss">
.detail-page { min-height: 100vh; background: #f8fafc; padding: 0 32rpx 120rpx; }
.loading-page { display: flex; align-items: center; justify-content: center; min-height: 60vh;
  .loading-text { font-size: 28rpx; color: #94a3b8; }
}
.project-hero {
  background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 20rpx; padding: 40rpx; margin: 32rpx 0;
  .hero-badges { display: flex; gap: 12rpx; margin-bottom: 16rpx; }
  .type-badge { font-size: 20rpx; color: #94a3b8; background: rgba(255,255,255,0.1); padding: 4rpx 16rpx; border-radius: 8rpx; }
  .status-badge {
    font-size: 20rpx; font-weight: 700; padding: 4rpx 16rpx; border-radius: 8rpx;
    &.st-done { background: rgba(34,197,94,0.2); color: #4ade80; }
    &.st-active { background: rgba(59,130,246,0.2); color: #60a5fa; }
    &.st-pending { background: rgba(245,158,11,0.2); color: #fbbf24; }
  }
  .hero-title { font-size: 36rpx; font-weight: 700; color: white; display: block; margin-bottom: 12rpx; }
  .hero-meta { display: flex; gap: 24rpx; margin-bottom: 24rpx; .meta-item { font-size: 22rpx; color: #94a3b8; } }
}
.section-title { font-size: 32rpx; font-weight: 700; color: #1e293b; display: block; margin-bottom: 24rpx; }
.timeline-section { margin-bottom: 40rpx; }
.timeline {
  .timeline-item {
    display: flex; gap: 20rpx; position: relative; padding-bottom: 32rpx;
    &.completed .timeline-dot { background: #22c55e; }
    &.current .timeline-dot { background: #3b82f6; box-shadow: 0 0 0 4rpx rgba(59,130,246,0.3); }
    &.pending .timeline-dot { background: #cbd5e1; }
  }
  .timeline-dot { width: 20rpx; height: 20rpx; border-radius: 50%; flex-shrink: 0; margin-top: 6rpx; }
  .timeline-line { position: absolute; left: 9rpx; top: 28rpx; bottom: 0; width: 2rpx; background: #e2e8f0; }
  .timeline-content { flex: 1; }
  .step-title { font-size: 28rpx; color: #1e293b; font-weight: 500; display: block; }
  .step-date { font-size: 22rpx; color: #94a3b8; display: block; margin-top: 4rpx; }
}
.docs-section { margin-bottom: 40rpx; }
.doc-list { .doc-row {
  display: flex; justify-content: space-between; align-items: center; padding: 20rpx; background: white; border-radius: 12rpx; margin-bottom: 12rpx;
  .doc-row-info { display: flex; align-items: center; gap: 16rpx; flex: 1; min-width: 0; }
  .doc-row-icon { font-size: 32rpx; }
  .doc-row-name { font-size: 26rpx; color: #1e293b; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .doc-row-date { font-size: 20rpx; color: #94a3b8; }
  .doc-download { font-size: 24rpx; color: #3b82f6; font-weight: 600; flex-shrink: 0; }
}}
.empty-docs { padding: 40rpx; text-align: center; background: white; border-radius: 12rpx; .empty-text { font-size: 26rpx; color: #94a3b8; } }
.consultant-section { margin-bottom: 40rpx; }
.consultant-card {
  background: white; padding: 32rpx; border-radius: 16rpx; display: flex; align-items: center; gap: 20rpx;
  .consultant-avatar { width: 80rpx; height: 80rpx; border-radius: 50%; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; display: flex; align-items: center; justify-content: center; font-size: 32rpx; font-weight: 700; }
  .consultant-name { font-size: 30rpx; font-weight: 600; color: #1e293b; display: block; }
  .consultant-role { font-size: 22rpx; color: #64748b; }
}
.contact-modal {
  padding: 40rpx; display: flex; flex-direction: column; gap: 24rpx;
  .modal-title { font-size: 36rpx; font-weight: 700; color: #0f172a; text-align: center; }
  .form-group { .form-label { font-size: 24rpx; color: #64748b; display: block; margin-bottom: 8rpx; } }
  .form-input { width: 100%; border: 1px solid #e2e8f0; border-radius: 12rpx; padding: 20rpx; font-size: 28rpx; }
  .form-textarea { width: 100%; border: 1px solid #e2e8f0; border-radius: 12rpx; padding: 20rpx; font-size: 28rpx; height: 200rpx; }
}
</style>
