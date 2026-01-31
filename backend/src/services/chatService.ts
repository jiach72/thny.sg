import { prisma } from '../config/index.js'
import OpenAI from 'openai'
import { faqService } from './faqService.js'

// OpenAI 客户端（延迟初始化）
let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
    if (!openaiClient) {
        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY 环境变量未配置')
        }
        openaiClient = new OpenAI({ apiKey })
    }
    return openaiClient
}

interface ChatInput {
    sessionId?: string
    message: string
    visitorId?: string
    visitorName?: string
    visitorEmail?: string
    locale?: 'zh' | 'en'
}

interface ChatResponse {
    sessionId: string
    message: string
    suggestedFaqs?: Array<{
        id: string
        question: string
    }>
    isAiGenerated: boolean
}

// 系统提示词
const SYSTEM_PROMPT = `你是通海南洋（TongHai Nanyang）的智能客服助手。通海南洋是一家总部位于新加坡的专业咨询公司，为华语企业家和高净值家庭提供以下服务：

1. 企业出海与落地：新加坡/马来西亚公司注册、银行开户、企业行政服务
2. 身份与人才规划：EP/PR申请、家族办公室、MM2H
3. 资产管理与房产：新加坡保险、VCC基金、家族信托、不动产配置
4. 教育留学规划：新加坡学校申请、学生公寓
5. 品牌转型与企业考察
6. 政府津贴与税务优化

请用友好、专业的语气回答客户问题。如果问题超出你的知识范围，建议客户预约专业顾问咨询。
回答要简洁明了，控制在150字以内。`

const SYSTEM_PROMPT_EN = `You are the AI assistant for TongHai Nanyang, a professional consulting firm headquartered in Singapore. We provide services for Chinese-speaking entrepreneurs and high-net-worth families:

1. Market Entry & Execution: Singapore/Malaysia company registration, banking, corporate services
2. Residency & Talent Planning: EP/PR applications, family office, MM2H
3. Asset Management & Real Estate: Singapore insurance, VCC funds, family trusts, property
4. Education Planning: Singapore school applications, student apartments
5. Brand Transformation & Corporate Visits
6. Government Grants & Tax Optimization

Answer questions in a friendly, professional manner. If the question is beyond your knowledge, suggest booking a professional consultation.
Keep responses concise, under 100 words.`

export const chatService = {
    /**
     * 创建或获取聊天会话
     */
    async getOrCreateSession(visitorId?: string, visitorName?: string, visitorEmail?: string) {
        // 如果有 visitorId，尝试找现有活跃会话
        if (visitorId) {
            const existingSession = await prisma.chatSession.findFirst({
                where: {
                    visitorId,
                    status: 'active'
                },
                orderBy: { createdAt: 'desc' }
            })

            if (existingSession) {
                return existingSession
            }
        }

        // 创建新会话
        return prisma.chatSession.create({
            data: {
                visitorId,
                visitorName,
                visitorEmail,
                source: 'website',
                status: 'active'
            }
        })
    },

    /**
     * 发送消息并获取回复
     */
    async sendMessage(input: ChatInput): Promise<ChatResponse> {
        const locale = input.locale || 'zh'

        // 获取或创建会话
        let session
        if (input.sessionId) {
            session = await prisma.chatSession.findUnique({
                where: { id: input.sessionId }
            })
        }

        if (!session) {
            session = await this.getOrCreateSession(
                input.visitorId,
                input.visitorName,
                input.visitorEmail
            )
        }

        // 保存用户消息
        await prisma.chatMessage.create({
            data: {
                sessionId: session.id,
                content: input.message,
                role: 'user'
            }
        })

        // 1. 首先尝试 FAQ 匹配
        const matchedFaqs = await faqService.searchFaqs(input.message, locale)

        if (matchedFaqs.length > 0 && matchedFaqs[0].score >= 15) {
            // 高匹配度，直接返回 FAQ 答案
            const topFaq = matchedFaqs[0]
            const answer = locale === 'en' && topFaq.answerEn ? topFaq.answerEn : topFaq.answer

            // 增加查看次数
            await faqService.incrementViewCount(topFaq.id)

            // 保存机器人回复
            await prisma.chatMessage.create({
                data: {
                    sessionId: session.id,
                    content: answer,
                    role: 'assistant'
                }
            })

            return {
                sessionId: session.id,
                message: answer,
                suggestedFaqs: matchedFaqs.slice(1, 4).map(faq => ({
                    id: faq.id,
                    question: locale === 'en' && faq.questionEn ? faq.questionEn : faq.question
                })),
                isAiGenerated: false
            }
        }

        // 2. 低匹配度或无匹配，使用 AI 生成回复
        try {
            // 从数据库获取 AI 配置
            const settings = await prisma.systemSetting.findMany({
                where: { category: 'AI' }
            })

            const config = settings.reduce((acc, curr) => {
                acc[curr.key] = curr.value
                return acc
            }, {} as Record<string, string>)

            const apiKey = config['AI_API_KEY'] || process.env.OPENAI_API_KEY
            const modelName = config['AI_MODEL_NAME'] || 'gpt-4o-mini'
            const baseUrl = config['AI_BASE_URL']

            if (!apiKey) {
                console.warn('AI API Key not configured')
                throw new Error('AI service not configured')
            }

            const openai = new OpenAI({
                apiKey,
                baseURL: baseUrl || undefined
            })

            // 获取历史消息
            const history = await prisma.chatMessage.findMany({
                where: { sessionId: session.id },
                orderBy: { createdAt: 'asc' },
                take: 10 // 最近10条消息作为上下文
            })

            const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
                { role: 'system', content: locale === 'en' ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT },
                ...history.map(msg => ({
                    role: msg.role as 'user' | 'assistant',
                    content: msg.content
                }))
            ]

            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages,
                max_tokens: 300,
                temperature: 0.7
            })

            const aiResponse = completion.choices[0]?.message?.content ||
                (locale === 'en' ? 'Sorry, I encountered an error. Please try again.' : '抱歉，系统出现问题，请稍后重试。')

            // 保存 AI 回复
            await prisma.chatMessage.create({
                data: {
                    sessionId: session.id,
                    content: aiResponse,
                    role: 'assistant',
                    promptTokens: completion.usage?.prompt_tokens,
                    completionTokens: completion.usage?.completion_tokens,
                    model: 'gpt-4o-mini'
                }
            })

            // 记录未识别问题（如果没有匹配到 FAQ）
            if (matchedFaqs.length === 0) {
                await this.recordUnrecognizedQuestion(input.message, session.id)
            }

            return {
                sessionId: session.id,
                message: aiResponse,
                suggestedFaqs: matchedFaqs.slice(0, 3).map(faq => ({
                    id: faq.id,
                    question: locale === 'en' && faq.questionEn ? faq.questionEn : faq.question
                })),
                isAiGenerated: true
            }
        } catch (error) {
            console.error('OpenAI API error:', error)

            // 降级：返回 FAQ 建议或默认消息
            const fallbackMessage = locale === 'en'
                ? 'I apologize, but I\'m having trouble right now. Please contact us at admin@thny.sg or book a consultation on our website.'
                : '抱歉，我暂时无法回答您的问题。请通过 admin@thny.sg 联系我们，或在网站上预约咨询。'

            await prisma.chatMessage.create({
                data: {
                    sessionId: session.id,
                    content: fallbackMessage,
                    role: 'assistant'
                }
            })

            return {
                sessionId: session.id,
                message: fallbackMessage,
                suggestedFaqs: matchedFaqs.slice(0, 3).map(faq => ({
                    id: faq.id,
                    question: locale === 'en' && faq.questionEn ? faq.questionEn : faq.question
                })),
                isAiGenerated: false
            }
        }
    },

    /**
     * 记录未识别问题
     */
    async recordUnrecognizedQuestion(question: string, sessionId?: string) {
        // 检查是否已存在相似问题
        const existing = await prisma.unrecognizedQuestion.findFirst({
            where: {
                question: {
                    contains: question.substring(0, 50),
                    mode: 'insensitive'
                }
            }
        })

        if (existing) {
            // 增加频次
            await prisma.unrecognizedQuestion.update({
                where: { id: existing.id },
                data: { frequency: { increment: 1 } }
            })
        } else {
            // 创建新记录
            await prisma.unrecognizedQuestion.create({
                data: {
                    question,
                    sessionId
                }
            })
        }
    },

    /**
     * 获取会话历史
     */
    async getSessionHistory(sessionId: string) {
        return prisma.chatMessage.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'asc' }
        })
    },

    /**
     * 关闭会话
     */
    async closeSession(sessionId: string) {
        return prisma.chatSession.update({
            where: { id: sessionId },
            data: {
                status: 'closed',
                closedAt: new Date()
            }
        })
    },

    /**
     * 标记消息为有帮助/无帮助
     */
    async markMessageHelpful(messageId: string, isHelpful: boolean) {
        return prisma.chatMessage.update({
            where: { id: messageId },
            data: { isHelpful }
        })
    },

    /**
     * 获取未识别问题列表（管理后台用）
     */
    async getUnrecognizedQuestions(status = 'pending') {
        return prisma.unrecognizedQuestion.findMany({
            where: { status },
            orderBy: { frequency: 'desc' }
        })
    }
}
