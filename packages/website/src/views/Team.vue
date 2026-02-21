<template>
  <div class="team-page">
    <!-- Page Hero -->
    <section class="page-hero gradient-bg">
      <div class="container">
        <h1 class="page-title">{{ t('team.pageTitle') }}</h1>
        <p class="page-subtitle">{{ t('team.pageSubtitle') }}</p>
      </div>
    </section>

    <!-- Team Content -->
    <section class="section team-content">
      <div class="container">
        <!-- 1. 創始人與高管層 -->
        <div class="team-category">
          <h2 class="category-title">{{ t('team.categories.founders.title') }}</h2>
          <h3 class="category-subtitle">{{ t('team.categories.founders.subtitle') }}</h3>
          <el-row :gutter="32">
            <el-col v-for="member in founderMembers" :key="member.key" :lg="8" :md="12" :sm="24">
              <div class="member-card card">
                <div class="member-image">
                  <el-icon><Avatar /></el-icon>
                </div>
                <div class="member-info">
                  <h4 class="member-name">{{ member.name }}</h4>
                  <p class="member-position">{{ member.position }}</p>
                  <div class="member-tags">
                    <span v-for="tag in member.tags" :key="tag" class="member-tag">{{ tag }}</span>
                  </div>
                  <div class="member-bio">
                    <p v-for="(line, index) in member.bio" :key="index">{{ line }}</p>
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 2. 行業專家顧問 -->
        <div class="team-category">
          <h2 class="category-title">{{ t('team.categories.advisors.title') }}</h2>
          <h3 class="category-subtitle">{{ t('team.categories.advisors.subtitle') }}</h3>
          <el-row :gutter="32">
            <el-col v-for="member in advisorMembers" :key="member.key" :lg="6" :md="12" :sm="24">
              <div class="member-card card small">
                <div class="member-image mini">
                  <el-icon><Briefcase /></el-icon>
                </div>
                <div class="member-info">
                  <h4 class="member-name">{{ member.name }}</h4>
                  <p class="member-position">{{ member.position }}</p>
                  <p class="member-desc">{{ member.desc }}</p>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 3. 商業諮詢與理財團隊 -->
        <div class="team-category">
          <h2 class="category-title">{{ t('team.categories.consulting.title') }}</h2>
          <h3 class="category-subtitle">{{ t('team.categories.consulting.subtitle') }}</h3>
          <el-row :gutter="32">
            <el-col v-for="member in consultingMembers" :key="member.key" :lg="8" :md="12" :sm="24">
              <div class="member-card card">
                <div class="member-image">
                  <el-icon><User /></el-icon>
                </div>
                <div class="member-info">
                  <h4 class="member-name">{{ member.name }}</h4>
                  <p class="member-position">{{ member.position }}</p>
                  <p class="member-desc">{{ member.desc }}</p>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 4. 區域負責人 -->
        <div class="team-category">
          <h2 class="category-title">{{ t('team.categories.regional.title') }}</h2>
          <h3 class="category-subtitle">{{ t('team.categories.regional.subtitle') }}</h3>
          <el-row :gutter="32">
            <el-col v-for="member in regionalMembers" :key="member.key" :lg="8" :md="12" :sm="24">
              <div class="member-card card">
                <div class="member-image">
                  <el-icon><Location /></el-icon>
                </div>
                <div class="member-info">
                  <h4 class="member-name">{{ member.name }}</h4>
                  <p class="member-position">{{ member.position }}</p>
                  <p class="member-desc">{{ member.desc }}</p>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="section cta-section gradient-bg">
      <div class="container">
        <div class="cta-content text-center">
          <h2 class="cta-title">{{ t('team.cta.title') }}</h2>
          <p class="cta-subtitle">{{ t('team.cta.subtitle') }}</p>
          <el-button type="primary" size="large" class="cta-button" @click="goToContact">
            {{ t('team.cta.button') }}
          </el-button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'
import { useI18n } from 'vue-i18n'
import { Avatar, Briefcase, User, Location } from '@element-plus/icons-vue'

const { t, tm } = useI18n()
const router = useRouter()
const route = useRoute()

useHead({
  title: () => (route.meta.title as string) || '专家团队 | 通海南洋',
  meta: [
    { name: 'description', content: () => (route.meta.description as string) || '' },
  ],
})

const goToContact = () => {
  router.push('/contact')
}

// 使用 tm() 获取原始消息对象（包括数组）
const founderMembers = computed(() => {
  const members = tm('team.members.founders') as Record<string, {
    name: string
    position: string
    tags: string[]
    bio: string[]
  }>
  return Object.keys(members).map(key => ({
    key,
    ...members[key]
  }))
})

const advisorMembers = computed(() => {
  const members = tm('team.members.advisors') as Record<string, {
    name: string
    position: string
    desc: string
  }>
  return Object.keys(members).map(key => ({
    key,
    ...members[key]
  }))
})

const consultingMembers = computed(() => {
  const members = tm('team.members.consulting') as Record<string, {
    name: string
    position: string
    desc: string
  }>
  return Object.keys(members).map(key => ({
    key,
    ...members[key]
  }))
})

const regionalMembers = computed(() => {
  const members = tm('team.members.regional') as Record<string, {
    name: string
    position: string
    desc: string
  }>
  return Object.keys(members).map(key => ({
    key,
    ...members[key]
  }))
})
</script>

<style scoped>
.page-hero {
  padding: var(--spacing-3xl) 0;
  text-align: center;
  color: white;
}

.page-title {
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: var(--spacing-md);
  color: white;
}

.page-subtitle {
  font-size: 1.25rem;
  max-width: 800px;
  margin: 0 auto;
  opacity: 0.9;
}

.team-content {
  background-color: var(--color-bg);
}

.team-category {
  margin-bottom: var(--spacing-3xl);
}

.category-title {
  font-size: 0.875rem;
  letter-spacing: 0.2em;
  color: var(--color-gold);
  font-weight: 700;
  margin-bottom: var(--spacing-xs);
}

.category-subtitle {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: var(--spacing-xl);
  position: relative;
  display: inline-block;
}

.category-subtitle::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 60px;
  height: 4px;
  background-color: var(--color-gold);
}

.member-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: var(--spacing-xl);
  transition: all 0.3s ease;
  margin-bottom: var(--spacing-lg);
}

.member-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-xl);
}

.member-card.small {
  padding: var(--spacing-lg);
}

.member-image {
  width: 80px;
  height: 80px;
  background: var(--color-bg);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-lg);
  color: var(--color-accent);
  font-size: 2rem;
  border: 1px solid var(--color-gold);
}

.member-image.mini {
  width: 50px;
  height: 50px;
  font-size: 1.25rem;
  margin-bottom: var(--spacing-md);
}

.member-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: var(--spacing-xs);
}

.member-position {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-accent);
  margin-bottom: var(--spacing-md);
}

.member-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
}

.member-tag {
  font-size: 0.75rem;
  background: rgba(3, 105, 161, 0.1);
  color: var(--color-accent);
  padding: 2px 8px;
  border-radius: 4px;
}

.member-bio {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--color-text);
}

.member-bio p {
  margin-bottom: 8px;
}

.member-desc {
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--color-text);
  margin: 0;
}

/* CTA Section */
.cta-section {
  padding: var(--spacing-3xl) 0;
  color: white;
}

.cta-content {
  max-width: 700px;
  margin: 0 auto;
}

.cta-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: var(--spacing-md);
  color: white;
}

.cta-subtitle {
  font-size: 1.125rem;
  margin-bottom: var(--spacing-2xl);
  opacity: 0.9;
}

.cta-button {
  padding: 24px 64px;
  font-size: 1.125rem;
  font-weight: 700;
  background-color: white;
  color: var(--color-primary);
  border: none;
  box-shadow: var(--shadow-xl);
}

.cta-button:hover {
  background-color: var(--color-bg);
  transform: translateY(-2px);
}

/* Responsive */
@media (max-width: 768px) {
  .page-title {
    font-size: 2.25rem;
  }
  .category-subtitle {
    font-size: 1.75rem;
  }
}
</style>
