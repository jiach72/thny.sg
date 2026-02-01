<template>
  <div class="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
    <!-- 头部 -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="p-3 rounded-xl bg-gradient-to-br from-wealth to-[#B49248] shadow-lg shadow-wealth/20 text-obsidian">
          <component :is="ShieldCheck" class="w-8 h-8" />
        </div>
        <div>
          <h1 class="font-serif text-3xl text-text">安全保险库</h1>
          <p class="text-sm text-text-muted">银行级加密存储您的重要文档</p>
        </div>
      </div>
      <button 
        @click="showUploadDialog = true"
        class="flex items-center gap-2 px-6 py-3 bg-wealth hover:bg-[#B49248] text-obsidian rounded font-bold text-sm transition-all active:scale-95"
      >
        <component :is="UploadCloud" class="w-4 h-4" />
        上传文件
      </button>
    </div>

    <!-- 统计概览 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="p-6 rounded-xl bg-glass/10 border border-white/5 flex items-center gap-4">
        <div class="p-2 rounded-lg bg-blue-500/10 text-blue-400">
          <component :is="FileText" class="w-6 h-6" />
        </div>
        <div>
          <div class="text-2xl font-serif text-text">{{ documents.length }}</div>
          <div class="text-xs text-text-muted uppercase tracking-wider">文件总数</div>
        </div>
      </div>
      <div class="p-6 rounded-xl bg-glass/10 border border-white/5 flex items-center gap-4">
        <div class="p-2 rounded-lg bg-wealth/10 text-wealth">
          <component :is="Lock" class="w-6 h-6" />
        </div>
        <div>
          <div class="text-2xl font-serif text-text">加密</div>
          <div class="text-xs text-text-muted uppercase tracking-wider">存储状态</div>
        </div>
      </div>
      <div class="p-6 rounded-xl bg-glass/10 border border-white/5 flex items-center gap-4">
         <div class="p-2 rounded-lg bg-green-500/10 text-green-400">
          <component :is="Activity" class="w-6 h-6" />
        </div>
        <div>
          <div class="text-sm font-medium text-text">{{ lastSyncTime }}</div>
          <div class="text-xs text-text-muted uppercase tracking-wider">上次同步</div>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="min-h-[500px] rounded-xl bg-glass/20 border border-white/5 overflow-hidden flex flex-col">
      <!-- 标签页 -->
      <div class="flex border-b border-white/5">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          class="bg-transparent px-8 py-4 text-sm font-medium border-b-2 transition-colors relative"
          :class="activeTab === tab.id ? 'text-wealth border-wealth bg-white/5' : 'text-text-muted border-transparent hover:text-text hover:bg-white/5'"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- 文件列表 -->
      <div v-if="activeTab !== 'audit'" class="flex-1 overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="text-xs text-text-muted uppercase tracking-wider border-b border-white/5 bg-white/5">
              <th class="px-6 py-4 font-medium">文件名</th>
              <th class="px-6 py-4 font-medium">项目</th>
              <th class="px-6 py-4 font-medium">日期</th>
              <th class="px-6 py-4 font-medium">大小</th>
              <th class="px-6 py-4 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr v-for="doc in filteredDocs" :key="doc.id" class="group hover:bg-white/5 transition-colors">
              <td class="px-6 py-4">
                 <div class="flex items-center gap-3">
                   <div class="p-2 rounded bg-obsidian border border-white/10 text-text-muted group-hover:text-wealth transition-colors">
                     <component :is="getFileIcon(doc.type)" class="w-5 h-5" />
                   </div>
                   <div>
                     <div class="text-sm font-medium text-text group-hover:text-wealth transition-colors">{{ doc.name }}</div>
                     <div class="text-xs text-text-muted flex items-center gap-1">
                       <component :is="Lock" class="w-3 h-3" /> 已加密
                     </div>
                   </div>
                 </div>
              </td>
              <td class="px-6 py-4">
                <span class="inline-flex items-center px-2 py-1 rounded bg-white/5 text-xs text-text-muted border border-white/5">
                  {{ doc.project }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-text-muted">{{ formatDate(doc.uploadedAt) }}</td>
              <td class="px-6 py-4 text-sm text-text-muted font-mono">{{ doc.size }}</td>
              <td class="px-6 py-4 text-right">
                <button @click="handleDownload(doc)" class="bg-transparent p-2 rounded-lg hover:bg-white/10 text-text-muted hover:text-wealth transition-colors" title="下载">
                  <component :is="Download" class="w-4 h-4" />
                </button>
              </td>
            </tr>
            <tr v-if="filteredDocs.length === 0">
              <td colspan="5" class="px-6 py-12 text-center text-text-muted">
                {{ activeTab === 'pending' ? '暂无待签署文档' : '暂无文档' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 审计日志 -->
      <div v-else class="flex-1 p-6">
        <div class="mb-4 px-2 py-1 inline-block rounded bg-amber-500/10 text-amber-400 text-xs">
          示例数据 - 仅供参考
        </div>
        <div class="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
          <div v-for="(log, i) in auditLogs" :key="i" class="relative pl-10">
             <div class="absolute left-[13px] top-1.5 w-2 h-2 rounded-full border border-obsidian" :class="i === 0 ? 'bg-wealth ring-4 ring-wealth/20' : 'bg-white/20'"></div>
             <p class="text-sm text-text">
               <span class="font-bold">{{ log.user }}</span> {{ log.action }} <span class="text-wealth">{{ log.resource }}</span>
             </p>
             <p class="text-xs text-text-muted mt-0.5">{{ log.time }} • {{ log.ip }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 上传对话框 -->
    <el-dialog v-model="showUploadDialog" title="安全上传" width="500px" class="!bg-obsidian !border-white/10 !text-text rounded-xl overflow-hidden">
      <el-upload
        ref="uploadRef"
        drag
        :action="uploadUrl"
        :headers="uploadHeaders"
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        :on-progress="handleUploadProgress"
        :before-upload="beforeUpload"
        accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.xlsx,.xls"
        :show-file-list="true"
      >
        <div class="p-8 text-center">
          <component :is="UploadCloud" class="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p class="text-text">拖放文件至此处或点击上传</p>
          <p class="text-xs text-text-muted mt-2">支持 PDF、Word、Excel、图片（最大 50MB）</p>
        </div>
      </el-upload>
      
      <!-- 上传进度 -->
      <div v-if="uploading" class="mt-4 p-4 rounded-lg bg-white/5">
        <div class="flex items-center justify-between text-sm mb-2">
          <span class="text-text">{{ uploadFileName }}</span>
          <span class="text-wealth">{{ uploadProgress }}%</span>
        </div>
        <div class="h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            class="h-full bg-wealth transition-all duration-300" 
            :style="{ width: `${uploadProgress}%` }"
          ></div>
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-3 pt-4 border-t border-white/5">
          <button 
            @click="showUploadDialog = false" 
            class="px-4 py-2 text-sm text-text-muted hover:text-text transition-colors"
          >
            关闭
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useDocumentStore } from '@/stores/documentStore'
import { documentApi } from '@/api'
import { ElMessage } from 'element-plus'
import type { UploadProgressEvent, UploadFile, UploadRawFile } from 'element-plus'
import { 
  ShieldCheck, UploadCloud, FileText, Lock, Activity, 
  File, Image, Download 
} from 'lucide-vue-next'

const documentStore = useDocumentStore()
const { documents: rawDocuments } = storeToRefs(documentStore)

const activeTab = ref('all')
const showUploadDialog = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadFileName = ref('')
const uploadRef = ref()

const tabs = [
  { id: 'all', label: '全部文档' },
  { id: 'pending', label: '待签署' },
  { id: 'audit', label: '访问历史' }
]

const auditLogs = [
  { user: 'Alex Chen', action: '查看了', resource: '信托契约草案_v2.pdf', time: '今天 10:23', ip: '192.168.1.1' },
  { user: '您', action: '下载了', resource: '公司注册证书.pdf', time: '昨天 16:45', ip: '203.111.22.33' },
  { user: '系统', action: '归档了', resource: '发票_2026年1月.pdf', time: '2026年1月28日', ip: '系统' },
]

// 上传配置
const uploadUrl = computed(() => `${import.meta.env.VITE_API_BASE_URL || '/api'}/documents/upload`)
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('accessToken')}`
}))

const lastSyncTime = computed(() => {
  const now = new Date()
  return `今天 ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
})

onMounted(() => {
  documentStore.fetchMyDocuments()
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

const filteredDocs = computed(() => {
  if (activeTab.value === 'all') return documents.value
  if (activeTab.value === 'pending') return [] // 待签署功能暂未开放
  return documents.value
})

function getFileIcon(type: string = '') {
  if (type.includes('image')) return Image
  if (type.includes('pdf')) return FileText
  return File
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatSize(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function beforeUpload(file: UploadRawFile) {
  const maxSize = 50 * 1024 * 1024 // 50MB
  if (file.size > maxSize) {
    ElMessage.error('文件大小不能超过 50MB')
    return false
  }
  uploading.value = true
  uploadFileName.value = file.name
  uploadProgress.value = 0
  return true
}

function handleUploadProgress(event: UploadProgressEvent) {
  uploadProgress.value = Math.round(event.percent || 0)
}

function handleUploadSuccess(response: any, file: UploadFile) {
  uploading.value = false
  uploadProgress.value = 100
  ElMessage.success(`${file.name} 上传成功`)
  // 刷新文档列表
  documentStore.fetchMyDocuments()
  // 短暂延迟后关闭对话框
  setTimeout(() => {
    showUploadDialog.value = false
    uploadProgress.value = 0
    uploadFileName.value = ''
  }, 1000)
}

function handleUploadError(error: Error) {
  uploading.value = false
  ElMessage.error('上传失败，请重试')
  console.error('上传错误:', error)
}

async function handleDownload(doc: any) {
  try {
     ElMessage.info('正在解密并下载...')
     const response = await documentApi.downloadDocument(doc.id)
     const url = window.URL.createObjectURL(new Blob([response as any]))
     const link = document.createElement('a')
     link.href = url
     link.setAttribute('download', doc.name)
     document.body.appendChild(link)
     link.click()
     document.body.removeChild(link)
  } catch {
    ElMessage.error('下载失败')
  }
}
</script>
