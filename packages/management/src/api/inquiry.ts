import http from './apiClient'

export const inquiryApi = {
    getInquiries: (params: any) => http.get('/inquiries', { params }),
    getById: (id: string) => http.get(`/inquiries/${id}`),
    create: (data: any) => http.post('/inquiries', data),
    update: (id: string, data: any) => http.put(`/inquiries/${id}`, data),
    delete: (id: string) => http.delete(`/inquiries/${id}`),
}
