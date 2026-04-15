<template>
  <div class="glass-card section-card">
    <div class="card-header">
      <h3><el-icon><TrendCharts /></el-icon> 线索增长趋势</h3>
      <div class="header-actions">
        <el-radio-group v-model="trendPeriod" size="small">
          <el-radio-button value="week">周</el-radio-button>
          <el-radio-button value="month">月</el-radio-button>
        </el-radio-group>
      </div>
    </div>
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { TrendCharts } from '@element-plus/icons-vue'
import * as echarts from '@/utils/echarts'
import { analyticsApi } from '@/api'
import { logger } from '@/utils/logger'

const chartRef = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null
const trendPeriod = ref('week')
const loading = ref(false)

const initChart = () => {
  if (chartRef.value) {
    chart = echarts.init(chartRef.value)
    updateChart()
  }
}

const updateChart = async () => {
  if (!chart) return

  loading.value = true
  try {
    const period = trendPeriod.value === 'week' ? 'week' : 'month'
    const res = await analyticsApi.getTrend({ period, months: period === 'week' ? 1 : 6 })
    const trendData = (res as any)?.data || res

    // 从后端数据提取 counts 和 labels
    const items: Array<{ date: string; count: number }> = trendData?.trend || trendData?.data || []
    const data = items.map((item: any) => item.count ?? item.value ?? 0)
    const dates = items.map((item: any) => {
      const d = item.date || item.label || ''
      return trendPeriod.value === 'week'
        ? d.slice(5) // "2026-04-14" → "04-14"
        : d.slice(5)  // "2026-04" → "04"
    })

    // 无数据时显示空状态
    if (data.length === 0) {
      chart.setOption({
        title: { text: '暂无趋势数据', left: 'center', top: 'center', textStyle: { color: '#94A3B8', fontSize: 14, fontWeight: 'normal' } },
        xAxis: { show: false },
        yAxis: { show: false },
        series: []
      })
      return
    }

    chart.setOption({
      title: { show: false },
      tooltip: { trigger: 'axis' },
      grid: { top: '10%', left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#94A3B8' }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { type: 'dashed', color: '#E2E8F0' } },
        axisLabel: { color: '#94A3B8' }
      },
      series: [{
        name: '新增线索',
        type: 'line',
        smooth: true,
        lineStyle: { width: 3, color: '#0ea5e9' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(14, 165, 233, 0.2)' },
            { offset: 1, color: 'rgba(14, 165, 233, 0)' }
          ])
        },
        showSymbol: false,
        data
      }]
    })
  } catch (error) {
    logger.warn('TrendChart', '趋势数据加载失败', error)
    // 降级：显示空图表
    chart.setOption({
      title: { text: '数据加载失败', left: 'center', top: 'center', textStyle: { color: '#94A3B8', fontSize: 14, fontWeight: 'normal' } },
      xAxis: { show: false },
      yAxis: { show: false },
      series: []
    })
  } finally {
    loading.value = false
  }
}

watch(trendPeriod, () => {
  updateChart()
})

onMounted(() => {
  nextTick(() => {
    initChart()
    window.addEventListener('resize', handleResize)
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
})

const handleResize = () => {
  chart?.resize()
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

.chart-container {
  height: 300px;
  width: 100%;
}
</style>
