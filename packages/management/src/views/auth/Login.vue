<template>
  <div class="login-page" v-loading="initCheckLoading">
    <div class="login-container" v-show="!initCheckLoading">
      <div class="login-header">
        <h1>通海南洋CRM</h1>
        <p>客户关系管理系统</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="email">
          <el-input
            v-model="form.email"
            placeholder="邮箱地址"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <div class="login-options">
            <el-checkbox v-model="form.rememberMe">记住我</el-checkbox>
            <router-link to="/forgot-password" class="forgot-link">忘记密码？</router-link>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="login-button"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores'
import { logger } from '@/utils/logger'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const initCheckLoading = ref(true)

onMounted(async () => {
  try {
    // 验证是否需要拉起首次初始化的 Setup 向导
    const { default: apiClient } = await import('@/api/apiClient')
    const res: any = await apiClient.get('/system/status')
    // 兼容取值路径
    const isInit = res?.data?.data?.isInitialized ?? res?.data?.isInitialized ?? res?.isInitialized ?? true
    if (!isInit) {
      router.replace('/setup')
    }
  } catch (error) {
    logger.error('Login', 'System status check fail', error)
  } finally {
    initCheckLoading.value = false
  }
})

const form = reactive({
  email: '',
  password: '',
  rememberMe: true,
})

const rules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6个字符', trigger: 'blur' },
  ],
}

async function handleLogin() {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    loading.value = true
    try {
      await authStore.login({
        email: form.email,
        password: form.password,
        rememberMe: form.rememberMe,
      })
      
      ElMessage.success('登录成功')
      
      // 跳转到目标页面
      const redirect = route.query.redirect as string
      router.push(redirect || '/dashboard')
    } catch (error: any) {
      ElMessage.error((error as Error).message || '登录失败，请检查邮箱和密码')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #F8FAFC;
  background-image: 
    radial-gradient(circle at 0% 0%, rgba(8, 145, 178, 0.05) 0%, transparent 40%),
    radial-gradient(circle at 100% 100%, rgba(245, 158, 11, 0.05) 0%, transparent 40%);
  position: relative;
  overflow: hidden;
}

.login-page::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  opacity: 0.02;
  pointer-events: none;
}

.login-container {
  width: 440px;
  padding: 50px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: var(--radius-lg);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02);
  z-index: 1;
}

.login-header {
  text-align: center;
  margin-bottom: 48px;
}

.login-header h1 {
  font-size: 32px;
  font-weight: 800;
  color: var(--color-primary);
  margin: 0 0 12px;
  letter-spacing: -0.02em;
}

.login-header p {
  font-size: 15px;
  color: var(--color-text-muted);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

:deep(.el-input__wrapper) {
  background-color: var(--color-surface) !important;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
  border: 1px solid var(--color-border) !important;
  border-radius: var(--radius-md) !important;
  padding: 8px 16px;
}

:deep(.el-input__wrapper.is-focus) {
  border-color: var(--color-primary) !important;
}

:deep(.el-input__inner) {
  color: var(--color-text) !important;
  height: 48px;
}

:deep(.el-checkbox__label) {
  color: var(--color-text-muted);
}

.login-button {
  width: 100%;
  height: 52px;
  font-size: 16px;
  letter-spacing: 0.05em;
  margin-top: 12px;
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.forgot-link {
  color: var(--color-primary);
  font-size: 13px;
  text-decoration: none;
}

.forgot-link:hover {
  text-decoration: underline;
}
</style>
