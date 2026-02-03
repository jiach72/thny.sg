<template>
  <div class="dashboard-2">
    <!-- 头部区域 -->
    <header class="glass-header">
      <div class="header-content">
        <div>
          <h1 class="page-title">早安，{{ userName }}</h1>
          <p class="page-desc">今天是 {{ currentDate }}，由于您的高效工作，已有 {{ taskStats?.byStatus?.DONE || 0 }} 项任务完成。</p>
        </div>
        <div class="header-actions">
           <el-button type="primary" class="btn-create" :icon="Plus" @click="handleCreate">快速创建</el-button>
        </div>
      </div>
    </header>

    <!-- 核心网格布局 -->
    <div class="dashboard-grid">
      <!-- 左侧主要内容 -->
      <div class="main-content">
        <!-- 统计卡片行 -->
        <StatCards />

        <!-- 今日焦点 -->
        <TodayFocus 
          @create-lead="handleCreate"
          @create-task="handleCreateTask"
        />

        <div class="content-row">
           <!-- 左列：最新线索表格 -->
           <RecentLeads />

           <!-- 右列：咨询消息流 -->
           <InquiryList />
        </div>

        <!-- 数据图表行 -->
        <div class="stat-row">
             <!-- 销售漏斗 -->
             <SalesFunnelChart />

            <!-- 增长趋势 -->
            <TrendChart />

            <!-- 来源分布 -->
            <SourceChart />
        </div>
      </div>

      <!-- 右侧侧边栏 -->
      <DashboardSidebar />
    </div>

    <!-- 快速创建线索弹窗 -->
    <LeadFormDialog 
        v-model:visible="showCreateDialog"
        @success="handleCreateSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useLeadStore, useTaskStore, useAuthStore } from '@/stores'
import { Plus } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import LeadFormDialog from '../leads/components/LeadFormDialog.vue'

// Import New Components
import StatCards from './components/StatCards.vue'
import TodayFocus from './components/TodayFocus.vue'
import RecentLeads from './components/RecentLeads.vue'
import InquiryList from './components/InquiryList.vue'
import SalesFunnelChart from './components/SalesFunnelChart.vue'
import TrendChart from './components/TrendChart.vue'
import SourceChart from './components/SourceChart.vue'
import DashboardSidebar from './components/DashboardSidebar.vue'

const leadStore = useLeadStore()
const taskStore = useTaskStore()
const authStore = useAuthStore()

const { stats: taskStats } = storeToRefs(taskStore)

const showCreateDialog = ref(false)
const userName = computed(() => authStore.user?.name || '管理员')
const currentDate = dayjs().format('YYYY年MM月DD日 dddd')

const handleCreate = () => {
    showCreateDialog.value = true
}

const handleCreateTask = () => {
    // 导航到任务页面并触发创建
    window.location.href = '/tasks?action=create'
}

const handleCreateSuccess = () => {
    leadStore.fetchStats()
    leadStore.fetchLeads()
}

onMounted(async () => {
    await Promise.all([
        taskStore.fetchStats(),
    ])
})
</script>

<style scoped>
/* 2.0 样式系统 - Glassmorphism & Modern */
.dashboard-2 {
    max-width: 1600px;
    margin: 0 auto;
    color: #1e293b;
    --glass-bg: rgba(255, 255, 255, 0.7);
    --glass-border: 1px solid rgba(255, 255, 255, 0.5);
    --shadow-soft: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    --primary: #6366F1;
}

/* 头部 */
.glass-header {
    margin-bottom: 32px;
}
.header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
}
.page-title {
    font-size: 32px;
    font-weight: 800;
    color: #0F172A;
    margin: 0 0 8px 0;
    letter-spacing: -0.02em;
}
.page-desc {
    color: #64748B;
    font-size: 16px;
    margin: 0;
}
.btn-create {
    background-color: var(--primary);
    border: none;
    padding: 12px 24px;
    font-weight: 600;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    transition: all 0.3s;
}
.btn-create:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
}

/* 布局 */
.dashboard-grid {
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: 32px;
}

.main-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.side-panel {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

/* 内容行 */
.content-row {
    display: flex;
    gap: 24px;
}
.flex-1 { flex: 1; }
.flex-2 { flex: 2; }

/* 通用玻璃卡片 */
.glass-card {
    background: var(--glass-bg);
    backdrop-filter: blur(12px);
    border: var(--glass-border);
    border-radius: 20px;
    box-shadow: var(--shadow-soft);
    padding: 24px;
    transition: transform 0.3s, box-shadow 0.3s;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}
.card-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #334155;
    display: flex;
    align-items: center;
    gap: 8px;
}

/* 统计卡片 */
.stat-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
}


/* 响应式 */
@media (max-width: 1200px) {
    .dashboard-grid { grid-template-columns: 1fr; }
    .side-panel { display: grid; grid-template-columns: 1fr 1fr; }
    .content-row { flex-direction: column; }
}

@media (max-width: 768px) {
    .stat-row { grid-template-columns: 1fr; }
    .side-panel { display: flex; flex-direction: column; }
    .header-content { flex-direction: column; align-items: flex-start; gap: 16px; }
}
</style>
