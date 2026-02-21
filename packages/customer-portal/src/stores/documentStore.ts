import { defineStore } from 'pinia'
import { ref } from 'vue'
import { documentApi } from '@/api'

export const useDocumentStore = defineStore('document', () => {
    const documents = ref<Record<string, unknown>[]>([])
    const isLoading = ref(false)

    async function fetchMyDocuments(projectId?: string) {
        isLoading.value = true
        try {
            const data: any = await documentApi.getMyDocuments(projectId)
            documents.value = data || []
        } catch (error) {
            console.error('Failed to fetch documents:', error)
        } finally {
            isLoading.value = false
        }
    }

    return {
        documents,
        isLoading,
        fetchMyDocuments
    }
})
