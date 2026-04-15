<template>
  <div class="min-h-screen flex bg-obsidian font-sans selection-wealth">
    <!-- Left: Artistic/Brand Section (Hidden on mobile) -->
    <div class="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center bg-black">
      <!-- 背景渐变（替代被墙的 Unsplash 图片） -->
      <div class="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] opacity-80"></div>
      <div class="absolute inset-0 bg-gradient-to-r from-transparent to-obsidian"></div>
      
      <div class="relative z-10 p-12 max-w-lg">
        <h1 class="font-serif text-5xl text-white mb-6 leading-tight">
          Legacy & <br/>
          <span class="text-wealth italic">Prosperity</span>
        </h1>
        <p class="text-text-muted text-lg font-light leading-relaxed">
          {{ t('auth.signInPrompt') }}
        </p>
      </div>
    </div>

    <!-- Right: Login Form -->
    <div class="flex-1 flex items-center justify-center p-8 lg:p-24 relative">
      <!-- Decoration -->
      <div class="absolute top-0 right-0 p-8">
        <div class="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center">
            <span class="font-serif font-bold text-wealth">T</span>
        </div>
      </div>

      <div class="w-full max-w-md space-y-8 animate-fade-in-up">
        <div class="text-center lg:text-left">
          <h2 class="font-serif text-3xl text-text mb-2">{{ t('auth.welcomeBack') }}</h2>
          <p class="text-text-muted text-sm">{{ t('auth.signInPrompt') }}</p>
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          class="space-y-6"
          @submit.prevent="handleLogin"
        >
          <div class="space-y-4">
            <div class="group relative">
              <label class="block text-xs uppercase tracking-wider text-text-muted mb-1 ml-1 group-focus-within:text-wealth transition-colors">{{ t('auth.email') }}</label>
              <el-input
                v-model="form.email"
                placeholder="name@family.office"
                size="large"
                class="!h-12 login-input"
              >
                <template #prefix>
                   <Mail class="w-4 h-4 text-text-muted group-hover:text-text transition-colors" />
                </template>
              </el-input>
            </div>

            <div class="group relative">
               <label class="block text-xs uppercase tracking-wider text-text-muted mb-1 ml-1 group-focus-within:text-wealth transition-colors">{{ t('auth.password') }}</label>
              <el-input
                v-model="form.password"
                type="password"
                placeholder="••••••••"
                size="large"
                show-password
                class="!h-12 login-input"
                @keyup.enter="handleLogin"
              >
                <template #prefix>
                   <Lock class="w-4 h-4 text-text-muted group-hover:text-text transition-colors" />
                </template>
              </el-input>
            </div>
          </div>

          <button
            type="button"
            class="w-full h-12 bg-wealth hover:bg-[#B49248] text-obsidian font-bold uppercase tracking-wider text-sm rounded transition-all duration-300 transform active:scale-[0.98] focus:ring-2 focus:ring-wealth/50 focus:outline-none flex items-center justify-center gap-2"
            :disabled="loading"
            @click="handleLogin"
          >
            <span v-if="loading">{{ t('auth.verifying') }}</span>
            <span v-else>{{ t('auth.login') }}</span>
            <ArrowRight v-if="!loading" class="w-4 h-4" />
          </button>
        </el-form>

        <p class="text-center text-xs text-text-muted/50 mt-8">
          通海南洋 · 安全加密连接 <br/>
          By accessing, you agree to our strict confidentiality terms.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Mail, Lock, ArrowRight } from 'lucide-vue-next'
import { useAuthStore } from '@/stores'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { t } = useI18n()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  email: '',
  password: '',
})

const rules: FormRules = {
  email: [
    { required: true, message: t('validation.required'), trigger: 'blur' },
    { type: 'email', message: t('validation.invalidFormat'), trigger: 'blur' },
  ],
  password: [
    { required: true, message: t('validation.required'), trigger: 'blur' },
    { min: 6, message: t('validation.minChars', { min: 6 }), trigger: 'blur' },
  ],
}

async function handleLogin(): Promise<void> {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    loading.value = true
    try {
      await authStore.login({
        email: form.email,
        password: form.password,
      })
      
      ElMessage.success(t('auth.loginSuccess'))
      const redirect = route.query.redirect as string
      router.push(redirect || '/dashboard')
    } catch (error: unknown) {
      ElMessage.error((error as Error).message || t('auth.authFailed'))
    } finally {
      loading.value = false
    }
  })
}
</script>

<style>
/* Override Element Input Styles for Dark Theme */
.login-input {
  --el-input-bg-color: rgba(255, 255, 255, 0.03) !important;
  --el-input-border-color: rgba(255, 255, 255, 0.1) !important;
  --el-input-text-color: #F8FAFC !important;
  --el-input-placeholder-color: #64748B !important;
  --el-input-hover-border-color: rgba(214, 181, 110, 0.5) !important;
  --el-input-focus-border-color: #D6B56E !important;
}

.login-input .el-input__wrapper {
  box-shadow: none !important;
  border-radius: 2px !important; /* Sharp corners */
}
</style>
