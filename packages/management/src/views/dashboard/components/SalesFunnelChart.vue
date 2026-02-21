<template>
  <div class="glass-card section-card">
    <div class="card-header">
      <h3><el-icon><DataAnalysis /></el-icon> 销售转化漏斗</h3>
      <el-tag size="small" effect="plain" type="info">本月</el-tag>
    </div>
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { DataAnalysis } from '@element-plus/icons-vue'
import * as echarts from '@/utils/echarts'

const chartRef = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null

const initChart = () => {
  if (chartRef.value) {
    chart = echarts.init(chartRef.value)
    
    // 模拟更真实的漏斗比例
    const data = [
      { value: 100, name: '访问' }, // 模拟顶层
      { value: 60, name: '意向确认' },
      { value: 40, name: '方案报价' },
      { value: 20, name: '合同谈判' },
      { value: 10, name: '成功签约' }
    ]

    chart.setOption({
      tooltip: { trigger: 'item' },
      color: ['#6366F1', '#818CF8', '#A5B4FC', '#C7D2FE', '#E0E7FF'],
      series: [{
        name: '销售转化',
        type: 'funnel',
        left: '10%',
        top: 10,
        bottom: 10,
        width: '80%',
        min: 0,
        max: 100,
        minSize: '0%',
        maxSize: '100%',
        sort: 'descending',
        gap: 2,
        label: { 
          show: true, 
          position: 'right',
          formatter: '{b} {c}%',
          color: '#64748B'
        },
        itemStyle: { borderColor: '#fff', borderWidth: 2 },
        data
      }]
    })
  }
}

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
