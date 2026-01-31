<template>
  <div class="glass-card section-card flex-2">
    <div class="card-header">
      <h3><el-icon><User /></el-icon> 最新线索</h3>
      <el-button link type="primary" size="small" @click="router.push('/leads')">查看全部</el-button>
    </div>
    <el-table :data="recentLeads" style="width: 100%" :show-header="true" size="small">
      <el-table-column prop="contactName" label="联系人" />
      <el-table-column prop="companyName" label="公司" />
      <el-table-column prop="status" label="状态">
        <template #default="{ row }">
          <el-tag size="small" :type="getStatusType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="60">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="router.push(`/leads/${row.id}`)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { User } from '@element-plus/icons-vue'
import { useLeadStore } from '@/stores'

const router = useRouter()
const leadStore = useLeadStore()
const { leads } = storeToRefs(leadStore)

const recentLeads = computed(() => {
  return (leads.value || []).slice(0, 5)
})

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    NEW: '新增',
    CONTACTED: '已联系',
    QUALIFIED: '合格',
    PROPOSAL: '方案',
    NEGOTIATION: '谈判',
    WON: '成交',
    LOST: '丢失'
  }
  return map[status] || status
}

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    NEW: 'primary',
    CONTACTED: 'warning',
    QUALIFIED: 'success',
    PROPOSAL: 'info',
    NEGOTIATION: 'warning',
    WON: 'success',
    LOST: 'danger'
  }
  return map[status] || 'info'
}
</script>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
}

.section-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}
</style>
