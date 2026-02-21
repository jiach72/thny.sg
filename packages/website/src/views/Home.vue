<template>
  <div class="home">
    <!-- Hero Section -->
    <section class="hero">
      <!-- 背景视频 -->
      <div class="hero-video-wrapper">
        <video 
          class="hero-video"
          autoplay 
          muted 
          loop 
          playsinline
        >
          <source src="/Singapore_Skyline_Sunset_Loop.mp4" type="video/mp4" />
        </video>
      </div>
      <!-- 视频遮罩层 -->
      <div class="hero-overlay"></div>
      <div class="hero-bg"></div>
      <div class="container hero-content">
        <div class="hero-text">
          <h1 class="hero-title fade-in">
            {{ $t('home.hero.title') }}
          </h1>
          <p class="hero-subtitle fade-in">
            {{ $t('home.hero.subtitle') }}
          </p>
          <p class="hero-description fade-in">
            {{ $t('home.hero.description') }}
          </p>
          <div class="hero-buttons fade-in">
            <el-button type="primary" size="large" class="hero-button" @click="goToServices">
              <svg class="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
              {{ $t('home.hero.btn1') }}
            </el-button>
            <el-button size="large" class="hero-button-secondary" @click="goToContact">
              <svg class="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              {{ $t('home.hero.btn2') }}
            </el-button>
          </div>
        </div>
      </div>
    </section>

    <!-- What We Do Section -->
    <section class="section what-we-do">
      <div class="container">
        <h2 class="section-title text-center">
          {{ $t('home.whatWeDo.title') }}
        </h2>
        <div class="services-grid">
          <div 
            v-for="(service, index) in services" 
            :key="index"
            class="service-card card cursor-pointer"
            @click="goToServices"
          >
            <div class="service-icon-wrapper">
              <component :is="service.icon" class="service-icon" />
            </div>
            <h3 class="service-title">
              {{ $t(`home.whatWeDo.service${index + 1}.title`) }}
            </h3>
            <p class="service-desc">
              {{ $t(`home.whatWeDo.service${index + 1}.desc`) }}
            </p>
            <span class="service-link">
              {{ $t('home.whatWeDo.learnMore') }}
              <svg class="link-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- How We Work Section -->
    <section class="section how-we-work bg-white">
      <div class="container">
        <h2 class="section-title text-center">
          {{ $t('home.howWeWork.title') }}
        </h2>
        <div class="steps-grid">
          <div 
            v-for="(_, index) in steps" 
            :key="index"
            class="step-card"
          >
            <div class="step-number">{{ index + 1 }}</div>
            <h3 class="step-title">
              {{ $t(`home.howWeWork.step${index + 1}.title`) }}
            </h3>
            <p class="step-desc">
              {{ $t(`home.howWeWork.step${index + 1}.desc`) }}
            </p>
            <!-- Connection Arrow -->
            <div v-if="index < 3" class="step-arrow">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Why Us Section -->
    <section class="section why-us">
      <div class="container">
        <h2 class="section-title text-center">
          {{ $t('home.whyUs.title') }}
        </h2>
        <div class="reasons-grid">
          <div 
            v-for="(reason, index) in reasons" 
            :key="index"
            class="reason-card card"
          >
            <div class="reason-icon-wrapper">
              <component :is="reason.icon" class="reason-icon" />
            </div>
            <h3 class="reason-title">
              {{ $t(`home.whyUs.reason${index + 1}.title`) }}
            </h3>
            <p class="reason-desc">
              {{ $t(`home.whyUs.reason${index + 1}.desc`) }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- News Section -->
    <HomeNews />

    <!-- CTA Section -->
    <section class="section cta-section gradient-bg">
      <div class="container">
        <div class="cta-content text-center">
          <h2 class="cta-title">
            {{ $t('home.cta.title') }}
          </h2>
          <p class="cta-subtitle">
            {{ $t('home.cta.subtitle') }}
          </p>
          <el-button type="primary" size="large" class="cta-button" @click="goToContact">
            {{ $t('home.cta.button') }}
          </el-button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'
import { 
  OfficeBuilding, 
  User, 
  TrendCharts, 
  House,
  Connection,
  Document,
  Service,
  Message
} from '@element-plus/icons-vue'
import type { Component } from 'vue'
import HomeNews from '@/components/HomeNews.vue'

const router = useRouter()
const route = useRoute()

useHead({
  title: () => (route.meta.title as string) || '通海南洋 | 稳健出海 · 传承未来',
  meta: [
    { name: 'description', content: () => (route.meta.description as string) || '新加坡一站式企业落地、身份规划、财富架构与资产配置专业咨询服务' },
  ],
})

interface ServiceItem {
  icon: Component
}

interface StepItem {
  step: number
}

interface ReasonItem {
  icon: Component
}

const services: ServiceItem[] = [
  { icon: OfficeBuilding },
  { icon: User },
  { icon: TrendCharts },
  { icon: House }
]

const steps: StepItem[] = [
  { step: 1 },
  { step: 2 },
  { step: 3 },
  { step: 4 }
]

const reasons: ReasonItem[] = [
  { icon: Connection },
  { icon: Document },
  { icon: Service },
  { icon: Message }
]

const goToServices = (): void => {
  router.push('/services')
}

const goToContact = (): void => {
  router.push('/contact')
}
</script>

<style scoped>
/* Hero Section */
.hero {
  position: relative;
  min-height: 85vh;
  display: flex;
  align-items: center;
  overflow: hidden;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 40%, var(--color-secondary) 100%);
}

/* 背景视频容器 */
.hero-video-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
}

/* 背景视频 */
.hero-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

/* 视频遮罩层 - 确保文字可读性 */
.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg, 
    rgba(30, 58, 95, 0.85) 0%, 
    rgba(45, 90, 135, 0.75) 40%, 
    rgba(74, 124, 174, 0.70) 100%
  );
  z-index: 1;
}

.hero-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(ellipse at 20% 30%, rgba(251, 191, 36, 0.20) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 70%, rgba(245, 158, 11, 0.15) 0%, transparent 45%),
    radial-gradient(circle at 60% 90%, rgba(234, 88, 12, 0.10) 0%, transparent 40%);
  z-index: 2;
}

.hero-content {
  position: relative;
  z-index: 3;
  padding: var(--spacing-3xl) 0;
}

.hero-text {
  max-width: 800px;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  color: white;
  margin-bottom: var(--spacing-lg);
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.hero-subtitle {
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: var(--spacing-md);
  font-weight: 600;
}

.hero-description {
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: var(--spacing-2xl);
  line-height: 1.7;
}

.hero-buttons {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.hero-button,
.hero-button-secondary {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 16px 32px;
  font-weight: 600;
  box-shadow: var(--shadow-lg);
  transition: all 0.3s ease;
}

.hero-button:hover,
.hero-button-secondary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-xl);
}

/* 按压效果 */
.hero-button:active,
.hero-button-secondary:active {
  transform: translateY(0) scale(0.98);
  box-shadow: var(--shadow-md);
}

.hero-button-secondary {
  background: white;
  color: var(--color-primary);
  border-color: white;
}

.button-icon {
  width: 20px;
  height: 20px;
}

/* Section Styles */
.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: var(--spacing-2xl);
}

/* Services Grid */
.services-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-xl);
  max-width: 1000px;
  margin: 0 auto;
}

.service-card {
  padding: var(--spacing-2xl);
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: 0 10px 30px -15px rgba(0, 0, 0, 0.1);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
}

.service-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px -20px rgba(3, 105, 161, 0.2);
  border-color: var(--color-accent);
}

.service-icon-wrapper {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-primary) 80%, var(--color-gold) 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-lg);
  color: white;
  box-shadow: var(--shadow-warm);
}

.service-icon {
  width: 28px;
  height: 28px;
}

.service-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: var(--spacing-sm);
}

.service-desc {
  color: var(--color-text-muted);
  line-height: 1.7;
  margin-bottom: var(--spacing-lg);
  flex-grow: 1;
}

.service-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-accent);
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  font-size: 0.95rem;
}

.service-link:hover {
  gap: var(--spacing-sm);
  color: var(--color-accent-hover);
}

.link-arrow {
  width: 16px;
  height: 16px;
}

/* Steps Grid */
.steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--spacing-lg);
  position: relative;
}

.step-card {
  text-align: center;
  position: relative;
  padding: var(--spacing-xl);
}

.step-number {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, var(--color-gold) 0%, var(--color-orange) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  font-weight: 800;
  color: white;
  margin: 0 auto var(--spacing-lg);
  box-shadow: var(--shadow-warm);
}

.step-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: var(--spacing-sm);
}

.step-desc {
  color: var(--color-text-muted);
  line-height: 1.6;
}

.step-arrow {
  position: absolute;
  top: 50%;
  right: -20px;
  transform: translateY(-50%);
  color: var(--color-accent);
  opacity: 0.3;
}

.step-arrow svg {
  width: 24px;
  height: 24px;
}

/* Reasons Grid */
.reasons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--spacing-xl);
}

.reason-card {
  padding: var(--spacing-2xl);
  text-align: center;
}

.reason-icon-wrapper {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(245, 158, 11, 0.12) 100%);
  border: 2px solid var(--color-border-warm);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--spacing-lg);
  color: var(--color-accent);
  font-size: 1.75rem;
  transition: all 0.3s ease;
}

.reason-card:hover .reason-icon-wrapper {
  background: linear-gradient(135deg, var(--color-gold) 0%, var(--color-orange) 100%);
  border-color: transparent;
  color: white;
  box-shadow: var(--shadow-warm);
}

.reason-icon {
  width: 28px;
  height: 28px;
}

.reason-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: var(--spacing-sm);
}

.reason-desc {
  color: var(--color-text-muted);
  line-height: 1.6;
}

/* CTA Section */
.cta-section {
  position: relative;
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

.cta-button:active {
  transform: translateY(0) scale(0.98);
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .hero-button:hover,
  .hero-button-secondary:hover,
  .cta-button:hover,
  .service-card:hover {
    transform: none;
  }
  
  .hero-button:active,
  .hero-button-secondary:active,
  .cta-button:active {
    transform: scale(0.98);
  }
  
  .service-card:active {
    transform: scale(0.99);
    box-shadow: 0 20px 40px -20px rgba(3, 105, 161, 0.2);
  }
}

/* Responsive */
@media (max-width: 1024px) {
  .hero-title {
    font-size: 2.75rem;
  }

  .section-title {
    font-size: 2rem;
  }

  .steps-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .step-arrow {
    display: none;
  }
}

@media (max-width: 768px) {
  .hero {
    min-height: 85vh;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1.125rem;
  }

  .hero-description {
    font-size: 1rem;
  }

  .hero-buttons {
    flex-direction: column;
    align-items: flex-start;
  }

  .services-grid,
  .steps-grid,
  .reasons-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }

  .section-title {
    font-size: 1.75rem;
  }

  .cta-title {
    font-size: 1.875rem;
  }
}
</style>
