<template>
  <div class="industries-page">
    <!-- Page Hero -->
    <section class="page-hero gradient-bg">
      <div class="container">
        <h1 class="page-title">{{ $t('industries.pageTitle') }}</h1>
        <p class="page-subtitle">{{ $t('industries.pageSubtitle') }}</p>
      </div>
    </section>

    <!-- Industry Grid Section -->
    <section class="section industries-content">
      <div class="container">
        <div class="industries-grid">
          <div v-for="item in industryItems" :key="item.id" class="industry-card hover-lift">
            <div class="card-header">
              <div class="industry-icon-wrapper">
                <component :is="getIcon(item.id)" class="industry-icon" />
              </div>
              <h2 class="industry-title">{{ item.title }}</h2>
            </div>
            
            <div class="card-body">
              <div class="detail-box pain-point">
                <div class="box-header">
                  <el-icon class="status-icon"><Warning /></el-icon>
                  <span>{{ $t('industries.labels.painPoints') }}</span>
                </div>
                <p class="box-text">{{ item.painPoint }}</p>
              </div>

              <div class="detail-box solution">
                <div class="box-header">
                  <el-icon class="status-icon"><SuccessFilled /></el-icon>
                  <span>{{ $t('industries.labels.solutions') }}</span>
                </div>
                <p class="box-text">{{ item.solution }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="section cta-section gradient-bg">
      <div class="container">
        <div class="cta-content text-center">
          <h2 class="cta-title">{{ $t('services.cta.title') }}</h2>
          <p class="cta-subtitle">{{ $t('services.cta.subtitle') }}</p>
          <el-button type="primary" size="large" class="cta-button" @click="goToContact">
            {{ $t('services.cta.button') }}
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
import { 
  Dish, 
  FirstAidKit, 
  TrendCharts, 
  ShoppingCart, 
  GoldMedal,
  Warning,
  SuccessFilled
} from '@element-plus/icons-vue'

const { tm } = useI18n()
const router = useRouter()
const route = useRoute()

useHead({
  title: () => (route.meta.title as string) || '行业方案 | 通海南洋',
  meta: [
    { name: 'description', content: () => (route.meta.description as string) || '' },
  ],
})

const industryItems = computed(() => {
  return tm('industries.items')
})

const getIcon = (id: string) => {
  switch (id) {
    case 'food': return Dish
    case 'pharma': return FirstAidKit
    case 'fintech': return TrendCharts
    case 'ecommerce': return ShoppingCart
    case 'familyoffice': return GoldMedal
    default: return TrendCharts
  }
}

const goToContact = () => {
  router.push('/contact')
}
</script>

<style scoped>
/* Page Hero */
.page-hero {
  padding: 6rem 0;
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

/* Industries Grid */
.industries-content {
  padding: 4rem 0;
  background: var(--color-bg);
}

.industries-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}

/* Industry Card */
.industry-card {
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100%;
}

.hover-lift:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-xl);
  border-color: var(--color-accent);
}

/* Card Header */
.card-header {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-bg-secondary);
}

.industry-icon-wrapper {
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, var(--color-bg-secondary) 0%, white 100%);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  color: var(--color-accent);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}

.industry-card:hover .industry-icon-wrapper {
  background: var(--color-accent);
  color: white;
  transform: scale(1.1) rotate(5deg);
}

.industry-icon {
  font-size: 2rem;
}

.industry-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0;
  line-height: 1.3;
}

/* Card Body */
.card-body {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  flex: 1;
}

.detail-box {
  padding: 1.25rem;
  border-radius: var(--radius-md);
  flex: 1;
}

.pain-point {
  background: #FEF2F2; /* Red-50 */
  border: 1px solid #FEE2E2; /* Red-100 */
}

.solution {
  background: #ECFDF5; /* Green-50 */
  border: 1px solid #D1FAE5; /* Green-100 */
}

.box-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-weight: 700;
  font-size: 0.9375rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.pain-point .box-header {
  color: #EF4444; /* Red-500 */
}

.solution .box-header {
  color: #10B981; /* Green-500 */
}

.status-icon {
  font-size: 1.125rem;
}

.box-text {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--color-text);
  margin: 0;
}

/* CTA Section */
.cta-section {
  padding: 6rem 0;
}

.cta-content {
  max-width: 700px;
  margin: 0 auto;
}

.cta-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1rem;
}

.cta-subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.25rem;
  margin-bottom: 2rem;
}

.cta-button {
  padding: 1.25rem 3rem;
  font-size: 1.125rem;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 1200px) {
  .industries-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .industries-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .page-title {
    font-size: 2rem;
  }
  
  .industry-title {
    font-size: 1.25rem;
  }
}
</style>
