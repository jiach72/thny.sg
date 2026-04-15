<template>
  <div class="inquiry-detail" v-loading="loading">
    <div class="page-header">
      <el-button :icon="ArrowLeft" @click="$router.back()">返回</el-button>
      <h2>咨询详情</h2>
      <div class="header-actions">
        <el-tag :type="statusTagType(inquiry?.status)">
          {{ statusLabel(inquiry?.status) }}
        </el-tag>
      </div>
    </div>

    <template v-if="inquiry">
      <el-row :gutter="24">
        <el-col :xs="24" :sm="24" :md="16" :lg="16">
          <el-card shadow="never" class="detail-card">
            <template #header>
              <span class="card-title">咨询内容</span>
            </template>
            <div class="inquiry-body">
              <p class="message-text">{{ inquiry.message }}</p>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="24" :md="8" :lg="8">
          <el-card shadow="never" class="info-card">
            <template #header>
              <span class="card-title">联系信息</span>
            </template>
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="姓名">{{ inquiry.name }}</el-descriptions-item>
              <el-descriptions-item label="邮箱">{{ inquiry.email || '-' }}</el-descriptions-item>
              <el-descriptions-item label="电话">{{ inquiry.phone || '-' }}</el-descriptions-item>
              <el-descriptions-item label="来源">{{ inquiry.source || '官网' }}</el-descriptions-item>
              <el-descriptions-item label="提交时间">{{ formatDate(inquiry.createdAt) }}</el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-card shadow="never" class="status-card" style="margin-top: 16px;">
            <template #header>
              <span class="card-title">处理操作</span>
            </template>
            <el-form label-width="80px" size="small">
              <el-form-item label="状态">
                <el-select v-model="statusForm.status" @change="handleStatusChange">
                  <el-option label="新咨询" value="NEW" />
                  <el-option label="处理中" value="IN_PROGRESS" />
                  <el-option label="已解决" value="RESOLVED" />
                  <el-option label="已关闭" value="CLOSED" />
                </el-select>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>
      </el-row>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { inquiryApi } from '@/api'
import dayjs from 'dayjs'

const route = useRoute()
const loading = ref(false)
const inquiry = ref<any>(null)

const statusForm = ref({ status: 'NEW' })

const statusLabel = (status?: string) => {
  const map: Record<string, string> = {
    NEW: '新咨询',
    IN_PROGRESS: '处理中',
    RESOLVED: '已解决',
    CLOSED: '已关闭'
  }
  return map[status || ''] || status
}

const statusTagType = (status?: string) => {
  const map: Record<string, string> = {
    NEW: 'info',
    IN_PROGRESS: 'warning',
    RESOLVED: 'success',
    CLOSED: 'default'
  }
  return map[status || ''] || 'info'
}

const formatDate = (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')

async function loadInquiry() {
  const id = route.params.id as string
  if (!id) return
  loading.value = true
  try {
    const res = await inquiryApi.getById(id)
    inquiry.value = (res as any)?.data || res
    statusForm.value.status = inquiry.value.status
  } catch {
    ElMessage.error('加载咨询详情失败')
  } finally {
    loading.value = false
  }
}

async function handleStatusChange(val: string) {
  if (!inquiry.value) return
  try {
    await inquiryApi.update(inquiry.value.id, { status: val })
    inquiry.value.status = val
    ElMessage.success('状态已更新')
  } catch {
    ElMessage.error('状态更新失败')
    statusForm.value.status = inquiry.value.status
  }
}

onMounted(() => loadInquiry())
</script>

<style scoped>
.inquiry-detail {
  padding: 24px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  flex: 1;
}

.detail-card, .info-card, .status-card {
  border-radius: 12px;
}

.card-title {
  font-weight: 600;
  color: #1e293b;
}

.inquiry-body {
  padding: 8px 0;
}

.message-text {
  font-size: 14px;
  line-height: 1.8;
  color: #334155;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
