import apiClient from './apiClient'
import type { PaginatedResponse } from '@tonghai/shared/types'

// 项目类型定义 (补充到 types/index.ts 中)
export interface Project {
    id: string
    title: string
    description?: string
    customerId: string
    projectType: string
    status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED'
    completionPercentage: number
    startDate?: string
    estimatedEndDate?: string
    actualEndDate?: string
    budget?: number
    currency: string
    customer?: {
        id: string
        lead: {
            contactName: string
            companyName?: string
        }
    }
    tasks?: any[]
    documents?: any[]
    _count?: {
        tasks: number
        documents: number
    }
    createdAt: string
    updatedAt: string
}

const BASE_PATH = '/projects'

export const projectApi = {
    // 获取项目列表
    getList(params?: {
        page?: number
        limit?: number
        status?: string
        customerId?: string
    }): Promise<PaginatedResponse<Project>> {
        return apiClient.get(BASE_PATH, { params })
    },

    // 获取详情
    getById(id: string): Promise<Project> {
        return apiClient.get(`${BASE_PATH}/${id}`)
    },

    // 创建项目
    create(data: Partial<Project>): Promise<Project> {
        return apiClient.post(BASE_PATH, data)
    },

    // 更新项目
    update(id: string, data: Partial<Project>): Promise<Project> {
        return apiClient.put(`${BASE_PATH}/${id}`, data)
    },

    // 更新状态
    updateStatus(id: string, status: string): Promise<Project> {
        return apiClient.patch(`${BASE_PATH}/${id}/status`, { status })
    },

    // 删除项目
    delete(id: string): Promise<void> {
        return apiClient.delete(`${BASE_PATH}/${id}`)
    }
}
