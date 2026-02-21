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

const chartRef = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null
const trendPeriod = ref('week')

const initChart = () => {
  if (chartRef.value) {
    chart = echarts.init(chartRef.value)
    updateChart()
  }
}

const updateChart = () => {
  if (!chart) return

  // 模拟趋势数据
  const data = trendPeriod.value === 'week' 
    ? [120, 132, 101, 134, 90, 230, 210]
    : [820, 932, 901, 934, 1290, 1330, 1320] // Mock monthly data
  
  const dates = trendPeriod.value === 'week'
    ? ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    : ['1日', '5日', '10日', '15日', '20日', '25日', '30日']

  chart.setOption({
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
