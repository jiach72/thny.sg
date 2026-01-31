import apiClient from './apiClient'

// ==================== 定时任务管理 ====================

export interface ScheduledTask {
    name: string
    enabled: boolean
    cronExpression: string
    lastRun?: string
    nextRun?: string
}

export interface TaskResult {
    taskName: string
    success: boolean
    result?: any
    error?: string
    duration: number
}

export interface EmailStatus {
    provider: 'SMTP' | 'SENDGRID' | 'AWS_SES' | 'CONSOLE'
    configured: boolean
}

export interface ConnectionTestResult {
    success: boolean
    message: string
}

// 获取所有任务状态
export const getTasks = (): Promise<ScheduledTask[]> =>
    apiClient.get('/scheduler/tasks')

// 手动触发任务
export const triggerTask = (taskName: string): Promise<TaskResult> =>
    apiClient.post(`/scheduler/tasks/${taskName}/trigger`)

// 更新任务配置
export const updateTask = (taskName: string, data: { enabled?: boolean; cronExpression?: string }): Promise<{ success: boolean; message: string }> =>
    apiClient.put(`/scheduler/tasks/${taskName}`, data)

// 执行所有到期任务
export const runAllDueTasks = (): Promise<{ executed: number; results: TaskResult[] }> =>
    apiClient.post('/scheduler/run-all')

// 获取邮件服务状态
export const getEmailStatus = (): Promise<EmailStatus> =>
    apiClient.get('/scheduler/email/status')

// 测试邮件连接
export const testEmailConnection = (): Promise<ConnectionTestResult> =>
    apiClient.post('/scheduler/email/test')

// 发送测试邮件
export const sendTestEmail = (to: string): Promise<{ success: boolean; message: string; messageId?: string; error?: string }> =>
    apiClient.post('/scheduler/email/test-send', { to })

// 重新初始化邮件配置
export const reinitializeEmail = (): Promise<{ success: boolean; message: string; status: EmailStatus }> =>
    apiClient.post('/scheduler/email/initialize')

export default {
    getTasks,
    triggerTask,
    updateTask,
    runAllDueTasks,
    getEmailStatus,
    testEmailConnection,
    sendTestEmail,
    reinitializeEmail
}

