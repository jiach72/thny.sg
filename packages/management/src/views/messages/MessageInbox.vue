<template>
  <div class="message-inbox-container">
    <div class="page-header">
      <h2>收件箱</h2>
      <div class="header-actions">
        <el-button
          type="primary"
          plain
          @click="handleMarkAllRead"
          :disabled="!hasUnread"
          :loading="loadingAction"
        >
          全部标为已读
        </el-button>
        <el-button icon="Refresh" circle @click="fetchMessages" />
      </div>
    </div>

    <el-card class="box-card" shadow="never">
      <!-- 列表筛选 -->
      <div class="filter-panel">
        <el-form :inline="true" :model="filters">
          <el-form-item label="类型">
            <el-select v-model="filters.type" placeholder="全部类型" clearable @change="handleSearch">
              <el-option label="系统通知" value="SYSTEM" />
              <el-option label="项目消息" value="PROJECT" />
              <el-option label="系统公告" value="ANNOUNCEMENT" />
              <el-option label="备忘提醒" value="REMINDER" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filters.isRead" placeholder="全部状态" clearable @change="handleSearch">
              <el-option label="未读" :value="false" />
              <el-option label="已读" :value="true" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <!-- 消息表格 -->
      <el-table
        v-loading="loading"
        :data="messages"
        style="width: 100%"
        @row-click="handleViewMessage"
        row-class-name="clickable-row"
      >
        <el-table-column width="50">
          <template #default="{ row }">
            <el-badge is-dot class="unread-dot" v-if="!row.isRead" type="danger" />
          </template>
        </el-table-column>

        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <el-tag size="small" :type="getTypeTag(row.type)">
              {{ getTypeLabel(row.type) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="title" label="标题" min-width="250" show-overflow-tooltip>
          <template #default="{ row }">
            <span :class="{ 'unread-text': !row.isRead }">{{ row.title }}</span>
          </template>
        </el-table-column>

        <el-table-column label="发送人" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="sender-info" v-if="row.sender">
              <el-avatar :size="24" :src="row.sender.avatarUrl || ''">
                {{ row.sender.name?.charAt(0) }}
              </el-avatar>
              <span class="sender-name">{{ row.sender.name }}</span>
            </div>
            <span v-else>系统</span>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="接收时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              @click.stop="handleViewMessage(row)"
            >
              查看
            </el-button>
            <el-button
              type="danger"
              link
              size="small"
              @click.stop="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="fetchMessages"
          @current-change="fetchMessages"
        />
      </div>
    </el-card>

    <!-- 消息详情弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="currentMessage?.title || '消息详情'"
      width="600px"
    >
      <div class="message-detail" v-if="currentMessage">
        <div class="detail-meta">
          <span class="meta-item">发送人: {{ currentMessage.sender?.name || '系统' }}</span>
          <span class="meta-item">时间: {{ formatDateTime(currentMessage.createdAt) }}</span>
          <el-tag size="small" :type="getTypeTag(currentMessage.type)">
            {{ getTypeLabel(currentMessage.type) }}
          </el-tag>
        </div>
        
        <el-divider />
        
        <div class="detail-content" v-html="formatContent(currentMessage.content)"></div>
        
        <div v-if="currentMessage.project" class="detail-project-link">
          <el-button type="primary" link @click="goToProject(currentMessage.project.id)">
            前往相关项目: {{ currentMessage.project.title }}
          </el-button>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">关闭</el-button>
          <el-button type="danger" plain @click="currentMessage ? handleDelete(currentMessage, true) : undefined">
            删除此消息
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import messageApi from '@/api/messageApi'
import type { MessageItem, MessageListResponse } from '@/api/messageApi'
import { sanitizeText } from '@/utils/sanitize'

const router = useRouter()

// 状态字典

const loading = ref(false)
const loadingAction = ref(false)
const messages = ref<MessageItem[]>([])

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const filters = reactive({
  type: '',
  isRead: '' as boolean | string
})

const dialogVisible = ref(false)
const currentMessage = ref<MessageItem | null>(null)

const hasUnread = computed(() => {
  return messages.value.some((m) => !m.isRead)
})

// 生命周期
onMounted(() => {
  fetchMessages()
})

// 核心方法
const fetchMessages = async () => {
  loading.value = true
  try {
    const isReadParam = filters.isRead === '' ? undefined : filters.isRead as boolean
    // 这里如果后端支持 type 过滤，可以直接传 params，或者在前端过滤
    // 目前 apiClient.getMyMessages 接受 isRead
    const res: MessageListResponse = await messageApi.getMyMessages(
      pagination.page, 
      pagination.limit, 
      isReadParam
    )
    
    const data = res.data || res.messages || []
    
    let filteredData = data
    if (filters.type) {
      filteredData = data.filter((m) => m.type === filters.type)
    }

    messages.value = filteredData
    pagination.total = res.total || data.length || 0
  } catch (error) {
    const msg = error instanceof Error ? error.message : '获取消息列表失败'
    ElMessage.error(msg)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchMessages()
}

const handleViewMessage = async (row: MessageItem) => {
  currentMessage.value = row
  dialogVisible.value = true
  
  if (!row.isRead) {
    try {
      await messageApi.markAsRead(row.id)
      row.isRead = true
    } catch {
      // ignore
    }
  }
}

const handleMarkAllRead = async () => {
  try {
    loadingAction.value = true
    await messageApi.markAllAsRead()
    ElMessage.success('已全部标记为已读')
    fetchMessages()
  } catch (error) {
    const msg = error instanceof Error ? error.message : '操作失败'
    ElMessage.error(msg)
  } finally {
    loadingAction.value = false
  }
}

const handleDelete = async (row: MessageItem, closeDialog = false) => {
  try {
    await ElMessageBox.confirm('确定要删除这条消息吗？此操作不可逆。', '提示', {
      type: 'warning'
    })
    
    await messageApi.deleteMessage(row.id)
    ElMessage.success('删除成功')
    
    if (closeDialog) {
      dialogVisible.value = false
    }
    
    fetchMessages()
  } catch (err) {
    if (err !== 'cancel') {
      const msg = err instanceof Error ? err.message : '删除失败'
      ElMessage.error(msg)
    }
  }
}

const goToProject = (projectId: string) => {
  dialogVisible.value = false
  router.push(`/projects/${projectId}`)
}

// 辅助方法
const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '-'
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm')
}

const formatContent = (content: string) => {
  if (!content) return ''
  return sanitizeText(content.replace(/\n/g, '<br/>'))
}

const getTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    SYSTEM: '系统通知',
    PROJECT: '项目状态',
    DOCUMENT: '文档变动',
    PAYMENT: '账单与支付',
    CONTENT: '内容更新',
    ANNOUNCEMENT: '系统公告',
    REMINDER: '工作提醒',
  }
  return map[type] || '其他消息'
}

const getTypeTag = (type: string) => {
  const map: Record<string, string> = {
    SYSTEM: 'info',
    PROJECT: 'primary',
    DOCUMENT: 'warning',
    PAYMENT: 'success',
    ANNOUNCEMENT: 'danger',
    REMINDER: 'warning',
  }
  return map[type] || 'info'
}
</script>

<style scoped>
.message-inbox-container {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.filter-panel {
  margin-bottom: 16px;
}

.unread-text {
  font-weight: 600;
  color: #303133;
}

.sender-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sender-name {
  font-size: 13px;
}

/* 详情弹窗 */
.message-detail {
  padding: 10px 0;
}

.detail-meta {
  display: flex;
  gap: 16px;
  align-items: center;
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.detail-content {
  line-height: 1.6;
  color: #606266;
  white-space: pre-wrap;
  word-break: break-all;
  min-height: 100px;
}

.detail-project-link {
  margin-top: 24px;
}

/* tr 可点击样式 */
:deep(.clickable-row) {
  cursor: pointer;
}
:deep(.clickable-row:hover > td.el-table__cell) {
  background-color: var(--el-table-row-hover-bg-color);
}
</style>
