<template>
  <div class="about-page">
    <!-- Page Hero -->
    <section class="page-hero gradient-bg">
      <div class="container">
        <h1 class="page-title">{{ t('about.pageTitle') }}</h1>
        <p class="page-subtitle">{{ t('about.pageSubtitle') }}</p>
      </div>
    </section>

    <!-- Brand Story -->
    <section class="section brand-story">
      <div class="container">
        <h2 class="section-title text-center">{{ t('about.brandStory.title') }}</h2>
        <div class="story-content">
          <p class="story-text" v-html="sanitize(t('about.brandStory.paragraph1'))"></p>
          <p class="story-text" v-html="sanitize(t('about.brandStory.paragraph2'))"></p>
        </div>
      </div>
    </section>

    <!-- Core Values -->
    <section class="section core-values bg-white">
      <div class="container">
        <h2 class="section-title text-center">{{ t('about.coreValues.title') }}</h2>
        <el-row :gutter="32">
          <el-col :lg="6" :md="12" :sm="24">
            <div class="value-card card">
              <div class="value-icon"><el-icon><Check /></el-icon></div>
              <h3>{{ t('about.coreValues.compliance.title') }}</h3>
              <p>{{ t('about.coreValues.compliance.desc') }}</p>
            </div>
          </el-col>
          <el-col :lg="6" :md="12" :sm="24">
            <div class="value-card card">
              <div class="value-icon"><el-icon><TrendCharts /></el-icon></div>
              <h3>{{ t('about.coreValues.goalOriented.title') }}</h3>
              <p>{{ t('about.coreValues.goalOriented.desc') }}</p>
            </div>
          </el-col>
          <el-col :lg="6" :md="12" :sm="24">
            <div class="value-card card">
              <div class="value-icon"><el-icon><DocumentChecked /></el-icon></div>
              <h3>{{ t('about.coreValues.transparency.title') }}</h3>
              <p>{{ t('about.coreValues.transparency.desc') }}</p>
            </div>
          </el-col>
          <el-col :lg="6" :md="12" :sm="24">
            <div class="value-card card">
              <div class="value-icon"><el-icon><Connection /></el-icon></div>
              <h3>{{ t('about.coreValues.longTerm.title') }}</h3>
              <p>{{ t('about.coreValues.longTerm.desc') }}</p>
            </div>
          </el-col>
        </el-row>
      </div>
    </section>

    <!-- Core Team -->
    <section class="section core-team">
      <div class="container">
        <h2 class="section-title text-center">{{ t('about.coreTeam.title') }}</h2>
        
        <div class="team-intro">
          <p>{{ t('about.coreTeam.intro') }}</p>
        </div>

        <el-row :gutter="32" class="team-grid">
          <el-col :lg="8" :md="12" :sm="24">
            <div class="team-member-card card">
              <div class="member-avatar"><el-icon><Avatar /></el-icon></div>
              <h4>{{ t('about.coreTeam.members.ada.name') }}</h4>
              <p class="member-title">{{ t('about.coreTeam.members.ada.position') }}</p>
              <p class="member-bio">{{ t('about.coreTeam.members.ada.bio') }}</p>
            </div>
          </el-col>
          <el-col :lg="8" :md="12" :sm="24">
            <div class="team-member-card card">
              <div class="member-avatar"><el-icon><Avatar /></el-icon></div>
              <h4>{{ t('about.coreTeam.members.mars.name') }}</h4>
              <p class="member-title">{{ t('about.coreTeam.members.mars.position') }}</p>
              <p class="member-bio">{{ t('about.coreTeam.members.mars.bio') }}</p>
            </div>
          </el-col>
          <el-col :lg="8" :md="12" :sm="24">
            <div class="team-member-card card">
              <div class="member-avatar"><el-icon><Avatar /></el-icon></div>
              <h4>{{ t('about.coreTeam.members.wendy.name') }}</h4>
              <p class="member-title">{{ t('about.coreTeam.members.wendy.position') }}</p>
              <p class="member-bio">{{ t('about.coreTeam.members.wendy.bio') }}</p>
            </div>
          </el-col>
        </el-row>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="section cta-section gradient-bg">
      <div class="container">
        <div class="cta-content text-center">
          <h2 class="cta-title">{{ t('about.cta.title') }}</h2>
          <p class="cta-subtitle">{{ t('about.cta.subtitle') }}</p>
          <el-button type="primary" size="large" class="cta-button" @click="goToContact">
            {{ t('about.cta.button') }}
          </el-button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'
import { useI18n } from 'vue-i18n'
import { Avatar, Check, DocumentChecked, Connection, TrendCharts } from '@element-plus/icons-vue'
import DOMPurify from 'dompurify'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

/**
 * 净化 HTML 内容（仅允许 strong/em/a 等安全标签）
 */
function sanitize(html: string): string {
  // 兼容直接导入与 default 导入，防止 vite-ssg 报错 TypeError: DOMPurify.sanitize is not a function
  const lib: any = DOMPurify
  const purify = typeof lib.sanitize === 'function' ? lib : lib.default || lib
  if (typeof purify.sanitize === 'function') {
    return purify.sanitize(html, {
      ALLOWED_TAGS: ['strong', 'em', 'a', 'br'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
    })
  }
  // 如果实在找不到 sanitize 函数（SSR极度边缘情况），返回原文本作为兜底
  return html
}

useHead({
  title: () => (route.meta.title as string) || '关于我们 | 通海南洋',
  meta: [
    { name: 'description', content: () => (route.meta.description as string) || '' },
  ],
})

const goToContact = (): void => {
  router.push('/contact')
}
</script>

<style scoped>
/* Page Hero */
.page-hero {
  padding: var(--spacing-3xl) 0;
  text-align: center;
  color: white;
}

.page-title {
  font-size: 3rem;
  font-weight: 800;
  color: white;
  margin-bottom: var(--spacing-md);
}

.page-subtitle {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.9);
  max-width: 800px;
  margin: 0 auto;
}

/* Brand Story */
.brand-story {
  background: var(--color-bg);
}

.story-content {
  max-width: 900px;
  margin: 0 auto;
}

.story-text {
  font-size: 1.125rem;
  line-height: 2;
  color: var(--color-text);
  text-align: justify;
}

/* Core Values */
.value-card {
  padding: var(--spacing-2xl);
  text-align: center;
  height: 100%;
  transition: all 0.3s ease;
}

.value-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-card-hover);
}

.value-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-gold) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--spacing-lg);
  color: white;
  font-size: 2rem;
}

.value-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: var(--spacing-sm);
}

.value-card p {
  color: var(--color-text-muted);
  line-height: 1.6;
}

/* Core Team */
.team-section {
  margin-bottom: var(--spacing-3xl);
}

.team-section-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: var(--spacing-2xl);
  padding-bottom: var(--spacing-md);
  border-bottom: 3px solid var(--color-accent);
}

.team-intro {
  text-align: center;
  max-width: 800px;
  margin: 0 auto var(--spacing-2xl);
  color: var(--color-text-muted);
  font-size: 1.125rem;
}

.team-member-card {
  padding: var(--spacing-xl);
  height: 100%;
  margin-bottom: var(--spacing-lg);
  transition: all 0.3s ease;
  text-align: center;
}

.team-member-card:hover {
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-2px);
}

.member-header {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.member-avatar {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-gold) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: white;
  font-size: 2rem;
  margin: 0 auto var(--spacing-md);
}

.member-info {
  flex: 1;
}

.member-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: var(--spacing-xs);
}

.member-title {
  font-size: 0.9375rem;
  color: var(--color-accent);
  font-weight: 600;
  margin: 0;
}

.member-details {
  color: var(--color-text);
}

.member-other-titles {
  background: var(--color-bg-secondary);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
  margin-bottom: var(--spacing-md);
  font-size: 0.875rem;
  line-height: 1.6;
}

.member-bio {
  line-height: 1.7;
  color: var(--color-text-muted);
}

/* CTA Section */
.cta-section {
  padding: var(--spacing-3xl) 0;
}

.cta-content {
  max-width: 700px;
  margin: 0 auto;
}

.cta-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: var(--spacing-md);
}

.cta-subtitle {
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: var(--spacing-2xl);
  line-height: 1.7;
}

.cta-button {
  padding: 16px 48px;
  font-size: 1.125rem;
  font-weight: 600;
  background: white;
  color: var(--color-primary);
  border-color: white;
  box-shadow: var(--shadow-xl);
}

.cta-button:hover {
  background: var(--color-bg);
  border-color: var(--color-bg);
  transform: translateY(-2px);
}

/* Responsive */
@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }

  .story-text {
    font-size: 1rem;
    text-align: left;
  }

  .member-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .cta-title {
    font-size: 1.875rem;
  }
}
</style>
