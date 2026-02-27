<template>
  <div class="relative">
    <!-- Desktop Horizontal Tracker -->
    <div class="hidden md:flex items-start justify-between relative z-10">
      <!-- Connecting Line -->
      <div class="absolute top-4 left-0 w-full h-0.5 bg-white/10 -z-10"></div>
      
      <div 
        v-for="step in steps" 
        :key="step.id"
        class="flex flex-col items-center flex-1 group"
      >
        <!-- Node -->
        <div 
          class="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative z-10"
          :class="getNodeClass(step.status)"
        >
          <component :is="getIcon(step.status)" class="w-4 h-4" />
          
          <!-- Pulse Effect for Current -->
          <div v-if="step.status === 'current'" class="absolute inset-0 rounded-full animate-ping bg-wealth/50 opacity-75"></div>
        </div>

        <!-- Text -->
        <div class="mt-4 text-center px-2">
          <div 
            class="text-sm font-medium transition-colors mb-1"
            :class="step.status === 'current' ? 'text-wealth' : 'text-text'"
          >
            {{ step.title }}
          </div>
          <div class="text-xs text-text-muted">{{ step.date || step.status === 'current' ? 'In Progress' : 'Pending' }}</div>
        </div>
      </div>
    </div>

    <!-- Mobile Vertical Tracker -->
    <div class="md:hidden space-y-6 ml-4 border-l border-white/10 pl-8 relative">
       <div 
        v-for="step in steps" 
        :key="step.id"
        class="relative"
      >
         <!-- Node -->
         <div 
          class="absolute -left-[41px] top-0 w-6 h-6 rounded-full flex items-center justify-center border-2 bg-obsidian z-10"
          :class="getNodeClass(step.status)"
        >
          <component :is="getIcon(step.status)" class="w-3 h-3" />
        </div>

        <div>
           <div 
            class="text-sm font-medium transition-colors"
             :class="step.status === 'current' ? 'text-wealth' : 'text-text'"
           >
             {{ step.title }}
           </div>
           <p class="text-xs text-text-muted mt-1">{{ step.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Check, Loader2, Circle } from 'lucide-vue-next'

interface Step {
  id: string
  title: string
  status: 'completed' | 'current' | 'pending'
  date?: string
  description?: string
}

defineProps<{
  steps: Step[]
}>()

function getNodeClass(status: string): string {
  if (status === 'completed') return 'bg-wealth border-wealth text-obsidian'
  if (status === 'current') return 'bg-obsidian border-wealth text-wealth'
  return 'bg-obsidian border-white/20 text-text-muted'
}

function getIcon(status: string): typeof Check {
  if (status === 'completed') return Check
  if (status === 'current') return Loader2
  return Circle
}
</script>
