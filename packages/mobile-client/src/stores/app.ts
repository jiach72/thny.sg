import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const isAIChatVisible = ref(false)

  function toggleAIChat(visible?: boolean) {
    if (typeof visible === 'boolean') {
      isAIChatVisible.value = visible
    } else {
      isAIChatVisible.value = !isAIChatVisible.value
    }
  }

  return { isAIChatVisible, toggleAIChat }
})
