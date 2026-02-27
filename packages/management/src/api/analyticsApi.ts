import apiClient from './apiClient'

interface DateRangeParams {
    startDate?: string
    endDate?: string
}

export const analyticsApi = {
    /** 获取销售漏斗数据 */
    getSalesFunnel(params: DateRangeParams) {
        return apiClient.get('/analytics/sales-funnel', { params })
    },

    /** 获取趋势数据 */
    getTrend(params: { period?: string; months?: number } = {}) {
        return apiClient.get('/analytics/trend', { params })
    },

    /** 获取营收趋势 */
    getRevenueTrend(params: { period?: string; months?: number } = {}) {
        return apiClient.get('/analytics/revenue-trend', { params })
    },

    /** 获取渠道效果 */
    getChannels(params: DateRangeParams) {
        return apiClient.get('/analytics/channels', { params })
    },

    /** 获取团队绩效 */
    getTeamPerformance(params: DateRangeParams) {
        return apiClient.get('/analytics/team-performance', { params })
    },

    /** 获取预测数据 */
    getForecast(params: { months?: number } = {}) {
        return apiClient.get('/analytics/forecast', { params })
    },
}
