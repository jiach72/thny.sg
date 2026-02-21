import { defineStore } from 'pinia'
import { ref } from 'vue'
import { appointmentApi } from '@/api'

interface Appointment {
    id: string
    title: string
    startTime: string
    endTime: string
    location?: string
    type?: string
    description?: string
    status?: string
    attendees?: string[]
}

export const useAppointmentStore = defineStore('appointment', () => {
    const appointments = ref<Appointment[]>([])
    const loading = ref(false)

    async function fetchAppointments(params: Record<string, unknown> = {}) {
        loading.value = true
        try {
            const res = await appointmentApi.getAppointments(params)
            appointments.value = res.data
            return res.data
        } finally {
            loading.value = false
        }
    }

    async function createAppointment(data: Omit<Appointment, 'id'>) {
        const res = await appointmentApi.create(data)
        // 简单追加到本地列表，或者重新 fetch
        return res.data
    }

    async function updateAppointment(id: string, data: Partial<Appointment>) {
        const res = await appointmentApi.update(id, data)
        return res.data
    }

    async function deleteAppointment(id: string) {
        await appointmentApi.delete(id)
    }

    return {
        appointments,
        loading,
        fetchAppointments,
        createAppointment,
        updateAppointment,
        deleteAppointment
    }
})
