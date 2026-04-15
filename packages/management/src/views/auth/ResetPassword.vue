<template>
  <div class="reset-password">
    <div class="reset-password__card">
      <div class="reset-password__header">
        <h1 class="reset-password__title">设置新密码</h1>
        <p class="reset-password__subtitle">请输入您的新密码</p>
      </div>

      <el-form
        v-if="!success"
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="新密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="至少 8 位"
            size="large"
            show-password
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="再次输入新密码"
            size="large"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="reset-password__btn"
            :loading="loading"
            @click="handleSubmit"
          >
            重置密码
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 重置成功 -->
      <div v-else class="reset-password__success">
        <el-icon :size="48" color="#67c23a"><CircleCheck /></el-icon>
        <h2>密码重置成功</h2>
        <p>您的密码已更新，请使用新密码登录。</p>
        <el-button type="primary" @click="$router.push(loginPath)">前往登录</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { CircleCheck } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import apiClient from '@/api/apiClient'

const _props = withDefaults(defineProps<{
  loginPath?: string
}>(), {
  loginPath: '/login',
})

const route = useRoute()
const formRef = ref<FormInstance>()
const loading = ref(false)
const success = ref(false)

const form = reactive({
  password: '',
  confirmPassword: '',
})

const rules: FormRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, message: '密码至少 8 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== form.password) {
          callback(new Error('两次密码输入不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

async function handleSubmit(): Promise<void> {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    const token = route.query.token as string
    if (!token) {
      ElMessage.error('重置链接无效')
      return
    }
    loading.value = true
    try {
      await apiClient.post('/auth/reset-password', {
        token,
        password: form.password,
      })
      success.value = true
    } catch (err: any) {
      ElMessage.error(err?.message || '密码重置失败')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.reset-password {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #4a7cae 100%);
  padding: 2rem;
}

.reset-password__card {
  background: white;
  border-radius: 16px;
  padding: 3rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.reset-password__header {
  text-align: center;
  margin-bottom: 2rem;
}

.reset-password__title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e3a5f;
  margin: 0 0 0.5rem;
}

.reset-password__subtitle {
  color: #64748b;
  margin: 0;
}

.reset-password__btn {
  width: 100%;
  font-weight: 600;
}

.reset-password__success {
  text-align: center;
  padding: 1rem 0;
}

.reset-password__success h2 {
  font-size: 1.25rem;
  color: #1e3a5f;
  margin: 1rem 0 0.5rem;
}

.reset-password__success p {
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}
</style>
