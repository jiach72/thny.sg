<template>
  <div class="services-page">
    <!-- Page Hero -->
    <section class="page-hero gradient-bg">
      <div class="container">
        <h1 class="page-title">{{ $t('services.pageTitle') }}</h1>
        <p class="page-subtitle">{{ $t('services.pageSubtitle') }}</p>
      </div>
    </section>

    <!-- Main Content Area -->
    <div class="container main-layout">
      <!-- Sticky Sidebar Navigation -->
      <aside class="sidebar-wrapper">
        <nav class="sidebar-nav">
          <a 
            v-for="item in navItems" 
            :key="item.id"
            :href="`#${item.id}`"
            class="nav-item"
            :class="{ active: activeSection === item.id }"
            @click.prevent="scrollToSection(item.id)"
          >
            <el-icon class="nav-icon"><component :is="item.icon" /></el-icon>
            <span class="nav-text">{{ $t(`services.${item.key}.title`) }}</span>
          </a>
        </nav>
      </aside>

      <!-- Scrollable Content -->
      <main class="content-area">
        <!-- Corporate Services -->
        <section id="corporate" class="service-section">
          <div class="section-header">
            <h2 class="section-title">{{ $t('services.corporate.title') }}</h2>
            <p class="section-intro">{{ $t('services.corporate.intro') }}</p>
          </div>
          
          <div class="subsection">
            <h3 class="subsection-title">{{ $t('services.corporate.basic.title') }}</h3>
            <el-row :gutter="20">
              <el-col v-for="(_, index) in corporateBasicServices" :key="index" :lg="8" :md="12" :sm="24">
                <div class="service-card hover-lift">
                  <div class="card-icon"><el-icon><OfficeBuilding /></el-icon></div>
                  <h4>{{ $t(`services.corporate.basic.items.${index}`) }}</h4>
                </div>
              </el-col>
            </el-row>
          </div>

          <div class="subsection">
            <h3 class="subsection-title">{{ $t('services.corporate.banking.title') }}</h3>
            <!-- Priority Banking -->
            <div class="banking-card priority">
              <h4>{{ $t('services.corporate.banking.priority.title') }}</h4>
              <el-table :data="priorityBankingData" stripe class="banking-table">
                <el-table-column prop="bank" :label="$t('services.corporate.banking.priority.bank')" />
                <el-table-column prop="requirement" :label="$t('services.corporate.banking.priority.requirement')" />
              </el-table>
            </div>
          </div>
        </section>

        <!-- Asset Management -->
        <section id="asset" class="service-section">
          <div class="section-header">
            <h2 class="section-title">{{ $t('services.asset.title') }}</h2>
            <p class="section-intro">{{ $t('services.asset.intro') }}</p>
          </div>

          <el-row :gutter="32">
            <el-col :lg="12" :md="24">
              <div class="feature-box">
                <h3 class="feature-title">{{ $t('services.asset.financial.title') }}</h3>
                <ul class="feature-list">
                  <li v-for="(_, index) in financialServices" :key="index">
                    <el-icon><Check /></el-icon>
                    <span>{{ $t(`services.asset.financial.items.${index}`) }}</span>
                  </li>
                </ul>
              </div>
            </el-col>
            <el-col :lg="12" :md="24">
              <div class="feature-box">
                <h3 class="feature-title">{{ $t('services.asset.realestate.title') }}</h3>
                <ul class="feature-list">
                  <li v-for="(_, index) in realestateServices" :key="index">
                    <el-icon><Check /></el-icon>
                    <span>{{ $t(`services.asset.realestate.items.${index}`) }}</span>
                  </li>
                </ul>
              </div>
            </el-col>
          </el-row>
        </section>

        <!-- Identity Planning -->
        <section id="identity" class="service-section">
          <div class="section-header">
            <h2 class="section-title">{{ $t('services.identity.title') }}</h2>
            <p class="section-intro">{{ $t('services.identity.intro') }}</p>
          </div>
          
          <el-row :gutter="32">
            <el-col :lg="12" :md="24">
              <div class="path-card">
                <div class="path-icon sg"><el-icon><Location /></el-icon></div>
                <h3>{{ $t('services.identity.singapore.title') }}</h3>
                <ul class="path-list">
                  <li v-for="(_, index) in singaporeIdentity" :key="index">
                    {{ $t(`services.identity.singapore.items.${index}`) }}
                  </li>
                </ul>
              </div>
            </el-col>
            <el-col :lg="12" :md="24">
              <div class="path-card">
                <div class="path-icon my"><el-icon><Location /></el-icon></div>
                <h3>{{ $t('services.identity.malaysia.title') }}</h3>
                <ul class="path-list">
                  <li v-for="(_, index) in malaysiaIdentity" :key="index">
                    {{ $t(`services.identity.malaysia.items.${index}`) }}
                  </li>
                </ul>
              </div>
            </el-col>
          </el-row>
        </section>

        <!-- Education -->
        <section id="education" class="service-section">
          <div class="section-header">
            <h2 class="section-title">{{ $t('services.education.title') }}</h2>
            <p class="section-intro">{{ $t('services.education.intro') }}</p>
          </div>
          
          <div class="education-grid">
            <div class="edu-card planning">
              <h3>{{ $t('services.education.planning.title') }}</h3>
              <ul>
                <li v-for="(_, index) in educationPlanning" :key="index">
                  <el-icon><Reading /></el-icon>
                  <span>{{ $t(`services.education.planning.items.${index}`) }}</span>
                </li>
              </ul>
            </div>
            <div class="edu-card special">
              <h3>{{ $t('services.education.special.title') }}</h3>
              <p>{{ $t('services.education.special.desc') }}</p>
            </div>
          </div>
        </section>

        <!-- Brand & Transformation -->
        <section id="brand" class="service-section">
          <div class="section-header">
            <h2 class="section-title">{{ $t('services.brand.title') }}</h2>
            <p class="section-intro">{{ $t('services.brand.intro') }}</p>
          </div>
          
          <div class="brand-grid">
            <div class="brand-col">
              <h3>{{ $t('services.brand.branding.title') }}</h3>
              <ul class="brand-list">
                <li v-for="(_, index) in brandingServices" :key="index">
                  <el-icon><Check /></el-icon>
                  <span>{{ $t(`services.brand.branding.items.${index}`) }}</span>
                </li>
              </ul>
            </div>
            <div class="brand-col">
              <h3>{{ $t('services.brand.value.title') }}</h3>
              <ul class="brand-list">
                <li v-for="(_, index) in valueServices" :key="index">
                  <el-icon><Check /></el-icon>
                  <span>{{ $t(`services.brand.value.items.${index}`) }}</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <!-- Tax & Grants -->
        <section id="tax" class="service-section">
          <div class="section-header">
            <h2 class="section-title">{{ $t('services.tax.title') }}</h2>
            <p class="section-intro">{{ $t('services.tax.intro') }}</p>
          </div>
          
          <el-row :gutter="32">
            <el-col :lg="12" :md="24">
              <div class="tax-card grant">
                <h3>{{ $t('services.tax.grants.title') }}</h3>
                <p>{{ $t('services.tax.grants.desc') }}</p>
              </div>
            </el-col>
            <el-col :lg="12" :md="24">
              <div class="tax-card">
                <h3>{{ $t('services.tax.taxation.title') }}</h3>
                <ul class="feature-list">
                  <li v-for="(_, index) in taxServices" :key="index">
                    <el-icon><Check /></el-icon>
                    <span>{{ $t(`services.tax.taxation.items.${index}`) }}</span>
                  </li>
                </ul>
              </div>
            </el-col>
          </el-row>
        </section>
      </main>
    </div>

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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'
import { 
  OfficeBuilding, 
  Check, 
  Money, 
  User, 
  Reading, 
  Ship, 
  Document,
  Location 
} from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

const { tm } = useI18n()
const router = useRouter()
const route = useRoute()
const activeSection = ref('corporate')

useHead({
  title: () => (route.meta.title as string) || '服务项目 | 通海南洋',
  meta: [
    { name: 'description', content: () => (route.meta.description as string) || '' },
  ],
})

// Navigation Items
const navItems = [
  { id: 'corporate', key: 'corporate', icon: OfficeBuilding },
  { id: 'asset', key: 'asset', icon: Money },
  { id: 'identity', key: 'identity', icon: User },
  { id: 'education', key: 'education', icon: Reading },
  { id: 'brand', key: 'brand', icon: Ship },
  { id: 'tax', key: 'tax', icon: Document }
]

// Data
const corporateBasicServices = [0, 1, 2, 3, 4]

interface BankingData {
  bank: string
  requirement: string
}

const priorityBankingData = computed(() => {
    return tm('services.corporate.banking.priority.rows') as BankingData[]
})

const financialServices = [0, 1, 2, 3]
const realestateServices = [0, 1]
const singaporeIdentity = [0, 1, 2, 3, 4, 5]
const malaysiaIdentity = [0]
const educationPlanning = [0, 1]
const brandingServices = [0, 1, 2]
const valueServices = [0, 1, 2, 3]
const taxServices = [0, 1, 2, 3]

// Scroll Logic
const scrollToSection = (id: string) => {
  const element = document.getElementById(id)
  if (element) {
    const offset = 100 // Navbar height + padding
    const elementPosition = element.getBoundingClientRect().top
    const offsetPosition = elementPosition + window.pageYOffset - offset

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    })
    activeSection.value = id
  }
}

// Scroll Spy
let observer: IntersectionObserver | null = null

onMounted(() => {
  const options = {
    root: null,
    rootMargin: '-20% 0px -60% 0px', // Trigger when section enters middle of screen
    threshold: 0
  }

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        activeSection.value = entry.target.id
      }
    })
  }, options)

  const sections = document.querySelectorAll('.service-section')
  sections.forEach((section) => observer?.observe(section))
})

onUnmounted(() => {
  if (observer) {
    const sections = document.querySelectorAll('.service-section')
    sections.forEach((section) => observer?.unobserve(section))
    observer.disconnect()
  }
})

const goToContact = (): void => {
  router.push('/contact')
}
</script>

<style scoped>
/* Page Hero */
.page-hero {
  padding: 6rem 0;
  text-align: center;
  color: white;
  margin-bottom: 0;
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

/* Layout */
.main-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 4rem;
  padding-top: 4rem;
  padding-bottom: 4rem;
  align-items: start; /* Important for sticky sidebar */
}

/* Sidebar */
.sidebar-wrapper {
  position: sticky;
  top: 120px; /* Adjust based on navbar height */
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: 1rem 1.5rem;
  text-decoration: none;
  font-weight: 600;
  color: var(--color-text-muted);
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
}

.nav-item:hover {
  background: var(--color-bg-secondary);
  color: var(--color-primary);
}

.nav-item.active {
  background: linear-gradient(135deg, rgba(3, 105, 161, 0.1) 0%, rgba(3, 105, 161, 0.05) 100%);
  color: var(--color-accent);
  border-left: 3px solid var(--color-accent);
}

.nav-icon {
  font-size: 1.25rem;
}

/* Content Area */
.content-area {
  display: flex;
  flex-direction: column;
  gap: 6rem;
}

.service-section {
  scroll-margin-top: 120px; /* Offset for sticky header */
}

.section-header {
  margin-bottom: 3rem;
  border-bottom: 2px solid var(--color-bg-secondary);
  padding-bottom: 1.5rem;
}

.section-title {
  font-size: 2.25rem;
  font-weight: 800;
  color: var(--color-primary);
  margin-bottom: 1rem;
}

.section-intro {
  font-size: 1.125rem;
  color: var(--color-text-muted);
  line-height: 1.8;
}

/* Cards & Subsections */
.subsection {
  margin-bottom: 3rem;
}

.subsection-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.service-card {
  background: white;
  padding: 2rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100%;
  margin-bottom: 2rem;
}

.hover-lift:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-xl);
  border-color: var(--color-accent);
}

.card-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1.5rem;
  background: var(--color-bg-secondary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent);
  font-size: 1.75rem;
}

/* Feature Lists */
.feature-box {
  background: var(--color-bg-secondary);
  padding: 2rem;
  border-radius: var(--radius-lg);
  height: 100%;
}

.feature-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 1.5rem;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-list li {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1rem;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--color-text);
}

.feature-list .el-icon {
  color: #10B981; /* Success Green */
  margin-top: 4px;
  flex-shrink: 0;
}

/* Path Cards (Identity) */
.path-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 2.5rem;
  text-align: center;
  height: 100%;
  transition: all 0.3s ease;
}

.path-card:hover {
  box-shadow: var(--shadow-lg);
}

.path-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: white;
}

.path-icon.sg {
  background: linear-gradient(135deg, #FF4B2B 0%, #FF416C 100%);
  box-shadow: 0 10px 20px rgba(255, 75, 43, 0.3);
}

.path-icon.my {
  background: linear-gradient(135deg, #00C9FF 0%, #92FE9D 100%);
  box-shadow: 0 10px 20px rgba(0, 201, 255, 0.3);
}

.path-list {
  list-style: none;
  padding: 0;
  text-align: left;
  margin-top: 1.5rem;
}

.path-list li {
  padding: 0.75rem 0;
  border-bottom: 1px dashed var(--color-border);
  color: var(--color-text);
}

/* Education Grid */
.education-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 2rem;
}

.edu-card {
  padding: 2.5rem;
  border-radius: var(--radius-lg);
}

.edu-card.planning {
  background: white;
  border: 1px solid var(--color-border);
}

.edu-card.special {
  background: linear-gradient(135deg, var(--color-primary) 0%, #1e293b 100%);
  color: white;
}

.edu-card.special h3 {
  color: white;
  margin-bottom: 1rem;
}

/* Brand Grid */
.brand-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 3rem;
}

.brand-col h3 {
  font-size: 1.25rem;
  color: var(--color-accent);
  margin-bottom: 1.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.brand-list {
  list-style: none;
  padding: 0;
}

.brand-list li {
  margin-bottom: 1rem;
  display: flex;
  gap: 0.75rem;
}

/* CTA */
.cta-section {
  margin-top: 6rem;
  padding: 6rem 0;
}

.cta-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1rem;
}

.cta-subtitle {
  color: rgba(255,255,255,0.9);
  font-size: 1.25rem;
  margin-bottom: 2rem;
}

.cta-button {
  padding: 1.25rem 3rem;
  font-size: 1.125rem;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 1024px) {
  .main-layout {
    grid-template-columns: 1fr;
    gap: 3rem;
  }

  .sidebar-wrapper {
    position: relative;
    top: 0;
    z-index: 10;
  }

  .sidebar-nav {
    flex-direction: row;
    overflow-x: auto;
    padding-bottom: 0.5rem;
    -webkit-overflow-scrolling: touch;
  }

  .nav-item {
    flex-shrink: 0;
    white-space: nowrap;
  }

  .education-grid, .brand-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }
  
  .section-title {
    font-size: 1.75rem;
  }
}
</style>
