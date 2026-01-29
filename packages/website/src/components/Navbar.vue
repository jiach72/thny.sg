<template>
  <nav class="navbar">
    <div class="container navbar-container">
      <!-- Logo -->
      <router-link to="/" class="brand">
        <div class="logo-icon">
          <span>TH</span>
        </div>
        <span class="logo-text">{{ $t('nav.brand') }}</span>
      </router-link>

      <!-- Desktop Navigation -->
      <div class="nav-menu" :class="{ 'nav-menu-open': mobileMenuOpen }">
        <router-link 
          v-for="item in navItems" 
          :key="item.path"
          :to="item.path"
          class="nav-link"
          active-class="nav-link-active"
          @click="closeMobileMenu"
        >
          {{ $t(item.label) }}
        </router-link>
      </div>

      <!-- Right Actions -->
      <div class="nav-actions">
        <LanguageSwitcher />
        <el-button text @click="openClientPortal">
          {{ $t('nav.clientPortal') }}
        </el-button>


        
        <!-- Mobile Menu Toggle -->
        <button class="mobile-menu-toggle" @click="toggleMobileMenu" aria-label="Toggle menu">
          <svg v-if="!mobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
          <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import LanguageSwitcher from './LanguageSwitcher.vue'

const mobileMenuOpen = ref(false)

const openClientPortal = () => {
  window.open('http://localhost:3002', '_blank')
}

interface NavItem {
  path: string
  label: string
}

const navItems: NavItem[] = [
  { path: '/', label: 'nav.home' },
  { path: '/services', label: 'nav.services' },
  { path: '/industries', label: 'nav.industries' },
  { path: '/about', label: 'nav.about' },
  { path: '/team', label: 'nav.team' },
  { path: '/contact', label: 'nav.contact' }
]

const toggleMobileMenu = (): void => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = (): void => {
  mobileMenuOpen.value = false
}
</script>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.navbar-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  gap: var(--spacing-lg);
}

/* Logo */
.brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.brand:hover {
  opacity: 0.8;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-gold) 100%);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-heading);
  font-weight: 800;
  font-size: 1.125rem;
  color: white;
}

.logo-text {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary);
}

/* Navigation Menu */
.nav-menu {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  flex: 1;
  justify-content: center;
}

.nav-link {
  font-family: var(--font-body);
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text);
  text-decoration: none;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
  position: relative;
}

.nav-link:hover {
  color: var(--color-accent);
  background-color: rgba(3, 105, 161, 0.05);
}

.nav-link-active {
  color: var(--color-accent);
  font-weight: 600;
}

.nav-link-active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: var(--spacing-md);
  right: var(--spacing-md);
  height: 2px;
  background: var(--color-accent);
  border-radius: 2px;
}

/* Right Actions */
.nav-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.cta-button {
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

.mobile-menu-toggle {
  display: none;
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  padding: var(--spacing-xs);
}

.mobile-menu-toggle svg {
  width: 24px;
  height: 24px;
}

/* Mobile Responsive */
@media (max-width: 1024px) {
  .nav-menu {
    position: fixed;
    top: 70px;
    left: 0;
    right: 0;
    flex-direction: column;
    background: white;
    padding: var(--spacing-lg);
    box-shadow: var(--shadow-lg);
    transform: translateY(-100%);
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    gap: var(--spacing-sm);
    /* 触摸滚动优化 */
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }

  .nav-menu-open {
    transform: translateY(0);
    opacity: 1;
    visibility: visible;
  }

  .nav-link {
    width: 100%;
    text-align: center;
    padding: var(--spacing-md);
  }

  .mobile-menu-toggle {
    display: block;
    /* 触控友好的点击区域 - 44x44px 最小 */
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cta-button {
    display: none;
  }
}

@media (max-width: 768px) {
  .logo-text {
    font-size: 1.125rem;
  }

  .nav-actions {
    gap: var(--spacing-sm);
  }
}
</style>
