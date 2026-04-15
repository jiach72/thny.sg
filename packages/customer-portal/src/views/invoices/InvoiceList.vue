<template>
  <div class="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
    <div class="flex items-end justify-between">
      <div>
        <h1 class="font-serif text-3xl text-text mb-2">{{ t('invoices.title') }}</h1>
        <p class="text-sm text-text-muted">{{ t('invoices.subtitle') }}</p>
      </div>
    </div>

    <div class="space-y-4">
      <div class="flex gap-2 mb-6">
        <button v-for="st in statusOptions" :key="st.value"
          class="px-4 py-1.5 rounded-full text-sm transition-colors border"
          :class="activeStatus === st.value ? 'bg-wealth/20 text-wealth border-wealth/30' : 'bg-transparent text-text-muted border-white/10 hover:border-white/20'"
          @click="setStatus(st.value)"
        >
          {{ st.label }}
        </button>
      </div>

      <LoadingState v-if="loading" :text="t('invoices.loading')" />

      <EmptyState v-else-if="invoices.length === 0" icon="invoice" :title="t('invoices.emptyTitle')" :description="t('invoices.emptyDesc')" />

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="inv in invoices" :key="inv.id" class="p-6 rounded-xl bg-glass/20 border border-white/5 hover:border-wealth/30 transition-all cursor-pointer group" @click="viewDetail(inv)">
           <div class="flex justify-between items-start mb-4">
              <div>
                 <span class="text-xs text-text-muted uppercase tracking-wide">{{ t('invoices.invoiceNumber') }} #{{ inv.invoiceNumber }}</span>
                 <h3 class="font-serif text-lg text-text mt-1 group-hover:text-wealth transition-colors">{{ inv.project?.title || t('invoices.generalInvoice') }}</h3>
              </div>
              <span class="px-2 py-1 rounded text-xs font-bold" :class="getStatusClass(inv.status)">
                 {{ getStatusLabel(inv.status) }}
              </span>
           </div>

           <div class="flex justify-between items-end mb-2">
              <div>
                 <p class="text-xs text-text-muted">{{ t('invoices.dueDate') }} {{ formatDate(inv.dueDate) }}</p>
              </div>
              <div class="text-right">
                 <p class="text-2xl font-serif text-text">{{ Number(inv.totalAmount).toLocaleString() }} <span class="text-sm text-text-muted">{{ inv.currency }}</span></p>
              </div>
           </div>
        </div>
      </div>

      <el-dialog v-model="showDetail" :title="`${t('invoices.detailTitle')} #${currentInvoice?.invoiceNumber}`" width="600px" custom-class="bg-obsidian border border-white/10">
         <div v-if="currentInvoice" class="space-y-6">
            <div class="flex justify-between items-center pb-4 border-b border-white/10">
               <div>
                  <h4 class="text-sm text-text-muted">{{ t('invoices.relatedProject') }}</h4>
                  <p class="text-base text-text">{{ currentInvoice.project?.title || t('invoices.none') }}</p>
               </div>
               <div class="text-right">
                  <h4 class="text-sm text-text-muted">{{ t('invoices.totalAmount') }}</h4>
                  <p class="text-xl font-serif text-wealth">{{ Number(currentInvoice.totalAmount).toLocaleString() }} <span class="text-xs">{{ currentInvoice.currency }}</span></p>
               </div>
            </div>

            <div v-if="isUnpaid(currentInvoice)" class="bg-orange-500/10 border border-orange-500/20 p-4 rounded-lg">
               <p class="text-sm text-orange-400 mb-2">{{ t('invoices.waitingPayment') }}</p>
               <p class="text-xs text-text-muted mb-4">{{ t('invoices.paymentInstruction') }}</p>
               <button @click="handlePayNow(currentInvoice)" :disabled="paying" class="px-5 py-2.5 text-sm font-bold text-obsidian bg-wealth rounded shadow-lg shadow-wealth/20 hover:shadow-wealth/40 transition-all flex items-center gap-2 disabled:opacity-50">
                  <component v-if="paying" :is="Loader2" class="w-4 h-4 animate-spin" />
                  <component v-else :is="CreditCard" class="w-4 h-4" />
                  {{ t('invoices.payNow') }}
               </button>
            </div>

            <div v-if="currentInvoice.payments && currentInvoice.payments.length > 0">
               <h4 class="text-sm font-bold text-text mb-3">{{ t('invoices.paymentHistory') }}</h4>
               <div class="space-y-2">
                  <div v-for="pay in currentInvoice.payments" :key="pay.id" class="flex justify-between p-3 bg-white/5 rounded text-sm">
                     <span class="text-text-muted">{{ formatDate(pay.paidAt) }} ({{ pay.method }})</span>
                     <span class="text-green-400 font-bold">+ {{ Number(pay.amount).toLocaleString() }}</span>
                  </div>
               </div>
            </div>
         </div>
         <template #footer>
            <div class="flex justify-between pt-4 border-t border-white/10">
               <button @click="downloadPdf" :disabled="downloadingPdf" class="px-4 py-2 bg-wealth/10 hover:bg-wealth/20 text-wealth text-sm font-bold rounded transition-colors disabled:opacity-50 flex items-center gap-2 border border-wealth/20">
                  <span v-if="downloadingPdf" class="animate-spin">⟳</span>
                  <component v-else :is="Download" class="w-4 h-4" />
                  {{ t('invoices.downloadPdf') }}
               </button>
               <button @click="showDetail = false" class="px-4 py-2 bg-white/10 hover:bg-white/20 text-text text-sm rounded transition-colors">{{ t('common.cancel') }}</button>
            </div>
         </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { portalApi } from '@/api'
import { ElMessage } from 'element-plus'
import { Download, CreditCard, Loader2 } from 'lucide-vue-next'
import type { Invoice } from '@tonghai/shared'
import EmptyState from '@/components/EmptyState.vue'
import LoadingState from '@/components/LoadingState.vue'

const { t } = useI18n()
const loading = ref(true)
const invoices = ref<Invoice[]>([])
const activeStatus = ref('')
const showDetail = ref(false)
const currentInvoice = ref<Invoice | null>(null)
const downloadingPdf = ref(false)
const paying = ref(false)

const statusOptions = computed(() => [
  { label: t('invoices.filterAll'), value: '' },
  { label: t('invoices.filterPending'), value: 'PENDING' },
  { label: t('invoices.filterPartial'), value: 'PARTIAL' },
  { label: t('invoices.filterPaid'), value: 'PAID' }
])

onMounted(() => {
  fetchInvoices()
})

async function fetchInvoices(): Promise<void> {
  loading.value = true
  try {
    const res = await portalApi.getInvoices({
       status: activeStatus.value || undefined,
       limit: 50
    })
    invoices.value = res.data || []
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : t('invoices.fetchError')
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
    const detail = await portalApi.getInvoice(inv.id)
    currentInvoice.value = detail
    showDetail.value = true
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : t('invoices.fetchDetailError')
    ElMessage.error(msg)
  }
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    DRAFT: t('invoices.statusDraft'),
    PENDING: t('invoices.statusPending'),
    PAID: t('invoices.statusPaid'),
    PARTIAL: t('invoices.statusPartial'),
    CANCELLED: t('invoices.statusCancelled')
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

function isUnpaid(inv: Invoice | null): boolean {
  if (!inv) return false
  const status = (inv as any).status as string
  return status === 'UNPAID' || status === 'OVERDUE' || status === 'PENDING'
}

async function handlePayNow(inv: Invoice): Promise<void> {
  paying.value = true
  try {
    const res = await portalApi.createPaymentCheckout(inv.id)
    if (res.url) {
      window.location.href = res.url
    } else {
      ElMessage.error(t('invoices.paymentLinkError'))
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : t('invoices.paymentError')
    ElMessage.error(msg)
  } finally {
    paying.value = false
  }
}

async function downloadPdf(): Promise<void> {
  if (!currentInvoice.value) return
  downloadingPdf.value = true
  try {
    const blob = await portalApi.downloadInvoicePdf(currentInvoice.value.id)
    const url = window.URL.createObjectURL(new Blob([blob as any], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${t('invoices.pdfFileName')}_${currentInvoice.value.invoiceNumber}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error: unknown) {
    ElMessage.error((error as Error).message || t('invoices.downloadPdf'))
  } finally {
    downloadingPdf.value = false
  }
}
</script>
