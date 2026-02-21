<template>
  <div class="message-send">
    <div class="page-header">
      <h1>发送站内消息</h1>
      <p>向客户发送站内消息通知</p>
    </div>

    <el-row :gutter="24">
      <el-col :span="16" :xs="24">
        <el-card>
          <el-form 
            ref="formRef" 
            :model="form" 
            :rules="rules" 
            label-width="100px"
          >
            <el-form-item label="发送方式">
              <el-radio-group v-model="sendMode">
                <el-radio-button value="single">单个客户</el-radio-button>
                <el-radio-button value="bulk">批量发送</el-radio-button>
              </el-radio-group>
            </el-form-item>

            <el-form-item v-if="sendMode === 'single'" label="选择客户" prop="recipientId">
              <el-select 
                v-model="form.recipientId" 
                filterable 
                placeholder="请选择客户"
                style="width: 100%"
                v-loading="loadingCustomers"
              >
                <el-option 
                  v-for="c in customers" 
                  :key="c.id" 
                  :label="`${c.name} (${c.email})`" 
                  :value="c.id" 
                />
              </el-select>
            </el-form-item>

            <el-form-item v-else label="选择客户" prop="recipientIds">
              <el-select 
                v-model="form.recipientIds" 
                multiple 
                filterable 
                placeholder="选择多个客户"
                style="width: 100%"
                v-loading="loadingCustomers"
              >
                <el-option 
                  v-for="c in customers" 
                  :key="c.id" 
                  :label="`${c.name} (${c.email})`" 
                  :value="c.id" 
                />
              </el-select>
              <el-button link type="primary" @click="selectAllCustomers">全选</el-button>
            </el-form-item>

            <el-form-item label="消息类型" prop="type">
              <el-select v-model="form.type" placeholder="选择消息类型" style="width: 200px">
                <el-option label="系统通知" value="SYSTEM" />
                <el-option label="项目相关" value="PROJECT" />
                <el-option label="文档相关" value="DOCUMENT" />
                <el-option label="付款相关" value="PAYMENT" />
                <el-option label="提醒" value="REMINDER" />
                <el-option label="公告" value="ANNOUNCEMENT" />
              </el-select>
            </el-form-item>

            <el-form-item label="消息标题" prop="title">
              <el-input v-model="form.title" placeholder="请输入消息标题" maxlength="100" show-word-limit />
            </el-form-item>

            <el-form-item label="消息内容" prop="content">
              <el-input 
                v-model="form.content" 
                type="textarea" 
                :rows="6" 
                placeholder="请输入消息内容"
                maxlength="2000"
                show-word-limit
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="handleSend" :loading="sending">
                {{ sendMode === 'bulk' ? '批量发送' : '发送消息' }}
              </el-button>
              <el-button @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="8" :xs="24">
        <el-card>
          <template #header>
            <span>发送记录</span>
          </template>
          <div v-loading="loadingSent">
            <div v-if="sentMessages.length > 0" class="sent-list">
              <div v-for="msg in sentMessages" :key="msg.id" class="sent-item">
                <div class="sent-header">
                  <span class="sent-title">{{ msg.title }}</span>
                  <el-tag size="small" :type="getTypeTagType(msg.type)">{{ getTypeLabel(msg.type) }}</el-tag>
                </div>
                <div class="sent-meta">
                  <span>发送给: {{ msg.recipient?.name }}</span>
                  <span>{{ formatTime(msg.createdAt) }}</span>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无发送记录" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { messageApi } from '@/api'

// 消息类型
type MessageType = 'SYSTEM' | 'PROJECT' | 'DOCUMENT' | 'PAYMENT' | 'REMINDER' | 'ANNOUNCEMENT'

interface CustomerOption {
  id: string
  name: string
  email: string
}

interface SentMessage {
  id: string
  title: string
  content: string
  type: MessageType
  recipient?: { name: string }
  createdAt: string
}
const formRef = ref<FormInstance>()
const sendMode = ref<'single' | 'bulk'>('single')
const sending = ref(false)
const loadingCustomers = ref(false)
const loadingSent = ref(false)

const customers = ref<CustomerOption[]>([])
const sentMessages = ref<SentMessage[]>([])

const form = reactive({
  recipientId: '',
  recipientIds: [] as string[],
  title: '',
  content: '',
  type: 'SYSTEM' as string,
})

const rules: FormRules = {
  recipientId: [{ required: true, message: '请选择客户', trigger: 'change' }],
  recipientIds: [{ type: 'array', required: true, min: 1, message: '请选择至少一个客户', trigger: 'change' }],
  title: [{ required: true, message: '请输入消息标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入消息内容', trigger: 'blur' }],
}

// 加载客户列表
async function loadCustomers() {
  loadingCustomers.value = true
  try {
    const result = await messageApi.getCustomers() as CustomerOption[]
    customers.value = result || []
  } catch {
    customers.value = []
  } finally {
    loadingCustomers.value = false
  }
}

// 加载发送记录
async function loadSentMessages() {
  loadingSent.value = true
  try {
    const result = await messageApi.getSentMessages(1, 10) as { messages: SentMessage[] }
    sentMessages.value = result.messages || []
  } catch {
    sentMessages.value = []
  } finally {
    loadingSent.value = false
  }
}

// 全选客户
function selectAllCustomers() {
  form.recipientIds = customers.value.map(c => c.id)
}

// 发送消息
async function handleSend() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    sending.value = true
    try {
      if (sendMode.value === 'single') {
        await messageApi.send({
          recipientId: form.recipientId,
          title: form.title,
          content: form.content,
          type: form.type as MessageType,
        })
        ElMessage.success('消息发送成功')
      } else {
        const result = await messageApi.sendBulk({
          recipientIds: form.recipientIds,
          title: form.title,
          content: form.content,
          type: form.type as MessageType,
        }) as { count: number }
        ElMessage.success(`成功发送 ${result.count} 条消息`)
      }

      resetForm()
      loadSentMessages()
    } catch (error: unknown) {
      ElMessage.error((error as Error).message || '发送失败')
    } finally {
      sending.value = false
    }
  })
}

// 重置表单
function resetForm() {
  form.recipientId = ''
  form.recipientIds = []
  form.title = ''
  form.content = ''
  form.type = 'SYSTEM'
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN')
}

function getTypeLabel(type: string): string {
  const map: Record<string, string> = {
    SYSTEM: '系统',
    PROJECT: '项目',
    DOCUMENT: '文档',
    PAYMENT: '付款',
    REMINDER: '提醒',
    ANNOUNCEMENT: '公告',
  }
  return map[type] || type
}

function getTypeTagType(type: string): 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    SYSTEM: 'info',
    PROJECT: 'success',
    DOCUMENT: 'warning',
    PAYMENT: 'danger',
    REMINDER: 'warning',
    ANNOUNCEMENT: 'info',
  }
  return map[type] || 'info'
}

onMounted(() => {
  loadCustomers()
  loadSentMessages()
})
</script>

<style scoped>
.message-send {
  max-width: 1200px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  color: #1a365d;
  margin: 0 0 8px;
}

.page-header p {
  color: #666;
  margin: 0;
}

.sent-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sent-item {
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
}

.sent-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.sent-title {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.sent-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
}
</style>
