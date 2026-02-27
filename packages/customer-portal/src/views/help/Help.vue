<template>
  <div class="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
    <!-- Header -->
    <div class="flex items-end justify-between">
      <div>
        <h1 class="font-serif text-3xl text-text mb-2">帮助与支持</h1>
        <p class="text-sm text-text-muted">浏览知识库或寻求我们的直接协助</p>
      </div>
    </div>

    <!-- Contact Support Card -->
    <div class="p-6 rounded-2xl bg-gradient-to-r from-wealth/10 to-obsidian border border-wealth/20 shadow-lg mb-8">
       <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl bg-wealth/20 flex items-center justify-center flex-shrink-0">
             <component :is="Headset" class="w-6 h-6 text-wealth" />
          </div>
          <div>
            <h3 class="text-lg font-serif text-text mb-1">需要更多帮助？</h3>
            <p class="text-sm text-text-muted mb-4">如果您的问题没有在下方得到解答，您可以随时向您的专属团队发起咨询或在线预约。</p>
            <div class="flex gap-3">
               <button @click="$router.push('/dashboard')" class="px-4 py-2 bg-wealth text-obsidian text-sm font-bold rounded hover:bg-[#B49248] transition-colors shadow-lg shadow-wealth/20">
                 发起服务咨询
               </button>
               <button @click="$router.push('/dashboard')" class="px-4 py-2 bg-transparent text-text text-sm font-bold rounded border border-white/20 hover:border-wealth/50 transition-colors">
                 预约视频会议
               </button>
            </div>
          </div>
       </div>
    </div>

    <!-- FAQ Section -->
    <div v-if="loading" class="p-12 text-center">
       <div class="inline-block animate-spin w-8 h-8 border-4 border-wealth border-t-transparent rounded-full mb-4"></div>
       <p class="text-text-muted">正在加载知识库...</p>
    </div>
    
    <div v-else-if="categories.length === 0" class="p-12 text-center bg-black/20 border border-white/5 rounded-xl border-dashed">
       <p class="text-text-muted">尚未发布任何支持文章</p>
    </div>

    <div v-else class="space-y-12">
      <div v-for="category in categories" :key="category.id" class="space-y-4">
         <h2 class="text-xl font-serif text-wealth flex items-center gap-2 border-b border-white/10 pb-2">
            <component :is="BookOpen" class="w-5 h-5" />
            {{ getLocalized(category, 'name') }}
         </h2>
         
         <div class="space-y-3 pl-2">
           <el-collapse v-model="activeNames" accordion class="!border-t-0 !border-b-0 space-y-3 faq-collapse">
             <el-collapse-item 
               v-for="item in category.items" 
               :key="item.id" 
               :name="item.id"
               class="bg-black/20 rounded-xl overflow-hidden border border-white/5 data-[is-active=true]:border-wealth/30 transition-colors"
             >
               <template #title>
                 <span class="text-text font-medium text-base hover:text-wealth transition-colors px-4 flex-1 text-left">
                   {{ getLocalized(item, 'question') }}
                 </span>
               </template>
               <div class="px-5 pb-4 pt-2 text-text-muted leading-relaxed text-sm prose prose-invert max-w-none" v-html="getLocalized(item, 'answer')"></div>
               
               <!-- Helpful Action -->
               <div class="px-5 pb-4 flex items-center justify-between border-t border-white/5 pt-3 mt-2">
                  <span class="text-xs text-text-muted/50">{{ item.viewCount || 0 }} 次浏览</span>
                  
                  <button 
                     @click="markHelpful(item)" 
                     :disabled="helpfulMarked.includes(item.id)"
                     class="flex items-center gap-1.5 text-xs transition-colors px-3 py-1 rounded-full border"
                     :class="helpfulMarked.includes(item.id) ? 'bg-wealth/10 border-wealth/20 text-wealth' : 'bg-transparent border-white/10 text-text-muted hover:border-wealth/30 hover:text-text'"
                  >
                     <component :is="ThumbsUp" class="w-3.5 h-3.5" />
                     {{ helpfulMarked.includes(item.id) ? '感谢反馈' : '对我有帮助' }}
                  </button>
               </div>
             </el-collapse-item>
           </el-collapse>
         </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Headset, BookOpen, ThumbsUp } from 'lucide-vue-next'
import { portalApi } from '@/api'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import type { FaqCategory, FaqItem } from '@tonghai/shared'

const { locale } = useI18n()
const loading = ref(true)
const categories = ref<FaqCategory[]>([])
const activeNames = ref<string[]>([])
const helpfulMarked = ref<string[]>([])

onMounted(async () => {
  await fetchFaqs()
})

async function fetchFaqs(): Promise<void> {
  loading.value = true
  try {
    const res = await portalApi.getFaqs()
    categories.value = res || []
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '加载知识库失败'
    ElMessage.error(msg)
  } finally {
    loading.value = false
  }
}

async function markHelpful(item: FaqItem): Promise<void> {
  if (helpfulMarked.value.includes(item.id)) return
  
  try {
    await portalApi.markFaqHelpful(item.id)
    helpfulMarked.value.push(item.id)
  } catch (err) {
    // silently fail
  }
}

function getLocalized(obj: Record<string, unknown>, field: 'name' | 'question' | 'answer'): string {
  const isEn = locale.value === 'en'
  if (isEn && obj[`${field}En`]) {
    return obj[`${field}En`] as string
  }
  return (obj[field] as string) || ''
}
</script>

<style scoped>
/* 深度自定义 Element Plus Collapse 样式以匹配深色拟物 */
:deep(.faq-collapse .el-collapse-item__header) {
  background-color: transparent !important;
  border-bottom: none !important;
  height: auto;
  min-height: 56px;
  line-height: 1.4;
  padding: 12px 0;
}
:deep(.faq-collapse .el-collapse-item__wrap) {
  background-color: transparent !important;
  border-bottom: none !important;
}
:deep(.faq-collapse .el-collapse-item__content) {
  padding-bottom: 0;
}
</style>
