<template>
  <div class="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
    <div class="flex items-end justify-between">
      <div>
        <h1 class="font-serif text-3xl text-text mb-2">{{ t('documents.title') }}</h1>
        <p class="text-sm text-text-muted">{{ t('documents.subtitle') }}</p>
      </div>
      <button @click="showUploadDialog = true" class="px-5 py-2.5 text-sm font-bold text-obsidian bg-wealth rounded shadow-lg shadow-wealth/20 hover:shadow-wealth/40 transition-all flex items-center gap-2">
        <component :is="Upload" class="w-4 h-4" />
        {{ t('documents.upload') }}
      </button>
    </div>

    <div class="space-y-4 p-4 rounded-xl bg-glass/20 border border-white/5">
      <div class="flex flex-wrap items-center gap-3">
        <div class="relative flex-1 min-w-[200px]">
          <component :is="Search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('documents.searchPlaceholder')"
            class="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:border-wealth/50 transition-colors"
          />
        </div>

        <div class="relative">
          <select
            v-model="filterProject"
            class="appearance-none pl-4 pr-10 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-text focus:outline-none focus:border-wealth/50 transition-colors cursor-pointer"
          >
            <option value="">{{ t('documents.allProjects') }}</option>
            <option v-for="p in projectOptions" :key="p.id" :value="p.id">{{ p.title }}</option>
          </select>
          <component :is="ChevronDown" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        </div>

        <div class="relative">
          <select
            v-model="filterType"
            class="appearance-none pl-4 pr-10 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-text focus:outline-none focus:border-wealth/50 transition-colors cursor-pointer"
          >
            <option value="">{{ t('documents.allTypes') }}</option>
            <option v-for="tp in typeOptions" :key="tp.value" :value="tp.value">{{ tp.label }}</option>
          </select>
          <component :is="ChevronDown" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        </div>

        <div class="relative">
          <select
            v-model="filterSignature"
            class="appearance-none pl-4 pr-10 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-text focus:outline-none focus:border-wealth/50 transition-colors cursor-pointer"
          >
            <option value="">{{ t('documents.allSignatureStatus') }}</option>
            <option v-for="s in signatureOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
          <component :is="ChevronDown" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        </div>

        <button
          @click="toggleGroupMode"
          class="px-4 py-2.5 text-sm rounded-lg border transition-all flex items-center gap-2"
          :class="groupMode ? 'bg-wealth/10 border-wealth/30 text-wealth' : 'bg-black/30 border-white/10 text-text-muted hover:text-text hover:border-white/20'"
        >
          <component :is="groupMode ? FolderTree : FolderOpen" class="w-4 h-4" />
          {{ groupMode ? t('documents.groupView') : t('documents.flatView') }}
        </button>
      </div>
    </div>

    <LoadingState v-if="loading" :text="t('documents.loading')" />

    <EmptyState v-else-if="filteredDocuments.length === 0" icon="document" :title="t('documents.emptyTitle')" :description="t('documents.emptyDesc')" :action-text="t('documents.upload')" @action="showUploadDialog = true" />

    <template v-else>
      <div v-if="!groupMode" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="doc in filteredDocuments" :key="doc.id"
             @click="viewDoc(doc)"
             class="p-5 rounded-xl bg-glass/20 border border-white/5 hover:border-wealth/30 cursor-pointer transition-all">
           <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded bg-black/30 flex items-center justify-center flex-shrink-0 text-wealth">
                <component :is="FileText" class="w-6 h-6" />
              </div>
              <div class="flex-1 min-w-0">
                 <div class="flex items-center gap-2 mb-1">
                   <h3 class="font-serif text-base text-text truncate" :title="doc.fileName">{{ doc.fileName }}</h3>
                   <button
                     v-if="getDocVersionGroup(doc).count > 1"
                     @click.stop="openVersionHistory(doc)"
                     class="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-wealth/10 text-wealth border border-wealth/20 hover:bg-wealth/20 transition-colors cursor-pointer"
                   >
                     v{{ doc.version || 1 }}
                   </button>
                   <span v-else-if="doc.version && doc.version > 1" class="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-text-muted border border-white/10">
                     v{{ doc.version }}
                   </span>
                 </div>
                 <p class="text-xs text-text-muted truncate mb-2">{{ doc.project?.title || t('documents.generalArchive') }} &bull; {{ formatSize(doc.fileSize) }}</p>
                 <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-xs text-text-muted">{{ formatDate(doc.createdAt) }}</span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold" :class="getTypeTagClass(doc.type)">{{ getTypeLabel(doc.type) }}</span>
                    <span v-if="getSignatureStatus(doc) === 'pending'" class="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/20 animate-pulse">{{ t('documents.pendingSignature') }}</span>
                    <span v-else-if="getSignatureStatus(doc) === 'signed'" class="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/20">{{ t('documents.signed') }}</span>
                 </div>
              </div>
           </div>

           <div class="mt-4 flex gap-2 justify-end border-t border-white/5 pt-4" @click.stop>
              <a href="#" @click.prevent="downloadDoc(doc)" class="px-3 py-1.5 text-xs text-text hover:text-wealth transition-colors border border-white/10 rounded flex items-center gap-1">
                 <component :is="Download" class="w-3 h-3" /> {{ t('documents.download') }}
              </a>

              <button v-if="getSignatureStatus(doc) === 'pending'"
                 @click="startSigning(doc)"
                 class="px-3 py-1.5 text-xs text-obsidian bg-wealth font-bold rounded shadow-lg shadow-wealth/20 hover:shadow-wealth/40 transition-colors flex items-center gap-1">
                 <component :is="PenTool" class="w-3 h-3" /> {{ t('documents.signNow') }}
              </button>
           </div>
        </div>
      </div>

      <div v-else class="space-y-6">
        <div v-for="group in groupedDocuments" :key="group.projectId" class="rounded-xl bg-glass/20 border border-white/5 overflow-hidden">
          <button
            @click="toggleGroup(group.projectId)"
            class="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
          >
            <div class="flex items-center gap-3">
              <component :is="FolderOpen" class="w-5 h-5 text-wealth" />
              <h3 class="font-serif text-base text-text">{{ group.projectTitle }}</h3>
              <span class="px-2 py-0.5 rounded text-[10px] bg-white/5 text-text-muted">{{ group.documents.length }} {{ t('documents.docCount') }}</span>
            </div>
            <component :is="expandedGroups.has(group.projectId) ? ChevronUp : ChevronDown" class="w-4 h-4 text-text-muted" />
          </button>
          <div v-if="expandedGroups.has(group.projectId)" class="border-t border-white/5">
            <div
              v-for="doc in group.documents"
              :key="doc.id"
              @click="viewDoc(doc)"
              class="p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5 last:border-b-0"
            >
              <div class="flex items-center gap-4 min-w-0 flex-1">
                <div class="w-10 h-10 rounded bg-black/30 flex items-center justify-center flex-shrink-0 text-wealth">
                  <component :is="FileText" class="w-5 h-5" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <div class="text-sm text-text truncate">{{ doc.fileName }}</div>
                    <button
                      v-if="getDocVersionGroup(doc).count > 1"
                      @click.stop="openVersionHistory(doc)"
                      class="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-wealth/10 text-wealth border border-wealth/20 hover:bg-wealth/20 transition-colors cursor-pointer"
                    >
                      v{{ doc.version || 1 }}
                    </button>
                    <span v-else-if="doc.version && doc.version > 1" class="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-text-muted border border-white/10">
                      v{{ doc.version }}
                    </span>
                  </div>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-xs text-text-muted">{{ formatSize(doc.fileSize) }}</span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold" :class="getTypeTagClass(doc.type)">{{ getTypeLabel(doc.type) }}</span>
                    <span v-if="getSignatureStatus(doc) === 'pending'" class="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/20 animate-pulse">{{ t('documents.pendingSignature') }}</span>
                    <span v-else-if="getSignatureStatus(doc) === 'signed'" class="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/20">{{ t('documents.signed') }}</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2 ml-4" @click.stop>
                <span class="text-xs text-text-muted">{{ formatDate(doc.createdAt) }}</span>
                <a href="#" @click.prevent="downloadDoc(doc)" class="p-1.5 text-text-muted hover:text-wealth transition-colors">
                  <component :is="Download" class="w-4 h-4" />
                </a>
                <button v-if="getSignatureStatus(doc) === 'pending'" @click="startSigning(doc)" class="px-3 py-1.5 text-xs text-obsidian bg-wealth font-bold rounded shadow-lg shadow-wealth/20 hover:shadow-wealth/40 transition-colors flex items-center gap-1">
                  <component :is="PenTool" class="w-3 h-3" /> {{ t('documents.sign') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <el-dialog v-model="showUploadDialog" :title="t('documents.uploadDialogTitle')" width="500px" custom-class="bg-obsidian border border-white/10">
      <div class="space-y-4">
        <div
          class="border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer"
          :class="isDragging ? 'border-wealth bg-wealth/10' : 'border-white/20 hover:border-wealth/50'"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          @click="triggerFileInput"
        >
          <component :is="Upload" class="w-10 h-10 mx-auto mb-3" :class="isDragging ? 'text-wealth' : 'text-text-muted'" />
          <p class="text-sm text-text-muted">{{ t('documents.dragOrClick') }}</p>
          <p class="text-xs text-text-muted/60 mt-1">{{ t('documents.supportedFormats') }}</p>
          <input ref="fileInputRef" type="file" class="hidden" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" @change="handleFileSelect" />
        </div>

        <div v-if="selectedFiles.length > 0" class="space-y-2">
          <div v-for="(file, idx) in selectedFiles" :key="idx" class="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div class="flex items-center gap-3 min-w-0">
              <component :is="FileText" class="w-4 h-4 text-wealth flex-shrink-0" />
              <span class="text-sm text-text truncate">{{ file.name }}</span>
              <span class="text-xs text-text-muted flex-shrink-0">{{ formatSize(file.size) }}</span>
            </div>
            <button @click="removeFile(idx)" class="text-text-muted hover:text-red-400 transition-colors flex-shrink-0 ml-2">
              <component :is="X" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3 pt-4 border-t border-white/10">
          <button @click="closeUploadDialog" class="px-4 py-2 text-sm text-text-muted hover:text-text transition-colors">{{ t('common.cancel') }}</button>
          <button @click="submitUpload" :disabled="isUploading || selectedFiles.length === 0" class="px-6 py-2 bg-wealth text-obsidian text-sm font-bold rounded hover:bg-[#B49248] transition-colors disabled:opacity-50 flex items-center gap-2">
            <component v-if="isUploading" :is="Loader2" class="w-4 h-4 animate-spin" />
            {{ t('documents.uploadBtn') }}
          </button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="showSignDialog" :title="t('documents.signDialogTitle')" width="500px" custom-class="bg-obsidian border border-white/10">
      <div v-if="currentDoc" class="space-y-6">
         <div class="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <h4 class="font-bold text-orange-400 mb-2 truncate" :title="currentDoc.fileName">{{ t('documents.authorizeSignFile') }}{{ currentDoc.fileName }}</h4>
            <p class="text-xs text-text-muted leading-relaxed">
              {{ t('documents.signDisclaimer') }}
            </p>
         </div>

         <div class="space-y-2">
            <label class="block text-sm text-text-muted mb-1">{{ t('documents.typeFullName') }}</label>
            <input v-model="signatureName" type="text" class="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-text focus:outline-none focus:border-wealth/50 transition-colors" placeholder="如：John Doe">
         </div>
      </div>
      <template #footer>
         <div class="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button @click="showSignDialog = false" class="px-4 py-2 text-sm text-text-muted hover:text-text transition-colors">{{ t('common.cancel') }}</button>
            <button @click="submitSignature" :disabled="isSigning || !signatureName.trim()" class="px-6 py-2 bg-wealth text-obsidian text-sm font-bold rounded hover:bg-[#B49248] transition-colors disabled:opacity-50 flex items-center gap-2">
               <component v-if="isSigning" :is="Loader2" class="w-4 h-4 animate-spin" />
               {{ t('documents.confirmSign') }}
            </button>
         </div>
      </template>
    </el-dialog>

    <el-dialog v-model="showVersionHistory" :title="`${t('documents.versionHistory')} - ${versionDoc?.fileName || ''}`" width="500px" custom-class="bg-obsidian border border-white/10">
      <div v-if="loadingVersions" class="py-8 text-center">
        <span class="animate-spin inline-block">⟳</span>
        <p class="text-sm text-text-muted mt-2">{{ t('documents.loadingVersions') }}</p>
      </div>
      <div v-else-if="versionList.length === 0" class="py-8 text-center text-text-muted text-sm">
        {{ t('documents.noVersions') }}
      </div>
      <div v-else class="space-y-3 max-h-[60vh] overflow-y-auto">
        <div
          v-for="ver in versionList"
          :key="ver.id"
          class="p-4 rounded-xl bg-glass/20 border border-white/5 hover:border-wealth/30 transition-all"
          :class="versionDoc?.id === ver.id ? 'ring-1 ring-wealth/30' : ''"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-white/5 text-wealth flex items-center justify-center border border-white/5">
                <component :is="FileText" class="w-5 h-5" />
              </div>
              <div>
                <div class="text-sm font-medium text-text flex items-center gap-2">
                  {{ t('documents.version') }} v{{ ver.version || 1 }}
                  <span v-if="versionDoc?.id === ver.id" class="px-2 py-0.5 rounded text-[10px] font-bold bg-wealth/10 text-wealth border border-wealth/20">{{ t('documents.current') }}</span>
                </div>
                <div class="text-xs text-text-muted mt-0.5">{{ formatDate(ver.createdAt) }} &bull; {{ formatSize(ver.fileSize) }}</div>
              </div>
            </div>
            <button @click="downloadDoc(ver)" class="px-3 py-1.5 text-xs text-text hover:text-wealth transition-colors border border-white/10 rounded flex items-center gap-1">
              <component :is="Download" class="w-3 h-3" /> {{ t('documents.download') }}
            </button>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end pt-4 border-t border-white/5">
          <button @click="showVersionHistory = false" class="px-6 py-2.5 bg-wealth hover:bg-[#B49248] text-obsidian rounded font-bold text-sm transition-all active:scale-95">
            {{ t('common.cancel') }}
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { portalApi } from '@/api'
import { FileText, Download, PenTool, Loader2, Upload, X, Search, ChevronDown, ChevronUp, FolderOpen, FolderTree } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import type { PortalDocument } from '@tonghai/shared'
import EmptyState from '@/components/EmptyState.vue'
import LoadingState from '@/components/LoadingState.vue'

const { t } = useI18n()
const loading = ref(true)
const documents = ref<PortalDocument[]>([])

const searchQuery = ref('')
const filterProject = ref('')
const filterType = ref('')
const filterSignature = ref('')
const groupMode = ref(false)
const expandedGroups = ref<Set<string>>(new Set())

const showUploadDialog = ref(false)
const isDragging = ref(false)
const isUploading = ref(false)
const selectedFiles = ref<File[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)

const showSignDialog = ref(false)
const currentDoc = ref<PortalDocument | null>(null)
const signatureName = ref('')
const isSigning = ref(false)

const showVersionHistory = ref(false)
const versionDoc = ref<PortalDocument | null>(null)
const versionList = ref<PortalDocument[]>([])
const loadingVersions = ref(false)

const typeOptions = computed<{ value: string; label: string }[]>(() => [
  { value: 'CONTRACT', label: t('documents.typeContract') },
  { value: 'IDENTITY', label: t('documents.typeIdentity') },
  { value: 'FINANCIAL', label: t('documents.typeFinancial') },
  { value: 'OTHER', label: t('documents.typeOther') },
])

const signatureOptions = computed<{ value: string; label: string }[]>(() => [
  { value: 'pending', label: t('documents.signaturePending') },
  { value: 'signed', label: t('documents.signatureSigned') },
  { value: 'none', label: t('documents.signatureNone') },
])

const projectOptions = computed(() => {
  const seen = new Map<string, { id: string; title: string }>()
  for (const doc of documents.value) {
    if (doc.project?.id && !seen.has(doc.project.id)) {
      seen.set(doc.project.id, { id: doc.project.id, title: doc.project.title })
    }
  }
  return Array.from(seen.values())
})

const filteredDocuments = computed(() => {
  let result = documents.value

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    result = result.filter(d => d.fileName.toLowerCase().includes(q))
  }

  if (filterProject.value) {
    result = result.filter(d => d.projectId === filterProject.value)
  }

  if (filterType.value) {
    result = result.filter(d => d.type === filterType.value)
  }

  if (filterSignature.value) {
    result = result.filter(d => getSignatureStatus(d) === filterSignature.value)
  }

  return result
})

const groupedDocuments = computed(() => {
  const groups = new Map<string, { projectId: string; projectTitle: string; documents: PortalDocument[] }>()
  for (const doc of filteredDocuments.value) {
    const pid = doc.projectId || 'unassigned'
    const ptitle = doc.project?.title || t('documents.generalArchive')
    if (!groups.has(pid)) {
      groups.set(pid, { projectId: pid, projectTitle: ptitle, documents: [] })
    }
    groups.get(pid)!.documents.push(doc)
  }
  return Array.from(groups.values())
})

onMounted(() => {
  fetchDocuments()
})

async function fetchDocuments(): Promise<void> {
  loading.value = true
  try {
    const res = await portalApi.getMyDocuments({ page: 1, limit: 100 })
    documents.value = res.documents || []
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : t('documents.fetchError')
    ElMessage.error(msg)
  } finally {
    loading.value = false
  }
}

function getSignatureStatus(doc: PortalDocument): 'pending' | 'signed' | 'none' {
  if (doc.signatureRequests && doc.signatureRequests.length > 0) {
    const hasPending = doc.signatureRequests.some(sr => sr.status === 'PENDING')
    if (hasPending) return 'pending'
    const hasSigned = doc.signatureRequests.some(sr => sr.status === 'SIGNED')
    if (hasSigned) return 'signed'
  }
  return 'none'
}

function getTypeLabel(type: string): string {
  const map: Record<string, string> = {
    CONTRACT: t('documents.typeContract'),
    IDENTITY: t('documents.typeIdentity'),
    FINANCIAL: t('documents.typeFinancial'),
    OTHER: t('documents.typeOther'),
  }
  return map[type] || type || t('documents.document')
}

function getTypeTagClass(type: string): string {
  const map: Record<string, string> = {
    CONTRACT: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
    IDENTITY: 'bg-purple-500/15 text-purple-400 border border-purple-500/20',
    FINANCIAL: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
    OTHER: 'bg-white/10 text-text-muted border border-white/10',
  }
  return map[type] || 'bg-white/10 text-text-muted border border-white/10'
}

function toggleGroupMode(): void {
  groupMode.value = !groupMode.value
  if (groupMode.value) {
    expandedGroups.value = new Set(groupedDocuments.value.map(g => g.projectId))
  }
}

function toggleGroup(projectId: string): void {
  const next = new Set(expandedGroups.value)
  if (next.has(projectId)) {
    next.delete(projectId)
  } else {
    next.add(projectId)
  }
  expandedGroups.value = next
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
    ElMessage.success(t('documents.signSuccess'))
    showSignDialog.value = false
    fetchDocuments()
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : t('documents.signError')
    ElMessage.error(msg)
  } finally {
    isSigning.value = false
  }
}

async function downloadDoc(doc: PortalDocument): Promise<void> {
  try {
    const response = await portalApi.downloadDocument(doc.id)
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
    const msg = error instanceof Error ? error.message : t('documents.downloadError')
    ElMessage.error(msg)
  }
}

async function viewDoc(doc: PortalDocument): Promise<void> {
  try {
    const response = await portalApi.downloadDocument(doc.id)
    const blob = new Blob([response as any], { type: (doc as any).fileType || 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    window.open(url, '_blank')
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : t('documents.previewError')
    ElMessage.error(msg)
  }
}

function triggerFileInput(): void {
  fileInputRef.value?.click()
}

function handleFileSelect(event: Event): void {
  const input = event.target as HTMLInputElement
  if (input.files) {
    selectedFiles.value = [...selectedFiles.value, ...Array.from(input.files)]
  }
  input.value = ''
}

function handleDrop(event: DragEvent): void {
  isDragging.value = false
  if (event.dataTransfer?.files) {
    selectedFiles.value = [...selectedFiles.value, ...Array.from(event.dataTransfer.files)]
  }
}

function removeFile(idx: number): void {
  selectedFiles.value.splice(idx, 1)
}

function closeUploadDialog(): void {
  showUploadDialog.value = false
  selectedFiles.value = []
  isDragging.value = false
}

async function submitUpload(): Promise<void> {
  if (selectedFiles.value.length === 0) return
  isUploading.value = true
  try {
    for (const file of selectedFiles.value) {
      const formData = new FormData()
      formData.append('file', file)
      await portalApi.uploadDocument(formData)
    }
    ElMessage.success(t('documents.uploadSuccess'))
    closeUploadDialog()
    fetchDocuments()
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : t('documents.uploadError')
    ElMessage.error(msg)
  } finally {
    isUploading.value = false
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

function getDocVersionGroup(doc: PortalDocument): { count: number; versions: PortalDocument[] } {
  const baseName = getBaseFileName(doc.fileName)
  const versions = documents.value.filter(d => getBaseFileName(d.fileName) === baseName)
  return { count: versions.length, versions }
}

function getBaseFileName(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.')
  const name = lastDot > 0 ? fileName.substring(0, lastDot) : fileName
  return name.replace(/_v\d+$/, '').replace(/ \(\d+\)$/, '')
}

async function openVersionHistory(doc: PortalDocument): Promise<void> {
  versionDoc.value = doc
  showVersionHistory.value = true
  loadingVersions.value = true
  versionList.value = []

  try {
    const result = await portalApi.getDocumentVersions(doc.id)
    versionList.value = Array.isArray(result) ? result : []
    if (versionList.value.length === 0) {
      const group = getDocVersionGroup(doc)
      versionList.value = group.versions.sort((a, b) => (b.version || 1) - (a.version || 1))
    }
  } catch {
    const group = getDocVersionGroup(doc)
    versionList.value = group.versions.sort((a, b) => (b.version || 1) - (a.version || 1))
  } finally {
    loadingVersions.value = false
  }
}
</script>
