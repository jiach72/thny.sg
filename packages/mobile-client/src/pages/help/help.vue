<template>
  <base-layout>
    <view class="help-page">
      <view class="page-header">
        <text class="page-title">帮助与支持</text>
        <text class="page-desc">浏览知识库或寻求直接协助</text>
      </view>

      <!-- 联系顾问卡片 -->
      <view class="contact-card">
        <view class="contact-icon">🎧</view>
        <view class="contact-body">
          <text class="contact-title">需要更多帮助？</text>
          <text class="contact-desc">如果您的问题未在下方得到解答，可以随时向专属团队发起咨询。</text>
          <view class="contact-actions">
            <nut-button size="small" type="primary" @click="goInquiry">发起咨询</nut-button>
          </view>
        </view>
      </view>

      <!-- Loading -->
      <view v-if="loading" class="loading-state">
        <view v-for="i in 3" :key="i" class="skeleton-card"></view>
      </view>

      <!-- Empty -->
      <view v-else-if="categories.length === 0" class="empty-state">
        <text class="empty-text">尚未发布任何支持文章</text>
      </view>

      <!-- FAQ Accordion -->
      <view v-else class="faq-section">
        <view v-for="category in categories" :key="category.id" class="faq-category">
          <text class="cat-title">📖 {{ category.name }}</text>
          <nut-collapse v-model="activeNames">
            <nut-collapse-item
              v-for="item in category.items"
              :key="item.id"
              :title="item.question"
              :name="item.id"
              class="faq-item"
            >
              <view class="faq-answer">
                <text class="answer-text">{{ item.answer }}</text>
                <view class="faq-footer">
                  <text class="view-count">{{ item.viewCount || 0 }} 次浏览</text>
                  <view
                    class="helpful-btn"
                    :class="{ marked: helpfulMarked.includes(item.id) }"
                    @click.stop="markHelpful(item)"
                  >
                    <text>{{ helpfulMarked.includes(item.id) ? '👍 感谢反馈' : '👍 有帮助' }}</text>
                  </view>
                </view>
              </view>
            </nut-collapse-item>
          </nut-collapse>
        </view>
      </view>
    </view>
  </base-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { portalApi } from '../../api/portalApi'
import type { FaqCategory, FaqItem } from '@tonghai/shared'

const loading = ref(true)
const categories = ref<FaqCategory[]>([])
const activeNames = ref<string[]>([])
const helpfulMarked = ref<string[]>([])

onMounted(async () => {
  try {
    const res = await portalApi.getFaqs()
    categories.value = Array.isArray(res) ? res : ((res as any)?.data || [])
  } catch {
    uni.showToast({ title: '加载知识库失败', icon: 'none' })
  } finally {
    loading.value = false
  }
})

async function markHelpful(item: FaqItem) {
  if (helpfulMarked.value.includes(item.id)) return
  try {
    await portalApi.markFaqHelpful(item.id)
    helpfulMarked.value.push(item.id)
  } catch { /* ignore */ }
}

function goInquiry() {
  uni.switchTab({ url: '/pages/profile/profile' })
}
</script>

<style lang="scss">
.help-page { min-height: 100vh; background: #f8fafc; padding: 0 32rpx 120rpx; }
.page-header {
  padding: 40rpx 0 24rpx;
  .page-title { font-size: 40rpx; font-weight: 700; color: #0f172a; display: block; }
  .page-desc { font-size: 24rpx; color: #64748b; display: block; margin-top: 8rpx; }
}
.contact-card {
  background: linear-gradient(135deg, #eff6ff, #f0f9ff); border: 1px solid #bfdbfe; border-radius: 20rpx; padding: 32rpx; display: flex; gap: 24rpx; margin-bottom: 40rpx;
  .contact-icon { font-size: 48rpx; flex-shrink: 0; }
  .contact-body { flex: 1; }
  .contact-title { font-size: 30rpx; font-weight: 700; color: #1e293b; display: block; margin-bottom: 8rpx; }
  .contact-desc { font-size: 24rpx; color: #64748b; display: block; margin-bottom: 16rpx; }
}
.loading-state { .skeleton-card { height: 120rpx; background: #e2e8f0; border-radius: 12rpx; margin-bottom: 16rpx; animation: pulse 1.5s infinite; } }
@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
.empty-state { text-align: center; padding: 120rpx 0; .empty-text { font-size: 28rpx; color: #94a3b8; } }
.faq-section {
  .faq-category { margin-bottom: 48rpx; }
  .cat-title { font-size: 32rpx; font-weight: 700; color: #3b82f6; display: block; margin-bottom: 20rpx; padding-bottom: 12rpx; border-bottom: 1px solid #e2e8f0; }
  .faq-item { margin-bottom: 12rpx; background: white; border-radius: 16rpx; overflow: hidden; }
  .faq-answer { padding: 8rpx 0; }
  .answer-text { font-size: 26rpx; color: #475569; line-height: 1.8; }
  .faq-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; padding-top: 16rpx; border-top: 1px solid #f1f5f9; }
  .view-count { font-size: 22rpx; color: #cbd5e1; }
  .helpful-btn {
    font-size: 22rpx; color: #64748b; padding: 8rpx 20rpx; border: 1px solid #e2e8f0; border-radius: 32rpx;
    &.marked { background: #eff6ff; border-color: #93c5fd; color: #3b82f6; }
  }
}
</style>
