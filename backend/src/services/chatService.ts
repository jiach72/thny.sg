import { BadRequestError } from '../middlewares/errorHandler.js'
import { prisma } from '../config/index.js'
import OpenAI from 'openai'
import { faqService } from './faqService.js'
import logger from '../config/logger.js'

// OpenAI 客户端（延迟初始化）
let openaiClient: OpenAI | null = null

function _getOpenAIClient(): OpenAI {
    if (!openaiClient) {
        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey) {
            throw new BadRequestError('OPENAI_API_KEY 环境变量未配置')
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

【重要指令】
- 如果用户消息后附有「参考信息」，请**优先**根据参考信息回答问题。
- 不要编造参考信息中没有的数字、政策细节或费用。
- 如果参考信息不足以完全回答问题，可结合你的通用知识补充，但要标注"建议咨询顾问确认"。
- 如果完全没有相关信息，礼貌地建议客户预约专业顾问。

请用友好、专业的语气回答。回答要简洁明了，控制在150字以内。`

const SYSTEM_PROMPT_EN = `You are the AI assistant for TongHai Nanyang, a professional consulting firm headquartered in Singapore. We provide services for Chinese-speaking entrepreneurs and high-net-worth families:

1. Market Entry & Execution: Singapore/Malaysia company registration, banking, corporate services
2. Residency & Talent Planning: EP/PR applications, family office, MM2H
3. Asset Management & Real Estate: Singapore insurance, VCC funds, family trusts, property
4. Education Planning: Singapore school applications, student apartments
5. Brand Transformation & Corporate Visits
6. Government Grants & Tax Optimization

【Important Instructions】
- If "Reference Information" is provided after the user message, **prioritize** answering based on that reference.
- Do not fabricate numbers, policy details, or fees not found in the reference.
- If the reference is insufficient, you may supplement with general knowledge but note "please confirm with a consultant".
- If no relevant information exists, politely suggest booking a professional consultation.

Answer in a friendly, professional manner. Keep responses concise, under 100 words.`

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
            const _modelName = config['AI_MODEL_NAME'] || 'gpt-4o-mini'
            const baseUrl = config['AI_BASE_URL']

            if (!apiKey) {
                logger.warn('AI API Key not configured')
                throw new BadRequestError('AI 服务未配置')
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

            // 构建参考信息（从低分 FAQ 匹配结果中提取）
            let referenceContext = ''
            if (matchedFaqs.length > 0) {
                const relevantFaqs = matchedFaqs.slice(0, 3) // 取前3个相关 FAQ
                const faqTexts = relevantFaqs.map((faq, idx) => {
                    const q = locale === 'en' && faq.questionEn ? faq.questionEn : faq.question
                    const a = locale === 'en' && faq.answerEn ? faq.answerEn : faq.answer
                    return `${idx + 1}. 问：${q}\n   答：${a}`
                }).join('\n\n')
                referenceContext = locale === 'en'
                    ? `\n\n【Reference Information from Knowledge Base】\n${faqTexts}`
                    : `\n\n【参考信息（来自知识库）】\n${faqTexts}`
            }

            // 将参考信息附加到用户最后一条消息
            const historyMessages = history.slice(0, -1).map(msg => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.content
            }))
            const lastUserMessage = input.message + referenceContext

            const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
                { role: 'system', content: locale === 'en' ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT },
                ...historyMessages,
                { role: 'user', content: lastUserMessage }
            ]

            const modelName = _modelName // 使用配置中的模型名称
            const completion = await openai.chat.completions.create({
                model: modelName,
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
            logger.error('OpenAI API error:', error)

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
    },

    // ==================== 客户门户聊天方法 ====================

    async getCustomerRooms(userId: string) {
        const customer = await prisma.customer.findFirst({
            where: { userId },
        })

        if (!customer) return []

        return prisma.chatSession.findMany({
            where: {
                visitorId: userId,
                source: 'portal',
                status: { in: ['active', 'closed'] },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        })
    },

    async getRoomMessages(roomId: string, page: number = 1, limit: number = 30, userId?: string) {
        // 安全：验证用户是否有权访问该聊天房间
        if (userId) {
            const session = await prisma.chatSession.findUnique({
                where: { id: roomId },
            })
            if (!session || (session.visitorId !== userId && session.source === 'portal')) {
                throw new BadRequestError('无权访问此聊天房间')
            }
        }

        const skip = (page - 1) * limit
        const [messages, total] = await Promise.all([
            prisma.chatMessage.findMany({
                where: { sessionId: roomId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.chatMessage.count({
                where: { sessionId: roomId },
            }),
        ])

        return {
            messages: messages.reverse(),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }
    },

    async sendPortalMessage(roomId: string, senderId: string, content: string) {
        const session = await prisma.chatSession.findUnique({
            where: { id: roomId },
        })

        if (!session) {
            throw new BadRequestError('聊天房间不存在')
        }

        // 安全：验证发送者是否为该聊天房间的所有者
        if (session.source === 'portal' && session.visitorId !== senderId) {
            throw new BadRequestError('无权在此聊天房间发送消息')
        }

        return prisma.chatMessage.create({
            data: {
                sessionId: roomId,
                content,
                role: 'user',
            },
        })
    },
}
