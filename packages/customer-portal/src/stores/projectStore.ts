import { defineStore } from 'pinia'
import { ref } from 'vue'
import { portalApi } from '@/api'

export const useProjectStore = defineStore('project', () => {
    const projects = ref<any[]>([])
    const currentProject = ref<any>(null)
    const isLoading = ref(false)

    async function fetchMyProjects() {
        isLoading.value = true
        try {
            const data = await portalApi.getMyProjects() as any
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
            const data = await projectApi.getProjectById(id) as any
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
