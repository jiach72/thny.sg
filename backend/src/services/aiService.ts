/**
 * AI 线索洞察服务
 * 基于 OpenAI API 提供线索智能摘要和成交概率预测
 * 参照 Salesforce Einstein Lead Scoring 的设计思路
 */
import { BadRequestError, NotFoundError } from '../middlewares/errorHandler.js'
import { prisma } from '../config/index.js'
import { config } from '../config/env.js'
import OpenAI from 'openai'

// 延迟初始化 OpenAI 客户端
let client: OpenAI | null = null

function getClient(): OpenAI {
    if (!client) {
        const apiKey = config.openai.apiKey
        if (!apiKey) {
            throw new BadRequestError('OPENAI_API_KEY 未配置，AI 洞察功能不可用')
        }
        client = new OpenAI({ apiKey })
    }
    return client
}

/** AI 洞察结果 */
export interface LeadInsight {
    summary: string           // 线索概览摘要
    conversionProbability: number  // 成交概率 0-100
    strengthSignals: string[] // 积极信号
    riskSignals: string[]     // 风险信号
    nextActions: string[]     // 建议下一步行动
    generatedAt: string       // 生成时间
}

const LEAD_ANALYSIS_PROMPT = `你是一名专业的 CRM 销售分析师。根据以下线索信息，生成一份简洁的销售洞察分析。

请严格按照以下 JSON 格式返回（不要添加任何 markdown 标记）：
{
  "summary": "2-3句话概括该线索的总体情况和价值",
  "conversionProbability": 0到100之间的整数，表示成交概率百分比,
  "strengthSignals": ["积极信号1", "积极信号2"],
  "riskSignals": ["风险因素1", "风险因素2"],
  "nextActions": ["建议行动1", "建议行动2"]
}

评估维度：
- 客户背景（公司、国家、预算）
- 需求匹配度（感兴趣的服务类型）
- 互动活跃度（活动记录、备注数量）
- 线索来源渠道质量
- 当前状态在漏斗中的位置
- 最后联系时间（是否有跟进滞后风险）`

export const aiService = {
    /**
     * 生成线索 AI 洞察
     */
    async getLeadInsight(leadId: string): Promise<LeadInsight> {
        const lead = await prisma.lead.findUnique({
            where: { id: leadId },
            include: {
                assignedTo: { select: { name: true } },
                activities: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    select: { actionType: true, description: true, createdAt: true },
                },
                tasks: {
                    where: { status: { not: 'CANCELLED' } },
                    select: { title: true, status: true, dueDate: true },
                    take: 5,
                },
            },
        })

        if (!lead) throw new NotFoundError('线索不存在')

        // 构建上下文信息
        const activityLines = lead.activities.map(
            (a: { actionType: string; description: string | null }) =>
                `- [${a.actionType}] ${a.description || '无描述'}`
        )
        const taskLines = lead.tasks.map(
            (t: { title: string; status: string }) => `- ${t.title} (${t.status})`
        )

        const context = [
            `【线索基本信息】`,
            `姓名: ${lead.contactName}`,
            lead.companyName ? `公司: ${lead.companyName}` : null,
            lead.email ? `邮箱: ${lead.email}` : null,
            lead.country ? `国家: ${lead.country}` : null,
            `感兴趣的服务: ${lead.serviceTypes.join(', ') || '未指定'}`,
            lead.budgetRange ? `预算范围: ${lead.budgetRange}` : null,
            `来源渠道: ${lead.sourceChannel}`,
            `当前状态: ${lead.status}`,
            `评分: ${lead.score}/100`,
            `负责人: ${lead.assignedTo?.name || '未分配'}`,
            `创建时间: ${lead.createdAt.toISOString().split('T')[0]}`,
            lead.lastContactedAt ? `最后联系: ${lead.lastContactedAt.toISOString().split('T')[0]}` : '从未联系',
            lead.inquiryMessage ? `\n【客户原始咨询】\n${lead.inquiryMessage.substring(0, 300)}` : null,
            activityLines.length > 0 ? `\n【最近活动记录 (${activityLines.length}条)】\n${activityLines.join('\n')}` : '暂无活动记录',
            taskLines.length > 0 ? `\n【关联任务】\n${taskLines.join('\n')}` : null,
        ].filter(Boolean).join('\n')

        const openai = getClient()
        const completion = await openai.chat.completions.create({
            model: config.openai.model,
            messages: [
                { role: 'system', content: LEAD_ANALYSIS_PROMPT },
                { role: 'user', content: context },
            ],
            max_tokens: 500,
            temperature: 0.3,
            response_format: { type: 'json_object' },
        })

        const raw = completion.choices[0]?.message?.content || '{}'

        try {
            const parsed = JSON.parse(raw) as LeadInsight
            return {
                summary: parsed.summary || '无法生成摘要',
                conversionProbability: Math.min(100, Math.max(0, parsed.conversionProbability || 0)),
                strengthSignals: parsed.strengthSignals || [],
                riskSignals: parsed.riskSignals || [],
                nextActions: parsed.nextActions || [],
                generatedAt: new Date().toISOString(),
            }
        } catch {
            return {
                summary: raw.substring(0, 200),
                conversionProbability: lead.score,
                strengthSignals: [],
                riskSignals: ['AI 解析失败，请重试'],
                nextActions: [],
                generatedAt: new Date().toISOString(),
            }
        }
    },
}

export default aiService
