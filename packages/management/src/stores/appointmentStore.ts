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
    [key: string]: any
}

export const useAppointmentStore = defineStore('appointment', () => {
    const appointments = ref<Appointment[]>([])
    const loading = ref(false)

    async function fetchAppointments(params: any = {}) {
        loading.value = true
        try {
            const res = await appointmentApi.getAppointments(params)
            appointments.value = res.data
            return res.data
        } finally {
            loading.value = false
        }
    }

    async function createAppointment(data: any) {
        const res = await appointmentApi.create(data)
        // 简单追加到本地列表，或者重新 fetch
        return res.data
    }

    async function updateAppointment(id: string, data: any) {
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
