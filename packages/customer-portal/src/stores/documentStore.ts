import { defineStore } from 'pinia'
import { ref } from 'vue'
import { documentApi } from '@/api'
import type { PortalDocument } from '@tonghai/shared'

export const useDocumentStore = defineStore('document', () => {
    const documents = ref<PortalDocument[]>([])
    const isLoading = ref(false)

    async function fetchMyDocuments(projectId?: string): Promise<void> {
        isLoading.value = true
        try {
            const res = await documentApi.getMyDocuments(projectId)
            // 根据拦截器行为，可以直接拿到数组
            documents.value = res || []
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
