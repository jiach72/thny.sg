<template>
  <div class="health-score-card">
    <div class="score-header">
      <h3>客户健康度</h3>
      <el-tooltip :content="tooltipContent" placement="top">
        <el-icon class="info-icon"><QuestionFilled /></el-icon>
      </el-tooltip>
    </div>

    <!-- 评分仪表盘 -->
    <div class="score-gauge">
      <svg viewBox="0 0 100 60" class="gauge-svg">
        <!-- 背景弧 -->
        <path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none"
          stroke="#e2e8f0"
          stroke-width="8"
          stroke-linecap="round"
        />
        <!-- 彩色弧 -->
        <path
          :d="arcPath"
          fill="none"
          :stroke="scoreColor"
          stroke-width="8"
          stroke-linecap="round"
          class="gauge-arc"
          :style="{ strokeDasharray: arcLength, strokeDashoffset: arcOffset }"
        />
      </svg>
      <div class="score-value" :style="{ color: scoreColor }">
        {{ animatedScore }}
      </div>
      <div class="score-label">{{ scoreLabel }}</div>
    </div>

    <!-- 评分因素 -->
    <div class="score-factors">
      <div 
        v-for="factor in factors" 
        :key="factor.key"
        class="factor-item"
        :class="factor.status"
      >
        <div class="factor-icon">
          <el-icon><component :is="factor.icon" /></el-icon>
        </div>
        <div class="factor-info">
          <span class="factor-name">{{ factor.name }}</span>
          <span class="factor-value">{{ factor.value }}</span>
        </div>
        <div class="factor-status">
          <el-icon v-if="factor.status === 'good'"><CircleCheck /></el-icon>
          <el-icon v-else-if="factor.status === 'warning'"><Warning /></el-icon>
          <el-icon v-else><CircleClose /></el-icon>
        </div>
      </div>
    </div>

    <!-- 建议操作 -->
    <div class="suggestions" v-if="suggestions.length > 0">
      <div class="suggestions-header">
        <el-icon><Bulb /></el-icon>
        <span>建议操作</span>
      </div>
      <ul class="suggestions-list">
        <li v-for="(suggestion, index) in suggestions" :key="index">
          {{ suggestion }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import {
  QuestionFilled,
  CircleCheck,
  Warning,
  CircleClose,
  Clock,
  Message,
  Tickets,
  TrendCharts,
} from '@element-plus/icons-vue'

// 灯泡图标（Element Plus 中可能不存在，使用替代）
const Bulb = TrendCharts

interface ScoreFactor {
  key: string
  name: string
  value: string
  icon: typeof Clock
  status: 'good' | 'warning' | 'danger'
}

const props = defineProps<{
  score: number
  lastContactDays?: number
  responseRate?: number
  taskCompletionRate?: number
  engagementLevel?: 'high' | 'medium' | 'low'
}>()

const animatedScore = ref(0)

// 评分颜色
const scoreColor = computed(() => {
  if (props.score >= 80) return '#10b981'
  if (props.score >= 60) return '#f59e0b'
  if (props.score >= 40) return '#f97316'
  return '#ef4444'
})

// 评分标签
const scoreLabel = computed(() => {
  if (props.score >= 80) return '非常健康'
  if (props.score >= 60) return '状态良好'
  if (props.score >= 40) return '需要关注'
  return '风险警告'
})

// 仪表盘弧形路径
const arcPath = 'M 10 55 A 40 40 0 0 1 90 55'
const arcLength = 126 // 弧长近似值
const arcOffset = computed(() => {
  return arcLength - (arcLength * props.score) / 100
})

// 评分因素
const factors = computed<ScoreFactor[]>(() => {
  const lastContact = props.lastContactDays ?? 999
  const response = props.responseRate ?? 0
  const taskCompletion = props.taskCompletionRate ?? 0

  return [
    {
      key: 'contact',
      name: '最近联系',
      value: lastContact < 999 ? `${lastContact}天前` : '无记录',
      icon: Clock,
      status: lastContact <= 7 ? 'good' : lastContact <= 30 ? 'warning' : 'danger',
    },
    {
      key: 'response',
      name: '回复率',
      value: `${response}%`,
      icon: Message,
      status: response >= 70 ? 'good' : response >= 40 ? 'warning' : 'danger',
    },
    {
      key: 'tasks',
      name: '任务完成',
      value: `${taskCompletion}%`,
      icon: Tickets,
      status: taskCompletion >= 80 ? 'good' : taskCompletion >= 50 ? 'warning' : 'danger',
    },
  ]
})

// 建议操作
const suggestions = computed(() => {
  const result: string[] = []
  const lastContact = props.lastContactDays ?? 999

  if (lastContact > 14) {
    result.push('建议安排一次跟进沟通')
  }
  if ((props.responseRate ?? 0) < 50) {
    result.push('尝试其他沟通渠道（电话/微信）')
  }
  if ((props.taskCompletionRate ?? 0) < 60) {
    result.push('检查待办任务是否需要协助')
  }
  if (props.score < 50) {
    result.push('考虑升级服务或提供优惠方案')
  }

  return result.slice(0, 3)
})

// 提示内容
const tooltipContent = '健康度评分基于联系频率、回复率、任务完成度等因素综合计算'

// 数字动画
watch(() => props.score, (newScore) => {
  const duration = 1000
  const start = animatedScore.value
  const range = newScore - start
  const startTime = performance.now()

  function animate(currentTime: number) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const easeProgress = 1 - Math.pow(1 - progress, 3)
    animatedScore.value = Math.round(start + range * easeProgress)
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }

  requestAnimationFrame(animate)
}, { immediate: true })

onMounted(() => {
  animatedScore.value = 0
  setTimeout(() => {
    animatedScore.value = props.score
  }, 100)
})
</script>

<style scoped>
.health-score-card {
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 16px;
  padding: 20px;
}

.score-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.score-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text, #1e293b);
}

.info-icon {
  color: var(--color-text-muted, #94a3b8);
  cursor: pointer;
}

/* 仪表盘 */
.score-gauge {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0 20px;
}

.gauge-svg {
  width: 140px;
  height: 84px;
}

.gauge-arc {
  transition: stroke-dashoffset 1s ease-out;
}

.score-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -20%);
  font-size: 36px;
  font-weight: 800;
  font-family: 'Outfit', sans-serif;
}

.score-label {
  margin-top: 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-muted, #64748b);
}

/* 评分因素 */
.score-factors {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border, #e2e8f0);
}

.factor-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: var(--color-background, #f8fafc);
  border-radius: 10px;
  transition: all 0.2s ease;
}

.factor-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface, #fff);
  border-radius: 8px;
  color: var(--color-text-muted, #64748b);
}

.factor-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.factor-name {
  font-size: 13px;
  color: var(--color-text-muted, #64748b);
}

.factor-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text, #1e293b);
}

.factor-status {
  font-size: 18px;
}

.factor-item.good .factor-status { color: #10b981; }
.factor-item.warning .factor-status { color: #f59e0b; }
.factor-item.danger .factor-status { color: #ef4444; }

/* 建议操作 */
.suggestions {
  margin-top: 20px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(8, 145, 178, 0.08) 0%, rgba(6, 182, 212, 0.04) 100%);
  border-radius: 12px;
}

.suggestions-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary, #0891b2);
  margin-bottom: 12px;
}

.suggestions-list {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.suggestions-list li {
  font-size: 13px;
  color: var(--color-text, #334155);
  line-height: 1.5;
}
</style>
