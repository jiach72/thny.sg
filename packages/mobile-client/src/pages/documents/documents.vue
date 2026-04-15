<template>
  <base-layout>
    <view class="documents-page">
      <view class="page-header">
        <text class="page-title">我的文档</text>
        <text class="page-desc">管理专属文件并处理待签项目</text>
      </view>

      <!-- Loading -->
      <view v-if="loading" class="loading-state">
        <view v-for="i in 3" :key="i" class="skeleton-card"></view>
      </view>

      <!-- Empty -->
      <view v-else-if="documents.length === 0" class="empty-state">
        <text class="empty-icon">📂</text>
        <text class="empty-text">您的资料库当前为空</text>
      </view>

      <!-- List -->
      <view v-else class="doc-list">
        <view v-for="doc in documents" :key="doc.id" class="doc-card" @click="viewDoc(doc)">
          <view class="doc-main">
            <view class="doc-icon-wrap">
              <text class="doc-icon">📄</text>
            </view>
            <view class="doc-info">
              <text class="doc-name">{{ doc.fileName }}</text>
              <text class="doc-meta">{{ doc.project?.title || '通用归档' }} · {{ formatSize(doc.fileSize) }}</text>
              <view class="doc-badges">
                <text class="doc-date">{{ formatDate(doc.createdAt) }}</text>
                <text v-if="doc.signatureRequests && doc.signatureRequests.length > 0" class="sign-badge">需要签名</text>
              </view>
            </view>
          </view>
          <view class="doc-actions" @click.stop>
            <nut-button size="small" plain @click="downloadDoc(doc)">下载</nut-button>
            <nut-button v-if="doc.signatureRequests && doc.signatureRequests.length > 0" size="small" type="warning" @click="startSigning(doc)">签署</nut-button>
          </view>
        </view>
      </view>

      <!-- 签章弹窗 -->
      <nut-popup v-model:visible="showSignDialog" position="bottom" round :style="{ height: '50%' }">
        <view class="sign-modal" v-if="currentDoc">
          <text class="modal-title">电子签署确认</text>
          <view class="sign-warning">
            <text class="sign-warn-title">授权签署：{{ currentDoc.fileName }}</text>
            <text class="sign-warn-desc">点击确认等同于您同意文件中所有条款并发起电子签章请求。</text>
          </view>
          <view class="sign-input-area">
            <text class="input-label">请键入您的全名作为签章凭据：</text>
            <input v-model="signatureName" type="text" placeholder="如：John Doe" class="sign-input" />
          </view>
          <nut-button type="primary" block :disabled="isSigning || !signatureName.trim()" @click="submitSignature">
            {{ isSigning ? '提交中...' : '确认签署' }}
          </nut-button>
        </view>
      </nut-popup>
    </view>
  </base-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { portalApi, documentApi } from '../../api/portalApi'
import type { PortalDocument } from '@tonghai/shared'

const loading = ref(true)
const documents = ref<PortalDocument[]>([])
const showSignDialog = ref(false)
const currentDoc = ref<PortalDocument | null>(null)
const signatureName = ref('')
const isSigning = ref(false)

onMounted(() => fetchDocuments())

async function fetchDocuments() {
  loading.value = true
  try {
    const res: any = await portalApi.getMyDocuments({ page: 1, limit: 100 })
    documents.value = Array.isArray(res) ? res : (res?.data || [])
  } catch {
    uni.showToast({ title: '获取档案记录失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function startSigning(doc: PortalDocument) {
  currentDoc.value = doc
  signatureName.value = ''
  showSignDialog.value = true
}

async function submitSignature() {
  if (!signatureName.value.trim() || !currentDoc.value) return
  isSigning.value = true
  try {
    await portalApi.signDocument(currentDoc.value.id, `SIGNED_BY_${signatureName.value.trim().toUpperCase().replace(/\s+/g, '_')}_${Date.now()}`)
    uni.showToast({ title: '签署成功', icon: 'success' })
    showSignDialog.value = false
    fetchDocuments()
  } catch {
    uni.showToast({ title: '签署失败', icon: 'none' })
  } finally {
    isSigning.value = false
  }
}

async function downloadDoc(doc: PortalDocument) {
  uni.showToast({ title: '正在准备下载...', icon: 'none' })
  try {
    await documentApi.downloadDocument(doc.id)
    uni.showToast({ title: '下载请求已发起', icon: 'success' })
  } catch {
    uni.showToast({ title: '下载失败', icon: 'none' })
  }
}

function viewDoc(doc: PortalDocument) {
  downloadDoc(doc)
}

function formatSize(bytes: number): string {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<style lang="scss">
.documents-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 0 32rpx 120rpx;
}
.page-header {
  padding: 40rpx 0 24rpx;
  .page-title { font-size: 40rpx; font-weight: 700; color: #0f172a; display: block; }
  .page-desc { font-size: 24rpx; color: #64748b; display: block; margin-top: 8rpx; }
}
.loading-state {
  .skeleton-card {
    height: 180rpx; background: #e2e8f0; border-radius: 16rpx; margin-bottom: 24rpx;
    animation: pulse 1.5s infinite;
  }
}
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
.empty-state {
  text-align: center; padding: 120rpx 0;
  .empty-icon { font-size: 80rpx; display: block; margin-bottom: 24rpx; }
  .empty-text { font-size: 28rpx; color: #94a3b8; }
}
.doc-list { .doc-card {
  background: white; border-radius: 20rpx; padding: 32rpx; margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
  .doc-main { display: flex; gap: 24rpx; margin-bottom: 20rpx; }
  .doc-icon-wrap { width: 80rpx; height: 80rpx; background: #eff6ff; border-radius: 16rpx; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .doc-icon { font-size: 36rpx; }
  .doc-info { flex: 1; min-width: 0; }
  .doc-name { font-size: 28rpx; font-weight: 600; color: #1e293b; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .doc-meta { font-size: 22rpx; color: #94a3b8; display: block; margin-top: 6rpx; }
  .doc-badges { display: flex; align-items: center; gap: 16rpx; margin-top: 8rpx; }
  .doc-date { font-size: 22rpx; color: #94a3b8; }
  .sign-badge { font-size: 20rpx; color: #f59e0b; background: #fef3c7; padding: 2rpx 12rpx; border-radius: 6rpx; font-weight: 600; }
  .doc-actions { display: flex; gap: 16rpx; justify-content: flex-end; }
}}
.sign-modal {
  padding: 40rpx; display: flex; flex-direction: column; gap: 32rpx;
  .modal-title { font-size: 36rpx; font-weight: 700; color: #0f172a; text-align: center; }
  .sign-warning { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 16rpx; padding: 24rpx;
    .sign-warn-title { font-size: 28rpx; font-weight: 600; color: #ea580c; display: block; margin-bottom: 8rpx; }
    .sign-warn-desc { font-size: 24rpx; color: #78716c; }
  }
  .sign-input-area {
    .input-label { font-size: 24rpx; color: #64748b; display: block; margin-bottom: 12rpx; }
    .sign-input { width: 100%; border: 1px solid #e2e8f0; border-radius: 12rpx; padding: 20rpx; font-size: 28rpx; }
  }
}
</style>
