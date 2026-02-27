<template>
  <div class="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
    <!-- 头部 -->
    <div class="flex items-end justify-between">
      <div>
        <h1 class="font-serif text-3xl text-text mb-2">我的文档</h1>
        <p class="text-sm text-text-muted">管理您的专属文件并处理待签项目</p>
      </div>
    </div>

    <!-- 列表展示 -->
    <div class="space-y-4">
      <div v-if="loading" class="p-8 text-center bg-glass/20 border border-white/5 rounded-xl">
        <p class="text-text-muted animate-pulse">正在载入档案...</p>
      </div>

      <div v-else-if="documents.length === 0" class="p-8 text-center bg-glass/10 border border-white/5 border-dashed rounded-xl">
         <p class="text-text-muted">您的资料库当前为空</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="doc in documents" :key="doc.id" 
             @click="viewDoc(doc)"
             class="p-5 rounded-xl bg-glass/20 border border-white/5 hover:border-wealth/30 cursor-pointer transition-all">
           <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded bg-black/30 flex items-center justify-center flex-shrink-0 text-wealth">
                <component :is="FileText" class="w-6 h-6" />
              </div>
              <div class="flex-1 min-w-0">
                 <h3 class="font-serif text-base text-text truncate mb-1" :title="doc.fileName">{{ doc.fileName }}</h3>
                 <p class="text-xs text-text-muted truncate mb-2">{{ doc.project?.title || '通用归档' }} • {{ formatSize(doc.fileSize) }}</p>
                 <div class="flex items-center gap-3">
                    <span class="text-xs text-text-muted">{{ formatDate(doc.createdAt) }}</span>
                    
                    <span v-if="doc.signatureRequests && doc.signatureRequests.length > 0" class="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/20 animate-pulse">
                      需要您的签名
                    </span>
                 </div>
              </div>
           </div>
           
           <div class="mt-4 flex gap-2 justify-end border-t border-white/5 pt-4" @click.stop>
              <a href="#" @click.prevent="downloadDoc(doc)" class="px-3 py-1.5 text-xs text-text hover:text-wealth transition-colors border border-white/10 rounded flex items-center gap-1">
                 <component :is="Download" class="w-3 h-3" /> 下载
              </a>
              
              <button v-if="doc.signatureRequests && doc.signatureRequests.length > 0" 
                 @click="startSigning(doc)"
                 class="px-3 py-1.5 text-xs text-obsidian bg-wealth font-bold rounded shadow-lg shadow-wealth/20 hover:shadow-wealth/40 transition-colors flex items-center gap-1">
                 <component :is="PenTool" class="w-3 h-3" /> 立即签署
              </button>
           </div>
        </div>
      </div>
    </div>

    <!-- 电子签章确认弹窗 -->
    <el-dialog v-model="showSignDialog" title="电子签署意愿确认" width="500px" custom-class="bg-obsidian border border-white/10">
      <div v-if="currentDoc" class="space-y-6">
         <div class="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <h4 class="font-bold text-orange-400 mb-2 truncate" :title="currentDoc.fileName">授权签署文件：{{ currentDoc.fileName }}</h4>
            <p class="text-xs text-text-muted leading-relaxed">
              请在此审阅该文件。点击【确认签署】等同于您同意文件中列明的所有条款并发起具有排他约束力的电子签章请求。请确认您已阅读该文书。
            </p>
         </div>

         <div class="space-y-2">
            <label class="block text-sm text-text-muted mb-1">请键入您的全名作为简易签章凭据 (拼音或英文)：</label>
            <input v-model="signatureName" type="text" class="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-text focus:outline-none focus:border-wealth/50 transition-colors" placeholder="如：John Doe">
         </div>
      </div>
      <template #footer>
         <div class="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button @click="showSignDialog = false" class="px-4 py-2 text-sm text-text-muted hover:text-text transition-colors">取消</button>
            <button @click="submitSignature" :disabled="isSigning || !signatureName.trim()" class="px-6 py-2 bg-wealth text-obsidian text-sm font-bold rounded hover:bg-[#B49248] transition-colors disabled:opacity-50 flex items-center gap-2">
               <component v-if="isSigning" :is="Loader2" class="w-4 h-4 animate-spin" />
               确认签署
            </button>
         </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { portalApi, documentApi } from '@/api'
import { FileText, Download, PenTool, Loader2 } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import type { PortalDocument } from '@tonghai/shared'

const loading = ref(true)
const documents = ref<PortalDocument[]>([])

// 签章形态
const showSignDialog = ref(false)
const currentDoc = ref<PortalDocument | null>(null)
const signatureName = ref('')
const isSigning = ref(false)

onMounted(() => {
  fetchDocuments()
})

async function fetchDocuments(): Promise<void> {
  loading.value = true
  try {
    const res: any = await portalApi.getMyDocuments({ page: 1, limit: 100 })
    // The backend returns an object with `{ documents: [...], total: ... }`
    documents.value = res.documents || res.data || []
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '获取档案记录失败'
    ElMessage.error(msg)
  } finally {
    loading.value = false
  }
}

function startSigning(doc: PortalDocument): void {
  currentDoc.value = doc
  signatureName.value = ''
  showSignDialog.value = true
}

async function submitSignature(): Promise<void> {
  if (!signatureName.value.trim() || !currentDoc.value) return
  isSigning.value = true
  
  try {
    await portalApi.signDocument(currentDoc.value.id, `SIGNED_BY_${signatureName.value.trim().toUpperCase().replace(/\s+/g, '_')}_${new Date().getTime()}`)
    ElMessage.success('文档签署已成功登记，并记入法务台账')
    showSignDialog.value = false
    fetchDocuments() // refresh list
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '签署递交失败'
    ElMessage.error(msg)
  } finally {
    isSigning.value = false
  }
}

async function downloadDoc(doc: PortalDocument): Promise<void> {
  try {
    const response = await documentApi.downloadDocument(doc.id)
    const blob = new Blob([response as any], { type: (doc as any).fileType || 'application/octet-stream' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', doc.fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '下载失败'
    ElMessage.error(msg)
  }
}

async function viewDoc(doc: PortalDocument): Promise<void> {
  try {
    const response = await documentApi.downloadDocument(doc.id)
    const blob = new Blob([response as any], { type: (doc as any).fileType || 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    window.open(url, '_blank')
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '无法预览文档'
    ElMessage.error(msg)
  }
}

function formatSize(bytes: number): string {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })
}
</script>
