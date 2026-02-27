<template>
  <svg
    class="score-ring"
    :width="size"
    :height="size"
    :viewBox="`0 0 ${size} ${size}`"
  >
    <!-- 背景环 -->
    <circle
      class="ring-bg"
      :cx="center"
      :cy="center"
      :r="radius"
      fill="none"
      :stroke-width="strokeWidth"
    />
    <!-- 进度环 -->
    <circle
      class="ring-progress"
      :cx="center"
      :cy="center"
      :r="radius"
      fill="none"
      :stroke-width="strokeWidth"
      :stroke-dasharray="circumference"
      :stroke-dashoffset="dashOffset"
      :stroke="progressColor"
      stroke-linecap="round"
      transform-origin="center"
    />
    <!-- 分数文字 -->
    <text
      :x="center"
      :y="center"
      text-anchor="middle"
      dominant-baseline="central"
      class="ring-text"
      :font-size="fontSize"
    >
      {{ score }}
    </text>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  score: number
  size?: number
  strokeWidth?: number
}>(), {
  size: 48,
  strokeWidth: 4,
})

const center = computed(() => props.size / 2)
const radius = computed(() => (props.size - props.strokeWidth) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const dashOffset = computed(() => {
  const pct = Math.min(100, Math.max(0, props.score)) / 100
  return circumference.value * (1 - pct)
})
const fontSize = computed(() => Math.round(props.size * 0.3))

const progressColor = computed(() => {
  if (props.score >= 80) return 'var(--color-success, #22c55e)'
  if (props.score >= 60) return 'var(--color-primary, #0891b2)'
  if (props.score >= 40) return 'var(--color-warning, #f59e0b)'
  return 'var(--color-danger, #ef4444)'
})
</script>

<style scoped>
.score-ring {
  display: inline-block;
  vertical-align: middle;
}

.ring-bg {
  stroke: var(--color-border, rgba(255, 255, 255, 0.1));
}

.ring-progress {
  transform: rotate(-90deg);
  transition: stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.ring-text {
  fill: var(--color-text, #e2e8f0);
  font-weight: 700;
  font-family: 'Lexend', sans-serif;
}
</style>
