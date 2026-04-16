import http from './apiClient'

export const systemApi = {
    /** 获取数据状态 */
    getDataStatus: () => http.get('/system/data-status'),
    /** 一键清除所有数据 */
    purgeAllData: (confirmCode: string) => http.delete('/system/purge-all-data', { data: { confirm: confirmCode }, timeout: 60000 }),
}
