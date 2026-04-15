<template>
  <base-layout>
    <view class="invoices-page">
      <view class="page-header">
        <text class="page-title">我的账单</text>
        <text class="page-desc">管理您的发票及付款历史</text>
      </view>

      <!-- 筛选标签 -->
      <scroll-view scroll-x class="filter-bar">
        <view class="filter-list">
          <view
            v-for="st in statusOptions"
            :key="st.value"
            class="filter-tag"
            :class="{ active: activeStatus === st.value }"
            @click="setStatus(st.value)"
          >
            <text>{{ st.label }}</text>
          </view>
        </view>
      </scroll-view>

      <!-- Loading -->
      <view v-if="loading" class="loading-state">
        <view v-for="i in 3" :key="i" class="skeleton-card"></view>
      </view>

      <!-- Empty -->
      <view v-else-if="invoices.length === 0" class="empty-state">
        <text class="empty-icon">💳</text>
        <text class="empty-text">暂无相关记录</text>
      </view>

      <!-- List -->
      <view v-else class="invoice-list">
        <view v-for="inv in invoices" :key="inv.id" class="invoice-card" @click="viewDetail(inv)">
          <view class="inv-top">
            <view class="inv-header">
              <text class="inv-number">#{{ inv.invoiceNumber }}</text>
              <text class="inv-status" :class="getStatusCls(inv.status)">{{ getStatusLabel(inv.status) }}</text>
            </view>
            <text class="inv-project">{{ inv.project?.title || '通用账单' }}</text>
          </view>
          <view class="inv-bottom">
            <text class="inv-due">截止: {{ formatDate(inv.dueDate) }}</text>
            <view class="inv-amount-wrap">
              <text class="inv-amount">{{ Number(inv.totalAmount).toLocaleString() }}</text>
              <text class="inv-currency">{{ inv.currency }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 详情弹窗 -->
      <nut-popup v-model:visible="showDetail" position="bottom" round :style="{ height: '65%' }">
        <view class="detail-modal" v-if="currentInvoice">
          <text class="modal-title">账单详情 #{{ currentInvoice.invoiceNumber }}</text>

          <view class="detail-row">
            <view class="detail-left">
              <text class="detail-label">关联项目</text>
              <text class="detail-value">{{ currentInvoice.project?.title || '无' }}</text>
            </view>
            <view class="detail-right">
              <text class="detail-label">应付总额</text>
              <text class="detail-amount">{{ Number(currentInvoice.totalAmount).toLocaleString() }} {{ currentInvoice.currency }}</text>
            </view>
          </view>

          <view v-if="['UNPAID','OVERDUE','PENDING'].includes(currentInvoice.status)" class="payment-notice">
            <text class="notice-title">此账单正在等待付款</text>
            <text class="notice-desc">请通过线下转账或联系客户经理完成付款，付款成功后状态将自动更新。</text>
          </view>

          <view v-if="currentInvoice.payments && currentInvoice.payments.length > 0" class="payment-history">
            <text class="history-title">付款历史</text>
            <view v-for="pay in currentInvoice.payments" :key="pay.id" class="payment-item">
              <text class="pay-date">{{ formatDate(pay.paidAt) }} ({{ pay.method }})</text>
              <text class="pay-amount">+ {{ Number(pay.amount).toLocaleString() }}</text>
            </view>
          </view>

          <nut-button type="primary" block @click="showDetail = false">关闭</nut-button>
        </view>
      </nut-popup>
    </view>
  </base-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { invoiceApi } from '../../api/portalApi'
import type { Invoice } from '@tonghai/shared'

const loading = ref(true)
const invoices = ref<Invoice[]>([])
const activeStatus = ref('')
const showDetail = ref(false)
const currentInvoice = ref<Invoice | null>(null)

const statusOptions = [
  { label: '全部', value: '' },
  { label: '待付款', value: 'PENDING' },
  { label: '部分支付', value: 'PARTIAL' },
  { label: '已完成', value: 'PAID' },
]

onMounted(() => fetchInvoices())

async function fetchInvoices() {
  loading.value = true
  try {
    const res = await invoiceApi.getMyInvoices({ status: activeStatus.value || undefined, limit: 50 })
    invoices.value = Array.isArray(res) ? res : (res?.data || [])
  } catch {
    uni.showToast({ title: '获取账单失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function setStatus(status: string) {
  activeStatus.value = status
  fetchInvoices()
}

async function viewDetail(inv: Invoice) {
  try {
    const detail = await invoiceApi.getInvoiceById(inv.id)
    currentInvoice.value = detail
    showDetail.value = true
  } catch {
    uni.showToast({ title: '获取详情失败', icon: 'none' })
  }
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = { DRAFT: '草稿', PENDING: '待付款', PAID: '已支付', PARTIAL: '部分支付', CANCELLED: '已取消' }
  return map[status] || status
}

function getStatusCls(status: string): string {
  if (status === 'PAID') return 'status-paid'
  if (status === 'PENDING') return 'status-pending'
  if (status === 'CANCELLED') return 'status-cancelled'
  return 'status-other'
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<style lang="scss">
.invoices-page {
  min-height: 100vh; background: #f8fafc; padding: 0 32rpx 120rpx;
}
.page-header {
  padding: 40rpx 0 24rpx;
  .page-title { font-size: 40rpx; font-weight: 700; color: #0f172a; display: block; }
  .page-desc { font-size: 24rpx; color: #64748b; display: block; margin-top: 8rpx; }
}
.filter-bar {
  margin-bottom: 32rpx; white-space: nowrap;
  .filter-list { display: flex; gap: 16rpx; padding: 8rpx 0; }
  .filter-tag {
    padding: 12rpx 32rpx; border-radius: 40rpx; font-size: 26rpx; border: 1px solid #e2e8f0; color: #64748b; flex-shrink: 0;
    &.active { background: #eff6ff; color: #3b82f6; border-color: #93c5fd; font-weight: 600; }
  }
}
.loading-state {
  .skeleton-card { height: 200rpx; background: #e2e8f0; border-radius: 16rpx; margin-bottom: 24rpx; animation: pulse 1.5s infinite; }
}
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
.empty-state {
  text-align: center; padding: 120rpx 0;
  .empty-icon { font-size: 80rpx; display: block; margin-bottom: 24rpx; }
  .empty-text { font-size: 28rpx; color: #94a3b8; }
}
.invoice-list { .invoice-card {
  background: white; border-radius: 20rpx; padding: 32rpx; margin-bottom: 24rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
  .inv-top { margin-bottom: 20rpx; }
  .inv-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8rpx; }
  .inv-number { font-size: 22rpx; color: #94a3b8; text-transform: uppercase; }
  .inv-status {
    font-size: 20rpx; font-weight: 700; padding: 4rpx 16rpx; border-radius: 8rpx;
    &.status-paid { background: #dcfce7; color: #16a34a; }
    &.status-pending { background: #fff7ed; color: #f59e0b; }
    &.status-cancelled { background: #f1f5f9; color: #94a3b8; }
    &.status-other { background: #eff6ff; color: #3b82f6; }
  }
  .inv-project { font-size: 30rpx; font-weight: 600; color: #1e293b; }
  .inv-bottom { display: flex; justify-content: space-between; align-items: flex-end; }
  .inv-due { font-size: 22rpx; color: #94a3b8; }
  .inv-amount-wrap { text-align: right; }
  .inv-amount { font-size: 40rpx; font-weight: 700; color: #0f172a; }
  .inv-currency { font-size: 22rpx; color: #94a3b8; margin-left: 8rpx; }
}}
.detail-modal {
  padding: 40rpx; display: flex; flex-direction: column; gap: 32rpx;
  .modal-title { font-size: 36rpx; font-weight: 700; color: #0f172a; text-align: center; }
  .detail-row { display: flex; justify-content: space-between; padding-bottom: 24rpx; border-bottom: 1px solid #f1f5f9; }
  .detail-label { font-size: 22rpx; color: #94a3b8; display: block; margin-bottom: 4rpx; }
  .detail-value { font-size: 28rpx; color: #1e293b; }
  .detail-amount { font-size: 36rpx; font-weight: 700; color: #3b82f6; }
  .payment-notice { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 16rpx; padding: 24rpx;
    .notice-title { font-size: 26rpx; font-weight: 600; color: #ea580c; display: block; margin-bottom: 8rpx; }
    .notice-desc { font-size: 24rpx; color: #78716c; }
  }
  .payment-history {
    .history-title { font-size: 28rpx; font-weight: 600; color: #1e293b; margin-bottom: 16rpx; display: block; }
    .payment-item { display: flex; justify-content: space-between; padding: 16rpx; background: #f8fafc; border-radius: 12rpx; margin-bottom: 12rpx; }
    .pay-date { font-size: 24rpx; color: #64748b; }
    .pay-amount { font-size: 26rpx; font-weight: 700; color: #16a34a; }
  }
}
</style>
