<template>
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Location, Timer, Sunny, Cloudy, Pouring } from '@element-plus/icons-vue'
import { useTaskStore, useAppointmentStore } from '@/stores'
import { storeToRefs } from 'pinia'
import dayjs from 'dayjs'

const taskStore = useTaskStore()
const appointmentStore = useAppointmentStore()
const { appointments } = storeToRefs(appointmentStore)

// 天气状态
const weather = ref<{
  temp: number
  code: number
  wind: number
} | null>(null)

const fetchWeather = async () => {
  try {
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
    weather.value = { temp: 31, code: 1, wind: 10 }
  }
}

const getWeatherIcon = (code: number) => {
  if (code === 0) return Sunny
  if (code >= 1 && code <= 3) return Cloudy
  if (code >= 51) return Pouring
  return Cloudy
}

const getWeatherLabel = (code: number) => {
  if (code === 0) return '晴朗'
  if (code >= 1 && code <= 3) return '多云'
  if (code >= 45 && code <= 48) return '雾'
  if (code >= 51 && code <= 67) return '小雨'
  if (code >= 71) return '雷雨'
  return '多云'
}

// VCalendar 属性
const calendarAttributes = computed(() => {
  return [
    ...(appointments.value || []).map((apt: any) => ({
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
    .filter((apt: any) => dayjs(apt.startTime).format('YYYY-MM-DD') === today)
    .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
})

const formatTime = (isoString: string) => dayjs(isoString).format('HH:mm')

onMounted(() => {
  fetchWeather()
})
</script>

<style scoped>
.side-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.glass-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  padding: 24px;
}

/* 天气卡片 */
.weather-card {
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.weather-main .weather-temp {
  font-size: 48px;
  font-weight: 700;
  line-height: 1;
}

.weather-info {
  margin-top: 8px;
}

.weather-loc {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  opacity: 0.9;
}

.weather-desc {
  font-size: 16px;
  opacity: 0.9;
}

/* 时间轴 */
.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.timeline-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.timeline-item {
  display: flex;
  gap: 12px;
}

.time-col {
  width: 48px;
  text-align: right;
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
  padding-top: 2px;
}

.content-col {
  flex: 1;
  padding: 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.5);
  border-left: 3px solid #94a3b8;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.content-col.meeting { border-left-color: #3b82f6; background: #eff6ff; }
.content-col.call { border-left-color: #10b981; background: #ecfdf5; }
.content-col.deadline { border-left-color: #ef4444; background: #fef2f2; }

.content-col .title {
  font-weight: 500;
  color: #1e293b;
  font-size: 14px;
}

.content-col .desc {
  font-size: 12px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 2px;
}
</style>
