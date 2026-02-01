import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useConfigStore = defineStore('config', () => {
    // State
    const isPrivacyMode = ref(localStorage.getItem('isPrivacyMode') === 'true')

    // Actions
    function togglePrivacy() {
        isPrivacyMode.value = !isPrivacyMode.value
        localStorage.setItem('isPrivacyMode', String(isPrivacyMode.value))
    }

    return {
        isPrivacyMode,
        togglePrivacy
    }
})
