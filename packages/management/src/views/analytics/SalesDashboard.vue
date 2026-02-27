<template>
  <div class="sales-dashboard">
    <!-- 页面标题与日期选择器 -->
    <div class="dashboard-header">
      <h2 class="page-title">销售分析仪表板</h2>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        :shortcuts="dateShortcuts"
        @change="refreshData"
      />
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="8" animated />
    </div>

    <template v-else>
      <!-- 第一行：漏斗 + 趋势 -->
      <el-row :gutter="20" class="chart-row">
        <el-col :xs="24" :lg="12">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>销售漏斗</span>
                <el-tag type="info" size="small">各阶段线索分布</el-tag>
              </div>
            </template>
            <div class="chart-container">
              <div ref="funnelChartRef" style="width: 100%; height: 300px;"></div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :lg="12">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>线索趋势</span>
                <el-tag type="info" size="small">月度统计</el-tag>
              </div>
            </template>
            <div class="chart-container">
              <div ref="trendChartRef" style="width: 100%; height: 300px;"></div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 投资回报与渠道 (合并排版) -->
      <el-row :gutter="20" class="chart-row">
        <!-- 营收走势图 -->
        <el-col :xs="24" :lg="12">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>营收走势</span>
                <el-tag type="success" size="small">实收金额 (SGD)</el-tag>
              </div>
            </template>
            <div class="chart-container">
              <div ref="revenueChartRef" style="width: 100%; height: 300px;"></div>
            </div>
          </el-card>
        </el-col>

        <!-- 渠道 ROI 数据表 -->
        <el-col :xs="24" :lg="12">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>渠道 ROI (投资回报与质量)</span>
                <el-tag type="info" size="small">各来源渠道</el-tag>
              </div>
            </template>
            <div class="chart-container">
              <el-table :data="channelData" stripe style="width: 100%">
                <el-table-column prop="channel" label="渠道" />
                <el-table-column prop="leadCount" label="线索" width="60" />
                <el-table-column prop="convertedCount" label="转化" width="60" />
                <el-table-column label="留存率" width="80">
                  <template #default="{ row }">
                    <span :style="{ color: row.conversionRate >= 10 ? '#67C23A' : '#F56C6C' }">{{ row.conversionRate }}%</span>
                  </template>
                </el-table-column>
                <el-table-column label="总营收 (SGD)" width="120">
                  <template #default="{ row }">
                    <strong>S$ {{ row.revenue?.toLocaleString() || '0' }}</strong>
                  </template>
                </el-table-column>
                <el-table-column label="线索均值" width="90">
                  <template #default="{ row }">
                    <el-rate
                      :model-value="row.avgScore / 20"
                      disabled
                      :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
                    />
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 团队绩效与底栏 -->
      <el-row :gutter="20" class="chart-row">
        <el-col :xs="24" :lg="12">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>团队绩效</span>
                <el-tag type="info" size="small">销售排名</el-tag>
              </div>
            </template>
            <div class="chart-container">
              <el-table :data="teamData" stripe style="width: 100%">
                <el-table-column label="排名" width="60" type="index" />
                <el-table-column label="销售" width="140">
                  <template #default="{ row }">
                    <div style="display: flex; align-items: center; gap: 8px">
                      <el-avatar :size="28" :src="row.avatarUrl">
                        {{ row.name?.charAt(0) }}
                      </el-avatar>
                      <span>{{ row.name }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="total" label="线索总数" width="90" />
                <el-table-column prop="converted" label="已转化" width="80" />
                <el-table-column label="转化率" width="90">
                  <template #default="{ row }">
                    <el-tag :type="row.conversionRate >= 25 ? 'success' : 'info'">
                      {{ row.conversionRate }}%
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 第三行：预测分析 -->
      <el-row :gutter="20" class="chart-row">
        <el-col :span="24">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>预测分析</span>
                <el-tag type="info" size="small">基于历史数据</el-tag>
              </div>
            </template>
            <div class="chart-container" v-if="forecastData.forecast">
              <el-table :data="forecastData.forecast" stripe style="width: 100%">
                <el-table-column prop="period" label="预测期间" />
                <el-table-column prop="predictedLeads" label="预测线索数" />
                <el-table-column prop="predictedConversions" label="预测转化数" />
                <el-table-column label="信心度">
                  <template #default="{ row }">
                    <el-progress
                      :percentage="row.confidence"
                      :color="row.confidence >= 60 ? '#67C23A' : '#E6A23C'"
                      :stroke-width="8"
                    />
                  </template>
                </el-table-column>
              </el-table>
              <div class="forecast-note">
                基于近 {{ forecastData.basedOnMonths }} 个月数据预测
              </div>
            </div>
            <el-empty v-else description="数据不足，无法预测" />
          </el-card>
        </el-col>
      </el-row>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, shallowRef } from 'vue'
import { analyticsApi } from '@/api/analyticsApi'
import { ElMessage } from 'element-plus'
import echarts from '@/utils/echarts'

interface FunnelItem { stage: string; count: number; percentage: number }
interface TrendItem { period: string; total: number; converted: number; conversionRate: number }
interface RevenueItem { period: string; revenue: number }
interface ChannelItem { channel: string; leadCount: number; convertedCount: number; conversionRate: number; avgScore: number; revenue: number }
interface TeamItem { userId: string; name: string; avatarUrl: string | null; total: number; converted: number; conversionRate: number }
interface ForecastResult { forecast: Array<{ period: string; predictedLeads: number; predictedConversions: number; confidence: number }>; basedOnMonths: number; message?: string }

const dateRange = ref<[Date, Date]>()
const loading = ref(false)
const funnelData = ref<FunnelItem[]>([])
const trendData = ref<TrendItem[]>([])
const revenueData = ref<RevenueItem[]>([])
const channelData = ref<ChannelItem[]>([])
const teamData = ref<TeamItem[]>([])
const forecastData = ref<ForecastResult>({ forecast: [], basedOnMonths: 0 })

// ECharts Refs
const funnelChartRef = ref<HTMLElement | null>(null)
const trendChartRef = ref<HTMLElement | null>(null)
const revenueChartRef = ref<HTMLElement | null>(null)
const funnelChartInstance = shallowRef<any>(null)
const trendChartInstance = shallowRef<any>(null)
const revenueChartInstance = shallowRef<any>(null)

const stageLabels: Record<string, string> = {
  NEW: '新线索',
  CONTACTED: '已联系',
  QUALIFIED: '已确认',
  IN_PROGRESS: '进行中',
  CONVERTED: '已转化',
  LOST: '已流失',
}

const dateShortcuts = [
  { text: '近 7 天', value: () => { const e = new Date(); const s = new Date(); s.setDate(s.getDate() - 7); return [s, e] } },
  { text: '近 30 天', value: () => { const e = new Date(); const s = new Date(); s.setDate(s.getDate() - 30); return [s, e] } },
  { text: '近 90 天', value: () => { const e = new Date(); const s = new Date(); s.setDate(s.getDate() - 90); return [s, e] } },
]

async function refreshData() {
  loading.value = true
  try {
    const params = dateRange.value
      ? { startDate: dateRange.value[0].toISOString(), endDate: dateRange.value[1].toISOString() }
      : {}

    const [funnel, trend, revenue, channel, team, forecast] = await Promise.all([
      analyticsApi.getSalesFunnel(params),
      analyticsApi.getTrend({ period: 'month', months: 6 }),
      analyticsApi.getRevenueTrend({ period: 'month', months: 6 }),
      analyticsApi.getChannels(params),
      analyticsApi.getTeamPerformance(params),
      analyticsApi.getForecast({ months: 3 }),
    ])

    funnelData.value = Array.isArray(funnel) ? funnel : (funnel as any)?.data || []
    trendData.value = Array.isArray(trend) ? trend : (trend as any)?.data || []
    revenueData.value = Array.isArray(revenue) ? revenue : (revenue as any)?.data || []
    channelData.value = Array.isArray(channel) ? channel : (channel as any)?.data || []
    teamData.value = Array.isArray(team) ? team : (team as any)?.data || []
    forecastData.value = (forecast as any)?.data || forecast || { forecast: [], basedOnMonths: 0 }

    await nextTick()
    renderCharts()
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : '加载分析数据失败')
  } finally {
    loading.value = false
  }
}

function renderCharts() {
  // 渲染漏斗图
  if (funnelChartRef.value) {
    if (!funnelChartInstance.value) {
      funnelChartInstance.value = echarts.init(funnelChartRef.value)
    }
    const safeFunnelData = funnelData.value.filter(item => item.count > 0).map(item => ({
      name: stageLabels[item.stage] || item.stage,
      value: item.count
    }))
    
    funnelChartInstance.value.setOption({
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b} : {c}'
      },
      series: [
        {
          name: '漏斗分析',
          type: 'funnel',
          left: '10%',
          top: 30,
          bottom: 30,
          width: '80%',
          min: 0,
          max: funnelData.value.length ? Math.max(...funnelData.value.map(d => d.count)) : 100,
          minSize: '0%',
          maxSize: '100%',
          sort: 'descending',
          gap: 2,
          label: {
            show: true,
            position: 'inside',
            formatter: '{b} ({c})'
          },
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 1
          },
          data: safeFunnelData
        }
      ]
    })
  }

  // 渲染趋势图
  if (trendChartRef.value) {
    if (!trendChartInstance.value) {
      trendChartInstance.value = echarts.init(trendChartRef.value)
    }
    const xAxisData = trendData.value.map(item => item.period)
    const totalData = trendData.value.map(item => item.total)
    const convertedData = trendData.value.map(item => item.converted)

    trendChartInstance.value.setOption({
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['总线索量', '转化量']
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: xAxisData
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: '总线索量',
          type: 'line',
          smooth: true,
          itemStyle: { color: '#409EFF' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64,158,255,0.3)' },
              { offset: 1, color: 'rgba(64,158,255,0.05)' }
            ])
          },
          data: totalData
        },
        {
          name: '转化量',
          type: 'line',
          smooth: true,
          itemStyle: { color: '#67C23A' },
          data: convertedData
        }
      ]
    })
  }

  // 渲染营收趋势图
  if (revenueChartRef.value) {
    if (!revenueChartInstance.value) {
      revenueChartInstance.value = echarts.init(revenueChartRef.value)
    }
    const rXAxisData = revenueData.value.map(item => item.period)
    const rYAxisData = revenueData.value.map(item => item.revenue)

    revenueChartInstance.value.setOption({
      tooltip: {
        trigger: 'axis',
        formatter: '{b} <br/>实收: S$ {c}'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: rXAxisData
      },
      yAxis: {
        type: 'value',
        name: 'SGD'
      },
      series: [
        {
          name: '营收 (实收)',
          type: 'line',
          smooth: true,
          itemStyle: { color: '#E6A23C' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(230,162,60,0.3)' },
              { offset: 1, color: 'rgba(230,162,60,0.05)' }
            ])
          },
          data: rYAxisData
        }
      ]
    })
  }
}

const handleResize = () => {
  funnelChartInstance.value?.resize()
  trendChartInstance.value?.resize()
  revenueChartInstance.value?.resize()
}

onMounted(() => {
  // 默认近 30 天
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)
  dateRange.value = [start, end]
  refreshData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  funnelChartInstance.value?.dispose()
  trendChartInstance.value?.dispose()
  revenueChartInstance.value?.dispose()
})
</script>

<style scoped>
.sales-dashboard {
  padding: 20px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-row {
  margin-bottom: 20px;
}

.chart-container {
  min-height: 200px;
}

.loading-container {
  padding: 40px;
}

.funnel-item {
  margin-bottom: 16px;
}

.funnel-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 14px;
  color: #606266;
}

.funnel-count {
  font-weight: 600;
  color: #303133;
}

.forecast-note {
  text-align: center;
  color: #909399;
  font-size: 12px;
  margin-top: 12px;
}
</style>
