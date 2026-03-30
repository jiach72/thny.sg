<template>
  <footer class="footer">
    <div class="container footer-container">
      <!-- Company Info -->
      <div class="footer-section footer-brand">
        <div class="brand">
          <img src="/logo.png" alt="通海南洋 LOGO" class="logo-img" />
          <span class="logo-text">{{ $t('footer.companyName') }}</span>
        </div>
        <p class="tagline">{{ $t('footer.tagline') }}</p>
        <p class="disclaimer">{{ $t('footer.disclaimer') }}</p>
      </div>

      <!-- Quick Links -->
      <div class="footer-section">
        <h4 class="footer-title">{{ $t('footer.quickLinks') }}</h4>
        <ul class="footer-links">
          <li><router-link to="/" class="footer-link">{{ $t('nav.home') }}</router-link></li>
          <li><router-link to="/services" class="footer-link">{{ $t('nav.services') }}</router-link></li>
          <li><router-link to="/industries" class="footer-link">{{ $t('nav.industries') }}</router-link></li>
          <li><router-link to="/about" class="footer-link">{{ $t('nav.about') }}</router-link></li>
        </ul>
      </div>

      <!-- Contact Info -->
      <div class="footer-section">
        <h4 class="footer-title">{{ $t('footer.contactInfo') }}</h4>
        <ul class="footer-links">
          <li><router-link to="/team" class="footer-link">{{ $t('nav.team') }}</router-link></li>
          <li><router-link to="/contact" class="footer-link">{{ $t('nav.contact') }}</router-link></li>
        </ul>
      </div>
    </div>

    <!-- Copyright -->
    <div class="footer-bottom">
      <div class="container">
        <p class="copyright">{{ $t('footer.copyright') }}</p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
// 使用vue-i18n的$t在template中自动可用
</script>

<style scoped>
.footer {
  background: var(--color-primary);
  color: white;
  padding-top: var(--spacing-3xl);
}

.footer-container {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: var(--spacing-2xl);
  padding-bottom: var(--spacing-2xl);
}

.footer-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

/* Brand Section */
.footer-brand {
  max-width: 400px;
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.logo-img {
  height: 36px;
  width: auto;
  object-fit: contain;
}

.logo-text {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
}

.tagline {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: var(--spacing-md);
}

.disclaimer {
  font-size: 0.875rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.7);
}

/* Footer Links */
.footer-title {
  font-family: var(--font-heading);
  font-size: 1.125rem;
  font-weight: 600;
  color: white;
  margin: 0 0 var(--spacing-md) 0;
}

.footer-links {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.footer-link {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: color 0.2s ease;
  font-size: 0.9375rem;
}

.footer-link:hover {
  color: white;
}

/* Footer Bottom */
.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: var(--spacing-lg) 0;
}

.copyright {
  text-align: center;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

/* Responsive */
@media (max-width: 1024px) {
  .footer-container {
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-xl);
  }

  .footer-brand {
    grid-column: 1 / -1;
    max-width: 100%;
  }
}

@media (max-width: 768px) {
  .footer {
    padding-top: var(--spacing-2xl);
  }

  .footer-container {
    grid-template-columns: 1fr;
    gap: var(--spacing-xl);
  }

  .footer-brand {
    grid-column: 1;
  }
}
</style>
