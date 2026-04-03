<template>
  <base-layout>
    <view class="cases-page">
      <view class="header-card">
        <text class="title">您的业务与案卷柜</text>
        <text class="status-badge" v-if="!loading && currentProject">状态更新：{{ currentProject.status || '无' }}</text>
        <text class="status-badge" v-else>数据安全隧道连接中...</text>
      </view>
      
      <!-- Loading Skeleton -->
      <view v-if="loading" class="loading-state">
        <view class="skeleton-box" style="width: 100%; height: 200rpx; background: #e2e8f0; border-radius: 16rpx; margin-bottom: 24rpx; animation: pulse 1.5s infinite;"></view>
        <view class="skeleton-box" style="width: 100%; height: 200rpx; background: #e2e8f0; border-radius: 16rpx; animation: pulse 1.5s infinite;"></view>
      </view>

      <!-- Accordion Timeline -->
      <view class="accordion-timeline" v-else-if="projects.length > 0">
        <nut-collapse v-model="activeNames" active-icon="down-arrow" icon="right">
          
          <!-- Dynamic Steps from Backend -->
          <nut-collapse-item 
            v-for="(proj, index) in projects" 
            :key="proj.id || index"
            :title="proj.name || '核心案卷'" 
            :name="proj.id || String(index)" 
            class="step step-active"
          >
            <template #title>
              <view class="custom-title">
                <text>{{ proj.name || '项目办理进度' }}</text>
                <text class="badge">{{ proj.status || '受理中' }}</text>
              </view>
            </template>
            <view class="step-content">
              <text class="desc">{{ proj.description || '案件流转进行中，请保持关注或向平台专属顾问发起工单问询。如果需要补充材料，请在此通过上传通道直传底层资料库。' }}</text>
              
              <nut-button size="small" plain type="primary" @click="goDetail(proj)" style="margin-bottom: 24rpx;">查看项目详情 →</nut-button>
              <!-- 待传材料列表 (原生上传模拟点 - 待动态化) -->
              <view class="doc-list">
                <view class="doc-item">
                  <view class="doc-info">
                    <text class="doc-name">通用资料补传口</text>
                    <text class="doc-req">支持 JPG/PDF</text>
                  </view>
                  
                  <nut-uploader :url="uploadUrl" :headers="uploadHeaders" :data="{ projectId: proj.id }" :maximum="1" @success="onUploadSuccess" :auto-upload="true" class="uploader-btn">
                    <nut-button size="small" type="primary" plain>原生选取</nut-button>
                  </nut-uploader>
                </view>
              </view>
            </view>
          </nut-collapse-item>
        </nut-collapse>
      </view>

      <view v-else class="empty-state" style="padding: 100rpx 0; text-align: center; color: #64748b;">
        <text>您当前没有任何流转中的案卷资料。</text>
      </view>
    </view>
  </base-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { portalApi } from '../../api/portalApi'
import { BASE_URL } from '../../utils/request'
import type { PortalProject } from '@tonghai/shared'

const loading = ref(true)
const projects = ref<any[]>([])
const activeNames = ref<string[]>([])

const currentProject = computed(() => projects.value[0] || null)

const uploadUrl = computed(() => `${BASE_URL}/documents/upload`)
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${uni.getStorageSync('accessToken')}`
}))

onMounted(async () => {
  try {
    const res = await portalApi.getMyProjects()
    projects.value = res || []
    if (projects.value.length > 0) {
      activeNames.value = [projects.value[0].id]
    }
  } catch (e) {
    uni.showToast({ title: '由于网络或鉴权原因，未能拉取最新进展', icon: 'none' })
  } finally {
    loading.value = false
  }
})

const onUploadSuccess = () => {
  uni.showToast({ title: '已捕获本地文件并上传', icon: 'success' })
}

function goDetail(proj: any) {
  uni.navigateTo({ url: `/pages/cases/detail?id=${proj.id}` })
}
</script>

<style lang="scss">
.cases-page {
  min-height: 100vh;
  background: var(--th-bg-surface);
  padding: 32rpx;
  padding-bottom: 240rpx; 
}

.header-card {
  background: linear-gradient(135deg, #1e293b, #0f172a);
  border-radius: 32rpx;
  padding: 48rpx 32rpx;
  margin-bottom: 48rpx;
  box-shadow: 0 16rpx 40rpx rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 20rpx;

  .title {
    font-size: 42rpx;
    font-weight: 800;
    color: white;
    letter-spacing: 1rpx;
  }

  .status-badge {
    align-self: flex-start;
    background: rgba(59, 130, 246, 0.15);
    color: #93c5fd;
    padding: 10rpx 24rpx;
    border-radius: 20rpx;
    font-size: 26rpx;
    border: 1px solid rgba(59, 130, 246, 0.2);
  }
}

.accordion-timeline {
  .nut-collapse-item {
    margin-bottom: 24rpx;
    border-radius: 16rpx;
    overflow: hidden;
    box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.03);
  }
  
  .custom-title {
    display: flex;
    align-items: center;
    gap: 16rpx;
    font-weight: bold;
    color: #3b82f6;
    
    .badge {
      font-size: 20rpx;
      padding: 6rpx 12rpx;
      border-radius: 8rpx;
      background: #eff6ff;
    }
  }

  .step-content {
    padding: 16rpx 0;
    
    .desc {
      font-size: 28rpx;
      color: var(--th-text-secondary);
      line-height: 1.6;
      display: block;
      margin-bottom: 32rpx;
    }
  }
}

.doc-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;

  .doc-item {
    background: var(--th-bg-base);
    padding: 24rpx;
    border-radius: 16rpx;
    border: 1px dashed #cbd5e1;
    display: flex;
    justify-content: space-between;
    align-items: center;

    &.uploaded {
      border: 1px solid #10b981;
      background: rgba(16, 185, 129, 0.05);

      .doc-name { color: #10b981; }
      .doc-status { color: #059669; }
    }
  }

  .doc-info {
    display: flex;
    flex-direction: column;
    gap: 10rpx;
    flex: 1;
    padding-right: 24rpx;
  }

  .doc-name {
    font-size: 28rpx;
    font-weight: 600;
    color: var(--th-text-main);
  }

  .doc-req {
    font-size: 24rpx;
    color: #f59e0b;
  }

  .doc-status {
    font-size: 22rpx;
  }

  .check-icon {
    color: #10b981;
    font-size: 36rpx;
    font-weight: bold;
    margin-right: 16rpx;
  }
  
  .uploader-btn {
    flex-shrink: 0;
  }
}
</style>
