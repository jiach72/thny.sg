<template>
  <div class="setup-page">
    <div class="setup-container">
      <div class="setup-left">
        <div class="brand">
          <h1>通海南洋</h1>
          <p>设置您的登录密码</p>
        </div>
        <div class="features">
          <div class="feature-item">
            <el-icon size="24"><Check /></el-icon>
            <span>首次登录请设置密码</span>
          </div>
          <div class="feature-item">
            <el-icon size="24"><Check /></el-icon>
            <span>密码至少8位字符</span>
          </div>
          <div class="feature-item">
            <el-icon size="24"><Check /></el-icon>
            <span>设置完成后自动登录</span>
          </div>
        </div>
      </div>

      <div class="setup-right">
        <div class="setup-box" v-loading="validating">
          <template v-if="tokenValid">
            <h2>欢迎，{{ userInfo.name }}</h2>
            <p class="subtitle">请设置您的登录密码</p>

            <el-form
              ref="formRef"
              :model="form"
              :rules="rules"
              class="setup-form"
              @submit.prevent="handleSetup"
            >
              <el-form-item prop="password">
                <el-input
                  v-model="form.password"
                  type="password"
                  placeholder="设置密码"
                  size="large"
                  :prefix-icon="Lock"
                  show-password
                />
              </el-form-item>

              <el-form-item prop="confirmPassword">
                <el-input
                  v-model="form.confirmPassword"
                  type="password"
                  placeholder="确认密码"
                  size="large"
                  :prefix-icon="Lock"
                  show-password
                  @keyup.enter="handleSetup"
                />
              </el-form-item>

              <el-form-item>
                <el-button
                  type="primary"
                  size="large"
                  :loading="loading"
                  class="setup-button"
                  @click="handleSetup"
                >
                  设置密码并登录
                </el-button>
              </el-form-item>
            </el-form>
          </template>

          <template v-else-if="!validating">
            <div class="error-state">
              <el-icon size="64" color="#f56c6c"><Warning /></el-icon>
              <h2>链接无效或已过期</h2>
              <p>请联系您的客户顾问获取新的登录链接</p>
              <el-button type="primary" @click="$router.push('/login')">返回登录</el-button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Lock, Check, Warning } from '@element-plus/icons-vue'
import { authApi } from '@/api'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const validating = ref(true)
const tokenValid = ref(false)
const userInfo = ref({ name: '', email: '' })

const form = reactive({
  password: '',
  confirmPassword: ''
})

const validateConfirmPassword = (_rule: any, value: string, callback: (error?: string | Error) => void) => {
  if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules: FormRules = {
  password: [
    { required: true, message: '请设置密码', trigger: 'blur' },
    { min: 8, message: '密码至少8个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

onMounted(async () => {
  const token = route.query.token as string
  if (!token) {
    validating.value = false
    return
  }

  try {
    const response = await authApi.validateSetupToken(token)
    if (response.data.valid) {
      tokenValid.value = true
      userInfo.value = {
        name: response.data.name,
        email: response.data.email
      }
    }
  } catch {
    tokenValid.value = false
  } finally {
    validating.value = false
  }
})

const handleSetup = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      const token = route.query.token as string
      const response = await authApi.setupPassword(token, form.password)
      
      if (response.data.success) {
        // 自动登录
        authStore.setTokens(response.data.accessToken, response.data.refreshToken)
        authStore.setUser(response.data.user)
        
        ElMessage.success('密码设置成功，即将跳转...')
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      }
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || '设置密码失败')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.setup-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f2027 0%, #1a3a4a 50%, #2c5364 100%);
}

.setup-container {
  display: flex;
  min-height: 100vh;
}

.setup-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 80px;
  color: white;
}

.brand h1 {
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #fff 0%, #a8d8ea 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand p {
  font-size: 1.25rem;
  opacity: 0.9;
}

.features {
  margin-top: 64px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  font-size: 1.125rem;
  opacity: 0.9;
}

.feature-item .el-icon {
  color: #67c23a;
}

.setup-right {
  width: 520px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.setup-box {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 16px;
  padding: 48px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.setup-box h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #0f2027;
  margin-bottom: 8px;
}

.subtitle {
  color: #666;
  margin-bottom: 32px;
}

.setup-form .el-form-item {
  margin-bottom: 24px;
}

.setup-button {
  width: 100%;
  padding: 14px;
  font-size: 1rem;
  font-weight: 600;
}

.error-state {
  text-align: center;
  padding: 24px 0;
}

.error-state h2 {
  margin-top: 16px;
  color: #303133;
}

.error-state p {
  color: #909399;
  margin: 8px 0 24px;
}

/* Responsive */
@media (max-width: 960px) {
  .setup-container {
    flex-direction: column;
  }

  .setup-left {
    padding: 40px 24px;
  }

  .setup-right {
    width: 100%;
    padding: 24px;
  }

  .setup-box {
    padding: 32px 24px;
  }
}
</style>
