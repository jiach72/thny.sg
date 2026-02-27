import { defineStore } from 'pinia'
import { ref } from 'vue'
import { portalApi } from '@/api'
import type { PortalProject } from '@tonghai/shared'

export const useProjectStore = defineStore('project', () => {
    const projects = ref<PortalProject[]>([])
    const currentProject = ref<PortalProject | null>(null)
    const isLoading = ref(false)

    async function fetchMyProjects(): Promise<void> {
        isLoading.value = true
        try {
            const data = await portalApi.getMyProjects()
            projects.value = data || []
        } catch (error) {
            console.error('Failed to fetch projects:', error)
        } finally {
            isLoading.value = false
        }
    }

    async function fetchProject(id: string): Promise<void> {
        isLoading.value = true
        try {
            const data = await portalApi.getProjectById(id)
            currentProject.value = data || null
        } catch (error) {
            console.error('Failed to fetch project details:', error)
        } finally {
            isLoading.value = false
        }
    }

    return {
        projects,
        currentProject,
        isLoading,
        fetchMyProjects,
        fetchProject
    }
})
