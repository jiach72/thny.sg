<template>
  <div class="contact-page">
    <!-- Page Hero -->
    <section class="page-hero gradient-bg">
      <div class="container">
        <h1 class="page-title">{{ t('contact.pageTitle') }}</h1>
        <p class="page-subtitle">{{ t('contact.pageSubtitle') }}</p>
      </div>
    </section>

    <!-- Contact Form & Info -->
    <section class="section contact-section">
      <div class="container">
        <el-row :gutter="48">
          <!-- Contact Form -->
          <el-col :lg="14" :md="24">
            <div class="contact-form-wrapper">
              <h2 class="form-title">{{ t('contact.form.title') }}</h2>
              <p class="form-subtitle">{{ t('contact.form.subtitle') }}</p>
              
              <el-form 
                ref="contactFormRef"
                :model="contactForm" 
                :rules="formRules"
                label-position="top"
                class="contact-form"
                @submit.prevent="handleSubmit"
              >
                <el-form-item :label="t('contact.form.name')" prop="name">
                  <el-input 
                    v-model="contactForm.name" 
                    :placeholder="t('contact.form.namePlaceholder')"
                    size="large"
                  />
                </el-form-item>

                <el-form-item :label="t('contact.form.company')" prop="company">
                  <el-input 
                    v-model="contactForm.company" 
                    :placeholder="t('contact.form.companyPlaceholder')"
                    size="large"
                  />
                </el-form-item>

                <el-form-item :label="t('contact.form.services.label')" prop="services">
                  <el-checkbox-group v-model="contactForm.services">
                    <el-checkbox value="corporate">{{ t('contact.form.services.corporate') }}</el-checkbox>
                    <el-checkbox value="identity">{{ t('contact.form.services.identity') }}</el-checkbox>
                    <el-checkbox value="asset">{{ t('contact.form.services.asset') }}</el-checkbox>
                    <el-checkbox value="education">{{ t('contact.form.services.education') }}</el-checkbox>
                    <el-checkbox value="other">{{ t('contact.form.services.other') }}</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>

                <el-form-item :label="t('contact.form.timeline.label')" prop="timeline">
                  <el-radio-group v-model="contactForm.timeline">
                    <el-radio value="1month">{{ t('contact.form.timeline.1month') }}</el-radio>
                    <el-radio value="3months">{{ t('contact.form.timeline.3months') }}</el-radio>
                    <el-radio value="6months">{{ t('contact.form.timeline.6months') }}</el-radio>
                    <el-radio value="exploring">{{ t('contact.form.timeline.exploring') }}</el-radio>
                  </el-radio-group>
                </el-form-item>

                <el-form-item :label="t('contact.form.contactMethod.label')" prop="contactMethod">
                  <el-input 
                    v-model="contactForm.contactMethod" 
                    :placeholder="t('contact.form.contactMethod.placeholder')"
                    size="large"
                  />
                </el-form-item>

                <el-form-item :label="t('contact.form.message.label')" prop="message">
                  <el-input 
                    v-model="contactForm.message" 
                    type="textarea"
                    :rows="4"
                    :placeholder="t('contact.form.message.placeholder')"
                  />
                </el-form-item>

                <el-form-item>
                  <el-button 
                    type="primary" 
                    size="large" 
                    class="submit-button"
                    :loading="submitting"
                    @click="handleSubmit"
                  >
                    {{ t('contact.form.submit') }}
                  </el-button>
                </el-form-item>
              </el-form>
            </div>
          </el-col>

          <!-- Contact Info -->
          <el-col :lg="10" :md="24">
            <div class="contact-info-wrapper">
              <div class="contact-info-card card">
                <h3>{{ t('contact.info.title') }}</h3>
                
                <div class="info-item">
                  <el-icon class="info-icon"><Location /></el-icon>
                  <div>
                    <h4>{{ t('contact.info.address.title') }}</h4>
                    <p>{{ t('contact.info.address.content') }}</p>
                  </div>
                </div>

                <div class="info-item">
                  <el-icon class="info-icon"><Message /></el-icon>
                  <div>
                    <h4>{{ t('contact.info.email.title') }}</h4>
                    <p><a href="mailto:admin@thny.sg">admin@thny.sg</a></p>
                  </div>
                </div>

                <div class="info-item">
                  <el-icon class="info-icon"><Clock /></el-icon>
                  <div>
                    <h4>{{ t('contact.info.hours.title') }}</h4>
                    <p>{{ t('contact.info.hours.content') }}</p>
                  </div>
                </div>
              </div>

              <div class="why-contact card">
                <h4>{{ t('contact.why.title') }}</h4>
                <ul>
                  <li v-for="(item, index) in whyItems" :key="index">
                    <el-icon><Check /></el-icon><span>{{ item }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Location, Message, Clock, Check } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

import apiClient from '../api/apiClient'

const { t, tm } = useI18n()

interface ContactForm {
  name: string
  company: string
  services: string[]
  timeline: string
  contactMethod: string
  message: string
}

const contactFormRef = ref<FormInstance>()
const submitting = ref(false)

const contactForm = reactive<ContactForm>({
  name: '',
  company: '',
  services: [],
  timeline: '',
  contactMethod: '',
  message: ''
})

const formRules = computed<FormRules>(() => ({
  name: [
    { required: true, message: t('contact.form.validation.name'), trigger: 'blur' }
  ],
  contactMethod: [
    { required: true, message: t('contact.form.validation.contactMethod'), trigger: 'blur' }
  ],
  services: [
    { required: true, message: t('contact.form.validation.services'), trigger: 'change' }
  ]
}))

const whyItems = computed(() => {
    return tm('contact.why.items') as string[]
})

const handleSubmit = async (): Promise<void> => {
  if (!contactFormRef.value) return

  await contactFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      
      try {
        // 映射数据到后端 Webhook 格式
        const payload = {
          name: contactForm.name,
          email: contactForm.contactMethod.includes('@') ? contactForm.contactMethod : '',
          phone: !contactForm.contactMethod.includes('@') ? contactForm.contactMethod : '',
          company: contactForm.company,
          services: contactForm.services,
          message: `[期望时间: ${contactForm.timeline}] ${contactForm.message}`
        }

        const response = (await apiClient.post('/leads/webhook', payload)) as any
        
        // apiClient 返回 Body
        // Body: { success: true/false, message: ... }
        if (response.success) {
          ElMessage.success(t('contact.form.successMessage'))
          contactFormRef.value?.resetFields()
        } else {
          throw new Error(response.message || 'Error')
        }
      } catch (error: any) {
        console.error('Submission error:', error)
        ElMessage.error(error.message || t('contact.form.errorMessage'))
      } finally {
        submitting.value = false
      }
    } else {
      ElMessage.error(t('contact.form.errorMessage'))
    }
  })
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

/* Contact Section */
.contact-section {
  background: var(--color-bg);
}

.contact-form-wrapper {
  background: white;
  padding: var(--spacing-2xl);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

.form-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: var(--spacing-sm);
}

.form-subtitle {
  font-size: 1rem;
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-2xl);
  line-height: 1.6;
}

.contact-form .el-form-item {
  margin-bottom: var(--spacing-lg);
}

.contact-form :deep(.el-form-item__label) {
  font-weight: 600;
  color: var(--color-primary);
}

.contact-form :deep(.el-checkbox) {
  display: block;
  margin-bottom: var(--spacing-sm);
}

.contact-form :deep(.el-radio) {
  display: block;
  margin-bottom: var(--spacing-sm);
}

.submit-button {
  width: 100%;
  padding: 16px;
  font-size: 1.125rem;
  font-weight: 600;
}

/* Contact Info */
.contact-info-wrapper {
  position: sticky;
  top: 100px;
}

.contact-info-card {
  padding: var(--spacing-2xl);
  margin-bottom: var(--spacing-lg);
}

.contact-info-card h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: var(--spacing-xl);
}

.info-item {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-icon {
  width: 48px;
  height: 48px;
  background: rgba(3, 105, 161, 0.1);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent);
  font-size: 1.5rem;
  flex-shrink: 0;
}

.info-item h4 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: var(--spacing-xs);
}

.info-item p {
  color: var(--color-text-muted);
  line-height: 1.6;
  margin: 0;
}

.info-item a {
  color: var(--color-accent);
  text-decoration: none;
  transition: color 0.2s ease;
}

.info-item a:hover {
  color: var(--color-accent-hover);
}

/* Why Contact */
.why-contact {
  padding: var(--spacing-xl);
  background: linear-gradient(135deg, rgba(3, 105, 161, 0.05) 0%, rgba(245, 158, 11, 0.02) 100%);
  border-left: 4px solid var(--color-accent);
}

.why-contact h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: var(--spacing-md);
}

.why-contact ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.why-contact li {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  color: var(--color-text);
  line-height: 1.6;
}

.why-contact li:last-child {
  margin-bottom: 0;
}

.why-contact .el-icon {
  color: var(--color-accent);
  font-size: 1.125rem;
  margin-top: 2px;
  flex-shrink: 0;
}

/* Responsive */
@media (max-width: 1024px) {
  .contact-info-wrapper {
    position: static;
    margin-top: var(--spacing-2xl);
  }
}

@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }

  .form-title {
    font-size: 1.5rem;
  }

  .contact-form-wrapper {
    padding: var(--spacing-lg);
  }

  .contact-info-card {
    padding: var(--spacing-lg);
  }
}
</style>
