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
        return apiClient.get('/users', { params }).then(res => {
            if (Array.isArray(res)) return res as User[]
            return (res as any)?.data || res
        }) as Promise<User[]>
    },

    /**
     * 获取单个用户
     */
    getById(id: string) {
        return apiClient.get(`/users/${id}`).then(res => {
            return (res as any)?.data || res
        }) as Promise<User>
    }
}

export default userApi
