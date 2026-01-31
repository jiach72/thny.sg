<template>
  <section class="section news-section">
    <div class="container">
      <div class="section-header">
        <h2 class="section-title">{{ t('home.news.title') }}</h2>
        <router-link to="/news" class="view-all">
          {{ t('home.news.viewAll') }}
          <el-icon><ArrowRight /></el-icon>
        </router-link>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-grid">
        <el-skeleton v-for="i in 3" :key="i" :rows="4" animated />
      </div>

      <!-- 文章卡片 -->
      <div v-else-if="articles.length > 0" class="news-grid">
        <article 
          v-for="article in articles" 
          :key="article.id"
          class="news-card"
          @click="goToDetail(article.id)"
        >
          <div class="card-image" v-if="article.coverImage">
            <img :src="article.coverImage" :alt="article.title" />
            <span class="type-tag" :class="article.type.toLowerCase()">
              {{ article.type === 'COMPANY' ? t('news.company') : t('news.industry') }}
            </span>
          </div>
          <div class="card-content">
            <h3>{{ article.title }}</h3>
            <p v-if="article.summary" class="summary">{{ article.summary }}</p>
            <div class="card-meta">
              <span class="date">{{ formatDate(article.publishedAt) }}</span>
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
        <p>{{ t('home.news.empty') }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowRight, View } from '@element-plus/icons-vue'
import apiClient from '../api/apiClient'

const { t, locale } = useI18n()
const router = useRouter()

const loading = ref(true)
const articles = ref<any[]>([])

async function fetchArticles() {
  loading.value = true
  try {
    const response = await apiClient.get('/news', {
      params: {
        page: 1,
        pageSize: 3,
        locale: locale.value === 'en' ? 'en' : 'zh',
      },
    })
    
    // 兼容逻辑
    if (response.success && response.data) {
       articles.value = response.data.articles
    } else if (response.articles) {
       articles.value = response.articles
    }

  } catch (error) {
    console.error('Error fetching news:', error)
  } finally {
    loading.value = false
  }
}

function goToDetail(id: string) {
  router.push(`/news/${id}`)
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale.value === 'en' ? 'en-US' : 'zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

watch(locale, fetchArticles)
onMounted(fetchArticles)
</script>

<style scoped>
.news-section {
  background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-2xl);
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0;
}

.view-all {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-accent);
  font-weight: 600;
  text-decoration: none;
  transition: gap 0.2s;
}

.view-all:hover {
  gap: 8px;
}

.news-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-xl);
}

.news-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.3s ease;
}

.news-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
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

.news-card:hover .card-image img {
  transform: scale(1.05);
}

.type-tag {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.type-tag.company {
  background: rgba(22, 163, 74, 0.9);
  color: white;
}

.type-tag.industry {
  background: rgba(37, 99, 235, 0.9);
  color: white;
}

.card-content {
  padding: 20px;
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

.card-meta {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #94a3b8;
}

.views {
  display: flex;
  align-items: center;
  gap: 4px;
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-xl);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;
}

@media (max-width: 1024px) {
  .news-grid,
  .loading-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .section-title {
    font-size: 1.75rem;
  }

  .news-grid,
  .loading-grid {
    grid-template-columns: 1fr;
  }

  .card-image {
    height: 160px;
  }
}
</style>
