import { prisma } from '../config/index.js'
import logger from '../config/logger.js'

interface DateRange {
    startDate?: string
    endDate?: string
}

export const analyticsService = {
    /**
     * 获取销售漏斗数据
     * 统计各阶段线索数量和转化率
     */
    async getSalesFunnel(params: DateRange) {
        const where = buildDateFilter(params)

        // 各阶段线索数量
        const stages = ['NEW', 'CONTACTED', 'QUALIFIED', 'IN_PROGRESS', 'CONVERTED', 'LOST']
        const counts = await Promise.all(
            stages.map(async (stage) => {
                const count = await prisma.lead.count({
                    where: {
                        ...where,
                        status: stage as 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'IN_PROGRESS' | 'CONVERTED' | 'LOST',
                        deletedAt: null,
                    },
                })
                return { stage, count }
            })
        )

        const total = counts.reduce((sum, c) => sum + c.count, 0)

        return counts.map((item) => ({
            ...item,
            percentage: total > 0 ? Math.round((item.count / total) * 100) : 0,
        }))
    },

    /**
     * 获取趋势数据
     * 按月统计线索数量
     */
    async getTrend(period: string = 'month', months: number = 6) {
        const endDate = new Date()
        const startDate = new Date()
        startDate.setMonth(startDate.getMonth() - months)

        const leads = await prisma.lead.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate },
                deletedAt: null,
            },
            select: {
                createdAt: true,
                status: true,
            },
        })

        // 按月分组
        const monthlyData = new Map<string, { total: number; converted: number }>()

        for (const lead of leads) {
            const key = period === 'quarter'
                ? `${lead.createdAt.getFullYear()}-Q${Math.floor(lead.createdAt.getMonth() / 3) + 1}`
                : `${lead.createdAt.getFullYear()}-${String(lead.createdAt.getMonth() + 1).padStart(2, '0')}`

            const current = monthlyData.get(key) || { total: 0, converted: 0 }
            current.total++
            if (lead.status === 'CONVERTED') current.converted++
            monthlyData.set(key, current)
        }

        return Array.from(monthlyData.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([period, data]) => ({
                period,
                total: data.total,
                converted: data.converted,
                conversionRate: data.total > 0 ? Math.round((data.converted / data.total) * 100) : 0,
            }))
    },

    /**
     * 获取渠道效果
     */
    async getChannelMetrics(params: DateRange) {
        const where = buildDateFilter(params)

        const leads = await prisma.lead.findMany({
            where: { ...where, deletedAt: null },
            select: {
                sourceChannel: true,
                status: true,
                score: true,
            },
        })

        // 按渠道分组
        const channelData = new Map<string, { count: number; converted: number; totalScore: number }>()

        for (const lead of leads) {
            const channel = lead.sourceChannel || 'unknown'
            const current = channelData.get(channel) || { count: 0, converted: 0, totalScore: 0 }
            current.count++
            if (lead.status === 'CONVERTED') current.converted++
            current.totalScore += lead.score
            channelData.set(channel, current)
        }

        return Array.from(channelData.entries()).map(([channel, data]) => ({
            channel,
            leadCount: data.count,
            convertedCount: data.converted,
            conversionRate: data.count > 0 ? Math.round((data.converted / data.count) * 100) : 0,
            avgScore: data.count > 0 ? Math.round(data.totalScore / data.count) : 0,
        }))
    },

    /**
     * 获取团队绩效
     */
    async getTeamPerformance(params: DateRange) {
        const where = buildDateFilter(params)

        const leads = await prisma.lead.findMany({
            where: { ...where, deletedAt: null, assignedToId: { not: null } },
            select: {
                assignedToId: true,
                status: true,
                assignedTo: {
                    select: { id: true, name: true, avatarUrl: true },
                },
            },
        })

        // 按销售人员分组
        const teamData = new Map<string, {
            name: string
            avatarUrl: string | null
            total: number
            converted: number
            inProgress: number
        }>()

        for (const lead of leads) {
            if (!lead.assignedTo) continue
            const userId = lead.assignedTo.id
            const current = teamData.get(userId) || {
                name: lead.assignedTo.name,
                avatarUrl: lead.assignedTo.avatarUrl,
                total: 0,
                converted: 0,
                inProgress: 0,
            }
            current.total++
            if (lead.status === 'CONVERTED') current.converted++
            if (['CONTACTED', 'QUALIFIED', 'IN_PROGRESS'].includes(lead.status)) current.inProgress++
            teamData.set(userId, current)
        }

        return Array.from(teamData.entries())
            .map(([userId, data]) => ({
                userId,
                ...data,
                conversionRate: data.total > 0 ? Math.round((data.converted / data.total) * 100) : 0,
            }))
            .sort((a, b) => b.converted - a.converted) // 按转化数排名
    },

    /**
     * 预测分析
     * 基于历史趋势简单预测
     */
    async getForecast(months: number = 3) {
        // 获取过去 6 个月的月度数据
        const historicalData = await this.getTrend('month', 6)

        if (historicalData.length < 2) {
            return { forecast: [], message: '数据不足，无法预测' }
        }

        // 简单线性回归预测
        const totals = historicalData.map((d) => d.total)
        const avgGrowth = totals.length > 1
            ? (totals[totals.length - 1] - totals[0]) / (totals.length - 1)
            : 0
        const lastTotal = totals[totals.length - 1]
        const lastConversionRate = historicalData[historicalData.length - 1].conversionRate

        const forecast = []
        const now = new Date()

        for (let i = 1; i <= months; i++) {
            const futureDate = new Date(now)
            futureDate.setMonth(futureDate.getMonth() + i)
            const predictedTotal = Math.max(0, Math.round(lastTotal + avgGrowth * i))

            forecast.push({
                period: `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`,
                predictedLeads: predictedTotal,
                predictedConversions: Math.round(predictedTotal * lastConversionRate / 100),
                confidence: Math.max(30, 90 - i * 15), // 信心度随时间递减
            })
        }

        logger.info('生成预测数据', { months, dataPoints: historicalData.length, context: 'analytics' })

        return { forecast, basedOnMonths: historicalData.length }
    },
}

/**
 * 构建日期范围过滤条件
 */
function buildDateFilter(params: DateRange) {
    const where: Record<string, unknown> = {}
    if (params.startDate || params.endDate) {
        where.createdAt = {}
        if (params.startDate) (where.createdAt as Record<string, unknown>).gte = new Date(params.startDate)
        if (params.endDate) (where.createdAt as Record<string, unknown>).lte = new Date(params.endDate)
    }
    return where
}
