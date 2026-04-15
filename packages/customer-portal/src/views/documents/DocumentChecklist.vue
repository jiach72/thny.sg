<template>
  <div class="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
    <div>
      <h1 class="font-serif text-3xl text-text mb-2">{{ t('checklist.title') }}</h1>
      <p class="text-sm text-text-muted">{{ t('checklist.subtitle') }}</p>
    </div>

    <div v-if="loading" class="py-12 text-center">
      <p class="text-text-muted animate-pulse">{{ t('checklist.loading') }}</p>
    </div>

    <div v-else-if="checklists.length === 0" class="py-12 text-center">
      <p class="text-text-muted">{{ t('checklist.emptyTitle') }}</p>
      <p class="text-xs text-text-muted/50 mt-1">{{ t('checklist.emptyDesc') }}</p>
    </div>

    <div v-else class="space-y-6">
      <div
        v-for="item in checklists"
        :key="item.id"
        class="p-6 rounded-xl bg-glass/20 border border-white/5"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-serif text-lg text-text">{{ item.projectType }}</h3>
          <div class="flex items-center gap-3">
            <div class="text-sm text-text-muted">
              {{ t('checklist.uploadProgress') }}
              <span class="text-wealth font-bold">{{ item.uploadedCount }}</span>/{{ item.totalCount }}
            </div>
            <div class="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                class="h-full rounded-full bg-wealth transition-all"
                :style="{ width: `${item.totalCount ? (item.uploadedCount / item.totalCount) * 100 : 0}%` }"
              ></div>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <div
            v-for="doc in item.materials"
            :key="doc.id"
            class="flex items-center justify-between p-3 rounded-lg"
            :class="doc.uploaded ? 'bg-green-500/5 border border-green-500/10' : 'bg-orange-500/5 border border-orange-500/10'"
          >
            <div class="flex items-center gap-3">
              <component :is="doc.uploaded ? CheckCircle : AlertCircle" class="w-5 h-5" :class="doc.uploaded ? 'text-green-400' : 'text-orange-400'" />
              <div>
                <p class="text-sm text-text">{{ doc.name }}</p>
                <p v-if="doc.description" class="text-xs text-text-muted">{{ doc.description }}</p>
              </div>
            </div>
            <span class="text-xs font-bold" :class="doc.uploaded ? 'text-green-400' : 'text-orange-400'">
              {{ doc.uploaded ? t('checklist.uploadedMaterials') : t('checklist.missingMaterials') }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { portalApi } from '@/api'
import { ElMessage } from 'element-plus'
import { CheckCircle, AlertCircle } from 'lucide-vue-next'

interface ChecklistMaterial {
  id: string
  name: string
  description?: string
  uploaded: boolean
}

interface ChecklistItem {
  id: string
  projectType: string
  totalCount: number
  uploadedCount: number
  materials: ChecklistMaterial[]
}

const { t } = useI18n()
const loading = ref(true)
const checklists = ref<ChecklistItem[]>([])

onMounted(() => {
  fetchChecklists()
})

async function fetchChecklists(): Promise<void> {
  loading.value = true
  try {
    const res = await portalApi.getDocumentChecklist({})
    checklists.value = (res as any)?.checklists || []
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : t('checklist.fetchError')
    ElMessage.error(msg)
  } finally {
    loading.value = false
  }
}
</script>
