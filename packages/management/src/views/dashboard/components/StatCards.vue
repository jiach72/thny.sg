<template>
  <div class="stat-row">
    <div class="glass-card stat-card primary-gradient">
      <div class="stat-icon-wrapper"><el-icon><User /></el-icon></div>
      <div class="stat-info">
        <span class="label">总线索</span>
        <span class="value">{{ leadStats?.total || 0 }}</span>
      </div>
    </div>
    <div class="glass-card stat-card success-gradient">
      <div class="stat-icon-wrapper"><el-icon><TrendCharts /></el-icon></div>
      <div class="stat-info">
        <span class="label">转化率</span>
        <span class="value">{{ conversionRate }}%</span>
      </div>
    </div>
    <div class="glass-card stat-card warning-gradient">
      <div class="stat-icon-wrapper"><el-icon><List /></el-icon></div>
      <div class="stat-info">
        <span class="label">进行中任务</span>
        <span class="value">{{ taskStats?.total || 0 }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { User, TrendCharts, List } from '@element-plus/icons-vue'
import { useLeadStore, useTaskStore } from '@/stores'

const leadStore = useLeadStore()
const taskStore = useTaskStore()

const { stats: leadStats } = storeToRefs(leadStore)
const { stats: taskStats } = storeToRefs(taskStore)

const conversionRate = computed(() => {
  if (!leadStats.value?.total) return 0
  const converted = leadStats.value.byStatus?.CONVERTED || 0
  return Math.round((converted / leadStats.value.total) * 100)
})
</script>

<style scoped>
.stat-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.stat-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-info .label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 4px;
}

.stat-info .value {
  font-size: 28px;
  font-weight: 600;
  color: #fff;
  font-family: 'Outfit', sans-serif;
}

/* Gradients for cards */
.primary-gradient {
  background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
}

.success-gradient {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
}

.warning-gradient {
  background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
}

@media (max-width: 768px) {
  .stat-row {
    grid-template-columns: 1fr;
  }
}
</style>
