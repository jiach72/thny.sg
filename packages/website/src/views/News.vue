<template>
  <div class="news-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="container">
        <h1>{{ t('news.title') }}</h1>
        <p class="subtitle">{{ t('news.subtitle') }}</p>
      </div>
    </section>

    <!-- Main Content -->
    <section class="content-section">
      <div class="container">
        <div class="content-grid">
          <!-- 文章列表 -->
          <main class="articles-main">
            <!-- 类型筛选 -->
            <div class="filter-tabs">
              <button 
                :class="['tab', { active: !currentType }]"
                @click="filterByType('')"
              >
                {{ t('news.all') }}
              </button>
              <button 
                :class="['tab', { active: currentType === 'COMPANY' }]"
                @click="filterByType('COMPANY')"
              >
                {{ t('news.company') }}
              </button>
              <button 
                :class="['tab', { active: currentType === 'INDUSTRY' }]"
                @click="filterByType('INDUSTRY')"
              >
                {{ t('news.industry') }}
              </button>
            </div>

            <!-- 加载状态 -->
            <div v-if="loading" class="loading">
              <el-skeleton :rows="5" animated />
            </div>

            <!-- 文章卡片 -->
            <div v-else-if="articles.length > 0" class="articles-grid">
              <article 
                v-for="article in articles" 
                :key="article.id"
                class="article-card"
                @click="goToDetail(article.id)"
              >
                <div class="card-image" v-if="article.coverImage">
                  <img :src="article.coverImage" :alt="article.title" />
                  <span v-if="article.isTop" class="top-badge">{{ t('news.top') }}</span>
                </div>
                <div class="card-content">
                  <div class="card-meta">
                    <span class="type-tag" :class="article.type.toLowerCase()">
                      {{ article.type === 'COMPANY' ? t('news.company') : t('news.industry') }}
                    </span>
                    <span class="date">{{ formatDate(article.publishedAt) }}</span>
                  </div>
                  <h3>{{ article.title }}</h3>
                  <p v-if="article.summary" class="summary">{{ article.summary }}</p>
                  <div class="card-footer">
                    <span class="author" v-if="article.author">{{ article.author }}</span>
                    <span class="views">
                      <el-icon><View /></el-icon>
                      {{ article.viewCount }}
                    </span>
                  </div>
                </div>
              </article>
            </div>

            <!-- 空状态 -->
            <div v-else class="empty-state">
              <el-icon class="empty-icon"><Document /></el-icon>
              <p>{{ t('news.empty') }}</p>
            </div>

            <!-- 分页 -->
            <div v-if="pagination.totalPages > 1" class="pagination">
              <el-pagination
                layout="prev, pager, next"
                :total="pagination.total"
                :page-size="pagination.pageSize"
                :current-page="pagination.page"
                @current-change="handlePageChange"
              />
            </div>
          </main>

          <!-- 侧边栏 -->
          <aside class="sidebar">
            <!-- 热门文章 -->
            <div class="widget">
              <h4>{{ t('news.popular') }}</h4>
              <div class="popular-list">
                <div 
                  v-for="(item, index) in popularArticles" 
                  :key="item.id"
                  class="popular-item"
                  @click="goToDetail(item.id)"
                >
                  <span class="rank" :class="{ top3: index < 3 }">{{ index + 1 }}</span>
                  <span class="title">{{ item.title }}</span>
                </div>
              </div>
            </div>

            <!-- 联系我们 -->
            <div class="widget cta-widget">
              <h4>{{ t('news.needHelp') }}</h4>
              <p>{{ t('news.helpDesc') }}</p>
              <router-link to="/contact" class="cta-btn">
                {{ t('news.contactUs') }}
              </router-link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'
import { useI18n } from 'vue-i18n'
import { View, Document } from '@element-plus/icons-vue'
import apiClient from '../api/apiClient'

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()

useHead({
  title: () => (route.meta.title as string) || '新闻资讯 | 通海南洋',
  meta: [
    { name: 'description', content: () => (route.meta.description as string) || '' },
  ],
})

// 状态
const loading = ref(false)
const articles = ref<any[]>([])
const popularArticles = ref<any[]>([])
const currentType = ref('')

// 分页
const pagination = ref({
  page: 1,
  pageSize: 9,
  total: 0,
  totalPages: 0,
})

// 获取文章列表
async function fetchArticles() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      locale: locale.value === 'en' ? 'en' : 'zh',
    }
    if (currentType.value) {
      params.type = currentType.value
    }

    // apiClient 经过拦截器处理
    // 情况1 (旧后端): 返回 { success: true, data: { articles: [] } }
    // 情况2 (新后端): 返回 { articles: [] } (如果被解包)
    
    // 目前后端是 news.ts，返回 { success: true, data: ... }
    // 拦截器在没有 code 字段时，返回 res -> { success: true, data: ... }
    const response = await apiClient.get('/news', { params })
    
    // 兼容逻辑：检查是否已解包
    // 如果 response 直接包含 articles 数组 (即被解包了且 data 是 object)，或者 response.data 存在
    let resData = response
    if (response.success && response.data) {
       resData = response.data
    } else if (response.articles) {
       // 已经被解包
       resData = response
    }

    // 注意：News.vue 原逻辑是 response.data.data.articles (axios response)
    // Client 拦截器通常返回 response.data。所以这里的 response 已经是 body。
    // 旧后端 body: { success: true, data: { articles: ... } }
    // 所以 response.data.articles 是正确的访问路径。
    
    if (resData && (resData.articles || Array.isArray(resData))) {
       articles.value = resData.articles || []
       pagination.value = { ...pagination.value, ...resData.pagination }
    } else if (response.success) { // Fallback for legacy structure if unwrap logic didn't trigger
       articles.value = response.data?.articles || []
       pagination.value = { ...pagination.value, ...response.data?.pagination }
    }

  } catch (error) {
    console.error('Error fetching articles:', error)
  } finally {
    loading.value = false
  }
}

// 获取热门文章
async function fetchPopular() {
  try {
    const response = await apiClient.get('/news/popular', {
      params: { limit: 5, locale: locale.value === 'en' ? 'en' : 'zh' },
    })
    
    // Logic adapation
    let data = response
    if (response.success && response.data) {
        data = response.data
    }
    
    if (Array.isArray(data)) {
      popularArticles.value = data
    }
  } catch (error) {
    console.error('Error fetching popular:', error)
  }
}

// 类型筛选
function filterByType(type: string) {
  currentType.value = type
  pagination.value.page = 1
  fetchArticles()
}

// 分页
function handlePageChange(page: number) {
  pagination.value.page = page
  fetchArticles()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 跳转详情
function goToDetail(id: string) {
  router.push(`/news/${id}`)
}

// 格式化日期
function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale.value === 'en' ? 'en-US' : 'zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// 监听语言变化
watch(locale, () => {
  fetchArticles()
  fetchPopular()
})

// 初始化
onMounted(() => {
  // 从 URL 获取类型筛选
  if (route.query.type) {
    currentType.value = route.query.type as string
  }
  fetchArticles()
  fetchPopular()
})
</script>

<style scoped>
.news-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Hero */
.hero-section {
  padding: 80px 0 60px;
  background: linear-gradient(135deg, var(--color-primary, #0c4a6e) 0%, var(--color-accent, #0369a1) 100%);
  color: white;
  text-align: center;
}

.hero-section h1 {
  font-size: 48px;
  margin: 0 0 16px;
  font-weight: 700;
}

.hero-section .subtitle {
  font-size: 18px;
  opacity: 0.9;
  margin: 0;
}

/* Content */
.content-section {
  padding: 48px 0 80px;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 40px;
}

/* Filter Tabs */
.filter-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
}

.tab {
  padding: 10px 24px;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  background: white;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab:hover, .tab.active {
  background: var(--color-accent, #0369a1);
  color: white;
  border-color: var(--color-accent, #0369a1);
}

/* Articles Grid */
.articles-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

/* Article Card */
.article-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
}

.article-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
}

.card-image {
  position: relative;
  height: 180px;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.article-card:hover .card-image img {
  transform: scale(1.05);
}

.top-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 4px 12px;
  background: #ef4444;
  color: white;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.card-content {
  padding: 20px;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.type-tag {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.type-tag.company {
  background: #dcfce7;
  color: #16a34a;
}

.type-tag.industry {
  background: #dbeafe;
  color: #2563eb;
}

.date {
  font-size: 13px;
  color: #94a3b8;
}

.card-content h3 {
  margin: 0 0 10px;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.summary {
  margin: 0 0 16px;
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #94a3b8;
}

.views {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #94a3b8;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}

/* Sidebar */
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.widget {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.widget h4 {
  margin: 0 0 20px;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

/* Popular List */
.popular-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.popular-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  transition: color 0.2s;
}

.popular-item:hover {
  color: var(--color-accent, #0369a1);
}

.rank {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  flex-shrink: 0;
}

.rank.top3 {
  background: linear-gradient(135deg, var(--color-accent, #0369a1) 0%, var(--color-primary, #0c4a6e) 100%);
  color: white;
}

.popular-item .title {
  font-size: 14px;
  line-height: 1.5;
  color: #475569;
}

/* CTA Widget */
.cta-widget {
  background: linear-gradient(135deg, var(--color-primary, #0c4a6e) 0%, var(--color-accent, #0369a1) 100%);
  color: white;
}

.cta-widget h4 {
  color: white;
}

.cta-widget p {
  margin: 0 0 16px;
  font-size: 14px;
  opacity: 0.9;
  line-height: 1.6;
}

.cta-btn {
  display: inline-block;
  padding: 12px 24px;
  background: white;
  color: var(--color-primary, #0c4a6e);
  border-radius: 24px;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.2s;
}

.cta-btn:hover {
  transform: scale(1.05);
}

/* Loading */
.loading {
  padding: 40px;
  background: white;
  border-radius: 16px;
}

/* Responsive */
@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .sidebar {
    display: none;
  }
}

@media (max-width: 768px) {
  .hero-section h1 {
    font-size: 32px;
  }
  
  .articles-grid {
    grid-template-columns: 1fr;
  }
  
  .filter-tabs {
    flex-wrap: wrap;
  }
}
</style>
