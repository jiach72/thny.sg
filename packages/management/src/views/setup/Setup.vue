<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import apiClient from '@/api/apiClient'

const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)
const checking = ref(true)

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const validatePass2 = (_rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== form.password) {
    callback(new Error('两次输入密码不一致!'))
  } else {
    callback()
  }
}

const rules = reactive<FormRules>({
  name: [{ required: true, message: '请输入管理员姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入电子邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的电子邮箱地址', trigger: ['blur', 'change'] },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, message: '密码长度不能小于8位', trigger: 'blur' },
    { pattern: /[A-Z]/, message: '密码需包含至少一个大写字母', trigger: 'blur' },
    { pattern: /[a-z]/, message: '密码需包含至少一个小写字母', trigger: 'blur' },
    { pattern: /[0-9]/, message: '密码需包含至少一个数字', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, validator: validatePass2, trigger: 'blur' },
  ],
})

onMounted(async () => {
  try {
    const res = await apiClient.get('/system/status')
    // 注意，apiClient 通常会自动解包 axios res.data，具体取决于封装，为了安全我们按数据结构找 isInitialized
    const isInit = res.data?.data?.isInitialized || res.data?.isInitialized || res.isInitialized
    if (isInit) {
      ElMessage.info('系统已初始化，即将跳转至登录页')
      router.replace('/login')
    } else {
      checking.value = false
    }
  } catch (err) {
    ElMessage.error('无法检查系统状态，请确保后端服务正常运行')
    checking.value = false
  }
})

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await apiClient.post('/system/init', {
          name: form.name,
          email: form.email,
          password: form.password,
        })
        ElMessage.success('超级管理员创建成功！请使用新账号登录')
        router.push('/login')
      } catch (err: any) {
        ElMessage.error(err?.message || '初始化失败，请稍后重试')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<template>
  <div class="setup-container" v-loading="checking" element-loading-text="正在检查系统状态...">
    <div class="setup-box" v-if="!checking">
      <div class="setup-header">
        <div class="logo">
          <h1>通海南洋 CRM</h1>
        </div>
        <h2>系统初始化</h2>
        <p>欢迎使用此系统，检测到这是首次启动，请创建超级管理员账户。</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        size="large"
        @keyup.enter="handleSubmit"
      >
        <el-form-item label="管理员姓名" prop="name">
          <el-input v-model="form.name" placeholder="管理端显示的称呼" />
        </el-form-item>

        <el-form-item label="电子邮箱 (登录账号)" prop="email">
          <el-input v-model="form.email" placeholder="admin@example.com" />
        </el-form-item>

        <el-form-item label="设置密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="至少 8 位，包含大小写英文字母及数字"
            show-password
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入您的密码"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="submit-button"
            :loading="loading"
            @click="handleSubmit"
          >
            完成初始化
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.setup-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--color-bg-secondary);
}

.setup-box {
  width: 100%;
  max-width: 480px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
  padding: 40px;
}

.setup-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
}

.logo img {
  height: 32px;
}

.logo h1 {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.setup-header h2 {
  font-size: 20px;
  margin-bottom: 8px;
  color: var(--color-text-primary);
}

.setup-header p {
  color: var(--color-text-regular);
  font-size: 14px;
  line-height: 1.5;
}

.submit-button {
  width: 100%;
  margin-top: 16px;
}
</style>
