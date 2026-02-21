import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { leadApi } from '@/api'
import type { Lead, LeadFilters, PaginationParams } from '@tonghai/shared/types'

export const useLeadStore = defineStore('lead', () => {
    // 状态
    const leads = ref<Lead[]>([])
    const currentLead = ref<Lead | null>(null)
    const loading = ref(false)
    const total = ref(0)
    const page = ref(1)
    const limit = ref(20)
    const filters = ref<LeadFilters>({})
    const stats = ref<{
        total: number
        byStatus: Record<string, number>
        bySource: Record<string, number>
        trend: { date: string; count: number }[]
    } | null>(null)
    const activities = ref<NonNullable<Lead['activities']>>([])

    // 计算属性
    const totalPages = computed(() => Math.ceil(total.value / limit.value))

    // 方法
    async function fetchLeads(customFilters?: LeadFilters, customPagination?: PaginationParams) {
        loading.value = true
        try {
            const result = await leadApi.getList(
                customFilters || filters.value,
                customPagination || { page: page.value, limit: limit.value }
            )
            leads.value = result.data
            total.value = result.pagination.total
            page.value = result.pagination.page
            return result
        } finally {
            loading.value = false
        }
    }

    async function fetchStats() {
        const result = await leadApi.getStats()
        stats.value = result
        return result
    }

    async function fetchRecentActivities(limit = 20) {
        const result = await leadApi.getActivities(limit)
        activities.value = result
        return result
    }

    async function fetchLeadById(id: string) {
        loading.value = true
        try {
            const lead = await leadApi.getById(id)
            currentLead.value = lead
            return lead
        } finally {
            loading.value = false
        }
    }

    async function createLead(payload: Parameters<typeof leadApi.create>[0]) {
        const lead = await leadApi.create(payload)
        leads.value.unshift(lead)
        total.value++
        return lead
    }

    async function updateLead(id: string, payload: Parameters<typeof leadApi.update>[1]) {
        const lead = await leadApi.update(id, payload)
        const index = leads.value.findIndex(l => l.id === id)
        if (index !== -1) {
            leads.value[index] = lead
        }
        if (currentLead.value?.id === id) {
            // 合并已有数据
            currentLead.value = { ...currentLead.value, ...lead }
        }
        return lead
    }

    async function addNote(id: string, content: string) {
        const activity = await leadApi.addNote(id, content)
        if (currentLead.value?.id === id) {
            currentLead.value.activities = currentLead.value.activities || []
            currentLead.value.activities.unshift(activity)
        }
        return activity
    }

    async function assignLead(id: string, assignedToId: string, reason?: string) {
        const lead = await leadApi.assign(id, { assignedToId, reason })
        const index = leads.value.findIndex(l => l.id === id)
        if (index !== -1) {
            leads.value[index] = lead
        }
        return lead
    }

    async function deleteLead(id: string) {
        await leadApi.delete(id)
        leads.value = leads.value.filter(l => l.id !== id)
        total.value--
    }

    async function convertToCustomer(id: string) {
        const result = await leadApi.convertToCustomer(id)
        // 更新本地线索状态
        const index = leads.value.findIndex(l => l.id === id)
        if (index !== -1) {
            leads.value[index] = { ...leads.value[index], status: 'CONVERTED' }
        }
        if (currentLead.value?.id === id) {
            currentLead.value = { ...currentLead.value, status: 'CONVERTED' }
        }
        return result
    }

    function setFilters(newFilters: LeadFilters) {
        filters.value = newFilters
        page.value = 1
    }

    function setPage(newPage: number) {
        page.value = newPage
    }

    return {
        // 状态
        leads,
        currentLead,
        loading,
        total,
        page,
        limit,
        filters,
        stats,
        activities,
        // 计算属性
        totalPages,
        // 方法
        fetchLeads,
        fetchStats,
        fetchRecentActivities,
        fetchLeadById,
        createLead,
        updateLead,
        addNote,
        assignLead,
        deleteLead,
        convertToCustomer,
        setFilters,
        setPage,
    }
})
