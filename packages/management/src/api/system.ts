import http from './apiClient'

export const systemApi = {
    /** 获取测试数据状态 */
    getTestDataStatus: () => http.get('/system/test-data-status'),
    /** 一键清除所有测试数据 */
    purgeTestData: () => http.delete('/system/purge-test-data', { data: { confirm: 'PURGE_ALL_TEST_DATA' } }),
}
