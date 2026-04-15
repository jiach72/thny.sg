import { defineStore } from 'pinia'
import { ref } from 'vue'
import { portalApi } from '@/api'
import type { PortalDocument } from '@tonghai/shared'
import { logger } from '@/utils/logger'

export const useDocumentStore = defineStore('document', () => {
    const documents = ref<PortalDocument[]>([])
    const isLoading = ref(false)

    async function fetchMyDocuments(projectId?: string): Promise<void> {
        isLoading.value = true
        try {
            const res = await portalApi.getMyDocuments(projectId ? { page: 1, limit: 100 } : undefined)
            documents.value = res?.documents || []
        } catch (error) {
            logger.error('DocumentStore', 'Failed to fetch documents:', error)
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
