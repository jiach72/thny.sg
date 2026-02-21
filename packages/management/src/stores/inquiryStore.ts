import { defineStore } from 'pinia'
import { ref } from 'vue'
import { inquiryApi } from '@/api'

// 定义基础接口
interface Inquiry {
    id: string
    name: string
    email: string
    phone?: string
    message: string
    status: string
    createdAt: string
    updatedAt: string
}

export const useInquiryStore = defineStore('inquiry', () => {
    const inquiries = ref<Inquiry[]>([])
    const loading = ref(false)

    async function fetchInquiries(params: Record<string, unknown> = {}) {
        loading.value = true
        try {
            const res = await inquiryApi.getInquiries(params) as { data: Inquiry[] }
            inquiries.value = res.data
            return res.data
        } finally {
            loading.value = false
        }
    }

    async function updateInquiry(id: string, data: Partial<Inquiry>) {
        const res = await inquiryApi.update(id, data) as { data: Inquiry }
        return res.data
    }

    async function deleteInquiry(id: string) {
        await inquiryApi.delete(id)
    }

    return {
        inquiries,
        loading,
        fetchInquiries,
        updateInquiry,
        deleteInquiry
    }
})
