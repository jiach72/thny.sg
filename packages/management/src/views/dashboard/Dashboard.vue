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

        <div class="content-row">
           <!-- 左列：最新线索表格 -->
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

           <!-- 右列：咨询消息流 -->
           <div class="glass-card section-card flex-1">
              <div class="card-header">
                  <h3><el-icon><ChatDotRound /></el-icon> 最新咨询</h3>
                  <el-button link type="primary" size="small">查看全部</el-button>
              </div>
              <div class="inquiry-list">
                  <div v-for="inquiry in inquiries" :key="inquiry.id" class="inquiry-item">
                      <div class="inquiry-avatar">
                          {{ inquiry.name.charAt(0).toUpperCase() }}
                      </div>
                      <div class="inquiry-content">
                          <div class="inquiry-top">
                              <span class="name">{{ inquiry.name }}</span>
                              <span class="time">{{ formatTimeAgo(inquiry.createdAt) }}</span>
                          </div>
                          <p class="message">{{ inquiry.message }}</p>
                      </div>
                      <el-button circle size="small" :icon="ArrowRight" @click="handleInquiryClick(inquiry)" />
                  </div>
                   <el-empty v-if="inquiries.length === 0" description="暂无新咨询" :image-size="60" />
              </div>
           </div>
        </div>

        <!-- 数据图表行 -->
        <div class="stat-row">
             <!-- 销售漏斗 -->
             <div class="glass-card section-card">
                 <div class="card-header">
                    <h3><el-icon><DataAnalysis /></el-icon> 销售转化漏斗</h3>
                    <el-tag size="small" effect="plain" type="info">本月</el-tag>
                </div>
                <div ref="funnelChartRef" class="chart-container"></div>
            </div>

            <!-- 增长趋势 -->
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
                <div ref="trendChartRef" class="chart-container"></div>
            </div>

            <!-- 来源分布 -->
            <div class="glass-card section-card">
                 <div class="card-header">
                    <h3><el-icon><PieChartIcon /></el-icon> 线索来源分布</h3>
                </div>
                <div ref="sourceChartRef" class="chart-container"></div>
            </div>
        </div>
      </div>

      <!-- 右侧侧边栏 -->
      <aside class="side-panel">
        <!-- 天气组件 -->
        <div class="glass-card weather-card" v-if="weather">
            <div class="weather-main">
                <div class="weather-temp">{{ weather.temp }}°</div>
                <div class="weather-info">
                    <div class="weather-loc"><el-icon><Location /></el-icon> 新加坡</div>
                    <div class="weather-desc">{{ getWeatherLabel(weather.code) }}</div>
                </div>
            </div>
            <div class="weather-icon">
                <el-icon :size="48"><component :is="getWeatherIcon(weather.code)" /></el-icon>
            </div>
        </div>

        <!-- 日历组件 -->
        <div class="glass-card calendar-card">
            <VCalendar 
                transparent 
                borderless 
                :attributes="calendarAttributes"
                expanded
                title-position="left"
                trim-weeks
                :theme="{
                    colors: {
                        primary: '#6366F1',
                    }
                }"
            />
        </div>

        <!-- 即将到来的预约 -->
        <div class="glass-card upcoming-card">
             <div class="card-header">
                <h3><el-icon><Timer /></el-icon> 今日日程</h3>
            </div>
            <div class="timeline-list">
                <div v-for="apt in upcomingAppointments" :key="apt.id" class="timeline-item">
                    <div class="time-col">
                        <span class="start">{{ formatTime(apt.startTime) }}</span>
                    </div>
                    <div class="content-col" :class="apt.type ? apt.type.toLowerCase() : 'meeting'">
                        <span class="title">{{ apt.title }}</span>
                        <span class="desc" v-if="apt.location"><el-icon><Location /></el-icon> {{ apt.location }}</span>
                    </div>
                </div>
                 <el-empty v-if="upcomingAppointments.length === 0" description="今日无预约" :image-size="40" />
            </div>
        </div>
      </aside>
    </div>

    <!-- 快速创建线索弹窗 -->
    <LeadFormDialog 
        v-model:visible="showCreateDialog"
        @success="handleCreateSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useLeadStore, useTaskStore, useAppointmentStore, useInquiryStore, useAuthStore } from '@/stores'
import { 
    Plus, User, TrendCharts, List, ChatDotRound, ArrowRight, DataAnalysis, Timer, Location, PieChart as PieChartIcon,
    Sunny, Cloudy, Pouring
} from '@element-plus/icons-vue'
import * as echarts from 'echarts/core'
import { FunnelChart, LineChart, PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import dayjs from 'dayjs'
import LeadFormDialog from '../leads/components/LeadFormDialog.vue'


const router = useRouter()
const leadStore = useLeadStore()
const taskStore = useTaskStore()
const appointmentStore = useAppointmentStore()
const inquiryStore = useInquiryStore()
const authStore = useAuthStore()

const { leads, stats: leadStats } = storeToRefs(leadStore)
const { stats: taskStats } = storeToRefs(taskStore)
const { inquiries } = storeToRefs(inquiryStore)
const { appointments } = storeToRefs(appointmentStore)

const showCreateDialog = ref(false)
const userName = computed(() => authStore.user?.name || '管理员')
const currentDate = dayjs().format('YYYY年MM月DD日 dddd')
const funnelChartRef = ref<HTMLElement | null>(null)
const trendChartRef = ref<HTMLElement | null>(null)
const sourceChartRef = ref<HTMLElement | null>(null)
const trendPeriod = ref('week')
let funnelChart: echarts.ECharts | null = null
let trendChart: echarts.ECharts | null = null
let sourceChart: echarts.ECharts | null = null

// 天气状态
const weather = ref<{
    temp: number
    code: number
    wind: number
} | null>(null)

const fetchWeather = async () => {
    try {
        // Singapore coordinates: 1.3521° N, 103.8198° E
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=1.3521&longitude=103.8198&current_weather=true')
        const data = await res.json()
        if (data.current_weather) {
            weather.value = {
                temp: data.current_weather.temperature,
                code: data.current_weather.weathercode,
                wind: data.current_weather.windspeed
            }
        }
    } catch (e) {
        console.error('Failed to fetch weather', e)
        // Fallback mock data
        weather.value = { temp: 31, code: 1, wind: 10 }
    }
}

const getWeatherIcon = (code: number) => {
    // Open-Meteo codes: 0=Clear, 1-3=Cloudy, 45-48=Fog, 51+=Rain
    if (code === 0) return 'Sunny'
    if (code >= 1 && code <= 3) return 'Cloudy'
    if (code >= 51) return 'Pouring'
    return 'Cloudy'
}

const getWeatherLabel = (code: number) => {
    if (code === 0) return '晴朗'
    if (code >= 1 && code <= 3) return '多云'
    if (code >= 45 && code <= 48) return '雾'
    if (code >= 51 && code <= 67) return '小雨'
    if (code >= 71) return '雷雨'
    return '多云'
}

echarts.use([TitleComponent, TooltipComponent, LegendComponent, FunnelChart, LineChart, PieChart, GridComponent, CanvasRenderer])

const recentLeads = computed(() => {
    return (leads.value || []).slice(0, 5)
})

const conversionRate = computed(() => {
    if (!leadStats.value?.total) return 0
    const converted = leadStats.value.byStatus?.CONVERTED || 0
    return Math.round((converted / leadStats.value.total) * 100)
})

// VCalendar 属性
const calendarAttributes = computed(() => {
    return [
       ...(appointments.value || []).map(apt => ({
           key: apt.id,
           dot: 'purple',
           dates: new Date(apt.startTime),
           popover: {
               label: apt.title
           }
       })),
       ...(taskStore.tasks || [])
         .filter(task => task.dueDate)
         .map(task => ({
           key: task.id,
           dot: task.status === 'DONE' ? 'green' : 'red',
           dates: new Date(task.dueDate!),
           popover: {
               label: task.title
           }
       }))
    ]
})

const upcomingAppointments = computed(() => {
    const today = dayjs().format('YYYY-MM-DD')
    return (appointments.value || [])
        .filter(apt => dayjs(apt.startTime).format('YYYY-MM-DD') === today)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
})

const formatTime = (isoString: string) => dayjs(isoString).format('HH:mm')
const formatTimeAgo = (isoString: string) => {
    const diff = dayjs().diff(dayjs(isoString), 'hour')
    if (diff < 24) return `${diff}小时前`
    return dayjs(isoString).format('MM-DD')
}

const handleCreate = () => {
    showCreateDialog.value = true
}

const handleCreateSuccess = () => {
    leadStore.fetchStats()
    leadStore.fetchLeads() // 刷新最新列表
}

const handleInquiryClick = (inquiry: any) => {
    console.log('Open inquiry', inquiry)
}

const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
        NEW: '新线索', CONTACTED: '已联系', QUALIFIED: '已确认', 
        IN_PROGRESS: '跟进中', LOST: '已流失', CONVERTED: '已转化'
    }
    return map[status] || status
}

const getStatusType = (status: string) => {
    const map: Record<string, string> = {
        NEW: 'info', CONTACTED: 'primary', QUALIFIED: 'success', 
        IN_PROGRESS: 'warning', LOST: 'danger', CONVERTED: 'success'
    }
    return map[status] || 'info'
}

const initChart = () => {
    // 漏斗图
    if (funnelChartRef.value) {
        if (funnelChart) funnelChart.dispose()
        funnelChart = echarts.init(funnelChartRef.value)
        
        const statusData = leadStats.value?.byStatus || {}
        const total = leadStats.value?.total || 100
        
        // 模拟更真实的漏斗比例
        const data = [
            { value: 100, name: '访问' }, // 模拟顶层
            { value: 60, name: '意向确认' },
            { value: 40, name: '方案报价' },
            { value: 20, name: '合同谈判' },
            { value: 10, name: '成功签约' }
        ]

        funnelChart.setOption({
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

    // 趋势图
    if (trendChartRef.value) {
        if (trendChart) trendChart.dispose()
        trendChart = echarts.init(trendChartRef.value)

        // 模拟趋势数据
        const data = [120, 132, 101, 134, 90, 230, 210]
        const dates = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

        trendChart.setOption({
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

    // 来源分布图
    if (sourceChartRef.value) {
        if (sourceChart) sourceChart.dispose()
        sourceChart = echarts.init(sourceChartRef.value)
        
        const data = [
            { value: 1048, name: '搜索引擎' },
            { value: 735, name: '直接访问' },
            { value: 580, name: '邮件营销' },
            { value: 484, name: '联盟广告' },
            { value: 300, name: '视频广告' }
        ]

        sourceChart.setOption({
            tooltip: { trigger: 'item' },
            legend: { bottom: '0%', left: 'center', icon: 'circle' },
            color: ['#6366F1', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'],
            series: [
                {
                    name: '访问来源',
                    type: 'pie',
                    radius: ['40%', '70%'],
                    center: ['50%', '45%'],
                    avoidLabelOverlap: false,
                    itemStyle: {
                        borderRadius: 10,
                        borderColor: '#fff',
                        borderWidth: 2
                    },
                    label: { show: false, position: 'center' },
                    emphasis: {
                        label: { show: true, fontSize: 20, fontWeight: 'bold' }
                    },
                    data
                }
            ]
        })
    }
}

onMounted(async () => {
    await Promise.all([
        fetchWeather(),
        leadStore.fetchStats(),
        leadStore.fetchLeads({ limit: 5 }), // 获取最新5条
        taskStore.fetchTasks(),
        taskStore.fetchStats(),
        inquiryStore.fetchInquiries({ limit: 5 }),
        appointmentStore.fetchAppointments({ 
            startDate: dayjs().startOf('month').toISOString(),
            endDate: dayjs().endOf('month').toISOString()
        })
    ])

    nextTick(() => {
        initChart()
    })
    
    window.addEventListener('resize', () => {
        funnelChart?.resize()
        trendChart?.resize()
        sourceChart?.resize()
    })
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
.stat-card {
    display: flex;
    align-items: center;
    gap: 20px;
    position: relative;
    overflow: hidden;
}
.stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px -4px rgba(0, 0, 0, 0.1);
}
.stat-icon-wrapper {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    background: rgba(255,255,255,0.9);
}
.primary-gradient { background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%); }
.primary-gradient .stat-icon-wrapper { color: #6366F1; }

.success-gradient { background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%); }
.success-gradient .stat-icon-wrapper { color: #10B981; }

.warning-gradient { background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%); }
.warning-gradient .stat-icon-wrapper { color: #F59E0B; }

.stat-info {
    display: flex;
    flex-direction: column;
}
.stat-info .label {
    font-size: 14px;
    color: #64748B;
    font-weight: 600;
}
.stat-info .value {
    font-size: 32px;
    font-weight: 800;
    color: #1E293B;
    line-height: 1.2;
}

/* 咨询列表 */
.inquiry-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}
.inquiry-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px;
    border-radius: 16px;
    background: rgba(255,255,255,0.5);
    border: 1px solid transparent;
    transition: all 0.2s;
}
.inquiry-item:hover {
    background: white;
    border-color: #E2E8F0;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
}
.inquiry-avatar {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: #6366F1;
    color: white;
    font-weight: 700;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.inquiry-content {
    flex: 1;
    min-width: 0;
}
.inquiry-top {
    display: flex;
    justify-content: space-between;
    margin-bottom: 2px;
}
.inquiry-top .name { font-weight: 700; color: #1E293B; font-size: 14px; }
.inquiry-top .time { font-size: 11px; color: #94A3B8; }
.inquiry-content .message {
    color: #64748B;
    font-size: 13px;
    margin: 0;
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* 图表 */
.chart-container {
    height: 300px;
    width: 100%;
}

/* 天气卡片 */
.weather-card {
    background: linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%);
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px;
    border: none;
    box-shadow: 0 10px 20px -5px rgba(59, 130, 246, 0.4);
}
.weather-main {
    display: flex;
    flex-direction: column;
}
.weather-temp {
    font-size: 36px;
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: 2px;
}
.weather-info {
    display: flex;
    gap: 8px;
    font-size: 13px;
    opacity: 0.9;
    align-items: center;
}
.weather-loc {
    display: flex;
    align-items: center;
    gap: 4px;
}
.weather-icon {
    opacity: 0.9;
}

/* 侧边栏 */
.calendar-card {
    overflow: hidden;
}
:deep(.vc-container) {
    font-family: 'Plus Jakarta Sans', sans-serif;
    --vc-font-family: 'Plus Jakarta Sans', sans-serif;
}

/* 日程列表 */
.timeline-list {
    display: flex;
    flex-direction: column;
    gap: 0;
    position: relative;
    padding-left: 8px;
}
.timeline-list::before {
    content: '';
    position: absolute;
    left: 56px;
    top: 10px;
    bottom: 10px;
    width: 2px;
    background: #E2E8F0;
}
.timeline-item {
    display: flex;
    align-items: flex-start;
    padding: 12px 0;
    position: relative;
}
.timeline-item::after {
    content: '';
    position: absolute;
    left: 52px;
    top: 20px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #6366F1;
    border: 2px solid white;
    box-shadow: 0 0 0 2px #E0E7FF;
    z-index: 1;
}
.time-col {
    width: 60px;
    padding-right: 12px;
    text-align: right;
    font-size: 13px;
    font-weight: 600;
    color: #64748B;
    padding-top: 4px;
}
.content-col {
    flex: 1;
    background: white;
    padding: 12px 16px;
    border-radius: 12px;
    margin-left: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.03);
    border: 1px solid #F1F5F9;
}
.content-col .title {
    display: block;
    font-weight: 700;
    color: #334155;
    margin-bottom: 4px;
}
.content-col .desc {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: #94A3B8;
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
