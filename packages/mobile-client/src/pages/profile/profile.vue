<template>
  <base-layout>
    <view class="profile-page">
      <!-- 个人信息头 -->
      <view class="user-header">
        <view class="avatar" v-if="!loading">{{ userInitial }}</view>
        <view class="avatar skeleton" v-else></view>

        <view class="info" v-if="!loading">
          <text class="name">{{ authStore.userName || '匿名访客' }}</text>
          <text class="email">{{ authStore.user?.email || '暂无邮箱档案' }}</text>
        </view>
        <view class="info" v-else>
           <view style="width: 150rpx; height: 40rpx; background: #e2e8f0; border-radius: 8rpx; margin-bottom: 8rpx;"></view>
           <view style="width: 250rpx; height: 30rpx; background: #f1f5f9; border-radius: 8rpx;"></view>
        </view>
      </view>

      <!-- 操作列表 -->
      <view class="menu-list">
        <!-- 账单记录 (外接 Backend count) -->
        <nut-cell 
          title="我的专属账单" 
          sub-title="查看本期服务费历史与待付款项" 
          is-link 
          icon="bill"
          @click="goTo('/pages/invoices/invoices')"
        >
          <template #link>
            <text class="badge primary" v-if="invoiceCount > 0">{{ invoiceCount }} 笔待处理</text>
            <text class="badge" v-else style="background: #f1f5f9; color: #64748b;">全部缴清</text>
          </template>
        </nut-cell>
        
        <nut-cell title="我的文档" sub-title="管理专属文件并处理待签项目" is-link icon="order" @click="goTo('/pages/documents/documents')"></nut-cell>
        <nut-cell title="消息中心" sub-title="来自顾问团队的通知" is-link icon="comment" @click="goTo('/pages/messages/messages')"></nut-cell>
        <nut-cell title="帮助与支持" sub-title="浏览知识库或寻求协助" is-link icon="ask" @click="goTo('/pages/help/help')"></nut-cell>
        <nut-cell title="应用设置" sub-title="外观、语言与安全偏好" is-link icon="setting" @click="goTo('/pages/settings/settings')"></nut-cell>
      </view>
      
      <!-- 登出区 -->
      <view class="logout-zone">
        <nut-button shape="round" block plain type="danger" @click="handleLogout">安全退出设备登录</nut-button>
      </view>
    </view>
  </base-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { invoiceApi } from '../../api/portalApi'

const authStore = useAuthStore()
const showBillModal = ref(false)
const loading = ref(true)
const invoiceCount = ref(0)

const userInitial = computed(() => {
  return (authStore.userName || 'U').charAt(0).toUpperCase()
})

onMounted(async () => {
  try {
    // 拉取最新的 user profile 到 store
    await authStore.fetchMe()
    
    // 拉取用户后台实际账单数
    const invoiceRes = await invoiceApi.getMyInvoices({ limit: 1 })
    if (invoiceRes && invoiceRes.pagination?.total) {
      invoiceCount.value = invoiceRes.pagination.total
    }
  } catch (e) {
    console.error('Failed to sync profile', e)
  } finally {
    loading.value = false
  }
})

const handleLogout = async () => {
  uni.showModal({
    title: '退出登录状态',
    content: '确定退出并断开通海南洋的连接？',
    success: (res) => {
      if(res.confirm) authStore.logout()
    }
  })
}

function goTo(url: string) {
  uni.navigateTo({ url })
}
</script>

<style lang="scss">
.profile-page {
  min-height: 100vh;
  background: #f1f5f9;
  padding-bottom: 240rpx;
}

.user-header {
  padding: 100rpx 48rpx 64rpx;
  background: white;
  display: flex;
  align-items: center;
  gap: 32rpx;
  margin-bottom: 32rpx;

  .avatar {
    width: 140rpx;
    height: 140rpx;
    background: linear-gradient(135deg, #1e293b, #0f172a);
    color: white;
    font-size: 56rpx;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 40rpx;
    box-shadow: 0 12rpx 32rpx rgba(15, 23, 42, 0.25);
  }

  .info {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
    
    .name {
      font-size: 40rpx;
      font-weight: 800;
      color: var(--th-text-main);
    }
    
    .email {
      font-size: 26rpx;
      color: var(--th-text-secondary);
    }
  }
}

.menu-list {
  background: white;
  
  .badge {
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
    padding: 6rpx 16rpx;
    border-radius: 12rpx;
    font-size: 24rpx;
    font-weight: 600;
  }
}

.logout-zone {
  margin-top: 64rpx;
  padding: 0 48rpx;
}

.bill-modal {
  padding: 48rpx;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;

  .modal-title {
    font-size: 36rpx;
    font-weight: bold;
    text-align: center;
    margin-bottom: 48rpx;
    color: var(--th-text-main);
  }

  .bill-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 32rpx;
    padding: 40rpx;
    display: flex;
    flex-direction: column;
    gap: 20rpx;
    margin-bottom: 48rpx;

    .bill-name {
      font-size: 28rpx;
      color: var(--th-text-secondary);
      font-weight: 500;
    }

    .bill-amount {
      font-size: 56rpx;
      font-weight: 800;
      color: #1e293b;
      margin-bottom: 16rpx;
      
      .currency {
        font-size: 32rpx;
        color: #64748b;
      }
    }

    .bill-desc {
      font-size: 26rpx;
      color: #d97706; 
      line-height: 1.8;
      background: #fffbeb;
      padding: 24rpx;
      border-radius: 16rpx;
      border-left: 8rpx solid #f59e0b;
    }
  }
}
</style>
