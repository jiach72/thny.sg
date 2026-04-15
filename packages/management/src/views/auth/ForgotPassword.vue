<template>
  <div class="forgot-password">
    <div class="forgot-password__card">
      <div class="forgot-password__header">
        <h1 class="forgot-password__title">忘记密码</h1>
        <p class="forgot-password__subtitle">输入您的注册邮箱，我们将发送重置链接</p>
      </div>

      <!-- 发送重置邮件表单 -->
      <el-form
        v-if="!sent"
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="邮箱地址" prop="email">
          <el-input
            v-model="form.email"
            type="email"
            placeholder="your@email.com"
            size="large"
            :prefix-icon="Message"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="forgot-password__btn"
            :loading="loading"
            @click="handleSubmit"
          >
            发送重置链接
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 发送成功提示 -->
      <div v-else class="forgot-password__success">
        <el-icon :size="48" color="#67c23a"><CircleCheck /></el-icon>
        <h2>邮件已发送</h2>
        <p>如果该邮箱已注册，您将收到一封密码重置邮件。请检查收件箱（包括垃圾邮件）。</p>
        <el-button type="primary" @click="$router.push(loginPath)">返回登录</el-button>
      </div>

      <div class="forgot-password__footer">
        <router-link :to="loginPath">← 返回登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Message, CircleCheck } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import apiClient from '@/api/apiClient'

const _props = withDefaults(defineProps<{
  loginPath?: string
}>(), {
  loginPath: '/login',
})

const formRef = ref<FormInstance>()
const loading = ref(false)
const sent = ref(false)

const form = reactive({ email: '' })

const rules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱格式', trigger: 'blur' },
  ],
}

async function handleSubmit(): Promise<void> {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      await apiClient.post('/auth/forgot-password', { email: form.email })
      sent.value = true
    } catch (err: any) {
      ElMessage.error(err?.message || '发送失败，请稍后重试')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.forgot-password {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #4a7cae 100%);
  padding: 2rem;
}

.forgot-password__card {
  background: white;
  border-radius: 16px;
  padding: 3rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.forgot-password__header {
  text-align: center;
  margin-bottom: 2rem;
}

.forgot-password__title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e3a5f;
  margin: 0 0 0.5rem;
}

.forgot-password__subtitle {
  color: #64748b;
  margin: 0;
}

.forgot-password__btn {
  width: 100%;
  font-weight: 600;
}

.forgot-password__success {
  text-align: center;
  padding: 1rem 0;
}

.forgot-password__success h2 {
  font-size: 1.25rem;
  color: #1e3a5f;
  margin: 1rem 0 0.5rem;
}

.forgot-password__success p {
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.forgot-password__footer {
  text-align: center;
  margin-top: 1.5rem;
}

.forgot-password__footer a {
  color: #3b82f6;
  text-decoration: none;
  font-size: 0.875rem;
}

.forgot-password__footer a:hover {
  text-decoration: underline;
}
</style>
