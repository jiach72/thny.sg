<template>
  <div class="document-list">
    <div class="page-header">
      <div class="header-content">
        <h1>文档中心</h1>
        <p>安全管理您的所有项目文档</p>
      </div>
      <el-button type="primary" @click="showUploadDialog = true">
        <el-icon><Upload /></el-icon> 上传文档
      </el-button>
    </div>

    <!-- 文档分类 -->
    <el-tabs v-model="activeTab">
      <el-tab-pane label="全部文档" name="all" />
      <el-tab-pane label="我上传的" name="uploaded" />
      <el-tab-pane label="待签署" name="pending" />
      <el-tab-pane label="已完成" name="completed" />
    </el-tabs>

    <!-- 文档列表 -->
    <el-table :data="documents" style="width: 100%">
      <el-table-column label="文档名称" min-width="250">
        <template #default="{ row }">
          <div class="doc-name">
            <el-icon size="20" :color="getFileIconColor(row.type)">
              <Document />
            </el-icon>
            <span>{{ row.name }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="project" label="关联项目" width="200" />
      <el-table-column prop="size" label="大小" width="100" />
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="getDocStatusType(row.status)" size="small">
            {{ getDocStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="uploadedAt" label="上传时间" width="150">
        <template #default="{ row }">
          {{ formatDate(row.uploadedAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleDownload(row)">下载</el-button>
          <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 上传对话框 -->
    <el-dialog v-model="showUploadDialog" title="上传文档" width="500px">
      <el-form label-position="top">
        <el-form-item label="所属项目" required>
          <el-select v-model="selectedProjectId" placeholder="请选择项目" style="width: 100%">
            <el-option
              v-for="proj in projects"
              :key="proj.id"
              :label="proj.title"
              :value="proj.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="文件上传" required>
          <el-upload
            drag
            action="/api/v1/documents/upload"
            :headers="uploadHeaders"
            :data="{ projectId: selectedProjectId }"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :disabled="!selectedProjectId"
          >
            <el-icon size="48"><UploadFilled /></el-icon>
            <div>将文件拖到此处，或<em>点击上传</em></div>
            <template #tip>
              <div class="upload-tip">请先选择项目，再上传文件</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { Upload, Document, UploadFilled } from '@element-plus/icons-vue'
import { useDocumentStore } from '@/stores/documentStore'
import { useProjectStore } from '@/stores/projectStore'
import { useAuthStore } from '@/stores/authStore'
import { documentApi } from '@/api'

const activeTab = ref('all')
const showUploadDialog = ref(false)
const selectedProjectId = ref('')

const documentStore = useDocumentStore()
const projectStore = useProjectStore()
const authStore = useAuthStore()
const { documents: rawDocuments } = storeToRefs(documentStore)
const { projects } = storeToRefs(projectStore)

const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${authStore.accessToken}`
}))

onMounted(() => {
  documentStore.fetchMyDocuments()
  projectStore.fetchMyProjects() // 获取项目列表供上传选择
})

const documents = computed(() => {
  if (!rawDocuments.value) return []
  return rawDocuments.value.map(doc => ({
    id: doc.id,
    name: doc.fileName,
    type: doc.fileType,
    project: doc.project?.title || '通用',
    size: formatSize(doc.fileSize),
    status: 'uploaded', 
    uploadedAt: doc.createdAt
  }))
})

// ... token helpers ...

function getFileIconColor(type: string | undefined): string {
  if (!type) return '#666'
  const t = type.toLowerCase()
  if (t.includes('pdf')) return '#dc2626'
  if (t.includes('word') || t.includes('doc')) return '#2563eb'
  if (t.includes('excel') || t.includes('xls')) return '#16a34a'
  if (t.includes('image') || t.includes('jpg') || t.includes('png')) return '#9333ea'
  return '#666'
}

function getDocStatusLabel(status: string): string {
  const map: Record<string, string> = {
    uploaded: '已上传',
    pending: '待签署',
    signed: '已签署',
    rejected: '已退回',
  }
  return map[status] || status
}

function getDocStatusType(status: string): 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    uploaded: 'info',
    pending: 'warning',
    signed: 'success',
    rejected: 'danger',
  }
  return map[status] || 'info'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

async function handleDownload(doc: any) {
  try {
    ElMessage.info('开始下载...')
    const response = await documentApi.downloadDocument(doc.id)
    
    // 创建 Blob URL 并触发下载
    const url = window.URL.createObjectURL(new Blob([response as any]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', doc.name)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    ElMessage.error('下载失败')
    console.error(error)
  }
}

function handleDelete(doc: any) {
  ElMessage.info(`删除功能开发中: ${doc.name}`)
}

function handleUploadSuccess() {
  ElMessage.success('上传成功')
  showUploadDialog.value = false
  selectedProjectId.value = '' // Reset
  documentStore.fetchMyDocuments()
}

function handleUploadError() {
  ElMessage.error('上传失败，请重试')
}
</script>

<style scoped>
.document-list {
  max-width: 1200px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-content h1 {
  font-size: 28px;
  color: #1a365d;
  margin: 0 0 8px;
}

.header-content p {
  color: #666;
  margin: 0;
}

.doc-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.upload-tip {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}
</style>
