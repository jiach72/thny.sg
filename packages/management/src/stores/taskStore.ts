import { defineStore } from 'pinia'
import { ref } from 'vue'
import { taskApi } from '@/api'
import type { Task, TaskStatus } from '@tonghai/shared/types'

export const useTaskStore = defineStore('task', () => {
    // 状态
    const tasks = ref<Task[]>([])
    const boardData = ref<Record<TaskStatus, Task[]> | null>(null)
    const loading = ref(false)
    const stats = ref<{
        total: number
        overdue: number
        byStatus: Record<string, number>
    } | null>(null)

    // 方法
    async function fetchBoard(assignedToId?: string) {
        loading.value = true
        try {
            const result = await taskApi.getBoard(assignedToId)
            boardData.value = result
            return result
        } finally {
            loading.value = false
        }
    }

    async function fetchTasks(filters: Record<string, unknown> = {}) {
        loading.value = true
        try {
            const result = await taskApi.getList(filters)
            tasks.value = result.data
            return result
        } finally {
            loading.value = false
        }
    }

    async function fetchStats(assignedToId?: string) {
        const result = await taskApi.getStats(assignedToId)
        stats.value = result
        return result
    }

    async function createTask(payload: Parameters<typeof taskApi.create>[0]) {
        const task = await taskApi.create(payload)
        // 更新看板数据
        if (boardData.value) {
            boardData.value[task.status].unshift(task)
        }
        return task
    }

    async function updateTask(id: string, payload: Parameters<typeof taskApi.update>[1]) {
        const task = await taskApi.update(id, payload)

        // 更新看板数据
        if (boardData.value) {
            // 从旧状态列表中移除
            for (const status of Object.keys(boardData.value) as TaskStatus[]) {
                const index = boardData.value[status].findIndex(t => t.id === id)
                if (index !== -1) {
                    boardData.value[status].splice(index, 1)
                    break
                }
            }
            // 添加到新状态列表
            boardData.value[task.status].unshift(task)
        }

        return task
    }

    async function moveTask(id: string, status: TaskStatus) {
        // 仅调用 API 更新状态
        // 注意：这里不需要手动更新 boardData 的数组顺序，
        // 因为 vuedraggable 已经通过双向绑定处理了 UI 上的移动。
        // 我们只需要确保后端状态同步，并更新本地 task 对象的 status 字段即可。

        await taskApi.update(id, { status })

        // 更新本地 task 对象引用中的状态，以防万一
        if (boardData.value && boardData.value[status]) {
            const task = boardData.value[status].find(t => t.id === id)
            if (task) {
                task.status = status
            }
        }
    }

    async function deleteTask(id: string) {
        await taskApi.delete(id)

        // 更新看板数据
        if (boardData.value) {
            for (const status of Object.keys(boardData.value) as TaskStatus[]) {
                const index = boardData.value[status].findIndex(t => t.id === id)
                if (index !== -1) {
                    boardData.value[status].splice(index, 1)
                    break
                }
            }
        }
    }

    return {
        // 状态
        tasks,
        boardData,
        loading,
        stats,
        // 方法
        // 方法
        fetchBoard,
        fetchTasks,
        fetchStats,
        createTask,
        updateTask,
        moveTask,
        deleteTask,
    }
})
