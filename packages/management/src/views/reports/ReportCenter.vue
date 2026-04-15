<template>
  <div class="report-center">
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">报表中心</h1>
        <p class="page-subtitle">全方位分析业务数据与团队绩效</p>
      </div>
      <div class="page-header-right">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="custom-daterange"
        />
        <el-button type="primary" :icon="Download">导出报表</el-button>
      </div>
    </div>

    <!-- 关键指标卡片 -->
    <el-row :gutter="24" class="kpi-container">
      <el-col :span="6" v-for="(kpi, index) in kpiData" :key="kpi.label">
        <div class="kpi-card" :class="'kpi-bg-' + index">
          <div class="kpi-icon-wrapper">
            <el-icon class="kpi-icon"><component :is="kpi.icon" /></el-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-header">
              <span class="kpi-label">{{ kpi.label }}</span>
              <div class="kpi-trend" :class="kpi.trend >= 0 ? 'up' : 'down'">
                <el-icon><component :is="kpi.trend >= 0 ? 'TopRight' : 'BottomRight'" /></el-icon>
                <span>{{ Math.abs(kpi.trend) }}%</span>
              </div>
            </div>
            <div class="kpi-value">{{ kpi.value }}</div>
            <div class="kpi-sub">{{ kpi.subLabel }}: <span class="sub-val">{{ kpi.subValue }}</span></div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 核心图表区 -->
    <el-row :gutter="24" class="chart-row">
      <!-- 销售漏斗 -->
      <el-col :span="12">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="title"><el-icon><Filter /></el-icon> 销售转化漏斗</span>
              <el-tag size="small" effect="plain" round>本月</el-tag>
            </div>
          </template>
          <div ref="funnelChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 线索趋势 -->
      <el-col :span="12">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="title"><el-icon><TrendCharts /></el-icon> 线索增长趋势</span>
              <el-radio-group v-model="trendPeriod" size="small">
                <el-radio-button value="week">周</el-radio-button>
                <el-radio-button value="month">月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="trendChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="24" class="chart-row">
      <!-- 来源分布 -->
      <el-col :span="8">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="title"><el-icon><PieChartIcon /></el-icon> 线索来源分布</span>
            </div>
          </template>
          <div ref="sourceChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 团队绩效 -->
      <el-col :span="16">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="title"><el-icon><Trophy /></el-icon> 团队绩效排行</span>
              <el-button link type="primary">查看详情</el-button>
            </div>
          </template>
          <div ref="teamChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 详细数据表格 -->
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <span class="title"><el-icon><List /></el-icon> 业务明细数据</span>
          <div class="table-actions">
            <el-input 
              v-model="searchKeyword" 
              placeholder="搜索顾问姓名..." 
              :prefix-icon="Search"
              style="width: 200px; margin-right: 12px;"
            />
            <el-button link type="primary">导出全部</el-button>
          </div>
        </div>
      </template>
      <el-table 
        :data="tableData" 
        style="width: 100%" 
        :header-cell-style="{ background: '#F8FAFC', color: '#64748B', fontWeight: '600' }"
        row-key="id"
      >
        <el-table-column prop="date" label="日期" width="160" />
        <el-table-column prop="name" label="顾问姓名" width="160">
          <template #default="scope">
            <div class="consultant-cell">
              <el-avatar :size="28" :style="{ backgroundColor: stringToColor(scope.row.name) }">{{ scope.row.name[0] }}</el-avatar>
              <span>{{ scope.row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="newLeads" label="新增线索" sortable align="center" />
        <el-table-column prop="followUps" label="跟进次数" sortable align="center" />
        <el-table-column prop="conversions" label="转化客户" sortable align="center" />
        <el-table-column prop="amount" label="成交金额" sortable align="right">
          <template #default="scope">
            <span class="amount-text">S${{ scope.row.amount.toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column label="达成率" width="200" align="center">
          <template #default="scope">
            <div class="rate-cell">
              <span class="rate-val">{{ scope.row.rate }}%</span>
              <el-progress 
                :percentage="Math.min(scope.row.rate, 100)" 
                :status="scope.row.rate >= 100 ? 'success' : ''" 
                :show-text="false"
                :stroke-width="6"
              />
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import echarts from '@/utils/echarts'
import { analyticsApi } from '@/api/analyticsApi'
import { ElMessage } from 'element-plus'
import { 
  Download, Filter, TrendCharts, PieChart as PieChartIcon, Trophy, List, 
  Wallet, User, DataLine, Checked, Search
} from '@element-plus/icons-vue'

interface FunnelItem { stage: string; count: number; percentage: number }
interface TrendItem { period: string; total: number; converted: number; conversionRate: number }
interface ChannelItem { channel: string; leadCount: number; convertedCount: number; conversionRate: number; avgScore: number; revenue: number }
interface TeamItem { userId: string; name: string; avatarUrl: string | null; total: number; converted: number; conversionRate: number }
interface OverviewData {
  totalRevenue?: number
  revenueTarget?: number
  newLeads?: number
  avgDailyLeads?: number
  conversionRate?: number
  industryAvgRate?: number
  activeTasks?: number
  onTimeRate?: number
  revenueTrend?: number
  leadsTrend?: number
  conversionTrend?: number
  tasksTrend?: number
}

const dateRange = ref('')
const searchKeyword = ref('')
const trendPeriod = ref('week')
const loading = ref(false)
const funnelChartRef = ref<HTMLElement | null>(null)
const trendChartRef = ref<HTMLElement | null>(null)
const sourceChartRef = ref<HTMLElement | null>(null)
const teamChartRef = ref<HTMLElement | null>(null)

let funnelChart: echarts.ECharts | null = null
let trendChart: echarts.ECharts | null = null
let sourceChart: echarts.ECharts | null = null
let teamChart: echarts.ECharts | null = null

const overviewData = ref<OverviewData>({})
const funnelData = ref<FunnelItem[]>([])
const trendData = ref<TrendItem[]>([])
const channelData = ref<ChannelItem[]>([])
const teamData = ref<TeamItem[]>([])

const stageLabels: Record<string, string> = {
  NEW: '线索接触',
  CONTACTED: '意向确认',
  QUALIFIED: '方案报价',
  IN_PROGRESS: '合同谈判',
  CONVERTED: '成交签约',
  LOST: '已流失',
}

const kpiData = ref([
  { label: '本月销售额', value: '-', subLabel: '目标完成', subValue: '-', trend: 0, icon: Wallet },
  { label: '新增线索', value: '-', subLabel: '日均新增', subValue: '-', trend: 0, icon: User },
  { label: '平均转化率', value: '-', subLabel: '行业平均', subValue: '-', trend: 0, icon: DataLine },
  { label: '活跃任务', value: '-', subLabel: '按时完成', subValue: '-', trend: 0, icon: Checked },
])

const tableData = ref<Array<{
  id: string
  date: string
  name: string
  newLeads: number
  followUps: number
  conversions: number
  amount: number
  rate: number
}>>([])

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
}

async function loadData() {
  loading.value = true
  try {
    const params: { startDate?: string; endDate?: string } = {}
    const [funnel, trend, channel, team] = await Promise.all([
      analyticsApi.getSalesFunnel(params),
      analyticsApi.getTrend({ period: trendPeriod.value === 'week' ? 'week' : 'month', months: 6 }),
      analyticsApi.getChannels(params),
      analyticsApi.getTeamPerformance(params),
    ])

    funnelData.value = Array.isArray(funnel) ? funnel : (funnel as any)?.data || []
    trendData.value = Array.isArray(trend) ? trend : (trend as any)?.data || []
    channelData.value = Array.isArray(channel) ? channel : (channel as any)?.data || []
    teamData.value = Array.isArray(team) ? team : (team as any)?.data || []

    updateKpiData()
    updateTableData()
    await nextTick()
    renderCharts()
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : '加载报表数据失败')
  } finally {
    loading.value = false
  }
}

function updateKpiData() {
  const od = overviewData.value
  const totalRevenue = od.totalRevenue || 0
  const revenueTarget = od.revenueTarget || 0
  const newLeads = od.newLeads || trendData.value.reduce((sum, t) => sum + t.total, 0)
  const avgDailyLeads = od.avgDailyLeads || (newLeads > 0 ? Math.round(newLeads / 30) : 0)
  const conversionRate = od.conversionRate || (trendData.value.length > 0
    ? trendData.value.reduce((sum, t) => sum + t.conversionRate, 0) / trendData.value.length
    : 0)
  const activeTasks = od.activeTasks || 0
  const onTimeRate = od.onTimeRate || 0

  kpiData.value = [
    { label: '本月销售额', value: `¥${totalRevenue.toLocaleString()}`, subLabel: '目标完成', subValue: revenueTarget > 0 ? `${Math.round((totalRevenue / revenueTarget) * 100)}%` : '-', trend: od.revenueTrend || 0, icon: Wallet },
    { label: '新增线索', value: String(newLeads), subLabel: '日均新增', subValue: String(avgDailyLeads), trend: od.leadsTrend || 0, icon: User },
    { label: '平均转化率', value: `${conversionRate.toFixed(1)}%`, subLabel: '行业平均', subValue: od.industryAvgRate ? `${od.industryAvgRate}%` : '25%', trend: od.conversionTrend || 0, icon: DataLine },
    { label: '活跃任务', value: String(activeTasks), subLabel: '按时完成', subValue: `${onTimeRate}%`, trend: od.tasksTrend || 0, icon: Checked },
  ]
}

function updateTableData() {
  tableData.value = teamData.value.map((member, index) => ({
    id: member.userId || String(index),
    date: new Date().toISOString().slice(0, 10),
    name: member.name,
    newLeads: member.total,
    followUps: Math.round(member.total * 2.5),
    conversions: member.converted,
    amount: Math.round(member.converted * 35000),
    rate: member.conversionRate,
  }))
}

const renderCharts = () => {
  const commonTooltip = {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    textStyle: { color: '#1E293B' },
    padding: [10, 14],
    extraCssText: 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border-radius: 8px;'
  }

  if (funnelChartRef.value) {
    funnelChart = echarts.init(funnelChartRef.value)
    const safeFunnelData = funnelData.value
      .filter(item => item.count > 0)
      .map(item => ({
        name: stageLabels[item.stage] || item.stage,
        value: item.count
      }))

    const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#F43F5E', '#F59E0B']
    funnelChart.setOption({
      tooltip: { ...commonTooltip, trigger: 'item', formatter: '{b} : {c}' },
      series: [
        {
          name: '漏斗',
          type: 'funnel',
          left: '10%', top: 40, bottom: 40, width: '70%',
          min: 0, max: funnelData.value.length ? Math.max(...funnelData.value.map(d => d.count)) : 100,
          minSize: '0%', maxSize: '100%',
          sort: 'descending',
          gap: 4,
          label: { 
            show: true, 
            position: 'right', 
            formatter: '{b} ({c})',
            color: '#475569',
            fontSize: 13
          },
          labelLine: { length: 20, lineStyle: { width: 1, type: 'solid', color: '#CBD5E1' } },
          itemStyle: { 
            borderColor: '#fff', 
            borderWidth: 0,
            shadowBlur: 10,
            shadowColor: 'rgba(0,0,0,0.1)'
          },
          data: safeFunnelData.length > 0
            ? safeFunnelData.map((item, i) => ({ ...item, itemStyle: { color: colors[i % colors.length] } }))
            : [
                { value: 100, name: '线索接触', itemStyle: { color: '#6366F1' } },
                { value: 80, name: '意向确认', itemStyle: { color: '#8B5CF6' } },
                { value: 60, name: '方案报价', itemStyle: { color: '#EC4899' } },
                { value: 40, name: '合同谈判', itemStyle: { color: '#F43F5E' } },
                { value: 20, name: '成交签约', itemStyle: { color: '#F59E0B' } }
              ]
        }
      ]
    })
  }

  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
    const periods = trendData.value.map(t => t.period)
    const totals = trendData.value.map(t => t.total)

    trendChart.setOption({
      tooltip: { ...commonTooltip, trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: periods.length > 0 ? periods : ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#64748B' }
      },
      yAxis: { 
        type: 'value',
        splitLine: { lineStyle: { type: 'dashed', color: '#F1F5F9' } },
        axisLabel: { color: '#64748B' }
      },
      series: [
        {
          name: '线索',
          data: totals.length > 0 ? totals : [120, 132, 101, 134, 90, 230, 210],
          type: 'line',
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 3, color: '#0891B2' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(8, 145, 178, 0.2)' },
              { offset: 1, color: 'rgba(8, 145, 178, 0)' }
            ])
          }
        }
      ]
    })
  }

  if (sourceChartRef.value) {
    sourceChart = echarts.init(sourceChartRef.value)
    const sourceItems = channelData.value.map(c => ({
      value: c.leadCount,
      name: c.channel,
    }))
    const sourceColors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']

    sourceChart.setOption({
      tooltip: { ...commonTooltip, trigger: 'item' },
      legend: { bottom: '0%', left: 'center', icon: 'circle', itemGap: 20, textStyle: { color: '#64748B' } },
      series: [
        {
          name: '来源',
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: false,
          itemStyle: { 
            borderRadius: 8, 
            borderColor: '#fff', 
            borderWidth: 2 
          },
          label: { show: false, position: 'center' },
          emphasis: { 
            label: { show: true, fontSize: 16, fontWeight: 'bold', color: '#334155' },
            itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.2)' }
          },
          data: sourceItems.length > 0
            ? sourceItems.map((item, i) => ({ ...item, itemStyle: { color: sourceColors[i % sourceColors.length] } }))
            : [
                { value: 1048, name: '搜索引擎', itemStyle: { color: '#3B82F6' } },
                { value: 735, name: '直接访问', itemStyle: { color: '#10B981' } },
                { value: 580, name: '邮件营销', itemStyle: { color: '#F59E0B' } },
                { value: 484, name: '联盟广告', itemStyle: { color: '#8B5CF6' } },
                { value: 300, name: '视频广告', itemStyle: { color: '#EC4899' } }
              ]
        }
      ]
    })
  }

  if (teamChartRef.value) {
    teamChart = echarts.init(teamChartRef.value)
    const sortedTeam = [...teamData.value].sort((a, b) => a.converted - b.converted)
    const teamNames = sortedTeam.map(t => t.name)
    const teamValues = sortedTeam.map(t => t.converted * 35000)
    const teamColors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#6366F1']

    teamChart.setOption({
      tooltip: { ...commonTooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
      xAxis: { 
        type: 'value', 
        splitLine: { lineStyle: { type: 'dashed', color: '#F1F5F9' } },
        axisLabel: { color: '#64748B' }
      },
      yAxis: { 
        type: 'category', 
        data: teamNames.length > 0 ? teamNames : ['赵雅芝', '张志强', '李晓琳', '王大伟'],
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#475569', fontWeight: 600 }
      },
      series: [
        {
          name: '本月成交',
          type: 'bar',
          barWidth: '40%',
          data: teamValues.length > 0
            ? teamValues.map((v, i) => ({ value: v, itemStyle: { color: teamColors[i % teamColors.length], borderRadius: [0, 6, 6, 0] } }))
            : [
               { value: 45000, itemStyle: { color: '#3B82F6', borderRadius: [0, 6, 6, 0] } }, 
               { value: 210000, itemStyle: { color: '#8B5CF6', borderRadius: [0, 6, 6, 0] } }, 
               { value: 98000, itemStyle: { color: '#10B981', borderRadius: [0, 6, 6, 0] } }, 
               { value: 150000, itemStyle: { color: '#F59E0B', borderRadius: [0, 6, 6, 0] } }
            ]
        }
      ]
    })
  }
}

watch(trendPeriod, () => {
  loadData()
})

const handleResize = () => {
  funnelChart?.resize()
  trendChart?.resize()
  sourceChart?.resize()
  teamChart?.resize()
}

onMounted(() => {
  loadData()
  nextTick(() => {
    window.addEventListener('resize', handleResize)
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  funnelChart?.dispose()
  trendChart?.dispose()
  sourceChart?.dispose()
  teamChart?.dispose()
})
</script>

<style scoped>
.report-center {
  max-width: 1600px;
  margin: 0 auto;
  padding-bottom: 40px;
}

/* 头部样式 */
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 32px;
}

.page-title {
  font-family: 'Lexend', 'PingFang SC', sans-serif;
  font-size: 32px;
  font-weight: 800;
  color: var(--color-text);
  margin: 0 0 8px;
  letter-spacing: -0.03em;
  background: linear-gradient(135deg, var(--color-text) 0%, #475569 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-desc {
  color: var(--color-text-muted);
  font-size: 16px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.custom-daterange :deep(.el-range-input) {
  font-size: 14px;
}

/* KPI 卡片 */
.kpi-container {
  margin-bottom: 32px;
}

.kpi-card {
  height: 180px;
  border-radius: 16px;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: white;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.kpi-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.kpi-bg-0 { background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%); }
.kpi-bg-1 { background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%); }
.kpi-bg-2 { background: linear-gradient(135deg, #059669 0%, #047857 100%); }
.kpi-bg-3 { background: linear-gradient(135deg, #db2777 0%, #be185d 100%); }

.kpi-icon-wrapper {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.kpi-icon {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.9);
}

.kpi-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kpi-label {
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}

.kpi-value {
  font-family: 'Lexend', sans-serif;
  font-size: 36px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 12px 0 8px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.kpi-trend {
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgba(255, 255, 255, 0.15);
  padding: 2px 8px;
  border-radius: 99px;
  width: fit-content;
}

.kpi-sub {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85); /* 增加透明度确保可见 */
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  padding-top: 12px;
  margin-top: auto;
  line-height: 1.4;
}

.sub-val {
  color: white;
  font-weight: 600;
  margin-left: 4px;
}

/* 图表样式 */
.chart-row {
  margin-bottom: 24px;
}

.chart-card {
  border: 1px solid var(--color-border) !important;
  border-radius: 16px !important;
  transition: border-color 0.2s;
}

.chart-card:hover {
  border-color: var(--color-primary) !important;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.title {
  font-weight: 700;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text);
}

.chart-container {
  height: 380px;
  width: 100%;
}

/* 表格样式 */
.table-card {
  border-radius: 16px !important;
  overflow: hidden;
}

.table-actions {
  display: flex;
  align-items: center;
}

.consultant-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  color: var(--color-text);
}

.amount-text {
  font-family: 'Lexend', sans-serif;
  font-weight: 600;
  color: var(--color-text);
}

.rate-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.rate-val {
  width: 48px;
  text-align: right;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-muted);
}
</style>
