import { defineStore } from 'pinia'
import { ref } from 'vue'
import { portalApi } from '@/api'

export const useProjectStore = defineStore('project', () => {
    const projects = ref<Record<string, unknown>[]>([])
    const currentProject = ref<Record<string, unknown> | null>(null)
    const isLoading = ref(false)

    async function fetchMyProjects() {
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

    async function fetchProject(id: string) {
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
