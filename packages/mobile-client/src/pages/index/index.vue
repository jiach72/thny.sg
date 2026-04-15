<template>
  <base-layout>
    <view class="home-page">
      <!-- 顶部欢迎 -->
      <view class="welcome-section">
        <view class="avatar-ring">
          <text class="avatar-letter">{{ userInitial }}</text>
        </view>
        <text class="greeting">{{ greeting }}，{{ authStore.userName || '用户' }}</text>
        <text class="role-badge">{{ authStore.userRole }}</text>
      </view>

      <!-- 数据指示区 -->
      <view v-if="loading" style="padding: 40rpx; text-align: center; color: #94a3b8;">
        <text>安全隧道数据同步中...</text>
      </view>

      <!-- 快捷操作卡片 -->
      <view class="quick-actions" v-else>
        <view class="action-card" @click="navigateTo('/pages/cases/cases')">
          <text class="action-icon">📋</text>
          <text class="action-label" v-if="stats">{{ stats.activeProjects || 0 }} 项并行案件</text>
          <text class="action-label" v-else>业务办理</text>
        </view>
        <view class="action-card" @click="navigateTo('/pages/cases/cases')">
          <text class="action-icon">📄</text>
          <text class="action-label" v-if="stats">{{ stats.pendingDocuments || 0 }} 份待补文件</text>
          <text class="action-label" v-else>合同签署</text>
        </view>
        <view class="action-card" @click="navigateTo('/pages/profile/profile')">
          <text class="action-icon">💳</text>
          <text class="action-label" v-if="stats">{{ stats.unpaidInvoices || 0 }} 笔待付账单</text>
          <text class="action-label" v-else>费用发票</text>
        </view>
      </view>
      
      <!-- 滚动通知 -->
      <view class="notifications-area" v-if="notifications.length > 0" style="margin-bottom: 40rpx;">
        <nut-noticebar :text="notifications[0]?.title || '您的案件有新的进展，请留意查看！'"></nut-noticebar>
      </view>

      <!-- 专业服务目录 -->
      <view class="service-section" v-if="!loading">
        <text class="section-label">专业服务</text>
        <view class="service-grid">
          <view class="service-card" @click="openInquiry('immigration')">
            <view class="service-icon si-green">🌏</view>
            <text class="service-name">移民服务</text>
          </view>
          <view class="service-card" @click="openInquiry('education')">
            <view class="service-icon si-blue">🎓</view>
            <text class="service-name">教育咨询</text>
          </view>
          <view class="service-card" @click="openInquiry('business')">
            <view class="service-icon si-amber">💼</view>
            <text class="service-name">商业服务</text>
          </view>
          <view class="service-card" @click="openInquiry('realestate')">
            <view class="service-icon si-rose">🏛️</view>
            <text class="service-name">房产投资</text>
          </view>
        </view>
      </view>

      <!-- 近期里程碑 -->
      <view class="milestones-section" v-if="milestones.length > 0">
        <text class="section-label">近期关键进度</text>
        <view class="timeline">
          <view v-for="ms in milestones" :key="ms.id" class="timeline-item">
            <view class="timeline-dot"></view>
            <view class="timeline-body">
              <text class="ms-date">{{ formatDate(ms.dueDate) }}</text>
              <text class="ms-title">{{ ms.title }}</text>
              <text class="ms-project" v-if="ms.project?.title">{{ ms.project.title }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 专属顾问 -->
      <view class="consultant-section" v-if="consultant && !loading">
        <text class="section-label">您的专属顾问</text>
        <view class="consultant-card">
          <view class="c-avatar">{{ (consultant.name || 'C')[0] }}</view>
          <view class="c-info">
            <text class="c-name">{{ consultant.name }}</text>
            <text class="c-title">{{ consultant.title || '高级顾问' }}</text>
            <text class="c-phone" v-if="consultant.contactNumber">📱 {{ consultant.contactNumber }}</text>
          </view>
          <nut-button type="primary" size="mini" @click="openMeetingBooking">预约会议</nut-button>
        </view>
      </view>

      <!-- 咨询弹窗 -->
      <nut-popup v-model:visible="showInquiry" position="bottom" round :style="{ height: '55%' }">
        <view class="inquiry-modal">
          <text class="modal-title">发起{{ inquiryTypeLabel }}咨询</text>
          <view class="field-group">
            <text class="field-label">您的需求描述</text>
            <textarea v-model="inquiryMessage" placeholder="请简要描述您的需求..." class="field-textarea" />
          </view>
          <nut-button type="primary" block :disabled="!inquiryMessage.trim() || submittingInquiry" :loading="submittingInquiry" @click="submitInquiry">
            提交咨询
          </nut-button>
        </view>
      </nut-popup>

      <!-- 会议预约弹窗 -->
      <nut-popup v-model:visible="showMeeting" position="bottom" round :style="{ height: '65%' }">
        <view class="meeting-modal">
          <text class="modal-title">预约顾问会议</text>
          <view class="field-group">
            <text class="field-label">会议主题</text>
            <input v-model="meetingForm.title" type="text" placeholder="例: 讨论续签业务细节" class="field-input" />
          </view>
          <view class="field-group">
            <text class="field-label">选择日期</text>
            <picker mode="date" :start="todayStr" @change="onDatePick">
              <view class="picker-display">{{ meetingForm.date || '请选择日期' }}</view>
            </picker>
          </view>
          <view class="field-group">
            <text class="field-label">选择时段</text>
            <view class="time-slots">
              <text v-for="slot in timeSlots" :key="slot" class="slot-chip" :class="{ active: meetingForm.timeSlot === slot }" @click="meetingForm.timeSlot = slot">{{ slot }}</text>
            </view>
          </view>
          <nut-button type="primary" block :disabled="!meetingForm.title.trim() || !meetingForm.date || !meetingForm.timeSlot || submittingMeeting" :loading="submittingMeeting" @click="submitMeeting">
            提交预约
          </nut-button>
        </view>
      </nut-popup>

      <!-- Onboarding 首次登录向导 -->
      <nut-popup v-model:visible="showOnboarding" position="center" round :close-on-click-overlay="false" :style="{ width: '85%', borderRadius: '32rpx' }">
        <view class="onboarding-modal">
          <view class="ob-icon">🌏</view>
          <text class="ob-title">欢迎入驻通海南洋</text>
          <text class="ob-desc">这是为您专属辟出的数字空间。在这里，您可以全天候检阅业务进程、下载档案、签批文件，以及预约专家顾问团队的面谈。</text>
          <view class="ob-steps">
            <view class="ob-step active"></view>
            <view class="ob-step"></view>
            <view class="ob-step"></view>
          </view>
          <nut-button type="primary" block @click="finishOnboarding" style="margin-top: 32rpx;">现在开始探索</nut-button>
        </view>
      </nut-popup>
    </view>
  </base-layout>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useAuthStore } from '../../stores/auth'
import { portalApi } from '../../api/portalApi'
import type { PortalDashboardStats, Milestone, ConsultantInfo } from '@tonghai/shared'

const authStore = useAuthStore()
const stats = ref<PortalDashboardStats | null>(null)
const notifications = ref<any[]>([])
const milestones = ref<Milestone[]>([])
const consultant = ref<ConsultantInfo | null>(null)
const loading = ref(false)

const showInquiry = ref(false)
const inquiryType = ref('')
const inquiryMessage = ref('')
const submittingInquiry = ref(false)

const showMeeting = ref(false)
const submittingMeeting = ref(false)
const meetingForm = reactive({ title: '', date: '', timeSlot: '' })
const timeSlots = ['09:00', '10:30', '14:00', '15:30', '17:00']
const todayStr = new Date().toISOString().split('T')[0]

const showOnboarding = ref(false)

const typeLabels: Record<string, string> = {
  immigration: '移民', education: '教育', business: '商业', realestate: '房产',
}
const inquiryTypeLabel = computed(() => typeLabels[inquiryType.value] || '服务')

onShow(async () => {
  authStore.init()
  if (!authStore.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/login' })
    return
  }
  loading.value = true
  try {
    await authStore.fetchMe()
    const [statsRes, notifRes] = await Promise.all([
      portalApi.getDashboardStats(),
      portalApi.getNotifications()
    ])
    stats.value = statsRes ?? null
    notifications.value = Array.isArray(notifRes) ? notifRes : ((notifRes as any)?.data || [])
    if (statsRes?.upcomingMilestones) {
      milestones.value = statsRes.upcomingMilestones
    }
    if (statsRes?.consultant) {
      consultant.value = statsRes.consultant
    }
    checkOnboarding()
  } catch(e) {
    console.error('Home dashboard fetch error', e)
  } finally {
    loading.value = false
  }
})

const userInitial = computed(() => (authStore.userName || 'U').charAt(0).toUpperCase())
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

function navigateTo(url: string) { uni.switchTab({ url }) }

function formatDate(d: string | Date): string {
  if (!d) return '-'
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

function openInquiry(type: string) {
  inquiryType.value = type
  inquiryMessage.value = ''
  showInquiry.value = true
}

async function submitInquiry() {
  if (!inquiryMessage.value.trim()) return
  submittingInquiry.value = true
  try {
    await portalApi.createInquiry({ serviceType: inquiryType.value.toUpperCase(), message: inquiryMessage.value })
    uni.showToast({ title: '咨询已提交', icon: 'success' })
    showInquiry.value = false
  } catch {
    uni.showToast({ title: '提交失败', icon: 'none' })
  } finally {
    submittingInquiry.value = false
  }
}

function openMeetingBooking() {
  meetingForm.title = ''
  meetingForm.date = ''
  meetingForm.timeSlot = '10:30'
  showMeeting.value = true
}

function onDatePick(e: any) {
  meetingForm.date = e.detail.value
}

async function submitMeeting() {
  if (!meetingForm.title.trim() || !meetingForm.date || !meetingForm.timeSlot) return
  const [hours, minutes] = meetingForm.timeSlot.split(':').map(Number)
  const startTime = new Date(meetingForm.date)
  startTime.setHours(hours, minutes, 0, 0)
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)

  submittingMeeting.value = true
  try {
    await portalApi.bookAppointment({
      title: meetingForm.title,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      userId: consultant.value?.id || '',
    })
    uni.showToast({ title: '预约已提交', icon: 'success' })
    showMeeting.value = false
  } catch {
    uni.showToast({ title: '预约失败', icon: 'none' })
  } finally {
    submittingMeeting.value = false
  }
}

function checkOnboarding() {
  const hasSeen = uni.getStorageSync('thny_onboarding_seen')
  if (!hasSeen && (!stats.value || stats.value.activeProjects === 0)) {
    showOnboarding.value = true
  }
}

function finishOnboarding() {
  uni.setStorageSync('thny_onboarding_seen', 'true')
  showOnboarding.value = false
}
</script>

<style lang="scss">
.home-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 0 32rpx;
}

.welcome-section {
  padding-top: 120rpx;
  padding-bottom: 64rpx;
  display: flex;
  flex-direction: column;
  align-items: center;

  .avatar-ring {
    width: 128rpx;
    height: 128rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24rpx;
    box-shadow: 0 8rpx 24rpx rgba(59, 130, 246, 0.3);
  }

  .avatar-letter {
    font-size: 48rpx;
    font-weight: 700;
    color: white;
  }

  .greeting {
    font-size: 40rpx;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 12rpx;
  }

  .role-badge {
    font-size: 24rpx;
    color: #64748b;
    background: #e2e8f0;
    padding: 6rpx 24rpx;
    border-radius: 20rpx;
  }
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24rpx;
  margin-bottom: 64rpx;

  .action-card {
    background: white;
    border-radius: 24rpx;
    padding: 40rpx 24rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
    transition: transform 0.2s;

    &:active {
      transform: scale(0.96);
    }
  }

  .action-icon {
    font-size: 48rpx;
  }

  .action-label {
    font-size: 28rpx;
    font-weight: 500;
    color: #334155;
  }
}

.logout-section {
  padding: 0 32rpx 80rpx;
}

.section-label {
  font-size: 26rpx; font-weight: 700; color: #64748b; text-transform: uppercase;
  letter-spacing: 2rpx; display: block; margin-bottom: 24rpx;
}

.service-section { margin-bottom: 48rpx; }
.service-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20rpx; }
.service-card {
  background: white; border-radius: 20rpx; padding: 28rpx 16rpx;
  display: flex; flex-direction: column; align-items: center; gap: 12rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04); transition: transform 0.2s;
  &:active { transform: scale(0.96); }
}
.service-icon {
  width: 72rpx; height: 72rpx; border-radius: 50%; display: flex;
  align-items: center; justify-content: center; font-size: 32rpx;
  &.si-green { background: #dcfce7; }
  &.si-blue { background: #dbeafe; }
  &.si-amber { background: #fef3c7; }
  &.si-rose { background: #ffe4e6; }
}
.service-name { font-size: 22rpx; font-weight: 600; color: #334155; text-align: center; }

.milestones-section { margin-bottom: 64rpx; }
.timeline { border-left: 4rpx solid #e2e8f0; margin-left: 16rpx; padding-left: 32rpx; }
.timeline-item { position: relative; padding-bottom: 32rpx; }
.timeline-dot {
  position: absolute; left: -42rpx; top: 8rpx; width: 20rpx; height: 20rpx;
  border-radius: 50%; background: #3b82f6; border: 4rpx solid white;
  box-shadow: 0 0 0 4rpx rgba(59, 130, 246, 0.2);
}
.timeline-body { display: flex; flex-direction: column; gap: 4rpx; }
.ms-date { font-size: 22rpx; color: #3b82f6; font-weight: 600; }
.ms-title { font-size: 28rpx; color: #1e293b; font-weight: 500; }
.ms-project { font-size: 22rpx; color: #94a3b8; }

.inquiry-modal {
  padding: 40rpx; display: flex; flex-direction: column; gap: 24rpx;
  .modal-title { font-size: 36rpx; font-weight: 700; color: #0f172a; text-align: center; }
  .field-group { display: flex; flex-direction: column; }
  .field-label { font-size: 24rpx; color: #64748b; margin-bottom: 8rpx; }
  .field-textarea {
    width: 100%; height: 200rpx; background: #f8fafc; border: 1px solid #e2e8f0;
    border-radius: 12rpx; padding: 20rpx; font-size: 28rpx; color: #1e293b; box-sizing: border-box;
  }
}

.consultant-section { margin-bottom: 48rpx; }
.consultant-card {
  background: white; border-radius: 20rpx; padding: 32rpx; display: flex; align-items: center; gap: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}
.c-avatar {
  width: 88rpx; height: 88rpx; border-radius: 50%;
  background: linear-gradient(135deg, #1e293b, #334155);
  color: white; font-size: 36rpx; font-weight: 700;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.c-info { flex: 1; display: flex; flex-direction: column; gap: 4rpx; }
.c-name { font-size: 30rpx; font-weight: 700; color: #0f172a; }
.c-title { font-size: 22rpx; color: #94a3b8; }
.c-phone { font-size: 24rpx; color: #3b82f6; margin-top: 4rpx; }

.meeting-modal {
  padding: 40rpx; display: flex; flex-direction: column; gap: 24rpx;
  .modal-title { font-size: 36rpx; font-weight: 700; color: #0f172a; text-align: center; }
  .field-group { display: flex; flex-direction: column; }
  .field-label { font-size: 24rpx; color: #64748b; margin-bottom: 8rpx; }
  .field-input {
    width: 100%; height: 80rpx; background: #f8fafc; border: 1px solid #e2e8f0;
    border-radius: 12rpx; padding: 0 24rpx; font-size: 28rpx; color: #1e293b; box-sizing: border-box;
  }
  .picker-display {
    height: 80rpx; line-height: 80rpx; background: #f8fafc; border: 1px solid #e2e8f0;
    border-radius: 12rpx; padding: 0 24rpx; font-size: 28rpx; color: #1e293b;
  }
  .time-slots { display: flex; flex-wrap: wrap; gap: 12rpx; }
  .slot-chip {
    padding: 12rpx 32rpx; border: 1px solid #e2e8f0; border-radius: 32rpx;
    font-size: 26rpx; color: #64748b;
    &.active { background: #eff6ff; color: #3b82f6; border-color: #93c5fd; font-weight: 600; }
  }
}

.onboarding-modal {
  padding: 48rpx 40rpx; display: flex; flex-direction: column; align-items: center; text-align: center;
  .ob-icon { font-size: 80rpx; margin-bottom: 24rpx; }
  .ob-title { font-size: 40rpx; font-weight: 800; color: #0f172a; margin-bottom: 16rpx; }
  .ob-desc { font-size: 26rpx; color: #64748b; line-height: 1.7; margin-bottom: 32rpx; }
  .ob-steps { display: flex; gap: 12rpx; }
  .ob-step {
    width: 24rpx; height: 8rpx; border-radius: 4rpx; background: #e2e8f0;
    &.active { width: 48rpx; background: linear-gradient(90deg, #3b82f6, #8b5cf6); }
  }
}
</style>
