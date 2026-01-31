import apiClient from './apiClient'

export interface User {
    id: string
    name: string
    email: string
    role: {
        id: string
        code: string
        name: string
    }
    department?: string
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
    avatarUrl?: string
}

export const userApi = {
    /**
     * 获取用户列表
     */
    getList(params?: { search?: string; roleCode?: string; status?: string }) {
        return apiClient.get<{ data: User[] }>('/users', { params }).then(res => res.data)
    },

    /**
     * 获取单个用户
     */
    getById(id: string) {
        return apiClient.get<{ data: User }>(`/users/${id}`).then(res => res.data)
    }
}

export default userApi
