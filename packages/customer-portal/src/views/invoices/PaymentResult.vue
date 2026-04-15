<template>
  <div class="min-h-screen flex items-center justify-center p-6">
    <div class="w-full max-w-md p-8 rounded-2xl bg-glass/20 border border-white/10 text-center space-y-6">
      <div class="w-20 h-20 mx-auto rounded-full flex items-center justify-center" :class="isSuccess ? 'bg-green-500/20' : 'bg-orange-500/20'">
        <component :is="isSuccess ? CheckCircle : XCircle" class="w-10 h-10" :class="isSuccess ? 'text-green-400' : 'text-orange-400'" />
      </div>

      <div>
        <h1 class="font-serif text-2xl text-text mb-2">{{ isSuccess ? '支付成功' : '支付未完成' }}</h1>
        <p class="text-sm text-text-muted">{{ isSuccess ? '您的付款已成功处理，账单状态将自动更新。' : '支付流程已取消，您可以稍后继续完成付款。' }}</p>
      </div>

      <div v-if="isSuccess" class="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
        <p class="text-xs text-green-400">如需查看支付详情，请前往账单页面查看付款记录。</p>
      </div>

      <div class="flex gap-3 justify-center pt-2">
        <button @click="goToInvoices" class="px-6 py-2.5 text-sm font-bold text-obsidian bg-wealth rounded shadow-lg shadow-wealth/20 hover:shadow-wealth/40 transition-all">
          查看账单
        </button>
        <button @click="goToDashboard" class="px-6 py-2.5 text-sm text-text bg-white/10 hover:bg-white/20 rounded border border-white/10 transition-colors">
          返回首页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CheckCircle, XCircle } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const isSuccess = computed(() => route.name === 'PaymentSuccess')

function goToInvoices(): void {
  router.push('/invoices')
}

function goToDashboard(): void {
  router.push('/dashboard')
}
</script>
