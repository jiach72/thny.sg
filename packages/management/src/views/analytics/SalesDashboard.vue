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
              <div
                v-for="item in funnelData"
                :key="item.stage"
                class="funnel-item"
              >
                <div class="funnel-label">
                  <span>{{ stageLabels[item.stage] || item.stage }}</span>
                  <span class="funnel-count">{{ item.count }}</span>
                </div>
                <el-progress
                  :percentage="item.percentage"
                  :color="stageColors[item.stage]"
                  :stroke-width="20"
                />
              </div>
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
              <el-table :data="trendData" stripe style="width: 100%">
                <el-table-column prop="period" label="期间" width="120" />
                <el-table-column prop="total" label="总线索数" />
                <el-table-column prop="converted" label="已转化" />
                <el-table-column label="转化率">
                  <template #default="{ row }">
                    <el-tag :type="row.conversionRate >= 20 ? 'success' : 'warning'">
                      {{ row.conversionRate }}%
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 第二行：渠道 + 团队 -->
      <el-row :gutter="20" class="chart-row">
        <el-col :xs="24" :lg="12">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>渠道效果</span>
                <el-tag type="info" size="small">各来源渠道</el-tag>
              </div>
            </template>
            <div class="chart-container">
              <el-table :data="channelData" stripe style="width: 100%">
                <el-table-column prop="channel" label="渠道" />
                <el-table-column prop="leadCount" label="线索数" width="90" />
                <el-table-column prop="convertedCount" label="转化数" width="90" />
                <el-table-column label="转化率" width="90">
                  <template #default="{ row }">
                    {{ row.conversionRate }}%
                  </template>
                </el-table-column>
                <el-table-column label="平均评分" width="90">
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
import { ref, onMounted } from 'vue'
import { analyticsApi } from '@/api/analyticsApi'
import { ElMessage } from 'element-plus'

interface FunnelItem { stage: string; count: number; percentage: number }
interface TrendItem { period: string; total: number; converted: number; conversionRate: number }
interface ChannelItem { channel: string; leadCount: number; convertedCount: number; conversionRate: number; avgScore: number }
interface TeamItem { userId: string; name: string; avatarUrl: string | null; total: number; converted: number; conversionRate: number }
interface ForecastResult { forecast: Array<{ period: string; predictedLeads: number; predictedConversions: number; confidence: number }>; basedOnMonths: number; message?: string }

const dateRange = ref<[Date, Date]>()
const loading = ref(false)
const funnelData = ref<FunnelItem[]>([])
const trendData = ref<TrendItem[]>([])
const channelData = ref<ChannelItem[]>([])
const teamData = ref<TeamItem[]>([])
const forecastData = ref<ForecastResult>({ forecast: [], basedOnMonths: 0 })

const stageLabels: Record<string, string> = {
  NEW: '新线索',
  CONTACTED: '已联系',
  QUALIFIED: '已确认',
  IN_PROGRESS: '进行中',
  CONVERTED: '已转化',
  LOST: '已流失',
}

const stageColors: Record<string, string> = {
  NEW: '#409EFF',
  CONTACTED: '#67C23A',
  QUALIFIED: '#E6A23C',
  IN_PROGRESS: '#F56C6C',
  CONVERTED: '#909399',
  LOST: '#C0C4CC',
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

    const [funnel, trend, channel, team, forecast] = await Promise.all([
      analyticsApi.getSalesFunnel(params),
      analyticsApi.getTrend({ period: 'month', months: 6 }),
      analyticsApi.getChannels(params),
      analyticsApi.getTeamPerformance(params),
      analyticsApi.getForecast({ months: 3 }),
    ])

    funnelData.value = Array.isArray(funnel) ? funnel : (funnel as any)?.data || []
    trendData.value = Array.isArray(trend) ? trend : (trend as any)?.data || []
    channelData.value = Array.isArray(channel) ? channel : (channel as any)?.data || []
    teamData.value = Array.isArray(team) ? team : (team as any)?.data || []
    forecastData.value = (forecast as any)?.data || forecast || { forecast: [], basedOnMonths: 0 }
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : '加载分析数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 默认近 30 天
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)
  dateRange.value = [start, end]
  refreshData()
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
