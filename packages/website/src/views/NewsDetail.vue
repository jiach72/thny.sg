<template>
  <div class="news-detail-page" v-if="article">
    <!-- Breadcrumb -->
    <div class="breadcrumb-bar">
      <div class="container">
        <router-link to="/news">{{ t('news.title') }}</router-link>
        <span class="separator">/</span>
        <span>{{ article.title }}</span>
      </div>
    </div>

    <!-- Article -->
    <article class="article-container">
      <div class="container">
        <div class="article-grid">
          <!-- Main Content -->
          <div class="article-main">
            <!-- Header -->
            <header class="article-header">
              <span class="type-tag" :class="article.type.toLowerCase()">
                {{ article.type === 'COMPANY' ? t('news.company') : t('news.industry') }}
              </span>
              <h1>{{ article.title }}</h1>
              <div class="article-meta">
                <span v-if="article.author" class="author">
                  <el-icon><User /></el-icon>
                  {{ article.author }}
                </span>
                <span class="date">
                  <el-icon><Calendar /></el-icon>
                  {{ formatDate(article.publishedAt) }}
                </span>
                <span class="views">
                  <el-icon><View /></el-icon>
                  {{ article.viewCount }} {{ t('news.views') }}
                </span>
              </div>
            </header>

            <!-- Cover Image -->
            <div v-if="article.coverImage" class="cover-image">
              <img :src="article.coverImage" :alt="article.title" />
            </div>

            <!-- Content -->
            <div class="article-content" v-html="renderedContent"></div>

            <!-- Tags -->
            <div v-if="article.tags && article.tags.length > 0" class="article-tags">
              <span class="tag" v-for="tag in article.tags" :key="tag">{{ tag }}</span>
            </div>

            <!-- Source -->
            <div v-if="article.sourceUrl" class="article-source">
              <span>{{ t('news.source') }}：</span>
              <a :href="article.sourceUrl" target="_blank" rel="noopener">{{ article.sourceUrl }}</a>
            </div>

            <!-- Share -->
            <div class="article-share">
              <span>{{ t('news.share') }}：</span>
              <button @click="copyLink" class="share-btn">
                <el-icon><Link /></el-icon>
              </button>
            </div>

            <!-- Navigation -->
            <div class="article-nav">
              <router-link to="/news" class="back-btn">
                <el-icon><ArrowLeft /></el-icon>
                {{ t('news.backToList') }}
              </router-link>
            </div>
          </div>

          <!-- Sidebar -->
          <aside class="article-sidebar">
            <div class="widget">
              <h4>{{ t('news.popular') }}</h4>
              <div class="popular-list">
                <div 
                  v-for="(item, index) in popularArticles" 
                  :key="item.id"
                  class="popular-item"
                  @click="goToArticle(item.id)"
                >
                  <span class="rank" :class="{ top3: index < 3 }">{{ index + 1 }}</span>
                  <span class="title">{{ item.title }}</span>
                </div>
              </div>
            </div>

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
    </article>
  </div>

  <!-- Loading -->
  <div v-else-if="loading" class="loading-page">
    <el-skeleton :rows="10" animated />
  </div>

  <!-- Not Found -->
  <div v-else class="not-found-page">
    <div class="container">
      <el-icon class="not-found-icon"><Document /></el-icon>
      <h2>{{ t('news.notFound') }}</h2>
      <router-link to="/news" class="back-btn">{{ t('news.backToList') }}</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { User, Calendar, View, ArrowLeft, Link, Document } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import apiClient from '../api/apiClient'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()

// 状态
const loading = ref(true)
const article = ref<any>(null)
const popularArticles = ref<any[]>([])

// 渲染内容（简单转换换行）
const renderedContent = computed(() => {
  if (!article.value?.content) return ''
  return article.value.content
    .replace(/\n/g, '<br/>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
})

// 获取文章详情
async function fetchArticle() {
  const id = route.params.id as string
  loading.value = true
  try {
    // apiClient 返回 Response Body
    // 旧后端: { success: true, data: article }
    // 新后端(解包后): article
    const response = await apiClient.get(`/news/${id}`, {
      params: { locale: locale.value === 'en' ? 'en' : 'zh' },
    })
    
    // 兼容逻辑
    if (response.success && response.data) {
       article.value = response.data
    } else if (response.title) { 
       // 假设解包后的 article 对象有 title 字段
       article.value = response
    } else {
       article.value = null
    }

  } catch (error) {
    console.error('Error fetching article:', error)
    article.value = null
  } finally {
    loading.value = false
  }
}

// 获取热门文章
async function fetchPopular() {
  try {
    const response = await apiClient.get('/news/popular', {
      params: { limit: 5, locale: locale.value === 'en' ? 'en' : 'zh' },
    }) as any
    
    // 兼容逻辑
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

// 跳转文章
function goToArticle(id: string) {
  router.push(`/news/${id}`)
}

// 复制链接
function copyLink() {
  navigator.clipboard.writeText(window.location.href)
  ElMessage.success(t('news.linkCopied'))
}

// 格式化日期
function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale.value === 'en' ? 'en-US' : 'zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// 监听路由变化
watch(() => route.params.id, fetchArticle)

// 初始化
onMounted(() => {
  fetchArticle()
  fetchPopular()
})
</script>

<style scoped>
.news-detail-page {
  min-height: 100vh;
  background: #f8fafc;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Breadcrumb */
.breadcrumb-bar {
  padding: 16px 0;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  font-size: 14px;
}

.breadcrumb-bar a {
  color: var(--color-accent, #0369a1);
  text-decoration: none;
}

.breadcrumb-bar .separator {
  margin: 0 8px;
  color: #94a3b8;
}

.breadcrumb-bar span:last-child {
  color: #64748b;
}

/* Article Container */
.article-container {
  padding: 48px 0 80px;
}

.article-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 40px;
}

.article-main {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* Header */
.article-header {
  margin-bottom: 32px;
}

.type-tag {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 16px;
}

.type-tag.company {
  background: #dcfce7;
  color: #16a34a;
}

.type-tag.industry {
  background: #dbeafe;
  color: #2563eb;
}

.article-header h1 {
  margin: 0 0 20px;
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.3;
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  color: #64748b;
  font-size: 14px;
}

.article-meta span {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Cover Image */
.cover-image {
  margin-bottom: 32px;
  border-radius: 12px;
  overflow: hidden;
}

.cover-image img {
  width: 100%;
  max-height: 400px;
  object-fit: cover;
}

/* Content */
.article-content {
  font-size: 16px;
  line-height: 1.8;
  color: #334155;
  margin-bottom: 32px;
}

.article-content :deep(p) {
  margin-bottom: 16px;
}

.article-content :deep(h2) {
  font-size: 24px;
  margin: 32px 0 16px;
}

.article-content :deep(h3) {
  font-size: 20px;
  margin: 24px 0 12px;
}

/* Tags */
.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}

.tag {
  padding: 6px 14px;
  background: #f1f5f9;
  border-radius: 14px;
  font-size: 13px;
  color: #475569;
}

/* Source */
.article-source {
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 24px;
  word-break: break-all;
}

.article-source a {
  color: var(--color-accent, #0369a1);
}

/* Share */
.article-share {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 0;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 24px;
}

.share-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid #e2e8f0;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.share-btn:hover {
  background: var(--color-accent, #0369a1);
  color: white;
  border-color: var(--color-accent, #0369a1);
}

/* Navigation */
.article-nav {
  margin-top: 24px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #f1f5f9;
  border-radius: 8px;
  color: #475569;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #e2e8f0;
}

/* Sidebar */
.article-sidebar {
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
}

.popular-item:hover .title {
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
  transition: color 0.2s;
}

.cta-widget {
  background: linear-gradient(135deg, var(--color-primary, #0c4a6e) 0%, var(--color-accent, #0369a1) 100%);
  color: white;
}

.cta-widget h4 { color: white; }

.cta-widget p {
  margin: 0 0 16px;
  font-size: 14px;
  opacity: 0.9;
}

.cta-btn {
  display: inline-block;
  padding: 12px 24px;
  background: white;
  color: var(--color-primary, #0c4a6e);
  border-radius: 24px;
  font-weight: 600;
  text-decoration: none;
}

/* Loading / Not Found */
.loading-page, .not-found-page {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.not-found-icon {
  font-size: 80px;
  color: #cbd5e1;
  margin-bottom: 24px;
}

.not-found-page h2 {
  margin: 0 0 24px;
  color: #64748b;
}

/* Responsive */
@media (max-width: 1024px) {
  .article-grid {
    grid-template-columns: 1fr;
  }
  
  .article-sidebar {
    display: none;
  }
}

@media (max-width: 768px) {
  .article-main {
    padding: 24px;
  }
  
  .article-header h1 {
    font-size: 24px;
  }
}
</style>
