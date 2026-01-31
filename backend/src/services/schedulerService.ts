import { prisma } from '../config/index.js'
import { scoringService } from './scoringService.js'
import { workflowService } from './workflowService.js'
import { invoiceService } from './invoiceService.js'

interface ScheduledTask {
    name: string
    cronExpression: string
    handler: () => Promise<any>
    enabled: boolean
    lastRun?: Date
    nextRun?: Date
}

interface TaskResult {
    taskName: string
    success: boolean
    result?: any
    error?: string
    duration: number
}

// 任务注册表
const tasks: Map<string, ScheduledTask> = new Map()
let isRunning = false

export const schedulerService = {
    /**
     * 初始化定时任务
     */
    async initialize(): Promise<void> {
        // 注册默认任务
        this.registerTask({
            name: 'BATCH_SCORE_UPDATE',
            cronExpression: '0 2 * * *', // 每天凌晨2点
            handler: async () => {
                const result = await scoringService.batchUpdateScores()
                return { updated: result.updated, failed: result.failed }
            },
            enabled: true
        })

        this.registerTask({
            name: 'CHECK_OVERDUE_INVOICES',
            cronExpression: '0 9 * * *', // 每天上午9点
            handler: async () => {
                const result = await (invoiceService as any).checkAndMarkOverdue()
                return { marked: result.length }
            },
            enabled: true
        })

        this.registerTask({
            name: 'AUTO_ASSIGN_LEADS',
            cronExpression: '*/30 * * * *', // 每30分钟
            handler: async () => {
                const result = await workflowService.batchAutoAssign()
                return result
            },
            enabled: true
        })

        this.registerTask({
            name: 'CLEANUP_OLD_LOGS',
            cronExpression: '0 3 * * 0', // 每周日凌晨3点
            handler: async () => {
                const thirtyDaysAgo = new Date()
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

                const result = await prisma.emailLog.deleteMany({
                    where: {
                        createdAt: { lt: thirtyDaysAgo },
                        status: 'SENT'
                    }
                })
                return { deleted: result.count }
            },
            enabled: true
        })

        // 从数据库加载自定义任务配置
        await this.loadTaskConfig()

        console.log(`⏰ 定时任务服务已初始化，共 ${tasks.size} 个任务`)
    },

    /**
     * 注册任务
     */
    registerTask(task: ScheduledTask): void {
        tasks.set(task.name, {
            ...task,
            nextRun: this.calculateNextRun(task.cronExpression)
        })
    },

    /**
     * 从数据库加载任务配置
     */
    async loadTaskConfig(): Promise<void> {
        try {
            const config = await prisma.systemSetting.findUnique({
                where: { key: 'SCHEDULER_CONFIG' }
            })

            if (config?.value) {
                const taskConfig = JSON.parse(config.value) as Record<string, { enabled: boolean; cronExpression?: string }>

                for (const [name, settings] of Object.entries(taskConfig)) {
                    const task = tasks.get(name)
                    if (task) {
                        task.enabled = settings.enabled
                        if (settings.cronExpression) {
                            task.cronExpression = settings.cronExpression
                            task.nextRun = this.calculateNextRun(settings.cronExpression)
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('加载定时任务配置失败:', error)
        }
    },

    /**
     * 保存任务配置到数据库
     */
    async saveTaskConfig(): Promise<void> {
        const config: Record<string, { enabled: boolean; cronExpression: string }> = {}

        for (const [name, task] of tasks) {
            config[name] = {
                enabled: task.enabled,
                cronExpression: task.cronExpression
            }
        }

        await prisma.systemSetting.upsert({
            where: { key: 'SCHEDULER_CONFIG' },
            update: { value: JSON.stringify(config) },
            create: { key: 'SCHEDULER_CONFIG', value: JSON.stringify(config), category: 'SYSTEM' }
        })
    },

    /**
     * 计算下次运行时间（简化版 Cron 解析）
     */
    calculateNextRun(cronExpression: string): Date {
        // 简化实现：返回当前时间 + 间隔
        // 实际生产环境应使用 cron-parser 等库
        const now = new Date()
        const parts = cronExpression.split(' ')

        // 处理常见模式
        if (parts[0].startsWith('*/')) {
            // 每 N 分钟
            const mins = parseInt(parts[0].slice(2))
            now.setMinutes(now.getMinutes() + mins)
        } else if (parts[1].startsWith('*/')) {
            // 每 N 小时
            const hours = parseInt(parts[1].slice(2))
            now.setHours(now.getHours() + hours)
        } else {
            // 默认：下一天的指定时间
            const hour = parseInt(parts[1]) || 0
            const minute = parseInt(parts[0]) || 0
            now.setDate(now.getDate() + 1)
            now.setHours(hour, minute, 0, 0)
        }

        return now
    },

    /**
     * 执行单个任务
     */
    async runTask(taskName: string): Promise<TaskResult> {
        const task = tasks.get(taskName)
        if (!task) {
            return {
                taskName,
                success: false,
                error: '任务不存在',
                duration: 0
            }
        }

        const startTime = Date.now()

        try {
            const result = await task.handler()
            const duration = Date.now() - startTime

            task.lastRun = new Date()
            task.nextRun = this.calculateNextRun(task.cronExpression)

            // 记录执行日志
            await this.logTaskExecution(taskName, true, result, duration)

            return {
                taskName,
                success: true,
                result,
                duration
            }
        } catch (error: any) {
            const duration = Date.now() - startTime

            // 记录执行日志
            await this.logTaskExecution(taskName, false, null, duration, error.message)

            return {
                taskName,
                success: false,
                error: error.message,
                duration
            }
        }
    },

    /**
     * 手动触发任务
     */
    async triggerTask(taskName: string): Promise<TaskResult> {
        console.log(`🔧 手动触发任务: ${taskName}`)
        return this.runTask(taskName)
    },

    /**
     * 检查并执行到期任务
     */
    async checkAndRunDueTasks(): Promise<TaskResult[]> {
        if (isRunning) {
            console.log('⏳ 任务检查已在进行中，跳过')
            return []
        }

        isRunning = true
        const results: TaskResult[] = []
        const now = new Date()

        try {
            for (const [name, task] of tasks) {
                if (!task.enabled) continue
                if (!task.nextRun || task.nextRun > now) continue

                console.log(`⏰ 执行定时任务: ${name}`)
                const result = await this.runTask(name)
                results.push(result)
            }
        } finally {
            isRunning = false
        }

        return results
    },

    /**
     * 记录任务执行日志
     */
    async logTaskExecution(
        taskName: string,
        success: boolean,
        result: any,
        duration: number,
        error?: string
    ): Promise<void> {
        try {
            await prisma.activity.create({
                data: {
                    actionType: 'SCHEDULED_TASK',
                    entityType: 'SYSTEM',
                    entityId: taskName,
                    description: success
                        ? `定时任务 ${taskName} 执行成功，耗时 ${duration}ms`
                        : `定时任务 ${taskName} 执行失败: ${error}`,
                    changes: result ? result : null,
                    actorId: 'system' // 需要一个系统用户 ID
                }
            })
        } catch {
            // 日志记录失败不影响主流程
            console.warn('任务日志记录失败')
        }
    },

    /**
     * 获取所有任务状态
     */
    getTasksStatus(): Array<{
        name: string
        enabled: boolean
        cronExpression: string
        lastRun?: Date
        nextRun?: Date
    }> {
        return Array.from(tasks.values()).map(task => ({
            name: task.name,
            enabled: task.enabled,
            cronExpression: task.cronExpression,
            lastRun: task.lastRun,
            nextRun: task.nextRun
        }))
    },

    /**
     * 更新任务配置
     */
    async updateTask(
        taskName: string,
        updates: { enabled?: boolean; cronExpression?: string }
    ): Promise<boolean> {
        const task = tasks.get(taskName)
        if (!task) return false

        if (updates.enabled !== undefined) {
            task.enabled = updates.enabled
        }

        if (updates.cronExpression) {
            task.cronExpression = updates.cronExpression
            task.nextRun = this.calculateNextRun(updates.cronExpression)
        }

        await this.saveTaskConfig()
        return true
    },

    /**
     * 启动定时任务轮询（开发模式）
     * 生产环境建议使用外部 Cron 服务触发
     */
    startPolling(intervalMs = 60000): NodeJS.Timeout {
        console.log(`⏰ 启动任务轮询，间隔 ${intervalMs / 1000} 秒`)

        return setInterval(async () => {
            const results = await this.checkAndRunDueTasks()
            if (results.length > 0) {
                console.log(`✅ 执行了 ${results.length} 个定时任务`)
            }
        }, intervalMs)
    }
}

export default schedulerService
