<template>
  <div class="ai-settings">
    <div class="page-header">
      <h1>AI 模型配置</h1>
      <p class="subtitle">配置聊天机器人的 AI 服务提供商和参数</p>
    </div>

    <el-card class="settings-card">
      <el-form :model="form" label-width="120px" v-loading="loading">
        <el-form-item label="模型提供商">
          <el-select v-model="form.provider" placeholder="选择提供商" style="width: 100%" @change="handleProviderChange">
            <el-option label="OpenAI" value="OPENAI" />
            <el-option label="Anthropic" value="ANTHROPIC" />
            <el-option label="Google Gemini" value="GEMINI" />
            <el-option label="DeepSeek" value="DEEPSEEK" />
            <el-option label="自定义 (OpenAI 兼容)" value="CUSTOM" />
          </el-select>
        </el-form-item>

        <el-form-item label="API Key" required>
          <el-input v-model="form.apiKey" type="password" show-password placeholder="sk-..." />
        </el-form-item>

        <el-form-item label="模型名称">
          <el-input v-model="form.modelName" placeholder="例如: gpt-4o-mini" />
          <div class="form-tip">当前使用的模型标识符</div>
        </el-form-item>

        <el-form-item label="代理地址">
          <el-input v-model="form.baseUrl" placeholder="可选，例如: https://api.openai-proxy.com/v1" />
          <div class="form-tip">如果需要通过代理访问 API，请在此配置 Base URL</div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="saveSettings" :loading="saving">保存配置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="info-section">
      <h3>配置说明</h3>
      <ul>
        <li>**OpenAI**: 默认模型建议使用 `gpt-4o-mini` 或 `gpt-3.5-turbo`。</li>
        <li>**DeepSeek**: 使用 `deepseek-chat`，Base URL 请设置为 `https://api.deepseek.com`。</li>
        <li>**自定义**: 任何兼容 OpenAI 接口规范的服务均可使用。</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const loading = ref(false)
const saving = ref(false)

const form = ref({
  provider: 'OPENAI',
  apiKey: '',
  modelName: 'gpt-4o-mini',
  baseUrl: ''
})

const apiBase = import.meta.env.VITE_API_BASE_URL || ''

async function fetchSettings() {
  loading.value = true
  try {
    const response = await axios.get(`${apiBase}/api/v1/settings/ai`)
    if (response.data.success) {
      const data = response.data.data
      form.value = {
        provider: data.AI_PROVIDER || 'OPENAI',
        apiKey: data.AI_API_KEY || '',
        modelName: data.AI_MODEL_NAME || 'gpt-4o-mini',
        baseUrl: data.AI_BASE_URL || ''
      }
    }
  } catch (error) {
    ElMessage.error('加载配置失败')
  } finally {
    loading.value = false
  }
}

async function saveSettings() {
  if (!form.value.apiKey) {
    ElMessage.warning('请输入 API Key')
    return
  }

  saving.value = true
  try {
    await axios.post(`${apiBase}/api/v1/settings/ai`, {
      provider: form.value.provider,
      apiKey: form.value.apiKey,
      modelName: form.value.modelName,
      baseUrl: form.value.baseUrl
    })
    ElMessage.success('配置已保存')
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

function handleProviderChange(val: string) {
  // 预设默认值（模型名称和代理地址）
  const presets: Record<string, { modelName: string; baseUrl: string }> = {
    OPENAI: {
      modelName: 'gpt-4o-mini',
      baseUrl: ''
    },
    ANTHROPIC: {
      modelName: 'claude-3-haiku-20240307',
      baseUrl: 'https://api.anthropic.com'
    },
    GEMINI: {
      modelName: 'gemini-2.0-flash',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai'
    },
    DEEPSEEK: {
      modelName: 'deepseek-chat',
      baseUrl: 'https://api.deepseek.com'
    },
    CUSTOM: {
      modelName: '',
      baseUrl: ''
    }
  }

  const preset = presets[val]
  if (preset) {
    form.value.modelName = preset.modelName
    form.value.baseUrl = preset.baseUrl
  }
}

onMounted(fetchSettings)
</script>

<style scoped>
.ai-settings {
  padding: 20px;
  max-width: 800px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  color: #1f2937;
}

.subtitle {
  margin: 4px 0 0;
  color: #6b7280;
}

.settings-card {
  margin-bottom: 24px;
}

.form-tip {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

.info-section {
  color: #4b5563;
  font-size: 14px;
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
}

.info-section h3 {
  margin: 0 0 12px;
  font-size: 16px;
}

.info-section ul {
  padding-left: 20px;
  margin: 0;
}

.info-section li {
  margin-bottom: 8px;
}
</style>
