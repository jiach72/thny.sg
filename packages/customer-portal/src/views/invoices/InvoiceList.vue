<template>
  <div class="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
    <!-- 头部 -->
    <div class="flex items-end justify-between">
      <div>
        <h1 class="font-serif text-3xl text-text mb-2">我的账单</h1>
        <p class="text-sm text-text-muted">管理您的发票及付款历史</p>
      </div>
    </div>

    <div class="space-y-4">
      <!-- 筛选标签 -->
      <div class="flex gap-2 mb-6">
        <button v-for="st in statusOptions" :key="st.value" 
          class="px-4 py-1.5 rounded-full text-sm transition-colors border"
          :class="activeStatus === st.value ? 'bg-wealth/20 text-wealth border-wealth/30' : 'bg-transparent text-text-muted border-white/10 hover:border-white/20'"
          @click="setStatus(st.value)"
        >
          {{ st.label }}
        </button>
      </div>

      <div v-if="loading" class="p-8 text-center bg-glass/20 border border-white/5 rounded-xl">
        <p class="text-text-muted animate-pulse">正在载入账单信息...</p>
      </div>

      <div v-else-if="invoices.length === 0" class="p-8 text-center bg-glass/10 border border-white/5 border-dashed rounded-xl">
         <p class="text-text-muted">暂无相关记录</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="inv in invoices" :key="inv.id" class="p-6 rounded-xl bg-glass/20 border border-white/5 hover:border-wealth/30 transition-all cursor-pointer group" @click="viewDetail(inv)">
           <div class="flex justify-between items-start mb-4">
              <div>
                 <span class="text-xs text-text-muted uppercase tracking-wide">账单号: #{{ inv.invoiceNumber }}</span>
                 <h3 class="font-serif text-lg text-text mt-1 group-hover:text-wealth transition-colors">{{ inv.project?.title || '通用账单' }}</h3>
              </div>
              <span class="px-2 py-1 rounded text-xs font-bold" :class="getStatusClass(inv.status)">
                 {{ getStatusLabel(inv.status) }}
              </span>
           </div>
           
           <div class="flex justify-between items-end mb-2">
              <div>
                 <p class="text-xs text-text-muted">截止日期: {{ formatDate(inv.dueDate) }}</p>
              </div>
              <div class="text-right">
                 <p class="text-2xl font-serif text-text">{{ Number(inv.totalAmount).toLocaleString() }} <span class="text-sm text-text-muted">{{ inv.currency }}</span></p>
              </div>
           </div>
        </div>
      </div>
      
      <!-- 详情弹窗 -->
      <el-dialog v-model="showDetail" :title="`账单详情 #${currentInvoice?.invoiceNumber}`" width="600px" custom-class="bg-obsidian border border-white/10">
         <div v-if="currentInvoice" class="space-y-6">
            <div class="flex justify-between items-center pb-4 border-b border-white/10">
               <div>
                  <h4 class="text-sm text-text-muted">关联项目</h4>
                  <p class="text-base text-text">{{ currentInvoice.project?.title || '无' }}</p>
               </div>
               <div class="text-right">
                  <h4 class="text-sm text-text-muted">应付总额</h4>
                  <p class="text-xl font-serif text-wealth">{{ Number(currentInvoice.totalAmount).toLocaleString() }} <span class="text-xs">{{ currentInvoice.currency }}</span></p>
               </div>
            </div>
            
            <div v-if="(currentInvoice as any).status === 'UNPAID' || (currentInvoice as any).status === 'OVERDUE' || (currentInvoice as any).status === 'PENDING'" class="bg-orange-500/10 border border-orange-500/20 p-4 rounded-lg">
               <p class="text-sm text-orange-400 mb-2">此账单正在等待付款。</p>
               <p class="text-xs text-text-muted">请通过线下转账、支票或联系您的客户经理完成付款。付款成功后我们将会更新状态。</p>
            </div>
            
            <div v-if="currentInvoice.payments && currentInvoice.payments.length > 0">
               <h4 class="text-sm font-bold text-text mb-3">付款历史</h4>
               <div class="space-y-2">
                  <div v-for="pay in currentInvoice.payments" :key="pay.id" class="flex justify-between p-3 bg-white/5 rounded text-sm">
                     <span class="text-text-muted">{{ formatDate(pay.paidAt) }} ({{ pay.method }})</span>
                     <span class="text-green-400 font-bold">+ {{ Number(pay.amount).toLocaleString() }}</span>
                  </div>
               </div>
            </div>
         </div>
         <template #footer>
            <div class="flex justify-end pt-4 border-t border-white/10">
               <button @click="showDetail = false" class="px-4 py-2 bg-white/10 hover:bg-white/20 text-text text-sm rounded transition-colors">关闭</button>
            </div>
         </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { invoiceApi } from '@/api'
import { ElMessage } from 'element-plus'
import type { Invoice } from '@tonghai/shared'

const loading = ref(true)
const invoices = ref<Invoice[]>([])
const activeStatus = ref('')
const showDetail = ref(false)
const currentInvoice = ref<Invoice | null>(null)

const statusOptions = [
  { label: '全部', value: '' },
  { label: '待付款', value: 'PENDING' },
  { label: '部分支付', value: 'PARTIAL' },
  { label: '已完成', value: 'PAID' }
]

onMounted(() => {
  fetchInvoices()
})

async function fetchInvoices(): Promise<void> {
  loading.value = true
  try {
    const res = await invoiceApi.getMyInvoices({ 
       status: activeStatus.value || undefined,
       limit: 50
    })
    invoices.value = res.data || []
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '获取账单失败'
    ElMessage.error(msg)
  } finally {
    loading.value = false
  }
}

function setStatus(status: string): void {
  activeStatus.value = status
  fetchInvoices()
}

async function viewDetail(inv: Invoice): Promise<void> {
  try {
    const detail = await invoiceApi.getInvoiceById(inv.id)
    currentInvoice.value = detail
    showDetail.value = true
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '获取账单详情失败'
    ElMessage.error(msg)
  }
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    DRAFT: '草稿',
    PENDING: '待付款',
    PAID: '已支付',
    PARTIAL: '部分支付',
    CANCELLED: '已取消'
  }
  return map[status] || status
}

function getStatusClass(status: string): string {
  if (status === 'PAID') return 'bg-green-500/20 text-green-400'
  if (status === 'PENDING') return 'bg-orange-500/20 text-orange-400'
  if (status === 'CANCELLED') return 'bg-white/10 text-text-muted'
  return 'bg-blue-500/20 text-blue-400'
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>
