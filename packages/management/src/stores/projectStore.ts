import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { projectApi, type Project } from '@/api/projectApi'

export const useProjectStore = defineStore('project', () => {
    const projects = ref<Project[]>([])
    const currentProject = ref<Project | null>(null)
    const isLoading = ref(false)
    const isSubmitting = ref(false)
    const error = ref<string | null>(null)
    const pagination = ref({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1
    })

    // 按状态分组（用于看板）
    const projectsByStatus = computed(() => {
        const grouped: Record<string, Project[]> = {
            PLANNING: [],
            ACTIVE: [],
            ON_HOLD: [],
            COMPLETED: [],
            ARCHIVED: []
        }

        projects.value.forEach(p => {
            if (grouped[p.status]) {
                grouped[p.status].push(p)
            }
        })

        return grouped
    })

    // 获取列表
    async function fetchProjects(params: any = {}) {
        isLoading.value = true
        try {
            const response = await projectApi.getList(params)
            projects.value = response.data
            pagination.value = response.pagination
        } catch (err: any) {
            error.value = err.message || '获取项目列表失败'
            console.error(err)
        } finally {
            isLoading.value = false
        }
    }

    // 获取详情
    async function fetchProjectById(id: string) {
        isLoading.value = true
        currentProject.value = null
        try {
            const data = await projectApi.getById(id)
            currentProject.value = data
            return data
        } catch (err: any) {
            error.value = err.message || '获取项目详情失败'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    // 创建
    async function createProject(data: Partial<Project>) {
        isSubmitting.value = true
        try {
            const newProject = await projectApi.create(data)
            projects.value.unshift(newProject)
            return newProject
        } finally {
            isSubmitting.value = false
        }
    }

    // 更新
    async function updateProject(id: string, data: Partial<Project>) {
        isSubmitting.value = true
        try {
            const updated = await projectApi.update(id, data)
            // 更新列表中的数据
            const index = projects.value.findIndex(p => p.id === id)
            if (index !== -1) {
                projects.value[index] = { ...projects.value[index], ...updated }
            }
            // 如果当前是详情页
            if (currentProject.value?.id === id) {
                currentProject.value = { ...currentProject.value, ...updated }
            }
            return updated
        } finally {
            isSubmitting.value = false
        }
    }

    // 更新状态（拖拽）
    async function updateProjectStatus(id: string, status: string) {
        // 乐观更新
        const project = projects.value.find(p => p.id === id)
        const oldStatus = project?.status

        if (project) {
            project.status = status as any
        }

        try {
            await projectApi.updateStatus(id, status)
        } catch (err) {
            // 回滚
            if (project && oldStatus) {
                project.status = oldStatus
            }
            throw err
        }
    }

    return {
        projects,
        currentProject,
        isLoading,
        isSubmitting,
        error,
        pagination,
        projectsByStatus,
        fetchProjects,
        fetchProjectById,
        createProject,
        updateProject,
        updateProjectStatus
    }
})
